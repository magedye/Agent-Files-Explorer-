import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createUnifiedStudio} from '../server/studio/unified-runtime.mjs';
test('T36 canonical project adoption uses actual E2/E3 checks, patch-only Draft and cold P0 refusal',async t=>{
 const storageRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-project-api-')),studio=await createUnifiedStudio({storageRoot,actor:'project-adoption-owner',python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe')}),server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,base='/workspaces/rc3-local',records=[];
 const request=async(method,route,body,headers={})=>{const r=await fetch(origin+'/api/v1'+route,{method,headers:{'X-Studio-Token':studio.session.token,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),value={status:r.status,...await r.json()};records.push({method,route,...value});return value;};
 const grant=i=>{assert.equal(i.status,200,JSON.stringify(i));studio.approveIntent(i.data.id);return {'X-Write-Grant':studio.intents.get(i.data.id).grant,'If-Match':JSON.stringify(i.data.scope.proposal_version_hash)};};
 const create=async(project,level)=>{const input={target_project_id:project,level,profile:'SANDBOX_LOCAL_CI_V1'},i=await request('POST','/project-adoption-intents',{request:input}),r=await request('POST',base+'/adoptions',input,grant(i));assert.equal(r.status,201,JSON.stringify(r));return r.data;};
 const cp=id=>studio.store.draft(id);
 const action=async(id,operation,payload,route)=>{const current=cp(id),i=await request('POST',base+'/cps/'+id+'/intents',{operation,...(payload===undefined?{}:{payload})},{'If-Match':JSON.stringify(current.proposal_version_hash)});return request(operation==='edit'?'PATCH':'POST',route||base+'/cps/'+id+(operation==='edit'?'':'/'+operation),payload,grant(i));};
 try{
  await t.test('L2 re-adoption candidate validates, generates, reviews and exports without changing published files',async()=>{
   const a=await create('pilot-app-l2','L2');assert.equal(a.status,'draft');assert.equal((await request('GET',base+'/adoptions/'+a.id)).data.id,a.id);
   let r=await action(a.change_package_id,'validate');assert.equal(r.status,202,JSON.stringify(r));assert.equal(r.data.status,'validated');
   r=await action(a.change_package_id,'generate',{agent:'aghr-local-process',profile:a.profile,dry_run:true},base+'/generate/preview');assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.prin_007_present,true);
   r=await action(a.change_package_id,'preview',undefined,base+'/adoptions/'+a.id+'/preview');assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.diff,'');assert.deepEqual(r.data.files,[]);assert.equal((await request('GET',base+'/adoptions/'+a.id+'/diff')).status,200);
   r=await action(a.change_package_id,'submit');assert.equal(r.status,200,JSON.stringify(r));r=await action(a.change_package_id,'approve',{role:'governance-owner',decision:'approve',reason:'Isolated canonical API acceptance; no release or source apply'});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.status,'approved');
   const current=cp(a.change_package_id),i=await request('POST',base+'/cps/'+current.id+'/intents',{operation:'export',payload:{format:'patch'}},{'If-Match':JSON.stringify(current.proposal_version_hash)});r=await request('POST',base+'/adoptions/'+a.id+'/apply',{mode:'patch'},grant(i));assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.data.state_written,false);assert.equal(r.data.artifact.bytes,0);assert(r.data.warnings.some(x=>x.includes('No changes')));
  });
  await t.test('L3 history never restores current qualification, elevated source/level denied',async()=>{const a=await create('pilot-app-l3','L3'),r=await action(a.change_package_id,'validate');assert.equal(r.status,202,JSON.stringify(r));assert.equal(r.data.status,'draft');assert.equal(r.data.checks.validate.status,'FAIL');assert.match(r.data.checks.validate.reason,/QUALIFICATION|EVAL/);const bad=await request('POST','/project-adoption-intents',{request:{target_project_id:'pilot-app-l3',level:'L4',profile:'SANDBOX_LOCAL_CI_V1'}});assert.equal(bad.status,403);});
 }finally{if(process.env.AGHR_EVIDENCE_OUT)fs.writeFileSync(path.join(process.env.AGHR_EVIDENCE_OUT,'PROJECT_ADOPTION_HTTP.json'),JSON.stringify(records,null,2)+'\n');server.closeAllConnections();await new Promise(r=>server.close(r));await studio.close();}
});
