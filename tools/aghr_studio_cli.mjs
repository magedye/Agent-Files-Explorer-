// Public E3 local CLI: readonly Python operations under the T15 Job adapter.
import fs from 'node:fs';
import path from 'node:path';
import {createBoundedValidator,sourceHash} from '../server/studio/aghr/bounded-validator.js';
const [command,...args]=process.argv.slice(2);let engine;
try{
 if(!['validate','doctor','generate','preview'].includes(command)||args.some(a=>a!=='--strict'&&!a.startsWith('--input=')&&!a.startsWith('--python='))||(command==='validate'&&!args.includes('--strict')))throw Error('USAGE');
 const inputPath=args.find(a=>a.startsWith('--input='))?.slice(8);if(!inputPath)throw Error('INPUT_REQUIRED');
 const raw=fs.readFileSync(path.resolve(inputPath));if(raw.length>262144)throw Error('INPUT_LIMIT');const input=JSON.parse(raw);
 if(Object.keys(input).some(k=>!['payload','base','preview','lookup_context'].includes(k)))throw Error('UNTRUSTED_CONTEXT_FIELD');
 engine=await createBoundedValidator({python:path.resolve(args.find(a=>a.startsWith('--python='))?.slice(9)||'temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),base:input.base});
 const result=command==='validate'?await engine.check(input.payload):command==='doctor'?await engine.doctorRun(input.payload):command==='generate'?await engine.generateRun(input.payload,input.preview,input.lookup_context):await engine.previewRun(input.payload);
 const receipt=result.resource_receipt||result.receipt;process.stdout.write(receipt.stdout);process.stderr.write(JSON.stringify({event:'resource_receipt',engine_hash:receipt.engine_hash,input_hash:receipt.input_hash,limits:receipt.limits,active_processes_after:receipt.active_processes_after,duration_ms:receipt.duration_ms})+'\n');process.exitCode=receipt.exit_code;
}catch(error){
 if(error.receipt){process.stdout.write(error.receipt.stdout);process.exitCode=error.receipt.exit_code;}
 else{process.stdout.write(JSON.stringify({protocol_version:'3',command,result:'ERROR',exit_code:2,source:{content_hash:sourceHash},checks:{status:'NOT_RUN'},diagnostics:[{code:'CLI_REJECTED',message:error.message}],data:null})+'\n');process.exitCode=2;}
}finally{engine?.close();}
