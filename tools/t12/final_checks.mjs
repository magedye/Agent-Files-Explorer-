import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {verifyFixture,profile} from './mock_bridge.mjs';
import {verifySource,sourceHash} from '../../server/studio/aghr/cli-bridge.js';
const out='docs/evidence/studio-t12-mock-write-core-2026-10-23',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pin=read(out+'/HOST_FIXTURE_PIN.json'),root=path.resolve(pin.candidate_root),host=verifyFixture(root,pin),runs=read(out+'/RUN_RESULTS.json');
assert.equal(Object.keys(verifySource()).length,46);assert.equal(host.grants.length,47);assert.equal(Object.keys(host.source_set).length,48);
let active=0,overrides=0;
for(const grant of host.grants){const item=read(path.join(root,grant.item_path));assert.equal(item.authority.level,'project');if(item.authority.status==='active')active++;if(item.authority.approvedBy==='OWNER_T12_OVERRIDE')overrides++;
 const provenance=read(path.join(root,'drafting/FIELD_PROVENANCE.json')).items[item.id];assert.equal(provenance.fields['/authority/source'].status,profile);if(item.force!=='SHOULD'){assert.equal(provenance.fields['/authority/status'].status,profile);assert.equal(provenance.fields['/authority/approvedBy'].status,profile);}}
assert.equal(active,44);assert.equal(overrides,44);
for(const command of ['validate','lint']){
 const result=read(`${out}/mock-${command}.stdout.json`);assert.equal(result.command,command);assert.equal(result.protocol_version,'3');assert.equal(result.exit_code,0);assert.equal(result.result,'VALID');assert.equal(result.source.content_hash,sourceHash);assert.equal(result.data.validation.items.length,47);assert.ok(result.checks.reason.startsWith(profile+':'));assert.equal(result.data.validation.qualification,'NOT_RUN');assert.equal(result.data.validation.governance_release_acceptance,'NOT_GRANTED');
 assert.equal(sha(fs.readFileSync(`${out}/mock-${command}.stdout.json`)),runs.results[command].stdout_sha256);assert.equal(sha(fs.readFileSync(`${out}/mock-${command}.stderr.txt`)),runs.results[command].stderr_sha256);
}
const native=read(out+'/native-control.stdout.json');assert.equal(native.result,'BLOCKED');assert.equal(native.exit_code,3);assert.equal(native.data.validation.items.length,47);
const originalRoot=path.dirname(root),originalPin=read('docs/evidence/studio-t12-2026-10-23/CANDIDATE_FINAL_PIN.json');for(const [name,info]of Object.entries(originalPin))assert.equal(sha(fs.readFileSync(path.join(originalRoot,name))),info.sha256);
const map={};function walk(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){assert.ok(!entry.isSymbolicLink());const rel=prefix?prefix+'/'+entry.name:entry.name,p=path.join(dir,entry.name);if(entry.isDirectory())walk(p,rel);else{const b=fs.readFileSync(p);assert.ok(!b.includes(Buffer.from('BEGIN PRIVATE KEY'))&&!b.includes(Buffer.from('BEGIN OPENSSH PRIVATE KEY')));map[rel]={sha256:sha(b),bytes:b.length};}}}walk(root);
fs.writeFileSync(out+'/MOCK_CANDIDATE_PIN.json',JSON.stringify(map,null,2)+'\n');
assert.ok(!fs.readFileSync('server/studio/runtime.js','utf8').includes('openPersistentStore'));
assert.match(fs.readFileSync('server/studio/db/catalog.js','utf8'),/new DatabaseSync\(':memory:'\)/);
assert.ok(!fs.readFileSync('server/studio/write-authorization.js','utf8').includes("from '../../tools/t12"));
fs.writeFileSync(out+'/NODE_CHECKS.json',JSON.stringify({status:'PASS',profile,rules:47,active_overrides:44,source_set:48,engine_files:46,source_hash:sourceHash,mock_strict_exit:0,mock_lint_exit:0,native_control_exit:3,original_drafts_unchanged:true,private_key_saved:false,default_runtime_persistent_storage:false},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',profile,rules:47,active_overrides:44,engine_unchanged:true}));
