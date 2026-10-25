// T37 regression coverage. Synthetic inputs test rejection contracts; they do
// not qualify native hosts, authenticate GitHub, or grant release acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {createArtifactStore} from '../server/studio/artifact-store.js';
import {createNativeAdapter} from '../server/studio/hosts/native-adapters.mjs';
import {readSubmission,mergeBinding,compareReports} from '../server/studio/ci/assessment.mjs';
import {sourceHash} from '../server/studio/aghr/cli-bridge.js';

test('T37 patch artifacts retain exact UTF-8 bytes, reject drift and roll back only their own file',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t37-artifact-'));
 try{
  const store=createArtifactStore(root),patch='مراجعة\r\n+approved\n';
  const input={id:'CP-release-check',versionHash:'sha256:'+'a'.repeat(64),patch,draftOnly:true};
  for(const invalid of [{id:'../escape'},{versionHash:'sha256:bad'},{patch:42},{patch:'x'.repeat(2*1024**2+1)}])assert.throws(()=>store.write({...input,...invalid}),/ARTIFACT_INPUT_INVALID/);
  const first=store.write(input);
  assert.deepEqual(store.read(first.artifact),Buffer.from(patch));
  assert.equal(first.artifact.content_hash,'sha256:'+crypto.createHash('sha256').update(patch).digest('hex'));
  assert.throws(()=>store.write(input),/EEXIST/);
  assert.throws(()=>store.read({...first.artifact,path:path.join(root,'outside.patch')}),/ARTIFACT_PATH_INVALID/);
  assert.throws(()=>store.read({...first.artifact,bytes:first.artifact.bytes+1}),/ARTIFACT_DRIFT/);
  fs.appendFileSync(first.artifact.path,'tampered');
  assert.throws(()=>store.read(first.artifact),/ARTIFACT_DRIFT/);
  first.rollback();first.rollback();assert.equal(fs.existsSync(first.artifact.path),false);
  const second=store.write({...input,draftOnly:false}),alias=path.join(root,'linked.patch');
  fs.linkSync(second.artifact.path,alias);
  assert.throws(()=>store.read(second.artifact),/ARTIFACT_FILE_UNSAFE/);
  second.rollback();assert.equal(fs.existsSync(second.artifact.path),true);
  fs.unlinkSync(alias);second.rollback();assert.equal(fs.existsSync(second.artifact.path),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('T37 native adapters reject absent channels, unisolated execution, drift and invented receipts',async()=>{
 const cwd=process.cwd(),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
 for(const invalid of [{host:'unknown',cwd},{host:'codex',cwd:'relative'},{host:'codex',cwd,binary:'relative.exe'}])assert.throws(()=>createNativeAdapter(invalid),/NATIVE_CONFIG_INVALID/);
 const missing=createNativeAdapter({host:'codex',cwd,python});
 await assert.rejects(missing.run('version'),/NATIVE_CHANNEL_UNAVAILABLE/);
 assert.throws(()=>missing.observation({job:{status:'passed'}}),/UNTRUSTED_NATIVE_RECEIPT/);
 missing.cancel();
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t37-native-'));
 try{
  const binary=path.join(root,'never-executed.exe');fs.writeFileSync(binary,'synthetic guard input');
  const config={host:'codex',cwd,binary,python};
  await assert.rejects(createNativeAdapter(config).run('discover'),/ISOLATED_NATIVE_SESSION_REQUIRED/);
  await assert.rejects(createNativeAdapter({...config,isolated:true}).run('discover'),/ISOLATED_NATIVE_STATE_REQUIRED/);
  const adapter=createNativeAdapter({...config,isolated:true,stateDirectory:root});
  await assert.rejects(adapter.run('shell'),/NATIVE_OPERATION_UNAVAILABLE/);
  await assert.rejects(adapter.run('execute',{prompt:'review'}),/NATIVE_SKILL_INPUT_REQUIRED/);
  fs.appendFileSync(binary,'drift');
  await assert.rejects(adapter.run('version'),/NATIVE_SOURCE_DRIFT/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('T37 CI submissions bind byte manifests and merge identities without trusting JSON claims',()=>{
 const entry={path:'.aghr/runtime_evidence/task-1.jsonl',bytes:1,content_hash:'sha256:'+'a'.repeat(64)};
 const report={command:'validate',protocol_version:'3',source:{content_hash:sourceHash},inputs:{candidate_hash:'a',inputs_hash:'b',config_hash:'c'},result:'VALID',exit_code:0};
 const submission={profile:'aghr-ci-submission.1',evidence:[entry],local_report:report};
 const read=value=>readSubmission(Buffer.from(JSON.stringify(value)));
 assert.deepEqual(read(submission),submission);
 for(const invalid of [{...submission,extra:true},{...submission,profile:'production'},{...submission,evidence:[]},{...submission,evidence:[entry,entry]},{...submission,evidence:[{...entry,path:'../outside.jsonl'}]},{...submission,evidence:[{...entry,bytes:0}]},{...submission,local_report:{...report,source:{content_hash:'invented'}}}])assert.throws(()=>read(invalid));
 assert.throws(()=>readSubmission('text'),/SUBMISSION_SIZE_LIMIT/);
 assert.throws(()=>readSubmission(Buffer.alloc(1024**2+1)),/SUBMISSION_SIZE_LIMIT/);
 assert.throws(()=>readSubmission(Buffer.from([0xff])));
 assert.equal(compareReports(report,structuredClone(report)).status,'MATCH');
 assert.throws(()=>compareReports(report,{...report,result:'BLOCKED'}),/STUDIO_CI_DIVERGENCE/);
 const binding={repository:'example/repository',sha:'a'.repeat(40),branch:'main'};
 const pr={merged:true,state:'closed',number:1,merge_commit_sha:binding.sha,base:{ref:'main',repo:{full_name:binding.repository}},merged_at:'2020-01-01T00:00:00Z'};
 assert.equal(mergeBinding({...binding,pr}).number,1);
 for(const invalid of [{merged:false},{state:'open'},{number:0},{merge_commit_sha:'b'.repeat(40)},{merged_at:'2999-01-01T00:00:00Z'},{base:{ref:'other',repo:{full_name:binding.repository}}}])assert.throws(()=>mergeBinding({...binding,pr:{...pr,...invalid}}),/MERGED_PR_REQUIRED/);
});
