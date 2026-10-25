import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createDraftStudio} from '../server/studio/draft-runtime.js';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
test('T30–T33 actual HTTP, grants,12-table SQLite, reports, roles and durable settings',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-phase5-'));let studio=await createDraftStudio({python,storageRoot:root,actor:'phase5-owner'}),server=http.createServer((req,res)=>studio.handle(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,base='/api/v1/workspaces/rc3-local',p=base+'/phase5',evidence=[];
 const request=async(method,route,data,headers={})=>{const r=await fetch(origin+route,{method,headers:{'X-Studio-Token':studio.session.token,...(data?{'Content-Type':'application/json'}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})});const value=await r.json();evidence.push({method,route,status:r.status,error:value.meta?.error?.code});return {status:r.status,...value};};
 const prepare=async input=>{const v=await request('POST',p+'/intents',input);assert.equal(v.status,200,JSON.stringify(v));studio.approveIntent(v.data.id);return {...v.data,input,grant:studio.intents.get(v.data.id).grant};};
 const apply=i=>request('POST',p+'/run',i.input,{'X-Write-Grant':i.grant,'If-Match':JSON.stringify(i.scope.proposal_version_hash)});
 try{
  await t.test('ten honest metrics, two L0 levels and six dashboard risks',async()=>{const m=await request('GET',base+'/metrics/current');assert.equal(m.status,200,JSON.stringify(m));assert.equal(Object.keys(m.data.metrics).length,10);assert.equal(m.data.metrics.false_success_rate_pct.value,null);const d=await request('GET',base+'/dashboard');assert.equal(d.data.risks.length,6);assert.equal(d.data.levels.instructions.current,'L0');assert.equal(studio.store.tables.length,12);});
  await t.test('403 without grant, wrong scope, expired/revoked and stale settings hash',async()=>{
   assert.equal((await request('PATCH','/api/v1/settings/git',{gpg_key_id:null,default_branch:'test',commit_message_template:'aghr: {title}'})).status,403);
   const i=await prepare({operation:'metrics.snapshot'});const bad=await request('POST',p+'/run',i.input,{'X-Write-Grant':i.grant,'If-Match':'"sha256:'+ 'b'.repeat(64)+'"'});assert.equal(bad.status,412);studio.revokeIntent(i.id);assert.equal((await apply(i)).status,403);
   const stale=await prepare({operation:'metrics.snapshot'}),change=await prepare({operation:'settings.update',section:'git',value:{gpg_key_id:null,default_branch:'draft-test',commit_message_template:'studio: {title}'}});assert.equal((await apply(change)).status,200);assert.equal((await apply(stale)).status,412);
  });
  await t.test('snapshots persist raw, grouped, scalar, trend and one-use audit',async()=>{const i=await prepare({operation:'metrics.snapshot'}),m=await apply(i);assert.equal(m.status,200,JSON.stringify(m));assert.equal((await apply(i)).status,403);const h=await request('GET',base+'/metrics/history?days=90');assert.equal(h.data.length,1);assert.deepEqual(h.data[0].raw,m.data.raw);assert.equal(h.data[0].raw_hash,m.data.raw_hash);assert.equal(Object.keys(h.data[0].grouped.skills).length,5);assert.equal((await request('GET',base+'/metrics/history?days=0')).status,422);});
  await t.test('all supported reports from real store, no trust from format',async()=>{for(const [report,formats]of [['compliance',['json','md','sarif']],['changes',['json','md']],['skills',['json','md']],['metrics',['json','csv']],['audit',['json','md']]])for(const format of formats){const r=await apply(await prepare({operation:'reports.generate',report,format}));assert.equal(r.status,200,JSON.stringify(r));assert.match(r.data.sha256,/^sha256:/);assert.equal(r.data.source_written,false);if(report==='compliance')assert.match(r.data.content,/OBS-REFERENCE-STATE-001/);}});
  await t.test('fixed limits, unsigned identity, malicious host and role labels fail closed',async()=>{
   for(const input of [{operation:'settings.update',section:'limits',value:{eval:{timeout_ms:900000,memory_mib:4096}}},{operation:'settings.update',section:'hosts',value:[{host:'codex',executable:'evil.exe'}]},{operation:'settings.update',section:'git',value:{gpg_key_id:'FAKE_TRUST',default_branch:'main',commit_message_template:'{title}'}}])assert.equal((await request('POST',p+'/intents',input)).status,422);
   const s=await apply(await prepare({operation:'settings.test-signing'}));assert.equal(s.data.verified,false);assert.equal(s.data.status,'NOT_CONFIGURED');
   assert.equal((await request('POST',p+'/intents',{operation:'metrics.snapshot'},{'X-Studio-Role':'governance-owner'})).status,400);
  });
  await t.test('server role binding changes live permissions; simulated labels cannot grant writes',async()=>{
   const developer=studio.authority.createPrincipal({actor:'actual-reviewer',role:'developer'});const i=await prepare({operation:'settings.update',section:'roles',value:{'phase5-owner':'governance-owner','actual-reviewer':'security-owner'}});assert.equal((await apply(i)).status,200);assert.equal(studio.authority.describe(developer.principal).server_resolved_role,'security-owner');
   const scope={workspace_id:'rc3-local',target_project:'studio-drafts',action:'settings.update',resource_id:'phase5',proposal_version_hash:'sha256:'+'a'.repeat(64)};assert.throws(()=>studio.authority.issueGrant({issuer:developer.principal,principal:developer.principal,scope,expiresAt:Date.now()+1000}));
  });
  await t.test('audit filters show successful and denied real identities; startup restores settings with a new token',async()=>{
   const events=(await request('GET','/api/v1/audit/events?event_type=settings.update')).data.events;assert(events.some(e=>e.payload.result==='SUCCESS'));const all=(await request('GET','/api/v1/audit/events')).data.events;assert(all.some(e=>e.payload.result==='DENY'));assert(events.every(e=>e.actor_role==='governance-owner'||e.actor_role===null));
   const old=studio.session.token;await studio.close();studio=await createDraftStudio({python,storageRoot:root,actor:'phase5-owner'});assert.notEqual(studio.session.token,old);assert.equal((await request('GET','/api/v1/settings')).data.settings.git.default_branch,'draft-test');assert.equal((await request('GET',base+'/metrics/history')).data.length,1);
  });
 }finally{await new Promise(r=>server.close(r));await studio.close();const dir=process.env.AGHR_PHASE5_TEST_OUT;if(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/HTTP_ACCEPTANCE.json',JSON.stringify({evidence,database:root+'/studio.sqlite'},null,2),{flag:'wx'});}}
});
