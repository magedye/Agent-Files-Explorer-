import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
export const out='docs/evidence/studio-phase3-2026-10-24';
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const changed=['server/studio/draft-runtime.js','server/studio/serve-draft.mjs','server/studio/db/persistent.js','src/features/changes/DraftStudio.jsx','docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/INDEX.md'];
if(process.argv[1]?.endsWith('prepare.mjs')){
 if(fs.existsSync(out))throw Error('EVIDENCE_EXISTS');
 const p='docs/evidence/studio-native-t20-t21-2026-10-24/CUSTODY.lock.json',b=fs.readFileSync(p),parent=JSON.parse(b);
 if(sha(b)!=='7e09b28b329d8e36bb44df86caa93058e20326aba59085b93ddaf3c720281cff')throw Error('PARENT_PIN');
 for(const [p,r]of Object.entries(parent.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('PARENT_DRIFT '+p);
 verifyE4();fs.mkdirSync(out+'/before',{recursive:true});const before={};
 for(const p of changed){const b=fs.readFileSync(p),copy='before/'+p+'.raw';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,b,{flag:'wx'});before[p]={sha256:sha(b),bytes:b.length,copy};}
 fs.writeFileSync(out+'/PREFLIGHT.json',JSON.stringify({at:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short'],{encoding:'utf8'}),parent:{path:p,sha256:sha(b),files:Object.keys(parent.files).length},before,authority:'Owner accepts T20/T21; one bounded native diagnosis; implement T22/T23/T24 without changing reference or E1-E4'},null,2),{flag:'wx'});console.log('Custody verified; before snapshots saved.');
}
