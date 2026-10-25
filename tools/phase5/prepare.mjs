import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
export const out='docs/evidence/studio-phase5-2026-10-24';
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const changed=['server/studio/draft-runtime.js','server/studio/serve-draft.mjs','server/studio/db/persistent.js','server/studio/write-authorization.js','server/studio/skills/lifecycle-service.js','src/features/changes/DraftStudio.jsx','tests/studio_phase3_skills.test.mjs','docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/INDEX.md'];
if(process.argv[1]?.endsWith('prepare.mjs')){
 const parentPath='docs/evidence/studio-phase4-2026-10-24/CUSTODY.lock.json',bytes=fs.readFileSync(parentPath),parent=JSON.parse(bytes);
 if(sha(bytes)!=='7f9ae9234086b42747dbf5153fb48c0e7a5c0624c3ded8f02e3f9b6eeac3b43f')throw Error('PARENT_DRIFT');
 for(const [p,r]of Object.entries(parent.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('PARENT_DRIFT '+p);
 verifyE4();fs.mkdirSync(out+'/before',{recursive:true});const before={};
 for(const p of changed){const b=fs.readFileSync(p),copy='before/'+p+'.raw';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,b,{flag:'wx'});before[p]={sha256:sha(b),bytes:b.length,copy};}
 fs.writeFileSync(out+'/PREFLIGHT.json',JSON.stringify({at:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short'],{encoding:'utf8'}),parent:{path:parentPath,sha256:sha(bytes),files:Object.keys(parent.files).length},before,authority:'Owner accepts Phase4; configure actual-project trusted evaluators; implement T30–T33 Draft only; T34/T35 plan only. No canonical/state writes or publishing.'},null,2),{flag:'wx'});
 console.log('Phase4 custody and E1–E4 pins verified; snapshots saved.');
}
