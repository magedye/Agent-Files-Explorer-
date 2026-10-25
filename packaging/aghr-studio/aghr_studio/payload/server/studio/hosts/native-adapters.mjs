import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {createJobRunner} from '../aghr/job-runner.js';
import {repository} from '../aghr/cli-bridge.js';
const sha=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
// Trusted startup configuration only. The UI cannot choose a binary, identity,
// working directory, skill path, or supply native frames/receipts.
export function createNativeAdapter({host,python,binary,cwd,isolated=false,stateDirectory=null,skill=null}){
 if(!['codex','antigravity'].includes(host)||!path.isAbsolute(cwd)||binary&&!path.isAbsolute(binary))throw Error('NATIVE_CONFIG_INVALID');
 const runner=createJobRunner({python}),receipts=new WeakMap();let current;
 const binaryHash=binary&&fs.existsSync(binary)?sha(fs.readFileSync(binary)):null;
 const driver=path.join(repository,'server/studio/hosts/native-process.py'),driverHash=sha(fs.readFileSync(driver));
 async function run(operation,{signal,onOutput=()=>{},prompt}={}){
  if(!binaryHash)throw Error('NATIVE_CHANNEL_UNAVAILABLE');
  if(operation!=='version'&&operation!=='help'&&!isolated)throw Error('ISOLATED_NATIVE_SESSION_REQUIRED');
  if(operation!=='version'&&operation!=='help'&&host==='codex'&&(!stateDirectory||!path.isAbsolute(stateDirectory)))throw Error('ISOLATED_NATIVE_STATE_REQUIRED');
  if(!['version','help','discover','execute'].includes(operation)||current)throw Error('NATIVE_OPERATION_UNAVAILABLE');
  if(operation==='execute'&&(!skill||typeof prompt!=='string'||!prompt.trim()||prompt.length>32768))throw Error('NATIVE_SKILL_INPUT_REQUIRED');
  if(sha(fs.readFileSync(binary))!==binaryHash||sha(fs.readFileSync(driver))!==driverHash)throw Error('NATIVE_SOURCE_DRIFT');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-native-')),input=path.join(dir,'input.json');current=new AbortController();
  const cancel=()=>current?.abort();signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  try{
   const config={host,binary,cwd,operation,state_directory:stateDirectory,...(operation==='execute'?{prompt,skill_name:skill.name,skill_path:skill.path}:{})};
   fs.writeFileSync(input,JSON.stringify(config),{flag:'wx'});
   const job=await runner.run(operation==='execute'?'qualify':'check',{executable:python,args:['-I','-B','-S','-X','utf8',driver,input],cwd,signal:current.signal,onOutput,maxOutputBytes:4*1024**2});
   if(sha(fs.readFileSync(binary))!==binaryHash||sha(fs.readFileSync(driver))!==driverHash)throw Error('NATIVE_SOURCE_DRIFT');
   const receipt=Object.freeze({});receipts.set(receipt,{job:structuredClone(job),operation,input_hash:sha(JSON.stringify(config)),binary_hash:binaryHash,driver_hash:driverHash});
   return {receipt,host,operation,job:structuredClone(job),qualification:'NOT_RUN'};
  }finally{signal?.removeEventListener('abort',cancel);current=null;fs.unlinkSync(input);fs.rmdirSync(dir);}
 }
 return {host,run,cancel:()=>current?.abort(),
  observation(receipt){
   const stored=receipts.get(receipt);if(!stored)throw Error('UNTRUSTED_NATIVE_RECEIPT');const proof=structuredClone(stored);
   const {job,operation}=proof;
   const frames=[];if(!['help','version'].includes(operation))for(const line of job.stdout.trim().split('\n').filter(Boolean))frames.push(JSON.parse(line));
   // Actual host completion is recorded independently of skill execution. No
   // native event is upgraded to VERIFIED: per-skill criteria still need E4.
   const completed=host==='codex'?frames.some(x=>x.frame?.method==='turn/completed'&&x.frame.params?.turn?.status==='completed'):frames.some(x=>x.frame?.event==='result'&&x.frame?.result?.status==='SUCCESS');
   return {...proof,host,frames,turn_completed:completed&&job.status==='passed',skill_execution:'NOT_OBSERVABLE',verified:'NOT_RUN',qualification:'NOT_RUN',reason:'Native turn completion alone does not prove skill execution or task criteria.'};
  }};
}
export const createCodexAdapter=config=>createNativeAdapter({...config,host:'codex'});
export const createAntigravityAdapter=config=>createNativeAdapter({...config,host:'antigravity'});
