import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createE4Engine} from '../server/studio/aghr/e4-bridge.js';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),root=path.resolve('tests/fixtures/studio-e4/json-audit');
const skill={id:'json-audit',source:'project',skillPath:root+'/SKILL.md',entry:root+'/worker.py',triggers:['review'],capabilities:['inspection'],requires:[]};
const criteria=value=>JSON.stringify({all:[{pointer:'/valid',op:'equals',value}]});
test('E4.c actual process + criteria, never a loaded instruction, determine VERIFIED',async()=>{
 const engine=createE4Engine({python,skills:[skill],hostSignals:true});
 try{
  const t=engine.createTask({task_id:'e4-c'});await engine.discover(t,{requested_id:skill.id});await engine.load(t,skill.id);
  await assert.rejects(()=>engine.verify(t,skill.id,criteria(true)),/EXECUTION_EVIDENCE_REQUIRED/);
  await engine.execute(t,skill.id,{document:{name:'actual'},required:['name']});
  let r=await engine.verify(t,skill.id,criteria(false));assert.equal(r.data.verified,false);assert.equal(r.receipt.exit_code,1);
  r=await engine.verify(t,skill.id,criteria(true));assert.equal(r.data.state,'VERIFIED');assert.equal(r.data.criteria_results.length,1);assert.equal(r.receipt.exit_code,0);
  r=await engine.hostSignal(t,skill.id);assert.equal(r.data.host_signal,'HOST_SIGNAL');assert.equal(r.data.acknowledgement.host,'aghr-local-process');
  await assert.rejects(()=>engine.claim(t,skill.id,'HOST_SIGNAL'),/EXECUTION_EVIDENCE_REQUIRED/);
  await assert.rejects(()=>engine.verify(t,skill.id,'{}'),/TASK_CRITERIA_UNSUPPORTED/);
 }finally{engine.close();}
});
test('E4.c actual empty and failed executables cannot become VERIFIED',async()=>{
 for(const [entry,input,expected]of [['empty.py',{document:{},required:[]},'EMPTY_OUTPUT'],['worker.py',{document:{},required:['name']},'EXECUTED_FAILED']]){
  const engine=createE4Engine({python,skills:[{...skill,entry:root+'/'+entry}]});
  try{const t=engine.createTask({task_id:'e4-c-negative'});await engine.discover(t,{requested_id:skill.id});await engine.load(t,skill.id);
   if(expected==='EMPTY_OUTPUT')await assert.rejects(()=>engine.execute(t,skill.id,input),/EMPTY_OUTPUT/);
   else{const r=await engine.execute(t,skill.id,input);assert.equal(r.data.state,expected);await assert.rejects(()=>engine.verify(t,skill.id,criteria(true)),/LOAD_BEFORE_EXECUTION_REQUIRED/);}
   assert.notEqual(engine.state(t,skill.id).state,'VERIFIED');
  }finally{engine.close();}
 }
});
