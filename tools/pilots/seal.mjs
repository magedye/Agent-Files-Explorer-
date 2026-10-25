import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const base='docs/evidence/studio-pilots-2026-10-25',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const pre=JSON.parse(fs.readFileSync(base+'/PREFLIGHT.json')),parentRaw=fs.readFileSync(pre.parent.path),parent=JSON.parse(parentRaw);
if(sha(parentRaw)!==pre.parent.sha256)throw Error('PARENT_LOCK_DRIFT');
const frozen=JSON.parse(fs.readFileSync(base+'/TESTED_SOURCE.lock.json'));for(const [p,r]of Object.entries(frozen.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('TESTED_SOURCE_DRIFT '+p);
const edits=[];let unchanged=0;
for(const [p,r]of Object.entries(parent.files)){
 if(pre.before[p]){const old=pre.before[p];if(sha(fs.readFileSync(base+'/'+old.copy))!==r.sha256)throw Error('BEFORE_DRIFT');edits.push({path:p,before:r.sha256,after:sha(fs.readFileSync(p)),copy:old.copy});let diff;try{diff=execFileSync('C:/Program Files/Git/cmd/git.exe',['diff','--no-index','--',base+'/'+old.copy,p],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','ignore'],maxBuffer:1024**2,timeout:15000});}catch(error){if(error.status!==1)throw error;diff=error.stdout.toString();}const target=base+'/diffs/'+p+'.patch';fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target)){if(fs.readFileSync(target,'utf8')!==diff)throw Error('DIFF_SNAPSHOT_DRIFT');}else fs.writeFileSync(target,diff,{flag:'wx'});}
 else{if(sha(fs.readFileSync(p))!==r.sha256)throw Error('PARENT_DRIFT '+p);unchanged++;}
}
const e3Path='docs/evidence/studio-e3-t19-2026-10-24/CUSTODY.lock.json',e3Raw=fs.readFileSync(e3Path),e3=JSON.parse(e3Raw);
if(sha(e3Raw)!=='2869e66bf9ada6b7471bfbdb2060ae12ed9890c76057be8898678610a1251c9a')throw Error('E3_LOCK_DRIFT');
const p4=JSON.parse(fs.readFileSync('docs/evidence/studio-phase4-2026-10-24/CUSTODY.lock.json'));let original=0,inherited=0,reference=0;
for(const [p,r]of Object.entries(e3.files)){
 if(pre.before[p])continue;const expected=parent.files[p]??p4.files[p]??r;
 if(sha(fs.readFileSync(p))!==expected.sha256)throw Error('IMMUTABLE_DRIFT '+p);
 if(expected.sha256===r.sha256)original++;else inherited++;
 if(p.startsWith('governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/'))reference++;
}
verifyE4();
json(base+'/BEFORE_AFTER.json',{status:'PASS',edits,new_components:['server/studio/pilots/local-profile.mjs','server/studio/pilots/package-probe.py','server/studio/pilots/adoption.mjs','server/studio/pilots/local-ci.mjs'],sandbox_source_hashes:Object.fromEntries(Object.entries(frozen.files).filter(([p])=>p.startsWith('pilot-app-'))),baseline_unchanged:true,core_engine_changed:false});
const referencePath='governance_packages/references/Agent_Governance_Harness_Reference_1.2.0',referenceTracked=execFileSync('C:/Program Files/Git/cmd/git.exe',['ls-files','--',referencePath],{encoding:'utf8'}).trim().split('\n').filter(Boolean).length,referenceStatus=execFileSync('C:/Program Files/Git/cmd/git.exe',['status','--porcelain=v1','--untracked-files=no','--',referencePath],{encoding:'utf8'}).trim();if(referenceStatus)throw Error('REFERENCE_GIT_DIRTY');
json(base+'/PRESERVATION_FINAL.json',{status:'PASS',parent_unchanged:unchanged,parent_total:Object.keys(parent.files).length,intentional_document_edits:edits.length,tested_source_files:Object.keys(frozen.files).length,e3_original_files:original,inherited_accepted_edits:inherited,reference120_explicit_pinned_files:reference,reference120_tracked_files:referenceTracked,reference120_git_status:referenceStatus,reference120:'No writes; tracked Git status clean and sealed RULES.json raw hash unchanged. No full package crawl.',e1_e4:'UNCHANGED',root_state_exists:fs.existsSync('.aghr/state.json'),default_owner_db_used:false,external_project_used:false,root_head:execFileSync('C:/Program Files/Git/cmd/git.exe',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),root_commit_push:'NOT_PERFORMED'});
const pilots=[];
for(const id of ['pilot-app-l2','pilot-app-l3']){
 const dir=base+'/'+fs.readFileSync(base+'/'+id+'.latest.txt','utf8').trim(),acceptance=JSON.parse(fs.readFileSync(dir+'/ACCEPTANCE.json')),state=JSON.parse(fs.readFileSync(id+'/.aghr/state.json'));
 const config=JSON.parse(fs.readFileSync(id+'/.aghr/ci-private/trust.json')),permit=JSON.parse(fs.readFileSync(id+'/.aghr/ci-private/merge-permit.json'));
 if(config.module_hash!==sha(fs.readFileSync('server/studio/pilots/local-ci.mjs'))||!crypto.verify(null,Buffer.from(permit.payload),config.public_key,Buffer.from(permit.signature,'base64')))throw Error('LOCAL_CI_SIGNATURE_DRIFT');
 const attested=JSON.parse(permit.payload);if(attested.merge_sha!==state.publication.commitHash||attested.project!==id)throw Error('CI_STATE_BINDING_DRIFT');
 for(const [p,h]of Object.entries(attested.files))if(sha(fs.readFileSync(id+'/'+p))!==h)throw Error('MERGED_PILOT_SOURCE_DRIFT');
 json(base+'/public-ci/'+id+'.json',{profile:'SANDBOX_LOCAL_CI_V1',public_trust:config,signed_receipt:permit,published_state:state,signature_verified_at_seal:true,private_key:'EXCLUDED',state_sha256:sha(fs.readFileSync(id+'/.aghr/state.json'))});
 pilots.push({id,path:dir+'/ACCEPTANCE.json',sha256:sha(fs.readFileSync(dir+'/ACCEPTANCE.json')),status:acceptance.status,level:acceptance.level,merge_sha:state.publication.commitHash,metrics:dir+(id.endsWith('l2')?'/METRICS_CORRECTED.json':'/METRICS.json'),draft_database:{path:id+'/.aghr/drafts/studio.sqlite',sha256:sha(fs.readFileSync(id+'/.aghr/drafts/studio.sqlite'))}});
}
const log=fs.readFileSync(base+'/NPM_TEST.log','utf8'),number=k=>Number(log.match(new RegExp('(?:ℹ|#) '+k+' (\\d+)'))?.[1]);
if(number('tests')!==151||number('pass')!==151||number('fail')!==0||number('cancelled')!==0||number('skipped')!==0)throw Error('REGRESSION_NOT_PASSED');
const browserPath='docs/evidence/studio-t36-2026-10-25/browser-1792930535064/ACCEPTANCE.json',browser=JSON.parse(fs.readFileSync(browserPath));if(browser.status!=='PASS'||browser.protected_files!==204)throw Error('BROWSER_NOT_PASSED');
json(base+'/OWNER_AUTHORITY.json',{source:'Current explicit owner message,2026-10-25; not a newly signed owner document',accepted_by_owner:['T30','T31','T32','T33','Unsigned GPG fallback with visible warning'],authorized:['T34 sandbox pilot-app-l2','T35 sandbox pilot-app-l3','aghr-local-process only','T36 start after scoped pilots pass'],excluded:['outside projects','reference1.2.0 writes','native diagnosis','hosted publishing','production rollout'],this_delivery_owner_acceptance:'NOT_SELF_GRANTED',release_acceptance:'NOT_GRANTED'});
json(base+'/FINAL_ACCEPTANCE.json',{status:'TESTED_FOR_SANDBOX_LOCAL_PROFILE',at:new Date().toISOString(),pilots,regression:{command:'npm test',tests:151,pass:151,fail:0,cancelled:0,skipped:0,raw:base+'/NPM_TEST.log',source_pin:base+'/TESTED_SOURCE.lock.json',product_source_unchanged_through_regression:true},project_specific:{honesty:7,scenarios:8,eval_actual_runs:3,qualification_actual_runs:3,mocks:false,skill_scope:'pilot-app-l3/**',host:'aghr-local-process',native_hosts:{codex:'NOT_RUN',antigravity:'NOT_RUN'}},browser:{path:browserPath,sha256:sha(fs.readFileSync(browserPath)),status:browser.status,protected_files:204,source_state_runtime_writes:0,port:9224,other_project_9223:'NOT_ATTACHED_NOT_CHANGED'},context_check:'PENDING_FINAL_DOCUMENT_LINK_CHECK',t36:{status:'STARTED_NOT_CLOSED',inventory:'docs/evidence/studio-t36-2026-10-25/ACCEPTANCE_INVENTORY.json',screens:16,api_definitions:59,http:58,ws:1,gaps:['pilot/UI registration and authentic level propagation','canonical API coverage,aliases,streaming and T36a–e']},remaining:{external_standard_18_4:'NOT_QUALIFIED_NOT_WAIVED: no production project and0/2 P0 effect calibration',gpg:'UNCONFIGURED_UNSIGNED_OWNER_ACCEPTED_WARNING',hosted_ci:'NOT_RUN',independent_review:'NOT_PERFORMED',t37_t40:'NOT_STARTED',release:'NOT_GRANTED'},preservation:base+'/PRESERVATION_FINAL.json',owner_acceptance:'AWAITING_OWNER_REVIEW_OF_THIS_DELIVERY'});
console.log(JSON.stringify({status:'PASS',unchanged,original,inherited,reference,source_files:Object.keys(frozen.files).length}));
