import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {repository,verifySource} from './cli-bridge.js';
import {verifyExtension} from './draft-validator.js';
import {createJobRunner} from './job-runner.js';
import {StudioError} from '../auth.js';

const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const entry=path.join(repository,'server/studio/aghr/e3/entry.py');
const lockFile=path.join(repository,'server/studio/aghr/e3/SOURCE.lock.json');
export const sourceHash='c76c6d5987eca7a5108230f846f52149675fcd5aa54d3bc51b0ae5d18a24b650';
export function verifyE3(){
 verifySource();verifyExtension();const raw=fs.readFileSync(lockFile);
 if(sha(raw)!==sourceHash)throw Error('E3_SOURCE_DRIFT');
 for(const [name,expected]of Object.entries(JSON.parse(raw).files)){
  const absolute=path.resolve(repository,name);if(!absolute.startsWith(repository+path.sep)||sha(fs.readFileSync(absolute))!==expected)throw Error('E3_SOURCE_DRIFT');
 }
 return sourceHash;
}
export async function createBoundedValidator({python,base}){
 verifyE3();const runner=createJobRunner({python}),pythonHash=sha(fs.readFileSync(python));
 let active=false,closed=false,current;const preparedCache=[];
 async function invoke(operation,payload,extra={}){
  if(closed)throw Error('E3_CLOSED');if(active)throw new StudioError(429,'RATE_LIMITED','Engine busy.');
  verifyE3();if(sha(fs.readFileSync(python))!==pythonHash)throw Error('ENGINE_EXECUTABLE_DRIFT');
  const raw=Buffer.from(JSON.stringify({operation,payload,base,...extra}));
  if(raw.length>262144)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Bounded engine input exceeds limit.');
  if(['prepare','edit'].includes(operation)&&Buffer.byteLength(JSON.stringify({payload,base,...extra}))>65536)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Draft preparation exceeds64KiB.');
  active=true;const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-e3-input-')),input=path.join(scratch,'input.json');
  try{
   fs.writeFileSync(input,raw,{flag:'wx',mode:0o600});current=new AbortController();
   const job=await runner.run(operation,{executable:python,args:['-I','-B','-S','-X','utf8',path.join(repository,'server/studio/aghr/read-only-launcher.py'),entry,input],cwd:repository,signal:current.signal,maxOutputBytes:4*1024**2});
   verifyE3();
   if(job.status==='resource_limit_exceeded')throw new StudioError(503,'RESOURCE_CONTROLS_UNAVAILABLE','resource_limit_exceeded:'+job.reason);
   let report;try{report=JSON.parse(job.stdout);}catch{throw Error('E3_PROTOCOL');}
   if(report.protocol_version!=='3'||report.command!==operation||report.source?.content_hash!==sourceHash||report.exit_code!==job.exit_code||report.exit_code!=={READ:0,VALID:0,INVALID:1,ERROR:2,BLOCKED:3}[report.result]||job.active_processes_after!==0||job.started.hard_memory_bytes!==job.limits.memoryBytes||(job.started.limit_flags&0x2200)!==0x2200||!['passed','failed'].includes(job.status))throw Error('E3_FALSE_SUCCESS');
   const receipt={operation,protocol_version:'3',engine_hash:sourceHash,python_hash:pythonHash,input_hash:'sha256:'+sha(raw),stdout:job.stdout,stderr:job.stderr,exit_code:job.exit_code,
    limits:job.limits,termination_reason:job.reason??'completed',duration_ms:job.duration_ms,resource_peak_mb:job.resource_peak_mb,active_processes_after:job.active_processes_after,started:job.started};
   if((report.result==='INVALID'||report.result==='ERROR')&&report.data===null){const error=new StudioError(422,'VALIDATION_FAILED',report.diagnostics[0]?.message||'Engine rejected the input.');error.receipt=receipt;throw error;}
   return {data:report.data,receipt};
  }finally{
   current=null;active=false;
   // Both exact paths were allocated by this process; no caller path is used.
   if(path.dirname(input)===scratch&&path.dirname(scratch)===os.tmpdir()&&path.basename(scratch).startsWith('aghr-e3-input-')){if(fs.existsSync(input))fs.unlinkSync(input);fs.rmdirSync(scratch);}
  }
 }
 async function prepare(payload,extra={}){
  if(closed)throw Error('E3_CLOSED');verifyE3();
  const prior=preparedCache.find(p=>isDeepStrictEqual(p.input,{payload,extra}));
  if(prior)return structuredClone(prior.result); // reuse original bounded structural result; never a fresh strict/eval claim
  const {data}=await invoke(extra.edit?'edit':'prepare',payload,extra),bytes=Buffer.from(data.canonical_base64,'base64');
  if(data.result!=='STRUCTURE_VALID'||data.proposal_version_hash!=='sha256:'+sha(bytes)||!isDeepStrictEqual(JSON.parse(bytes),data.payload))throw Error('E3_HASH_MISMATCH');
  const result={...data.payload,proposal_version_hash:data.proposal_version_hash,item_id:data.item_id};
  preparedCache.push({input:structuredClone({payload,extra}),result:structuredClone(result)});if(preparedCache.length>128)preparedCache.shift();return Object.freeze(result);
 }
 return Object.freeze({prepare,
  async check(payload,approvals=[],source_grants=[]){const {data,receipt}=await invoke('validate',payload,{source_grants});return {...data,resource_receipt:receipt};},
  async generate(payload,preview){return (await invoke('generate',payload,{preview})).data;},
  generateRun:(payload,preview,lookup_context)=>invoke('generate',payload,{preview,lookup_context}),
  doctorRun:payload=>invoke('doctor',payload),
  previewRun:payload=>invoke('preview',payload),
  attestRun:(payload,actor)=>invoke('attestation',payload,{actor}),
  lookupRun:(payload,item_id,content_hash,lookup_context)=>invoke('lookup',payload,{item_id,content_hash,lookup_context}),
  approvalRun:(cp,decision,actor,requirements)=>invoke('approval',null,{cp,decision,actor,requirements}),
  exportRun:(payload,cp,actor,requirements)=>invoke('export',payload,{cp,actor,requirements}),
  close(){closed=true;current?.abort();},
 });
}
