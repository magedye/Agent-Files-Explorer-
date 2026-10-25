// Final read-only checks, then an explicit one-shot custody receipt.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {repository} from '../../server/studio/aghr/cli-bridge.js';
import {profile,sha,verifyFixture} from './mock_bridge.mjs';

const rel='docs/evidence/studio-t19-mock-2026-10-24',out=path.join(repository,rel),read=name=>fs.readFileSync(path.join(out,name)),json=name=>JSON.parse(read(name));
const pre=json('PREFLIGHT.json'),cycle=json('CYCLE.json'),pin=json('HOST_FIXTURE_PIN.json');
const write=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n',{flag:'wx'});
if(fs.existsSync(path.join(out,'CUSTODY.lock.json')))throw Error('DELIVERY_ALREADY_SEALED');
verifyFixture(path.join(out,'fixture'),pin);
assert.equal(sha(read('OWNER_DIRECTIVE.json')),pin.binding.owner_directive_sha256);
assert.equal(sha(JSON.stringify(pin.tools)),pin.source_hash);
const parentRaw=fs.readFileSync(path.join(repository,pre.parent.path));assert.equal(sha(parentRaw),pre.parent.sha256);const parent=JSON.parse(parentRaw);
let preserved=0;for(const [name,binding]of Object.entries(parent.files)){
 if(pre.before[name]){assert.equal(sha(read(pre.before[name].copy)),binding.sha256);assert.equal(pre.before[name].sha256,binding.sha256);}
 else{assert.equal(sha(fs.readFileSync(path.join(repository,name))),binding.sha256,name);preserved++;}
}
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),pre.head);
assert.equal(cycle.profile,profile);assert.equal(cycle.exit_code,0);assert.equal(cycle.status,'T19_CLOSED_OWNER_AUTHORIZED_MOCK_ONLY');
assert.equal(cycle.cp.checks.eval.status,'NOT_RUN');assert.equal(cycle.cp.status,'exported');assert.equal(cycle.cp.approvals.length,2);assert.equal(cycle.cp.approval_history.length,1);
assert.ok(cycle.cp.approvals.every(a=>a.approved_version_hash===pin.binding.proposal_version_hash&&a.reason.includes(profile)));
const validations=cycle.events.filter(e=>e.operation==='validate --strict / lint');assert.equal(validations.length,2);
for(const e of validations){assert.equal(e.data.exit_code,0);assert.equal(e.data.validation.result,'VALID');assert.equal(e.data.lint.result,'VALID');assert.equal(e.data.eval_required,true);}
for(const r of cycle.resource_runs){const raw=JSON.parse(r.stdout);assert.equal(r.protocol_version,'3');assert.equal(r.engine_hash,pin.source_hash);assert.equal(raw.source.content_hash,pin.source_hash);assert.equal(raw.exit_code,r.exit_code);assert.equal(raw.data.profile,profile);assert.equal(r.active_processes_after,0);assert.equal(r.started.hard_memory_bytes,r.limits.memoryBytes);assert.equal(r.started.limit_flags&0x2200,0x2200);assert.ok(!['eval','qualify'].includes(r.operation));}
const native=cycle.native_controls.filter(r=>r.operation.startsWith('native validate'));assert.equal(native.length,2);assert.ok(native.every(r=>r.exit_code===3));
assert.ok(cycle.native_controls.some(r=>r.operation==='native approval rejects mock DB'));assert.ok(cycle.native_controls.some(r=>r.operation==='native export rejects mock DB'));
const patch=read('SEC-001.T19_APPROVED_MOCK.patch');assert.match(patch.toString('utf8'),/^# T19_OWNER_APPROVED_MOCK/);assert.match(patch.toString('utf8'),/T19_MOCK_EVAL_EVIDENCE/);assert.equal('sha256:'+sha(patch),cycle.artifact.artifact.content_hash);
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t19-patch-check-'));execFileSync('git',['-C',scratch,'init','-q']);const gitApply={profile,command:'git apply --check',cwd:scratch,exit_code:0,stdout:execFileSync('git',['-C',scratch,'apply','--check',path.join(out,'SEC-001.T19_APPROVED_MOCK.patch')],{encoding:'utf8'}),source_applied:false};
const db=new DatabaseSync(path.join(out,'MOCK_DRAFT/studio.sqlite'),{readOnly:true});let dbSummary;
try{
 const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all(),rows=db.prepare("SELECT payload_json FROM audit_events WHERE event_type='t19.mock.evidence'").all();assert.equal(tables.length,12);assert.equal(rows.length,3);
 const kinds=rows.map(r=>{const p=JSON.parse(JSON.parse(r.payload_json).reason);assert.equal(p.profile,profile);assert.equal(p.real_e4_status,'NOT_RUN');assert.equal(p.receipt.profile,profile);return p.kind;});assert.deepEqual(kinds.sort(),['EvalResult','GitHubGate','SourceGrant']);
 dbSummary={tables:tables.length,mock_evidence_records:rows.length,current_approvals:db.prepare('SELECT COUNT(*) n FROM change_package_approvals').get().n,invalidated_approvals:db.prepare('SELECT COUNT(*) n FROM change_package_approval_history').get().n};
}finally{db.close();}
const log=read('NPM_TEST.log').toString('utf8'),testCount=Number(log.match(/(?:ℹ|#) tests (\d+)/u)?.[1]),passes=Number(log.match(/(?:ℹ|#) pass (\d+)/u)?.[1]);assert.equal(testCount,84);assert.equal(passes,84);assert.match(log,/(?:ℹ|#) fail 0/u);assert.match(log,/(?:ℹ|#) skipped 0/u);
const commands=json('COMMANDS.json');for(const command of commands){
 if(command.command.startsWith('git diff --check')){
  assert.equal(command.exit_code,2);assert.equal(command.status,'EXPECTED_PREEXISTING_MARKDOWN_HARD_BREAKS');
  const before=read(pre.before['docs/INDEX.md'].copy).toString('utf8').split(/\r?\n/),after=fs.readFileSync(path.join(repository,'docs/INDEX.md'),'utf8').split(/\r?\n/);assert.equal(before[2],after[2]);assert.equal(before[3],after[3]);assert.ok(before[2].endsWith('  ')&&before[3].endsWith('  '));
 }else assert.equal(command.exit_code,0);
}
assert.ok(!fs.existsSync(path.join(repository,'server/studio/aghr/e4')),'E4 code must not be created');
const diffs={};fs.mkdirSync(path.join(out,'after'),{recursive:true});for(const [name,b]of Object.entries(pre.before)){
 const raw=fs.readFileSync(path.join(repository,name)),copy='after/'+path.basename(name)+'.raw';fs.writeFileSync(path.join(out,copy),raw,{flag:'wx'});diffs[name]={before:b,after:{sha256:sha(raw),bytes:raw.length,copy}};
}
// Human-readable diff normalizes CRLF for display; custody always hashes raw
// before/after bytes. Only these two process-created scratch files are removed.
const diffRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t19-doc-diff-')),oldFile=path.join(diffRoot,'old'),newFile=path.join(diffRoot,'new');let changes='# Display diff: LF normalization only; see BEFORE_AFTER.json for raw-byte custody.\n';
try{for(const [name,d]of Object.entries(diffs)){
 fs.writeFileSync(oldFile,read(d.before.copy).toString('utf8').replaceAll('\r\n','\n'));fs.writeFileSync(newFile,read(d.after.copy).toString('utf8').replaceAll('\r\n','\n'));
 let delta;try{delta=execFileSync('git',['diff','--no-index','--no-ext-diff','--text',oldFile,newFile],{encoding:'utf8'});}catch(error){if(error.status!==1)throw error;delta=error.stdout;}
 changes+=delta.split('\n').map(line=>line.startsWith('diff --git ')?'diff --git a/'+name+' b/'+name:line.startsWith('--- ')?'--- a/'+name:line.startsWith('+++ ')?'+++ b/'+name:line).join('\n');
}}finally{if(fs.existsSync(oldFile))fs.unlinkSync(oldFile);if(fs.existsSync(newFile))fs.unlinkSync(newFile);fs.rmdirSync(diffRoot);}
fs.writeFileSync(path.join(out,'CHANGES.patch'),changes,{flag:'wx'});
write('BEFORE_AFTER.json',diffs);write('GIT_APPLY_CHECK.json',gitApply);
write('VERIFICATION.json',{profile,status:'PASS_FOR_MOCK_SCOPE_ONLY',exit_code:0,parent_files_preserved:preserved,derived_docs_changed:Object.keys(pre.before),native_hash:pin.native_source_hash,mock_source_hash:pin.source_hash,npm_tests:{tests:testCount,pass:passes,fail:0,skip:0},database:dbSummary,mock_resource_runs:cycle.resource_runs.length,native_validation_exit_codes:native.map(r=>r.exit_code),git_apply_check:0,e4:'REQUIRED / NOT_RUN / NOT_WAIVED',ui:'UNCHANGED; prior real Edge evidence retained, no new browser qualification claim',source_written:false,state_written:false});
if(process.argv.includes('--seal')){
 const files={};const add=name=>{const raw=fs.readFileSync(path.join(repository,name));files[name]={sha256:sha(raw),bytes:raw.length};};
 const walk=dir=>{for(const ent of fs.readdirSync(path.join(repository,dir),{withFileTypes:true})){const name=dir+'/'+ent.name;assert.ok(!ent.isSymbolicLink());if(ent.isDirectory())walk(name);else add(name);}};
 walk(rel);walk('tools/t19');for(const name of ['tests/studio_t19_mock.test.mjs','docs/plans/STUDIO_E4_EXECUTION_PROPOSAL_AR.md',...Object.keys(pre.before)])add(name);
 write('CUSTODY.lock.json',{algorithm:'SHA256 raw bytes; not owner signature',profile,parent:pre.parent,exceptions:diffs,files});
}
console.log(JSON.stringify({profile,status:'VERIFIED',tests:testCount,parent_files_preserved:preserved,mock_resource_runs:cycle.resource_runs.length,sealed:process.argv.includes('--seal')}));
