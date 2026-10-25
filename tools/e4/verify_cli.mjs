import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {audit,goodCriteria} from './acceptance.mjs';
import {sourceHash} from '../../server/studio/aghr/e4-bridge.js';
const out=path.resolve(process.argv[2]??'docs/evidence/studio-e4-2026-10-24/cli');if(fs.existsSync(out))throw Error('CLI_EVIDENCE_EXISTS');fs.mkdirSync(out);
const host=path.join(out,'HOST.json');fs.writeFileSync(host,JSON.stringify({skills:[audit],permissions:['workspace.read'],scope:'local-json-fixture/**'}));
const broken=path.join(out,'UNAVAILABLE_HOST.json');fs.writeFileSync(broken,JSON.stringify({skills:[{...audit,skillPath:out+'/missing/SKILL.md'}]}));
const base={task_id:'e4-public-cli',skill_id:audit.id};
const cases=[
 ['forged-receipt',2,{...base,operation:'verify',execution:{state:'VERIFIED',exit_code:0,origin:'E4_LIVE_PROCESS_RECEIPT'}}],
 ['loaded-not-executed',1,{...base,operation:'verify',task_criteria:goodCriteria}],
 ['unknown-id',1,{...base,operation:'discover',skill_id:'unknown'}],
 ['no-skill-needed',0,{operation:'discover',query:'hello',task_id:'simple'}],
 ['discovery-unavailable',3,{...base,operation:'discover'},broken],
 ['eval-failed-criteria',1,{...base,operation:'eval',input:{document:{name:'actual'},required:['name']},task_criteria:JSON.stringify({all:[{pointer:'/valid',op:'equals',value:false}]}),runs:3}],
 ['eval-passed',0,{...base,operation:'eval',input:{document:{name:'actual'},required:['name']},task_criteria:goodCriteria,runs:3}],
 ['qualify-local-procedure',0,{...base,operation:'qualify',input:{document:{name:'actual'},required:['name']},task_criteria:goodCriteria,runs:3}]
];
const results=[];for(const [name,expected,request,config=host]of cases){
 const input=path.join(out,name+'.input.json');fs.writeFileSync(input,JSON.stringify(request,null,2)+'\n',{flag:'wx'});
 const args=['tools/aghr_e4_cli.mjs','--request='+input,'--host-config='+config],started_at=new Date().toISOString();
 const c=spawn(process.execPath,args,{windowsHide:true,shell:false}),stdout=[],stderr=[];c.stdout.on('data',b=>stdout.push(b));c.stderr.on('data',b=>stderr.push(b));const exit_code=await new Promise((r,j)=>{c.on('error',j);c.on('close',r);});
 const raw=Buffer.concat(stdout),err=Buffer.concat(stderr);fs.writeFileSync(path.join(out,name+'.stdout.json'),raw,{flag:'wx'});fs.writeFileSync(path.join(out,name+'.stderr.txt'),err,{flag:'wx'});
 const report=JSON.parse(raw);assert.equal(exit_code,expected,name+':'+raw);assert.equal(report.exit_code,expected);assert.equal(report.protocol_version,'3');assert.equal(report.source.content_hash,sourceHash);
 if(name==='loaded-not-executed')assert.match(report.diagnostics[0].message,/EXECUTION_EVIDENCE_REQUIRED/);
 if(request.operation==='eval'||request.operation==='qualify'){assert.equal(report.execution_receipts.length,3);assert.equal(report.resource.limits.timeoutMs,request.operation==='eval'?600000:3600000);assert.equal(report.resource.limits.memoryBytes,2147483648);}
 results.push({name,expected,exit_code,args,started_at,finished_at:new Date().toISOString(),status:'PASS'});
}
fs.writeFileSync(path.join(out,'RESULTS.json'),JSON.stringify({status:'PASS_FOR_LOCAL_CORE',source_hash:sourceHash,results},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({cases:results.length,status:'PASS_FOR_LOCAL_CORE'}));
