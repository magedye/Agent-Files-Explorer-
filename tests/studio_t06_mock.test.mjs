import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {runMockValidation,verifyMockFixture} from '../tools/t06/mock_bridge.mjs';
const evidence='docs/evidence/studio-t06-mock-2026-10-23/';
const pin=JSON.parse(fs.readFileSync(evidence+'HOST_FIXTURE_PIN.json','utf8'));
const root=path.resolve(pin.candidate_root),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

test('T06 authorized mock reaches actual E2 VALID/0 while retaining explicit simulation and unknown real trust',async()=>{
 const result=await runMockValidation({python,root,pin});
 assert.equal(result.exitCode,0);assert.equal(result.report.result,'VALID');assert.equal(result.report.protocol_version,'3');
 assert.match(result.report.checks.reason,/T06_MOCK_ONLY/);assert.match(result.stderr,/never a production/);
 assert.equal(result.report.source.publisher_authentication,'UNKNOWN');assert.equal(result.report.source.qualification,'NOT_RUN');
 assert.equal(result.report.data.validation.governance_release_acceptance,'NOT_GRANTED');
 assert.ok(result.report.inputs.catalog.some(s=>s.path==='.t06/mock-evidence.json'));
});
test('T06 source/receipt/public-key bindings and fixture scope cannot be self-declared',()=>{
 const host=verifyMockFixture(root,pin);assert.equal(host.profile,'T06_MOCK_ONLY');
 for(const changed of [{profile:'PRODUCTION'},{source_sha256:'0'.repeat(64)},{receipt_sha256:'0'.repeat(64)},{public_key_sha256:'0'.repeat(64)},{authority:{...pin.authority,level:'project'}}])assert.throws(()=>verifyMockFixture(root,{...pin,...changed}),/MOCK_/);
 assert.throws(()=>verifyMockFixture(path.resolve('temp'),pin),/OUTSIDE_CANDIDATE/);
});
test('T06 mock never bypasses missing scope or invalid signature',async()=>{
 const parent=path.dirname(root),dir=fs.mkdtempSync(path.join(parent,'mock-negative-'));
 try{
  fs.mkdirSync(path.join(dir,'policies/security'),{recursive:true});fs.mkdirSync(path.join(dir,'.t06'));
  fs.copyFileSync(path.join(root,'aghr.json'),path.join(dir,'aghr.json'));
  const text=fs.readFileSync(path.join(root,'policies/security/secrets.yaml'),'utf8').split('\n').filter(line=>!line.startsWith('scope:')).join('\n');
  fs.writeFileSync(path.join(dir,'policies/security/secrets.yaml'),text);
  const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519'),pub=publicKey.export({format:'pem',type:'spki'});
  fs.writeFileSync(path.join(dir,'.t06/mock-public.pem'),pub);
  const record=JSON.parse(fs.readFileSync(path.join(root,'.t06/mock-evidence.json'),'utf8'));
  const payload=JSON.parse(Buffer.from(record.payload_base64,'base64'));payload.source_sha256=sha(Buffer.from(text));
  const bytes=Buffer.from(JSON.stringify(payload));record.payload_base64=bytes.toString('base64');record.signature_base64=crypto.sign(null,bytes,privateKey).toString('base64');
  fs.writeFileSync(path.join(dir,'.t06/mock-evidence.json'),JSON.stringify(record));fs.copyFileSync(path.join(root,'.t06/source-attestation.json'),path.join(dir,'.t06/source-attestation.json'));
  const configured={...pin,candidate_root:dir,source_sha256:payload.source_sha256,public_key_sha256:sha(Buffer.from(pub)),receipt_sha256:sha(fs.readFileSync(path.join(dir,'.t06/mock-evidence.json')))};
  const result=await runMockValidation({python,root:dir,pin:configured});
  assert.equal(result.exitCode,1);assert.equal(result.report.result,'INVALID');assert.ok(result.report.data.validation.findings.some(f=>f.pointer==='/scope'&&f.code==='SCHEMA_REQUIRED'));
  record.signature_base64=Buffer.alloc(64).toString('base64');fs.writeFileSync(path.join(dir,'.t06/mock-evidence.json'),JSON.stringify(record));
  configured.receipt_sha256=sha(fs.readFileSync(path.join(dir,'.t06/mock-evidence.json')));
  assert.throws(()=>verifyMockFixture(dir,configured),/MOCK_SIGNATURE_INVALID/);
 }finally{assert.ok(dir.startsWith(parent+path.sep+'mock-negative-'));fs.rmSync(dir,{recursive:true});}
});
