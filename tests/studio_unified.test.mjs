import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import WebSocket from 'ws';
import {createUnifiedStudio} from '../server/studio/unified-runtime.mjs';
import {createPilotCatalog,verifyPublishedReceipt} from '../server/studio/projects/pilots.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('T36 published pilot trust fails closed on self-declared, altered state and source',()=>{
 const catalog=createPilotCatalog();assert.equal(catalog.list().length,2);
 const record=catalog.get('pilot-app-l3'),bytes=fs.readFileSync(record.receipt_path),read=p=>fs.readFileSync(path.join(record.root,p));
 assert.throws(()=>verifyPublishedReceipt(bytes,'0'.repeat(64),read),/RECEIPT_DRIFT/);
 assert.throws(()=>verifyPublishedReceipt(bytes,hash(bytes),p=>p==='.aghr/state.json'?Buffer.from('{}'):read(p)),/STATE_UNVERIFIED/);
 assert.throws(()=>verifyPublishedReceipt(bytes,hash(bytes),p=>p==='AGENTS.md'?Buffer.from('tampered'):read(p)),/SOURCE_DRIFT/);
 const altered=JSON.parse(bytes);altered.signed_receipt.signature='A'.repeat(88);const raw=Buffer.from(JSON.stringify(altered));assert.throws(()=>verifyPublishedReceipt(raw,hash(raw),read),/SIGNATURE_INVALID/);
});
test('T36 unified project reads, canonical responses, real strict CLI and authenticated WS',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t36-')),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
 const studio=await createUnifiedStudio({python,storageRoot:root,actor:'t36-owner'}),server=http.createServer(studio.handle);studio.attachStreams(server);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port,base='/workspaces/rc3-local';
 const checkedSchema=async(...args)=>{try{return await studio.schema(...args);}catch(error){if(process.env.AGHR_EVIDENCE_OUT&&error.receipt)fs.writeFileSync(path.join(process.env.AGHR_EVIDENCE_OUT,'SCHEMA_FAILURE.json'),JSON.stringify({message:error.message,schema:error.schema,definition:error.definition,receipt:error.receipt},null,2)+'\n');throw error;}};
 const call=async(route,method='GET',body,headers={})=>{const r=await fetch(origin+'/api/v1'+route,{method,headers:{'X-Studio-Token':studio.session.token,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,...await r.json()};};
 try{
  await t.test('three source workspaces, historical L2/L3, fresh qualifications NOT_RUN',async()=>{const all=await call('/workspaces');assert.equal(all.status,200);assert.equal(all.data.length,3);const check=await checkedSchema('api.read.schema.json','Workspace',all.data);assert.equal(check.valid,true,JSON.stringify(check));for(const id of ['pilot-app-l2','pilot-app-l3']){const r=await call('/workspaces/'+id+'/published');assert.equal(r.data.receipt.status,'VERIFIED_HISTORICAL_SANDBOX_CI');assert.equal(r.data.live_qualification,'NOT_RUN');const items=await call('/workspaces/'+id+'/instructions');const v=await checkedSchema('api.read.schema.json','ItemView',items.data);assert.equal(v.valid,true,JSON.stringify(v));assert(items.data.every(i=>i.validation_status==='NOT_RUN'));assert.equal((await call('/workspaces/'+id+'/scan','POST')).status,403);}});
  await t.test('root read catalog connected without weakening role checks',async()=>{const r=await call(base+'/instructions');assert.equal(r.status,200);assert(r.data.length>0);assert.equal((await call(base+'/instructions','GET',undefined,{'X-Studio-Role':'owner'})).status,400);});
  await t.test('real CLI completion, WS status/stdout frames, one-use ticket and SARIF',async()=>{
   const input={request:{command:'validate',args:['--strict']}},i=await call('/verification-intents','POST',input);assert.equal(i.status,200,JSON.stringify(i));studio.approveIntent(i.data.id);const started=await call(base+'/verify/run','POST',input.request,{'X-Write-Grant':studio.intents.get(i.data.id).grant,'If-Match':JSON.stringify(i.data.scope.proposal_version_hash)});assert.equal(started.status,202);const id=started.data.run_id;
   const ticket=await call(base+'/verify/runs/'+id+'/stream-ticket');assert.equal(ticket.status,200);const address=origin.replace('http:','ws:')+'/api/v1'+base+'/verify/runs/'+id+'/stream',protocols=['aghr.stream.v1','ticket.'+ticket.data.ticket];
   const frames=await new Promise((resolve,reject)=>{const frames=[],ws=new WebSocket(address,protocols,{origin});const timer=setTimeout(()=>{ws.terminate();reject(Error('WS_TIMEOUT'));},45000);ws.on('error',e=>{clearTimeout(timer);reject(e);});ws.on('message',b=>frames.push(JSON.parse(b)));ws.on('close',()=>{clearTimeout(timer);resolve(frames);});});
   assert(frames.some(f=>f.type==='stdout'));assert(frames.some(f=>f.type==='status'&&f.status==='passed'));const check=await checkedSchema('api.execution.schema.json','StreamFrame',frames);assert.equal(check.valid,true,JSON.stringify(check));
   await new Promise((resolve,reject)=>{const ws=new WebSocket(address,protocols,{origin});ws.on('open',()=>reject(Error('TICKET_REPLAY')));ws.on('error',()=>resolve());});
   const sarif=await call(base+'/verify/runs/'+id+'/sarif');assert.equal(sarif.status,200);assert.equal(sarif.data.runs[0].invocations[0].executionSuccessful,true);
  });
 }catch(error){if(process.env.AGHR_EVIDENCE_OUT&&error.receipt)fs.writeFileSync(path.join(process.env.AGHR_EVIDENCE_OUT,'SCHEMA_FAILURE.json'),JSON.stringify({message:error.message,schema:error.schema,definition:error.definition,receipt:error.receipt},null,2)+'\n');throw error;}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await studio.close();}
});
