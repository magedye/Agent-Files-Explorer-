import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createE4Engine} from '../server/studio/aghr/e4-bridge.js';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),root=path.resolve('tests/fixtures/studio-e4/json-audit'),skill={id:'json-audit',source:'project',skillPath:root+'/SKILL.md',entry:root+'/worker.py',triggers:['review'],requires:[]};
const config={input:{document:{name:'actual'},required:['name']},task_criteria:JSON.stringify({all:[{pointer:'/valid',op:'equals',value:true}]}),runs:3,priority:'P0-Safety',max_violation_rate:0};
test('E4.d actual qualify uses 3600s/2GiB, three distinct runs, version-bound receipt and no imported qualification',async()=>{
 const engine=createE4Engine({python,skills:[skill]});try{
  const t=engine.createTask({task_id:'e4-d'});await assert.rejects(()=>engine.qualify(t,skill.id,{...config,runs:2}),/EVAL_MINIMUM_RUNS_REQUIRED/);
  const r=await engine.qualify(t,skill.id,config);assert.equal(r.data.status,'QUALIFIED');assert.equal(r.data.runs,3);assert.equal(r.receipt.exit_code,0);assert.equal(r.receipt.limits.timeoutMs,3600000);assert.equal(r.receipt.limits.memoryBytes,2147483648);
  const actual=engine.records.filter(r=>r.operation==='execute');assert.equal(actual.length,3);assert.ok(actual.every(r=>r.resource_profile==='qualify'&&r.limits.timeoutMs===3600000&&r.started.hard_memory_bytes===2147483648&&r.active_processes_after===0));assert.equal(new Set(actual.map(r=>r.run_id)).size,3);
  const q=r.data.qualification;assert.equal((await engine.qualification(t,skill.id,q)).data.status,'QUALIFIED');assert.equal((await engine.qualification(t,skill.id,{...q,hostVersion:'different-version'})).data.status,'NOT_RUN');
  const fresh=createE4Engine({python,skills:[skill]});try{const ft=fresh.createTask({task_id:'fresh'});assert.equal((await fresh.qualification(ft,skill.id,q)).data.status,'NOT_RUN');}finally{fresh.close();}
 }finally{engine.close();}
});
test('E4.d real P0 eval has 600s/2GiB and cannot pass failed criteria',async()=>{
 const engine=createE4Engine({python,skills:[skill]});try{const t=engine.createTask({task_id:'e4-d-eval'}),r=await engine.eval(t,skill.id,{...config,task_criteria:JSON.stringify({all:[{pointer:'/valid',op:'equals',value:false}]})});assert.equal(r.data.status,'FAIL');assert.equal(r.data.violations,3);assert.equal(r.receipt.exit_code,1);assert.equal(r.receipt.limits.timeoutMs,600000);assert.ok(engine.records.filter(r=>r.operation==='execute').every(r=>r.resource_profile==='eval'&&r.limits.timeoutMs===600000));}finally{engine.close();}
});
