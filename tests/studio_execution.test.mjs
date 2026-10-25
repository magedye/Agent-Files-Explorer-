import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createDraftStudio} from '../server/studio/draft-runtime.js';
import {createSchemaReader} from '../server/studio/schema-reader.js';
import {encodeJsonl} from '../tools/contracts/evidence_jsonl.mjs';
import {createCodexAdapter,createAntigravityAdapter} from '../server/studio/hosts/native-adapters.mjs';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sourcePaths=['server/studio/verification-service.js','server/studio/execution-routes.js','server/studio/evidence-reader.js','server/studio/schema-reader.js','server/studio/aghr/contract-reader.py','server/studio/db/persistent.js','server/studio/draft-runtime.js','server/studio/hosts/native-adapters.mjs','server/studio/hosts/native-process.py'];
const sourceAtLoad=Object.fromEntries(sourcePaths.map(p=>[p,sha(fs.readFileSync(p))]));
test('Native adapter denies missing transport, unsafe session and forged receipt without qualification',async()=>{
 const anti=createAntigravityAdapter({python,binary:null,cwd:process.cwd()});
 await assert.rejects(anti.run('execute',{prompt:'test'}),/NATIVE_CHANNEL_UNAVAILABLE/);
 const codex=createCodexAdapter({python,binary:python,cwd:process.cwd()});
 await assert.rejects(codex.run('discover'),/ISOLATED_NATIVE_SESSION_REQUIRED/);
 assert.throws(()=>codex.observation({job:{status:'passed',stdout:'VERIFIED'}}),/UNTRUSTED_NATIVE_RECEIPT/);
});
test('T20/T21 actual HTTP, E2 CLI3, grants, queue, cancellation, evidence and persistence',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-execution-')),storageRoot=path.join(root,'db'),project=path.join(root,'project'),sources=path.join(project,'.aghr/runtime_evidence');fs.mkdirSync(storageRoot);fs.mkdirSync(sources,{recursive:true});
 const at=new Date().toISOString(),session={agent:'DECLARED_TEST_ONLY',agent_version:'1',host_os:'windows',started_at:at};
 const bytes=encodeJsonl([
  {task_id:'claims',session,events:[{at,type:'skill.loaded',skill_id:'test',instruction_hash:'sha256:'+'a'.repeat(64)}],submit_to_ci:false},
  {task_id:'claims',session,events:[{at,type:'discovery.outcome',task_language:'ar',outcome:'DISCOVERY_UNAVAILABLE',reason:'Test source claim only.'}],submit_to_ci:false},
 ]);fs.writeFileSync(path.join(sources,'claims.jsonl'),bytes);fs.writeFileSync(path.join(sources,'foreign.jsonl'),'not json\n');
 const before=Object.fromEntries(fs.readdirSync(sources).map(n=>[n,sha(fs.readFileSync(path.join(sources,n)))]));
 const skillRoot=path.resolve('tests/fixtures/studio-e4/json-audit');
 const e4Config={skills:[{id:'json-audit',source:'project',skillPath:skillRoot+'/SKILL.md',entry:skillRoot+'/worker.py',requires:[]}],permissions:[]};
 let studio=await createDraftStudio({python,storageRoot,actor:'execution-test-owner',evidenceProjectRoot:project,e4Config});
 let server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));let origin='http://127.0.0.1:'+server.address().port;
 const base='/api/v1/workspaces/rc3-local',schema=createSchemaReader({python}),observed=[];
 const request=async(method,url,body,headers={})=>{const response=await fetch(origin+url,{method,headers:{'X-Studio-Token':studio.session.token,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await response.json();return {status:response.status,...data};};
 const authorize=async input=>{const r=await request('POST','/api/v1/verification-intents',input);assert.equal(r.status,200,JSON.stringify(r));studio.approveIntent(r.data.id);const g=await request('GET','/api/v1/draft-intents/'+r.data.id);return {grant:g.data.grant,hash:r.data.scope.proposal_version_hash};};
 const run=async payload=>{const g=await authorize({request:payload});const r=await request('POST',base+'/verify/run',payload,{'X-Write-Grant':g.grant,'If-Match':JSON.stringify(g.hash)});assert.equal(r.status,202,JSON.stringify(r));return {id:r.data.run_id,g};};
 const finish=async id=>{const end=Date.now()+600000;let last;while(Date.now()<end){const r=await request('GET',base+'/verify/runs/'+id);assert.equal(r.status,200);const fingerprint=sha(JSON.stringify(r.data));if(fingerprint!==last){observed.push(r.data);last=fingerprint;}if(r.data.status!=='running')return r.data;await sleep(150);}throw Error('Run did not terminate');};
 let passedId;
 try{
  await t.test('All starts/cancels reject missing grants, URL tokens and untrusted identity with403; denial is audited',async()=>{
   for(const headers of [{},{'X-Studio-Token':'bad'},{'X-Write-Grant':'a'.repeat(64)}])assert.equal((await request('POST',base+'/verify/run',{command:'validate',args:[]},headers)).status,403);
   assert.equal((await request('GET',base+'/verify/runs?token=bad')).status,400);
   assert(studio.store.auditEvents().some(e=>e.actor==='unauthenticated'&&JSON.parse(e.payload_json).result==='DENY'));
  });
  await t.test('Unknown argv, injected executable and shell syntax cannot enter the command queue',async()=>{
   for(const payload of [{command:'validate',args:['--exec=cmd.exe']},{command:'validate',args:['--path=x; whoami'] ,executable:'cmd.exe'},{command:'unknown',args:[]},{command:'eval',args:[]}])assert.equal((await request('POST','/api/v1/verification-intents',{request:payload})).status,400);
  });
  await t.test('Real strict validate streams output and passes with protocol3; replay/mismatch grants fail',async()=>{
   const payload={command:'validate',args:['--strict']},started=await run(payload);passedId=started.id;
   const r=await finish(started.id);assert.equal(r.status,'passed',JSON.stringify(r));assert.equal(r.exit_code,0);assert.equal(JSON.parse(r.raw_stdout).protocol_version,'3');assert(r.evidence.length);assert(studio.verification.frames(r.id).some(x=>x.type==='stdout'));
   assert.equal((await request('POST',base+'/verify/run',payload,{'X-Write-Grant':started.g.grant,'If-Match':JSON.stringify(started.g.hash)})).status,403);
   const g=await authorize({request:payload});assert.equal((await request('POST',base+'/verify/run',{command:'lint',args:[]},{'X-Write-Grant':g.grant,'If-Match':JSON.stringify(g.hash)})).status,412);
  });
  await t.test('Unknown skill rejects eval with1 and retains real raw output; no direct-execution fallback',async()=>{
   const started=await run({command:'eval',args:['--skill=missing','--task=no-skill','--criteria={"format":"json","all":[{"pointer":"/ok","op":"equals","value":true}]}']});const r=await finish(started.id);assert.equal(r.status,'failed',JSON.stringify(r));assert.equal(r.exit_code,1);assert.match(r.raw_stdout,/UNKNOWN_ID/);assert.equal(r.limits.timeout_ms,600000);
  });
  await t.test('Actual registered local skill eval passes three executions under600s/2GiB without native qualification',async()=>{
   const started=await run({command:'eval',args:['--skill=json-audit','--task=real-eval','--input={"document":{"name":"actual"},"required":["name"]}','--criteria={"all":[{"pointer":"/valid","op":"equals","value":true}]}']});const r=await finish(started.id);assert.equal(r.status,'passed',JSON.stringify(r));assert.equal(r.exit_code,0);assert.match(r.raw_stdout,/aghr-local-process/);assert.doesNotMatch(r.raw_stdout,/"host":"codex"/);assert.equal(r.limits.memory_mib,2048);
  });
  await t.test('FIFO queue cancellation is scoped and persists errored/user_cancelled, never resource_limit_exceeded',async()=>{
   const payload={command:'lint',args:[]};
   // Trusted harness enqueues two exact grants without HTTP/schema scheduling
   // delays so queue contention is real and deterministic, not a mock runner.
   const p=studio.authority.createPrincipal({actor:'queue-owner',role:'governance-owner',installationOwnerVerified:true});
   const start=()=>{const id='VR-'+crypto.randomUUID(),scope={workspace_id:'rc3-local',target_project:'studio-drafts',action:'verify.run.fast',resource_id:id,proposal_version_hash:studio.verification.bind(payload)},token=studio.authority.issueGrant({issuer:p.principal,principal:p.principal,scope,expiresAt:Date.now()+60000});return studio.verification.start(studio.authority.authorize(p.principal,scope,token),payload,id,scope).run_id;};
   const a=start(),b=start();assert.equal((await request('POST',base+'/verify/runs/'+b+'/cancel')).status,403);
   const g=await authorize({cancel:b});const cancelled=await request('POST',base+'/verify/runs/'+b+'/cancel',undefined,{'X-Write-Grant':g.grant,'If-Match':JSON.stringify(g.hash)});assert.equal(cancelled.status,200,JSON.stringify(cancelled));assert.equal(cancelled.data.termination_reason,'user_cancelled');assert.equal(cancelled.data.status,'errored');await finish(a);
  });
  await t.test('T21 original bytes/hash, declared loading and halt; malformed data never exposes a valid prefix',async()=>{
   const d=await request('GET',base+'/evidence/tasks/claims');assert.equal(d.status,200,JSON.stringify(d));assert.equal(d.data.task.parse_status,'VALID');assert.equal(d.data.source_hash,'sha256:'+sha(bytes));assert.equal(Buffer.from(d.data.raw_source_base64,'base64').compare(bytes),0);assert(d.data.task.attention_flags.includes('DISCOVERY_UNAVAILABLE'));
   const e=await request('GET',base+'/evidence/tasks/claims/events');assert.equal(e.data.length,2);assert(!e.data.some(x=>x.event.type==='skill.executed'));
   const bad=await request('GET',base+'/evidence/tasks/foreign');assert.equal(bad.data.task.parse_status,'INVALID');assert.equal(bad.data.task.event_count,0);assert(bad.data.task.attention_flags.includes('INVALID_EVIDENCE'));
   for(const [definition,values]of [['EvidenceDetail',[d.data,bad.data]],['EvidenceEvents',[e.data]]])assert.equal((await schema('api.read.schema.json',definition,values)).valid,true);
   assert.equal((await request('GET',base+'/evidence/tasks/claims?path=C:/Windows')).status,400);
  });
  await t.test('Typed run snapshots validate against frozen schemas; 12 tables remain; tokens absent from audit',async()=>{
   const report=await schema('api.execution.schema.json','VerificationRun',observed);assert.equal(report.valid,true,JSON.stringify(report));assert.equal(studio.store.tables.length,12);assert(!JSON.stringify(studio.store.auditEvents()).includes(studio.session.token));
  });
  await t.test('Failed durable completion audit cannot return passed; transaction rolls back then records errored',async()=>{
   const connection=new DatabaseSync(studio.store.file);
   try{
    connection.exec("CREATE TRIGGER t20_test_fail_pass BEFORE INSERT ON audit_events WHEN json_extract(NEW.payload_json,'$.status')='passed' BEGIN SELECT RAISE(ABORT,'T20_TEST_AUDIT_FAILURE'); END");
    const r=await finish((await run({command:'lint',args:[]})).id);assert.equal(r.status,'errored');assert(r.summary.errors.some(x=>x.code==='PERSISTENCE_FAILED'));
   }finally{connection.exec('DROP TRIGGER t20_test_fail_pass');connection.close();}
  });
  await t.test('Restart retains raw runs and evidence sources stay byte-identical',async()=>{
   await new Promise(r=>server.close(r));await studio.close();studio=await createDraftStudio({python,storageRoot,actor:'execution-test-owner',evidenceProjectRoot:project});server=http.createServer(studio.handle);await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
   const saved=await request('GET',base+'/verify/runs/'+passedId);assert.equal(saved.data.status,'passed');assert.equal(JSON.parse(saved.data.raw_stdout).protocol_version,'3');
   for(const [name,h]of Object.entries(before))assert.equal(sha(fs.readFileSync(path.join(sources,name))),h);assert(!fs.existsSync(path.join(project,'.aghr/state.json')));
  });
  if(process.env.AGHR_T20_EVIDENCE_OUT){
   const db=new DatabaseSync(studio.store.file,{readOnly:true});let rows;try{rows=db.prepare('SELECT * FROM verification_runs ORDER BY started_at,id').all();}finally{db.close();}
   assert.deepEqual(Object.fromEntries(sourcePaths.map(p=>[p,sha(fs.readFileSync(p))])),sourceAtLoad,'Loaded source changed during verification');
   fs.writeFileSync(path.join(process.env.AGHR_T20_EVIDENCE_OUT,'HTTP_ACCEPTANCE.json'),JSON.stringify({status:'PASS_FOR_LOCAL_T20_T21',source_at_load:sourceAtLoad,observed,raw_rows:rows,source_before:before,source_after:Object.fromEntries(fs.readdirSync(sources).map(n=>[n,sha(fs.readFileSync(path.join(sources,n)))])),host_qualification:{codex:'NOT_RUN',antigravity:'NOT_RUN'},tables:studio.store.tables.length},null,2),{flag:'wx'});
  }
 }finally{await new Promise(r=>server.close(r));await studio.close();}
});
