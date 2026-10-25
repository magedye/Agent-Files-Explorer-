import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {StudioError} from '../auth.js';
async function body(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new StudioError(400,'INVALID_REQUEST','JSON required.');let n=0;const a=[];for await(const b of req){n+=b.length;if(n>262144)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Request exceeds256KiB.');a.push(b);}try{return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(a)));}catch{throw new StudioError(400,'INVALID_REQUEST','Valid UTF-8 JSON required.');}}
export function createPhase4Routes({service,watcher,workspace,authority,intents,clock,audit,fallback}){
 const prefix='/api/v1/workspaces/'+workspace.id+'/phase4';
 return async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');if(!url.pathname.startsWith(prefix))return fallback(req,res);
  const requestId=crypto.randomUUID(),mutation=req.method!=='GET';let resourceId=null;
  const record=(result,status,reason)=>audit(req,{action:'meta.change.propose',resourceId,result,status,reason,requestId});
  const send=(status,data,e)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:requestId,recorded_at:new Date().toISOString(),contract_revision:'phase4-local.1',...(e?{error:{code:e.code||'INTERNAL_ERROR',message:e instanceof StudioError?e.message:'Phase4 halted.',halted:true}}:{})}}));};
  try{
   if(mutation)record('ATTEMPT',null,'Phase4 request');const principal=authority.authenticate(req),actor=authority.describe(principal);if(url.search)throw new StudioError(400,'INVALID_REQUEST','No query allowed.');
   if(req.method==='GET'){
    if(Number(req.headers['content-length'])>0||req.headers['transfer-encoding'])throw new StudioError(400,'INVALID_REQUEST','No GET body.');
    if(url.pathname===prefix)return send(200,{...service.status(),watcher:watcher.status()});
    if(url.pathname===prefix+'/packages')return send(200,service.packages());
    const m=url.pathname.slice(prefix.length).match(/^\/packages\/(CP-[\w-]+)(\/evidence)?$/);if(m)return send(200,m[2]?service.evidence(m[1]):service.get(m[1]));
   }
   if(req.method==='POST'&&url.pathname===prefix+'/intents'){
    const input=await body(req),request=input?.operation==='watch.start'&&Object.keys(input).join(',')==='operation'?input:service.validate(input);
    for(const [key,i]of intents)if(clock()>=i.expires)intents.delete(key);if(intents.size>=128)throw new StudioError(429,'RATE_LIMITED','Too many intents.');
    resourceId=request.cp_id||'CP-'+crypto.randomUUID();const roleAction={'governance-owner':'governance','security-owner':'security','architecture-board':'architecture'}[actor.server_resolved_role];
    const scope={workspace_id:workspace.id,target_project:'studio-drafts',action:request.operation==='review'?'cp.approve.'+roleAction:request.operation==='calibration.eval'?'verify.run.eval':'meta.change.propose',resource_id:resourceId,proposal_version_hash:request.operation==='watch.start'?watcher.binding():service.binding(request)};
    const id=crypto.randomUUID();intents.set(id,{principal,operation:'phase4',payload:request,scope,prepared:{id:resourceId,title:request.operation},expires:clock()+120000,grant:null});return send(200,{id,scope,status:'AWAITING_OPERATOR'});
   }
   if(req.method==='POST'&&url.pathname===prefix+'/run'){
    const token=req.headers['x-write-grant'],entry=[...intents].find(([,i])=>i.grant===token&&i.principal===principal),intent=entry?.[1];
    if(!intent||intent.operation!=='phase4'||intent.revoked||clock()>=intent.expires)throw new StudioError(403,'FORBIDDEN','Scoped Phase4 grant required.');resourceId=intent.scope.resource_id;
    if(!req.headers['if-match'])throw new StudioError(428,'STALE_PROPOSAL','If-Match required.');
    const input=await body(req),binding=intent.payload.operation==='watch.start'?watcher.binding():service.binding(intent.payload);
    if(req.headers['if-match']!==JSON.stringify(intent.scope.proposal_version_hash)||binding!==intent.scope.proposal_version_hash||!isDeepStrictEqual(input,intent.payload))throw new StudioError(412,'STALE_PROPOSAL','Proposal/configuration changed.');
    const receipt=authority.authorize(principal,intent.scope,token);let result;
    if(input.operation==='watch.start'){watcher.start(receipt,intent.scope);result=watcher.status();}else result=await service.run(receipt,intent.scope,input,actor);
    intents.delete(entry[0]);return send(200,result);
   }
   throw new StudioError(mutation?403:404,mutation?'FORBIDDEN':'NOT_FOUND','Unsupported Phase4 endpoint.');
  }catch(e){const status=e instanceof StudioError?e.status:503;try{if(mutation||status===403)record(status===403?'DENY':'ERROR',status,e.code||'PHASE4_FAILED');}catch{return send(503,null,new StudioError(503,'INTERNAL_ERROR','Audit unavailable.'));}return send(status,null,e);}
 };
}
