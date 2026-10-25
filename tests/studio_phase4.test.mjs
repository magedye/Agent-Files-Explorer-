import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import {createDraftStudio} from '../server/studio/draft-runtime.js';
import {encodeJsonl} from '../tools/contracts/evidence_jsonl.mjs';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
import {fixtureConfiguration} from './helpers/phase4-fixture.mjs';

test('Phase4 real HTTP Draft CP,7-step adoption, watcher, lessons and measured calibration forbid automatic policy writes',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-phase4-test-')),config=fixtureConfiguration(root);fs.mkdirSync(root+'/inbox');const evidenceRoot=root+'/project/.aghr/runtime_evidence';fs.mkdirSync(evidenceRoot,{recursive:true});
 const at=new Date().toISOString(),original=encodeJsonl([{task_id:'lesson-error',session:{agent:'UNAUTHENTICATED_SOURCE',agent_version:'1',host_os:'windows',started_at:at},events:[{at,type:'skill.blocked',skill_id:'json-audit',status:'BLOCKED',reason:'Permission was absent; causality requires review.'}],submit_to_ci:false}]);fs.writeFileSync(evidenceRoot+'/lesson-error.jsonl',original);
 const studio=await createDraftStudio({python,storageRoot:root,actor:'actual-owner-test',evidenceProjectRoot:root+'/project',...config}),server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const prefix='/api/v1/workspaces/rc3-local/phase4',origin='http://127.0.0.1:'+server.address().port,records=[],failures=[];
 const request=async(method,url,data,headers={},token=studio.session.token)=>{const r=await fetch(origin+url,{method,headers:{'X-Studio-Token':token,'Content-Type':'application/json',...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});return {status:r.status,...await r.json()};};
 const prepare=async(payload,token)=>{const r=await request('POST',prefix+'/intents',payload,{},token);assert.equal(r.status,200,JSON.stringify(r));studio.approveIntent(r.data.id);const grant=(await request('GET','/api/v1/draft-intents/'+r.data.id,undefined,{},token)).data.grant;return {payload,...r.data,grant};};
 const apply=async(intent,token)=>{const r=await request('POST',prefix+'/run',intent.payload,{'X-Write-Grant':intent.grant,'If-Match':JSON.stringify(intent.scope.proposal_version_hash)},token);records.push(r);return r;};
 const op=async(operation,data,cp_id,token)=>apply(await prepare({operation,...(cp_id?{cp_id}:{}),data},token),token);
 const scenario=(name,fn)=>t.test(name,async()=>{try{await fn();}catch(e){failures.push({name,message:e.message});throw e;}});
 const originalPolicy=fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json'),item=JSON.parse(originalPolicy);let meta,adoption,calibration,evalResult;
 try{
  await scenario('Auth denies every ungranted Phase4 write and never accepts client PASS or role fields',async()=>{
   assert.equal((await request('POST',prefix+'/run',{operation:'meta.create',data:{}})).status,403);
   assert.equal((await op('calibration.create',{item_id:item.id,eval_run_id:'VR-forged',measured_delta:1,reason:'claimed'})).status,422);
   assert.equal((await op('calibration.eval',{item_id:item.id,reason:'measured',passed:true})).status,422);
  });
  await scenario('T25 policies/schemas/tools route to CP with two actual reviewer roles; missing behavioral/generation gates block approval',async()=>{
   for(const file of [{path:'policies/draft.json',content:JSON.stringify({...item,id:'OBS-NEW'})},{path:'schemas/sample.json',content:'{"type":"string"}'},{path:'tools/proposed.py',content:'raise RuntimeError("MUST_NOT_EXECUTE")\n'}]){const r=await op('meta.create',{title:'Change '+file.path,files:[file]});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.kind,'GENERATED_FILE');assert.equal(r.data.phase4.lane,'meta');assert.deepEqual(r.data.required_approvals,['governance-owner','architecture-board']);meta=r.data;}
   assert.equal((await op('submit',{},meta.id)).data.status,'in_review');assert.equal((await op('review',{decision:'approve',reason:'owner'},meta.id)).status,422);
   assert.equal((await op('review',{decision:'reject',reason:'Need actual gates'},meta.id)).data.status,'rejected');
   const stale=await prepare({operation:'submit',cp_id:meta.id,data:{}});
   const edited=await op('edit',{...meta.phase4.body,title:'Edited after review'},meta.id);assert.equal(edited.status,200,JSON.stringify(edited));assert.equal(edited.data.approvals.length,0);assert.equal(edited.data.approval_history.length,1);assert.equal((await apply(stale)).status,412);meta=edited.data;
   assert.equal((await request('POST','/api/v1/workspaces/rc3-local/cps/'+meta.id+'/submit')).status,403);
   const bad=await op('meta.create',{title:'Mandatory without authority',files:[{path:'policies/bad.json',content:JSON.stringify({...item,kind:'RULE',force:'MUST'})}]});assert.equal(bad.status,422);
   assert.equal((await op('meta.create',{title:'Escape',files:[{path:'schemas/../../state.json',content:'{}'}]})).status,422);
  });
  await scenario('T26 steps cannot be skipped; real local qualification is required before step7; adoption is the same CP',async()=>{
   let r=await op('adoption.create',{title:'Adopt actual JSON procedure',skill_id:'json-audit',project_id:'test-project',source:'project',function:'verification'});assert.equal(r.status,200,JSON.stringify(r));adoption=r.data;const cpId=adoption.id;
   assert.equal((await op('adoption.step',{step:7,output:{}},cpId)).status,422);
   const cap={...item,id:'CAP-JSON-AUDIT',kind:'CAPABILITY',skillId:'json-audit',source:'project',function:'verification',permissions:{read:[],write:[],network:'deny',secrets:'deny'},inputs:[],outputs:[],skillQualification:{skillId:'json-audit',host:'aghr-local-process',hostVersion:process.version,scope:'**/*',contentHash:'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(root+'/SKILL.md')).digest('hex'),status:'NOT_RUN'}};
   for(const [step,output]of [[2,{preferred:true,alternatives:[],rationale:'Only selected registered procedure'}],[3,{kind:'PROJECT_SELECTION',project_id:'test-project',selections:[{skill_id:'json-audit',preferred:true,alternatives:[],rationale:'Scoped local test'}]}],[4,cap],[5,{input:{document:{name:'real'},required:['name']},task_criteria:'{"all":[{"pointer":"/valid","op":"equals","value":true}]}'}],[6,[]],[7,{}]]){r=await op('adoption.step',{step,output},cpId);assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.id,cpId);adoption=r.data;}
   assert.equal(adoption.phase4.steps.length,7);assert.equal(JSON.parse(adoption.proposed_yaml).skillQualification.status,'QUALIFIED');assert.equal(adoption.phase4.installed,false);assert.equal((await op('submit',{},cpId)).data.status,'in_review');assert.equal((await op('review',{decision:'approve',reason:'Actual owner approves draft only'},cpId)).data.status,'approved');
  });
  await scenario('T27 actual fs.watch receives md/yaml/json, preserves raw bytes, deduplicates and never executes content',async()=>{
   const intent=await prepare({operation:'watch.start'});assert.equal((await apply(intent)).status,200);
   const bytes={'note.md':'# UNTRUSTED\nNever execute this input.','unsafe.yaml':'!!python/object/apply:os.system ["calc.exe"]','idea.json':'{"execute":"MUST_NOT_RUN"}'};
   for(const [name,content]of Object.entries(bytes))fs.writeFileSync(root+'/inbox/'+name,content);
   fs.mkdirSync(root+'/inbox/node_modules');fs.writeFileSync(root+'/inbox/node_modules/excluded.json','{}');fs.writeFileSync(root+'/inbox/ignored.exe','not executable');
   const end=Date.now()+60000;while(Date.now()<end&&studio.phase4.packages().filter(x=>x.phase4.lane==='intake').length<3)await new Promise(r=>setTimeout(r,300));
   const rows=studio.phase4.packages().filter(x=>x.phase4.lane==='intake');assert.equal(rows.length,3,JSON.stringify(studio.watcher.status()));for(const c of rows){assert.equal(c.status,'draft');assert.equal(c.phase4.automatic_execution,false);assert.deepEqual(Buffer.from(c.phase4.body.raw_base64,'base64'),fs.readFileSync(root+'/inbox/'+c.phase4.body.path));}
   fs.writeFileSync(root+'/inbox/note.md',bytes['note.md']);await new Promise(r=>setTimeout(r,1200));assert.equal(studio.phase4.packages().filter(x=>x.phase4.lane==='intake').length,3);assert.equal((await op('submit',{},rows[0].id)).status,422);
  });
  await scenario('T28 error→evidence→classified lesson creates only a CP; duplicate and foreign source reject',async()=>{
   const source=(await request('GET','/api/v1/workspaces/rc3-local/evidence/tasks/lesson-error')).data;
   const d={title:'Lesson from blocked procedure',task_id:'lesson-error',source_hash:source.source_hash,error:'Permission absent',pattern:'Check actual permission before execution',cause:'UNPROVEN',knowledge_type:'lesson',instruction_kind:'UNRESOLVED',scope:'project',authority_level:'UNRESOLVED',disposition:'propose',duplicates:[],conflicts:[]};
   const r=await op('lesson.create',d);assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.phase4.policy_promotion,false);assert.equal(r.data.status,'draft');assert.equal((await op('lesson.create',d)).status,409);assert.equal((await op('lesson.create',{...d,pattern:'Other',source_hash:'sha256:'+'f'.repeat(64)})).status,422);
  });
  await scenario('T29 actual3-run eval measures repository bytes; calibration needs exact target/delta and owner approval',async()=>{
   let r=await op('calibration.eval',{item_id:item.id,reason:'Measure documented default-package compliance'});assert.equal(r.status,200,JSON.stringify(r));evalResult=r.data;assert.equal(evalResult.status,'PASS');assert.equal(evalResult.measured_delta,1);
   assert.equal((await op('calibration.create',{item_id:item.id,eval_run_id:evalResult.eval_run_id,reason:'Measure documented default-package compliance',measured_delta:99})).status,422);
   r=await op('calibration.create',{item_id:item.id,eval_run_id:evalResult.eval_run_id,reason:'Measure documented default-package compliance',measured_delta:1});assert.equal(r.status,200,JSON.stringify(r));calibration=r.data;
   const proposed=JSON.parse(calibration.proposed_yaml);assert.equal(proposed.proposed_item.impact.evidence,'repo-measured');assert.equal(proposed.proposed_item.severity,item.severity);assert.equal(proposed.proposed_item.rule,item.rule);assert.equal(calibration.status,'draft');
   assert.equal((await op('review',{decision:'approve',reason:'Not submitted yet'},calibration.id)).status,422);
   assert.equal((await op('submit',{},calibration.id)).data.status,'in_review');assert.equal((await op('review',{decision:'approve',reason:'Owner approves measured Draft proposal only'},calibration.id)).data.status,'approved');
   const proof=await request('GET',prefix+'/packages/'+calibration.id+'/evidence');assert.equal(proof.status,200);assert(proof.data.some(r=>r.command==='eval'&&r.status==='passed'&&JSON.parse(r.raw_output).records.some(x=>x.operation==='execute'&&x.resource_profile==='eval')));
  });
  await scenario('Failed/unrelated eval cannot calibrate, source and state Sentinel remain unchanged',async()=>{
   fs.writeFileSync(config.repo+'/after.json','{"default_package":"legacy"}');assert.equal((await op('calibration.eval',{item_id:item.id,reason:'Failure must not pass'})).status,422);
   assert.equal((await op('calibration.create',{item_id:'wrong',eval_run_id:evalResult.eval_run_id,reason:'other',measured_delta:1})).status,404);
   fs.appendFileSync(root+'/SKILL.md','\nChanged after qualification.\n');assert.equal((await op('submit',{},adoption.id)).status,422);assert.equal((await op('submit',{},calibration.id)).status,422);
   assert.deepEqual(fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json'),originalPolicy);assert.deepEqual(fs.readFileSync(evidenceRoot+'/lesson-error.jsonl'),original);assert(!fs.existsSync(root+'/project/.aghr/state.json'));assert.equal(studio.store.tables.length,12);
  });
  if(process.env.AGHR_PHASE4_OUT)fs.writeFileSync(path.join(process.env.AGHR_PHASE4_OUT,'HTTP_ACCEPTANCE.json'),JSON.stringify({status:failures.length?'FAIL':'PASS',failures,records,packages:studio.phase4.packages(),audit:studio.store.auditEvents(1000),watcher:studio.watcher.status(),source_written:false,state_written:false,profile:'Actual local process and isolated measurement-repository fixture; no native or release claim.'},null,2),{flag:'wx'});
 }finally{await new Promise(r=>server.close(r));await studio.close();}
});
