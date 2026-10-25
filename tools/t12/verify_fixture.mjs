import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {runMock} from './mock_bridge.mjs';
import {createBridge} from '../../server/studio/aghr/cli-bridge.js';
const out='docs/evidence/studio-t12-mock-write-core-2026-10-23',pin=JSON.parse(fs.readFileSync(out+'/HOST_FIXTURE_PIN.json','utf8'));
const root=path.resolve(pin.candidate_root),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const results={};
for(const command of ['validate','lint']){
 const r=await runMock({python,root,pin,command});assert.equal(r.exitCode,0);assert.equal(r.report.data.validation.items.length,47);assert.equal(r.report.result,'VALID');
 fs.writeFileSync(`${out}/mock-${command}.stdout.json`,r.stdout);fs.writeFileSync(`${out}/mock-${command}.stderr.txt`,r.stderr);
 results[command]={result:r.report.result,exit_code:r.exitCode,profile:r.profile,startedAt:r.startedAt,finishedAt:r.finishedAt,invocation:r.invocation,inputs:r.report.inputs,stdout_sha256:sha(Buffer.from(r.stdout)),stderr_sha256:sha(Buffer.from(r.stderr))};
}
const native=await createBridge({python,packageRoot:root}).run('validate');assert.equal(native.exitCode,3);assert.equal(native.report.result,'BLOCKED');
fs.writeFileSync(out+'/native-control.stdout.json',native.stdout);fs.writeFileSync(out+'/native-control.stderr.txt',native.stderr);
results.native_control={result:native.report.result,exit_code:native.exitCode,invocation:native.invocation,diagnostics:native.report.diagnostics.map(d=>d.code)};
fs.writeFileSync(out+'/RUN_RESULTS.json',JSON.stringify({status:'T12_PASSING_CANDIDATE_MOCK_ONLY',owner_conditional_acceptance_satisfied:true,actual_native_cli:'BLOCKED/3',results},null,2)+'\n');
console.log(JSON.stringify({mock_validate:results.validate.exit_code,mock_lint:results.lint.exit_code,items:47,native_control:3,scope:pin.profile}));
