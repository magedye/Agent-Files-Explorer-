// Explicit operator mode only; the existing runtime still uses createCatalog():memory:.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {DatabaseSync,constants} from 'node:sqlite';
import {repository} from '../aghr/cli-bridge.js';
import {consumeAuthorization,authorizationDetails} from '../write-authorization.js';
import {StudioError} from '../auth.js';
import {createArtifactStore} from '../artifact-store.js';
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
 const artifacts=createArtifactStore(path.dirname(file));
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
 const phase4Pending=new WeakSet();
 const transaction=run=>{db.exec('BEGIN IMMEDIATE');try{const value=run();db.exec('COMMIT');return value;}catch(error){db.exec('ROLLBACK');throw error;}};
 const cpView=row=>{
  if(!row)return null;
  const origin=db.prepare("SELECT payload_json FROM audit_events WHERE event_type IN ('cp.create','meta.change.propose') AND resource_id=? AND json_extract(payload_json,'$.result')='SUCCESS' AND json_extract(payload_json,'$.base_candidate_hash') IS NOT NULL ORDER BY id LIMIT 1").get(row.id);
  const frozen=origin?JSON.parse(origin.payload_json):null;
  if(!frozen?.base_candidate_hash)throw Error('CP_PROVENANCE_UNAVAILABLE');
  const notRun={status:'NOT_RUN',evidence:[],reason:'Required check has not run for this proposal version.'};
  const columns={validate:'validation_result_json',lint:'lint_result_json',skill_states:'skill_state_result_json',generate:'generation_result_json',doctor:'doctor_result_json'};
  const generated=row.generation_result_json?JSON.parse(row.generation_result_json):null;
  const checks=Object.fromEntries(['validate','lint','skill_states','generate','doctor','eval'].map(k=>[k,k==='generate'&&generated?generated.check:columns[k]&&row[columns[k]]?JSON.parse(row[columns[k]]):{...notRun}]));
  const approvals=db.prepare('SELECT * FROM change_package_approvals WHERE package_id=? ORDER BY id').all(row.id);
  const history=db.prepare('SELECT * FROM change_package_approval_history WHERE package_id=? ORDER BY id').all(row.id).map(({invalidated_at,invalidation_reason,...a})=>({decision:a,invalidated_at,invalidation_reason}));
  return {id:row.id,workspace_id:row.workspace_id,title:row.title,kind:row.kind,target_item_id:row.target_item_id,status:row.status,
   source:frozen.source,base_package_version:row.base_package_version,base_candidate_hash:frozen.base_candidate_hash,
   proposed_yaml:row.proposed_yaml,proposal_version_hash:row.proposal_version_hash,
   ...(JSON.parse(row.impact_summary_json||'null')?.phase4?{phase4:JSON.parse(row.impact_summary_json).phase4}:{}),
   checks,generation:generated?.generation??null,ci_comparison:null,required_approvals:Array.isArray(JSON.parse(row.required_approvals_json||'null'))?JSON.parse(row.required_approvals_json):['governance-owner'],approvals,approval_history:history,
   blockers:Object.entries(checks).filter(([k,c])=>['validate','lint','generate','doctor'].includes(k)&&c.status!=='PASS').map(([k,c])=>({code:'CHECK_'+k.toUpperCase(),message:c.reason||k+' has not passed.',severity:'warning'})),
   ...(row.preview_diff!==null?{preview:{proposal_version_hash:row.proposal_version_hash,diff:row.preview_diff,files:JSON.parse(row.preview_files_json),source_written:false,state_written:false}}:{}),
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
  registrations(){return {workspaces:db.prepare('SELECT * FROM workspaces ORDER BY id').all(),projects:db.prepare('SELECT * FROM target_projects ORDER BY id').all()};},
  closedPublishedPackages(){return db.prepare("SELECT resource_id,payload_json FROM audit_events WHERE event_type='cp.close' AND json_extract(payload_json,'$.result')='SUCCESS' ORDER BY id").all().map(r=>({id:r.resource_id,...JSON.parse(r.payload_json)}));},
  closePublishedPackage(receipt,bound,proof){
   const actor=consumeAuthorization(receipt,bound);
   if(bound.workspace_id!==scope.workspace_id||bound.target_project!==scope.target_project||bound.action!=='cp.close'||proof.proposal_version_hash!==bound.proposal_version_hash||proof.id!==bound.resource_id)throw new StudioError(403,'FORBIDDEN','Exact merged CP closure grant required.');
   if(db.prepare("SELECT id FROM audit_events WHERE event_type='cp.close' AND resource_id=? AND json_extract(payload_json,'$.result')='SUCCESS'").get(proof.id))throw new StudioError(409,'CONFLICT','Published CP is already closed.');
   return transaction(()=>{append(actor,{event_type:'cp.close',resource_type:'package',payload:{result:'SUCCESS',...proof,source_written:false,state_written:false,closure_only:true}});return proof;});
  },
  registrationCommit(receipt,bound,operation,value){
   const actor=consumeAuthorization(receipt,bound);
   if(bound.workspace_id!==scope.workspace_id||bound.target_project!==scope.target_project||bound.action!=='registration.'+operation||!actor.installation_owner_verified)throw new StudioError(403,'FORBIDDEN','Installation owner registration grant required.');
   return transaction(()=>{
    const at=new Date().toISOString();let result;
    if(operation==='workspace.add'){
     if(db.prepare('SELECT id FROM workspaces WHERE package_path=?').get(value.package_path))throw new StudioError(409,'CONFLICT','Package is already registered.');
     db.prepare('INSERT INTO workspaces(id,name,package_path,package_version,schema_version,read_only,created_at,last_scanned_at) VALUES(?,?,?,?,?,1,?,?)').run(value.id,value.name,value.package_path,value.package_version,value.schema_version,at,at);result={...value,created_at:at,last_scanned_at:at};
    }else if(operation==='workspace.remove'){
     if(value.id===scope.workspace_id)throw new StudioError(409,'CONFLICT','The active Draft workspace cannot be removed.');
     if(!db.prepare('SELECT id FROM workspaces WHERE id=?').get(value.id))throw new StudioError(404,'UNKNOWN_ID','Unknown registration.');
     db.prepare('DELETE FROM target_projects WHERE workspace_id=?').run(value.id);db.prepare('DELETE FROM workspaces WHERE id=?').run(value.id);result={id:value.id,registration_removed:true,source_deleted:false};
    }else if(operation==='project.add'){
     if(!db.prepare('SELECT id FROM workspaces WHERE id=?').get(value.workspace_id))throw new StudioError(404,'UNKNOWN_ID','Unknown workspace registration.');
     if(db.prepare('SELECT id FROM target_projects WHERE workspace_id=? AND path=?').get(value.workspace_id,value.path))throw new StudioError(409,'CONFLICT','Project is already registered.');
     db.prepare('INSERT INTO target_projects(id,workspace_id,name,path,instruction_level,skill_level,host,host_version,git_commit_sha,config_state_json,last_scanned_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(value.id,value.workspace_id,value.name,value.path,value.instruction_level,value.skill_level,value.host,value.host_version,value.git_commit_sha??null,JSON.stringify(value.state??null),at);const {state,...project}=value;result={...project,last_scanned_at:at};
    }else if(operation==='project.remove'){
     if(!db.prepare('SELECT id FROM target_projects WHERE id=? AND workspace_id=?').get(value.id,value.workspace_id))throw new StudioError(404,'UNKNOWN_ID','Unknown project registration.');
     db.prepare('DELETE FROM target_projects WHERE id=? AND workspace_id=?').run(value.id,value.workspace_id);result={id:value.id,registration_removed:true,source_deleted:false};
    }else if(operation==='workspace.scan'||operation==='project.scan'){
     if(operation==='workspace.scan')db.prepare('UPDATE workspaces SET last_scanned_at=?,scan_duration_ms=? WHERE id=?').run(value.scanned_at,value.duration_ms,value.workspace_id);
     else db.prepare('UPDATE target_projects SET last_scanned_at=? WHERE id=? AND workspace_id=?').run(value.scanned_at,bound.resource_id,value.workspace_id);
     result=value;
    }else throw new StudioError(400,'INVALID_REQUEST','Unknown registration operation.');
    append(actor,{event_type:bound.action,resource_type:'registration',payload:{result:'SUCCESS',operation,source_written:false,registration:result}});return result;
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
  editDraft(receipt,id,previousHash,prepared){
   const actor=consumeAuthorization(receipt,{...scope,action:'cp.edit_any',resource_id:id,proposal_version_hash:prepared.proposal_version_hash});
   return transaction(()=>{
    const row=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id);
    if(!row||row.proposal_version_hash!==previousHash)throw new StudioError(412,'STALE_PROPOSAL','Proposal changed.');
    if(['exported','closed'].includes(row.status))throw new StudioError(409,'CONFLICT','Finalized proposal cannot be edited.');
    const at=new Date().toISOString(),changed=previousHash!==prepared.proposal_version_hash;
    if(changed){
     db.prepare(`INSERT INTO change_package_approval_history(id,package_id,role,approver,decision,approved_version_hash,reason,at,invalidated_at,invalidation_reason)
      SELECT id,package_id,role,approver,decision,approved_version_hash,reason,at,?,'proposal_changed' FROM change_package_approvals WHERE package_id=?`).run(at,id);
     db.prepare('DELETE FROM change_package_approvals WHERE package_id=?').run(id);
     db.prepare(`UPDATE change_packages SET proposed_yaml=?,proposal_version_hash=?,status='draft',status_updated_at=?,updated_at=?,validation_result_json=NULL,lint_result_json=NULL,skill_state_result_json=NULL,generation_result_json=NULL,doctor_result_json=NULL,preview_diff=NULL,preview_files_json=NULL,impact_summary_json=NULL,required_approvals_json=NULL WHERE id=?`)
      .run(prepared.proposed_yaml,prepared.proposal_version_hash,at,at,id);
    }
    append(actor,{event_type:'cp.edit_any',resource_type:'package',payload:{result:'SUCCESS',before_hash:previousHash,after_hash:prepared.proposal_version_hash,invalidated:changed}});
    return cpView(db.prepare('SELECT * FROM change_packages WHERE id=?').get(id));
   });
  },
  checkDraft(receipt,id,expectedHash,report){
   const actor=consumeAuthorization(receipt,{...scope,action:'cp.validate',resource_id:id,proposal_version_hash:expectedHash});
   if(report.proposal_version_hash!==expectedHash||!['VALID','INVALID','BLOCKED'].includes(report.result)||report.exit_code!=={VALID:0,INVALID:1,BLOCKED:3}[report.result])throw Error('DRAFT_CHECK_BINDING');
   return transaction(()=>{
    const row=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id);
    if(!row||row.proposal_version_hash!==expectedHash)throw new StudioError(412,'STALE_PROPOSAL','Proposal changed during validation.');
    if(['approved','exported','closed'].includes(row.status))throw new StudioError(409,'CONFLICT','Current status prevents revalidation.');
    const at=new Date().toISOString(),runId='VR-'+crypto.randomUUID(),raw=JSON.stringify(report),pass=report.result==='VALID'&&report.lint?.result==='VALID';
    const evidence=[{path:`sqlite:verification_runs/${runId}`,content_hash:'sha256:'+sha(raw),bytes:Buffer.byteLength(raw)}];
    const check={status:pass?'PASS':'FAIL',at,run_id:runId,evidence,...(pass?{}:{reason:report.result+': '+report.findings.map(f=>f.code).join(', ')})};
    db.prepare(`INSERT INTO verification_runs(id,workspace_id,command,status,exit_code,started_at,finished_at,raw_stdout,raw_stderr,raw_output,linked_package_id) VALUES(?,?,'validate',?,?,?,?,?,'',?,?)`)
     .run(runId,scope.workspace_id,pass?'passed':'failed',report.exit_code,at,at,raw,raw,id);
    const doctor=report.doctor?{...check,status:report.doctor.status==='PASS'?'PASS':'FAIL',...(report.doctor.status==='PASS'?{}:{reason:'Required host gate could not be established.'})}:null;
    db.prepare('UPDATE change_packages SET validation_result_json=?,lint_result_json=?,doctor_result_json=?,required_approvals_json=?,status=?,status_updated_at=?,updated_at=? WHERE id=?')
     .run(JSON.stringify(check),JSON.stringify(check),doctor?JSON.stringify(doctor):null,JSON.stringify(report.required_approvals||['governance-owner']),pass?'validated':'draft',at,at,id);
    append(actor,{event_type:'cp.validate',resource_type:'package',payload:{result:'SUCCESS',validation_result:report.result,run_id:runId,proposal_version_hash:expectedHash,report_hash:evidence[0].content_hash}});
    return cpView(db.prepare('SELECT * FROM change_packages WHERE id=?').get(id));
   });
  },
  submitDraft(receipt,id,expectedHash){
   const actor=consumeAuthorization(receipt,{...scope,action:'cp.submit',resource_id:id,proposal_version_hash:expectedHash});
   return transaction(()=>{
    const row=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id);
    if(!row||row.proposal_version_hash!==expectedHash)throw new StudioError(412,'STALE_PROPOSAL','Proposal changed.');
    if(row.status!=='validated'||JSON.parse(row.validation_result_json||'null')?.status!=='PASS'||JSON.parse(row.lint_result_json||'null')?.status!=='PASS')throw new StudioError(409,'VALIDATION_FAILED','Exact-version strict validation and lint must pass before review.');
    const at=new Date().toISOString();db.prepare("UPDATE change_packages SET status='in_review',status_updated_at=?,updated_at=? WHERE id=?").run(at,at,id);
    append(actor,{event_type:'cp.submit',resource_type:'package',payload:{result:'SUCCESS',proposal_version_hash:expectedHash,approval:'NOT_GRANTED'}});
    return cpView(db.prepare('SELECT * FROM change_packages WHERE id=?').get(id));
   });
  },
  previewDraft(receipt,id,expectedHash,generation,resourceReceipt=null){
   const actor=consumeAuthorization(receipt,{...scope,action:'cp.generate.preview',resource_id:id,proposal_version_hash:expectedHash});
   return transaction(()=>{
    const row=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id);
    if(!row||row.proposal_version_hash!==expectedHash)throw new StudioError(412,'STALE_PROPOSAL','Proposal changed during preview.');
    if(['approved','exported','closed'].includes(row.status))throw new StudioError(409,'CONFLICT','Approved/finalized evidence is immutable; edit the proposal first.');
    const at=new Date().toISOString();
    const raw=JSON.stringify({generation,resourceReceipt}),runId='VR-'+crypto.randomUUID();
    const passed=resourceReceipt&&generation.stage!=='fail'&&generation.p0_preserved&&generation.prin_007_present&&generation.byte_size<=generation.budget_bytes;
    const check={status:passed?'PASS':generation.stage==='fail'?'FAIL':'NOT_RUN',at,run_id:runId,evidence:passed?[{path:'sqlite:verification_runs/'+runId,content_hash:'sha256:'+sha(raw),bytes:Buffer.byteLength(raw)}]:[],...(!passed?{reason:'Generation failed or has no bounded execution receipt.'}:{})};
    db.prepare(`INSERT INTO verification_runs(id,workspace_id,command,status,exit_code,started_at,finished_at,raw_stdout,raw_stderr,raw_output,linked_package_id) VALUES(?,?,'generate',?,?,?,?,?,'',?,?)`).run(runId,scope.workspace_id,passed?'passed':'failed',passed?0:1,at,at,raw,raw,id);
    db.prepare('UPDATE change_packages SET generation_result_json=?,updated_at=? WHERE id=?').run(JSON.stringify({proposal_version_hash:expectedHash,generation,check}),at,id);
    append(actor,{event_type:'cp.generate.preview',resource_type:'package',payload:{result:'SUCCESS',proposal_version_hash:expectedHash,content_hash:generation.content_hash,stage:generation.stage,source_written:false,exported:false}});
    return generation;
   });
  },
  requirements(id){
   const row=db.prepare('SELECT proposal_version_hash,validation_result_json FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id);
   const check=row?.validation_result_json&&JSON.parse(row.validation_result_json),run=check&&db.prepare('SELECT raw_stdout FROM verification_runs WHERE id=? AND linked_package_id=?').get(check.run_id,id);
   const report=run&&JSON.parse(run.raw_stdout);
   return report?.proposal_version_hash===row?.proposal_version_hash?{eval_required:report.eval_required??true,skill_required:report.skill_required??true}:{eval_required:true,skill_required:true};
  },
  attestSource(cpId,expectedHash,actor,grant){
   const cp=cpView(db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(cpId,scope.workspace_id));
   if(!cp||cp.proposal_version_hash!==expectedHash)throw new StudioError(412,'STALE_PROPOSAL','Source changed.');
   append({...scope,action:'source.attest',resource_id:cpId,authenticated_actor:actor,server_resolved_role:'governance-owner'},{event_type:'source.attest',resource_type:'package',payload:{result:'SUCCESS',proposal_version_hash:expectedHash,grant,trust:'OS_LOCAL_PROJECT_ONLY; not enterprise/publisher identity'}});
  },
  sourceGrants(id,hash){
   return db.prepare("SELECT payload_json FROM audit_events WHERE event_type='source.attest' AND resource_id=? AND actor_role='governance-owner' ORDER BY id DESC LIMIT 100").all(id).map(r=>JSON.parse(r.payload_json)).filter(r=>r.result==='SUCCESS'&&r.proposal_version_hash===hash).slice(0,1).map(r=>r.grant);
  },
  approveDraft(receipt,id,expectedHash,decision,proof,snapshotHash,resourceReceipt){
   const action={'governance-owner':'cp.approve.governance','security-owner':'cp.approve.security','architecture-board':'cp.approve.architecture'}[decision.role];
   const actor=consumeAuthorization(receipt,{...scope,action,resource_id:id,proposal_version_hash:expectedHash});
   return transaction(()=>{
    const row=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id),cp=cpView(row);
    if(!row||row.proposal_version_hash!==expectedHash||sha(JSON.stringify(cp))!==snapshotHash)throw new StudioError(412,'STALE_PROPOSAL','Proposal/checks/reviews changed during approval.');
    if(actor.server_resolved_role!==decision.role||!proof.ready||!['in_review','approved','rejected'].includes(proof.next_status))throw new StudioError(403,'FORBIDDEN','Approval proof does not match the server actor.');
    if(db.prepare('SELECT id FROM change_package_approvals WHERE package_id=? AND role=? AND approver=? AND approved_version_hash=?').get(id,decision.role,actor.authenticated_actor,expectedHash))throw new StudioError(409,'CONFLICT','Decision already recorded.');
    const at=new Date().toISOString();db.prepare('INSERT INTO change_package_approvals(package_id,role,approver,decision,approved_version_hash,reason,at) VALUES(?,?,?,?,?,?,?)').run(id,decision.role,actor.authenticated_actor,decision.decision,expectedHash,decision.reason,at);
    const generated=row.generation_result_json?JSON.parse(row.generation_result_json):null;
    if(generated)for(const ack of proof.acknowledgements)generated.generation.acknowledgements.push({actor:actor.authenticated_actor,role:actor.server_resolved_role,stage:ack.stage,content_hash:generated.generation.content_hash,at,reason:ack.reason});
    db.prepare('UPDATE change_packages SET status=?,status_updated_at=?,updated_at=?,generation_result_json=? WHERE id=?').run(proof.next_status,at,at,generated?JSON.stringify(generated):null,id);
    append(actor,{event_type:action,resource_type:'package',payload:{result:'SUCCESS',proposal_version_hash:expectedHash,decision:decision.decision,next_status:proof.next_status,engine:resourceReceipt.engine_hash,input_hash:resourceReceipt.input_hash}});
    return cpView(db.prepare('SELECT * FROM change_packages WHERE id=?').get(id));
   });
  },
  savePreview(receipt,id,expectedHash,preview,resourceReceipt){
   const actor=consumeAuthorization(receipt,{...scope,action:'cp.preview',resource_id:id,proposal_version_hash:expectedHash});
   return transaction(()=>{
    const row=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id);
    if(!row||row.proposal_version_hash!==expectedHash)throw new StudioError(412,'STALE_PROPOSAL','Proposal changed during diff.');
    db.prepare('UPDATE change_packages SET preview_diff=?,preview_files_json=? WHERE id=?').run(preview.diff,JSON.stringify(preview.files),id);
    append(actor,{event_type:'cp.preview',resource_type:'package',payload:{result:'SUCCESS',proposal_version_hash:expectedHash,engine:resourceReceipt.engine_hash,diff_hash:'sha256:'+sha(preview.diff),source_written:false}});
    return preview;
   });
  },
  saveDoctor(receipt,id,expectedHash,run){
   const actor=consumeAuthorization(receipt,{...scope,action:'cp.doctor',resource_id:id,proposal_version_hash:expectedHash});
   return transaction(()=>{
    const row=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id);
    if(!row||row.proposal_version_hash!==expectedHash||run.data.proposal_version_hash!==expectedHash)throw new StudioError(412,'STALE_PROPOSAL','Doctor result is stale.');
    if(['approved','exported','closed'].includes(row.status))throw new StudioError(409,'CONFLICT','Approved evidence is immutable.');
    const at=new Date().toISOString(),raw=JSON.stringify(run),runId='VR-'+crypto.randomUUID(),passed=run.data.status==='PASS';
    const check={status:passed?'PASS':'FAIL',at,run_id:runId,evidence:[{path:'sqlite:verification_runs/'+runId,content_hash:'sha256:'+sha(raw),bytes:Buffer.byteLength(raw)}],...(!passed?{reason:'Required gate is unavailable, failed, or not observable.'}:{})};
    db.prepare(`INSERT INTO verification_runs(id,workspace_id,command,status,exit_code,started_at,finished_at,raw_stdout,raw_stderr,raw_output,linked_package_id) VALUES(?,?,'doctor',?,?,?,?,?,'',?,?)`).run(runId,scope.workspace_id,passed?'passed':'failed',passed?0:3,at,at,raw,raw,id);
    db.prepare('UPDATE change_packages SET doctor_result_json=?,updated_at=? WHERE id=?').run(JSON.stringify(check),at,id);
    append(actor,{event_type:'cp.doctor',resource_type:'package',payload:{result:'SUCCESS',proposal_version_hash:expectedHash,run_id:runId,status:run.data.status}});
    return cpView(db.prepare('SELECT * FROM change_packages WHERE id=?').get(id));
   });
  },
  exportDraft(receipt,id,expectedHash,preview,snapshotHash,resourceReceipt,draftOnly=false){
   const action=draftOnly?'cp.export.draft':'cp.export.patch';
   const actor=consumeAuthorization(receipt,{...scope,action,resource_id:id,proposal_version_hash:expectedHash});
   let created;
   try{return transaction(()=>{
    const row=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id),cp=cpView(row);
    if(!row||row.proposal_version_hash!==expectedHash||sha(JSON.stringify(cp))!==snapshotHash||preview.proposal_version_hash!==expectedHash)throw new StudioError(412,'STALE_PROPOSAL','Proposal/checks/reviews changed during export.');
    if(!draftOnly&&row.status!=='approved')throw new StudioError(409,'VALIDATION_FAILED','Approved exact-version package required.');
    const prefix=draftOnly?'# AGHR REVIEW-ONLY DRAFT; NOT APPROVED; REQUIRED E4/SOURCE/REVIEW GATES MAY BE NOT_RUN\n# Proposal '+expectedHash+'\n':'';
    created=artifacts.write({id,versionHash:expectedHash,patch:prefix+preview.diff,draftOnly});
    const at=new Date().toISOString();
    if(!draftOnly)db.prepare("UPDATE change_packages SET status='exported',status_updated_at=?,updated_at=?,export_format='patch',export_path=?,export_sha=?,exported_at=? WHERE id=?").run(at,at,created.artifact.path,created.artifact.content_hash,at,id);
    append(actor,{event_type:action,resource_type:'package',payload:{result:'SUCCESS',proposal_version_hash:expectedHash,artifact:created.artifact,draft_only:draftOnly,engine:resourceReceipt.engine_hash,source_written:false,state_written:false,publication:'NOT_PERFORMED'}});
    if(draftOnly)return {package_id:id,proposal_version_hash:expectedHash,artifact:created.artifact,approval:'NOT_GRANTED',draft_only:true,source_written:false,state_written:false,publication:'NOT_PERFORMED'};
    return {package_id:id,proposal_version_hash:expectedHash,format:'patch',artifact:created.artifact,commit_sha:null,signed:false,warnings:['Patch prepared only. No source apply, merge or release acceptance; CI/T24 still required.'],state_written:false,publication:'NOT_PERFORMED'};
   });}catch(error){created?.rollback();throw error;}
  },
  artifact(id,hash){
   const row=db.prepare("SELECT payload_json FROM audit_events WHERE event_type IN ('cp.export.patch','cp.export.draft') AND resource_id=? AND json_extract(payload_json,'$.result')='SUCCESS' AND json_extract(payload_json,'$.proposal_version_hash')=? ORDER BY id DESC LIMIT 1").get(id,hash);
   if(!row)throw new StudioError(404,'NOT_FOUND','No current patch artifact.');
   const event=JSON.parse(row.payload_json);return {bytes:artifacts.read(event.artifact),name:path.basename(event.artifact.path)};
  },
  beginVerification(receipt,run,grantScope){
   const actor=consumeAuthorization(receipt,{...scope,action:grantScope.action,resource_id:run.id,proposal_version_hash:run.inputs_hash});
   if(!/^verify\.run\./.test(actor.action)||run.workspace_id!==scope.workspace_id||run.status!=='running')throw Error('VERIFICATION_SCOPE_MISMATCH');
   transaction(()=>{
    db.prepare('INSERT INTO verification_runs(id,workspace_id,command,args_json,status,started_at,summary_json,raw_stdout,raw_stderr,raw_output,triggered_by,triggered_by_user) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
     .run(run.id,scope.workspace_id,run.command,JSON.stringify(run.args),run.status,run.started_at,JSON.stringify({studio_t20:run}),run.raw_stdout,run.raw_stderr,run.raw_output,'user',actor.authenticated_actor);
    append(actor,{event_type:actor.action,resource_type:'verification',payload:{result:'SUCCESS',inputs_hash:run.inputs_hash,run_id:run.id,status:'running'}});
   });
   let closed=false;
   // The capability is held only by the server queue; the client cannot update
   // a run, forge raw output, or turn it into a CP approval/eval projection.
   return (snapshot,receiptRaw=null)=>{
    if(closed||snapshot.id!==run.id||snapshot.inputs_hash!==run.inputs_hash||snapshot.workspace_id!==scope.workspace_id)throw Error('VERIFICATION_CUSTODY_MISMATCH');
    transaction(()=>{
     db.prepare('UPDATE verification_runs SET status=?,exit_code=?,finished_at=?,duration_ms=?,resource_peak_mb=?,summary_json=?,raw_stdout=?,raw_stderr=?,raw_output=? WHERE id=? AND workspace_id=?')
      .run(snapshot.status,snapshot.exit_code,snapshot.finished_at,snapshot.duration_ms,snapshot.resource_peak_mib,JSON.stringify({studio_t20:snapshot,receipt_raw:receiptRaw}),snapshot.raw_stdout,snapshot.raw_stderr,snapshot.raw_output,run.id,scope.workspace_id);
     if(snapshot.status!=='running')append(actor,{event_type:actor.action,resource_type:'verification',payload:{result:'SUCCESS',run_id:run.id,status:snapshot.status,exit_code:snapshot.exit_code,inputs_hash:snapshot.inputs_hash}});
    });
    if(snapshot.status!=='running')closed=true;
   };
  },
  beginSkillRun(receipt,run,bound){
   const actor=consumeAuthorization(receipt,{...scope,action:'verify.run.skills',resource_id:run.task_id,proposal_version_hash:run.inputs_hash});
   if(bound.resource_id!==run.task_id||bound.proposal_version_hash!==run.inputs_hash)throw Error('SKILL_SCOPE_MISMATCH');
   transaction(()=>{db.prepare('INSERT INTO verification_runs(id,workspace_id,command,args_json,status,started_at,triggered_by,triggered_by_user,summary_json) VALUES(?,?,?,?,?,?,?,?,?)').run(run.id,scope.workspace_id,run.command,JSON.stringify(run.request),'running',run.at,'user',actor.authenticated_actor,JSON.stringify({skill_operation:run.request.operation,task_id:run.task_id}));append(actor,{event_type:actor.action,resource_type:'skill-task',payload:{result:'SUCCESS',run_id:run.id,inputs_hash:run.inputs_hash,status:'running'}});});
   let finished=false;return value=>{if(finished)throw Error('SKILL_COMPLETION_REPLAY');transaction(()=>{db.prepare('UPDATE verification_runs SET status=?,exit_code=?,finished_at=?,duration_ms=?,raw_stdout=?,raw_output=?,summary_json=? WHERE id=? AND workspace_id=?').run(value.status,value.exit_code,value.finished_at,value.duration_ms,value.raw,value.raw,JSON.stringify({studio_skill:{run_id:run.id,task_id:run.task_id,operation:run.request.operation,status:value.status,view:value.view,source_hash:'sha256:'+sha(value.raw),trust:'HISTORICAL_ONLY; cannot restore live E4 proofs'}}),run.id,scope.workspace_id);append(actor,{event_type:actor.action,resource_type:'skill-task',payload:{result:'SUCCESS',run_id:run.id,status:value.status,inputs_hash:run.inputs_hash,source_hash:'sha256:'+sha(value.raw)}});});finished=true;};
  },
  skillRuns(){return db.prepare('SELECT summary_json FROM verification_runs WHERE workspace_id=? ORDER BY started_at DESC LIMIT 200').all(scope.workspace_id).map(r=>{try{return JSON.parse(r.summary_json||'{}').studio_skill;}catch{return null;}}).filter(Boolean);},
  phase4Begin(receipt,bound){const actor=consumeAuthorization(receipt,{...scope,action:bound.action,resource_id:bound.resource_id,proposal_version_hash:bound.proposal_version_hash});append(actor,{event_type:actor.action,resource_type:'phase4',payload:{result:'STARTED',inputs_hash:bound.proposal_version_hash}});phase4Pending.add(receipt);},
  phase4Complete(receipt,bound,{id,status,raw}){if(!phase4Pending.has(receipt))throw Error('PHASE4_COMPLETION_REPLAY');const actor=authorizationDetails(receipt);transaction(()=>{const at=new Date().toISOString();db.prepare('INSERT INTO verification_runs(id,workspace_id,command,status,exit_code,started_at,finished_at,raw_output) VALUES(?,?,?,?,?,?,?,?)').run(id,scope.workspace_id,bound.action==='verify.run.eval'?'eval':'check',status,status==='passed'?0:1,at,at,raw);append(actor,{event_type:actor.action,resource_type:'phase4',payload:{result:status,run_id:id,raw_hash:'sha256:'+sha(raw)}});});phase4Pending.delete(receipt);},
  phase4Commit(receipt,bound,{id,previousHash=null,prepared=null,status=null,review=null,raw=null}){
   if(!phase4Pending.has(receipt))throw Error('PHASE4_BEGIN_REQUIRED');const actor=authorizationDetails(receipt);
   if(actor.resource_id!==id||actor.proposal_version_hash!==bound.proposal_version_hash)throw Error('PHASE4_SCOPE_MISMATCH');
   return transaction(()=>{
    const prior=db.prepare('SELECT * FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id),at=new Date().toISOString();
    if(prior&&prior.proposal_version_hash!==previousHash||!prior&&previousHash)throw new StudioError(412,'STALE_PROPOSAL','Phase4 proposal changed.');
    if(prior&&!JSON.parse(prior.impact_summary_json||'null')?.phase4)throw new StudioError(409,'CONFLICT','Not a Phase4 change package.');
    if(prepared){
     const p=prepared.payload,m=JSON.stringify({phase4:prepared.phase4});
     if(!prior){
      db.prepare(`INSERT INTO change_packages(id,workspace_id,title,kind,target_item_id,status,status_updated_at,source_type,source_ref,source_hash,base_package_version,base_item_ids_json,proposed_yaml,proposal_version_hash,required_approvals_json,impact_summary_json,created_by,created_at,updated_at) VALUES(?,?,?,?,?,'draft',?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,scope.workspace_id,p.title,p.kind,p.target_item_id??null,at,p.source.type,p.source.ref,p.source.hash??null,prepared.base_package_version,JSON.stringify(p.target_item_id?[p.target_item_id]:[]),p.proposed_yaml,prepared.proposal_version_hash,JSON.stringify(prepared.phase4.required_approvals),m,actor.authenticated_actor,at,at);
     }else{
      if(prior.proposal_version_hash!==prepared.proposal_version_hash){
       db.prepare(`INSERT INTO change_package_approval_history(id,package_id,role,approver,decision,approved_version_hash,reason,at,invalidated_at,invalidation_reason) SELECT id,package_id,role,approver,decision,approved_version_hash,reason,at,?,'proposal_changed' FROM change_package_approvals WHERE package_id=?`).run(at,id);
       db.prepare('DELETE FROM change_package_approvals WHERE package_id=?').run(id);
      }
      db.prepare(`UPDATE change_packages SET title=?,kind=?,proposed_yaml=?,proposal_version_hash=?,impact_summary_json=?,required_approvals_json=?,status='draft',status_updated_at=?,updated_at=?,validation_result_json=NULL,lint_result_json=NULL,skill_state_result_json=NULL,generation_result_json=NULL,doctor_result_json=NULL,preview_diff=NULL,preview_files_json=NULL WHERE id=?`).run(p.title,p.kind,p.proposed_yaml,prepared.proposal_version_hash,m,JSON.stringify(prepared.phase4.required_approvals),at,at,id);
     }
    }
    if(status)db.prepare('UPDATE change_packages SET status=?,status_updated_at=?,updated_at=? WHERE id=?').run(status,at,at,id);
    if(review){
     const role=actor.server_resolved_role,approvals=db.prepare('SELECT * FROM change_package_approvals WHERE package_id=?').all(id);
     if(approvals.some(a=>a.role===role||a.approver===actor.authenticated_actor))throw new StudioError(409,'CONFLICT','One decision per role; different required reviewers need distinct actors.');
     db.prepare('INSERT INTO change_package_approvals(package_id,role,approver,decision,approved_version_hash,reason,at) VALUES(?,?,?,?,?,?,?)').run(id,role,actor.authenticated_actor,review.decision,previousHash,review.reason,at);
     const required=JSON.parse(db.prepare('SELECT required_approvals_json FROM change_packages WHERE id=?').get(id).required_approvals_json),all=[...approvals,{role,decision:review.decision}];
     const next=all.some(a=>a.decision==='reject')?'rejected':required.every(r=>all.some(a=>a.role===r&&a.decision==='approve'))?'approved':'in_review';db.prepare('UPDATE change_packages SET status=?,updated_at=? WHERE id=?').run(next,at,id);
    }
    if(raw){const run='VR-'+crypto.randomUUID();db.prepare("INSERT INTO verification_runs(id,workspace_id,command,status,exit_code,started_at,finished_at,raw_output,linked_package_id) VALUES(?,?,'check','passed',0,?,?,?,?)").run(run,scope.workspace_id,at,at,raw,id);}
    append(actor,{event_type:actor.action,resource_type:'package',payload:{result:'SUCCESS',...(prepared&&!prior?{base_candidate_hash:prepared.base_candidate_hash,source:prepared.payload.source}:{}),before_hash:previousHash,after_hash:prepared?.proposal_version_hash||previousHash,review:review?.decision??null,policy_promotion:false,source_written:false}});
    phase4Pending.delete(receipt);return cpView(db.prepare('SELECT * FROM change_packages WHERE id=?').get(id));
   });
  },
  phase4Packages(){return db.prepare("SELECT * FROM change_packages WHERE workspace_id=? AND json_extract(impact_summary_json,'$.phase4') IS NOT NULL ORDER BY created_at DESC LIMIT 1000").all(scope.workspace_id).map(cpView);},
  phase4Evidence(id){const row=db.prepare('SELECT impact_summary_json FROM change_packages WHERE id=? AND workspace_id=?').get(id,scope.workspace_id),evalId=JSON.parse(row?.impact_summary_json||'{}').phase4?.body?.eval_run_id??null;return db.prepare('SELECT id,command,status,exit_code,raw_output FROM verification_runs WHERE workspace_id=? AND (linked_package_id=? OR id=?) ORDER BY started_at DESC LIMIT 30').all(scope.workspace_id,id,evalId);},
  verificationRuns(){return db.prepare('SELECT summary_json FROM verification_runs WHERE workspace_id=? ORDER BY started_at DESC,id DESC LIMIT 500').all(scope.workspace_id).map(r=>{try{return JSON.parse(r.summary_json||'{}').studio_t20;}catch{return null;}}).filter(Boolean);},
  drafts(){return db.prepare('SELECT * FROM change_packages WHERE workspace_id=? ORDER BY created_at DESC,id LIMIT 100').all(scope.workspace_id).map(cpView);},
  draft(id){return cpView(db.prepare('SELECT * FROM change_packages WHERE workspace_id=? AND id=?').get(scope.workspace_id,id));},
  phase5Data(){return {runs:db.prepare('SELECT id,command,status,started_at,finished_at,exit_code,raw_output,summary_json,linked_package_id FROM verification_runs WHERE workspace_id=? ORDER BY started_at DESC,id LIMIT 2000').all(scope.workspace_id),audit:db.prepare('SELECT * FROM audit_events WHERE workspace_id=? ORDER BY id DESC LIMIT 10000').all(scope.workspace_id),changes:db.prepare('SELECT * FROM change_packages WHERE workspace_id=? ORDER BY created_at DESC LIMIT 1000').all(scope.workspace_id).map(cpView)};},
  phase5Settings(){const row=db.prepare("SELECT payload_json FROM audit_events WHERE workspace_id=? AND event_type='settings.update' AND json_extract(payload_json,'$.result')='SUCCESS' ORDER BY id DESC LIMIT 1").get(scope.workspace_id);return row?JSON.parse(row.payload_json).settings:null;},
  phase5Snapshots(){return db.prepare('SELECT instruction_metrics_json FROM metrics_snapshots WHERE workspace_id=? ORDER BY captured_at DESC,id DESC LIMIT 200').all(scope.workspace_id).map(r=>JSON.parse(r.instruction_metrics_json).capture);},
  phase5Commit(receipt,bound,value){
   const actor=consumeAuthorization(receipt,bound);if(bound.workspace_id!==scope.workspace_id||bound.target_project!==scope.target_project||!['settings.update','settings.test-signing','metrics.snapshot','reports.generate'].includes(bound.action))throw Error('PHASE5_SCOPE_MISMATCH');
   return transaction(()=>{
    if(bound.action==='metrics.snapshot'){
     const keys=['policy_coverage_pct','eval_pass_rate_pct','exception_half_life_days','drift_rate_pct','calibration_coverage_pct','skill_qualification_coverage_pct','skill_eval_pass_rate_pct','false_success_rate_pct','discovery_recall_multilingual_pct','qualification_drift_count'];
     db.prepare('INSERT INTO metrics_snapshots(workspace_id,captured_at,instruction_metrics_json,skill_metrics_json,'+keys.join(',')+') VALUES('+Array(14).fill('?').join(',')+')').run(scope.workspace_id,value.captured_at,JSON.stringify({capture:value}),JSON.stringify(value.grouped.skills),...keys.map(k=>value.metrics[k].value));
    }
    const payload=bound.action==='metrics.snapshot'?{result:'SUCCESS',raw_hash:value.raw_hash,profile:value.profile,project:value.project,captured_at:value.captured_at}:bound.action==='reports.generate'?{result:'SUCCESS',name:value.name,sha256:value.sha256,format:value.format}:{result:'SUCCESS',...value};
    append(actor,{event_type:bound.action,resource_type:'phase5',payload});return value;
   });
  },
  close(){db.close();},
 });
}
