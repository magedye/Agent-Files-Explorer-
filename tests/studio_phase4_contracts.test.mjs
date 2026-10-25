import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createDraftStudio} from '../server/studio/draft-runtime.js';
import {createSchemaReader} from '../server/studio/schema-reader.js';
import {encodeJsonl} from '../tools/contracts/evidence_jsonl.mjs';
test('Phase4 preserves frozen CP reads and cannot turn an asserted causal explanation into proven knowledge',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-p4-contract-')),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),dir=root+'/.aghr/runtime_evidence';fs.mkdirSync(dir,{recursive:true});
 const at=new Date().toISOString(),raw=encodeJsonl([{task_id:'causal-test',session:{agent:'UNAUTHENTICATED',agent_version:'1',host_os:'windows',started_at:at},events:[{at,type:'skill.blocked',skill_id:'example',status:'BLOCKED',reason:'Declared observation only'}],submit_to_ci:false}]);fs.writeFileSync(dir+'/causal-test.jsonl',raw);
 const studio=await createDraftStudio({python,storageRoot:root,actor:'contract-owner',evidenceProjectRoot:root}),server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,prefix='/api/v1/workspaces/rc3-local/phase4';
 const request=async(method,url,body,headers={})=>{const r=await fetch(origin+url,{method,headers:{'X-Studio-Token':studio.session.token,'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,...await r.json()};};
 const run=async data=>{const payload={operation:'lesson.create',data},intent=(await request('POST',prefix+'/intents',payload)).data;studio.approveIntent(intent.id);const grant=(await request('GET','/api/v1/draft-intents/'+intent.id)).data.grant;return request('POST',prefix+'/run',payload,{'X-Write-Grant':grant,'If-Match':JSON.stringify(intent.scope.proposal_version_hash)});};
 try{
  const source=(await request('GET','/api/v1/workspaces/rc3-local/evidence/tasks/causal-test')).data,d={title:'Causal review',task_id:'causal-test',source_hash:source.source_hash,error:'Unproven failure',pattern:'Review before claiming causality',cause:'UNPROVEN',knowledge_type:'lesson',instruction_kind:'UNRESOLVED',scope:'project',authority_level:'UNRESOLVED',disposition:'propose',duplicates:[],conflicts:[]};
  const supported=await run({...d,cause:'SUPPORTED',cause_evidence:'Client claims this string proves the cause'});assert.equal(supported.status,422);assert.match(supported.meta.error.message,/CAUSE_EVIDENCE_UNVERIFIED/);
  const created=await run(d);assert.equal(created.status,200,JSON.stringify(created));const legacy=await request('GET','/api/v1/workspaces/rc3-local/change-packages/'+created.data.id);assert.equal(legacy.status,200);assert.equal(legacy.data.phase4,undefined);
  const schema=await createSchemaReader({python})('api.change.schema.json','Package',[legacy.data]);assert.equal(schema.valid,true,JSON.stringify(schema));
  const extended=await request('GET',prefix+'/packages/'+created.data.id);assert.equal(extended.data.phase4.body.cause,'UNPROVEN');assert.equal(extended.meta.contract_revision,'phase4-local.1');assert.deepEqual(fs.readFileSync(dir+'/causal-test.jsonl'),raw);assert.equal(fs.existsSync(root+'/.aghr/state.json'),false);
  const writeUrl='/api/v1/workspaces/rc3-local/cps/'+created.data.id+'/submit';assert.equal((await request('POST',writeUrl,{})).status,403);assert.equal((await fetch(origin+writeUrl,{method:'POST'})).status,403);
  const item=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json','utf8'));
  const bypass=await request('POST','/api/v1/draft-intents',{title:'Bypass calibration through ordinary editing',kind:item.kind,target_item_id:item.id,proposed_yaml:JSON.stringify({...item,impact:{...item.impact,evidence:'repo-measured',lastCalibrated:'2026-10-24',measuredDelta:999}})});assert.equal(bypass.status,422,JSON.stringify(bypass));assert.match(bypass.meta.error.message,/USE_LIVE_CALIBRATION_WORKFLOW/);
  if(process.env.AGHR_PHASE4_CONTRACT_OUT)fs.writeFileSync(process.env.AGHR_PHASE4_CONTRACT_OUT,JSON.stringify({status:'PASS',unsupported_causality:supported,contract_validation:schema,legacy:legacy.data,extended:extended.data,source_written:false,state_written:false},null,2),{flag:'wx'});
 }finally{await new Promise(r=>server.close(r));await studio.close();}
});
