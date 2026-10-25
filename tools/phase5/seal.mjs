import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {out,sha,changed} from './prepare.mjs';
const pre=JSON.parse(fs.readFileSync(out+'/PREFLIGHT.json')),accept=JSON.parse(fs.readFileSync(out+'/FINAL_ACCEPTANCE.json'));
if(accept.status!=='IMPLEMENTED_TESTED_LOCAL_DRAFT'||JSON.parse(fs.readFileSync(out+'/PRESERVATION_FINAL.json')).status!=='PASS')throw Error('FINAL_GATES_PENDING');
const edited=[];
for(const [p,before]of Object.entries(pre.before)){
 const bytes=fs.readFileSync(p),copy='after/'+p+'.raw';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,bytes,{flag:'wx'});
 const diff=spawnSync('git',['diff','--no-index','--',out+'/'+before.copy,p],{encoding:'utf8'});if(diff.status!==0&&diff.status!==1)throw Error('DIFF_FAILED '+p);
 const d='diffs/'+p+'.patch';fs.mkdirSync(path.dirname(out+'/'+d),{recursive:true});fs.writeFileSync(out+'/'+d,diff.stdout,{flag:'wx'});
 const check=spawnSync('git',['diff','--no-index','--check','--',out+'/'+before.copy,p],{encoding:'utf8'});
 edited.push({path:p,before,after:{sha256:sha(bytes),bytes:bytes.length,copy},diff:d,whitespace:{exit_code:check.status,stdout:check.stdout,stderr:check.stderr}});
}
fs.writeFileSync(out+'/BEFORE_AFTER.json',JSON.stringify({status:'RECORDED',edited},null,2),{flag:'wx'});
const correlation=JSON.parse(fs.readFileSync(out+'/CORRELATION_BASE.json')),correlationDiffs=[];
for(const [p,before]of Object.entries(correlation.before)){
 if(sha(fs.readFileSync(out+'/'+before.copy))!==before.sha256)throw Error('CORRELATION_BEFORE_DRIFT '+p);
 const bytes=fs.readFileSync(p),copy='correlation-after/'+p+'.raw',diffPath='correlation-diffs/'+p+'.patch';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,bytes,{flag:'wx'});fs.mkdirSync(path.dirname(out+'/'+diffPath),{recursive:true});
 const diff=spawnSync('git',['diff','--no-index','--',out+'/'+before.copy,p],{encoding:'utf8'});if(![0,1].includes(diff.status))throw Error('CORRELATION_DIFF_FAILED');fs.writeFileSync(out+'/'+diffPath,diff.stdout,{flag:'wx'});correlationDiffs.push({path:p,before,after:{sha256:sha(bytes),bytes:bytes.length,copy},diff:diffPath});
}
fs.writeFileSync(out+'/CORRELATION_BEFORE_AFTER.json',JSON.stringify({status:'RECORDED',correlationDiffs,phase3_test:'See BEFORE_AFTER.json; its source was preserved before the final assertion extension.'},null,2),{flag:'wx'});
const names=new Set(changed);for(const p of ['tests/studio_phase5.test.mjs','tests/studio_phase5_metrics.test.mjs','tests/studio_phase5_evaluators.test.mjs','docs/plans/STUDIO_T34_T35_PILOT_STEPS_AR.md','docs/features/STUDIO_PHASE5_METRICS_SETTINGS.md'])names.add(p);
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.posix.join(dir,e.name);if(e.isSymbolicLink())throw Error('CUSTODY_REPARSE');if(e.isDirectory())visit(p);else if(p!==out+'/CUSTODY.lock.json')names.add(p);}}
for(const p of ['server/studio/phase5','src/features/measurement','tools/phase5',out])visit(p);
const files=Object.fromEntries([...names].sort().map(p=>{const b=fs.readFileSync(p);return [p,{bytes:b.length,sha256:sha(b)}];}));
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();if(head!==pre.head||branch!==pre.branch)throw Error('GIT_CUSTODY_CHANGED');
fs.writeFileSync(out+'/CUSTODY.lock.json',JSON.stringify({profile:'phase5-local.1',algorithm:'SHA256 raw bytes; not an owner/publisher signature',scope:'T30–T33 local Draft implementation and scoped actual-project evaluator configuration; T34/T35 plan only',parent:pre.parent,head,branch,files},null,2),{flag:'wx'});
console.log({files:Object.keys(files).length,sha256:sha(fs.readFileSync(out+'/CUSTODY.lock.json')),tests:accept.tests.pass});
