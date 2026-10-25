import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {repository} from '../../server/studio/aghr/cli-bridge.js';
import {verifyE3} from '../../server/studio/aghr/bounded-validator.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rel='docs/evidence/studio-e4-2026-10-24',out=path.join(repository,rel);
if(fs.existsSync(out))throw Error('EVIDENCE_EXISTS');verifyE3();
const parentPath='docs/evidence/studio-t19-mock-2026-10-24/CUSTODY.lock.json',parentRaw=fs.readFileSync(parentPath),parent=JSON.parse(parentRaw);
for(const [name,pin]of Object.entries(parent.files))if(sha(fs.readFileSync(name))!==pin.sha256)throw Error('PARENT_DRIFT:'+name);
fs.mkdirSync(path.join(out,'before'),{recursive:true});
const before={};for(const name of ['docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/plans/STUDIO_E4_EXECUTION_PROPOSAL_AR.md','docs/INDEX.md']){
 const raw=fs.readFileSync(name),copy='before/'+path.basename(name)+'.raw';fs.writeFileSync(path.join(out,copy),raw,{flag:'wx'});before[name]={sha256:sha(raw),bytes:raw.length,copy};
}
fs.writeFileSync(path.join(out,'PREFLIGHT.json'),JSON.stringify({date:'2026-10-24',branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),git_status:execFileSync('git',['status','--short'],{encoding:'utf8'}),parent:{path:parentPath,sha256:sha(parentRaw),verified_files:Object.keys(parent.files).length},native_e3_hash:verifyE3(),before,owner_authorization:'E4.a-e plan ACCEPTED; begin a/b sequentially; real honesty guards; Draft only; no E1-E3 changes',phase2:'ACCEPTED_BY_OWNER_MOCK_SCOPE_ONLY'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({out,prior_files_verified:Object.keys(parent.files).length}));
