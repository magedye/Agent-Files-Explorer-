import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createE4Engine} from '../server/studio/aghr/e4-bridge.js';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
test('E4.a imported claims retain byte custody but never authenticate execution',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-e4-evidence-')),engine=createE4Engine({python}),session={agent:'codex',agent_version:'unobserved',host_os:'windows',started_at:'2026-10-24T00:00:00Z'},data={root:dir,path:'events.jsonl',task_id:'e4-a',session};
 const record={task_id:data.task_id,session,events:[{at:session.started_at,type:'skill.verified',source:'agent',skill_id:'example',task_criteria:'Nonempty actual output required',verifier_output:{claimed:true},result:'PASS'}],submit_to_ci:false};
 try{
  fs.writeFileSync(path.join(dir,data.path),JSON.stringify(record)+'\n');const r=await engine.inspectEvidence(data);assert.equal(r.data.producer_authentication,'NOT_ESTABLISHED');assert.equal(r.data.execution_status,'NOT_OBSERVABLE');assert.equal(r.data.records.length,1);assert.equal(r.receipt.exit_code,0);
  await assert.rejects(()=>engine.inspectEvidence({...data,task_id:'foreign'}),/FOREIGN_TASK_OR_SESSION/);
  await assert.rejects(()=>engine.inspectEvidence({...data,path:'../foreign.jsonl'}),/EVIDENCE_PATH_INVALID/);
  fs.writeFileSync(path.join(dir,data.path),JSON.stringify({...record,events:[{...record.events[0],task_criteria:'T19_MOCK_EVAL_EVIDENCE'}]})+'\n');await assert.rejects(()=>engine.inspectEvidence(data),/SIMULATED_EVIDENCE_REJECTED/);
  fs.writeFileSync(path.join(dir,data.path),'');await assert.rejects(()=>engine.inspectEvidence(data),/EMPTY_EVIDENCE/);
 }finally{engine.close();for(const name of fs.readdirSync(dir))fs.unlinkSync(path.join(dir,name));fs.rmdirSync(dir);}
});
