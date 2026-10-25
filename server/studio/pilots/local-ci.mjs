// Sandbox-only Git gate and separate post-merge publisher. No hosted CI claim.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {pilotRoot} from './local-profile.mjs';
import {createJobRunner} from '../aghr/job-runner.js';
const here=fileURLToPath(import.meta.url),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
// Absolute executable remains available inside the resource runner's minimal
// environment. This pilot profile is explicitly Windows/Git for Windows only.
const gitBinary='C:/Program Files/Git/cmd/git.exe';
const git=(root,args)=>execFileSync(gitBinary,['-C',root,...args],{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:8*1024**2}).trim();
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
function paths(id){const root=pilotRoot(id);return {root,privateRoot:root+'/.aghr/ci-private',remote:root+'/.aghr/ci-private/remote.git',permit:root+'/.aghr/ci-private/merge-permit.json',config:root+'/.aghr/ci-private/trust.json'};}
function authenticated(id){
 const p=paths(id),config=JSON.parse(fs.readFileSync(p.config)),envelope=JSON.parse(fs.readFileSync(p.permit));
 if(config.project!==id||config.module_hash!==sha(fs.readFileSync(here))||!crypto.verify(null,Buffer.from(envelope.payload),config.public_key,Buffer.from(envelope.signature,'base64')))throw Error('CI_SIGNATURE_INVALID');
 const value=JSON.parse(envelope.payload);
 if(value.project!==id||value.profile!=='SANDBOX_LOCAL_CI_V1'||value.expires<Date.now()||value.unsigned_gpg!==true)throw Error('CI_SCOPE_OR_EXPIRY_INVALID');
 return {p,config,value};
}
export function enforceReceive(id,input){
 const p=paths(id),config=JSON.parse(fs.readFileSync(p.config));
 const lines=input.trim().split('\n');if(lines.length!==1)throw Error('ONE_MERGE_AT_A_TIME');
 const [old,next,ref]=lines[0].trim().split(/\s+/);
 if(ref!=='refs/heads/main'||!/^[a-f0-9]{40}$/.test(next))throw Error('MAIN_ONLY');
 if(/^0+$/.test(old)&&next===config.bootstrap_sha)return {status:'BOOTSTRAP_ONLY'};
 const {value}=authenticated(id);
 if(value.merge_sha!==next||value.before_sha!==old||git(p.remote,['rev-list','--parents','-n','1',next]).split(' ').length!==3)throw Error('MERGE_OR_CURRENT_HASH_REQUIRED');
 if(git(p.remote,['rev-parse',next+'^1'])!==old)throw Error('STALE_BASE');
 if(value.checks.strict!=='PASS'||value.checks.drift!=='PASS'||value.checks.skill_states!=='PASS'||value.checks.doctor!=='PASS')throw Error('REQUIRED_CHECKS_MISSING');
 // The signed exact commit ID binds its complete immutable Git tree. The
 // issuer checked each approved file before signing; spawning Git per blob
 // here would exceed the bounded hook budget on Windows.
 return {status:'PASS',merge_sha:next};
}
export function publish(id){
 const {p,value}=authenticated(id);
 if(git(p.remote,['rev-parse','refs/heads/main'])!==value.merge_sha||git(p.root,['rev-parse','HEAD'])!==value.merge_sha)throw Error('POST_MERGE_ONLY');
 if(git(p.root,['rev-list','--parents','-n','1','HEAD']).split(' ').length!==3)throw Error('ACTUAL_MERGE_REQUIRED');
 for(const [name,h]of Object.entries(value.files))if(sha(fs.readFileSync(p.root+'/'+name))!==h)throw Error('WORKTREE_INPUT_DRIFT');
 const proof=fs.readFileSync(p.root+'/'+value.evidence.path);if(sha(proof)!==value.evidence.sha256)throw Error('PR_EVIDENCE_DRIFT');
 const statePath=p.root+'/.aghr/state.json';if(fs.existsSync(statePath))throw Error('STATE_ALREADY_PUBLISHED');
 const state={schemaVersion:'1.2',aghrVersion:'1.0.0-rc.3',adoptionLevel:value.level,domainLevels:{instructions:value.level,skills:id==='pilot-app-l3'?'L3':'L0'},evalStatus:id==='pilot-app-l3'?'PASS':'NOT_RUN',skillQualification:value.qualifications,exceptions:[],publication:{publisher:'ci',ciRunRef:'local-git-ci:'+value.run_id,commitHash:value.merge_sha,publishedAt:new Date().toISOString(),sourceEvidence:[{path:value.evidence.path,content_hash:'sha256:'+value.evidence.sha256,bytes:proof.length}]}};
 fs.writeFileSync(statePath,JSON.stringify(state,null,2)+'\n',{flag:'wx'});
 return {status:'PUBLISHED_AFTER_ACTUAL_LOCAL_MERGE',state,profile:value.profile,state_sha256:sha(fs.readFileSync(statePath)),gpg:'UNSIGNED_OWNER_ACCEPTED_WARNING',hosted_ci:'NOT_RUN',release:'NOT_GRANTED'};
}
export function createLocalCI({id,python}){
 const p=paths(id),runner=createJobRunner({python}),moduleHash=sha(fs.readFileSync(here));
 fs.mkdirSync(p.privateRoot,{recursive:true});
 const keyFile=p.privateRoot+'/signer.pkcs8.pem';let keys;
 if(fs.existsSync(keyFile)){const privateKey=crypto.createPrivateKey(fs.readFileSync(keyFile));keys={privateKey,publicKey:crypto.createPublicKey(privateKey)};}
 else{keys=crypto.generateKeyPairSync('ed25519');fs.writeFileSync(keyFile,keys.privateKey.export({type:'pkcs8',format:'pem'}),{flag:'wx',mode:0o600});}
 let directProof=null;
 return {
  initialize({resumeMerged=false}={}){
   if(fs.existsSync(p.config)){
    const old=JSON.parse(fs.readFileSync(p.config));
    const head=git(p.root,['rev-parse','HEAD']),remote=git(p.remote,['rev-parse','refs/heads/main']);
    const merged=resumeMerged&&git(p.root,['rev-list','--parents','-n','1',head]).split(' ').length===3&&(remote===head||git(p.root,['rev-parse',head+'^1'])===remote);
    if(git(p.root,['branch','--show-current'])!=='main'||!merged&&(head!==old.bootstrap_sha||remote!==old.bootstrap_sha))throw Error('RESUME_REQUIRES_OWNED_BASELINE_OR_MERGE');
    if(old.public_key!==keys.publicKey.export({type:'spki',format:'pem'}))throw Error('CI_SIGNER_DRIFT');
    if(old.module_hash!==moduleHash){save(p.privateRoot+'/trust.previous-'+crypto.randomUUID()+'.json',old);fs.writeFileSync(p.config,JSON.stringify({...old,module_hash:moduleHash},null,2)+'\n');}
    git(p.root,['config','core.autocrlf','false']);git(p.root,['config','core.eol','lf']);return {baseline:old.bootstrap_sha,resumed:true,remote_profile:'local bare Git; no GitHub',signature:'GPG_UNSIGNED_OWNER_ACCEPTED'};
   }
   git(p.root,['init','-b','main']);git(p.root,['config','core.autocrlf','false']);git(p.root,['config','core.eol','lf']);git(p.root,['config','user.name','Owner-delegated Sandbox Operator']);git(p.root,['config','user.email','sandbox@localhost']);git(p.root,['config','commit.gpgsign','false']);
   // Only sandbox application bytes enter the initial commit.
   const names=fs.readdirSync(p.root).filter(n=>!['.git','.aghr','__pycache__'].includes(n));git(p.root,['add','--',...names]);git(p.root,['commit','-m','Sandbox application baseline; unsigned owner-accepted']);
   const baseline=git(p.root,['rev-parse','HEAD']);git(p.root,['init','--bare',p.remote]);
   save(p.config,{project:id,module_hash:moduleHash,public_key:keys.publicKey.export({type:'spki',format:'pem'}),bootstrap_sha:baseline});
   const hook='#!/bin/sh\nexec "'+process.execPath.replaceAll('\\','/')+'" "'+here.replaceAll('\\','/')+'" hook '+id+'\n';fs.writeFileSync(p.remote+'/hooks/pre-receive',hook,{flag:'wx'});
   git(p.root,['remote','add','sandbox-ci',p.remote]);git(p.root,['push','sandbox-ci','main']);return {baseline,remote_profile:'local bare Git; no GitHub',signature:'GPG_UNSIGNED_OWNER_ACCEPTED'};
  },
  rejectDirectPush(){
   git(p.root,['switch','-c','negative-direct-push-'+crypto.randomUUID()]);fs.writeFileSync(p.root+'/unapproved-change.txt','Unauthorized direct push must be rejected.\n',{flag:'wx'});git(p.root,['add','unapproved-change.txt']);git(p.root,['commit','-m','Negative control: unauthorized direct push']);
   let rejected;try{git(p.root,['push','sandbox-ci','HEAD:main']);}catch(e){rejected={status:'REJECTED',exit_code:e.status,stdout:String(e.stdout),stderr:String(e.stderr)};}
   git(p.root,['switch','main']);if(!rejected)throw Error('DIRECT_PUSH_FALSE_SUCCESS');directProof=rejected;return rejected;
  },
  async merge({patch,approved,validate,evidence,qualifications,level}){
   if(sha(fs.readFileSync(here))!==moduleHash)throw Error('CI_CODE_DRIFT');
   if(!directProof||level!==(id==='pilot-app-l3'?'L3':'L2'))throw Error('REAL_BRANCH_GATE_AND_SCOPED_LEVEL_REQUIRED');
   const cp=approved();if(!['approved','exported'].includes(cp.status)||cp.approvals.length!==1||cp.approvals[0].approved_version_hash!==cp.proposal_version_hash)throw Error('EXACT_OWNER_ADOPTION_REQUIRED');
   const strict=await validate();if(strict.exit_code!==0)throw Error('STRICT_NOT_PASSED');
   const head=git(p.root,['rev-parse','HEAD']),remote=git(p.remote,['rev-parse','refs/heads/main']),alreadyExported=fs.existsSync(p.root+'/.aghr/package/aghr.json');
   let before=head,proposed,merged;
   if(!alreadyExported){git(p.root,['switch','-c','adoption-'+cp.id]);git(p.root,['apply','--check',patch]);git(p.root,['apply',patch]);git(p.root,['add','AGENTS.md','.aghr/package']);git(p.root,['commit','-m','Adopt scoped '+level+' governance '+cp.proposal_version_hash]);}
   const proposedFiles=JSON.parse(cp.proposed_yaml).files;
   for(const file of proposedFiles){if(!/^AGENTS\.md$|^\.aghr\/package\/(?:aghr\.json|CHANGELOG\.md|policies\/[\w-]+\.json)$/.test(file.path)||sha(fs.readFileSync(p.root+'/'+file.path))!==file.content_hash.replace('sha256:',''))throw Error('APPROVED_FILE_DRIFT');}
   const testJob=await runner.run('check',{executable:id==='pilot-app-l2'?process.execPath:python,args:id==='pilot-app-l2'?['--test',p.root+'/app.test.mjs']:['-B',p.root+'/checks.py'],cwd:p.root});
   if(testJob.exit_code!==0||testJob.active_processes_after!==0)throw Error('ACTUAL_APPLICATION_CHECK_FAILED '+testJob.stderr);
   if(alreadyExported&&remote!==head){before=remote;merged=head;proposed=git(p.root,['rev-parse',head+'^2']);if(git(p.root,['rev-parse',head+'^1'])!==remote)throw Error('UNMERGED_RETRY_BASE_MISMATCH');}
   else{
    if(alreadyExported){git(p.root,['switch','-c','ci-retry-'+crypto.randomUUID()]);git(p.root,['commit','--allow-empty','-m','Retry bounded sandbox CI for unchanged approved CP']);}
    proposed=git(p.root,['rev-parse','HEAD']);git(p.root,['switch','main']);git(p.root,['merge','--no-ff','--no-edit',proposed]);merged=git(p.root,['rev-parse','HEAD']);
   }
   const checked=await validate();if(checked.exit_code!==0||approved().proposal_version_hash!==cp.proposal_version_hash||!['approved','exported'].includes(approved().status))throw Error('POST_MERGE_CHECK_FAILED');
   const names=git(p.root,['ls-tree','-r','--name-only','HEAD']).split('\n'),files=Object.fromEntries(names.map(name=>[name,sha(fs.readFileSync(p.root+'/'+name))]));
   fs.mkdirSync(p.root+'/.aghr/ci-results',{recursive:true});const evidencePath='.aghr/ci-results/pr-evidence-'+crypto.randomUUID()+'.json';save(p.root+'/'+evidencePath,{...evidence,application_test:testJob,actual_strict:checked,branch_gate:directProof});
   const value={project:id,profile:'SANDBOX_LOCAL_CI_V1',run_id:crypto.randomUUID(),expires:Date.now()+15*60000,before_sha:before,proposal_sha:proposed,merge_sha:merged,proposal_version_hash:cp.proposal_version_hash,level,qualifications,unsigned_gpg:true,files,evidence:{path:evidencePath,sha256:sha(fs.readFileSync(p.root+'/'+evidencePath))},checks:{strict:'PASS',drift:'PASS',skill_states:'PASS',doctor:'PASS'}};
   const envelope=v=>{const payload=JSON.stringify(v);return {payload,signature:crypto.sign(null,Buffer.from(payload),keys.privateKey).toString('base64')};};
   // A correctly signed stale receipt is insufficient; actual hook must reject it.
   if(fs.existsSync(p.permit))fs.copyFileSync(p.permit,p.privateRoot+'/merge-permit.previous-'+crypto.randomUUID()+'.json',fs.constants.COPYFILE_EXCL);
   fs.writeFileSync(p.permit,JSON.stringify(envelope({...value,merge_sha:before})));
   let stale;try{git(p.root,['push','sandbox-ci','main']);}catch(e){stale={status:'REJECTED',exit_code:e.status,stderr:String(e.stderr)};}if(!stale)throw Error('STALE_HASH_FALSE_SUCCESS');
   fs.writeFileSync(p.permit,JSON.stringify(envelope(value)));git(p.root,['push','sandbox-ci','main']);
   if(fs.existsSync(p.root+'/.aghr/state.json'))throw Error('STATE_WRITTEN_BEFORE_PUBLISHER');
   const job=await runner.run('check',{executable:process.execPath,args:[here,'publish',id],cwd:p.root});
   if(job.exit_code!==0||job.active_processes_after!==0)throw Error('CI_PUBLISH_FAILED '+job.stderr);
   return {baseline:before,proposed,merged,stale_hash:stale,application_test:testJob,publisher:JSON.parse(job.stdout),resource:job};
  }
 };
}
if(process.argv[1]&&path.resolve(process.argv[1])===here){
 try{const mode=process.argv[2],id=process.argv[3];if(mode==='hook'){let input='';for await(const chunk of process.stdin)input+=chunk;console.log(JSON.stringify(enforceReceive(id,input)));}else if(mode==='publish')console.log(JSON.stringify(publish(id)));else throw Error('UNKNOWN_CI_OPERATION');}
 catch(e){console.error(e.message);process.exitCode=1;}
}
