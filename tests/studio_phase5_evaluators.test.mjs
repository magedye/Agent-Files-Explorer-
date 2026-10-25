import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import {createDraftStudio} from '../server/studio/draft-runtime.js';
import {registeredProject} from '../server/studio/phase5/project.mjs';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('actual Agent-Files-Explorer evaluator registration, live E4 and project-bound Draft review',async t=>{
 const config=registeredProject(),root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-phase5-project-'));
 const before=Object.fromEntries(['server/security.js','governance_packages/candidates/AGHR_rc3_Core_Candidate/aghr.json','governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json'].map(p=>[p,sha(fs.readFileSync(p))]));
 const studio=await createDraftStudio({python,storageRoot:root,actor:'actual-project-owner',evidenceProjectRoot:config.project.root,...config}),server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,p='/api/v1/workspaces/rc3-local/phase4',evidence=[];
 const request=async(method,route,body,headers={})=>{const r=await fetch(origin+route,{method,headers:{'X-Studio-Token':studio.session.token,...(body?{'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();evidence.push({method,route,status:r.status,error:value.meta?.error?.code,data:value.data});return {status:r.status,...value};};
 const op=async(operation,data={},cp_id,token)=>{const input={operation,...(cp_id?{cp_id}:{}),data},i=await request('POST',p+'/intents',input,token?{'X-Studio-Token':token}:{});assert.equal(i.status,200,JSON.stringify(i));studio.approveIntent(i.data.id);const grant=studio.intents.get(i.data.id).grant;return request('POST',p+'/run',input,{'X-Write-Grant':grant,'If-Match':JSON.stringify(i.data.scope.proposal_version_hash),...(token?{'X-Studio-Token':token}:{})});};
 try{
  await t.test('registration scopes both actual available evaluators to the named repository',async()=>{const s=(await request('GET',p)).data;assert.equal(s.measurement_configured,true);assert.equal(s.meta_eval_configured,true);assert.equal(s.scope,config.project.scope);assert(s.host_inventory.skills.every(s=>s.available));assert.equal((await request('GET','/api/v1/settings')).data.project.id,'agent-files-explorer');});
  await t.test('real Arabic NO_SKILL_MATCH is a valid observed recall outcome and never an execution claim',async()=>{
   const prefix='/api/v1/workspaces/rc3-local/skill-lifecycle',input={operation:'select',task_id:'arabic-no-match',host:'aghr-local-process',query:'مهمة فلكية لا علاقة لها بالمخططات'};
   const i=await request('POST',prefix+'/intents',input);assert.equal(i.status,200,JSON.stringify(i));studio.approveIntent(i.data.id);const r=await request('POST',prefix+'/run',input,{'X-Write-Grant':studio.intents.get(i.data.id).grant,'If-Match':JSON.stringify(i.data.scope.proposal_version_hash)});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.result.status,'NO_SKILL_MATCH');
   const m=(await request('GET','/api/v1/workspaces/rc3-local/metrics/current')).data;assert.equal(m.metrics.discovery_recall_multilingual_pct.value,100);assert.equal(m.metrics.discovery_recall_multilingual_pct.denominator,1);assert.equal(m.discovery_accuracy.value,null);assert.equal(r.data.task.usage.verified,'NOT_RUN');
  });
  await t.test('actual3-run historical1.2 observation fails after owner rc.3 switch and cannot create measured evidence',async()=>{
   const e=await op('calibration.eval',{item_id:'OBS-REFERENCE-STATE-001',reason:'Measure the declared default from actual source bytes'});assert.equal(e.status,422,JSON.stringify(e));assert.equal(e.meta.error.code,'EVAL_NOT_PASSED');
   const raw=studio.store.phase5Data().runs;assert(raw.some(r=>r.raw_output.includes('two actual reads')));assert(raw.some(r=>/before_metric\\?":\s*0/.test(r.raw_output)));
   const c=await op('calibration.create',{item_id:'OBS-REFERENCE-STATE-001',eval_run_id:'VR-no-passed-eval',reason:'Measure the declared default from actual source bytes',measured_delta:0});assert.equal(c.status,422,JSON.stringify(c));assert.equal(c.meta.error.code,'LIVE_PASSED_EVAL_REQUIRED');
  });
  await t.test('additive schema meta gate blocks before real eval, passes checks after3 executions and still requires distinct approvals',async()=>{
   const f={path:'schemas/project-metadata.schema.json',content:JSON.stringify({type:'object',required:['name'],properties:{name:{type:'string'}},'x-aghr-examples':{valid:[{name:'AGHR'}],invalid:[{}, {name:42}]}})};
   let c=await op('meta.create',{title:'Actual additive schema evaluation',files:[f]});assert.equal(c.status,200,JSON.stringify(c));const id=c.data.id;
   assert.equal((await op('submit',{},id)).status,200);assert.equal((await op('review',{decision:'approve',reason:'Configured alone is insufficient'},id)).status,422);
   const e=await op('meta.evaluate',{},id);assert.equal(e.status,200,JSON.stringify(e));assert.equal(e.data.status,'PASS');
   assert.equal((await op('review',{decision:'approve',reason:'Actual schema examples, negative controls and L1 generation passed'},id)).data.status,'in_review');
   const architect=studio.authority.createPrincipal({actor:'actual-local-architect',role:'architecture-board'});
   c=await op('review',{decision:'approve',reason:'Separate Draft architecture review'},id,architect.token);assert.equal(c.status,200,JSON.stringify(c));assert.equal(c.data.status,'approved');assert.equal(c.data.approvals.length,2);
   const records=studio.store.phase5Data().runs;assert(records.some(r=>r.raw_output.includes('PRIN-007')));assert(records.some(r=>r.raw_output.includes('authority-negative')));
  });
  await t.test('registered evaluator rejects unsupported tools and cannot claim broad qualification',async()=>{
   const c=await op('meta.create',{title:'Unsupported tool change',files:[{path:'tools/proposed.py',content:'raise RuntimeError("MUST_NOT_EXECUTE")\n'}]});assert.equal(c.status,200);const e=await op('meta.evaluate',{},c.data.id);assert.equal(e.status,422);const raw=studio.store.phase5Data().runs;assert(raw.some(r=>r.raw_output.includes('META_EVALUATOR_SCOPE_UNSUPPORTED')));
   const m=(await request('GET','/api/v1/workspaces/rc3-local/metrics/current')).data;assert.equal(m.metrics.eval_pass_rate_pct.value,100);assert(Math.abs(m.metrics.skill_eval_pass_rate_pct.value-100/3)<1e-9);assert.equal(m.honesty.value,null);assert.equal(m.discovery_accuracy.value,null);
  });
 }finally{
  const data={profile:'ACTUAL_PROJECT_LOCAL_PROCESS_ONLY',project:config.project,source_unchanged:Object.entries(before).every(([p,h])=>sha(fs.readFileSync(p))===h),before,requests:evidence,run_records:studio.store.phase5Data().runs,native:'REQUIRED / NOT_RUN / NOT_WAIVED'};
  const out=process.env.AGHR_PHASE5_EVAL_OUT;if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/PROJECT_EVALUATORS.json',JSON.stringify(data,null,2),{flag:'wx'});}await new Promise(r=>server.close(r));await studio.close();assert.equal(data.source_unchanged,true);
 }
});
