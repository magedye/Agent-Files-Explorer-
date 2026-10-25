import crypto from 'node:crypto';
import {createSession,StudioError} from './auth.js';

// Capabilities are process-owned objects. JSON, role labels and mock receipts
// cannot reconstruct them. They are not accepted from an HTTP request body.
const receipts=new WeakMap();
const deny=()=>new StudioError(403,'FORBIDDEN','A matching server-issued write grant is required.');
const tupleKeys=['workspace_id','target_project','action','resource_id','proposal_version_hash'];
const markers=/T12_OWNER_APPROVED_MOCK|OWNER_GRANTED_T12|OWNER_T12_OVERRIDE|T06_MOCK_ONLY|AUTHORIZED_BY_PROJECT_OWNER/;
const permissions={
 developer:['cp.create','cp.edit_own','adoption.preview','verify.run.fast'],
 'governance-owner':['cp.create','cp.edit_any','cp.approve.governance','adoption.apply','adoption.rollback','verify.run.*','calibrate.*','meta.change.propose','storage.initialize','draft.workspace.initialize','staging.create','staging.authorize'],
 'security-owner':['cp.approve.security','verify.run.*'],
 'architecture-board':['cp.approve.architecture','exceptions.approve'],
};
function tuple(value){
 if(!value||Object.keys(value).length!==tupleKeys.length||!tupleKeys.every(k=>typeof value[k]==='string'&&value[k].trim()&&value[k].length<=4096&&!/[\x00-\x1f]/.test(value[k])))throw deny();
 if(!/^sha256:[a-f0-9]{64}$/.test(value.proposal_version_hash)||tupleKeys.some(k=>markers.test(value[k])))throw deny();
 return Object.freeze(Object.fromEntries(tupleKeys.map(k=>[k,value[k]])));
}
function matches(a,b){return tupleKeys.every(k=>a[k]===b[k]);}
export function authorizationDetails(receipt){
 const r=receipts.get(receipt);if(!r||!r.consumed)throw deny();return Object.freeze({...r.details});
}
export function consumeAuthorization(receipt,expected){
 const r=receipts.get(receipt);if(!r||r.consumed)throw deny();
 r.revalidate(tuple(expected));r.consumed=true;return Object.freeze({...r.details});
}
export function createWriteAuthority({clock=Date.now,onDecision=()=>{}}={}){
 const principals=new WeakMap(),sessions=new Map(),grants=new Map();
 const known=p=>{const v=principals.get(p);if(!v||clock()>=v.expires)throw deny();return v;};
 const allowed=(role,action)=>permissions[role].some(p=>p===action||p.endsWith('.*')&&action.startsWith(p.slice(0,-1)));
 const liveGrant=(principal,token)=>{
  const actor=known(principal),grant=grants.get(token);
  if(!grant||grant.principal!==principal||grant.revoked||grant.used||clock()>=grant.expiresAt||!allowed(actor.role,grant.bound.action))throw deny();
  return grant;
 };
 return {
  // Trusted operator bootstrap only. No endpoint exposes principal/grant minting.
  createPrincipal(spec){
   if(!spec||Object.keys(spec).some(k=>!['actor','role','installationOwnerVerified','ttlMs'].includes(k)))throw deny();
   const {actor,role,installationOwnerVerified=false,ttlMs=3600000}=spec;
   if(typeof actor!=='string'||!actor.trim()||actor.length>200||markers.test(actor)||!permissions[role]||typeof installationOwnerVerified!=='boolean'||!Number.isFinite(ttlMs)||ttlMs<=0||ttlMs>86400000)throw deny();
   const principal=Object.freeze(Object.create(null)),session=createSession({actor,ttlMs});
   principals.set(principal,{actor,role,installationOwnerVerified,expires:clock()+ttlMs});sessions.set(session.token,{principal,session});
   return Object.freeze({principal,token:session.token});
  },
  authenticate(req){
   const entry=sessions.get(req.headers['x-studio-token']);if(!entry)throw deny();entry.session.authenticate(req);known(entry.principal);return entry.principal;
  },
  describe(principal){const p=known(principal);return Object.freeze({authenticated_actor:p.actor,server_resolved_role:p.role,installation_owner_verified:p.installationOwnerVerified});},
  auditIdentity(req){
   const entry=sessions.get(req.headers['x-studio-token']),p=entry&&principals.get(entry.principal);
   return Object.freeze({actor:p?.actor??'unauthenticated',role:p?.role??null});
  },
  grantScope(principal,token){return liveGrant(principal,token).bound;},
  issueGrant({issuer,principal,scope,expiresAt}){
   const owner=known(issuer),actor=known(principal),bound=tuple(scope);
   if(owner.role!=='governance-owner'||!owner.installationOwnerVerified||!allowed(actor.role,bound.action)||!Number.isFinite(expiresAt)||expiresAt<=clock()||expiresAt>clock()+900000)throw deny();
   if(bound.action==='storage.initialize'&&!actor.installationOwnerVerified)throw deny();
   const token=crypto.randomBytes(32).toString('hex');grants.set(token,{principal,bound,expiresAt,revoked:false,used:false});return token;
  },
  revoke({issuer,token}){
   const owner=known(issuer);if(owner.role!=='governance-owner'||!owner.installationOwnerVerified)throw deny();const g=grants.get(token);if(g)g.revoked=true;
  },
  authorize(principal,expected,token){
   let actor,bound;
   try{
    actor=known(principal);bound=tuple(expected);const grant=grants.get(token);
    const revalidate=current=>{liveGrant(principal,token);if(!matches(grant.bound,current))throw deny();};
    revalidate(bound);
    const receipt=Object.freeze(Object.create(null));const details={authenticated_actor:actor.actor,server_resolved_role:actor.role,...bound,installation_owner_verified:actor.installationOwnerVerified};
    receipts.set(receipt,{consumed:false,details,revalidate:current=>{
     try{revalidate(current);}catch(error){onDecision({...details,result:'DENY',at:new Date(clock()).toISOString()});throw error;}
     grant.used=true;onDecision({...details,result:'ALLOW',at:new Date(clock()).toISOString()});
    }});
    return receipt;
   }catch(error){onDecision({authenticated_actor:actor?.actor??'unauthenticated',server_resolved_role:actor?.role??null,result:'DENY',at:new Date(clock()).toISOString()});throw error;}
  },
 };
}
