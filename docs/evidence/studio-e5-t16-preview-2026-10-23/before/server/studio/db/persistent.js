// Explicit operator mode only; the existing runtime still uses createCatalog():memory:.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {DatabaseSync,constants} from 'node:sqlite';
import {repository} from '../aghr/cli-bridge.js';
import {consumeAuthorization,authorizationDetails} from '../write-authorization.js';
import {StudioError} from '../auth.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const migrationHash='d5ab6a5fa8dc3be95927d3f9871ed393a3d7f7206e102dae6f2721492dde2159';
const sqlPath=path.join(repository,'docs/contracts/aghr-rc3/sqlite/001_initial.sql');
const schemaRows=db=>db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all();
const schemaHash=db=>sha(JSON.stringify(schemaRows(db)));
function contractSQL(){const bytes=fs.readFileSync(sqlPath);if(sha(bytes)!==migrationHash)throw Error('MIGRATION_CHECKSUM_MISMATCH');return bytes.toString('utf8');}
export function migrateDatabase(db){
 const sql=contractSQL(),version=db.prepare('PRAGMA user_version').get().user_version;
 if(version===0){
  if(schemaRows(db).length)throw Error('UNRECOGNIZED_EXISTING_SCHEMA');
  db.exec('BEGIN IMMEDIATE');
  try{db.exec(sql);db.exec('PRAGMA user_version=1; COMMIT;');}catch(e){db.exec('ROLLBACK');throw e;}
 }else if(version!==1)throw Error('UNSUPPORTED_DATABASE_VERSION');
 const expected=new DatabaseSync(':memory:');
 let fingerprint;try{expected.exec(sql);fingerprint=schemaHash(expected);}finally{expected.close();}
 if(schemaHash(db)!==fingerprint)throw Error('DATABASE_SCHEMA_DRIFT');
 const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
 if(tables.length!==12)throw Error('DATABASE_TABLE_COUNT');
 return {version:1,migrationHash,schemaFingerprint:fingerprint,tables};
}
export function storageScope({workspaceId,targetProject,storageRoot,fileName='studio.sqlite'}){
 if(typeof storageRoot!=='string'||!path.isAbsolute(storageRoot)||!/^[-a-zA-Z0-9_]+\.sqlite$/.test(fileName))throw Error('STORAGE_PATH_INVALID');
 const root=path.resolve(storageRoot);let current=path.parse(root).root;
 for(const bit of path.relative(current,root).split(path.sep)){current=path.join(current,bit);if(fs.lstatSync(current).isSymbolicLink())throw Error('STORAGE_REPARSE_POINT');}
 if(!fs.statSync(root).isDirectory()||/(^|[\\/])(governance_packages|\.git|\.ssh|runtime_evidence)([\\/]|$)/i.test(root))throw Error('STORAGE_ROOT_PROTECTED');
 return {workspace_id:workspaceId,target_project:targetProject,action:'storage.initialize',resource_id:path.join(root,fileName),proposal_version_hash:'sha256:'+migrationHash};
}
export function openPersistentStore(config,authorization){
 contractSQL(); // Fail a bad migration pin before opening or creating a disk file.
 const scope=storageScope(config),details=consumeAuthorization(authorization,scope),file=scope.resource_id;
 const st=fs.lstatSync(file,{throwIfNoEntry:false});if(st&&(st.isSymbolicLink()||!st.isFile()||st.nlink!==1))throw Error('STORAGE_FILE_UNSAFE');
 const db=new DatabaseSync(file);let info;
 try{db.exec('PRAGMA foreign_keys=ON; PRAGMA temp_store=MEMORY;');info=migrateDatabase(db);}catch(e){db.close();throw e;}
 db.setAuthorizer((action,table,value)=>{
  if([constants.SQLITE_ATTACH,constants.SQLITE_DETACH,constants.SQLITE_CREATE_TABLE,constants.SQLITE_DROP_TABLE,constants.SQLITE_ALTER_TABLE].includes(action))return constants.SQLITE_DENY;
  if(action===constants.SQLITE_PRAGMA&&value!==null)return constants.SQLITE_DENY;
  if(table==='audit_events'&&[constants.SQLITE_UPDATE,constants.SQLITE_DELETE].includes(action))return constants.SQLITE_DENY;
  return constants.SQLITE_OK;
 });
 const append=(actor,event)=>{
  if(actor.workspace_id!==scope.workspace_id||actor.target_project!==scope.target_project||typeof event.event_type!=='string'||event.event_type!==actor.action)throw Error('AUDIT_SCOPE_MISMATCH');
  const payload=JSON.stringify(event.payload??null);if(Buffer.byteLength(payload)>65536)throw Error('AUDIT_PAYLOAD_LIMIT');
  return db.prepare('INSERT INTO audit_events (at,actor,actor_role,simulated_role,event_type,workspace_id,resource_type,resource_id,payload_json) VALUES (?,?,?,NULL,?,?,?,?,?)').run(new Date().toISOString(),actor.authenticated_actor,actor.server_resolved_role,event.event_type,actor.workspace_id,event.resource_type??null,actor.resource_id,payload);
 };
 try{append(details,{event_type:'storage.initialize',resource_type:'storage',payload:{migrationHash,version:info.version}});}catch(e){db.close();throw e;}
 const loggedReceipts=new WeakSet([authorization]);
 const transaction=run=>{db.exec('BEGIN IMMEDIATE');try{const value=run();db.exec('COMMIT');return value;}catch(error){db.exec('ROLLBACK');throw error;}};
 const cpView=row=>{
  if(!row)return null;
  const origin=db.prepare("SELECT payload_json FROM audit_events WHERE event_type='cp.create' AND resource_id=? AND json_extract(payload_json,'$.result')='SUCCESS' ORDER BY id LIMIT 1").get(row.id);
  const frozen=origin?JSON.parse(origin.payload_json):null;
  if(!frozen?.base_candidate_hash)throw Error('CP_PROVENANCE_UNAVAILABLE');
  const notRun={status:'NOT_RUN',evidence:[],reason:'Draft only; complete strict validation and downstream checks have not run.'};
  return {id:row.id,workspace_id:row.workspace_id,title:row.title,kind:row.kind,target_item_id:row.target_item_id,status:row.status,
   source:frozen.source,base_package_version:row.base_package_version,base_candidate_hash:frozen.base_candidate_hash,
   proposed_yaml:row.proposed_yaml,proposal_version_hash:row.proposal_version_hash,
   checks:Object.fromEntries(['validate','lint','skill_states','generate','doctor','eval'].map(k=>[k,{...notRun}])),
   generation:null,ci_comparison:null,required_approvals:['governance-owner'],approvals:[],approval_history:[],
   blockers:[{code:'DRAFT_NOT_QUALIFIED',message:'Draft saved; native strict validation and downstream lifecycle are not implemented by this slice.',severity:'warning'}],
   created_by:row.created_by,created_at:row.created_at,updated_at:row.updated_at};
 };
 return Object.freeze({
  ...info,file,
  // The receipt proves the real grant was consumed at its mutation boundary.
  appendAudit(receipt,event){if(loggedReceipts.has(receipt))throw Error('AUDIT_RECEIPT_REPLAY');const result=append(authorizationDetails(receipt),event);loggedReceipts.add(receipt);return result;},
  auditEvents(limit=200){if(!Number.isSafeInteger(limit)||limit<1||limit>1000)throw Error('AUDIT_LIMIT_INVALID');return db.prepare('SELECT * FROM (SELECT * FROM audit_events ORDER BY id DESC LIMIT ?) ORDER BY id').all(limit);},
  recordAttempt({actor,role,action,resourceId=null,result,status,reason,requestId}){
   // Internal server channel only. No HTTP body is ever mapped to this identity.
   if(typeof actor!=='string'||!['ATTEMPT','DENY','ERROR','GRANT_ISSUED'].includes(result))throw Error('AUDIT_INPUT_INVALID');
   return db.prepare('INSERT INTO audit_events (at,actor,actor_role,simulated_role,event_type,workspace_id,resource_type,resource_id,payload_json) VALUES (?,?,?,NULL,?,?,?,?,?)')
    .run(new Date().toISOString(),actor,role,action,scope.workspace_id,'draft',resourceId,JSON.stringify({result,status,reason,request_id:requestId}));
  },
  registerWorkspace(receipt,workspace){
   const expected={...scope,action:'draft.workspace.initialize',resource_id:workspace.id,proposal_version_hash:'sha256:'+sha(JSON.stringify(workspace))};
   const actor=consumeAuthorization(receipt,expected);
   return transaction(()=>{
    const prior=db.prepare('SELECT * FROM workspaces WHERE id=?').get(workspace.id);
    if(prior&&(prior.package_path!==workspace.package_path||prior.package_version!==workspace.package_version))throw Error('WORKSPACE_BINDING_CHANGED');
    if(!prior)db.prepare('INSERT INTO workspaces(id,name,package_path,package_version,schema_version,read_only,created_at) VALUES(?,?,?,?,?,1,?)')
     .run(workspace.id,workspace.name,workspace.package_path,workspace.package_version,workspace.schema_version,new Date().toISOString());
    append(actor,{event_type:expected.action,resource_type:'workspace',payload:{result:'SUCCESS',read_only:true}});
   });
  },
  createDraft(receipt,prepared){
   const expected={...scope,action:'cp.create',resource_id:prepared.id,proposal_version_hash:prepared.proposal_version_hash};
   const actor=consumeAuthorization(receipt,expected),at=new Date().toISOString();
   return transaction(()=>{
    if(db.prepare('SELECT id FROM change_packages WHERE id=?').get(prepared.id))throw new StudioError(409,'CONFLICT','Draft already exists.');
    db.prepare(`INSERT INTO change_packages(id,workspace_id,title,kind,target_item_id,status,status_updated_at,source_type,source_ref,source_hash,base_package_version,base_item_ids_json,proposed_yaml,proposal_version_hash,required_approvals_json,created_by,created_at,updated_at)
     VALUES(?,?,?,?,?,'draft',?,?,?,?,?,?,?,?,?,?,?,?)`).run(prepared.id,scope.workspace_id,prepared.title,prepared.kind,prepared.target_item_id,at,prepared.source?.type??null,prepared.source?.ref??null,prepared.source?.hash??null,prepared.base_package_version,JSON.stringify(prepared.target_item_id?[prepared.target_item_id]:[]),prepared.proposed_yaml,prepared.proposal_version_hash,JSON.stringify({'governance-owner':false}),actor.authenticated_actor,at,at);
    append(actor,{event_type:'cp.create',resource_type:'package',payload:{result:'SUCCESS',base_candidate_hash:prepared.base_candidate_hash,source:prepared.source,structural_check:'PASS',strict_check:'NOT_RUN',request_id:prepared.request_id}});
    return cpView(db.prepare('SELECT * FROM change_packages WHERE id=?').get(prepared.id));
   });
  },
  drafts(){return db.prepare('SELECT * FROM change_packages WHERE workspace_id=? ORDER BY created_at DESC,id LIMIT 100').all(scope.workspace_id).map(cpView);},
  draft(id){return cpView(db.prepare('SELECT * FROM change_packages WHERE workspace_id=? AND id=?').get(scope.workspace_id,id));},
  close(){db.close();},
 });
}
