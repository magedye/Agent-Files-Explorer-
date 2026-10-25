// Operator-only project-adoption CP driver. Reuses the real 12-table Draft
// store, one-use authorization receipts, Python JCS and immutable rendering.
// It is not a public endpoint or an independent human/release approval.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createWriteAuthority} from '../write-authorization.js';
import {openPersistentStore,storageScope} from '../db/persistent.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export async function createPilotAdoption({host,id,level,doctor,resumeCpId=null}){
 const folder=host.root+'/.aghr/drafts';fs.mkdirSync(folder,{recursive:true});
 const authority=createWriteAuthority(),owner=authority.createPrincipal({actor:'owner-delegated-sandbox-operator:'+id,role:'governance-owner',installationOwnerVerified:true});
 const config={workspaceId:id,targetProject:id,storageRoot:folder},scope={workspace_id:id,target_project:id};
 const permit=(action,resource_id,proposal_version_hash)=>{const bound={...scope,action,resource_id,proposal_version_hash};return authority.authorize(owner.principal,bound,authority.issueGrant({issuer:owner.principal,principal:owner.principal,scope:bound,expiresAt:Date.now()+60000}));};
 const init=storageScope(config),store=openPersistentStore(config,permit(init.action,init.resource_id,init.proposal_version_hash));
 const workspace={id,name:id,package_path:host.root+'/.aghr/candidate',package_version:'1.0.0-rc.3',schema_version:'1.2'};
 store.registerWorkspace(permit('draft.workspace.initialize',id,'sha256:'+sha(JSON.stringify(workspace))),workspace);
 if(resumeCpId){const cp=store.draft(resumeCpId);if(cp?.status!=='exported'||cp.approvals.length!==1)throw Error('RESUME_EXPORTED_CP_REQUIRED');const artifact=store.artifact(cp.id,cp.proposal_version_hash);return {result:{package:cp,tables:store.tables.length,patch:folder+'/artifacts/'+artifact.name,resumed:true,audit:store.auditEvents(1000)},approved:()=>store.draft(cp.id),close:()=>store.close()};}
 const rendered=await host.probe({operation:'render',level}),renderReceipt=host.records.at(-1);
 if(rendered.stage!=='full'||!rendered.prin_007_present||!rendered.p0_preserved)throw Error('GENERATION_REQUIRED');
 const candidate=host.root+'/.aghr/candidate',files=[];
 for(const name of ['aghr.json','CHANGELOG.md',...fs.readdirSync(candidate+'/policies').sort().map(n=>'policies/'+n)])files.push({path:'.aghr/package/'+name,content:fs.readFileSync(candidate+'/'+name,'utf8')});
 files.push({path:'AGENTS.md',content:rendered.content});
 const item={kind:'GENERATED_FILE',target_project_id:id,files:files.map(f=>({...f,content_hash:'sha256:'+sha(Buffer.from(f.content))}))};
 const payload={title:'Adopt '+level+' on '+id,kind:'GENERATED_FILE',source:{type:'request',ref:'OWNER_T34_T35_20261025'},proposed_yaml:JSON.stringify(item,null,2)};
 const base={base_package_version:'1.0.0-rc.3',base_candidate_hash:'sha256:'+sha(JSON.stringify(item))},cpId='CP-'+crypto.randomUUID();
 const prepare=async p=>{const r=await host.probe({operation:'prepare',payload:p,base});return {...r.payload,proposal_version_hash:r.proposal_version_hash,id:cpId,request_id:crypto.randomUUID(),target_item_id:null};};
 const prepared=await prepare(payload);let cp=store.createDraft(permit('cp.create',cpId,prepared.proposal_version_hash),prepared);
 let rejected=false;try{store.submitDraft({},cpId,cp.proposal_version_hash);}catch(e){if(e.status!==403)throw e;rejected=true;store.recordAttempt({actor:'unauthenticated',role:null,action:'cp.submit',resourceId:cpId,result:'DENY',status:403,reason:'No scoped capability',requestId:crypto.randomUUID()});}if(!rejected)throw Error('AUTH_FALSE_SUCCESS');
 async function check(){
  const actual=JSON.parse(cp.proposed_yaml);
  if(JSON.stringify(actual)!==JSON.stringify(item))throw Error('PROPOSAL_FILES_DRIFT');
  const strict=await host.validate();if(strict.exit_code!==0||doctor.status!=='PASS')throw Error('ADOPTION_NOT_VERIFIED');
  const report={...strict,proposal_version_hash:cp.proposal_version_hash,lint:{result:strict.result},doctor,required_approvals:['governance-owner'],eval_required:id==='pilot-app-l3',skill_required:id==='pilot-app-l3'};
  cp=store.checkDraft(permit('cp.validate',cpId,cp.proposal_version_hash),cpId,cp.proposal_version_hash,report);
  store.previewDraft(permit('cp.generate.preview',cpId,cp.proposal_version_hash),cpId,cp.proposal_version_hash,rendered,renderReceipt);
  cp=store.submitDraft(permit('cp.submit',cpId,cp.proposal_version_hash),cpId,cp.proposal_version_hash);
 }
 async function approve(){
  // All safety/qualification evidence is re-observed before approving this
  // exact artifact. No client boolean can enter the privileged call.
  if((await host.validate()).exit_code!==0||cp.status!=='in_review'||cp.checks.generate.status!=='PASS'||cp.checks.doctor.status!=='PASS')throw Error('APPROVAL_GATES_REQUIRED');
  const approval={id:1,package_id:cpId,role:'governance-owner',approver:authority.describe(owner.principal).authenticated_actor,decision:'approve',approved_version_hash:cp.proposal_version_hash,reason:'Owner-delegated sandbox adoption only; not independent review or release acceptance',at:new Date().toISOString()};
  const proof=await host.probe({operation:'approval',proposal_hash:cp.proposal_version_hash,approval});
  cp=store.approveDraft(permit('cp.approve.governance',cpId,cp.proposal_version_hash),cpId,cp.proposal_version_hash,{role:'governance-owner',decision:'approve',reason:approval.reason},proof,sha(JSON.stringify(cp)),{engine_hash:sha(fs.readFileSync(new URL('./package-probe.py',import.meta.url))),input_hash:host.records.at(-1).request_hash});
 }
 await check();await approve();const originalHash=cp.proposal_version_hash;
 const edited=await prepare({...payload,proposed_yaml:JSON.stringify(item,null,4)});
 cp=store.editDraft(permit('cp.edit_any',cpId,edited.proposal_version_hash),cpId,originalHash,edited);
 if(cp.approvals.length||cp.approval_history.length!==1||cp.checks.validate.status!=='NOT_RUN')throw Error('STALE_APPROVAL_NOT_INVALIDATED');
 let staleRejected=false;try{store.submitDraft(permit('cp.submit',cpId,originalHash),cpId,originalHash);}catch(e){if(e.status!==412)throw e;staleRejected=true;}if(!staleRejected)throw Error('STALE_HASH_FALSE_SUCCESS');
 await check();await approve();
 const patch=files.map(f=>{if(!/^AGENTS\.md$|^\.aghr\/package\/(?:aghr\.json|CHANGELOG\.md|policies\/[\w-]+\.json)$/.test(f.path))throw Error('UNSAFE_EXPORT_PATH');const content=f.content.endsWith('\n')?f.content:f.content+'\n',lines=content.slice(0,-1).split('\n');return `diff --git a/${f.path} b/${f.path}\nnew file mode 100644\n--- /dev/null\n+++ b/${f.path}\n@@ -0,0 +1,${lines.length} @@\n`+lines.map(l=>'+'+l+'\n').join('');}).join('');
 const preview={proposal_version_hash:cp.proposal_version_hash,diff:patch,files:files.map(f=>({path:f.path,content_hash:'sha256:'+sha(f.content),bytes:Buffer.byteLength(f.content)})),source_written:false,state_written:false};
 store.savePreview(permit('cp.preview',cpId,cp.proposal_version_hash),cpId,cp.proposal_version_hash,preview,{engine_hash:sha(patch)});cp=store.draft(cpId);
 // Export remains a patch-only artifact. CI consumes it after approval.
 const exported=store.exportDraft(permit('cp.export.patch',cpId,cp.proposal_version_hash),cpId,cp.proposal_version_hash,preview,sha(JSON.stringify(cp)),{engine_hash:sha(patch)});
 cp=store.draft(cpId);const artifactPath=exported.artifact.path;
 const result={package:cp,tables:store.tables.length,grant_required:true,ungranted_rejected:403,stale_rejected:412,invalidated_hash:originalHash,patch:artifactPath,patch_sha256:sha(fs.readFileSync(artifactPath)),rendered,audit:store.auditEvents(1000),actor_profile:'delegated sandbox automation; no independent human approval claimed',gpg:'UNSIGNED_OWNER_ACCEPTED_WARNING'};
 return {result,approved:()=>store.draft(cpId),close:()=>store.close()};
}
