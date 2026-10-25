import crypto from 'node:crypto';
import {createStudio} from './runtime.js';
import {createWriteAuthority} from './write-authorization.js';
import {openPersistentStore,storageScope} from './db/persistent.js';
import {createBoundedValidator as createDraftValidator} from './aghr/bounded-validator.js';
import {createDraftRoutes} from './draft-routes.js';
import {engineRoot} from './aghr/cli-bridge.js';
import {createSchemaReader} from './schema-reader.js';
import {createVerificationService} from './verification-service.js';
import {createEvidenceReader} from './evidence-reader.js';
import {createExecutionRoutes} from './execution-routes.js';
import {createSkillLifecycle} from './skills/lifecycle-service.js';
import {createSkillRoutes} from './skills/routes.js';
import {createSubmissionService} from './ci/submission-service.mjs';
import {createPhase4Service} from './phase4/service.mjs';
import {createPhase4Routes} from './phase4/routes.mjs';
import {createIntakeWatcher} from './phase4/watcher.mjs';
import {createPhase5Service} from './phase5/service.mjs';
import {createPhase5Routes} from './phase5/routes.mjs';

export async function createDraftStudio({python,storageRoot,actor,clock=Date.now,evidenceProjectRoot=null,e4Config,phase4Options={},project=null}={}){
 if(typeof actor!=='string'||!actor.trim())throw Error('TRUSTED_OPERATOR_REQUIRED');
 const read=await createStudio({python,actor,bounded:true});let store,validator;
 try{
  const authority=createWriteAuthority({clock});
  const owner=authority.createPrincipal({actor,role:'governance-owner',installationOwnerVerified:true});
  const snapshot=read.catalog.snapshot(),workspace=snapshot.workspace;
  const config={workspaceId:workspace.id,targetProject:'studio-drafts',storageRoot};
  const permit=scope=>authority.authorize(owner.principal,scope,authority.issueGrant({issuer:owner.principal,principal:owner.principal,scope,expiresAt:clock()+60000}));
  store=openPersistentStore(config,permit(storageScope(config)));
  const ws={id:workspace.id,name:workspace.name,package_path:engineRoot,package_version:workspace.package_version,schema_version:'1.2'};
  const workspaceScope={workspace_id:workspace.id,target_project:'studio-drafts',action:'draft.workspace.initialize',resource_id:workspace.id,proposal_version_hash:'sha256:'+crypto.createHash('sha256').update(JSON.stringify(ws)).digest('hex')};
  store.registerWorkspace(permit(workspaceScope),ws);
  if(!/^[a-f0-9]{64}$/.test(snapshot.readSetHash))throw Error('CANDIDATE_READ_SET_HASH_INVALID');
  validator=await createDraftValidator({python,base:{base_package_version:workspace.package_version,base_candidate_hash:'sha256:'+snapshot.readSetHash}});
  const validate=validator.prepare;
  const intents=new Map(),audit=(req,event)=>store.recordAttempt({...authority.auditIdentity(req),...event});
  const approveIntent=id=>{
   const intent=intents.get(id);if(!intent||clock()>=intent.expires||intent.grant||intent.revoked)throw Error('INTENT_UNAVAILABLE');
   intent.grant=authority.issueGrant({issuer:owner.principal,principal:intent.principal,scope:intent.scope,expiresAt:intent.expires});
   try{store.recordAttempt({actor,role:'governance-owner',action:'authorization.grant',resourceId:intent.prepared.id,result:'GRANT_ISSUED',status:200,reason:'Trusted local operator approved exact draft intent',requestId:id});}
   catch(error){authority.revoke({issuer:owner.principal,token:intent.grant});intent.grant=null;throw error;}
   return {id,scope:intent.scope,expires_at:new Date(intent.expires).toISOString()};
  };
  const attestSource=async id=>{
   const intent=intents.get(id);if(!intent||intent.operation!=='validate'||clock()>=intent.expires)throw Error('ATTESTATION_INTENT_UNAVAILABLE');
   const cp=store.draft(intent.scope.resource_id);if(!cp||cp.proposal_version_hash!==intent.previousHash)throw Error('STALE_PROPOSAL');
   const payload={title:cp.title,kind:cp.kind,proposed_yaml:cp.proposed_yaml,...(cp.source?{source:cp.source}:{}),...(cp.target_item_id?{target_item_id:cp.target_item_id}:{})};
   const result=await validator.attestRun(payload,actor);store.attestSource(cp.id,cp.proposal_version_hash,actor,result.data);return {id,proposal_version_hash:cp.proposal_version_hash,level:result.data.level};
  };
  const revokeIntent=id=>{const intent=intents.get(id);if(!intent)throw Error('INTENT_UNAVAILABLE');if(intent.grant)authority.revoke({issuer:owner.principal,token:intent.grant});intent.revoked=true;store.recordAttempt({actor,role:'governance-owner',action:'authorization.revoke',resourceId:intent.prepared.id,result:'DENY',status:403,reason:'Trusted operator revoked draft intent',requestId:id});};
  const schema=createSchemaReader({python}),evidence=createEvidenceReader({projectRoot:evidenceProjectRoot,schema});
  const verification=createVerificationService({python,workspace,store,validator,schema,e4Config});
  const skills=createSkillLifecycle({python,workspace,store,config:e4Config});
  const submission=createSubmissionService({python,evidence,store});
  const phase4=createPhase4Service({python,store,base:{base_package_version:workspace.package_version,base_candidate_hash:'sha256:'+snapshot.readSetHash},catalog:snapshot,evidence,e4Config,options:phase4Options});
  const guardedValidator={...validator,prepare:async(...args)=>{const prepared=await validator.prepare(...args);await phase4.guard(prepared);return prepared;}};
  const fallback=createDraftRoutes({authority,store,intents,validate:guardedValidator.prepare,validator:guardedValidator,workspace,clock,audit,read:read.handle});
  const watcher=createIntakeWatcher({root:phase4Options.intakeRoot,service:phase4,store,authorize:binding=>{const scope={workspace_id:workspace.id,target_project:'studio-drafts',action:'meta.change.propose',resource_id:'CP-'+crypto.randomUUID(),proposal_version_hash:binding};return {scope,receipt:permit(scope)};},audit:event=>store.recordAttempt({actor,role:'governance-owner',action:'meta.change.propose',result:'ERROR',status:422,reason:JSON.stringify(event),requestId:crypto.randomUUID()})});
  const execution=createExecutionRoutes({workspace,authority,store,intents,verification,evidence,clock,audit,fallback});
  const previous=createSkillRoutes({service:skills,submission,workspace,authority,intents,clock,audit,fallback:execution});
  const phase5=createPhase5Service({store,catalog:snapshot,authority,ownerActor:actor,project,phase4,skills,clock});
  const governed=createPhase4Routes({service:phase4,watcher,workspace,authority,intents,clock,audit,fallback:previous});
  return {session:{token:owner.token},workspace,authority,store,intents,approveIntent,revokeIntent,attestSource,verification,skills,phase4,phase5,watcher,readCatalog:read.catalog,readBridge:read.bridge,readReview:read.review,schema,draftValidator:guardedValidator,submission,
   handle:createPhase5Routes({service:phase5,workspace,authority,intents,clock,audit,fallback:governed}),
   close(){const pending=[watcher.close(),phase4.close(),skills.close(),submission.close(),verification.close()],finish=()=>{validator.close();store.close();read.close();};if(pending.some(Boolean))return Promise.all(pending).then(finish);finish();}};
 }catch(error){validator?.close();store?.close();read.close();throw error;}
}
