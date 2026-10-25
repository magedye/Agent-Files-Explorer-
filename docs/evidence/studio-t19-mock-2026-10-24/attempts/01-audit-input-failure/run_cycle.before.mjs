// Full backend lifecycle in a separate MOCK-labelled 12-table Draft database.
// Never enabled by the application; no identity, gate or E4 qualification claim.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {repository,engineRoot} from '../../server/studio/aghr/cli-bridge.js';
import {createWriteAuthority} from '../../server/studio/write-authorization.js';
import {openPersistentStore,storageScope} from '../../server/studio/db/persistent.js';
import {createBoundedValidator} from '../../server/studio/aghr/bounded-validator.js';
import {createMockValidator,verifyFixture,profile,sha} from './mock_bridge.mjs';

export async function runCycle({out,storageRoot=path.join(out,'MOCK_DRAFT'),save=true}){
 const pin=JSON.parse(fs.readFileSync(path.join(out,'HOST_FIXTURE_PIN.json'))),root=path.join(out,'fixture');verifyFixture(root,pin);
 if(fs.existsSync(storageRoot))throw Error('MOCK_STORAGE_ALREADY_EXISTS');fs.mkdirSync(storageRoot);
 const python=path.join(repository,'temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),base=pin.binding.base;
 const native=await createBoundedValidator({python,base}),mock=createMockValidator({python,base,root,pin,native});
 const authority=createWriteAuthority(),gov=authority.createPrincipal({actor:'T19_MOCK_GOVERNANCE_OPERATOR',role:'governance-owner',installationOwnerVerified:true}),security=authority.createPrincipal({actor:'T19_MOCK_SECURITY_REVIEWER',role:'security-owner'});
 const cfg={workspaceId:'rc3-local',targetProject:'studio-drafts',storageRoot},events=[],nativeControls=[];
 const scope=(action,id,hash)=>({workspace_id:cfg.workspaceId,target_project:cfg.targetProject,action,resource_id:id,proposal_version_hash:hash});
 const permit=(s,who=gov)=>authority.authorize(who.principal,s,authority.issueGrant({issuer:gov.principal,principal:who.principal,scope:s,expiresAt:Date.now()+60000}));
 const store=openPersistentStore(cfg,permit(storageScope(cfg)));
 const payload=JSON.parse(fs.readFileSync(path.join(root,'PROPOSAL.json'))),actor=who=>({authenticated_actor:who===gov?'T19_MOCK_GOVERNANCE_OPERATOR':'T19_MOCK_SECURITY_REVIEWER',server_resolved_role:who===gov?'governance-owner':'security-owner'});
 let cp;
 const record=(operation,data)=>events.push({profile,operation,proposal_version_hash:cp?.proposal_version_hash,data});
 const currentPayload=()=>({title:cp.title,kind:cp.kind,source:cp.source,proposed_yaml:cp.proposed_yaml});
 const check=async()=>{const result=await mock.check(currentPayload());assert.equal(result.exit_code,0,JSON.stringify(result.findings));cp=store.checkDraft(permit(scope('cp.validate',cp.id,cp.proposal_version_hash)),cp.id,cp.proposal_version_hash,result);record('validate --strict / lint',result);};
 const generate=async()=>{const run=await native.generateRun(currentPayload(),{agent:'codex',profile:'draft-l1',dry_run:true});assert.equal(run.data.stage,'full');assert.equal(run.data.prin_007_present,true);assert.equal(run.data.p0_preserved,true);store.previewDraft(permit(scope('cp.generate.preview',cp.id,cp.proposal_version_hash)),cp.id,cp.proposal_version_hash,run.data,run.receipt);cp=store.draft(cp.id);record('generate',run);};
 const submit=()=>{cp=store.submitDraft(permit(scope('cp.submit',cp.id,cp.proposal_version_hash)),cp.id,cp.proposal_version_hash);record('submit',{status:cp.status});};
 const approve=async who=>{const d={role:actor(who).server_resolved_role,decision:'approve',reason:profile+'; simulated reviewer identity; not independent human approval'},run=await mock.approvalRun(currentPayload(),cp,d,actor(who),store.requirements(cp.id));
  cp=store.approveDraft(permit(scope(who===gov?'cp.approve.governance':'cp.approve.security',cp.id,cp.proposal_version_hash),who),cp.id,cp.proposal_version_hash,d,run.data,sha(JSON.stringify(cp)),run.receipt);record('approve '+d.role,run);};
 try{
  const ws={id:'rc3-local',name:profile,package_path:engineRoot,package_version:base.base_package_version,schema_version:'1.2'};
  store.registerWorkspace(permit(scope('draft.workspace.initialize',ws.id,'sha256:'+sha(JSON.stringify(ws)))),ws);
  const prepared=await native.prepare(payload),id='CP-T19-MOCK-'+crypto.randomUUID();
  cp=store.createDraft(permit(scope('cp.create',id,prepared.proposal_version_hash)),{...prepared,id,request_id:profile});record('author',{status:cp.status});
  const before=await native.check(payload);assert.equal(before.exit_code,3);assert.deepEqual(new Set(before.findings.filter(f=>f.disposition==='BLOCKED').map(f=>f.code)),new Set(['AUTHORITY_SOURCE_UNVERIFIED','ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE','P0_EVAL_QUALIFICATION_UNAVAILABLE']));nativeControls.push({operation:'native validate before',...before});
  await check();await generate();submit();await approve(gov);
  const staleCp=cp,changed={proposed_yaml:cp.proposed_yaml+'\n'},edited=await native.prepare(currentPayload(),{edit:changed});
  cp=store.editDraft(permit(scope('cp.edit_any',cp.id,edited.proposal_version_hash)),cp.id,cp.proposal_version_hash,edited);
  assert.equal(cp.approvals.length,0);assert.equal(cp.approval_history.length,1);assert.equal(cp.checks.eval.status,'NOT_RUN');assert.equal(cp.generation,null);record('edit invalidation',{before:staleCp.proposal_version_hash,after:cp.proposal_version_hash,history:cp.approval_history,checks:cp.checks});
  await assert.rejects(()=>mock.check(currentPayload()),/MOCK_PROPOSAL_BINDING/);record('stale mock receipt rejected',{status:'PASS'});
  const decision={role:'security-owner',decision:'approve',reason:profile};
  const staleRun=await mock.approvalRun(payload,staleCp,decision,actor(security),{eval_required:true,skill_required:false});
  assert.throws(()=>store.approveDraft(permit(scope('cp.approve.security',cp.id,staleCp.proposal_version_hash),security),cp.id,staleCp.proposal_version_hash,decision,staleRun.data,sha(JSON.stringify(staleCp)),staleRun.receipt),e=>e.status===412);record('stale approval rejected',{http_equivalent:412});
  // Restore identical canonical proposal bytes; history persists. No new grant
  // is silently signed for the edited proposal.
  const restored=await native.prepare(currentPayload(),{edit:{proposed_yaml:payload.proposed_yaml}});
  cp=store.editDraft(permit(scope('cp.edit_any',cp.id,restored.proposal_version_hash)),cp.id,cp.proposal_version_hash,restored);
  await check();await generate();
  const dr=await mock.doctorRun(payload);cp=store.saveDoctor(permit(scope('cp.doctor',cp.id,cp.proposal_version_hash)),cp.id,cp.proposal_version_hash,dr);record('MOCK GitHub doctor',dr);
  const preview=await native.previewRun(payload);store.savePreview(permit(scope('cp.preview',cp.id,cp.proposal_version_hash)),cp.id,cp.proposal_version_hash,preview.data,preview.receipt);cp=store.draft(cp.id);record('diff',preview);
  submit();
  await assert.rejects(()=>native.approvalRun(cp,{role:'governance-owner',decision:'approve',reason:profile},actor(gov),store.requirements(cp.id)),/E4_EVAL_NOT_RUN/);nativeControls.push({operation:'native approval rejects mock DB',result:'BLOCKED',real_e4_status:cp.checks.eval.status});
  await approve(gov);await approve(security);assert.equal(cp.status,'approved');assert.equal(cp.approvals.length,2);assert.equal(cp.checks.eval.status,'NOT_RUN');
  await assert.rejects(()=>native.exportRun(payload,cp,actor(gov),store.requirements(cp.id)),/E4_EVAL_REQUIRED/);nativeControls.push({operation:'native export rejects mock DB',result:'BLOCKED'});
  const exported=await mock.exportRun(payload,cp,actor(gov),store.requirements(cp.id));
  const artifact=store.exportDraft(permit(scope('cp.export.patch',cp.id,cp.proposal_version_hash)),cp.id,cp.proposal_version_hash,exported.data,sha(JSON.stringify(cp)),exported.receipt);cp=store.draft(cp.id);record('export MOCK patch',{...artifact,profile,approval:'OWNER_AUTHORIZED_MOCK_ONLY'});
  assert.equal(cp.status,'exported');assert.match(fs.readFileSync(artifact.artifact.path,'utf8'),/^# T19_OWNER_APPROVED_MOCK/);
  const after=await native.check(payload);assert.equal(after.exit_code,3);nativeControls.push({operation:'native validate after',...after});
  // Store all three receipts explicitly and immutably in the audit log, in
  // addition to the raw validation/doctor records. No E4 check is promoted.
  for(const name of ['SourceGrant','GitHubGate','EvalResult'])store.recordAttempt({actor:actor(gov).authenticated_actor,role:'governance-owner',action:'t19.mock.evidence',resourceId:cp.id,result:profile,status:200,reason:JSON.stringify({profile,kind:name,proposal_version_hash:cp.proposal_version_hash,receipt:JSON.parse(fs.readFileSync(path.join(root,name+'.json'))),real_e4_status:'NOT_RUN'})});
  const db=new DatabaseSync(store.file,{readOnly:true});let dbProof;try{
   dbProof={profile,tables:db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name),approvals:db.prepare('SELECT * FROM change_package_approvals').all(),history:db.prepare('SELECT * FROM change_package_approval_history').all(),runs:db.prepare('SELECT id,command,status,exit_code,raw_output FROM verification_runs').all(),audit:db.prepare('SELECT * FROM audit_events').all()};
   assert.equal(dbProof.tables.length,12);assert.equal(dbProof.approvals.length,2);assert.ok(dbProof.approvals.every(a=>a.approver.startsWith('T19_MOCK_')&&a.reason.includes(profile)));assert.equal(dbProof.history.length,1);assert.equal(dbProof.audit.filter(a=>a.event_type==='t19.mock.evidence').length,3);
  }finally{db.close();}
  const result={profile,status:'T19_CLOSED_OWNER_AUTHORIZED_MOCK_ONLY',exit_code:exported.receipt.exit_code,cp,artifact,native_controls:nativeControls,events,resource_runs:mock.records,e4:'REQUIRED / NOT_RUN / NOT_WAIVED',source_written:false,publication:'NOT_PERFORMED',independent_acceptance:'NOT_GRANTED'};
  if(save){for(const [name,value]of Object.entries({'CYCLE.json':result,'DATABASE_PROOF.json':dbProof}))fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.copyFileSync(artifact.artifact.path,path.join(out,'SEC-001.T19_APPROVED_MOCK.patch'),fs.constants.COPYFILE_EXCL);}
  return result;
 }finally{store.close();native.close();}
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'))){
 const out=path.join(repository,'docs/evidence/studio-t19-mock-2026-10-24');
 const result=await runCycle({out});console.log(JSON.stringify({profile,status:result.status,exit_code:result.exit_code,artifact:result.artifact.artifact,real_e4_status:result.e4}));
}
