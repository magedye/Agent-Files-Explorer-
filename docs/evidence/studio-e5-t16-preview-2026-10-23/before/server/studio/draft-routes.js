import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {StudioError} from './auth.js';

const deny=()=>new StudioError(403,'FORBIDDEN','A valid scoped draft grant is required.');
async function readJSON(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new StudioError(415,'INVALID_REQUEST','JSON required.');
 const parts=[];let bytes=0;for await(const b of req){bytes+=b.length;if(bytes>262144)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Request exceeds limit.');parts.push(b);}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts)));}catch{throw new StudioError(400,'INVALID_REQUEST','Valid UTF-8 JSON required.');}
}
export function createDraftRoutes({authority,store,intents,validate,workspace,clock,audit}){
 const base=`/api/v1/workspaces/${workspace.id}/change-packages`;
 return async(req,res)=>{
  const requestId=crypto.randomUUID(),mutation=!['GET','HEAD','OPTIONS'].includes(req.method);
  let action='write.unsupported',resourceId=null,identity;
  const send=(status,data,error)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:requestId,contract_revision:'contract.1',recorded_at:new Date().toISOString(),...(error?{error:{code:error.code,message:error.message,halted:true,issues:[]}}:{})}}));};
  const record=(result,status,reason)=>audit(req,{action,resourceId,result,status,reason,requestId});
  try{
   if(req.url.length>8192)throw new StudioError(400,'INVALID_REQUEST','URL exceeds limit.');
   const url=new URL(req.url,'http://127.0.0.1');
   if(mutation){if(url.pathname===base)action='cp.create';else if(url.pathname==='/api/v1/draft-intents')action='draft.preview';record('ATTEMPT',null,'Request received; authorization not yet established');}
   try{identity=authority.authenticate(req);}catch{throw deny();}
   if(url.search)throw new StudioError(400,'INVALID_REQUEST','Queries are not supported by this draft profile.');
   const principal=authority.describe(identity);
   if(req.method==='GET'&&url.pathname==='/api/v1/session')return send(200,{...principal,action:'read',workspace_id:workspace.id,target_project:'studio-drafts',resource_id:null,proposal_version_hash:null});
   if(req.method==='GET'&&url.pathname==='/api/v1/draft-status')return send(200,{mode:'DRAFT',workspace,storage:'persistent',tables:store.tables.length,source_written:false,publication:'NOT_PERFORMED',owner_grant_channel:'local operator stdin',strict_validation:'NOT_RUN',hash_qualification:'LOCAL_ADAPTER_NOT_E5'});
   if(req.method==='GET'&&url.pathname==='/api/v1/audit-events')return send(200,store.auditEvents().slice(-200));
   if(req.method==='GET'&&url.pathname===base)return send(200,store.drafts());
   if(req.method==='GET'&&url.pathname.startsWith(base+'/')){
    const id=url.pathname.slice(base.length+1);if(!/^CP-[\w-]+$/.test(id))throw new StudioError(404,'UNKNOWN_ID','Unknown draft.');
    const draft=store.draft(id);if(!draft)throw new StudioError(404,'UNKNOWN_ID','Unknown draft.');return send(200,draft);
   }
   // Read-only proposal preparation: no CP/business persistence and no grant
   // minting. Only the trusted operator channel can approve the returned intent.
   if(req.method==='POST'&&url.pathname==='/api/v1/draft-intents'){
    action='draft.preview';
    for(const [id,intent]of intents)if(clock()>=intent.expires)intents.delete(id);
    if(intents.size>=128)throw new StudioError(429,'RATE_LIMITED','Too many pending intents.');
    const payload=await readJSON(req),prepared=await validate(payload),id=crypto.randomUUID();
    const cpId=`CP-${new Date(clock()).getUTCFullYear()}-${crypto.randomUUID()}`;
    const scope={workspace_id:workspace.id,target_project:'studio-drafts',action:'cp.create',resource_id:cpId,proposal_version_hash:prepared.proposal_version_hash};
    intents.set(id,{principal:identity,payload,prepared:Object.freeze({...prepared,id:cpId,request_id:requestId}),scope,expires:clock()+120000,grant:null});
    record('ATTEMPT',200,'Structural preview only; waiting for trusted operator grant');
    return send(200,{id,scope,expires_at:new Date(clock()+120000).toISOString(),status:'AWAITING_OPERATOR',structural_check:'PASS',strict_check:'NOT_RUN'});
   }
   const intentMatch=url.pathname.match(/^\/api\/v1\/draft-intents\/([a-f0-9-]{36})$/);
   if(req.method==='GET'&&intentMatch){
    const intent=intents.get(intentMatch[1]);if(!intent||intent.principal!==identity||intent.revoked||clock()>=intent.expires)throw deny();
    return send(200,{status:intent.grant?'GRANTED':'AWAITING_OPERATOR',grant:intent.grant,scope:intent.scope,expires_at:new Date(intent.expires).toISOString()});
   }
   if(req.method==='POST'&&url.pathname===base){
    action='cp.create';
    const token=req.headers['x-write-grant'];if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw deny();
    const grantScope=authority.grantScope(identity,token);
    if(grantScope.action!=='cp.create'||grantScope.workspace_id!==workspace.id||grantScope.target_project!=='studio-drafts')throw deny();
    const input=await readJSON(req);
    const entry=[...intents].find(([,i])=>i.scope.resource_id===grantScope.resource_id&&i.principal===identity),intent=entry?.[1];
    if(!intent||intent.revoked||clock()>=intent.expires)throw deny();
    resourceId=intent.prepared.id;
    if(!req.headers['if-match'])throw new StudioError(428,'STALE_PROPOSAL','If-Match required.');
    if(req.headers['if-match']!==JSON.stringify(intent.scope.proposal_version_hash))throw new StudioError(412,'STALE_PROPOSAL','Draft hash differs.');
    // Preserve the locked Create request shape. Equality binds the already
    // Python-validated request without duplicating governance validation.
    if(!isDeepStrictEqual(input,intent.payload))throw new StudioError(412,'STALE_PROPOSAL','Submitted content differs from the authorized preparation.');
    const receipt=authority.authorize(identity,intent.scope,token);
    const cp=store.createDraft(receipt,intent.prepared);intents.delete(entry[0]);
    return send(201,cp);
   }
   if(mutation)throw deny();
   throw new StudioError(404,'NOT_FOUND','Unknown draft endpoint.');
  }catch(error){
   const status=error instanceof StudioError?error.status:503;
   const safeReason=error instanceof StudioError?error.code:/^(DRAFT_PARSER_TIMEOUT|DRAFT_OUTPUT_LIMIT|DRAFT_ADAPTER_PROTOCOL|DRAFT_ADAPTER_FALSE_SUCCESS|DRAFT_ADAPTER_DRIFT)$/.test(error.message)?error.message:'INTERNAL_ERROR';
   try{if(mutation||status===403)record(status===403?'DENY':'ERROR',status,safeReason);}catch{return send(503,null,{code:'INTERNAL_ERROR',message:'Audit unavailable; operation halted.'});}
   return send(status,null,{code:error instanceof StudioError?error.code:'INTERNAL_ERROR',message:error instanceof StudioError?error.message:'Draft service unavailable; no source operation permitted.'});
  }
 };
}
