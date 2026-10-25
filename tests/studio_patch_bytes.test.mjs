import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createBoundedValidator} from '../server/studio/aghr/bounded-validator.js';
test('Patch preserves exact proposed YAML without final newline; no source apply by app',async()=>{
 const input=JSON.parse(fs.readFileSync('docs/evidence/studio-e5-t16-preview-2026-10-23/VALID_INPUT.json','utf8'));
 const payload={...input.payload,proposed_yaml:input.payload.proposed_yaml.trimEnd()};
 const engine=await createBoundedValidator({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),base:input.base});
 try{
  const result=await engine.previewRun(payload);assert.match(result.data.diff,/\\ No newline at end of file/);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-patch-bytes-')),patch=path.join(dir,'input.patch');fs.writeFileSync(patch,result.data.diff);
  assert.equal(spawnSync('git',['-C',dir,'init','-q']).status,0);
  const checked=spawnSync('git',['-C',dir,'apply','--check',patch]);assert.equal(checked.status,0,checked.stderr.toString());
  assert.equal(spawnSync('git',['-C',dir,'apply',patch]).status,0);
  assert.equal(fs.readFileSync(path.join(dir,result.data.files[0].path),'utf8'),payload.proposed_yaml);
 }finally{engine.close();}
});
