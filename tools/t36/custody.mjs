import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const root=process.cwd();
export const evidence=path.join(root,'docs/evidence/studio-t36-completion-2026-10-25');
export const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function save(name,value){fs.mkdirSync(evidence,{recursive:true});fs.writeFileSync(path.join(evidence,name),typeof value==='string'?value:JSON.stringify(value,null,2)+'\n','utf8');}
export function before(relative){const target=path.join(evidence,'before',relative+'.raw');if(fs.existsSync(target)||!fs.existsSync(path.join(root,relative)))return;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,relative),target);}
if(process.argv[2]==='preflight'){
 const parentPath='docs/evidence/studio-pilots-2026-10-25/CUSTODY.lock.json',bytes=fs.readFileSync(parentPath),parent=JSON.parse(bytes);
 const entries=Array.isArray(parent.files)?parent.files:Object.entries(parent.files).map(([p,v])=>({path:p,...(typeof v==='string'?{sha256:v}:v)}));
 const differences=[];for(const entry of entries){const file=entry.path||entry.file;const wanted=entry.sha256||entry.hash;try{if(sha(fs.readFileSync(file))!==wanted)differences.push(file);}catch{differences.push(file);}}
 if(differences.length)throw Error('PARENT_CUSTODY_DRIFT '+JSON.stringify(differences));
 for(const file of ['package.json','package-lock.json','vite.config.mjs','docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/INDEX.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md'])before(file);
 save('PREFLIGHT.json',{at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'}),parent:{path:parentPath,sha256:sha(bytes),files:entries.length,differences},owner_acceptance:'T34_T35_ACCEPTED_CURRENT_OWNER_INSTRUCTION',authorized:'T36a-e; T37/T38 only after T36 closes; no public release',boundaries:['reference 1.2.0 preserved','published sandbox sources/state immutable','native hosts NOT_RUN','Draft only','fresh E4 qualification not inferred from historical state']});
 console.log(JSON.stringify({parent_files:entries.length,differences:0,evidence}));
}
