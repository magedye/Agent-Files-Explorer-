import crypto from 'node:crypto';
import {StudioError} from '../auth.js';
export function historyView(record,store){
 const cp=structuredClone(record.historicalCp);
 if(cp.preview)cp.preview.files=cp.preview.files.map(f=>{if(f.action)return f;const section=cp.preview.diff.split(`diff --git a/${f.path} b/${f.path}\n`)[1]?.split('\ndiff --git ')[0];if(!section?.startsWith('new file mode 100644\n'))throw Error('HISTORICAL_DIFF_ACTION_UNVERIFIED');return {path:f.path,action:'add',size:f.bytes};});
 if(store.closedPublishedPackages().some(c=>c.id===cp.id&&c.proposal_version_hash===cp.proposal_version_hash&&c.receipt_hash===record.receipt_hash))cp.status='closed';
 return cp;
}
export function createClosureRoutes({studio,pilots,fallback}){
 return async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),p=url.pathname,close=p.match(/^\/api\/v1\/workspaces\/([^/]+)\/cps\/(CP-[\w-]+)\/close$/);
  if(p!=='/api/v1/cp-close-intents'&&!close)return fallback(req,res);
  const requestId=crypto.randomUUID(),action='cp.close';
  const audit=(result,status,reason)=>studio.store.recordAttempt({...studio.authority.auditIdentity(req),action,result,status,reason,requestId});
  const send=(status,data,error)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:requestId,contract_revision:'contract.1',recorded_at:new Date().toISOString(),...(error?{error:{code:error.code||'INTERNAL_ERROR',message:error instanceof StudioError?error.message:'Closure unavailable.',halted:true,issues:[]}}:{})}}));};
  try{
   audit('ATTEMPT',null,'Closure request');const principal=studio.authority.authenticate(req);if(req.method!=='POST'||url.search)throw new StudioError(400,'INVALID_REQUEST','POST without query required.');
   if(!close){
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new StudioError(400,'INVALID_REQUEST','JSON required.');const chunks=[];let size=0;for await(const b of req){size+=b.length;if(size>4096)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Closure request too large.');chunks.push(b);}let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new StudioError(400,'INVALID_REQUEST','Invalid JSON.');}
    if(!input||Object.keys(input).sort().join(',')!=='cp_id,workspace_id')throw new StudioError(400,'INVALID_REQUEST','Only workspace_id/cp_id accepted.');const record=pilots.get(input.workspace_id);
    if(!record||record.historicalCp.id!==input.cp_id)throw new StudioError(409,'VALIDATION_FAILED','No authenticated post-merge CI receipt for this CP.');pilots.recheck();
    if(historyView(record,studio.store).status==='closed')throw new StudioError(409,'CONFLICT','CP already closed.');
    const id=crypto.randomUUID(),scope={workspace_id:studio.workspace.id,target_project:'studio-drafts',action,resource_id:input.cp_id,proposal_version_hash:record.payload.proposal_version_hash};
    studio.intents.set(id,{principal,operation:'cp.close',payload:input,scope,prepared:{id:input.cp_id,title:'Close signed local CI merged CP'},expires:Date.now()+120000,grant:null});return send(200,{id,scope,status:'AWAITING_OPERATOR'});
   }
   const entry=[...studio.intents].find(([,i])=>i.grant===req.headers['x-write-grant']&&i.principal===principal),i=entry?.[1];if(!i||i.operation!=='cp.close'||i.revoked||Date.now()>=i.expires||i.payload.workspace_id!==close[1]||i.payload.cp_id!==close[2])throw new StudioError(403,'FORBIDDEN','Exact post-merge closure grant required.');
   if(req.headers['if-match']!==JSON.stringify(i.scope.proposal_version_hash))throw new StudioError(412,'STALE_PROPOSAL','CI proposal hash changed.');for await(const b of req)if(b.length)throw new StudioError(400,'INVALID_REQUEST','No body allowed.');
   pilots.recheck();const record=pilots.get(close[1]);if(record.payload.proposal_version_hash!==i.scope.proposal_version_hash||record.state.publication.commitHash!==record.payload.merge_sha)throw new StudioError(409,'VALIDATION_FAILED','Exact CI merge proof required.');
   const receipt=studio.authority.authorize(principal,i.scope,i.grant);studio.store.closePublishedPackage(receipt,i.scope,{id:record.historicalCp.id,project:record.project.id,proposal_version_hash:record.payload.proposal_version_hash,merge_sha:record.payload.merge_sha,receipt_path:record.receipt_path,receipt_hash:record.receipt_hash,profile:'VERIFIED_HISTORICAL_SANDBOX_CI_NOT_HOSTED_CI'});studio.intents.delete(entry[0]);return send(200,historyView(record,studio.store));
  }catch(error){const status=error instanceof StudioError?error.status:503;try{audit(status===403?'DENY':'ERROR',status,error.code||error.message);}catch{return send(503,null,new StudioError(503,'INTERNAL_ERROR','Audit unavailable.'));}return send(status,null,error);}
 };
}
