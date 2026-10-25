import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createUnifiedStudio} from '../server/studio/unified-runtime.mjs';
test('T36 canonical registrations, exact grants, settings and metric contracts',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t36-api-')),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),studio=await createUnifiedStudio({python,storageRoot:root,actor:'canonical-owner'}),server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const records=[],request=async(method,route,body,headers={})=>{const r=await fetch(origin+'/api/v1'+route,{method,headers:{'X-Studio-Token':studio.session.token,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const result={status:r.status,...await r.json()};records.push({method,route,status:result.status,error:result.meta?.error?.code});return result;};
 const granted=async(method,path,body)=>{const requestBody={method,path,...(body===undefined?{}:{body})},intent=await request('POST','/canonical/intents',requestBody);assert.equal(intent.status,200,JSON.stringify(intent));studio.approveIntent(intent.data.id);return {intent,intentId:intent.data.id,headers:{'X-Write-Grant':studio.intents.get(intent.data.id).grant,'If-Match':JSON.stringify(intent.data.scope.proposal_version_hash)}};};
 const validate=async(file,def,value)=>{const r=await studio.schema(file,def,[value]);assert.equal(r.valid,true,JSON.stringify(r));};
 try{
  await t.test('canonical settings and ten metrics use pinned engine, unknown values stay null',async()=>{
   const s=await request('GET','/settings');assert.equal(s.status,200,JSON.stringify(s));await validate('settings.schema.json',null,s.data);const m=await request('GET','/workspaces/rc3-local/metrics/current');assert.equal(m.status,200,JSON.stringify(m));await validate('api.read.schema.json','Metrics',m.data);assert.equal(Object.keys(m.data.instruction_metrics).length,5);assert.equal(Object.keys(m.data.skill_metrics).length,5);
  });
  await t.test('403 without grant; add/scan/delete registration persist in12 tables without source deletion',async()=>{
   const input={name:'Canonical L2 package',package_path:path.resolve('pilot-app-l2/.aghr/package')};assert.equal((await request('POST','/workspaces',input)).status,403);
   const g=await granted('POST','/workspaces',input),w=await request('POST','/workspaces',input,g.headers);assert.equal(w.status,201,JSON.stringify(w));await validate('api.read.schema.json','Workspace',w.data);assert.equal((await request('POST','/workspaces',input,g.headers)).status,403);
   const p={name:'L2 source project',path:path.resolve('pilot-app-l2'),host:'aghr-local-process',host_version:process.version},route='/workspaces/'+w.data.id+'/projects',pg=await granted('POST',route,p),project=await request('POST',route,p,pg.headers);assert.equal(project.status,201,JSON.stringify(project));await validate('api.read.schema.json','Project',project.data);
   const config=await request('GET',route+'/'+project.data.id+'/config');assert.equal(config.data.state.adoptionLevel,'L2');await validate('api.read.schema.json','ProjectConfig',config.data);
   const scanRoute=route+'/'+project.data.id+'/scan',sg=await granted('POST',scanRoute),scan=await request('POST',scanRoute,undefined,sg.headers);assert.equal(scan.status,200,JSON.stringify(scan));await validate('api.read.schema.json','Scan',scan.data);assert.equal(scan.data.source_written,false);
   const removeRoute=route+'/'+project.data.id,dg=await granted('DELETE',removeRoute);assert.equal((await request('DELETE',removeRoute,undefined,dg.headers)).data.source_deleted,false);
   const wg=await granted('DELETE','/workspaces/'+w.data.id);assert.equal((await request('DELETE','/workspaces/'+w.data.id,undefined,wg.headers)).data.source_deleted,false);assert.equal((await request('GET','/workspaces')).data.length,3);assert.equal(studio.store.tables.length,12);
  });
  await t.test('typed settings, stale hash rejection, signing NOT_RUN and real audit identities',async()=>{
   const body={default_branch:'sandbox-trial'},g=await granted('PATCH','/settings/git',body),stale=await request('PATCH','/settings/git',body,{...g.headers,'If-Match':'"sha256:'+ '0'.repeat(64)+'"'});assert.equal(stale.status,412);const r=await request('PATCH','/settings/git',body,g.headers);assert.equal(r.status,200,JSON.stringify(r));await validate('settings.schema.json',null,r.data);assert.equal(r.data.git.default_branch,'sandbox-trial');
   const signing=await granted('POST','/settings/test-signing'),s=await request('POST','/settings/test-signing',undefined,signing.headers);assert.equal(s.status,200,JSON.stringify(s));await validate('settings.schema.json','SigningResult',s.data);assert.equal(s.data.status,'NOT_RUN');
   const a=await request('GET','/audit/events');await validate('api.read.schema.json','AuditEvents',a.data);assert(a.data.some(e=>e.payload.result==='DENY'));assert(a.data.some(e=>e.actor==='canonical-owner'&&e.payload.result==='SUCCESS'));
  });
 }finally{if(process.env.AGHR_EVIDENCE_OUT)fs.writeFileSync(path.join(process.env.AGHR_EVIDENCE_OUT,'CANONICAL_FOCUSED.json'),JSON.stringify(records,null,2)+'\n');server.closeAllConnections();await new Promise(r=>server.close(r));await studio.close();}
});
