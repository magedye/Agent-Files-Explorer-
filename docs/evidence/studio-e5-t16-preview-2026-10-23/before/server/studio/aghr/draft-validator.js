import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {repository,engineRoot,verifySource} from './cli-bridge.js';
import {StudioError} from '../auth.js';

const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const adapter=path.join(repository,'server/studio/aghr/draft-adapter.py');
const launcher=path.join(repository,'server/studio/aghr/read-only-launcher.py');
export async function createDraftValidator({python,base}){
 if(!path.isAbsolute(python))throw Error('ENGINE_EXECUTABLE_REQUIRED');
 verifySource();
 const pythonHash=hash(fs.readFileSync(python)),adapterHash=hash(fs.readFileSync(adapter));
 const env=Object.fromEntries(['SystemRoot','WINDIR','SYSTEMDRIVE'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
 const child=spawn(python,['-I','-B','-S','-X','utf8',launcher,adapter,engineRoot],{shell:false,windowsHide:true,env,stdio:['pipe','pipe','pipe']});
 let buffer='',pending=null,failure=null,startupResolve,startupReject;
 const ready=new Promise((resolve,reject)=>{startupResolve=resolve;startupReject=reject;});
 const startupTimer=setTimeout(()=>fail(Error('DRAFT_WORKER_STARTUP_TIMEOUT')),30000);
 function fail(error){
  if(failure)return;failure=error;clearTimeout(startupTimer);startupReject(error);
  if(pending){clearTimeout(pending.timer);pending.reject(error);pending=null;}
  child.stdin.end();child.kill();
 }
 child.stdin.on('error',()=>fail(Error('DRAFT_WORKER_UNAVAILABLE')));
 child.on('error',()=>fail(Error('DRAFT_WORKER_UNAVAILABLE')));
 child.on('close',()=>fail(Error('DRAFT_WORKER_UNAVAILABLE')));
 let stderrBytes=0;
 child.stderr.on('data',b=>{stderrBytes+=b.length;if(stderrBytes>65536)fail(Error('DRAFT_OUTPUT_LIMIT'));});
 child.stdout.setEncoding('utf8');
 child.stdout.on('data',chunk=>{
  buffer+=chunk;if(Buffer.byteLength(buffer)>262144)return fail(Error('DRAFT_OUTPUT_LIMIT'));
  let end;
  while((end=buffer.indexOf('\n'))>=0){
   const line=buffer.slice(0,end);buffer=buffer.slice(end+1);
   let message;try{message=JSON.parse(line);}catch{return fail(Error('DRAFT_ADAPTER_PROTOCOL'));}
   if(message.event==='ready'&&message.adapter_revision==='draft.1'){clearTimeout(startupTimer);startupResolve();continue;}
   if(!pending||message.request_id!==pending.id||message.adapter_revision!=='draft.1')return fail(Error('DRAFT_ADAPTER_PROTOCOL'));
   const request=pending;pending=null;clearTimeout(request.timer);request.resolve(message);
  }
 });
 await ready;
 return Object.freeze({
  async prepare(payload){
   if(failure)throw failure;
   if(pending)throw new StudioError(429,'RATE_LIMITED','Draft parser is busy.');
   verifySource();
   if(hash(fs.readFileSync(python))!==pythonHash||hash(fs.readFileSync(adapter))!==adapterHash)throw Error('DRAFT_ADAPTER_DRIFT');
   const id=crypto.randomUUID(),input=JSON.stringify({request_id:id,payload,base});
   if(Buffer.byteLength(input)>65536)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Draft exceeds the 64 KiB preparation limit.');
   const result=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>fail(Error('DRAFT_PARSER_TIMEOUT')),15000);
    pending={id,resolve,reject,timer};child.stdin.write(input+'\n');
   });
   if(result.result!=='STRUCTURE_VALID')throw new StudioError(422,'VALIDATION_FAILED',result.reason||'Pinned Python schema rejected the draft.');
   const canonical=Buffer.from(result.canonical_base64,'base64');
   if(result.proposal_version_hash!=='sha256:'+hash(canonical)||result.strict_status!=='NOT_RUN'||!isDeepStrictEqual(JSON.parse(canonical.toString('utf8')),result.payload))throw Error('DRAFT_ADAPTER_FALSE_SUCCESS');
   return Object.freeze({...result.payload,proposal_version_hash:result.proposal_version_hash,item_id:result.item_id});
  },
  close(){
   failure??=Error('DRAFT_WORKER_CLOSED');if(pending){clearTimeout(pending.timer);pending.reject(failure);pending=null;}
   child.stdin.end();const timer=setTimeout(()=>child.kill(),3000);timer.unref();child.once('close',()=>clearTimeout(timer));
  },
 });
}
