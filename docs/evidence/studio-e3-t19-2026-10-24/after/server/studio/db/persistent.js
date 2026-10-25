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
 const transaction=run=>{db.exec('BEGIN IMMEDIATE');try{const value=run();db.exec('COMMIT');return value;}catch(error){db.exec('ROLLBACK');throw error;}};
 const cpView=row=>{
  if(!row)return null;
  const origin=db.prepare("SELECT payload_json FROM audit_events WHERE event_type='cp.create' AND resource_id=? AND json_extract(payload_json,'$.result')='SUCCESS' ORDER BY id LIMIT 1").get(row.id);
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
   checks,generation:generated?.generation??null,ci_comparison:null,required_approvals:Array.isArray(JSON.parse(row.required_approvals_json||'null'))?JSON.parse(row.required_approvals_json):['governance-owner'],approvals,approval_history:history,
   blockers:Object.entries(checks).filter(([k,c])=>['validate','lint','generate','doctor'].includes(k)&&c.status!=='PASS').map(([k,c])=>({code:'CHECK_'+k.toUpperCase(),message:c.reason||k+' has not passed.',severity:'warning'})),
   ...(row.preview_diff?{preview:{proposal_version_hash:row.proposal_version_hash,diff:row.preview_diff,files:JSON.parse(row.preview_files_json),source_written:false,state_written:false}}:{}),
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
  drafts(){return db.prepare('SELECT * FROM change_packages WHERE workspace_id=? ORDER BY created_at DESC,id LIMIT 100').all(scope.workspace_id).map(cpView);},
  draft(id){return cpView(db.prepare('SELECT * FROM change_packages WHERE workspace_id=? AND id=?').get(scope.workspace_id,id));},
  close(){db.close();},
 });
}
