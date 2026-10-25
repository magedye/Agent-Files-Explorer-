// Real bounded engine/driver executions. No mocked engine, provider or verifier.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {createE4Engine,sourceHash} from '../../server/studio/aghr/e4-bridge.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),root=path.resolve('tests/fixtures/studio-e4');
export const audit={id:'json-audit',source:'project',skillPath:root+'/json-audit/SKILL.md',entry:root+'/json-audit/worker.py',triggers:['review','مراجعة'],capabilities:['inspection'],requires:['workspace.read'],preference:1};
export const goodCriteria=JSON.stringify({all:[{pointer:'/valid',op:'equals',value:true},{pointer:'/keys',op:'contains',value:'name'}]});
export async function runAcceptance({out}={}){
 const engines=[],honesty=[],scenarios=[],negative=[];
 const make=options=>{const e=createE4Engine({python,skills:[audit],permissions:['workspace.read'],...options});engines.push(e);return e;};
 const task=(e,id)=>e.createTask({task_id:id});
 const select=async(e,t,id=audit.id)=>{const r=await e.discover(t,{requested_id:id});assert.equal(r.data.status,'SELECTED');return e.load(t,id);};
 const denied=async(id,fn,pattern)=>{let error;try{await fn();}catch(e){error=e;}assert.ok(error,id+' must reject');assert.match(error.message,pattern);const proof={id,status:'REJECTED',message:error.message,receipt:error.receipt??null};negative.push(proof);return proof;};
 const h=(id,neg,pos)=>honesty.push({id,status:'PASS_FOR_LOCAL_CORE',negative:neg,positive:pos,native_agent_qualification:'NOT_GRANTED'});
 const s=(id,result)=>scenarios.push({id,status:'PASS_FOR_LOCAL_CORE',result});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-e4-honesty-'));
 try{
  const e=make({hostSignals:true}),t=task(e,'honesty-real');let loaded=await select(e,t);
  // Regression: changing a returned object must not mutate private custody.
  loaded.data.state='VERIFIED';loaded.data.identity.task_id='forged-task';assert.equal(e.state(t,audit.id).state,'LOADED');assert.equal(e.state(t,audit.id).identity.task_id,'honesty-real');
  const noRun=await denied('H1',()=>e.verify(t,audit.id,goodCriteria),/EXECUTION_EVIDENCE_REQUIRED/);
  const empty=make({skills:[{...audit,id:'empty',entry:root+'/json-audit/empty.py'}]}),et=task(empty,'empty-real');await select(empty,et,'empty');const blank=await denied('H3',()=>empty.execute(et,'empty',{}),/EMPTY_OUTPUT/);
  const run=await e.execute(t,audit.id,{document:{name:'actual'},required:['name']});assert.equal(run.data.state,'EXECUTED');
  const wrong=await e.verify(t,audit.id,JSON.stringify({all:[{pointer:'/valid',op:'equals',value:false}]}));assert.equal(wrong.data.verified,false);assert.equal(wrong.receipt.exit_code,1);
  const verified=await e.verify(t,audit.id,goodCriteria);assert.equal(verified.data.state,'VERIFIED');h('H1',noRun,verified);h('H4',wrong,verified);
  const unknown=await e.discover(t,{requested_id:'no-such-skill'});assert.equal(unknown.data.status,'UNKNOWN_ID');assert.equal(unknown.receipt.exit_code,1);const known=await e.discover(t,{requested_id:audit.id});h('H2',unknown,known);
  h('H3',blank,verified);
  const restricted=make({permissions:[]}),rt=task(restricted,'permission-real'),block=await restricted.discover(rt,{query:'review'});assert.equal(block.data.status,'BLOCKED');assert.equal(block.data.halt,true);const none=await restricted.discover(rt,{query:'say hello'});assert.equal(none.data.status,'NO_SKILL_MATCH');assert.equal(none.data.halt,false);h('H5',block,none);s('S2_SIMPLE_TASK',none);s('S5_PERMISSION_DENIED',block);
  const noSignal=make({hostSignals:false}),nt=task(noSignal,'signal-absent');await select(noSignal,nt);await noSignal.execute(nt,audit.id,{document:{name:'actual'},required:['name']});const absent=await denied('H6',()=>noSignal.hostSignal(nt,audit.id),/HOST_SIGNAL_UNOBSERVED/);
  // Rediscover above cleared the earlier proof; only a fresh actual process can
  // establish a current signal, not an acknowledgement copied from telemetry.
  await select(e,t);await e.execute(t,audit.id,{document:{name:'actual'},required:['name']});const signal=await e.hostSignal(t,audit.id);assert.equal(signal.data.host_signal,'HOST_SIGNAL');assert.equal(signal.data.acknowledgement.host,'aghr-local-process');h('H6',absent,signal);
  fs.copyFileSync(audit.skillPath,dir+'/SKILL.md');fs.copyFileSync(audit.entry,dir+'/worker.py');
  const qengine=make({skills:[{...audit,skillPath:dir+'/SKILL.md',entry:dir+'/worker.py'}]}),qt=task(qengine,'qualification-real');
  const q=await qengine.qualify(qt,audit.id,{input:{document:{name:'actual'},required:['name']},task_criteria:goodCriteria,runs:3});assert.equal(q.data.status,'QUALIFIED');
  const changedVersion=await qengine.qualification(qt,audit.id,{...q.data.qualification,hostVersion:'previous-host-version'});assert.equal(changedVersion.data.status,'NOT_RUN');assert.match(changedVersion.data.reason,/changed/);
  const current=await qengine.qualification(qt,audit.id,q.data.qualification);assert.equal(current.data.status,'QUALIFIED');
  fs.appendFileSync(dir+'/SKILL.md','\nContent changed after actual qualification.\n');const changedContent=await qengine.qualification(qt,audit.id,q.data.qualification);assert.equal(changedContent.data.status,'NOT_RUN');h('H7',{changedVersion,changedContent},current);
  const overlap=make({skills:[audit,{...audit,id:'alternative',preference:2}]}),ot=task(overlap,'overlap-real'),choice=await overlap.discover(ot,{query:'review'});assert.deepEqual(choice.data.selected,[audit.id]);assert.deepEqual(choice.data.alternatives_not_loaded,['alternative']);assert.equal(overlap.state(ot,'alternative').state,'UNKNOWN_ID');s('S3_OVERLAP',choice);
  const unavailable=make({skills:[{...audit,entry:undefined}]}),ut=task(unavailable,'unavailable-real'),notAvailable=await unavailable.discover(ut,{requested_id:audit.id});assert.equal(notAvailable.data.status,'NOT_OBSERVABLE');s('S4_INSTALLED_UNAVAILABLE',notAvailable);
  const failed=make(),ft=task(failed,'failure-real');await select(failed,ft);const failure=await failed.execute(ft,audit.id,{document:{},required:['name']});assert.equal(failure.data.state,'EXECUTED_FAILED');await denied('S6',()=>failed.verify(ft,audit.id,goodCriteria),/LOAD_BEFORE_EXECUTION_REQUIRED/);s('S6_EXECUTION_FAILED',failure);
  const english=make({skills:[{...audit,triggers:['review']}]}),at=task(english,'arabic-real'),arabic=await english.discover(at,{query:'مراجعة شفرة'});assert.equal(arabic.data.status,'NO_SKILL_MATCH');assert.equal(arabic.data.halt,false);s('S7_ARABIC_ENGLISH_ONLY_TRIGGERS',arabic);
  const author={id:'feature-author',source:'project',skillPath:root+'/feature/SKILL.md',entry:root+'/feature/worker.py',triggers:['feature','ميزة'],requires:['workspace.read'],capabilities:['authoring']},chain=make({skills:[author,audit]}),ct=task(chain,'feature-chain-real');
  await select(chain,ct,author.id);const authored=await chain.execute(ct,author.id,{name:'feature_enabled',value:true});const authoredCheck=await chain.verify(ct,author.id,JSON.stringify({all:[{pointer:'/syntax_valid',op:'equals',value:true}]}));assert.equal(authoredCheck.data.state,'VERIFIED');const document=JSON.parse(authored.execution.stdout);chain.changePhase(ct,'review');await select(chain,ct);await chain.execute(ct,audit.id,{document,required:['source','function_name']});const reviewed=await chain.verify(ct,audit.id,JSON.stringify({all:[{pointer:'/valid',op:'equals',value:true}]}));assert.equal(reviewed.data.state,'VERIFIED');s('S1_SEQUENTIAL_FEATURE_SKILLS',{author:authoredCheck,review:reviewed,source_written:false});
  const governed=path.resolve('governance_packages/references/Agent_Governance_Harness_Reference_1.2.0'),lessonSkill={id:'governed-learning',source:'project',skillPath:governed+'/optional_skills/governed-learning/SKILL.md',entry:root+'/lesson/worker.py',triggers:['lesson','استخراج الدروس'],requires:['workspace.read'],capabilities:['learning']},learning=make({skills:[lessonSkill]}),lt=task(learning,'lesson-real');await select(learning,lt,lessonSkill.id);
  const failedReceipt=failed.records.find(r=>r.operation==='execute'),procedure=governed+'/procedures/GOVERNED_LEARNING.md';
  const lesson=await learning.execute(lt,lessonSkill.id,{procedure_path:procedure,procedure_sha256:sha(fs.readFileSync(procedure)),failure:{exit_code:failedReceipt.exit_code,run_id:failedReceipt.run_id,output_hash:'sha256:'+sha(Buffer.from(failedReceipt.stdout))}});
  const lessonCheck=await learning.verify(lt,lessonSkill.id,JSON.stringify({all:[{pointer:'/promotion',op:'equals',value:'NOT_PERFORMED'},{pointer:'/policy_written',op:'equals',value:false},{pointer:'/lesson_review/root_cause',op:'equals',value:'UNPROVEN'}]}));assert.equal(lessonCheck.data.state,'VERIFIED');s('S8_GOVERNED_LEARNING_NO_PROMOTION',{lesson:JSON.parse(lesson.execution.stdout),verification:lessonCheck,profile:'actual local registered procedure; not native agent activation'});
  assert.equal(honesty.length,7);assert.equal(scenarios.length,8);
  const result={status:'PASS_FOR_LOCAL_CORE',source_hash:sourceHash,honesty,scenarios,negative,records:engines.flatMap(e=>e.records),host_qualification:{'aghr-local-process':{status:'QUALIFIED_FOR_REGISTERED_JSON_PROCEDURE',qualification:q.data.qualification},codex:{status:'NOT_RUN',observed_cli_version:'0.162.0-alpha.2',scope:'version-only; no native skill execution/activation proof'},antigravity:{status:'NOT_RUN',reason:'No executable in PATH or native observation channel provided'}},independent_release_acceptance:'NOT_GRANTED',source_written:false,state_written:false};
  if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'ACCEPTANCE.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});}
  return result;
 }finally{for(const e of engines)e.close();for(const name of fs.readdirSync(dir))fs.unlinkSync(path.join(dir,name));fs.rmdirSync(dir);}
}
