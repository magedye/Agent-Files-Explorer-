import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {createJobRunner} from '../aghr/job-runner.js';
import {repository} from '../aghr/cli-bridge.js';
import {verifyE4} from '../aghr/e4-bridge.js';
import {StudioError} from '../auth.js';
const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
const fail=message=>new StudioError(422,'VALIDATION_FAILED',message);
export const adoptionId=cp=>'AD-'+cp.id.slice(3);
export function adoptionView(cp){let value;try{value=JSON.parse(cp.proposed_yaml);}catch{return null;}if(cp.kind!=='GENERATED_FILE'||!value.adoption)return null;return {id:adoptionId(cp),change_package_id:cp.id,target_project_id:value.target_project_id,level:value.adoption.level,profile:value.adoption.profile,proposal_version_hash:cp.proposal_version_hash,status:cp.status};}
export function createProjectAdoption({studio,pilots,python}){
 const runner=createJobRunner({python}),entry=path.join(repository,'server/studio/projects/adoption-command.py'),pin=hash(fs.readFileSync(entry));
 const payload=cp=>({title:cp.title,kind:cp.kind,proposed_yaml:cp.proposed_yaml,...(cp.source?{source:cp.source}:{}),...(cp.target_item_id?{target_item_id:cp.target_item_id}:{})});
 const get=id=>{const cp=studio.store.drafts().find(c=>adoptionId(c)===id&&adoptionView(c));if(!cp)throw new StudioError(404,'UNKNOWN_ID','Unknown project adoption.');return cp;};

 function verifyCapsule(cp){
  let value;try{value=JSON.parse(cp.proposed_yaml);}catch{throw fail('Project adoption requires the normalized JSON capsule.');}
  const project=pilots.get(value?.target_project_id);
  if(cp.kind!=='GENERATED_FILE'||value.kind!=='GENERATED_FILE'||!project||value.adoption?.level!==project.state.adoptionLevel||value.adoption?.profile!=='SANDBOX_LOCAL_CI_V1')throw fail('Adoption identity, level and profile must match the accepted sandbox.');
  const expected=Object.keys(project.payload.files).filter(p=>p.startsWith('.aghr/package/')||p==='AGENTS.md').sort();
  if(!Array.isArray(value.files)||value.files.length!==expected.length||new Set(value.files.map(f=>f.path)).size!==expected.length||JSON.stringify(value.files.map(f=>f.path).sort())!==JSON.stringify(expected))throw fail('The complete accepted file set is required; no omissions, duplicates or added paths.');
  for(const f of value.files)if(typeof f.content!=='string'||hash(f.content)!==f.content_hash||f.content_hash!=='sha256:'+project.payload.files[f.path])throw fail('Adoption capsule bytes differ from accepted CI source; use a separately authorized change workflow.');
  return {value,project};
 }

 async function prepare(input){
  const checked=await studio.schema('api.change.schema.json','AdoptionCreate',[input]);if(!checked.valid)throw new StudioError(400,'INVALID_REQUEST','Invalid adoption request.');
  const project=pilots.get(input.target_project_id);if(!project||input.level!==project.state.adoptionLevel||input.profile!=='SANDBOX_LOCAL_CI_V1')throw new StudioError(403,'FORBIDDEN','Only the accepted local sandbox level/profile is authorized in this Draft deployment.');
  pilots.recheck();const files=Object.keys(project.payload.files).filter(p=>p.startsWith('.aghr/package/')||p==='AGENTS.md').map(p=>{const content=fs.readFileSync(path.join(project.root,p),'utf8');return {path:p,content,content_hash:hash(content)};});
  const value={kind:'GENERATED_FILE',target_project_id:project.project.id,files,adoption:{level:input.level,profile:input.profile}},proposal={title:'Adopt '+input.level+' on '+input.target_project_id,kind:'GENERATED_FILE',source:{type:'request',ref:'studio-project-adoption:'+input.target_project_id},proposed_yaml:JSON.stringify(value,null,2)};
  const prepared=await studio.draftValidator.prepare(proposal);return {...prepared,id:'CP-'+crypto.randomUUID(),request_id:crypto.randomUUID(),target_item_id:null};
 }
 async function run(cp,operation,extra={}){
  verifyE4();if(hash(fs.readFileSync(entry))!==pin)throw Error('PROJECT_ADOPTION_ADAPTER_DRIFT');
  const {value,project}=verifyCapsule(cp);pilots.recheck();
  const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-project-cp-')),packageRoot=path.join(scratch,'package');fs.mkdirSync(packageRoot);
  const original={},grants=[];
  try{
   for(const f of value.files){
    if(!/^AGENTS\.md$|^\.aghr\/package\/(?:aghr\.json|CHANGELOG\.md|policies\/[\w-]+\.json)$/.test(f.path)||hash(f.content)!==f.content_hash)throw fail('Unsafe path or content hash.');
    const source=project.payload.files[f.path];if(source){original[f.path]=fs.readFileSync(path.join(project.root,f.path),'utf8');}
    // Existing project authority is trusted only for the exact CI-accepted
    // policy bytes. A changed policy needs a separate owner attestation.
    if(f.path.startsWith('.aghr/package/policies/')){
     if(source!==f.content_hash.slice(7))throw fail('Changed policy requires explicit source attestation.');
     const item=JSON.parse(f.content);if(item.authority?.level!=='project')throw fail('Sandbox source cannot self-grant organization/enterprise authority.');
     grants.push({item_path:f.path.slice('.aghr/package/'.length),source_sha256:source,authority_source:item.authority.source,level:'project',owner:item.authority.owner,approved_by:item.authority.approvedBy,evidence_ref:project.receipt_path+'#'+project.receipt_hash,item_ids:[item.id],advanced_kinds:item.kind==='CAPABILITY'?['CAPABILITY']:[]});
    }
    if(f.path.startsWith('.aghr/package/')){const dest=path.join(packageRoot,f.path.slice('.aghr/package/'.length));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,f.content,{flag:'wx',encoding:'utf8'});}
   }
   const request={operation,payload:payload(cp),base:{base_package_version:cp.base_package_version,base_candidate_hash:cp.base_candidate_hash},package_root:packageRoot,project:project.project.id,host_version:process.version,grants,original,...extra};
   const input=path.join(scratch,'input.json'),raw=JSON.stringify(request);fs.writeFileSync(input,raw,{flag:'wx'});
   const job=await runner.run('check',{executable:python,args:['-I','-B','-S','-X','utf8',path.join(repository,'server/studio/aghr/read-only-launcher.py'),entry,input],cwd:repository,maxOutputBytes:2*1024**2});
   verifyE4();pilots.recheck();if(hash(fs.readFileSync(entry))!==pin||!['passed','failed'].includes(job.status)||job.active_processes_after!==0)throw Error('PROJECT_ADOPTION_RESOURCE_OR_SOURCE_FAILURE');
   const report=JSON.parse(job.stdout);if(report.protocol_version!=='3'||report.exit_code!==job.exit_code)throw Error('PROJECT_ADOPTION_PROTOCOL_FAILURE');if(report.exit_code!==0){const error=fail(report.reason);error.receipt=job;throw error;}
   return {data:report.data,receipt:{...job,engine_hash:pin,input_hash:hash(raw),profile:'PROJECT_CP_UNCHANGED_E2_E3_COMPOSITION'}};
  }finally{
   // Exact process-allocated paths only; no recursive deletion or source path.
   const remove=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('SCRATCH_REPARSE_POINT');if(e.isDirectory())remove(p);else fs.unlinkSync(p);}fs.rmdirSync(dir);};
   if(path.dirname(scratch)===os.tmpdir()&&path.basename(scratch).startsWith('aghr-project-cp-'))remove(scratch);
  }
 }
 return {prepare,get,run,verifyCapsule,view:adoptionView,payload};
}
