import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
export const out=path.resolve('docs/evidence/studio-pilots-2026-10-25');
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const json=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const parentPath='docs/evidence/studio-phase5-2026-10-24/CUSTODY.lock.json';
const raw=fs.readFileSync(parentPath),parent=JSON.parse(raw);
if(sha(raw)!=='00c6afae6fd915050623171b02504a1be3beb31f29589c3962deb3f47edcdf91')throw Error('PARENT_LOCK_DRIFT');
for(const [p,r]of Object.entries(parent.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('PARENT_FILE_DRIFT '+p);
verifyE4();
for(const name of ['pilot-app-l2','pilot-app-l3'])if(fs.existsSync(name))throw Error('PILOT_ALREADY_EXISTS '+name);
fs.mkdirSync(out,{recursive:true});
const before={};
for(const p of ['docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/plans/STUDIO_T34_T35_PILOT_STEPS_AR.md','docs/INDEX.md']){
 const b=fs.readFileSync(p),copy='before/'+p+'.raw';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,b,{flag:'wx'});before[p]={sha256:sha(b),bytes:b.length,copy};
}
json(out+'/PREFLIGHT.json',{at:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short'],{encoding:'utf8'}),parent:{path:parentPath,sha256:sha(raw),files:Object.keys(parent.files).length},before,authority:'Owner accepts T30–T33 and unsigned fallback; creates only pilot-app-l2 and pilot-app-l3; local host only; T36 starts only after successful pilots. No canonical/reference, other-project, hosted CI or release writes.',acceptance:['actual sandbox application requests and tests','strict validation positives and missing-authority/scope negatives','real local doctor and protected Git merge','CI-only post-merge state, Studio source/state/runtime Sentinel','project-bound local P0 eval/qualification, eight scenarios and seven honesty checks','hash-bound owner adoption and stale rejection','before/after metrics with denominators and honest missing values'],native_hosts:{codex:'NOT_RUN',antigravity:'NOT_RUN'},release:'NOT_GRANTED'});
console.log('Verified all '+Object.keys(parent.files).length+' parent files and frozen engine chain; raw before snapshots saved.');
