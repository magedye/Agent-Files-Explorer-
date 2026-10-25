import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {verifyFixture,createMockValidator,sha,profile} from '../tools/t19/mock_bridge.mjs';
import {createBoundedValidator} from '../server/studio/aghr/bounded-validator.js';

const out=path.resolve('docs/evidence/studio-t19-mock-2026-10-24'),root=path.join(out,'fixture'),pin=JSON.parse(fs.readFileSync(path.join(out,'HOST_FIXTURE_PIN.json'))),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');

test('T19 simulation rejects altered signatures, stale bindings and removed MOCK labels',()=>{
 const host=verifyFixture(root,pin);assert.equal(host.profile,profile);assert.equal(host.eval.executed,false);assert.equal(host.eval.real_e4_status,'NOT_RUN');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t19-negative-'));fs.cpSync(root,dir,{recursive:true});
 try{
  assert.throws(()=>verifyFixture(dir,{...pin,profile:'PRODUCTION'}),/MOCK_PROFILE_REQUIRED/);
  const file=path.join(dir,'EvalResult.json'),original=fs.readFileSync(file),envelope=JSON.parse(original);
  envelope.signature_base64=Buffer.alloc(64).toString('base64');fs.writeFileSync(file,JSON.stringify(envelope));
  assert.throws(()=>verifyFixture(dir,{...pin,files:{...pin.files,'EvalResult.json':sha(fs.readFileSync(file))}}),/MOCK_SIGNATURE_INVALID/);
  fs.writeFileSync(file,original);assert.throws(()=>verifyFixture(dir,{...pin,binding:{...pin.binding,proposal_version_hash:'sha256:'+'0'.repeat(64)}}),/MOCK_RECEIPT_BINDING/);
  envelope.profile='REAL';fs.writeFileSync(file,JSON.stringify(envelope));assert.throws(()=>verifyFixture(dir,{...pin,files:{...pin.files,'EvalResult.json':sha(fs.readFileSync(file))}}),/MOCK_SIGNATURE_INVALID/);
 }finally{
  const absolute=path.resolve(dir);assert.equal(path.dirname(absolute),os.tmpdir());assert.ok(path.basename(absolute).startsWith('aghr-t19-negative-'));fs.rmSync(absolute,{recursive:true,force:true});
 }
});

test('T19 mock still enforces native mandatory schema and exact proposal binding',async()=>{
 const native=await createBoundedValidator({python,base:pin.binding.base}),mock=createMockValidator({python,base:pin.binding.base,root,pin,native}),payload=JSON.parse(fs.readFileSync(path.join(root,'PROPOSAL.json')));
 try{
  for(const field of ['authority.level','scope']){
   const value=JSON.parse(payload.proposed_yaml);if(field==='scope')delete value.scope;else delete value.authority.level;
   await assert.rejects(()=>mock.check({...payload,proposed_yaml:JSON.stringify(value)}),/required|authority|scope/i);
  }
  await assert.rejects(()=>mock.check({...payload,proposed_yaml:payload.proposed_yaml+'\n'}),/MOCK_PROPOSAL_BINDING/);
  const nativeResult=await native.check(payload);assert.equal(nativeResult.exit_code,3);assert.ok(nativeResult.findings.some(f=>f.code==='P0_EVAL_QUALIFICATION_UNAVAILABLE'));
  const simulated=await mock.check(payload);assert.equal(simulated.exit_code,0);assert.equal(simulated.profile,profile);assert.equal(simulated.eval_required,true);assert.equal(simulated.real_e4_status,'NOT_RUN');assert.equal(simulated.resource_receipt.active_processes_after,0);
 }finally{native.close();}
});
