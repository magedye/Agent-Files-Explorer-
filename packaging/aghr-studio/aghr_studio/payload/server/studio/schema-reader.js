import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {repository,verifySource} from './aghr/cli-bridge.js';
import {createJobRunner} from './aghr/job-runner.js';
export function createSchemaReader({python}){
 const runner=createJobRunner({python});
 return async(schema,definition,values)=>{
  verifySource();const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-schema-')),input=path.join(dir,'input.json');
  try{
   fs.writeFileSync(input,JSON.stringify({schema,definition,values}),{flag:'wx'});
   const job=await runner.run('check',{executable:python,args:['-I','-B','-S','-X','utf8',path.join(repository,'server/studio/aghr/read-only-launcher.py'),path.join(repository,'server/studio/aghr/contract-reader.py'),input],cwd:repository,maxOutputBytes:256*1024});
   verifySource();if(!['passed','failed'].includes(job.status)||![0,1].includes(job.exit_code)){const error=Error('SCHEMA_READER_UNAVAILABLE');error.receipt=job;error.schema=schema;error.definition=definition;throw error;}
   const report=JSON.parse(job.stdout);if(report.valid!==(job.exit_code===0))throw Error('SCHEMA_READER_FALSE_SUCCESS');return report;
  }finally{fs.unlinkSync(input);fs.rmdirSync(dir);}
 };
}
