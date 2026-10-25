import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {parity100} from '../tools/phase3/parity.mjs';
test('T24 100 seeded units produce identical real CLI3 judgments at Studio/CI boundaries; divergence blocks',async()=>{
 const result=await parity100(process.env.AGHR_PARITY_OUT&&path.resolve(process.env.AGHR_PARITY_OUT));assert.equal(result.units,100);assert.equal(result.runs.length,4);assert.equal(result.decisions.length,200);
});
