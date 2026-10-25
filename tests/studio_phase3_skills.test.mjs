import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createDraftStudio} from '../server/studio/draft-runtime.js';
import {encodeJsonl} from '../tools/contracts/evidence_jsonl.mjs';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),root=path.resolve('tests/fixtures/studio-e4/json-audit');
const skill={id:'json-audit',source:'project',skillPath:root+'/SKILL.md',entry:root+'/worker.py',triggers:['review','مراجعة'],requires:['workspace.read']};
test('T22/T23 real HTTP lifecycle keeps three axes, auth, scenarios and native blockers distinct',async t=>{
 const storageRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t22-')),config={skills:[skill,{...skill,id:'restricted',requires:['deploy']},{...skill,id:'unavailable',entry:undefined}],permissions:['workspace.read']};
 const project=path.join(storageRoot,'project'),at=new Date().toISOString();fs.mkdirSync(project+'/.aghr/runtime_evidence',{recursive:true});
 const original=encodeJsonl([{task_id:'ci-task',session:{agent:'UNAUTHENTICATED_SOURCE',agent_version:'1',host_os:'windows',started_at:at},events:[{at,type:'skill.loaded',skill_id:'json-audit',instruction_hash:'sha256:'+'a'.repeat(64)}],submit_to_ci:false}]);fs.writeFileSync(project+'/.aghr/runtime_evidence/ci-task.jsonl',original);
 const studio=await createDraftStudio({python,storageRoot,actor:'phase3-test-owner',e4Config:config,evidenceProjectRoot:project}),server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='/api/v1/workspaces/rc3-local/skill-lifecycle',origin='http://127.0.0.1:'+server.address().port,results=[];
 const request=async(method,url,body,headers={})=>{const r=await fetch(origin+url,{method,headers:{'X-Studio-Token':studio.session.token,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,...await r.json()};};
 const prepare=async payload=>{const r=await request('POST',base+'/intents',payload);assert.equal(r.status,200,JSON.stringify(r));studio.approveIntent(r.data.id);const grant=(await request('GET','/api/v1/draft-intents/'+r.data.id)).data.grant;return {...r.data,grant,payload};};
 const apply=async intent=>{const r=await request('POST',base+'/run',intent.payload,{'X-Write-Grant':intent.grant,'If-Match':JSON.stringify(intent.scope.proposal_version_hash)});assert.equal(r.status,200,JSON.stringify(r));results.push(r.data);return r.data;};
 const run=async payload=>apply(await prepare({host:'aghr-local-process',...payload}));
 try{
  await t.test('No grant, forged body roles or arbitrary executable can execute; permissions audited',async()=>{
   assert.equal((await request('POST',base+'/run',{operation:'execute',task_id:'forged',host:'aghr-local-process'})).status,403);
   assert.equal((await request('POST',base+'/intents',{operation:'select',task_id:'forged',host:'aghr-local-process',role:'governance-owner'})).status,400);
   assert.equal((await request('POST',base+'/intents',{operation:'select',task_id:'forged',host:'aghr-local-process',executable:'cmd.exe'})).status,400);
  });
  await t.test('Pinned 8 scenarios and7 honesty records show local conformance and native NOT_RUN, never native PASS',async()=>{
   const r=await request('GET',base+'/scenarios');assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.scenarios.length,8);assert.equal(r.data.honesty.length,7);assert(r.data.scenarios.every(x=>x.codex==='NOT_RUN'&&x.antigravity==='NOT_RUN'));assert.equal(r.data.native_waived,false);
  });
  await t.test('Arabic selection and loading cannot claim execution/verification',async()=>{
   const s=await run({operation:'select',task_id:'actual',query:'مراجعة شفرة'});assert.equal(s.result.status,'SELECTED');assert.equal(s.task.usage.selected,'SELECTED');
   const l=await run({operation:'load',task_id:'actual',skill_id:'json-audit'});assert.equal(l.task.usage.loaded,'LOADED');assert.equal(l.task.usage.executed,'NOT_RUN');assert.equal(l.task.usage.verified,'NOT_RUN');
   const denied=await run({operation:'verify',task_id:'actual',skill_id:'json-audit',task_criteria:'{"all":[{"pointer":"/valid","op":"equals","value":true}]}'});assert.match(denied.error,/EXECUTION_EVIDENCE_REQUIRED/);assert.equal(denied.task.usage.verified,'NOT_RUN');
  });
  await t.test('Actual read-only execution + task criteria permit VERIFIED; raw receipts persist',async()=>{
   const r=await run({operation:'execute',task_id:'actual',skill_id:'json-audit',input:{document:{name:'real'},required:['name']}});assert.equal(r.task.usage.executed,'EXECUTED');assert.equal(r.task.usage.verified,'NOT_RUN');
   const v=await run({operation:'verify',task_id:'actual',skill_id:'json-audit',task_criteria:'{"all":[{"pointer":"/valid","op":"equals","value":true}]}'});assert.equal(v.task.usage.verified,'VERIFIED');assert.equal(v.task.qualification.status,'NOT_RUN');assert.equal(v.task.host,'aghr-local-process');
  });
  await t.test('No match, unknown ID, installed-unavailable and denied permission remain distinct',async()=>{
   for(const [task_id,selection,expected]of [['simple',{query:'hello—unrelated task'},'NO_SKILL_MATCH'],['unknown',{skill_id:'unknown'},'UNKNOWN_ID'],['unavailable',{skill_id:'unavailable'},'NOT_OBSERVABLE'],['permission',{skill_id:'restricted'},'BLOCKED']]){const r=await run({operation:'select',task_id,...selection});assert.equal(r.result.status,expected,JSON.stringify(r));assert.equal(r.task.usage.verified,'NOT_RUN');}
   const simple=studio.store.phase5Data().runs.find(r=>JSON.parse(r.summary_json||'{}').studio_skill?.view?.task_id==='simple'),language=JSON.parse(simple.raw_output).discovery_request;assert.equal(language.non_english,false);assert.equal(language.language_observation,'UNOBSERVED_LANGUAGE');
  });
  await t.test('Failed task criteria stay failed in durable history, never VERIFIED',async()=>{
   const r=await run({operation:'verify',task_id:'actual',skill_id:'json-audit',task_criteria:'{"all":[{"pointer":"/valid","op":"equals","value":false}]}'});
   assert.equal(r.task.usage.verified,'NOT_RUN');
   assert.equal((await request('GET',base+'/history')).data.find(x=>x.run_id===r.run_id).status,'failed');
  });
  await t.test('Qualification comes from3 real local executions and remains bound to its actual host tuple',async()=>{
   const r=await run({operation:'qualify',task_id:'actual',skill_id:'json-audit',input:{document:{name:'qualified-local'},required:['name']},task_criteria:'{"all":[{"pointer":"/valid","op":"equals","value":true}]}',runs:3});
   assert.equal(r.task.qualification.status,'QUALIFIED',JSON.stringify(r));assert.equal(r.task.qualification.record.host,'aghr-local-process');assert(r.task.qualification.record.qualifiedAt);assert.equal(r.task.qualification.record.hostVersion,process.version);
  });
  await t.test('Native requests block before any local driver fallback or qualification',async()=>{
   for(const host of ['codex','antigravity']){const r=await run({operation:'select',task_id:'native-'+host,host,query:'review'});assert.equal(r.result.engine_execution,'NOT_RUN');assert.equal(r.task.availability.registry,'DISCOVERY_UNAVAILABLE');assert.equal(r.records.length,0);assert.equal(r.task.qualification.status,'NOT_RUN');}
  });
  await t.test('Phase changes invalidate prepared intents and live selections; replay cannot execute',async()=>{
   const intent=await prepare({operation:'load',task_id:'actual',host:'aghr-local-process',skill_id:'json-audit'});
   await run({operation:'phase',task_id:'actual',phase:'review'});
   assert.equal((await request('POST',base+'/run',intent.payload,{'X-Write-Grant':intent.grant,'If-Match':JSON.stringify(intent.scope.proposal_version_hash)})).status,412);
   const view=(await request('GET',base+'/tasks/actual')).data;assert.equal(view.usage.selected,'NOT_RUN');assert.equal(view.usage.verified,'NOT_RUN');
   const history=(await request('GET',base+'/history')).data;assert(history.length>=10);assert(history.every(x=>x.trust.startsWith('HISTORICAL_ONLY')));
  });
  await t.test('CI submission integration requires a grant, preserves originals and prepares PR bytes without publishing',async()=>{
   assert.equal((await request('POST',base+'/ci-bundle',{task_id:'ci-task'})).status,403);
   const intent=(await request('POST',base+'/ci-intents',{task_id:'ci-task'})).data;studio.approveIntent(intent.id);
   const grant=(await request('GET','/api/v1/draft-intents/'+intent.id)).data.grant,headers={'X-Write-Grant':grant,'If-Match':JSON.stringify(intent.scope.proposal_version_hash)};
   const r=await request('POST',base+'/ci-bundle',{task_id:'ci-task'},headers);assert.equal(r.status,200,JSON.stringify(r));
   assert.equal(r.data.status,'PREPARED_NOT_SUBMITTED');assert.equal(r.data.published,false);assert.equal(r.data.state_written,false);
   assert.deepEqual(Buffer.from(r.data.files[0].base64,'base64'),original);assert.deepEqual(fs.readFileSync(project+'/.aghr/runtime_evidence/ci-task.jsonl'),original);
   assert.equal(JSON.parse(Buffer.from(r.data.files[1].base64,'base64')).local_report.exit_code,0);
   assert.equal((await request('POST',base+'/ci-bundle',{task_id:'ci-task'},headers)).status,403);
   const stale=(await request('POST',base+'/ci-intents',{task_id:'ci-task'})).data;studio.approveIntent(stale.id);const staleGrant=(await request('GET','/api/v1/draft-intents/'+stale.id)).data.grant;
   fs.writeFileSync(project+'/.aghr/runtime_evidence/ci-task.jsonl',Buffer.from(original.toString('utf8').replace('UNAUTHENTICATED_SOURCE','CHANGED_VALID_SOURCE')));
   assert.equal((await request('POST',base+'/ci-bundle',{task_id:'ci-task'},{'X-Write-Grant':staleGrant,'If-Match':JSON.stringify(stale.scope.proposal_version_hash)})).status,412);
   assert.equal(fs.existsSync(project+'/.aghr/state.json'),false);
  });
  if(process.env.AGHR_PHASE3_OUT)fs.writeFileSync(path.join(process.env.AGHR_PHASE3_OUT,'SKILL_HTTP_ACCEPTANCE.json'),JSON.stringify({status:'PASS_FOR_LOCAL_LIFECYCLE',results,history:studio.store.skillRuns(),native:'NOT_RUN',source_written:false,state_written:false},null,2),{flag:'wx'});
 }finally{await new Promise(r=>server.close(r));await studio.close();}
});
