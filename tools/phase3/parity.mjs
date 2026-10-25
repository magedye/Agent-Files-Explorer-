import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createJobRunner} from '../../server/studio/aghr/job-runner.js';
import {engineRoot,verifySource,decodeResult} from '../../server/studio/aghr/cli-bridge.js';
import {compareReports} from '../../server/studio/ci/assessment.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export async function parity100(output){
 const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-ci-parity-')),seed=20261024;
 let random=seed;const next=()=>{random^=random<<13;random^=random>>>17;random^=random<<5;return random>>>0;};
 const base=JSON.parse(fs.readFileSync(engineRoot+'/policies/observations/reference-state.json')),items=Array.from({length:100},(_,i)=>({...structuredClone(base),id:'OBS-SEED-'+String(i+1).padStart(3,'0'),title:'Seeded parity observation '+(i+1),scope:{paths:['src/part-'+next()%17+'/**']},rule:'Seeded test observation '+next()}));
 fs.mkdirSync(root+'/policies/observations',{recursive:true});fs.copyFileSync(engineRoot+'/aghr.json',root+'/aghr.json');
 const itemPath=root+'/policies/observations/seeded.json',initial=verifySource(),runs=[],decisions=[];
 const execute=async(label)=>{
  const receipt=await createJobRunner({python}).run('validate',{executable:python,args:['-I','-B','-S','-X','utf8',path.resolve('server/studio/aghr/read-only-launcher.py'),engineRoot+'/tools/cli.py','validate','--strict'],cwd:root});
  assert.equal(receipt.active_processes_after,0);assert.equal(receipt.started.hard_memory_bytes,2*1024**3);assert(['passed','failed'].includes(receipt.status));
  const decoded=decodeResult(receipt.stdout,receipt.stderr,receipt.exit_code,'validate');runs.push({label,...decoded,resource_receipt:receipt});return decoded.report;
 };
 for(const variant of ['valid','invalid']){
  const data=structuredClone(items);if(variant==='invalid')for(let i=0;i<data.length;i++){if(i%3===0)delete data[i].scope;else if(i%5===0)data[i].force='MUST';}
  const bytes=Buffer.from(JSON.stringify(data,null,2)+'\n');fs.writeFileSync(itemPath,bytes);
  const studio=await execute(variant+'-studio'),ci=await execute(variant+'-ci'),comparison=compareReports(studio,ci);
  assert.equal(studio.exit_code,variant==='valid'?0:1);assert.equal(ci.exit_code,studio.exit_code);
  const findings=studio.data.validation.findings;for(const item of data){const issues=findings.filter(f=>f.item_id===item.id);decisions.push({variant,id:item.id,item_hash:hash(Buffer.from(JSON.stringify(item))),comparison:comparison.status,findings:issues.map(x=>({code:x.code,pointer:x.pointer})),individual_structure:issues.length?'INVALID':'NO_STRUCTURAL_FINDING',package_result:studio.result});}
  assert.equal(hash(fs.readFileSync(itemPath)),hash(bytes));
 }
 assert.deepEqual(verifySource(),initial);assert.throws(()=>compareReports(runs[0].report,{...runs[1].report,result:'INVALID'}),/DIVERGENCE/);
 const result={status:'PASS_FOR_TWO_LOCAL_BOUNDARIES',seed,units:100,variants:['valid','invalid'],original_items:items,decisions,runs,divergence:'REJECTED',source_written:false,state_written:false,hosted_ci:'NOT_RUN',qualification:'NOT_RUN',meaning:'Actual immutable CLI invoked twice per variant; this is local parity evidence, not a hosted workflow execution.'};
 if(output)fs.writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx'});return result;
}
if(process.argv[1]?.endsWith('/parity.mjs')||process.argv[1]?.endsWith('\\parity.mjs'))console.log(JSON.stringify({status:(await parity100(process.argv[2])).status}));
