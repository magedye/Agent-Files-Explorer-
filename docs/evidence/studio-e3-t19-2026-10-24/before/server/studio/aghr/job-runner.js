import path from 'node:path';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const resourceProfiles=Object.freeze({eval:Object.freeze({timeoutMs:600000,memoryBytes:2*1024**3}),qualify:Object.freeze({timeoutMs:3600000,memoryBytes:2*1024**3})});
const adapter=fileURLToPath(new URL('./windows-job.py',import.meta.url));
// Only trusted server configuration calls this primitive. No HTTP request can
// supply an executable, argv, profile override, cwd or adapter path.
export function createJobRunner({python,profiles=resourceProfiles}={}){
 if(process.platform!=='win32'||!python||!path.isAbsolute(python)||!fs.existsSync(adapter))throw Error('RESOURCE_ADAPTER_UNAVAILABLE');
 return {run(command,{executable,args=[],cwd,signal,onStarted=()=>{},onOutput=()=>{},maxOutputBytes=16*1024**2}){
  const limits=profiles[command];
  if(!['eval','qualify'].includes(command)||!limits||!path.isAbsolute(executable)||!path.isAbsolute(cwd)||!Array.isArray(args)||args.some(a=>typeof a!=='string'||a.includes('\0'))||!Number.isSafeInteger(limits.timeoutMs)||limits.timeoutMs<1||!Number.isSafeInteger(limits.memoryBytes)||limits.memoryBytes<64*1024**2||!Number.isSafeInteger(maxOutputBytes)||maxOutputBytes<1||maxOutputBytes>16*1024**2)throw Error('RESOURCE_CONFIG_INVALID');
  if(signal?.aborted)return Promise.resolve({status:'errored',reason:'user_cancelled',exit_code:null,stdout:'',stderr:'',resource_peak_mb:null,active_processes_after:0});
  return new Promise((resolve,reject)=>{
   const env=Object.fromEntries(['SystemRoot','WINDIR','SYSTEMDRIVE'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
   const child=spawn(python,['-I','-B','-S','-X','utf8',adapter],{cwd,shell:false,windowsHide:true,env,stdio:['pipe','pipe','pipe']});
   const stdout=[],stderr=[],adapterErr=[];let buffer='',result,failed,total=0,started;
   const cancel=()=>{if(!child.stdin.destroyed)child.stdin.write('cancel\n');};
   signal?.addEventListener('abort',cancel,{once:true});
   const timer=setTimeout(()=>{failed=Error('RESOURCE_ADAPTER_CONTROLLER_TIMEOUT');child.kill();},limits.timeoutMs+15000);
   child.stdout.on('data',chunk=>{
    total+=chunk.length;if(total>maxOutputBytes*2+65536){failed=Error('RESOURCE_ADAPTER_OUTPUT_LIMIT');child.kill();return;}
    buffer+=chunk.toString('utf8');let end;
    while((end=buffer.indexOf('\n'))>=0){
     const line=buffer.slice(0,end);buffer=buffer.slice(end+1);
     try{const event=JSON.parse(line);
      if(event.event==='started'){started=event;onStarted(event);if(signal?.aborted)cancel();}
      else if(event.event==='output'){const bytes=Buffer.from(event.base64,'base64');(event.stream==='stdout'?stdout:stderr).push(bytes);onOutput({stream:event.stream,bytes});}
      else if(event.event==='finished'){result=event;child.stdin.end();}
      else if(event.event==='adapter_error')failed=Error('RESOURCE_ADAPTER_UNAVAILABLE: '+event.reason);
      else throw Error('RESOURCE_ADAPTER_PROTOCOL');
     }catch(error){failed=error;child.kill();}
    }
   });
   child.stderr.on('data',b=>{if(adapterErr.reduce((n,x)=>n+x.length,0)<65536)adapterErr.push(b);});child.stdin.on('error',()=>{});
   const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);};
   child.on('error',error=>{cleanup();reject(error);});
   child.on('close',code=>{
    cleanup();if(failed||code!==0||!result||!started||result.active_processes_after!==0)return reject(failed||Error('RESOURCE_ADAPTER_FAILED: '+Buffer.concat(adapterErr).toString('utf8')));
    resolve({...result,started,stdout:Buffer.concat(stdout).toString('utf8'),stderr:Buffer.concat(stderr).toString('utf8'),limits:{...limits}});
   });
   child.stdin.write(JSON.stringify({executable,args,cwd,timeout_ms:limits.timeoutMs,memory_bytes:limits.memoryBytes,max_output_bytes:maxOutputBytes})+'\n');
  });
 }};
}
