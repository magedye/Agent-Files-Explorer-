import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { createCatalog } from '../server/studio/db/catalog.js';
import { createBridge } from '../server/studio/aghr/cli-bridge.js';
import {syntheticBridge} from './helpers/studio_vectors.mjs';

test('T03 real scan, twelve memory tables, immutable raw source and absence', async () => {
 const catalog=createCatalog();
 try {
  assert.equal(catalog.tables.length,12);
  assert.equal(catalog.db.prepare('PRAGMA database_list').all()[0].file,'');
  assert.equal(catalog.db.prepare('PRAGMA user_version').get().user_version,1);
  const run=await catalog.scan(createBridge({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe')}));
  assert.equal(run.report.result,'VALID');assert.equal(catalog.list().length,1);
  const v=catalog.list()[0];assert.equal(v.priority_tier,null);assert.equal(v.item.authority,undefined);assert.equal(v.is_review_due,null);
  assert.equal(catalog.list({q:'OBS-REFERENCE'}).length,1);
  assert.equal(catalog.list({kind:'CONSTRAINT'}).length,0);
  assert.deepEqual(catalog.original(v.source_path).raw,fs.readFileSync(path.join('governance_packages/candidates/AGHR_rc3_Core_Candidate',v.source_path)));
  assert.equal(catalog.db.prepare('SELECT COUNT(*) AS n FROM instruction_items_cache').get().n,1);
  assert.throws(()=>catalog.db.exec("INSERT INTO target_projects (id,workspace_id,name,path) VALUES ('a','absent','x','x')"),/FOREIGN KEY/);
  assert.throws(()=>catalog.db.exec("ATTACH DATABASE 'temp/MUST-NOT-EXIST.sqlite' AS forbidden"),/authorized/);
  assert.throws(()=>catalog.db.exec('PRAGMA temp_store=FILE'),/authorized/);
 } finally {catalog.close();}
});
test('T03 synthetic due/future lifecycle, capability absence states and atomic rollback',async()=>{
 const catalog=createCatalog();try{
  await catalog.scan(syntheticBridge(),new Date('2026-10-23T00:00:00Z'));
  assert.equal(catalog.list().length,4);
  assert.equal(catalog.list({is_review_due:'true'}).length,1);
  assert.equal(catalog.snapshot().capabilities[0].availability[0].state,'UNKNOWN');
  assert.deepEqual(catalog.snapshot().capabilities[0].qualifications,[]);
  assert.equal(catalog.db.prepare('SELECT COUNT(*) AS n FROM capability_items_cache').get().n,1);
  await assert.rejects(catalog.scan(syntheticBridge({duplicate:true})),/UNIQUE/);
  assert.equal(catalog.list().length,4);
  assert.equal(catalog.db.prepare('SELECT COUNT(*) AS n FROM instruction_items_cache').get().n,4);
 }finally{catalog.close();}
});
