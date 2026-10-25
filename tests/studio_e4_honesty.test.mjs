import test from 'node:test';
import assert from 'node:assert/strict';
import {runAcceptance} from '../tools/e4/acceptance.mjs';
test('E4.e seven real honesty guards and eight real local workflow scenarios reject false success',async()=>{
 const r=await runAcceptance({out:process.env.AGHR_E4_OUT});assert.equal(r.honesty.length,7);assert.equal(r.scenarios.length,8);assert.equal(r.status,'PASS_FOR_LOCAL_CORE');assert.equal(r.host_qualification.codex.status,'NOT_RUN');assert.equal(r.host_qualification.antigravity.status,'NOT_RUN');
});
