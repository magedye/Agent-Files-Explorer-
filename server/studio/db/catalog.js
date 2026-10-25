import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync, constants } from 'node:sqlite';
import { repository, engineRoot, sourceHash } from '../aghr/cli-bridge.js';

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const sqlPath = path.join(repository, 'docs/contracts/aghr-rc3/sqlite/001_initial.sql');
const migrationHash = 'd5ab6a5fa8dc3be95927d3f9871ed393a3d7f7206e102dae6f2721492dde2159';
const j = value => value === undefined ? null : JSON.stringify(value);
const trust = { status: 'UNKNOWN', evidence: [], reason: 'Pinned source digest is not authenticated publisher identity.' };

export function createCatalog() {
  const sql = fs.readFileSync(sqlPath);
  if (sha(sql) !== migrationHash) throw Error('MIGRATION_CHECKSUM_MISMATCH');
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON; PRAGMA temp_store=MEMORY; BEGIN IMMEDIATE;');
  try { db.exec(sql.toString('utf8')); db.exec('PRAGMA user_version=1; COMMIT;'); }
  catch (error) { db.exec('ROLLBACK;'); db.close(); throw error; }
  db.setAuthorizer((action,arg,value)=>{
    if([constants.SQLITE_ATTACH,constants.SQLITE_DETACH].includes(action))return constants.SQLITE_DENY;
    if(action===constants.SQLITE_PRAGMA&&value!==null)return constants.SQLITE_DENY;
    return constants.SQLITE_OK;
  });
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
  if (tables.length !== 12) throw Error('MIGRATION_TABLE_COUNT');
  let views = [], capabilities = [], workspace, readSetHash, validationStatus;
  const originals = new Map();
  const workspaceId = 'rc3-local';
  return {
    db, tables, migrationHash,
    async scan(bridge, now = new Date()) {
      const run = await bridge.run('validate');
      const report = run.report, catalog = report.data.catalog;
      if (!catalog || !Array.isArray(catalog.items) || !Array.isArray(catalog.sources)) throw Error('CATALOG_UNAVAILABLE');
      // Only engine outputs determine validity. No policy implementation in Node.
      const status = report.result === 'VALID' ? 'VALID' : report.result === 'INVALID' ? 'INVALID' : 'NOT_RUN';
      const timestamp = now.toISOString();
      const sources = new Map(catalog.sources.map(s=>[s.path,s]));
      const nextOriginals = new Map();
      for (const s of sources.values()) {
        const raw = Buffer.from(s.raw_base64, 'base64');
        if (sha(raw) !== s.sha256 || !s.complete) throw Error('SOURCE_SNAPSHOT_MISMATCH');
        nextOriginals.set(s.path, {raw, hash:s.sha256});
      }
      const nextViews = catalog.items.map(record=>{
        const item=record.value, s=sources.get(record.location.path);
        if(!s) throw Error('ITEM_SOURCE_MISSING');
        const diagnostics=(report.data.validation?.findings||[]).filter(f=>!f.item_id||f.item_id===item.id).map(f=>({code:f.code,message:f.message,severity:'error',path:f.path,...(f.item_id?{item_id:f.item_id}:{})}));
        if(status==='INVALID'&&!diagnostics.length)diagnostics.push({code:'PACKAGE_INVALID',message:'Strict package validation rejected this snapshot.',severity:'error'});
        return {item:status==='INVALID'?null:item,source_path:s.path,source_hash:'sha256:'+s.sha256,source_yaml:s.text,validation_status:status,diagnostics,translation_unavailable:true,is_review_due:item.authority?.status==='active'&&item.nextReview?item.nextReview<timestamp.slice(0,10):null,priority_tier:null,issuer_trust:trust};
      });
      const manifest=catalog.manifest.value;
      const nextWorkspace={id:workspaceId,name:manifest.name,package_path:engineRoot,package_version:manifest.version,schema_version:manifest.schemaVersion,read_only:true,package_signature_verified:false,signature_identity:null,signature_verified_at:null,created_at:workspace?.created_at||timestamp,last_scanned_at:timestamp,scan_duration_ms:Math.max(0,Date.parse(run.finishedAt)-Date.parse(run.startedAt))};
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('DELETE FROM instruction_items_cache WHERE workspace_id=?').run(workspaceId);
        db.prepare('DELETE FROM capability_items_cache WHERE workspace_id=?').run(workspaceId);
        db.prepare('INSERT OR REPLACE INTO workspaces (id,name,package_path,package_version,schema_version,read_only,created_at,last_scanned_at,scan_duration_ms) VALUES (?,?,?,?,?,1,?,?,?)').run(workspaceId,manifest.name,engineRoot,manifest.version,manifest.schemaVersion,nextWorkspace.created_at,timestamp,nextWorkspace.scan_duration_ms);
        const columns=['workspace_id','item_id','title','kind','force','severity','priority_tier','authority_level','authority_source','authority_owner','authority_approved_by','authority_status','review_cadence','next_review','is_review_due','scope_paths_json','scope_exclude_json','scope_agents_json','scope_environments_json','scope_stages_json','scope_task_types_json','scope_language_json','scope_skill_ids_json','impact_band','impact_evidence','rule_text','source_yaml','source_path','source_hash','indexed_at'];
        const insert=db.prepare(`INSERT INTO instruction_items_cache (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`);
        const nextCapabilities=[];
        for(let n=0;n<nextViews.length;n++) {
          const v=nextViews[n], item=catalog.items[n].value, a=item.authority||{}, scope=item.scope||{};
          // SQL contract requires non-null TEXT. Literal JSON null is an explicit
          // storage-only absence marker; API remains null, never a guessed tier.
          insert.run(workspaceId,item.id,item.title??null,item.kind,item.force,item.severity,'null',a.level??null,a.source??null,a.owner??null,a.approvedBy??null,a.status??null,item.reviewCadence??null,item.nextReview??null,v.is_review_due===null?null:Number(v.is_review_due),j(scope.paths),j(scope.exclude),j(scope.appliesToAgents),j(scope.environments),j(scope.stages),j(scope.taskTypes),j(scope.language),j(scope.skillIds),item.impact?.band??null,item.impact?.evidence??null,item.rule??null,v.source_yaml,v.source_path,v.source_hash,timestamp);
          if(item.kind==='CAPABILITY' && item.skillId) {
            const fields=['skillId','source','function','permissions','inputs','outputs','instructionsPath','defaultTier','requiredApprovals','conflictsWith','alternatives','minimumStatus','requiredOnHosts','maxAgeDays'];
            const c={item_id:item.id,capability:Object.fromEntries(fields.filter(k=>item[k]!==undefined).map(k=>[k,item[k]])),availability:[{state:'UNKNOWN',evidence:[],reason:'Host discovery NOT_RUN'}],qualifications:[],source_path:v.source_path,content_hash:v.source_hash,issuer_trust:trust};
            nextCapabilities.push(c);
            db.prepare('INSERT INTO capability_items_cache (workspace_id,item_id,skill_id,source,function,content_hash,source_path,indexed_at) VALUES (?,?,?,?,?,?,?,?)').run(workspaceId,item.id,item.skillId,item.source,item.function,v.source_hash,v.source_path,timestamp);
          }
        }
        db.exec('COMMIT');
        capabilities=nextCapabilities;
      } catch(error) {db.exec('ROLLBACK'); throw error;}
      originals.clear(); for(const [key,value] of nextOriginals)originals.set(key,value);
      views=nextViews;workspace=nextWorkspace;readSetHash=catalog.read_set_hash;validationStatus=report.result;
      return run;
    },
    snapshot(){return {workspace,views,capabilities,readSetHash,validationStatus,sourceHash};},
    original(name){const v=originals.get(name);return v?{...v,raw:Buffer.from(v.raw)}:null;},
    list({q='',kind,force,authority_level,status,impact_evidence,is_review_due,priority}={}) {
      const indexed=new Set(db.prepare('SELECT source_path,source_hash FROM instruction_items_cache WHERE workspace_id=?').all(workspaceId).map(r=>r.source_path+'|'+r.source_hash));
      return views.filter(v=>{const i=v.item;return indexed.has(v.source_path+'|'+v.source_hash)&&(!q||(i?.id+' '+i?.title+' '+v.source_yaml).toLowerCase().includes(q.toLowerCase()))&&(!kind||i?.kind===kind)&&(!force||i?.force===force)&&(!authority_level||i?.authority?.level===authority_level)&&(!status||i?.authority?.status===status)&&(!impact_evidence||i?.impact?.evidence===impact_evidence)&&(is_review_due===undefined||v.is_review_due===(is_review_due==='true'))&&(!priority||v.priority_tier===priority);});
    },
    close(){db.close();},
  };
}
