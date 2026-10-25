import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const base='docs/evidence/studio-pilots-2026-10-25',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),lockPath=base+'/CUSTODY.lock.json';
const verify=files=>{for(const [p,r]of Object.entries(files))if(sha(fs.readFileSync(p))!==r.sha256||fs.statSync(p).size!==r.bytes)throw Error('CUSTODY_DRIFT '+p);};
if(fs.existsSync(lockPath)){const lock=JSON.parse(fs.readFileSync(lockPath));verify(lock.files);verifyE4();console.log(JSON.stringify({status:'PASS',files:Object.keys(lock.files).length,sha256:sha(fs.readFileSync(lockPath)),profile:lock.profile}));}
else{
 const frozen=JSON.parse(fs.readFileSync(base+'/TESTED_SOURCE.lock.json'));verify(frozen.files);verifyE4();
 const context=fs.readFileSync(base+'/CONTEXT_FINAL.log','utf8');if(!context.includes('Errors: 0, Warnings: 0')||!context.includes('PASSED'))throw Error('CONTEXT_NOT_PASSED');
 const finalPath=base+'/FINAL_ACCEPTANCE.json',final=JSON.parse(fs.readFileSync(finalPath));final.context_check={status:'PASS',path:base+'/CONTEXT_FINAL.log',sha256:sha(fs.readFileSync(base+'/CONTEXT_FINAL.log'))};
 final.root_head=execFileSync('C:/Program Files/Git/cmd/git.exe',['rev-parse','HEAD'],{encoding:'utf8'}).trim();final.root_branch=execFileSync('C:/Program Files/Git/cmd/git.exe',['branch','--show-current'],{encoding:'utf8'}).trim();
 if(final.root_head!=='133746a0ad99d10568a44c8d225219df8454271c'||final.root_branch!=='main')throw Error('ROOT_CUSTODY_CHANGED');
 fs.writeFileSync(finalPath,JSON.stringify(final,null,2)+'\n');
 const paths=new Set(Object.keys(frozen.files));
 const add=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=(dir+'/'+e.name).replaceAll('\\','/');if(e.isSymbolicLink())throw Error('EVIDENCE_REPARSE_POINT');if(e.isDirectory())add(p);else if(p!==lockPath)paths.add(p);}};
 for(const dir of [base,'docs/evidence/studio-t36-2026-10-25','tools/pilots'])add(dir);
 for(const p of ['docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/INDEX.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/plans/STUDIO_T34_T35_PILOT_STEPS_AR.md'])paths.add(p);
 const files=Object.fromEntries([...paths].sort().map(p=>[p,{sha256:sha(fs.readFileSync(p)),bytes:fs.statSync(p).size}]));
 const lock={profile:'T34_T35_SANDBOX_LOCAL_V1_T36_STARTED',algorithm:'SHA256 raw bytes; custody receipt is not an owner/release signature',parent:JSON.parse(fs.readFileSync(base+'/PREFLIGHT.json')).parent,source_pin:base+'/TESTED_SOURCE.lock.json',owner_scope:'Two local sandbox trials and conditional T36 start. No native,production,external-standard or release qualification.',private_keys:'EXCLUDED: no ci-private traversal or key hashing',root_head:final.root_head,root_branch:final.root_branch,files};
 fs.writeFileSync(lockPath,JSON.stringify(lock,null,2)+'\n',{flag:'wx'});verify(files);console.log(JSON.stringify({status:'PASS',files:Object.keys(files).length,sha256:sha(fs.readFileSync(lockPath)),profile:lock.profile}));
}
