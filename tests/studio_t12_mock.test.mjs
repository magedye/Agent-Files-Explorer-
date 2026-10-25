import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {runMock,verifyFixture,profile} from '../tools/t12/mock_bridge.mjs';
const out='docs/evidence/studio-t12-mock-write-core-2026-10-23',pin=JSON.parse(fs.readFileSync(out+'/HOST_FIXTURE_PIN.json','utf8'));
const root=path.resolve(pin.candidate_root),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function copy(){const parent=path.dirname(root),dir=fs.mkdtempSync(path.join(parent,'t12-negative-'));fs.cpSync(root,dir,{recursive:true});return {dir,cleanup(){assert.ok(path.resolve(dir).startsWith(parent+path.sep+'t12-negative-'));fs.rmSync(dir,{recursive:true,force:true});}};}
test('T12 owner-approved mock reaches actual E2 strict VALID/0 for exactly 47 items',async()=>{
 const r=await runMock({python,root,pin});assert.equal(r.exitCode,0);assert.equal(r.report.result,'VALID');assert.equal(r.report.data.validation.items.length,47);
 assert.match(r.report.checks.reason,/T12_OWNER_APPROVED_MOCK/);assert.match(r.stderr,/never real backend/);
 assert.equal(r.report.data.validation.governance_release_acceptance,'NOT_GRANTED');assert.equal(r.report.source.qualification,'NOT_RUN');
 const recorded=JSON.parse(fs.readFileSync(out+'/RUN_RESULTS.json','utf8'));assert.equal(recorded.results.lint.exit_code,0);assert.equal(recorded.results.native_control.exit_code,3);
});
test('T12 altered signatures, keys, unsigned policy additions and manifest drift reject',()=>{
 assert.throws(()=>verifyFixture(root,{...pin,profile:'PRODUCTION'}),/MOCK_/);assert.throws(()=>verifyFixture(root,{...pin,public_key_sha256:'0'.repeat(64)}),/MOCK_/);
 const f=copy();try{
  const manifest=path.join(f.dir,'aghr.json'),original=fs.readFileSync(manifest);fs.writeFileSync(manifest,Buffer.concat([original,Buffer.from(' ')]));assert.throws(()=>verifyFixture(f.dir,pin),/MOCK_SOURCE_SET/);fs.writeFileSync(manifest,original);
  const extra=path.join(f.dir,'policies/drafts/unsigned.json');fs.writeFileSync(extra,'{}');assert.throws(()=>verifyFixture(f.dir,pin),/MOCK_SOURCE_SET/);fs.unlinkSync(extra);
  const receiptPath=path.join(f.dir,'.t12/SourceGrant.json'),receipt=JSON.parse(fs.readFileSync(receiptPath,'utf8'));receipt.signature_base64=Buffer.alloc(64).toString('base64');fs.writeFileSync(receiptPath,JSON.stringify(receipt));
  assert.throws(()=>verifyFixture(f.dir,{...pin,receipt_sha256:sha(fs.readFileSync(receiptPath))}),/MOCK_SIGNATURE_INVALID/);
 }finally{f.cleanup();}
});
test('T12 valid signed fixture cannot bypass missing scope',async()=>{
 const f=copy();try{
  const policyPath=path.join(f.dir,'policies/drafts/AGHR-001.json'),item=JSON.parse(fs.readFileSync(policyPath,'utf8'));delete item.scope;fs.writeFileSync(policyPath,JSON.stringify(item,null,2)+'\n');
  const file=path.join(f.dir,'.t12/SourceGrant.json'),receipt=JSON.parse(fs.readFileSync(file,'utf8')),payload=JSON.parse(Buffer.from(receipt.payload_base64,'base64'));
  payload.grants.find(g=>g.item_ids[0]==='AGHR-001').source_sha256=sha(fs.readFileSync(policyPath));
  const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519'),pub=publicKey.export({format:'pem',type:'spki'}),bytes=Buffer.from(JSON.stringify(payload));
  receipt.payload_base64=bytes.toString('base64');receipt.signature_base64=crypto.sign(null,bytes,privateKey).toString('base64');fs.writeFileSync(file,JSON.stringify(receipt));fs.writeFileSync(path.join(f.dir,'.t12/mock-public.pem'),pub);
  const changed={...pin,public_key_sha256:sha(pub),receipt_sha256:sha(fs.readFileSync(file)),source_set:{...pin.source_set,'policies/drafts/AGHR-001.json':sha(fs.readFileSync(policyPath))}};
  const r=await runMock({python,root:f.dir,pin:changed});assert.equal(r.exitCode,1);assert.equal(r.report.result,'INVALID');assert.ok(r.report.diagnostics.some(d=>d.code==='SCHEMA_REQUIRED'&&d.pointer==='/scope'));
 }finally{f.cleanup();}
});
