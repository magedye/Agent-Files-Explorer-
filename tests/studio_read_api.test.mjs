import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { createStudio } from '../server/studio/runtime.js';
import { createSession } from '../server/studio/auth.js';
import {createCatalog} from '../server/studio/db/catalog.js';
import {createReadRoutes} from '../server/studio/routes.js';
import {syntheticBridge} from './helpers/studio_vectors.mjs';

test('T04 actual HTTP session, list/detail, query, identity, mutation and origin rejection',async()=>{
 const studio=await createStudio({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe')});
 const server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/api/v1`;
 const get=async(p,options={})=>{const r=await fetch(base+p,{...options,headers:{'X-Studio-Token':studio.session.token,...options.headers}});return {status:r.status,body:await r.json()};};
 try{
  const session=await get('/session');assert.equal(session.status,200);assert.equal(session.body.data.server_resolved_role,'developer');
  const ws=await get('/workspaces');assert.equal(ws.body.data[0].read_only,true);
  const list=await get('/workspaces/rc3-local/instructions?limit=1');assert.equal(list.status,200);assert.equal(list.body.meta.total,1);assert.equal(list.body.meta.next_cursor,null);
  const v=list.body.data[0];assert.equal((await get('/workspaces/rc3-local/instructions/'+v.item.id)).status,200);
  assert.equal((await get('/workspaces/rc3-local/capabilities/matrix')).body.data.cells.length,0);
  for(const query of ['language=ar','role=governance-owner','limit=0','limit=501','limit=1&limit=2','kind=FAKE','is_review_due=maybe','q=x&token=secret'])assert.equal((await get('/workspaces/rc3-local/instructions?'+query)).status,400,query);
  assert.equal((await get('/workspaces/rc3-local/instructions?cursor=invalid')).status,400);
  assert.equal((await get('/workspaces/absent/instructions')).status,404);
  assert.equal((await get('/workspaces/rc3-local/instructions/absent')).status,404);
  assert.equal((await get('/session',{headers:{'X-Studio-Token':'wrong'}})).status,401);
  assert.equal((await get('/session',{headers:{'X-Studio-Token':'!'.repeat(64)}})).status,401);
  assert.equal((await get('/workspaces/rc3-local/instructions/%')).status,400);
  assert.equal((await get('/session',{headers:{'X-Studio-Role':'governance-owner'}})).status,400);
  assert.equal((await get('/session',{headers:{Origin:'https://foreign.invalid'}})).status,403);
  for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal((await get('/workspaces',{method})).status,403);
 }finally{await new Promise(r=>server.close(r));studio.close();}
});
test('T04 synthetic pagination preserves every ID and binds cursor to filters',async()=>{
 const catalog=createCatalog(),session=createSession(),bridge=syntheticBridge();await catalog.scan(bridge);
 const server=http.createServer(createReadRoutes({catalog,session,bridge}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}/api/v1/workspaces/rc3-local/instructions`;
 const request=async query=>{const r=await fetch(base+query,{headers:{'X-Studio-Token':session.token}});return {status:r.status,body:await r.json()};};
 try{
  let cursor=null,ids=[];
  do{const r=await request('?limit=1'+(cursor?'&cursor='+cursor:''));assert.equal(r.status,200);ids.push(r.body.data[0].item.id);cursor=r.body.meta.next_cursor;}while(cursor);
  assert.equal(ids.length,4);assert.equal(new Set(ids).size,4);
  const first=await request('?limit=1');
  assert.equal((await request('?q=changed&cursor='+first.body.meta.next_cursor)).status,409);
  assert.equal((await request('?is_review_due=true')).body.data.length,1);
 }finally{await new Promise(r=>server.close(r));catalog.close();}
});
test('T04 credential rotation and expiry',()=>{
 const a=createSession(),b=createSession();assert.notEqual(a.token,b.token);
 assert.throws(()=>a.authenticate({socket:{remoteAddress:'127.0.0.1'},headers:{host:'127.0.0.1:1234','x-studio-token':'ع'.repeat(64)}}),/credential/);
 const expired=createSession({ttlMs:-1});assert.throws(()=>expired.authenticate({socket:{remoteAddress:'127.0.0.1'},headers:{host:'127.0.0.1:1234','x-studio-token':expired.token}}),/expired/);
});
