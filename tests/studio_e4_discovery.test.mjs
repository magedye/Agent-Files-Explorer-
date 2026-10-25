import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createE4Engine} from '../server/studio/aghr/e4-bridge.js';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),fixture=path.resolve('tests/fixtures/studio-e4/json-audit');
export const skills=[{id:'json-audit',source:'project',skillPath:path.join(fixture,'SKILL.md'),entry:path.join(fixture,'worker.py'),triggers:['مراجعة','review'],capabilities:['inspection'],requires:['workspace.read'],preference:1},{id:'json-alternative',source:'project',skillPath:path.join(fixture,'SKILL.md'),entry:path.join(fixture,'worker.py'),triggers:['مراجعة','review'],capabilities:['inspection'],requires:['workspace.read'],preference:2}];
test('E4.b Arabic/English discovery, overlap, simple task and UNKNOWN_ID stay distinct',async()=>{
 const engine=createE4Engine({python,skills,permissions:['workspace.read']});
 try{
  const t=engine.createTask({task_id:'e4-b'});let r=await engine.discover(t,{query:'مُراجعة بيانات JSON'});assert.deepEqual(r.data.selected,['json-audit']);assert.deepEqual(r.data.alternatives_not_loaded,['json-alternative']);
  r=await engine.load(t,'json-audit');assert.equal(r.data.state,'LOADED');assert.equal(r.data.execution,'NOT_RUN');await assert.rejects(()=>engine.claim(t,'json-audit','VERIFIED'),/EXECUTION_EVIDENCE_REQUIRED/);
  r=await engine.discover(t,{requested_id:'unknown',query:'review'});assert.equal(r.data.status,'UNKNOWN_ID');assert.equal(r.receipt.exit_code,1);
  r=await engine.discover(t,{query:'hello'});assert.equal(r.data.status,'NO_SKILL_MATCH');assert.equal(r.data.halt,false);
  engine.changePhase(t,'review');assert.equal(engine.state(t,'json-audit').state,'UNKNOWN_ID');r=await engine.discover(t,{query:'review JSON'});assert.deepEqual(r.data.selected,['json-audit']);
 }finally{engine.close();}
});
test('E4.b permission denial, unexecutable installed skill and unreadable inventory halt honestly',async()=>{
 for(const [definitions,expected]of [[skills,'BLOCKED'],[{...skills[0],entry:undefined},'NOT_OBSERVABLE'],[{...skills[0],skillPath:fixture+'/missing/SKILL.md'},'DISCOVERY_UNAVAILABLE']]){
  const engine=createE4Engine({python,skills:Array.isArray(definitions)?definitions:[definitions]});
  try{const t=engine.createTask({task_id:'e4-b-'+expected}),r=await engine.discover(t,{query:'مراجعة'});assert.equal(r.data.status,expected);assert.equal(r.data.halt,true);assert.equal(r.receipt.exit_code,3);}finally{engine.close();}
 }
});

test('E4.b capability mismatch is a completed search and replaces stale selection',async()=>{
 const engine=createE4Engine({python,skills,permissions:['workspace.read']});try{
  const t=engine.createTask({task_id:'capability-edge'});await engine.discover(t,{query:'review',capabilities:['inspection']});await engine.load(t,'json-audit');
  const none=await engine.discover(t,{query:'review',capabilities:['not-exposed']});assert.equal(none.data.status,'NO_SKILL_MATCH');assert.equal(engine.state(t,'json-audit').state,'UNKNOWN_ID');
  const partial=await engine.discover(t,{query:'review',capabilities:['inspection','not-exposed']});assert.equal(partial.data.status,'BLOCKED');assert.equal(partial.data.halt,true);
 }finally{engine.close();}
});
