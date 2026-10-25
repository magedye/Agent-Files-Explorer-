import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {sourceHash,verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const out='docs/evidence/studio-e4-2026-10-24',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),json=n=>JSON.parse(fs.readFileSync(n,'utf8'));
if(fs.existsSync(out+'/CUSTODY.lock.json'))throw Error('ALREADY_SEALED');verifyE4();
const pre=json(out+'/PREFLIGHT.json'),parent=json(pre.parent.path);assert.equal(sha(fs.readFileSync(pre.parent.path)),pre.parent.sha256);
for(const [n,h]of Object.entries(parent.files))assert.equal(sha(fs.readFileSync(pre.before[n]?out+'/'+pre.before[n].copy:n)),h.sha256,n);
// Preserve the older 1924-file chain as well, reading only explicit lock paths.
const ancestor=json(parent.parent.path);assert.equal(sha(fs.readFileSync(parent.parent.path)),parent.parent.sha256);let unchanged=0;
for(const [n,h]of Object.entries(ancestor.files)){
 const old=parent.exceptions[n];const file=old?path.join(path.dirname(pre.parent.path),old.before.copy):n;assert.equal(sha(fs.readFileSync(file)),h.sha256,n);if(!old)unchanged++;
}
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),pre.head);
const final=json(out+'/final-local-v2/ACCEPTANCE.json');assert.equal(final.source_hash,sourceHash);assert.equal(final.honesty.length,7);assert.equal(final.scenarios.length,8);assert.ok(final.honesty.every(h=>h.status==='PASS_FOR_LOCAL_CORE'));assert.ok(final.scenarios.every(s=>s.status==='PASS_FOR_LOCAL_CORE'));
assert.equal(final.host_qualification.codex.status,'NOT_RUN');assert.equal(final.host_qualification.antigravity.status,'NOT_RUN');
const runs=final.records.filter(r=>r.operation==='execute'),byId=new Map(runs.map(r=>[r.run_id,r]));
for(const r of runs){assert.equal(r.active_processes_after,0);assert.equal(r.started.hard_memory_bytes,2147483648);assert.equal(r.started.limit_flags&0x2200,0x2200);assert.equal('sha256:'+sha(Buffer.from(r.input_base64,'base64')),r.input_hash);assert.equal(Buffer.from(r.stdout_base64,'base64').toString('utf8'),r.stdout);}
let verified=0;for(const r of final.records.filter(r=>r.protocol_version==='3')){
 const report=JSON.parse(r.stdout);assert.equal(report.source.content_hash,sourceHash);assert.equal(report.exit_code,r.exit_code);assert.equal(r.active_processes_after,0);
 if(report.data?.state==='VERIFIED'){const execution=byId.get(report.data.execution_run_id);assert.ok(execution);assert.equal(execution.exit_code,0);assert.ok(execution.stdout.trim());assert.equal(report.data.output_hash,'sha256:'+sha(Buffer.from(execution.stdout)));assert.ok(report.data.criteria_results.every(c=>c.passed));verified++;}
}
const cli=json(out+'/cli-v2/RESULTS.json');assert.equal(cli.source_hash,sourceHash);assert.equal(cli.results.length,8);assert.ok(cli.results.every(r=>r.expected===r.exit_code));
const log=fs.readFileSync(out+'/NPM_TEST_FINAL.log','utf8');assert.match(log,/(?:ℹ|#) tests 93/u);assert.match(log,/(?:ℹ|#) pass 93/u);assert.match(log,/(?:ℹ|#) fail 0/u);assert.match(log,/(?:ℹ|#) skipped 0/u);
const health=fs.readFileSync(out+'/CONTEXT_HEALTH.log','utf8');assert.match(health,/Errors: 0, Warnings: 0/);
const diffs={};fs.mkdirSync(out+'/after',{recursive:true});let changes='';for(const [n,before]of Object.entries(pre.before)){
 const raw=fs.readFileSync(n),copy='after/'+path.basename(n)+'.raw';fs.writeFileSync(out+'/'+copy,raw,{flag:'wx'});diffs[n]={before,after:{sha256:sha(raw),bytes:raw.length,copy}};
 let delta;try{delta=execFileSync('git',['-c','core.autocrlf=false','diff','--no-index','--no-ext-diff','--text',out+'/'+before.copy,n],{encoding:'utf8'});}catch(e){if(e.status!==1)throw e;delta=e.stdout;}changes+=delta;
}
fs.writeFileSync(out+'/BEFORE_AFTER.json',JSON.stringify(diffs,null,2)+'\n',{flag:'wx'});fs.writeFileSync(out+'/CHANGES.patch',changes,{flag:'wx'});
const result={status:'PASS_FOR_LOCAL_CORE_ONLY',source_hash:sourceHash,prior_latest_files:pre.parent.verified_files,older_immutable_files_verified:unchanged,tests:93,pass:93,fail:0,skipped:0,honesty:{required:7,pass:7,scope:'actual local process engine; no mock'},scenarios:{required:8,pass:8,scope:'actual local process procedures'},actual_executions:runs.length,verified_projections_with_actual_receipts:verified,cli_cases:8,context:{errors:0,warnings:0},native_agent_qualification:{codex:'REQUIRED / NOT_RUN / NOT_WAIVED',antigravity:'REQUIRED / NOT_RUN / NOT_WAIVED'},source_written:false,state_written:false,release_acceptance:'NOT_GRANTED'};
fs.writeFileSync(out+'/VERIFICATION.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const files={};const add=n=>{const raw=fs.readFileSync(n);files[n]={sha256:sha(raw),bytes:raw.length};};const walk=p=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){assert.ok(!e.isSymbolicLink());const n=p+'/'+e.name;e.isDirectory()?walk(n):add(n);}};
for(const p of [out,'server/studio/aghr/e4','tools/e4','tests/fixtures/studio-e4'])walk(p);for(const n of ['server/studio/aghr/e4-bridge.js','server/studio/hosts/local-process.mjs','tools/aghr_e4_cli.mjs',...fs.readdirSync('tests').filter(n=>n.startsWith('studio_e4_')).map(n=>'tests/'+n),...Object.keys(pre.before)])add(n);
fs.writeFileSync(out+'/CUSTODY.lock.json',JSON.stringify({algorithm:'SHA256 raw bytes; not owner/publisher signature',scope:'E4 local core only; native agent gates remain required/not run',parent:pre.parent,exceptions:diffs,files},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...result,sealed_files:Object.keys(files).length}));
