import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {createDraftStudio} from '../server/studio/draft-runtime.js';

const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const fixture=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json','utf8'));
const canonical=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_T06_SEC001_Candidate/complete/policies/security/secrets.json','utf8'));
async function command(exe,args){const c=spawn(exe,args,{windowsHide:true});const out=[],err=[];c.stdout.on('data',b=>out.push(b));c.stderr.on('data',b=>err.push(b));const timer=setTimeout(()=>c.kill(),60000);const code=await new Promise((r,j)=>{c.on('error',j);c.on('exit',r);});clearTimeout(timer);return {code,out:Buffer.concat(out).toString('utf8'),err:Buffer.concat(err).toString('utf8')};}

test('E3/T18 real bounded runs, actual approval rows/history, stale denial, patch transaction; canonical SEC-001 stays honest',async t=>{
 const storageRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-e3-draft-'));
 const studio=await createDraftStudio({python,storageRoot,actor:'ISOLATED_GOVERNANCE_OPERATOR'});
 const reviewer=studio.authority.createPrincipal({actor:'ISOLATED_DISTINCT_REVIEWER',role:'security-owner'});
 const server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port,base='/api/v1/workspaces/rc3-local',records=[];
 const request=async(method,route,body,headers={},token=studio.session.token)=>{
  const r=await fetch(url+route,{method,headers:{'x-studio-token':token,...(body===undefined?{}:{'content-type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json()};
 };
 const payload=item=>({title:'E3 '+item.id,kind:item.kind,source:{type:'request',ref:'ISOLATED_NATIVE_PIPELINE'},proposed_yaml:JSON.stringify(item,null,2)+'\r\n'});
 async function intent(cp,operation,body,token){
  const r=await request('POST',base+'/cps/'+cp.id+'/intents',{operation,...(body===undefined?{}:{payload:body})},{'if-match':JSON.stringify(cp.proposal_version_hash)},token);assert.equal(r.status,200,JSON.stringify(r));studio.approveIntent(r.body.data.id);
  const grant=(await request('GET','/api/v1/draft-intents/'+r.body.data.id,undefined,{},token)).body.data.grant;return {grant,intent:r.body.data};
 }
 async function create(item){
  const p=payload(item),i=await request('POST','/api/v1/draft-intents',p);assert.equal(i.status,200,JSON.stringify(i));studio.approveIntent(i.body.data.id);
  const grant=(await request('GET','/api/v1/draft-intents/'+i.body.data.id)).body.data.grant;
  const r=await request('POST',base+'/change-packages',p,{'x-write-grant':grant,'if-match':JSON.stringify(i.body.data.scope.proposal_version_hash)});assert.equal(r.status,201,JSON.stringify(r));return r.body.data;
 }
 async function action(cp,op,body,token){
  const i=await intent(cp,op,body,token);
  const route=op==='generate'?base+'/generate/preview':base+'/cps/'+cp.id+(op==='edit'?'':'/'+op);
  const r=await request(op==='edit'?'PATCH':'POST',route,body,{'x-write-grant':i.grant,'if-match':JSON.stringify(cp.proposal_version_hash)},token);
  records.push({operation:op,status:r.status,body:r.body});return r;
 }
 async function refresh(id){return (await request('GET',base+'/cps/'+id)).body.data;}
 async function checked(cp){
  let r=await action(cp,'validate');assert.equal(r.status,202,JSON.stringify(r));assert.equal(r.body.data.status,'validated');cp=r.body.data;
  r=await action(cp,'generate',{agent:'codex',profile:'draft-l1',dry_run:true});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.data.stage,'full');assert.equal(r.body.data.prin_007_present,true);cp=await refresh(cp.id);
  r=await action(cp,'preview');assert.equal(r.status,200,JSON.stringify(r));cp=await refresh(cp.id);
  r=await action(cp,'submit');assert.equal(r.status,200,JSON.stringify(r));return r.body.data;
 }
 const decision=(role,reason='ISOLATED_TEST_APPROVAL')=>({role,decision:'approve',reason});
 try{
  let cp=await create({...fixture,id:'OBS-T18-001'});cp=await checked(cp);const before=cp.proposal_version_hash;
  let r=await action(cp,'approve',decision('governance-owner'));assert.equal(r.status,200,JSON.stringify(r));cp=r.body.data;assert.equal(cp.status,'in_review');assert.equal(cp.approvals.length,1);
  const stale=await intent(cp,'approve',decision('security-owner'),reviewer.token);
  const changed=JSON.parse(cp.proposed_yaml);changed.rule+=' Revised candidate.';
  r=await action(cp,'edit',{proposed_yaml:JSON.stringify(changed,null,2)+'\r\n'});assert.equal(r.status,200,JSON.stringify(r));cp=r.body.data;
  assert.equal(cp.approvals.length,0);assert.equal(cp.approval_history.length,1);assert.equal(cp.approval_history[0].decision.approved_version_hash,before);assert.equal(cp.generation,null);
  r=await request('POST',base+'/cps/'+cp.id+'/approve',decision('security-owner'),{'x-write-grant':stale.grant,'if-match':JSON.stringify(before)},reviewer.token);assert.equal(r.status,412);records.push({operation:'stale-approval',...r});
  cp=await checked(cp);r=await action(cp,'approve',decision('governance-owner'));assert.equal(r.status,200,JSON.stringify(r));cp=r.body.data;
  r=await action(cp,'approve',decision('security-owner'),reviewer.token);assert.equal(r.status,200,JSON.stringify(r));cp=r.body.data;assert.equal(cp.status,'approved');assert.equal(cp.approvals.length,2);assert.equal(new Set(cp.approvals.map(a=>a.approver)).size,2);
  // Actual local read-only CLI invoked from the host, not a fake lookup map.
  const lookup=await command(process.execPath,['tools/aghr_get_rule.mjs','--cp-id='+cp.id,'--hash='+cp.proposal_version_hash,'--id=OBS-T18-001','--database='+studio.store.file,'--python='+python]);assert.equal(lookup.code,0,lookup.err);const retrieved=JSON.parse(lookup.out);assert.equal(retrieved.rule.rule,changed.rule);assert.equal(retrieved.resource.active_processes_after,0);records.push({operation:'actual-host-lookup',data:retrieved});
  const db=new DatabaseSync(studio.store.file);
  db.exec("CREATE TRIGGER isolated_export_audit_failure BEFORE INSERT ON audit_events WHEN NEW.event_type='cp.export.patch' AND json_extract(NEW.payload_json,'$.result')='SUCCESS' BEGIN SELECT RAISE(ABORT,'TEST_ONLY'); END");
  r=await action(cp,'export',{format:'patch'});assert.equal(r.status,503);assert.equal((await refresh(cp.id)).status,'approved');assert.equal(fs.readdirSync(path.join(storageRoot,'artifacts')).length,0);
  db.exec('DROP TRIGGER isolated_export_audit_failure');db.close();
  r=await action(cp,'export',{format:'patch'});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.data.publication,'NOT_PERFORMED');assert.equal((await refresh(cp.id)).status,'exported');
  const patch=r.body.data.artifact.path,applyRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-patch-check-'));assert.equal((await command('git',['-C',applyRoot,'init','-q'])).code,0);
  const gitCheck=await command('git',['-C',applyRoot,'apply','--check',patch]);assert.equal(gitCheck.code,0,gitCheck.err);
  assert.equal((await command('git',['-C',applyRoot,'apply',patch])).code,0);assert.equal(fs.readFileSync(path.join(applyRoot,'policies/drafts/OBS-T18-001.yaml'),'utf8'),cp.proposed_yaml);records.push({operation:'isolated-git-apply-check',status:'PASS',source_applied_to_reference:false});
  const stages={};
  for(const [stage,item]of [['compress',{...fixture,id:'OBS-P2-LARGE',defaultTier:'P2-Quality',rule:'Low priority detail. '.repeat(2100)}],['compact',{...fixture,id:'OBS-P1-LARGE',defaultTier:'P1-Reasoning',rule:'Required detail. '.repeat(2600)}],['fail',{...fixture,id:'PRIN-007',kind:'PRINCIPLE',rule:'Counterfeit principle must not pass.'}]]){
   const draft=await create(item),generated=await action(draft,'generate',{agent:'codex',profile:'draft-l1',dry_run:true});assert.equal(generated.status,200,JSON.stringify(generated));assert.equal(generated.body.data.stage,stage);stages[stage]=generated.body.data;
   if(stage==='compact'){
    assert.equal(generated.body.data.lookup.status,'PASS');assert.match(generated.body.data.content,/tools\/aghr_get_rule.mjs/);
    const cli=await command(process.execPath,['tools/aghr_get_rule.mjs','--cp-id='+draft.id,'--hash='+draft.proposal_version_hash,'--id='+item.id,'--database='+studio.store.file,'--python='+python]);assert.equal(cli.code,0,cli.err);assert.equal(JSON.parse(cli.out).rule.rule,item.rule);records.push({operation:'actual-compact-rule-lookup',data:JSON.parse(cli.out)});
   }
  }
  records.push({operation:'real-generation-stages',stages});
  // Canonical specimen retains enterprise, required GitHub gate and P0 meaning.
  const sec=await create(canonical);r=await action(sec,'validate');assert.equal(r.status,202,JSON.stringify(r));assert.equal(r.body.data.status,'draft');assert.match(r.body.data.checks.validate.reason,/AUTHORITY_SOURCE_UNVERIFIED/);assert.match(r.body.data.checks.validate.reason,/P0_EVAL_QUALIFICATION_UNAVAILABLE/);
  const attestation=await intent(sec,'validate');await assert.rejects(()=>studio.attestSource(attestation.intent.id),/LOCAL_SOURCE_ATTESTATION_REQUIRES_EXACT_PROJECT_OWNER/);
  r=await action(sec,'doctor');assert.equal(r.status,200);assert.equal(r.body.data.checks.doctor.status,'FAIL');
  r=await action(sec,'generate',{agent:'codex',profile:'draft-l1',dry_run:true});assert.equal(r.status,200);assert.equal(r.body.data.prin_007_present,true);
  r=await action(await refresh(sec.id),'approve',decision('governance-owner'));assert.equal(r.status,422);r=await action(await refresh(sec.id),'export',{format:'patch'});assert.equal(r.status,422);
  r=await action(await refresh(sec.id),'draft-patch',{format:'patch'});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.data.approval,'NOT_GRANTED');assert.match(fs.readFileSync(r.body.data.artifact.path,'utf8'),/^# AGHR REVIEW-ONLY DRAFT; NOT APPROVED/);assert.equal((await refresh(sec.id)).checks.eval.status,'NOT_RUN');
  const secReviewArtifact=r.body.data.artifact.path;
  const projectItem={...fixture,id:'OBS-LOCAL-SOURCE',authority:{source:'operator:ISOLATED_GOVERNANCE_OPERATOR',level:'project',owner:'ISOLATED_GOVERNANCE_OPERATOR',approvedBy:'ISOLATED_GOVERNANCE_OPERATOR',status:'active',effectiveFrom:'2026-01-01'},enforcement:{gate:{type:'studio-patch-secret-scanner-v1',required:true}}};
  let local=await create(projectItem);r=await action(local,'validate');assert.match(r.body.data.checks.validate.reason,/AUTHORITY_SOURCE_UNVERIFIED/);
  const localIntent=await intent(local,'validate');await studio.attestSource(localIntent.intent.id);
  r=await request('POST',base+'/cps/'+local.id+'/validate',undefined,{'x-write-grant':localIntent.grant,'if-match':JSON.stringify(local.proposal_version_hash)});assert.equal(r.status,202);assert.equal(r.body.data.checks.validate.status,'PASS');assert.equal(r.body.data.checks.doctor.status,'PASS');records.push({operation:'actual-local-source-attestation',body:r.body});local=r.body.data;
  projectItem.rule+=' Changed after attestation.';r=await action(local,'edit',{proposed_yaml:JSON.stringify(projectItem)});local=r.body.data;r=await action(local,'validate');assert.match(r.body.data.checks.validate.reason,/AUTHORITY_SOURCE_UNVERIFIED/);records.push({operation:'stale-source-attestation-blocked',body:r.body});
  if(process.env.AGHR_EVIDENCE_OUT){const dest=process.env.AGHR_EVIDENCE_OUT;fs.writeFileSync(path.join(dest,'NATIVE_WORKFLOW.json'),JSON.stringify({status:'PASS',scope:'local bounded application; reviewer identities are isolated server-auth fixtures, not independent human review',records},null,2));fs.copyFileSync(secReviewArtifact,path.join(dest,'SEC-001.REVIEW_ONLY.patch'));fs.copyFileSync(patch,path.join(dest,'OBS-T18.APPROVED_TEST.patch'));fs.copyFileSync(studio.store.file,path.join(dest,'NATIVE_ISOLATED.sqlite'));}
 }finally{await new Promise(r=>server.close(r));studio.close();}
});
