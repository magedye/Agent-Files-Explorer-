// Trusted backend API only; no HTTP route accepts process receipts or host facts.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {repository} from './cli-bridge.js';
import {verifyE3} from './bounded-validator.js';
import {createJobRunner} from './job-runner.js';
import {createLocalProcessHost} from '../hosts/local-process.mjs';
export const sourceHash='f809972972eabac2b59aed135d90283feda5c30b2a78fc62d57064327eab0643';
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const lockPath=path.join(repository,'server/studio/aghr/e4/SOURCE.lock.json');
export function verifyE4(){
 const raw=fs.readFileSync(lockPath),pin=JSON.parse(raw);if(sha(raw)!==sourceHash||pin.native_e3_hash!==verifyE3())throw Error('E4_SOURCE_DRIFT');
 for(const [name,h]of Object.entries(pin.files)){const p=path.resolve(repository,name);if(!p.startsWith(repository+path.sep)||sha(fs.readFileSync(p))!==h)throw Error('E4_SOURCE_DRIFT');}return pin;
}
export function createE4Engine({python,skills=[],permissions=[],scope='**/*'}){
 verifyE4();const runner=createJobRunner({python}),pythonHash=sha(fs.readFileSync(python));let active=false,closed=false,current;
 const records=[],hostAdapter=createLocalProcessHost({skills}),tasks=new WeakMap();
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
 return Object.freeze({records,inspectEvidence:data=>invoke('evidence',data),
  createTask({task_id,phase='implementation'}){if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(task_id)||typeof phase!=='string'||!phase.trim())throw Error('TASK_ID_REQUIRED');const token=Object.freeze({}),capture=hostAdapter.capture();tasks.set(token,{task_id,session_id:crypto.randomUUID(),host:capture.host_id,host_version:capture.host_version,scope,phase,states:new Map()});return token;},
  async discover(task,request){const t=context(task),capture=hostAdapter.capture(),r=await invoke('discover',{...request,phase:t.phase},{capture,permissions});if(r.data.status==='SELECTED')for(const id of r.data.selected){const s=capture.skills.find(s=>s.id===id);t.states.set(id,{state:'SELECTED',instruction_hash:s.instruction_hash,identity:{task_id:t.task_id,session_id:t.session_id,host:t.host,host_version:t.host_version,scope:t.scope,skill_id:id},host_signal:'NOT_OBSERVABLE',execution:'NOT_RUN'});}return r;},
  async load(task,id){const t=context(task),state=t.states.get(id);if(!state)throw Error('SKILL_NOT_SELECTED');const s=hostAdapter.capture().skills.find(s=>s.id===id);if(!s)throw Error('DISCOVERY_UNAVAILABLE');const r=await invoke('transition',{current:state,target:'LOADED'},{instruction_hash:s.instruction_hash});t.states.set(id,r.data);return r;},
  async claim(task,id,target){const state=context(task).states.get(id);if(!state)throw Error('UNKNOWN_ID');return invoke('transition',{current:state,target});},
  state(task,id){return structuredClone(context(task).states.get(id)??{state:'UNKNOWN_ID'});},
  changePhase(task,phase){const t=context(task);if(typeof phase!=='string'||!phase.trim())throw Error('PHASE_REQUIRED');t.phase=phase;t.states.clear();return {status:'REASSESS_REQUIRED',phase};},
  close(){closed=true;current?.abort();}});
}
