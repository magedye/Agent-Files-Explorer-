import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import { createBridge, decodeResult, sourceHash, verifySource } from '../server/studio/aghr/cli-bridge.js';

test('T02 source identity and command injection boundary', async () => {
  assert.equal(Object.keys(verifySource()).length, 46);
  assert.throws(() => createBridge({python:'python'}), /EXECUTABLE/);
  assert.throws(() => createBridge({python:path.resolve('temp/nonexistent-studio-python.exe')}), /ENOENT/);
  const bridge = createBridge({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe')});
  for (const cmd of ['eval','generate','validate; echo bad','--help',{},null]) await assert.rejects(bridge.run(cmd), /COMMAND_NOT_ALLOWED/);
  const result = await bridge.run('validate');
  assert.equal(result.exitCode, 0); assert.equal(result.report.result, 'VALID');
  assert.equal(result.report.source.content_hash, sourceHash);
  assert.equal(result.invocation.shell, false);
  const rejectedContext=await bridge.run('validate',{path:'../escape'});
  assert.equal(rejectedContext.exitCode,2);assert.equal(rejectedContext.report.result,'ERROR');assert.equal(rejectedContext.report.data,null);assert.match(rejectedContext.stderr,/INVALID_ARGUMENTS/);
});
test('T02 audited Python launcher denies filesystem, subprocess and network effects',()=>{
 const parent=path.resolve('temp'),dir=fs.mkdtempSync(path.join(parent,'studio-bridge-guard-'));
 const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
 try {
  const marker=path.join(dir,'MUST-NOT-EXIST');
  const probes=[`open(${JSON.stringify(marker)},'w').write('bad')`,`import os;os.mkdir(${JSON.stringify(marker)})`,`import subprocess;subprocess.run(['nonexistent-never-launched'])`,`import socket;socket.socket()`];
  for(const [n,code] of probes.entries()){
   const entry=path.join(dir,n+'.py');fs.writeFileSync(entry,code);
   const r=spawnSync(python,['-I','-B','-S','-X','utf8',path.resolve('server/studio/aghr/read-only-launcher.py'),entry],{encoding:'utf8',windowsHide:true});
   assert.notEqual(r.status,0);assert.match(r.stderr,/STUDIO_ZERO_WRITE/);assert.equal(fs.existsSync(marker),false);
  }
 }finally{assert.ok(dir.startsWith(parent+path.sep));fs.rmSync(dir,{recursive:true});}
});
test('T02 malformed, absent, forged status/exit and foreign engine reject', () => {
  for (const stdout of ['', 'null', 'not json', '{}', JSON.stringify({protocol_version:'2'})]) assert.throws(() => decodeResult(stdout,'',0,'validate'));
  const base={protocol_version:'3',command:'validate',source:{content_hash:sourceHash},exit_code:0,result:'VALID',checks:{status:'COMPLETE'},diagnostics:[],data:{validation:{result:'VALID'}}};
  assert.equal(decodeResult(JSON.stringify(base),'raw stderr',0,'validate').stderr,'raw stderr');
  for(const patch of [{exit_code:1},{result:'READ'},{source:{content_hash:'fake'}},{data:{}},{checks:{status:'NOT_RUN'}}]) assert.throws(()=>decodeResult(JSON.stringify({...base,...patch}),'',0,'validate'));
  for(const [result,exitCode] of [['INVALID',1],['ERROR',2],['BLOCKED',3]]) {
    const rejected=decodeResult(JSON.stringify({...base,result,exit_code:exitCode}),'preserved failure stderr',exitCode,'validate');
    assert.equal(rejected.report.result,result);assert.notEqual(rejected.exitCode,0);assert.equal(rejected.stderr,'preserved failure stderr');
  }
});
test('T06 candidate selection keeps engine pinned, refuses invalid structures and does not fabricate critical acceptance',async()=>{
 const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
 assert.throws(()=>createBridge({python,packageRoot:path.resolve('temp')}),/OUTSIDE_CANDIDATES/);
 assert.throws(()=>createBridge({python,packageRoot:'relative'}),/ROOT_INVALID/);
 const base=path.resolve('governance_packages/candidates/AGHR_T06_SEC001_Candidate');
 for(const [name,exitCode,pointer] of [['complete',3,null],['missing-authority-level',1,'/authority/level'],['missing-scope',1,'/scope'],['missing-eval-fixtures',1,'/verification/evalFixtures']]){
   const root=path.join(base,name),result=await createBridge({python,packageRoot:root}).run('validate');
   assert.equal(result.exitCode,exitCode);assert.equal(result.report.protocol_version,'3');assert.equal(result.report.source.content_hash,sourceHash);
   assert.equal(result.invocation.cwd,root);assert.equal(result.invocation.shell,false);
   const validation=result.report.data.validation;
   if(pointer)assert.ok(validation.findings.some(f=>f.code==='SCHEMA_REQUIRED'&&f.pointer===pointer));
   else{assert.equal(validation.stages.structure.status,'PASS');assert.equal(validation.result,'BLOCKED');assert.ok(validation.findings.some(f=>f.code==='AUTHORITY_SOURCE_UNVERIFIED'));assert.ok(validation.findings.some(f=>f.code==='ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE'));}
 }
});
