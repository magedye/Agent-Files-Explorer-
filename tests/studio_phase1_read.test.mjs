import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {createReviewSource,readPinned} from '../server/studio/review-source.js';
import {createStudio} from '../server/studio/runtime.js';
import {instructionRows,filterRows} from '../src/features/phase0/read-view.js';
import {qualificationView} from '../server/studio/qualification-view.js';
import {createCatalog} from '../server/studio/db/catalog.js';
import {createSession} from '../server/studio/auth.js';
import {createReadRoutes} from '../server/studio/routes.js';
import {syntheticBridge} from './helpers/studio_vectors.mjs';

test('T07 frozen sample preserves all 15 categories, actual bytes, missing authority and pending review',()=>{
 const r=createReviewSource();assert.equal(r.items.length,50);assert.equal(new Set(r.items.map(i=>i.id)).size,50);assert.equal(new Set(r.items.map(i=>i.record_type)).size,15);
 assert.ok(r.items.every(i=>i.review.status==='PENDING_REVIEW'&&i.source_integrity==='VERIFIED_BYTES'));
 assert.ok(r.skills.every(s=>s.instructions.status==='EXISTS'));
 const rows=instructionRows([],r.items,'sample');assert.ok(filterRows(rows,{'force':'MUST'}).length>0);
 assert.equal(filterRows(rows,{'authority.level':'__missing'}).length,50);
 assert.equal(filterRows(rows,{q:'impossible phrase 92e081'}).length,0);
 assert.equal(filterRows(rows,{due:'true'}).length,0);
 assert.throws(()=>readPinned('../AGENTS.md'),/SOURCE_PATH_INVALID/);
 assert.throws(()=>readPinned('AGENTS.md','0'.repeat(64)),/SOURCE_HASH_MISMATCH/);
});

test('T07 actual HTTP source, history, relations and unknown paths reject without filesystem path input',async()=>{
 const studio=await createStudio({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe')});
 const server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const get=async p=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/v1`+p,{headers:{'X-Studio-Token':studio.session.token}});return {status:r.status,body:await r.json()};};
 try{
  assert.equal((await get('/review-sample/items')).body.data.length,50);
  const source=await get('/review-sample/items/AGHR-001/source');assert.equal(source.status,200);assert.equal(source.body.data.status,'VERIFIED_BYTES');
  for(const tail of ['missing/source','%2e%2e%2fAGENTS.md/source'])assert.equal((await get('/review-sample/items/'+tail)).status,404);
  assert.equal((await get('/review-sample/items?path=C:/Windows')).status,400);
  const qual=await get('/review-sample/skills/SKILL-governed-learning/qualification?host=Codex&host_version=unobserved&scope=src/**');
  assert.equal(qual.body.data.recorded_status,'NOT_RUN');assert.equal(qual.body.data.selection_authorized,false);
  assert.equal((await get('/review-sample/skills/unknown/qualification')).status,404);
  assert.equal((await get('/review-sample/skills/SKILL-governed-learning/qualification?role=owner')).status,400);
  const config=await get('/read-profile');assert.equal(config.body.data.skill_decision,'NOT_ASSESSED');assert.equal(config.body.data.state,null);assert.deepEqual(config.body.data.selections,[]);
  assert.deepEqual((await get('/workspaces/rc3-local/projects')).body.data,[]);
  const applies=[];
  for(const language of ['ar','en']){
   const r=await get('/read-scope?path=server/security.js&agent=codex&stage=implementation&environment=local&task_type=review&language='+language);
   assert.equal(r.status,200);assert.equal(r.body.data.exit_code,0);assert.equal(r.body.data.source_written,false);assert.equal(JSON.parse(r.body.data.stdout).protocol_version,'3');
   applies.push(r.body.data.items.filter(i=>i.applicability.status==='APPLIES').map(i=>i.id));
  }
  assert.deepEqual(applies[0],applies[1]);assert.deepEqual(applies[0],['OBS-REFERENCE-STATE-001']);
  const excluded=await get('/read-scope?path=docs/INDEX.md');assert.equal(excluded.body.data.items[0].applicability.status,'DOES_NOT_APPLY');
  const invalidScope=await get('/read-scope?path=../escape');assert.equal(invalidScope.status,422);assert.equal(invalidScope.body.data.exit_code,2);
  assert.equal((await get('/read-scope?permissions=write')).status,400);
  assert.equal((await get('/read-scope?path=a&path=b')).status,400);
  for(const section of ['relations','history']){
   const response=await get('/workspaces/rc3-local/instructions/OBS-REFERENCE-STATE-001/'+section);assert.equal(response.status,200);assert.deepEqual(response.body.data,[]);
   assert.equal((await get('/workspaces/rc3-local/instructions/missing/'+section)).status,404);
  }
 }finally{await new Promise(r=>server.close(r));studio.close();}
});

test('T08 display projection never transfers recorded qualification across any changed identity key',()=>{
 const tuple={skillId:'unit-only',host:'Codex',hostVersion:'synthetic-v1',scope:'src/**',contentHash:'sha256:'+'a'.repeat(64)};
 const records=[{...tuple,status:'QUALIFIED',qualifiedAt:'2026-10-23',evidence:['SYNTHETIC_UNIT_ONLY']}];
 assert.equal(qualificationView(records,tuple).recorded_status,'QUALIFIED');
 for(const key of ['host','hostVersion','scope','contentHash']){
  const result=qualificationView(records,{...tuple,[key]:'changed'});assert.equal(result.recorded_status,'NOT_RUN');assert.equal(result.historical.length,1);assert.equal(result.selection_authorized,false);
 }
 assert.equal(qualificationView(records,{...tuple,hostVersion:''}).recorded_status,'NOT_RUN');
 assert.equal(qualificationView([...records,...records],tuple).recorded_status,'NOT_RUN');
 assert.equal(qualificationView([],tuple).recorded_status,'NOT_RUN');
});

test('T07 unresolved relation is retained as unresolved, not silently dropped or accepted',async()=>{
 const catalog=createCatalog(),session=createSession(),bridge=syntheticBridge({unresolved:true});await catalog.scan(bridge);
 const server=http.createServer(createReadRoutes({catalog,session,bridge}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const r=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/workspaces/rc3-local/instructions/SYNTHETIC-0/relations`,{headers:{'X-Studio-Token':session.token}});
  assert.equal(r.status,200);assert.deepEqual((await r.json()).data,[{source_id:'SYNTHETIC-0',target_id:'UNRESOLVED-UNIT-ONLY',relation:'overrides',resolved:false}]);
 }finally{await new Promise(r=>server.close(r));catalog.close();}
});
