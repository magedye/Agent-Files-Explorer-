import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createPhase4Bridge,hash} from './bridge.mjs';
import {createE4Engine} from '../aghr/e4-bridge.js';
import {createLocalProcessHost} from '../hosts/local-process.mjs';
import {StudioError} from '../auth.js';
import {engineRoot} from '../aghr/cli-bridge.js';
import {resourceProfiles} from '../aghr/job-runner.js';
const fail=(code,message)=>new StudioError(422,code,message),id=s=>typeof s==='string'&&/^[\w][\w.-]{0,127}$/.test(s);
export function createPhase4Service({python,store,base,catalog,evidence,e4Config={skills:[],permissions:[]},options={}}){
 const bridge=createPhase4Bridge({python,base}),capture=createLocalProcessHost(e4Config),evaluations=new Map(),qualifications=new Map(),controllers=new Set();let active=false,closing=false;
 const guarded=new Set();
 const capabilityHash=c=>{const value=structuredClone(c.phase4.capability);delete value.skillQualification;return hash(JSON.stringify(value));};
 const cp=id=>{const v=store.draft(id);if(!v?.phase4)throw new StudioError(404,'UNKNOWN_ID','Unknown Phase4 CP.');return v;};
 const item=id=>{const v=catalog.views.find(v=>v.item?.id===id);if(!v)throw new StudioError(404,'UNKNOWN_ID','Unknown source item.');return structuredClone(v);};
 const currentQualification=c=>{const q=qualifications.get(c.id),s=capture.capture().skills.find(s=>s.id===c.phase4.body.skill_id);return !!q&&q.data.qualification?.host==='aghr-local-process'&&q.data.qualification.hostVersion===process.version&&q.data.qualification.contentHash===s?.instruction_hash&&q.data.qualification.driverHash===s?.entry_hash&&q.capability===capabilityHash(c)&&q.data.qualification.scope===(e4Config.scope||'**/*');};
 const liveEval=c=>{const e=evaluations.get(c.phase4.body.eval_run_id);return !!e&&e.cp_id===c.id&&e.cp_hash===c.proposal_version_hash&&e.source_hash===item(c.phase4.body.item_id).source_hash&&e.inventory_hash===hash(JSON.stringify(capture.capture()))&&e.status==='PASS'&&e.expires>Date.now();};
 const validate=request=>{
  if(!request||Object.keys(request).some(k=>!['operation','cp_id','data'].includes(k))||!request.data||typeof request.data!=='object'||Array.isArray(request.data)||!['meta.create','meta.evaluate','adoption.create','adoption.step','intake.create','lesson.create','calibration.eval','calibration.create','edit','submit','review'].includes(request.operation))throw new StudioError(400,'INVALID_REQUEST','Invalid Phase4 operation.');
  if(request.operation==='intake.create')throw new StudioError(403,'FORBIDDEN','Intake creation belongs to the registered watcher only.');
  if(['meta.evaluate','adoption.step','edit','submit','review'].includes(request.operation)&&!/^CP-[\w-]+$/.test(request.cp_id||''))throw fail('CP_REQUIRED','Saved change package required.');
  if(request.cp_id)cp(request.cp_id);
  if(Buffer.byteLength(JSON.stringify(request))>262144)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Request exceeds256KiB.');return structuredClone(request);
 };
 const binding=request=>hash(JSON.stringify({request,cp:request.cp_id?cp(request.cp_id).proposal_version_hash:null,inventory:capture.capture(),base}));
 const context=c=>({cp:c,qualification_current:currentQualification(c),...(qualifications.get(c.id)?{qualification:qualifications.get(c.id).data.qualification}:{}),live_eval:c.phase4.lane==='calibration'?liveEval(c):false,duplicates:catalog.capabilities.filter(v=>v.capability.function===c.phase4.body.function).map(v=>v.capability.skillId)});
 const engine=()=>{const e=createE4Engine({python,...e4Config});controllers.add(e);return e;};
 const beforeFiles=data=>{if(!Array.isArray(data.files)||data.files.length>20)throw fail('META_FILES_REQUIRED','At most20 files.');return data.files.map(f=>{if(typeof f.path!=='string'||! /^(policies|schemas|tools)\/[\w./-]+$/.test(f.path)||f.path.split('/').some(x=>['.','..',''].includes(x)))throw fail('UNSAFE_PATH','Unsafe meta path.');let current=engineRoot,exists=true;for(const part of f.path.split('/')){current=path.join(current,part);const st=fs.lstatSync(current,{throwIfNoEntry:false});if(!st){exists=false;break;}if(st.isSymbolicLink())throw fail('UNSAFE_PATH','Reparse source rejected.');}if(!exists)return {path:f.path,content:null,content_hash:null};const st=fs.statSync(current);if(!st.isFile()||st.size>131072)throw fail('SOURCE_SIZE_LIMIT','Source exceeds128KiB.');const bytes=fs.readFileSync(current);return {path:f.path,content:bytes.toString('utf8'),content_hash:hash(bytes)};});};
 async function evalActual(request,cpValue){
  const calibration=request.operation==='calibration.eval',skillId=calibration?options.measurementSkillId:options.metaSkillId;
  if(!skillId)throw fail('EVALUATOR_NOT_CONFIGURED','An operator-registered measurement/meta evaluator is required.');
  const d=request.data;if(Object.keys(d).some(k=>!(calibration?['item_id','reason']:[]).includes(k)))throw fail('UNTRUSTED_EVAL_INPUT','Only the target and reason may be submitted; metrics and PASS are never client inputs.');
  const source=calibration?item(d.item_id):null,run_id='VR-'+crypto.randomUUID(),subject={run_id,item_id:source?.item.id??null,source_hash:source?.source_hash??null,cp_id:cpValue?.id??null,proposal_version_hash:cpValue?.proposal_version_hash??null,reason:d.reason??null,scope:e4Config.scope||'**/*'};
  if(calibration&&(!d.reason?.trim()||source.item.impact.evidence!=='assumed'))throw fail('ASSUMED_SOURCE_REQUIRED','An assumed source and reason are required.');
  const e=engine();let expired=false;const deadline=setTimeout(()=>{expired=true;e.close();},resourceProfiles.eval.timeoutMs);try{
   const task=e.createTask({task_id:'phase4-'+crypto.randomUUID()}),input={binding:subject,...(source?{item:source.item}:{change:cpValue.phase4.body})};
   const criteria=JSON.stringify({all:[{pointer:'/binding/run_id',op:'equals',value:run_id},{pointer:'/valid',op:'equals',value:true}]});
   const result=await e.eval(task,skillId,{input,task_criteria:criteria,runs:3});if(result.data.status!=='PASS')throw fail('EVAL_NOT_PASSED','Actual evaluation did not pass.');
   const executed=e.records.filter(r=>r.operation==='execute');if(executed.length!==3)throw fail('EXECUTION_EVIDENCE_REQUIRED','Three actual eval executions required.');
   const outputs=executed.map(r=>JSON.parse(r.stdout));for(const o of outputs)if(JSON.stringify(o.binding)!==JSON.stringify(subject))throw fail('EVAL_CONTEXT_MISMATCH','Evaluator output is not bound to the target.');
   let measured_delta;
   if(calibration){for(const o of outputs){if(!Number.isFinite(o.before_metric)||!Number.isFinite(o.after_metric)||!/^sha256:[a-f0-9]{64}$/.test(o.repo_hash))throw fail('MEASUREMENT_EVIDENCE_REQUIRED','Evaluator must measure the registered repository and return before/after metrics and byte hash.');}measured_delta=outputs[0].after_metric-outputs[0].before_metric;if(outputs.some(o=>o.after_metric-o.before_metric!==measured_delta||o.repo_hash!==outputs[0].repo_hash))throw fail('UNSTABLE_MEASUREMENT','Repeated measurements differ.');}
   else{const expected=options.requiredBehavioralEvals||[];if(!expected.length||outputs.some(o=>o.generation_check!=='PASS'||!expected.every(id=>o.behavioral_evals?.some(r=>r.id===id&&r.status==='PASS'))))throw fail('META_EVAL_AND_GENERATION_REQUIRED','All registered behavioral evals and candidate generation check must pass.');}
   return {run_id,status:'PASS',...subject,finished_at:new Date().toISOString(),measured_delta,source_hash:source?.source_hash??null,inventory_hash:hash(JSON.stringify(capture.capture())),expires:Date.now()+15*60000,outputs,records:structuredClone(e.records),result:result.data};
  }catch(error){if(expired)error=fail('resource_limit_exceeded','Overall eval deadline exceeded.');error.execution_records=structuredClone(e.records);throw error;}finally{clearTimeout(deadline);e.close();controllers.delete(e);}
 }
 return {validate,binding,packages:()=>store.phase4Packages(),get:cp,evidence:id=>{cp(id);return store.phase4Evidence(id);},
  async guard(prepared){if(!guarded.has(prepared.proposal_version_hash)){await bridge.run('legacy.guard',prepared);guarded.add(prepared.proposal_version_hash);if(guarded.size>256)guarded.delete(guarded.values().next().value);}},
  status(){return {mode:'DRAFT_ONLY',policy_promotion:false,source_written:false,state_written:false,host_inventory:capture.capture(),scope:e4Config.scope||'**/*',measurement_configured:!!options.measurementSkillId,meta_eval_configured:!!options.metaSkillId,items:catalog.views.map(x=>({id:x.item?.id,evidence:x.item?.impact?.evidence,source_hash:x.source_hash})),evaluations:[...evaluations.values()].map(({records,outputs,result,...x})=>x),qualification:'Live process only; historical rows do not restore proofs.'};},
  async run(receipt,bound,request,actor){
   if(active||closing)throw new StudioError(409,'CONFLICT','Phase4 operation active.');active=true;let completed=false,begun=false;const receipts=[];
   try{
    store.phase4Begin(receipt,bound);begun=true;
    let c=request.cp_id?cp(request.cp_id):null,prepared,review,status;const op=request.operation,d=request.data;
    if(['calibration.eval','meta.evaluate'].includes(op)){
     if(op==='meta.evaluate'&&c.phase4.lane!=='meta')throw fail('META_CP_REQUIRED','Meta CP required.');
     const e=await evalActual(request,c);store.phase4Complete(receipt,bound,{id:e.run_id,status:'passed',raw:JSON.stringify(e)});completed=true;evaluations.set(e.run_id,e);return {eval_run_id:e.run_id,status:e.status,measured_delta:e.measured_delta,finished_at:e.finished_at,source_hash:e.source_hash,source_written:false,state_written:false};
    }
    if(op==='lesson.create'||op==='edit'&&c.phase4.lane==='lesson'){
     const source=await evidence.detail(d.task_id);if(source.task.parse_status!=='VALID'||source.source_hash!==d.source_hash)throw fail('LESSON_EVIDENCE_MISMATCH','Valid matching original evidence required.');
     if(store.phase4Packages().some(c=>c.phase4.lane==='lesson'&&c.phase4.body.pattern===d.pattern&&c.phase4.body.source_hash===d.source_hash))throw new StudioError(409,'CONFLICT','Exact lesson already has a CP; review it.');
    }
    if(op==='calibration.create'){
     const e=evaluations.get(d.eval_run_id),source=item(d.item_id);if(!e||e.status!=='PASS'||e.cp_id||e.inventory_hash!==hash(JSON.stringify(capture.capture()))||e.source_hash!==source.source_hash||e.item_id!==d.item_id||e.reason!==d.reason||e.expires<=Date.now())throw fail('LIVE_PASSED_EVAL_REQUIRED','No current, matching real eval evidence.');
     const r=await bridge.run(op,d,{live_eval:true,item:source.item,source_hash:source.source_hash,eval:e});prepared=r.data;receipts.push(r.receipt);
    }else if(op==='adoption.step'){
     if(d.step===5){
      if(c.phase4.step!==4)throw fail('STEP_ORDER_REQUIRED','Complete steps1–4 first.');const e=engine();let expired=false;const deadline=setTimeout(()=>{expired=true;e.close();},resourceProfiles.qualify.timeoutMs);try{const task=e.createTask({task_id:'adoption-'+crypto.randomUUID()}),r=await e.qualify(task,c.phase4.body.skill_id,{input:d.output?.input,task_criteria:d.output?.task_criteria,runs:3});
       if(r.data.status!=='QUALIFIED')throw fail('LIVE_QUALIFICATION_REQUIRED','Actual local qualification failed.');qualifications.set(c.id,{data:r.data,capability:capabilityHash(c)});receipts.push(...e.records);
      }catch(error){if(expired)throw fail('resource_limit_exceeded','Overall qualification deadline exceeded.');throw error;}finally{clearTimeout(deadline);e.close();controllers.delete(e);}
     }
     const r=await bridge.run(op,d,context(c));prepared=r.data;receipts.push(r.receipt);
    }else if(op==='submit'){
     if(Object.keys(d).length)throw fail('INVALID_FIELDS','Submit has no fields.');if(c.phase4.lane==='intake')throw fail('TRIAGE_REQUIRED','Untrusted intake cannot be submitted as policy.');
     if(c.phase4.lane==='adoption'&&(c.phase4.step!==7||!currentQualification(c)))throw fail('LIVE_QUALIFICATION_REQUIRED','Seven steps and a current qualification required.');
     if(c.phase4.lane==='calibration'&&!liveEval(c))throw fail('LIVE_PASSED_EVAL_REQUIRED','Evaluation is unavailable, stale or belongs to another proposal.');status='in_review';
    }else if(op==='review'){
     const ctx=context(c),ev=[...evaluations.values()].find(e=>e.cp_id===c.id&&e.proposal_version_hash===c.proposal_version_hash&&e.expires>Date.now());
     const r=await bridge.run('review',d,{...ctx,actor,all_behavioral_evals:!!ev,generation_check:!!ev});review={decision:r.data.decision,reason:d.reason};receipts.push(r.receipt);
    }else if(!prepared){const r=await bridge.run(op,d,{...(c?context(c):{}),...(op==='meta.create'||op==='edit'&&c.phase4.lane==='meta'?{before:beforeFiles(d)}:{})});prepared=r.data;receipts.push(r.receipt);}
    if(prepared){const canonical=Buffer.from(prepared.canonical_base64,'base64');if(hash(canonical)!==prepared.proposal_version_hash)throw Error('PHASE4_HASH_MISMATCH');}
    const value=store.phase4Commit(receipt,bound,{id:bound.resource_id,previousHash:c?.proposal_version_hash??null,prepared,status,review,raw:JSON.stringify(receipts)});completed=true;
    if(op==='calibration.create'){const e=evaluations.get(d.eval_run_id);e.cp_id=value.id;e.cp_hash=value.proposal_version_hash;}
    return value;
   }catch(error){if(begun&&!completed){store.phase4Complete(receipt,bound,{id:'VR-'+crypto.randomUUID(),status:'failed',raw:JSON.stringify({reason:error.message,receipt:error.receipt??null,execution_records:error.execution_records??[],receipts})});completed=true;}throw error;}
   finally{active=false;}
  },
  async ingest(receipt,bound,data){const r=await bridge.run('intake.create',data);store.phase4Begin(receipt,bound);return store.phase4Commit(receipt,bound,{id:bound.resource_id,prepared:r.data,raw:JSON.stringify(r.receipt)});},
  close(){closing=true;bridge.close();for(const e of controllers)e.close();if(active)return(async()=>{while(active)await new Promise(r=>setTimeout(r,50));})();},
 };
}
