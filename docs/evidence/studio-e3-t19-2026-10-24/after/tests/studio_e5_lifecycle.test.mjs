import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {createDraftStudio} from '../server/studio/draft-runtime.js';

const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const original=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json','utf8'));
const mandatory=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_T12_Candidate/policies/drafts/AGHR-001.json','utf8'));
test('E5/T16 exact-version lifecycle, blocked authority, stale writes, approval invalidation and rollback',async()=>{
 const storageRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-e5-'));
 const studio=await createDraftStudio({python,storageRoot,actor:'isolated-e5-owner'});
 const server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port,base='/api/v1/workspaces/rc3-local',results=[];
 async function req(method,route,body,headers={}){
  const response=await fetch(url+route,{method,headers:{'x-studio-token':studio.session.token,...(body===undefined?{}:{'content-type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const value=await response.json();return {status:response.status,data:value.data,error:value.meta.error};
 }
 const payload=item=>({title:'E5 lifecycle',kind:item.kind,source:{type:'request',ref:'isolated-e5'},proposed_yaml:JSON.stringify(item,null,2)+'\r\n'});
 const granted=async(route,body,hash)=>{
  const r=await req('POST',route,body,hash?{'if-match':JSON.stringify(hash)}:{});assert.equal(r.status,200,JSON.stringify(r));studio.approveIntent(r.data.id);
  const g=await req('GET','/api/v1/draft-intents/'+r.data.id);return {...r.data,grant:g.data.grant};
 };
 const create=async item=>{const p=payload(item),i=await granted('/api/v1/draft-intents',p);const r=await req('POST',base+'/change-packages',p,{'x-write-grant':i.grant,'if-match':JSON.stringify(i.scope.proposal_version_hash)});assert.equal(r.status,201,JSON.stringify(r));return r.data;};
 const action=async(cp,op,edit)=>{
  const i=await granted(base+'/cps/'+cp.id+'/intents',{operation:op,...(edit?{payload:edit}:{})},cp.proposal_version_hash);
  return req(op==='edit'?'PATCH':'POST',base+'/cps/'+cp.id+(op==='edit'?'':'/'+op),edit,{'x-write-grant':i.grant,'if-match':JSON.stringify(cp.proposal_version_hash)});
 };
 try{
  let cp=await create({...original,id:'OBS-E5-001'});const firstHash=cp.proposal_version_hash;
  assert.equal(cp.proposed_yaml.endsWith('\r\n'),true);
  assert.equal((await action(cp,'submit')).status,409);
  let r=await action(cp,'validate');assert.equal(r.status,202,JSON.stringify(r));cp=r.data;assert.equal(cp.status,'validated');assert.equal(cp.checks.validate.status,'PASS');assert.equal(cp.checks.eval.status,'NOT_RUN');results.push({phase:'validated',cp});
  r=await action(cp,'submit');assert.equal(r.status,200);cp=r.data;assert.equal(cp.status,'in_review');assert.deepEqual(cp.approvals,[]);results.push({phase:'submitted_not_approved',cp});
  const previewPayload={agent:'codex',profile:'draft-l1',dry_run:true};
  const gen=await granted(base+'/cps/'+cp.id+'/intents',{operation:'generate',payload:previewPayload},cp.proposal_version_hash);
  r=await req('POST',base+'/generate/preview',previewPayload,{'x-write-grant':gen.grant,'if-match':JSON.stringify(cp.proposal_version_hash)});
  assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.stage,'full');assert.equal(r.data.prin_007_present,true);assert.equal(studio.store.draft(cp.id).generation.stage,'full');
  assert.equal((await req('POST',base+'/cps/'+cp.id+'/approve',{role:'governance-owner'})).status,403);
  assert.equal((await req('POST',base+'/cps/'+cp.id+'/export',{})).status,403);
  // Isolated imported approval fixture only: T18 grant/approval API is NOT
  // implemented or bypassed. Preserve every original decision field on edit.
  const db=new DatabaseSync(studio.store.file);
  const at='2026-10-23T00:00:00Z';
  db.prepare("INSERT INTO change_package_approvals(package_id,role,approver,decision,approved_version_hash,reason,at) VALUES(?,'governance-owner','fixture-owner','approve',?,'IMPORTED_TEST_ONLY',?)").run(cp.id,firstHash,at);
  const approval=db.prepare('SELECT * FROM change_package_approvals WHERE package_id=?').get(cp.id);
  const next=JSON.parse(cp.proposed_yaml);next.rule+=' New evidence pending.';
  const edit={proposed_yaml:JSON.stringify(next,null,2)+'\r\n'};
  const pending=await granted(base+'/cps/'+cp.id+'/intents',{operation:'edit',payload:edit},firstHash);
  const headers={'x-write-grant':pending.grant,'if-match':JSON.stringify(firstHash)};
  assert.equal((await req('PATCH',base+'/cps/'+cp.id,edit,{'x-write-grant':pending.grant})).status,428);
  assert.equal((await req('PATCH',base+'/cps/'+cp.id,{...edit,role:'governance-owner'},headers)).status,412);
  // Failure at audit boundary rolls CP, checks and approval history back.
  db.exec("CREATE TRIGGER isolated_edit_failure BEFORE INSERT ON audit_events WHEN NEW.event_type='cp.edit_any' AND json_extract(NEW.payload_json,'$.result')='SUCCESS' BEGIN SELECT RAISE(ABORT,'ISOLATED_FAILURE'); END");
  r=await req('PATCH',base+'/cps/'+cp.id,edit,headers);assert.equal(r.status,503);
  assert.equal(studio.store.draft(cp.id).proposal_version_hash,firstHash);assert.equal(studio.store.draft(cp.id).approvals.length,1);assert.equal(studio.store.draft(cp.id).approval_history.length,0);
  db.exec('DROP TRIGGER isolated_edit_failure');
  const stale=await granted(base+'/cps/'+cp.id+'/intents',{operation:'edit',payload:edit},firstHash);
  r=await action(cp,'edit',edit);assert.equal(r.status,200,JSON.stringify(r));cp=r.data;
  assert.notEqual(cp.proposal_version_hash,firstHash);assert.equal(cp.status,'draft');assert.equal(cp.approvals.length,0);assert.equal(cp.approval_history.length,1);
  assert.deepEqual(cp.approval_history[0].decision,{...approval});assert.equal(cp.approval_history[0].invalidation_reason,'proposal_changed');
  for(const c of Object.values(cp.checks))assert.equal(c.status,'NOT_RUN');assert.equal(cp.generation,null);results.push({phase:'edited_invalidated',cp});
  assert.equal((await req('PATCH',base+'/cps/'+cp.id,edit,headers)).status,403); // used grant remains consumed after rollback
  assert.equal((await req('PATCH',base+'/cps/'+cp.id,edit,{'x-write-grant':stale.grant,'if-match':JSON.stringify(firstHash)})).status,412);
  assert.equal((await action(cp,'submit')).status,409);
  const noChange=await action(cp,'edit',{proposed_yaml:cp.proposed_yaml});assert.equal(noChange.data.approval_history.length,1);
  r=await action(cp,'validate');assert.equal(r.data.status,'validated');cp=r.data;assert.equal((await action(cp,'submit')).data.status,'in_review');
  const blocked=await create(mandatory);r=await action(blocked,'validate');assert.equal(r.status,202);assert.equal(r.data.status,'draft');assert.equal(r.data.checks.validate.status,'FAIL');assert.match(r.data.checks.validate.reason,/AUTHORITY_SOURCE_UNVERIFIED/);assert.equal((await action(r.data,'submit')).status,409);results.push({phase:'native_blocked_no_mock',cp:r.data});
  assert.equal(db.prepare('SELECT count(*) n FROM verification_runs WHERE command=\'validate\'').get().n,3);db.close();
  const reference=fs.readFileSync('docs/specs/aghr-rc3/AGHR_REFERENCE.md','utf8').replaceAll('\r\n','\n');
  const raw=reference.split('### 9.2 ')[1].split('### 9.3 ')[0].split('```yaml\n')[1].split('```')[0]+'\nrationale: ISOLATED_PREVIEW_ONLY_NOT_ADOPTED\nimpact:\n  band: high\n  evidence: assumed\n';
  const p={title:'PRIN-007 draft preview only',kind:'PRINCIPLE',source:{type:'request',ref:'ISOLATED_PREVIEW_NOT_ADOPTED'},proposed_yaml:raw};
  const i=await granted('/api/v1/draft-intents',p);r=await req('POST',base+'/change-packages',p,{'x-write-grant':i.grant,'if-match':JSON.stringify(i.scope.proposal_version_hash)});assert.equal(r.status,201,JSON.stringify(r));
  const principleCp=r.data,g=await granted(base+'/cps/'+principleCp.id+'/intents',{operation:'generate',payload:previewPayload},principleCp.proposal_version_hash);
  r=await req('POST',base+'/generate/preview',previewPayload,{'x-write-grant':g.grant,'if-match':JSON.stringify(principleCp.proposal_version_hash)});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.stage,'full');assert.equal(r.data.prin_007_present,true);assert.equal(r.data.p0_preserved,true);assert.equal(studio.store.draft(principleCp.id).status,'draft');results.push({phase:'real_http_full_preview_not_adopted',generation:r.data,cp:studio.store.draft(principleCp.id)});
  if(process.env.AGHR_EVIDENCE_OUT)fs.writeFileSync(path.join(process.env.AGHR_EVIDENCE_OUT,'LIFECYCLE_HTTP.json'),JSON.stringify({status:'PASS',approval_fixture:'IMPORTED_TEST_ONLY; no T18 product approval',results,audit:studio.store.auditEvents(1000)},null,2));
 }finally{await new Promise(r=>server.close(r));studio.close();}
});
