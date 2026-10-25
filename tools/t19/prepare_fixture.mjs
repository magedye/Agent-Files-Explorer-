// One-shot custody capture and simulated signatures. Private key never saved.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {repository} from '../../server/studio/aghr/cli-bridge.js';
import {createStudio} from '../../server/studio/runtime.js';
import {createBoundedValidator,sourceHash} from '../../server/studio/aghr/bounded-validator.js';
import {sha,profile} from './mock_bridge.mjs';

const out=path.join(repository,'docs/evidence/studio-t19-mock-2026-10-24');
if(fs.existsSync(out))throw Error('EVIDENCE_ALREADY_EXISTS');
const parentPath='docs/evidence/studio-e3-t19-2026-10-24/CUSTODY.lock.json',parentRaw=fs.readFileSync(path.join(repository,parentPath)),parent=JSON.parse(parentRaw);
const mismatches=Object.entries(parent.files).filter(([name,pin])=>sha(fs.readFileSync(path.join(repository,name)))!==pin.sha256);
if(mismatches.length)throw Error('PARENT_CUSTODY_CHANGED:'+mismatches.map(x=>x[0]).join(','));
const beforePaths=['docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/INDEX.md'];
fs.mkdirSync(path.join(out,'before'),{recursive:true});fs.mkdirSync(path.join(out,'fixture'));
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const before={};for(const name of beforePaths){const raw=fs.readFileSync(path.join(repository,name)),copy='before/'+path.basename(name)+'.raw';fs.writeFileSync(path.join(out,copy),raw,{flag:'wx'});before[name]={sha256:sha(raw),bytes:raw.length,copy};}
write('PREFLIGHT.json',{date:'2026-10-24',branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),git_status:execFileSync('git',['status','--short'],{encoding:'utf8'}),parent:{path:parentPath,sha256:sha(parentRaw),verified_files:Object.keys(parent.files).length},before,scope:profile,reference_write_permission:'NOT_GRANTED',e4:'PLAN_ONLY; REQUIRED / NOT_RUN / NOT_WAIVED'});
write('OWNER_DIRECTIVE.json',{profile,source:'Current explicit owner instruction 2026-10-24 in this conversation',authorized:['enterprise SourceGrant simulation','local GitHub gate simulation','P0 eval simulation T19_MOCK_EVAL_EVIDENCE','SEC-001 approved MOCK patch cycle','E4 plan only'],forbidden:['real E4 implementation/execution','reference 1.2.0 mutation','release/merge/adoption'],signature:'SIMULATED_ED25519; NOT AN OWNER CRYPTOGRAPHIC SIGNATURE'});
const python=path.join(repository,'temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const read=await createStudio({python,actor:'T19_MOCK_PREFLIGHT',bounded:true});let native;
try{
 const s=read.catalog.snapshot(),base={base_package_version:s.workspace.package_version,base_candidate_hash:'sha256:'+s.readSetHash};
 native=await createBoundedValidator({python,base});
 const original='governance_packages/candidates/AGHR_T06_SEC001_Candidate/complete/policies/security/secrets.json',raw=fs.readFileSync(path.join(repository,original)),item=JSON.parse(raw);
 fs.writeFileSync(path.join(out,'fixture/SEC-001.original.json'),raw,{flag:'wx'});
 const payload={title:'SEC-001 T19 OWNER APPROVED MOCK',kind:item.kind,source:{type:'request',ref:profile},proposed_yaml:raw.toString('utf8')};
 const prepared=await native.prepare(payload),binding={proposal_version_hash:prepared.proposal_version_hash,payload_sha256:sha(JSON.stringify(payload)),base,native_source_hash:sourceHash,owner_directive_sha256:sha(fs.readFileSync(path.join(out,'OWNER_DIRECTIVE.json')))};
 write('fixture/PROPOSAL.json',payload);
 const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
 fs.writeFileSync(path.join(out,'fixture/mock-public.pem'),publicKey.export({format:'pem',type:'spki'}),{flag:'wx'});
 const values={SourceGrant:{item_path:'policies/drafts/proposal.yaml',source_sha256:sha(payload.proposed_yaml),authority_source:item.authority.source,level:item.authority.level,owner:item.authority.owner,approved_by:item.authority.approvedBy,evidence_ref:profile+':SourceGrant.json',item_ids:['SEC-001']},GitHubGate:{profile,gate:item.enforcement.gate,status:'PRESENT_IN_SIMULATED_HOST',observed_remotely:false},EvalResult:{profile:'T19_MOCK_EVAL_EVIDENCE',status:'PASS',executed:false,runs:0,real_e4_status:'NOT_RUN',honesty_checks:'REQUIRED / NOT_RUN / NOT_WAIVED'}};
 for(const [kind,value]of Object.entries(values)){
  const bytes=Buffer.from(JSON.stringify({profile,kind,binding,value,production_permission:'NOT_GRANTED'}));
  write('fixture/'+kind+'.json',{profile,signature_kind:'MOCK_ED25519_NOT_OWNER_IDENTITY',payload_base64:bytes.toString('base64'),signature_base64:crypto.sign(null,bytes,privateKey).toString('base64')});
 }
 const tools=Object.fromEntries(['tools/t19/mock_bridge.mjs','tools/t19/mock_engine.py','tools/t19/prepare_fixture.mjs','tools/t19/run_cycle.mjs'].map(name=>[name,sha(fs.readFileSync(path.join(repository,name)))]));
 const files=Object.fromEntries(fs.readdirSync(path.join(out,'fixture')).sort().map(name=>[name,sha(fs.readFileSync(path.join(out,'fixture',name)))]));
 write('HOST_FIXTURE_PIN.json',{profile,revision:'t19.mock.1',native_source_hash:sourceHash,source_hash:sha(JSON.stringify(tools)),tools,files,binding,canonical_source:{path:original,sha256:sha(raw)},qualification:'MOCK_ONLY; NOT_RUN for real E4'});
 console.log(JSON.stringify({profile,out,proposal_version_hash:binding.proposal_version_hash,parent_files_verified:Object.keys(parent.files).length}));
}finally{native?.close();read.close();}
