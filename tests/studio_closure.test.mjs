import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createUnifiedStudio} from '../server/studio/unified-runtime.mjs';
test('T36 CP closure requires exact signed post-merge proof; records closure in Draft audit only',async()=>{
 const studio=await createUnifiedStudio({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),storageRoot:fs.mkdtempSync(path.join(os.tmpdir(),'aghr-ci-close-')),actor:'closure-owner'}),server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,source=studio.pilots.get('pilot-app-l2'),id=source.historicalCp.id,route='/workspaces/pilot-app-l2/cps/'+id+'/close';
 const request=async(method,route,body,headers={})=>{const r=await fetch(origin+'/api/v1'+route,{method,headers:{'X-Studio-Token':studio.session.token,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,...await r.json()};};
 try{
  assert.equal((await request('POST',route)).status,403);
  assert.equal((await request('POST','/cp-close-intents',{workspace_id:'rc3-local',cp_id:'CP-without-ci-proof'})).status,409);
  const i=await request('POST','/cp-close-intents',{workspace_id:'pilot-app-l2',cp_id:id});assert.equal(i.status,200,JSON.stringify(i));studio.approveIntent(i.data.id);const headers={'X-Write-Grant':studio.intents.get(i.data.id).grant,'If-Match':JSON.stringify(i.data.scope.proposal_version_hash)};
  assert.equal((await request('POST',route,undefined,{...headers,'If-Match':'"sha256:'+ '0'.repeat(64)+'"'})).status,412);
  const closed=await request('POST',route,undefined,headers);assert.equal(closed.status,200,JSON.stringify(closed));assert.equal(closed.data.status,'closed');const schema=await studio.schema('api.change.schema.json','Package',[closed.data]);assert.equal(schema.valid,true,JSON.stringify(schema));assert.equal((await request('POST',route,undefined,headers)).status,403);
  const reread=await request('GET','/workspaces/pilot-app-l2/cps/'+id);assert.equal(reread.data.status,'closed');assert.equal(studio.store.closedPublishedPackages().length,1);assert.equal(studio.store.closedPublishedPackages()[0].state_written,false);studio.pilots.recheck();
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await studio.close();}
});
