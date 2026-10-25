// Trusted backend API only; no HTTP route accepts process receipts or host facts.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {repository} from './cli-bridge.js';
import {verifyE3} from './bounded-validator.js';
import {createJobRunner} from './job-runner.js';
import {createLocalProcessHost} from '../hosts/local-process.mjs';
export const sourceHash='d4247ecfff599b6bc113a89a5652f7570844ae0a3ea348b3b0b79fd85b7876e2';
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const lockPath=path.join(repository,'server/studio/aghr/e4/SOURCE.lock.json');
export function verifyE4(){
 const raw=fs.readFileSync(lockPath),pin=JSON.parse(raw);if(sha(raw)!==sourceHash||pin.native_e3_hash!==verifyE3())throw Error('E4_SOURCE_DRIFT');
 for(const [name,h]of Object.entries(pin.files)){const p=path.resolve(repository,name);if(!p.startsWith(repository+path.sep)||sha(fs.readFileSync(p))!==h)throw Error('E4_SOURCE_DRIFT');}return pin;
}
export function createE4Engine({python,skills=[],permissions=[],scope='**/*',hostSignals=false}){
 verifyE4();const runner=createJobRunner({python}),pythonHash=sha(fs.readFileSync(python));let active=false,closed=false,current;
 const records=[],hostAdapter=createLocalProcessHost({skills}),tasks=new WeakMap(),qualifications=new Map(),evalPermit=Symbol(),qualifyPermit=Symbol();
 const context=task=>{const value=tasks.get(task);if(!value)throw Error('UNTRUSTED_TASK_CONTEXT');return value;};
 async function invoke(operation,data,host={}){
  if(closed)throw Error('E4_CLOSED');if(active)throw Error('E4_BUSY');verifyE4();if(sha(fs.readFileSync(python))!==pythonHash)throw Error('E4_EXECUTABLE_DRIFT');
  const command=['eval','qualify'].includes(operation)?operation:'check',raw=Buffer.from(JSON.stringify({command,operation,data,host}));
  if(raw.length>1024**2)throw Error('E4_INPUT_LIMIT');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-e4-input-')),input=path.join(dir,'input.json');active=true;current=new AbortController();
  try{
   fs.writeFileSync(input,raw,{flag:'wx',mode:0o600});
   const job=await runner.run(command,{executable:python,args:['-I','-B','-S','-X','utf8',path.join(repository,'server/studio/aghr/read-only-launcher.py'),path.join(repository,'server/studio/aghr/e4/entry.py'),input],cwd:repository,signal:current.signal,maxOutputBytes:4*1024**2});
   verifyE4();const receipt={operation,command,protocol_version:'3',engine_hash:sourceHash,python_hash:pythonHash,input_hash:'sha256:'+sha(raw),stdout:job.stdout,stderr:job.stderr,...job};records.push(receipt);
   if(job.status==='resource_limit_exceeded')return {data:{result:'BLOCKED',status:job.status,reason:job.reason},receipt};
   if(job.reason==='user_cancelled')return {data:{result:'BLOCKED',status:'ABANDONED'},receipt};
   const report=JSON.parse(job.stdout);
   if(report.protocol_version!=='3'||report.command!==command||report.source?.content_hash!==sourceHash||report.exit_code!==job.exit_code||report.exit_code!=={READ:0,VALID:0,INVALID:1,BLOCKED:3}[report.result]||job.active_processes_after!==0||job.started.hard_memory_bytes!==job.limits.memoryBytes||(job.started.limit_flags&0x2200)!==0x2200)throw Error('E4_FALSE_SUCCESS');
   if(!report.data){const error=Error(report.diagnostics[0]?.message||'E4_REJECTED');error.receipt=receipt;throw error;}
   return {data:report.data,receipt};
  }finally{active=false;current=null;if(fs.existsSync(input))fs.unlinkSync(input);fs.rmdirSync(dir);}
 }
 const qualificationKey=(t,id)=>{const c=hostAdapter.capture(),s=c.skills.find(s=>s.id===id);if(!s)throw Error('UNKNOWN_ID');return {skillId:id,host:c.host_id,hostVersion:c.host_version,scope:t.scope,contentHash:s.instruction_hash,driverHash:s.entry_hash,engineHash:'sha256:'+sourceHash};};
 async function batch(operation,task,id,config){
  const t=context(task),runs=config.runs??3;
  if(!Number.isInteger(runs)||runs<(config.release?5:3)||runs>20)throw Error('EVAL_MINIMUM_RUNS_REQUIRED');
  if(typeof config.task_criteria!=='string'||!config.task_criteria.trim())throw Error('TASK_CRITERIA_REQUIRED');
  const observed=[];
  for(let i=0;i<runs;i++){
   const choice=await api.discover(task,{requested_id:id});if(choice.data.status!=='SELECTED')return choice;
   await api.load(task,id);
   try{await api.execute(task,id,config.input,operation==='eval'?evalPermit:qualifyPermit);}catch(error){if(!t.proofs.has(id))throw error;}
   observed.push({current:structuredClone(t.states.get(id)),proof:structuredClone(t.proofs.get(id)),task_criteria:config.task_criteria});
  }
  const key=qualificationKey(t,id),data={identity:observed[0].current.identity,content_hash:key.contentHash,key,priority:config.priority??'P0-Safety',max_violation_rate:config.max_violation_rate??0,release:config.release===true};
  const r=await invoke(operation,data,{runs:observed});if(operation==='qualify'&&r.data.status==='QUALIFIED')qualifications.set(id,structuredClone(r.data.qualification));return r;
 }
 const api={records,inspectEvidence:data=>invoke('evidence',data),
  createTask({task_id,phase='implementation'}){if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(task_id)||typeof phase!=='string'||!phase.trim())throw Error('TASK_ID_REQUIRED');const token=Object.freeze({}),capture=hostAdapter.capture();tasks.set(token,{task_id,session_id:crypto.randomUUID(),host:capture.host_id,host_version:capture.host_version,scope,phase,states:new Map(),proofs:new Map(),acks:new Map()});return token;},
  async discover(task,request){const t=context(task),capture=hostAdapter.capture(),r=await invoke('discover',{...request,phase:t.phase},{capture,permissions});if(r.data.status==='SELECTED')for(const id of r.data.selected){const s=capture.skills.find(s=>s.id===id);t.states.set(id,{state:'SELECTED',instruction_hash:s.instruction_hash,identity:{task_id:t.task_id,session_id:t.session_id,host:t.host,host_version:t.host_version,scope:t.scope,skill_id:id},host_signal:'NOT_OBSERVABLE',execution:'NOT_RUN'});}return r;},
  async load(task,id){const t=context(task),state=t.states.get(id);if(!state)throw Error('SKILL_NOT_SELECTED');const s=hostAdapter.capture().skills.find(s=>s.id===id);if(!s)throw Error('DISCOVERY_UNAVAILABLE');const r=await invoke('transition',{current:state,target:'LOADED'},{instruction_hash:s.instruction_hash});t.states.set(id,r.data);return r;},
  async claim(task,id,target){const state=context(task).states.get(id);if(!state)throw Error('UNKNOWN_ID');return invoke('transition',{current:state,target});},
  async execute(task,id,input,profilePermit){
   const t=context(task),state=t.states.get(id);if(state?.state!=='LOADED')throw Error('LOAD_BEFORE_EXECUTION_REQUIRED');
   if(active||closed)throw Error('E4_BUSY_OR_CLOSED');verifyE4();
   const observed=hostAdapter.capture().skills.find(s=>s.id===id),descriptor=hostAdapter.descriptor(id);
   if(!observed?.available||observed.instruction_hash!==state.instruction_hash||!observed.requires.every(p=>permissions.includes(p)))throw Error('EXECUTION_AUTHORIZATION_OR_CONTENT_CHANGED');
   const bytes=Buffer.from(JSON.stringify(input));if(bytes.length>65536)throw Error('EXECUTION_INPUT_LIMIT');
   const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-e4-exec-')),inputFile=path.join(dir,'input.json'),entryFile=path.join(dir,'driver.py'),run_id='E4-'+crypto.randomUUID();
   let job,started;const streams={stdout:[],stderr:[]};active=true;current=new AbortController();
   try{
    const program=fs.readFileSync(descriptor.entry);if('sha256:'+sha(program)!==observed.entry_hash)throw Error('DRIVER_CONTENT_CHANGED');
    fs.writeFileSync(inputFile,bytes,{flag:'wx',mode:0o600});fs.writeFileSync(entryFile,program,{flag:'wx',mode:0o600});
    const resourceProfile=profilePermit===evalPermit?'eval':profilePermit===qualifyPermit?'qualify':'check';
    job=await runner.run(resourceProfile,{executable:python,args:['-I','-B','-S','-X','utf8',path.join(repository,'server/studio/aghr/read-only-launcher.py'),entryFile,inputFile],cwd:repository,signal:current.signal,maxOutputBytes:262144,onStarted:s=>{started=structuredClone(s);},onOutput:e=>streams[e.stream].push(e.bytes)});
    const receipt={operation:'execute',resource_profile:resourceProfile,run_id,identity:state.identity,driver_hash:observed.entry_hash,input_hash:'sha256:'+sha(bytes),...job,stdout_base64:Buffer.concat(streams.stdout).toString('base64'),stderr_base64:Buffer.concat(streams.stderr).toString('base64')};records.push(receipt);verifyE4();
    const after=hostAdapter.capture().skills.find(s=>s.id===id);if(!after||after.entry_hash!==observed.entry_hash||after.instruction_hash!==observed.instruction_hash)throw Error('DRIVER_OR_SKILL_CHANGED');
    if(job.active_processes_after!==0||job.started.hard_memory_bytes!==job.limits.memoryBytes||(job.started.limit_flags&0x2200)!==0x2200)throw Error('EXECUTION_CONTROLS_UNVERIFIED');
    const stdout=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(streams.stdout)),stderr=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(streams.stderr));
    t.proofs.set(id,{origin:'E4_LIVE_PROCESS_RECEIPT',run_id,identity:state.identity,instruction_hash:state.instruction_hash,driver_hash:observed.entry_hash,input_hash:'sha256:'+sha(bytes),stdout,stderr,stdout_hash:'sha256:'+sha(Buffer.from(stdout)),stderr_hash:'sha256:'+sha(Buffer.from(stderr)),process:{status:job.status,exit_code:job.exit_code,active_processes_after:job.active_processes_after,started:job.started}});
    if(hostSignals&&started)t.acks.set(id,{origin:'LOCAL_HOST_JOB_OBSERVATION',host:t.host,kind:'local-process-invocation-accepted',run_id,process_id:started.pid});
   }finally{active=false;current=null;for(const f of [inputFile,entryFile])if(fs.existsSync(f))fs.unlinkSync(f);fs.rmdirSync(dir);}
   const r=await invoke('transition',{current:state,target:'EXECUTED'},{proof:t.proofs.get(id)});t.states.set(id,r.data);return {data:r.data,execution:job,receipt:r.receipt};
  },
  async verify(task,id,task_criteria){const t=context(task),state=t.states.get(id);if(!state)throw Error('UNKNOWN_ID');const r=await invoke('transition',{current:state,target:'VERIFIED',task_criteria},{proof:t.proofs.get(id)});t.states.set(id,r.data);return r;},
  async hostSignal(task,id){const t=context(task),state=t.states.get(id);if(!state)throw Error('UNKNOWN_ID');const r=await invoke('transition',{current:state,target:'HOST_SIGNAL'},{proof:t.proofs.get(id),acknowledgement:t.acks.get(id)});t.states.set(id,r.data);return r;},
  eval:(task,id,config)=>batch('eval',task,id,config),
  qualify:(task,id,config)=>batch('qualify',task,id,config),
  async qualification(task,id,record=qualifications.get(id)){const t=context(task);if(!record)return {data:{result:'BLOCKED',status:'NOT_RUN',reason:'No qualification in this live host session.'},receipt:null};return invoke('qualification',{record,key:qualificationKey(t,id)},{known:qualifications.get(id)});},
  state(task,id){return structuredClone(context(task).states.get(id)??{state:'UNKNOWN_ID'});},
  changePhase(task,phase){const t=context(task);if(typeof phase!=='string'||!phase.trim())throw Error('PHASE_REQUIRED');t.phase=phase;t.states.clear();t.proofs.clear();t.acks.clear();return {status:'REASSESS_REQUIRED',phase};},
  cancel(){current?.abort();},
  close(){closed=true;current?.abort();}};
 return Object.freeze(api);
}
