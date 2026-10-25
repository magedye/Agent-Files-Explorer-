// Owner-authorized read/validate harness. Evidence writes belong to this parent;
// the pinned CLI runs under the existing audited no-write Python launcher.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createBridge,verifySource,sourceHash} from '../server/studio/aghr/cli-bridge.js';
const ev='docs/evidence/studio-t06-2026-10-23/';
const inventory=JSON.parse(fs.readFileSync(ev+'CANDIDATE_INVENTORY.json','utf8'));
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const before=verifySource(),results={};
for(const [label,entry]of Object.entries(inventory)){
 const root=path.resolve(entry.package_root);
 for(const [p,info]of Object.entries(entry.files))assert.equal(sha(fs.readFileSync(path.join(root,p))),info.sha256);
 const bridge=createBridge({python,packageRoot:root});
 const result=await bridge.run('validate');
 for(const [p,info]of Object.entries(entry.files))assert.equal(sha(fs.readFileSync(path.join(root,p))),info.sha256);
 fs.writeFileSync(ev+label+'.stdout.json',result.stdout);fs.writeFileSync(ev+label+'.stderr.txt',result.stderr);
 const finding=result.report.data.validation?.findings||[];
 results[label]={result:result.report.result,exit_code:result.exitCode,started_at:result.startedAt,finished_at:result.finishedAt,invocation:result.invocation,protocol_version:result.report.protocol_version,source_hash:result.report.source.content_hash,inputs:result.report.inputs,checks:result.report.checks,stages:result.report.data.validation?.stages,findings:finding,stdout_sha256:sha(Buffer.from(result.stdout)),stderr_sha256:sha(Buffer.from(result.stderr)),source_written:false};
 fs.writeFileSync(ev+label+'.execution.json',JSON.stringify(results[label],null,2)+'\n');
 if(label==='complete'){
  assert.equal(result.exitCode,3);assert.equal(result.report.result,'BLOCKED');
  assert.equal(result.report.data.validation.stages.structure.status,'PASS');
  for(const code of ['AUTHORITY_SOURCE_UNVERIFIED','ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE'])assert.ok(finding.some(f=>f.code===code));
 }else{
  assert.equal(result.exitCode,1);assert.equal(result.report.result,'INVALID');
  const pointer={'missing-authority-level':'/authority/level','missing-scope':'/scope','missing-eval-fixtures':'/verification/evalFixtures'}[label];
  assert.ok(finding.some(f=>f.code==='SCHEMA_REQUIRED'&&f.pointer===pointer));
 }
 console.log(label+': '+result.report.result+' exit '+result.exitCode+'; '+finding.map(f=>f.code+' '+f.pointer).join(', '));
}
assert.deepEqual(verifySource(),before);
fs.writeFileSync(ev+'RUN_RESULTS.json',JSON.stringify({T06:'INCOMPLETE_ACCEPTANCE_NOT_MET',engine_source_hash:sourceHash,scope:'Real protocol-3 CLI through Python bridge; complete template structure passed but governing acceptance blocked',positive_exit_0_proven:false,negative_exit_1_proven:true,results,source_engine_unchanged:true,all_candidate_raw_hashes_unchanged:true},null,2)+'\n');
