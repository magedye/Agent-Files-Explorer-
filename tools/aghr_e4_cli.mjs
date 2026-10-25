// Public protocol-3 entry: JSON cannot supply trusted receipts or host signals.
import fs from 'node:fs';
import path from 'node:path';
import {createE4Engine,sourceHash} from '../server/studio/aghr/e4-bridge.js';
import {repository} from '../server/studio/aghr/cli-bridge.js';
let engine,code=2;
try{
 const flags={};for(const arg of process.argv.slice(2)){const m=/^--(request|host-config|python)=(.+)$/.exec(arg);if(!m||flags[m[1]])throw Error('UNSUPPORTED_ARGUMENT');flags[m[1]]=m[2];}
 if(!flags.request)throw Error('REQUEST_REQUIRED');const raw=fs.readFileSync(flags.request);if(raw.length>65536)throw Error('INPUT_LIMIT');const request=JSON.parse(raw);
 const allowed=['operation','task_id','phase','skill_id','query','input','task_criteria','runs','priority','max_violation_rate','release','evidence'];if(Object.keys(request).some(k=>!allowed.includes(k)))throw Error('UNTRUSTED_HOST_OR_RECEIPT_FIELDS');
 const config=flags['host-config']?JSON.parse(fs.readFileSync(flags['host-config'],'utf8')):{skills:[]};
 if(Object.keys(config).some(k=>!['skills','permissions','scope','hostSignals'].includes(k)))throw Error('HOST_CONFIG_FIELDS_INVALID');
 // host-config is an explicit OS operator configuration, never an HTTP body.
 // It registers read-only Python drivers; host identity remains local-process.
 engine=createE4Engine({python:path.resolve(flags.python??path.join(repository,'temp/aghr-e1a-20261022-01/venv/Scripts/python.exe')),...config});
 const task=engine.createTask({task_id:request.task_id??'e4-cli',phase:request.phase??'verification'});let result;
 if(request.operation==='evidence')result=await engine.inspectEvidence(request.evidence);
 else if(request.operation==='discover')result=await engine.discover(task,{requested_id:request.skill_id,query:request.query??''});
 else if(['eval','qualify'].includes(request.operation)){
  if(!flags['host-config'])throw Error('TRUSTED_OPERATOR_HOST_CONFIG_REQUIRED');result=await engine[request.operation](task,request.skill_id,{input:request.input,task_criteria:request.task_criteria,runs:request.runs??3,priority:request.priority??'P0-Safety',max_violation_rate:request.max_violation_rate??0,release:request.release===true});
 }else if(['verify','claim'].includes(request.operation)){
  const selected=await engine.discover(task,{requested_id:request.skill_id});if(selected.data.status!=='SELECTED')result=selected;else{await engine.load(task,request.skill_id);result=await engine.verify(task,request.skill_id,request.task_criteria);}
 }else throw Error('OPERATION_UNSUPPORTED');
 code=result.data.status==='resource_limit_exceeded'||result.data.status==='ABANDONED'?3:result.receipt?.exit_code??({VALID:0,READ:0,INVALID:1,BLOCKED:3}[result.data.result]??3);
 process.stdout.write(JSON.stringify({protocol_version:'3',command:['eval','qualify'].includes(request.operation)?request.operation:'check',result:code===0?'VALID':code===3?'BLOCKED':'INVALID',exit_code:code,source:{implementation_id:'aghr-e4-native-core',content_hash:sourceHash},data:result.data,execution_receipts:engine.records.filter(r=>r.operation==='execute'),resource:result.receipt?{limits:result.receipt.limits,started:result.receipt.started,active_processes_after:result.receipt.active_processes_after}:null})+'\n');
}catch(error){code=error.receipt?.exit_code??2;process.stdout.write(JSON.stringify({protocol_version:'3',command:'check',result:code===1?'INVALID':'ERROR',exit_code:code,source:{implementation_id:'aghr-e4-native-core',content_hash:sourceHash},data:null,diagnostics:[{code:'E4_REJECTED',message:error.message}]})+'\n');}
finally{engine?.close();}
process.exitCode=code;
