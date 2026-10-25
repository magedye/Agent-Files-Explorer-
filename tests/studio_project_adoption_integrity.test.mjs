import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import {createUnifiedStudio} from '../server/studio/unified-runtime.mjs';
const hash=v=>'sha256:'+crypto.createHash('sha256').update(v).digest('hex');
test('T36 adoption integrity rejects escalation, altered manifest/AGENTS, omitted and duplicate files before grants',async()=>{
 const studio=await createUnifiedStudio({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),storageRoot:fs.mkdtempSync(path.join(os.tmpdir(),'aghr-capsule-integrity-')),actor:'integrity-owner'}),server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,base='/workspaces/rc3-local',records=[];
 const request=async(route,body,headers={})=>{const r=await fetch(origin+'/api/v1'+route,{method:'POST',headers:{'X-Studio-Token':studio.session.token,'Content-Type':'application/json',...headers},body:JSON.stringify(body)});return {status:r.status,...await r.json()};};
 try{
  const input={target_project_id:'pilot-app-l2',level:'L2',profile:'SANDBOX_LOCAL_CI_V1'},i=await request('/project-adoption-intents',{request:input});assert.equal(i.status,200,JSON.stringify(i));studio.approveIntent(i.data.id);
  const created=await request(base+'/adoptions',input,{'X-Write-Grant':studio.intents.get(i.data.id).grant,'If-Match':JSON.stringify(i.data.scope.proposal_version_hash)});assert.equal(created.status,201,JSON.stringify(created));const cp=studio.store.draft(created.data.change_package_id),original=JSON.parse(cp.proposed_yaml);
  const alterFile=(v,name,content)=>{const f=v.files.find(f=>f.path===name);f.content=content;f.content_hash=hash(content);};
  const cases=[['level escalation',v=>{v.adoption.level='L4';}],['profile switch',v=>{v.adoption.profile='OTHER_PROFILE';}],['manifest weakening',v=>{const m=JSON.parse(v.files.find(f=>f.path==='.aghr/package/aghr.json').content);m.validation.enforceAuthorityLevel=false;alterFile(v,'.aghr/package/aghr.json',JSON.stringify(m));}],['missing principle in AGENTS',v=>alterFile(v,'AGENTS.md','# Instruction text without required principle\n')],['omitted policy',v=>{v.files=v.files.filter(f=>!f.path.endsWith('/identity.json'));}],['duplicate file',v=>{v.files.push({...v.files[0]});}]];
  for(const [name,mutate]of cases){const value=structuredClone(original);mutate(value);const pending=studio.intents.size,r=await request(base+'/cps/'+cp.id+'/intents',{operation:'edit',payload:{proposed_yaml:JSON.stringify(value)}},{'If-Match':JSON.stringify(cp.proposal_version_hash)});records.push({name,status:r.status,error:r.meta?.error?.code});assert.equal(r.status,422,name+': '+JSON.stringify(r));assert.equal(studio.intents.size,pending);assert.equal(studio.store.draft(cp.id).proposal_version_hash,cp.proposal_version_hash);assert.deepEqual(studio.store.draft(cp.id).checks,cp.checks);}
  studio.pilots.recheck();
 }finally{if(process.env.AGHR_EVIDENCE_OUT)fs.writeFileSync(path.join(process.env.AGHR_EVIDENCE_OUT,'CAPSULE_INTEGRITY.json'),JSON.stringify(records,null,2)+'\n');server.closeAllConnections();await new Promise(r=>server.close(r));await studio.close();}
});
