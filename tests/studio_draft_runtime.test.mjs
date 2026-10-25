import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createDraftStudio} from '../server/studio/draft-runtime.js';

const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const policy=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_T12_Candidate/policies/drafts/AGHR-001.json','utf8'));
const payload=()=>({title:'مسودة اختبار / Draft test',kind:policy.kind,source:{type:'request',ref:'isolated-test'},proposed_yaml:JSON.stringify(policy,null,2)+'\r\n'});
async function serve(studio){const s=http.createServer(studio.handle);await new Promise(r=>s.listen(0,'127.0.0.1',r));return {url:`http://127.0.0.1:${s.address().port}`,close:()=>new Promise(r=>s.close(r))};}

test('T13/T14/T16 real HTTP draft grants, denial audit, atomic persistence and restart',async t=>{
 const storageRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-draft-'));
 let now=Date.now(),studio=await createDraftStudio({python,storageRoot,actor:'isolated-owner',clock:()=>now}),server=await serve(studio);
 const route='/api/v1/workspaces/rc3-local/change-packages';
 const request=async(method,url,body,headers={})=>{
  const response=await fetch(server.url+url,{method,headers:{'x-studio-token':studio.session.token,'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  return {status:response.status,body:await response.json()};
 };
 const preview=async value=>{const r=await request('POST','/api/v1/draft-intents',value);assert.equal(r.status,200,JSON.stringify(r.body));return {...r.body.data,payload:structuredClone(value)};};
 const grantFor=async value=>{const intent=await preview(value);studio.approveIntent(intent.id);const r=await request('GET','/api/v1/draft-intents/'+intent.id);return {...intent,grant:r.body.data.grant};};
 const create=intent=>request('POST',route,intent.payload,{'x-write-grant':intent.grant,'If-Match':JSON.stringify(intent.scope.proposal_version_hash)});
 try{
  assert.equal(studio.store.tables.length,12);
  await t.test('No identity, forged role, no grant and all unsupported writes return403 and persist denial identity',async()=>{
   assert.equal((await request('POST',route,{}, {'x-studio-token':'bad'})).status,403);
   assert.equal((await request('POST',route,{}, {'x-studio-role':'governance-owner'})).status,403);
   for(const token of [undefined,'OWNER_T12_OVERRIDE','a'.repeat(64)]){
    assert.equal((await request('POST',route,{role:'governance-owner'},token?{'x-write-grant':token}:{})).status,403);
   }
   for(const [method,url]of [['POST','/api/governed-apply'],['POST','/api/staging/create'],['POST','/api/v1/workspaces'],['PATCH',route+'/CP-1'],['DELETE',route+'/CP-1']])assert.equal((await request(method,url,{})).status,403);
   assert.equal(studio.store.drafts().length,0);
   const events=studio.store.auditEvents().map(r=>({...r,payload:JSON.parse(r.payload_json)}));
   assert(events.some(r=>r.actor==='unauthenticated'&&r.payload.result==='DENY'));
   assert(events.some(r=>r.actor==='isolated-owner'&&r.payload.result==='DENY'));
   assert(!JSON.stringify(events).includes(studio.session.token));
  });
  await t.test('Pinned Python rejects missing authority.level, scope, wrapper mismatch, YAML aliases and owner claims',async()=>{
   for(const modify of [p=>delete p.authority.level,p=>delete p.scope,p=>p.kind='OBSERVATION']){
    const item=structuredClone(policy);modify(item);const r=await request('POST','/api/v1/draft-intents',{...payload(),proposed_yaml:JSON.stringify(item)});assert.equal(r.status,422,JSON.stringify({response:r.body,last_audit:studio.store.auditEvents().slice(-2)}));
   }
   assert.equal((await request('POST','/api/v1/draft-intents',{...payload(),role:'governance-owner'})).status,422);
   assert.equal((await request('POST','/api/v1/draft-intents',{...payload(),proposed_yaml:'a: &x 1\nb: *x'})).status,422);
   const unicode=payload(),item=structuredClone(policy);item.rule='مرحبًا🙂 '.repeat(2000);unicode.proposed_yaml=JSON.stringify(item);
   const prepared=await preview(unicode);assert.equal(studio.intents.get(prepared.id).prepared.proposed_yaml,unicode.proposed_yaml);
   assert.equal(studio.store.drafts().length,0);
  });
  await t.test('Preview grants no write; another actor/intent, expiry, revoke, mismatch and replay cannot write',async()=>{
   const p=await preview(payload());assert.equal(studio.store.drafts().length,0);
   assert.equal((await create({...p,grant:'a'.repeat(64)})).status,403);
   const first=await grantFor(payload()),second=await preview({...payload(),title:'different draft intent'});
   assert.equal((await create({...second,grant:first.grant})).status,412);
   const different=studio.authority.createPrincipal({actor:'different-user',role:'developer'});
   assert.equal((await request('POST',route,first.payload,{'x-studio-token':different.token,'x-write-grant':first.grant,'If-Match':JSON.stringify(first.scope.proposal_version_hash)})).status,403);
   assert.equal((await request('POST',route,first.payload,{'x-write-grant':first.grant})).status,428);
   assert.equal((await request('POST',route,first.payload,{'x-write-grant':first.grant,'If-Match':'"sha256:'+'b'.repeat(64)+'"'})).status,412);
   now+=121000;assert.equal((await create(first)).status,403);
   const revoked=await grantFor(payload());studio.revokeIntent(revoked.id);assert.equal((await create(revoked)).status,403);
   const live=await grantFor(payload());
   // A rejected attempt for the same CP must not be mistaken for its immutable
   // successful creation/provenance record when the correct retry commits.
   assert.equal((await request('POST',route,live.payload,{'x-write-grant':live.grant})).status,428);
   assert.equal((await create({...live,payload:{...live.payload,title:'changed without a new grant'}})).status,412);
   const response=await create(live);assert.equal(response.status,201,JSON.stringify(response.body));
   assert.equal(response.body.data.status,'draft');assert.equal(response.body.data.checks.validate.status,'NOT_RUN');
   const cp=response.body.data;const canonical=Object.fromEntries(['base_package_version','base_candidate_hash','title','kind','target_item_id','source','proposed_yaml'].map(k=>[k,cp[k]]));
   assert.match(cp.base_candidate_hash,/^sha256:[a-f0-9]{64}$/);
   const jcs=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(jcs).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+jcs(v[k])).join(',')+'}';
   assert.equal(cp.proposal_version_hash,'sha256:'+crypto.createHash('sha256').update(jcs(canonical)).digest('hex'));
   assert.equal((await create(live)).status,403);assert.equal(studio.store.drafts().length,1);
  });
  await t.test('Failure inserting audit rolls back CP row in the same transaction',async()=>{
   const external=new DatabaseSync(studio.store.file);
   external.exec("CREATE TRIGGER reject_cp_audit BEFORE INSERT ON audit_events WHEN NEW.event_type='cp.create' AND NEW.payload_json LIKE '%SUCCESS%' BEGIN SELECT RAISE(ABORT,'injected audit failure'); END;");external.close();
   const intent=await grantFor(payload());assert.equal((await create(intent)).status,503);assert.equal(studio.store.drafts().length,1);
   const clean=new DatabaseSync(studio.store.file);clean.exec('DROP TRIGGER reject_cp_audit');clean.close();
  });
  const id=studio.store.drafts()[0].id;await server.close();studio.close();
  studio=await createDraftStudio({python,storageRoot,actor:'restarted-owner'});server=await serve(studio);
  const reopened=await request('GET',route+'/'+id);assert.equal(reopened.status,200);assert.equal(reopened.body.data.created_by,'isolated-owner');assert.equal(studio.store.tables.length,12);
  const log=studio.store.auditEvents();assert.equal(log.filter(r=>r.event_type==='cp.create'&&JSON.parse(r.payload_json).result==='SUCCESS').length,1);
 }finally{await server.close();studio.close();}
});
