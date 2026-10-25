import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
export const out='docs/evidence/studio-native-t20-t21-2026-10-24';
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const changes=['server/studio/draft-runtime.js','server/studio/db/persistent.js','server/studio/serve-draft.mjs','src/features/changes/DraftStudio.jsx','docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/INDEX.md'];
if(process.argv[1]?.endsWith('prepare.mjs')){
 if(fs.existsSync(out))throw Error('EVIDENCE_ALREADY_EXISTS');
 const parentPath='docs/evidence/studio-e4-2026-10-24/CUSTODY.lock.json',raw=fs.readFileSync(parentPath),parent=JSON.parse(raw);
 if(sha(raw)!=='f57daf24577be0c40f007328dedb335f755e57a9bea5133efc501399b8effb9f')throw Error('PARENT_PIN');
 for(const [name,record]of Object.entries(parent.files))if(sha(fs.readFileSync(name))!==record.sha256)throw Error('PARENT_DRIFT '+name);
 verifyE4();
 fs.mkdirSync(out+'/before',{recursive:true});
 const before={};for(const f of changes){const b=fs.readFileSync(f),copy='before/'+f+'.raw';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,b,{flag:'wx'});before[f]={sha256:sha(b),bytes:b.length,copy};}
 const git=args=>execFileSync('git',args,{encoding:'utf8',windowsHide:true});
 fs.writeFileSync(out+'/PREFLIGHT.json',JSON.stringify({at:new Date().toISOString(),head:git(['rev-parse','HEAD']).trim(),branch:git(['branch','--show-current']).trim(),status:git(['status','--short']),parent:{path:parentPath,sha256:sha(raw),verified_files:Object.keys(parent.files).length},before,authority:'Owner accepts E4 local core; authorizes native adapters then T20/T21; no reference/E1-E3 changes'},null,2));
 console.log('Parent verified, snapshots saved.');
}
