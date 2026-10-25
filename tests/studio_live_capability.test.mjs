import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createUnifiedStudio} from '../server/studio/unified-runtime.mjs';
import {currentCapabilities} from '../server/studio/projects/capabilities.mjs';
import {verifyPublishedReceipt} from '../server/studio/projects/pilots.mjs';
test('T36 capability API uses live execution/qualification receipts and never restores qualification from history',async()=>{
 const options={python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),storageRoot:fs.mkdtempSync(path.join(os.tmpdir(),'aghr-live-card-')),actor:'live-card-owner'};let studio=await createUnifiedStudio(options);const server=http.createServer((req,res)=>studio.handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,base='/workspaces/rc3-local/skill-lifecycle',cap='/workspaces/pilot-app-l3/capabilities/CAP-PILOT-SQL',records=[];
 const request=async(method,route,body,headers={})=>{const r=await fetch(origin+'/api/v1'+route,{method,headers:{'X-Studio-Token':studio.session.token,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const value={status:r.status,...await r.json()};records.push({method,route,...value});return value;};
 let taskId='t36-without-execution';const run=async operation=>{const value={task_id:taskId,host:'aghr-local-process',skill_id:'pilot-sql-readonly',...operation},i=await request('POST',base+'/intents',value);assert.equal(i.status,200,JSON.stringify(i));studio.approveIntent(i.data.id);return request('POST',base+'/run',value,{'X-Write-Grant':studio.intents.get(i.data.id).grant,'If-Match':JSON.stringify(i.data.scope.proposal_version_hash)});};
 const input={expected_rows:3},task_criteria=JSON.stringify({all:[{pointer:'/valid',op:'equals',value:true},{pointer:'/project',op:'equals',value:'pilot-app-l3'},{pointer:'/rows',op:'equals',value:3},{pointer:'/denied',op:'equals',value:5},{pointer:'/unchanged',op:'equals',value:true}]});
 try{
  assert.deepEqual((await request('GET',cap+'/qualification')).data,[]);assert.equal((await run({operation:'select',query:'مراجعة',phase:'review'})).status,200);assert.equal((await run({operation:'load'})).status,200);
  await run({operation:'verify',task_criteria});let usage=await request('GET',cap+'/usage');assert.equal(usage.status,200,JSON.stringify(usage));assert(usage.data.every(r=>r.verified.state!=='VERIFIED'));
  taskId='t36-real-card';assert.equal((await run({operation:'select',query:'review',phase:'review'})).status,200);assert.equal((await run({operation:'load'})).status,200);
  assert.equal((await run({operation:'execute',input})).status,200);assert.equal((await run({operation:'verify',task_criteria})).status,200);usage=await request('GET',cap+'/usage');assert(usage.data.some(r=>r.executed.state==='EXECUTED'&&r.verified.state==='VERIFIED'&&r.verified.evidence.length>0));
  assert.equal((await run({operation:'eval',input,task_criteria,runs:3})).status,200);assert.equal((await run({operation:'qualify',input,task_criteria,runs:3})).status,200);
  const qualified=await request('GET',cap+'/qualification');assert.equal(qualified.status,200,JSON.stringify(qualified));assert.equal(qualified.data.length,1,JSON.stringify(qualified));assert.equal(qualified.data[0].status,'QUALIFIED');assert.equal(qualified.data[0].scope,'pilot-app-l3/**');
  const matrix=await request('GET','/workspaces/pilot-app-l3/capabilities/matrix');assert.equal(matrix.data.cells.length,1);assert.equal((await request('GET',cap+'/qualification?host_version=FOREIGN_VERSION')).data.length,0);assert.equal((await request('GET',cap+'/qualification?scope=foreign%2F**')).data.length,0);
  // Only an isolated byte-for-byte copy is altered. This is a source-identity
  // rejection test, never a claim that the copied project was qualified.
  const source=studio.pilots.get('pilot-app-l3'),clone=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-source-identity-'));
  for(const relative of new Set([...Object.keys(source.payload.files),'.aghr/state.json',source.payload.evidence.path])){const dest=path.join(clone,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(source.root,relative),dest);}
  const receipt=fs.readFileSync(source.receipt_path),verify=()=>verifyPublishedReceipt(receipt,source.receipt_hash.slice(7),relative=>fs.readFileSync(path.join(clone,relative)));
  assert.equal(currentCapabilities(source,studio,verify).matrix.cells.length,1);
  fs.appendFileSync(path.join(clone,'app/security.py'),'\n# isolated identity change\n','utf8');assert.throws(()=>currentCapabilities(source,studio,verify),/PILOT_SOURCE_DRIFT/);
  for(const [def,value]of [['Qualifications',qualified.data],['Usages',usage.data],['Matrix',matrix.data]]){const r=await studio.schema('api.read.schema.json',def,[value]);assert.equal(r.valid,true,JSON.stringify(r));}
  await studio.close();studio=await createUnifiedStudio(options);assert.deepEqual((await request('GET',cap+'/qualification')).data,[]);assert.deepEqual((await request('GET',cap+'/usage')).data,[]);studio.pilots.recheck();
 }finally{if(process.env.AGHR_EVIDENCE_OUT)fs.writeFileSync(path.join(process.env.AGHR_EVIDENCE_OUT,'LIVE_CAPABILITY_HTTP.json'),JSON.stringify(records,null,2)+'\n');server.closeAllConnections();await new Promise(r=>server.close(r));await studio.close();}
});
