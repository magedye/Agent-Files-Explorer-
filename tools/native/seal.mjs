import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {out,changes,sha} from './prepare.mjs';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const newFiles=[
 'server/studio/hosts/native-process.py','server/studio/hosts/native-adapters.mjs',
 'server/studio/aghr/contract-reader.py','server/studio/schema-reader.js','server/studio/evidence-reader.js','server/studio/verification-service.js','server/studio/execution-routes.js',
 'src/features/verification/Verification.jsx','src/features/verification/execution.css','src/features/runtime/RuntimeEvidence.jsx',
 'tests/studio_execution.test.mjs',...fs.readdirSync('tools/native').filter(n=>n.endsWith('.mjs')).map(n=>'tools/native/'+n),
];
if(fs.existsSync(out+'/CUSTODY.lock.json'))throw Error('ALREADY_SEALED');
for(const name of ['BEFORE_AFTER.json','SCOPED_DIFF_CHECK.json','CHANGES.patch'])if(fs.existsSync(out+'/'+name))fs.renameSync(out+'/'+name,out+'/attempts/SEAL_FIRST_'+name);
const preflight=JSON.parse(fs.readFileSync(out+'/PREFLIGHT.json'));
const acceptance=JSON.parse(fs.readFileSync(out+'/HTTP_ACCEPTANCE.json'));
for(const [p,h]of Object.entries(acceptance.source_at_load))if(sha(fs.readFileSync(p))!==h)throw Error('TESTED_SOURCE_DRIFT '+p);
verifyE4();
const preserved=JSON.parse(fs.readFileSync(out+'/PRESERVATION.json'));
if(preserved.status!=='PASS'||preserved.immutable_files_verified!==1916||preserved.authorized_application_changes.length!==4)throw Error('PRESERVATION_FAILED');
const browser=JSON.parse(fs.readFileSync(out+'/browser-verified/BROWSER_ACCEPTANCE.json'));
if(browser.status!=='PASS'||JSON.stringify(browser.source_before)!==JSON.stringify(browser.source_after))throw Error('BROWSER_FAILED');
const health=fs.readFileSync(out+'/CONTEXT_HEALTH_FINAL.log','utf8');if(!health.includes('Errors: 0, Warnings: 0'))throw Error('CONTEXT_FAILED');
const log=fs.readFileSync(out+'/NPM_TEST.log','utf8');if(!log.includes('pass 105')||!log.includes('fail 0'))throw Error('TEST_FAILED');
const decoder=new TextDecoder('utf8',{fatal:true});for(const p of [...changes,...newFiles])decoder.decode(fs.readFileSync(p));
fs.mkdirSync(out+'/after-final',{recursive:true});
const exceptions={};const diff=[],diffChecks=[];
const empty=out+'/before/EMPTY.raw';if(!fs.existsSync(empty))fs.writeFileSync(empty,'',{flag:'wx'});else if(fs.statSync(empty).size!==0)throw Error('EMPTY_BASE_DRIFT');
for(const p of [...changes,...newFiles]){
 const bytes=fs.readFileSync(p),copy='after-final/'+p+'.raw';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,bytes,{flag:'wx'});
 const after={sha256:sha(bytes),bytes:bytes.length,copy},before=preflight.before[p]||null;
 if(before)exceptions[p]={before,after};diff.push({path:p,before,after});
 const result=spawnSync('git',['-c','core.whitespace=blank-at-eol,blank-at-eof','diff','--no-index','--check',before?out+'/'+before.copy:empty,p],{encoding:'utf8',windowsHide:true});
 const output=result.stdout+result.stderr,lines=output.split(/\r?\n/).filter(Boolean),isEolAdvisory=line=>/^warning: in the working copy of '[^']+', LF will be replaced by CRLF the next time Git touches it$/.test(line);
 diffChecks.push({path:p,status:result.status,output,advisories:lines.filter(isEolAdvisory),findings:lines.filter(line=>!isEolAdvisory(line))});
 const patch=spawnSync('git',['diff','--no-index','--',before?out+'/'+before.copy:empty,p],{encoding:'utf8',windowsHide:true});
 fs.appendFileSync(out+'/CHANGES.patch',patch.stdout);
}
fs.writeFileSync(out+'/BEFORE_AFTER.json',JSON.stringify(diff,null,2),{flag:'wx'});
fs.writeFileSync(out+'/SCOPED_DIFF_CHECK.json',JSON.stringify(diffChecks,null,2),{flag:'wx'});
if(diffChecks.some(r=>r.findings.length||![0,1].includes(r.status)))throw Error('SCOPED_DIFF_CHECK_FAILED');
const git=args=>spawnSync('git',args,{encoding:'utf8',windowsHide:true}).stdout.trim();
fs.writeFileSync(out+'/VERIFICATION.json',JSON.stringify({status:'PASS_FOR_LOCAL_DRAFT',tests:{passed:105,failed:0,skipped:0,raw:'NPM_TEST.log'},browser:{status:browser.status,checks:browser.checks,console:'no errors/warnings/issues',raw:'browser-verified/BROWSER_ACCEPTANCE.json'},context:{errors:0,warnings:0},native:{codex:'NOT_RUN_INITIALIZE_TIMEOUT',antigravity:'NOT_RUN_AGY_UNAVAILABLE',honesty:'REQUIRED / NOT_RUN / NOT_WAIVED'},preservation:{files:1916,authorized_app_edits:4},build:'PASS_WITH_EXISTING_LEGACY_BUNDLE_ADVISORY',head:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),independent_review:'NOT_PERFORMED',owner_release_acceptance:'NOT_GRANTED',source_apply:false,state_written:false,default_draft_db_used:false},null,2),{flag:'wx'});
const receipt=b=>({sha256:sha(b),bytes:b.length}),files={};
const own=p=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){const name=p+'/'+e.name;if(e.isSymbolicLink())throw Error('REPARSE_POINT');if(e.isDirectory())own(name);else if(!name.endsWith('/CUSTODY.lock.json'))files[name]=receipt(fs.readFileSync(name));}};
own(out);for(const p of [...changes,...newFiles])files[p]=receipt(fs.readFileSync(p));
const parent=preflight.parent;
fs.writeFileSync(out+'/CUSTODY.lock.json',JSON.stringify({algorithm:'SHA256 raw bytes; not an owner/publisher signature',scope:'Native adapter code + local Draft T20/T21. Native profiles remain NOT_RUN.',parent,exceptions,files:Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)))},null,2),{flag:'wx'});
const seal=fs.readFileSync(out+'/CUSTODY.lock.json'),parsed=JSON.parse(seal);for(const [p,r]of Object.entries(parsed.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('POST_SEAL_DRIFT '+p);
console.log(JSON.stringify({status:'SEALED',files:Object.keys(files).length,sha256:sha(seal)}));
