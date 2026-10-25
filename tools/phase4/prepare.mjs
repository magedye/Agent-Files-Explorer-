import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
export const out='docs/evidence/studio-phase4-2026-10-24',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const changed=['server/studio/draft-runtime.js','server/studio/serve-draft.mjs','server/studio/db/persistent.js','server/studio/draft-routes.js','src/features/changes/DraftStudio.jsx','docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/INDEX.md'];
if(process.argv[1]?.endsWith('prepare.mjs')){
 const parentPath='docs/evidence/studio-phase3-2026-10-24/CUSTODY.lock.json',b=fs.readFileSync(parentPath),parent=JSON.parse(b);
 if(sha(b)!=='ac81be0b7824263aa545b80e705f801c83aca54591c92e4af791a3dc756a8e45')throw Error('PARENT_DRIFT');for(const [p,r]of Object.entries(parent.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('PARENT_DRIFT '+p);verifyE4();
 fs.mkdirSync(out+'/before',{recursive:true});const before={};for(const p of changed){const b=fs.readFileSync(p),copy='before/'+p+'.raw';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,b,{flag:'wx'});before[p]={sha256:sha(b),bytes:b.length,copy};}
 fs.writeFileSync(out+'/PREFLIGHT.json',JSON.stringify({at:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),before,parent:{path:parentPath,sha256:sha(b)},authority:'Owner accepts Phase3 within documented NOT_RUN boundaries; implement T25–T29 in Draft, no canonical writes or automatic policy promotion.'},null,2),{flag:'wx'});console.log('Parent custody verified; before snapshots saved.');
}
