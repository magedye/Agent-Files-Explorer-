import fs from 'node:fs';
import crypto from 'node:crypto';
import {createE4Engine,sourceHash,verifyE4} from '../aghr/e4-bridge.js';
import {createLocalProcessHost} from '../hosts/local-process.mjs';
import {resourceProfiles} from '../aghr/job-runner.js';
import {StudioError} from '../auth.js';
const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
const fail=message=>new StudioError(400,'INVALID_REQUEST',message);
const id=s=>typeof s==='string'&&/^[\w][\w.-]{0,127}$/.test(s);
const hosts=['aghr-local-process','codex','antigravity'];
const proofPath='docs/evidence/studio-e4-2026-10-24/final-local-v2/ACCEPTANCE.json';
export function createSkillLifecycle({python,workspace,store,config={skills:[],permissions:[]}}){
 config=structuredClone(config);const capture=createLocalProcessHost(config),tasks=new Map();let active=null,closing=false;
 const state=task=>{
  const live=capture.capture(),usage=task.engine&&task.skill_id?task.engine.state(task.token,task.skill_id):{state:task.outcome||'NOT_RUN'};
  const skill=live.skills.find(s=>s.id===task.skill_id),q=task.qualification;
  const current=q&&q.host==='aghr-local-process'&&q.hostVersion===process.version&&q.contentHash===skill?.instruction_hash&&q.driverHash===skill?.entry_hash&&q.scope===(config.scope||'**/*')&&q.engineHash==='sha256:'+sourceHash;
  return {task_id:task.id,session_id:task.session,phase:task.phase,host:task.host,host_version:task.host==='aghr-local-process'?process.version:null,revision:task.revision,skill_id:task.skill_id||null,
   availability:{registry:task.host==='aghr-local-process'?live.registry_status:'DISCOVERY_UNAVAILABLE',installed:!!skill,available:task.host==='aghr-local-process'&&skill?.available===true,content_hash:skill?.instruction_hash??null},
   qualification:{status:current?'QUALIFIED':'NOT_RUN',record:current?structuredClone(q):null,historical:q?structuredClone(q):null,reason:current?'Actual local runs; native qualification is separate.':'No current live qualification for this host/version/scope/content/driver/engine tuple.'},
   usage:{selected:usage.identity?'SELECTED':'NOT_RUN',loaded:['LOADED','EXECUTED','EXECUTED_FAILED','VERIFIED'].includes(usage.state)?'LOADED':'NOT_RUN',executed:usage.execution||'NOT_RUN',verified:usage.state==='VERIFIED'&&usage.verified===true?'VERIFIED':'NOT_RUN',host_signal:usage.host_signal||'NOT_OBSERVABLE'},
   state:usage,outcome:task.outcome||'NOT_RUN',halt:task.halt||false,reason:task.reason||null,last_run_id:task.lastRun||null};
 };
 const options=value=>{
  if(!value||Array.isArray(value)||Object.keys(value).some(k=>!['operation','task_id','host','skill_id','query','input','task_criteria','phase','runs'].includes(k)))throw fail('Unknown lifecycle request field.');
  if(!['select','load','execute','verify','host_signal','phase','eval','qualify'].includes(value.operation)||!id(value.task_id)||!hosts.includes(value.host))throw fail('Invalid operation/task/host.');
  if(value.operation!=='select'&&!tasks.has(value.task_id))throw new StudioError(404,'UNKNOWN_ID','Create a task by selecting first.');
  if(value.skill_id!==undefined&&!id(value.skill_id)||value.query!==undefined&&(typeof value.query!=='string'||value.query.length>2000)||value.phase!==undefined&&(typeof value.phase!=='string'||!value.phase.trim()||value.phase.length>100))throw fail('Invalid skill/query/phase.');
  if(['load','execute','verify','host_signal','eval','qualify'].includes(value.operation)&&!id(value.skill_id))throw fail('Skill identifier required.');
  if(value.operation==='phase'&&!value.phase)throw fail('Phase required.');
  if(['verify','eval','qualify'].includes(value.operation)&&(typeof value.task_criteria!=='string'||value.task_criteria.length>65536))throw fail('Task criteria required.');
  if(value.runs!==undefined&&(!Number.isInteger(value.runs)||value.runs<3||value.runs>20))throw fail('Runs must be3–20.');
  const existing=tasks.get(value.task_id);if(existing&&existing.host!==value.host)throw fail('A task cannot change its host.');
  if(!existing&&tasks.size>=64)throw new StudioError(429,'RATE_LIMITED','At most64 live tasks.');
  if(existing&&existing.closed)throw new StudioError(409,'CONFLICT','Task was cancelled or timed out; create a new task.');
  if(Buffer.byteLength(JSON.stringify(value))>65536)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Request exceeds64KiB.');
  return structuredClone(value);
 };
 const binding=request=>hash(JSON.stringify({request,revision:tasks.get(request.task_id)?.revision??0,capture:capture.capture(),scope:config.scope||'**/*',engine:sourceHash,permissions:config.permissions||[]}));
 return {
  options,binding,
  inventory(){return {profile:'studio-phase3-local.1',local:capture.capture(),hosts:hosts.map(host=>({host,host_version:host==='aghr-local-process'?process.version:null,availability:host==='aghr-local-process'?'CONFIGURED':'DISCOVERY_UNAVAILABLE',qualification:'NOT_RUN',reason:host==='aghr-local-process'?'Registered read-only drivers only.':'Native channel has not been qualified; no fallback to local execution.'})),tasks:[...tasks.values()].map(state)};},
  get(taskId){const t=tasks.get(taskId);if(!t)throw new StudioError(404,'UNKNOWN_ID','Unknown live task.');return state(t);},
  scenarios(){
   verifyE4();const raw=fs.readFileSync('docs/evidence/studio-e4-2026-10-24/CUSTODY.lock.json');
   if(hash(raw)!=='sha256:f57daf24577be0c40f007328dedb335f755e57a9bea5133efc501399b8effb9f')throw Error('SCENARIO_CUSTODY_DRIFT');
   const data=fs.readFileSync(proofPath),record=JSON.parse(data);if(crypto.createHash('sha256').update(data).digest('hex')!==JSON.parse(raw).files[proofPath].sha256||record.source_hash!==sourceHash||record.honesty.length!==7||record.scenarios.length!==8)throw Error('SCENARIO_PROOF_DRIFT');
   return {profile:'LOCAL_CORE_CONFORMANCE_ONLY',source:{path:proofPath,content_hash:hash(data),bytes:data.length},engine_hash:'sha256:'+sourceHash,
    scenarios:record.scenarios.map(x=>({id:x.id,local:x.status,codex:'NOT_RUN',antigravity:'NOT_RUN'})),honesty:record.honesty.map(x=>({id:x.id,local:x.status,codex:'NOT_RUN',antigravity:'NOT_RUN'})),native_required:true,native_waived:false};
  },
  async run(receipt,request,scope){
   if(active||closing)throw new StudioError(409,'CONFLICT','A skill operation is active.');
   options(request);const inputs=binding(request);if(inputs!==scope.proposal_version_hash)throw new StudioError(412,'STALE_PROPOSAL','Task/content changed after authorization.');
   const run_id='VR-'+crypto.randomUUID(),command=['eval','qualify'].includes(request.operation)?request.operation:'check',at=new Date().toISOString();
   const save=store.beginSkillRun(receipt,{id:run_id,task_id:request.task_id,command,inputs_hash:inputs,request,at},scope);
   let task=tasks.get(request.task_id);if(!task){
    if(tasks.size>=64)throw new StudioError(429,'RATE_LIMITED','At most64 live tasks.');
    task={id:request.task_id,session:crypto.randomUUID(),host:request.host,phase:request.phase||'implementation',revision:0};
    tasks.set(task.id,task);
   }
   const before=task.engine?.records.length||0,started=Date.now();let result,error,expired=false;
   active=task;const timer=setTimeout(()=>{expired=true;task.closed=true;task.engine?.close();},resourceProfiles[command].timeoutMs);
   try{
    if(task.host==='aghr-local-process'&&!task.engine){task.engine=createE4Engine({python,...config});task.token=task.engine.createTask({task_id:task.id,phase:task.phase});}
    if(task.host!=='aghr-local-process')result={data:{status:'BLOCKED',halt:true,reason:'DISCOVERY_UNAVAILABLE',engine_execution:'NOT_RUN'},receipt:null};
    else if(request.operation==='select')result=await task.engine.discover(task.token,{...(request.skill_id?{requested_id:request.skill_id}:{}),...(request.query?{query:request.query}:{})});
    else if(request.operation==='phase'){result={data:task.engine.changePhase(task.token,request.phase),receipt:null};task.phase=request.phase;task.skill_id=null;}
    else if(request.operation==='load')result=await task.engine.load(task.token,request.skill_id);
    else if(request.operation==='execute')result=await task.engine.execute(task.token,request.skill_id,request.input??{});
    else if(request.operation==='verify')result=await task.engine.verify(task.token,request.skill_id,request.task_criteria);
    else if(request.operation==='host_signal')result=await task.engine.hostSignal(task.token,request.skill_id);
    else result=await task.engine[request.operation](task.token,request.skill_id,{input:request.input??{},task_criteria:request.task_criteria,runs:request.runs||3});
    task.outcome=result.data.status||result.data.state||result.data.result||'NOT_RUN';task.halt=result.data.halt===true;task.reason=result.data.reason||null;
    if(request.operation==='select'){task.skill_id=result.data.selected?.[0]||null;task.qualification=null;}
    else if(request.operation!=='phase')task.skill_id=request.skill_id;
    if(request.operation==='qualify'&&result.data.status==='QUALIFIED')task.qualification=structuredClone(result.data.qualification);
   }catch(e){error=e;task.reason=e.message;task.outcome=expired?'resource_limit_exceeded':'REJECTED';task.halt=true;}
   finally{clearTimeout(timer);active=null;task.revision++;task.lastRun=run_id;}
   const records=task.engine?.records.slice(before)||[],last=result?.receipt||error?.receipt||records.at(-1),exit=expired?null:last?.exit_code??null;
   const raw=JSON.stringify({profile:'studio-phase3-local.1',project_scope:config.scope||'**/*',operation:request.operation,...(request.operation==='select'?{discovery_request:{query_supplied:typeof request.query==='string',non_english:/[\u0600-\u06ff]/.test(request.query||''),language_observation:/[\u0600-\u06ff]/.test(request.query||'')?'arabic-script':'UNOBSERVED_LANGUAGE'}}:{}),host:task.host,engine_hash:sourceHash,inputs_hash:inputs,result:result?.data||null,error:error?.message||null,records}),view=state(task);
   const rejected=error||task.halt||exit!==null&&exit!==0||['INVALID','FAIL','FAILED','UNKNOWN_ID','NOT_OBSERVABLE','BLOCKED'].includes(task.outcome);
   try{save({status:expired?'resource_limit_exceeded':rejected?'failed':'passed',exit_code:exit,finished_at:new Date().toISOString(),duration_ms:Date.now()-started,raw,view,termination_reason:expired?'timeout':error?'engine_error':'completed'});}catch(e){task.outcome='AUDIT_COMMIT_FAILED';task.halt=true;task.closed=true;task.engine?.close();throw e;}
   return {run_id,task:view,result:result?.data||null,error:error?.message||null,records,source_written:false,state_written:false};
  },
  history:()=>store.skillRuns(),
  close(){closing=true;for(const t of tasks.values())t.engine?.close();if(active)return (async()=>{while(active)await new Promise(r=>setTimeout(r,50));})();},
 };
}
