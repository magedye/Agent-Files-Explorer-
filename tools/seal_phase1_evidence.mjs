// Owner-authorized evidence collector, never imported by the read-only server.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {verifySource,sourceHash} from '../server/studio/aghr/cli-bridge.js';
import {createReviewSource} from '../server/studio/review-source.js';

const dir='docs/evidence/studio-phase1-2026-10-23';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(name,value)=>fs.writeFileSync(dir+'/'+name,JSON.stringify(value,null,2)+'\n');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const pre=read(dir+'/PREFLIGHT.json'),supplement=read(dir+'/BEFORE_SUPPLEMENT.json');
const before={...pre.before,...supplement.files};
const health=fs.readFileSync(dir+'/context-health.txt','utf8');
if(!health.includes('Errors: 0, Warnings: 0'))throw Error('Context health not closed');
const current=git('ls-files','-m','-o','--exclude-standard').split('\n').filter(p=>p&&!p.startsWith(dir+'/'));
const changed=[],unchanged=[],added=current.filter(p=>!Object.hasOwn(before,p));
const save=(folder,name,bytes)=>{const target=path.join(dir,folder,name+'.raw');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);return folder+'/'+name+'.raw';};
for(const [name,b]of Object.entries(before)){
 if(!fs.existsSync(name))throw Error('Previously present source missing');
 const original=path.join(dir,'before',name+'.raw');if(sha(fs.readFileSync(original))!==b.sha256)throw Error('Before snapshot drift');
 const raw=fs.readFileSync(name),after={sha256:sha(raw),bytes:raw.length};
 if(after.sha256===b.sha256){unchanged.push(name);continue;}
 const diff=spawnSync('git',['diff','--no-index','--no-ext-diff','--',original,name],{encoding:'utf8',windowsHide:true});
 if(![0,1].includes(diff.status))throw Error('Diff collection failed');
 const diffPath=path.join(dir,'diffs',name+'.patch.txt');fs.mkdirSync(path.dirname(diffPath),{recursive:true});fs.writeFileSync(diffPath,diff.stdout);
 changed.push({path:name,before:b,after,before_copy:'before/'+name+'.raw',after_copy:save('after',name,raw),diff:path.relative(dir,diffPath).replaceAll('\\','/')});
}
const newFiles=added.map(name=>{const raw=fs.readFileSync(name);return {path:name,sha256:sha(raw),bytes:raw.length,after_copy:save('after',name,raw)};});
write('DIFFS.json',{head:pre.head,scope:'Current task delta from V0; unrelated accumulated work preserved',changed,added:newFiles,unchanged_count:unchanged.length,unchanged,deleted:[]});
const run='sentinel-2026-10-23T00-19-24-374Z',sentinel=read(dir+'/'+run+'/SENTINEL.json'),browser=read(dir+'/'+run+'/BROWSER.json');
if(sentinel.status!=='PASS'||sentinel.mutation_events.length||sentinel.report.writeAttempts.length)throw Error('Final Sentinel not closed');
const engineFiles=verifySource(),review=createReviewSource();
const httpText=fs.readFileSync(dir+'/http-contracts.txt','utf8'),http=JSON.parse(httpText.slice(httpText.indexOf('{')));
const tests=fs.readFileSync(dir+'/npm-test-final.txt','utf8');if(!tests.includes('pass 57')||!tests.includes('fail 0')||!http.result.passed)throw Error('Verification incomplete');
const reference='governance_packages/references/Agent_Governance_Harness_Reference_1.2.0';
if(git('status','--porcelain=v1','--',reference))throw Error('Reference working tree changed');
const preserved=['src/App.jsx','server/security.js','docs/contracts/aghr-rc3/CONTRACTS.lock.json',reference+'/registry/RULES.json'].map(name=>{
 const baseline=execFileSync('git',['show',pre.head+':'+name]),raw=fs.readFileSync(name);
 const rawEqual=sha(baseline)===sha(raw);
 const legacyText=['src/App.jsx','server/security.js'].includes(name);
 const onlyCheckoutCRLF=legacyText&&baseline.equals(Buffer.from(raw.toString('utf8').replaceAll('\r\n','\n'),'utf8'));
 const cleanBlob=git('hash-object','--path='+name,name)===git('rev-parse',pre.head+':'+name);
 if(!cleanBlob||!rawEqual&&!onlyCheckoutCRLF)throw Error('Preserved source changed');
 return {path:name,sha256:sha(raw),unchanged_content:true,raw_equal_to_git_blob:rawEqual,comparison:rawEqual?'RAW_BYTES':'Clean V0/current Git blob; exact difference is existing CRLF checkout normalization. Raw V0 for this clean legacy file was not captured.'};
});
write('VERIFICATION.json',{
 at:new Date().toISOString(),status:'IMPLEMENTED_AND_TESTED_FOR_READ_ONLY_PROFILE',T06:'ACCEPTED_BY_OWNER_MOCK_ONLY',branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),working_tree:'LOCAL_UNCOMMITTED; pre-existing work preserved',
 engine:{source_hash:sourceHash,unchanged_files:Object.keys(engineFiles).length},
 tests:{passed:57,failed:0,log:'npm-test-final.txt',timing:'Before final CSS/dir presentation correction; corrected exact UI reverified in final Edge run'},
 http:{passed:http.result.results.length,all_passed:true,log:'http-contracts.txt'},build:{status:'PASS',log:'build-final.txt',warning:'Existing main chunk >500kB'},
 browser:{status:'PASS',version:browser.browser,receipt:run+'/BROWSER.json',playwright:'NOT_INSTALLED / NOT_USED',devtools_mcp:'UNAVAILABLE / ISOLATED_EDGE_CDP_USED'},
 zero_write:{protected_files:Object.keys(sentinel.protected_before).length,mutations:0,application_attempts:0,storage_writes:0,scope:sentinel.scope,receipt:run+'/SENTINEL.json'},
 context:{errors:0,warnings:0,log:'context-health.txt'},preserved,reference_status:'CLEAN_UNCHANGED',previous_custody:pre.previous_custody,
 T11a:{status:'NOT_RUN',presentation_units:50,categories:15,skills:5,metrics:'ALL_NULL',original_register:'UNCHANGED / ALL_1608_PENDING_REVIEW'},E4:'7 REQUIRED / NOT_RUN / NOT_WAIVED',
 limitations:['No registered target project/adopted selections','No native discovery or qualification','No CRUD, persistent storage, generation, reference promotion or E3','Independent review and release acceptance not granted'],
 attempts:[
  {status:'TEST_DEFECT',reason:'Unquoted dotted CSS attribute selector',evidence:'sentinel-2026-10-22T23-57-48-589Z/SENTINEL.json'},
  {status:'TEST_DEFECT',reason:'Keyboard dispatched before registry became visible',evidence:'sentinel-2026-10-22T23-58-37-774Z/SENTINEL.json'},
  {status:'TEST_DEFECT',reason:'Whitespace assumption in compact JSON; replaced by parsing',raw_log:'NOT_CAPTURED; observed tool output'},
  {status:'PRODUCT_DEFECT_FIXED',reason:'Bridge rejected protocol ERROR/2 null data; now preserved as HTTP422',evidence:'t09-focused.txt'},
  {status:'EVIDENCE_FORMAT_FIXED',reason:'Relocated snapshots are raw artifacts; linter unchanged. Duplicate handoff text condensed to preserve context budget.',evidence:'context-health-before-finalization.txt'},
  {status:'EXPECTED_CHECKOUT_STATE',reason:'Clean legacy App/security working files use CRLF while HEAD blobs use LF; verified exact EOL-only difference and clean Git blobs. Locked contracts/reference still require raw equality.'},
 ],
});
// Traverse only this owned evidence folder, never a governance package tree.
function ownedFiles(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>{const p=path.join(folder,e.name);if(e.isSymbolicLink())throw Error('Evidence reparse point');return e.isDirectory()?ownedFiles(p):[p.replaceAll('\\','/')];});}
const sources=new Set([...Object.keys(before),...current,...Object.keys(engineFiles).map(p=>'governance_packages/candidates/AGHR_rc3_Core_Candidate/'+p),...review.items.map(i=>i.source.path),...review.profiles.map(i=>i.source.path),...review.hosts.map(i=>i.source.path),...review.skills.map(i=>i.instructions.path),...preserved.map(p=>p.path),...ownedFiles(dir)]);
sources.delete(dir+'/CUSTODY.lock.json');
const files=Object.fromEntries([...sources].sort().map(name=>{const raw=fs.readFileSync(name);return [name,{sha256:sha(raw),bytes:raw.length}];}));
write('CUSTODY.lock.json',{algorithm:'SHA-256 raw bytes; excludes lock itself; no owner/publisher signature implied',at:new Date().toISOString(),scope:'Phase 1 exact sources, raw before/after, diffs and evidence; legacy work preserved',files});
for(const [name,v]of Object.entries(files))if(sha(fs.readFileSync(name))!==v.sha256)throw Error('Post-seal drift');
console.log(JSON.stringify({status:'SEALED',files:Object.keys(files).length,changed:changed.length,added:added.length,unchanged:unchanged.length,protected:Object.keys(sentinel.protected_before).length}));
