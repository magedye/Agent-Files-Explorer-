import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {createJobRunner} from '../aghr/job-runner.js';
import {repository} from '../aghr/cli-bridge.js';
import {verifyE4} from '../aghr/e4-bridge.js';
import {StudioError} from '../auth.js';
export const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
export function createPhase4Bridge({python,base}){
 const runner=createJobRunner({python}),entry=path.join(repository,'server/studio/phase4/engine.py'),pin=hash(fs.readFileSync(entry));let closed=false;const controllers=new Set();
 return {async run(operation,data,context={}){
  verifyE4();if(closed||hash(fs.readFileSync(entry))!==pin)throw Error('PHASE4_SOURCE_DRIFT');
  const raw=Buffer.from(JSON.stringify({operation,data,context,base}));if(raw.length>1024**2)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Phase4 input exceeds1MiB.');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-phase4-')),file=path.join(dir,'request.json'),controller=new AbortController();controllers.add(controller);
  try{fs.writeFileSync(file,raw,{flag:'wx'});const job=await runner.run('check',{executable:python,args:['-I','-B','-S','-X','utf8',path.join(repository,'server/studio/aghr/read-only-launcher.py'),entry,file],cwd:repository,signal:controller.signal});
   if(!['passed','failed'].includes(job.status)||job.active_processes_after!==0||job.started.hard_memory_bytes!==2*1024**3)throw Error('RESOURCE_GATE_FAILED');
   const report=JSON.parse(job.stdout);if(report.protocol_version!=='3'||report.exit_code!==job.exit_code)throw Error('PHASE4_PROTOCOL_FAILED');
   if(job.exit_code!==0){const e=new StudioError(422,'VALIDATION_FAILED',report.reason||'Phase4 rejected.');e.receipt=job;throw e;}
   return {data:report.data,receipt:job};
  }finally{controllers.delete(controller);fs.unlinkSync(file);fs.rmdirSync(dir);}
 },close(){closed=true;for(const c of controllers)c.abort();}};
}
