import crypto from 'node:crypto';
import {createStudio} from './runtime.js';
import {createWriteAuthority} from './write-authorization.js';
import {openPersistentStore,storageScope} from './db/persistent.js';
import {createBoundedValidator as createDraftValidator} from './aghr/bounded-validator.js';
import {createDraftRoutes} from './draft-routes.js';
import {engineRoot} from './aghr/cli-bridge.js';

export async function createDraftStudio({python,storageRoot,actor,clock=Date.now}={}){
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
  return {session:{token:owner.token},workspace,authority,store,intents,approveIntent,revokeIntent,attestSource,
   handle:createDraftRoutes({authority,store,intents,validate,validator,workspace,clock,audit,read:read.handle}),
   close(){validator.close();store.close();read.close();}};
 }catch(error){validator?.close();store?.close();read.close();throw error;}
}
