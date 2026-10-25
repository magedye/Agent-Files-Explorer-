import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {StudioError} from './auth.js';
import {consumeAuthorization} from './write-authorization.js';
const invalid=message=>new StudioError(400,'INVALID_REQUEST',message);
async function json(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw invalid('JSON required.');
 let size=0;const parts=[];for await(const b of req){size+=b.length;if(size>65536)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Request exceeds limit.');parts.push(b);}
 try{return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(parts)));}catch{throw invalid('Valid UTF-8 JSON required.');}
}
export function createExecutionRoutes({workspace,authority,store,intents,verification,evidence,clock,audit,fallback}){
 const prefix='/api/v1/workspaces/'+workspace.id;
 return async(req,res)=>{
  let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{return fallback(req,res);}
  if(!url.pathname.startsWith(prefix+'/verify/')&&!url.pathname.startsWith(prefix+'/evidence/')&&url.pathname!=='/api/v1/verification-intents')return fallback(req,res);
  const requestId=crypto.randomUUID(),mutation=req.method!=='GET';let action='verify.run.unsupported',resourceId=null;
  const record=(result,status,reason)=>audit(req,{action,resourceId,result,status,reason,requestId});
  const send=(status,data,extra={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:requestId,recorded_at:new Date().toISOString(),contract_revision:'contract.1',...extra}}));};
  const page=rows=>{
   const known=['limit','cursor'];for(const [key]of url.searchParams)if(!known.includes(key)||url.searchParams.getAll(key).length!==1)throw invalid('Unsupported query.');
   const limit=Number(url.searchParams.get('limit')||100),cursor=url.searchParams.get('cursor')||'';
   if(!Number.isInteger(limit)||limit<1||limit>500||cursor&&!/^\d+$/.test(cursor))throw invalid('Invalid pagination.');
   const start=Number(cursor||0);if(!Number.isSafeInteger(start)||start>rows.length)throw invalid('Invalid cursor.');return send(200,rows.slice(start,start+limit),{total:rows.length,limit,next_cursor:start+limit<rows.length?String(start+limit):null});
  };
  try{
   if(mutation)record('ATTEMPT',null,'Verification mutation received');
   const principal=authority.authenticate(req);
   if(req.url.length>8192)throw invalid('URL exceeds limit.');
   if(req.method==='GET'&&(Number(req.headers['content-length'])>0||req.headers['transfer-encoding']))throw invalid('No GET body allowed.');
   if(req.method==='POST'&&url.pathname==='/api/v1/verification-intents'){
    if(url.search)throw invalid('No query allowed.');
    const input=await json(req);let request,cancel;
    if(input&&Object.keys(input).length===1&&Object.hasOwn(input,'request'))request=await verification.validate(input.request);
    else if(input&&Object.keys(input).length===1&&typeof input.cancel==='string'){cancel=verification.get(input.cancel);if(cancel.status!=='running')throw new StudioError(409,'CONFLICT','Run is complete.');request={command:cancel.command,args:cancel.args};}
    else throw invalid('Expected request or cancel identifier.');
    for(const [id,i]of intents)if(clock()>=i.expires)intents.delete(id);if(intents.size>=128)throw new StudioError(429,'RATE_LIMITED','Too many pending intents.');
    resourceId=cancel?.id||'VR-'+crypto.randomUUID();action=verification.action(request);
    const scope={workspace_id:workspace.id,target_project:'studio-drafts',action,resource_id:resourceId,proposal_version_hash:verification.bind(request)};
    const id=crypto.randomUUID(),intent={principal,payload:request,operation:cancel?'verification.cancel':'verification.run',prepared:{id:resourceId,title:request.command},scope,expires:clock()+120000,grant:null};
    intents.set(id,intent);record('ATTEMPT',200,'Intent prepared; no operation authorized');return send(200,{id,scope,status:'AWAITING_OPERATOR',expires_at:new Date(intent.expires).toISOString()});
   }
   if(req.method==='POST'){
    if(url.search)throw invalid('No query allowed.');
    const cancel=url.pathname.match(new RegExp('^'+prefix+'/verify/runs/(VR-[\\w-]+)/cancel$'));
    if(!cancel&&url.pathname!==prefix+'/verify/run')throw new StudioError(403,'FORBIDDEN','Unsupported mutation.');
    const token=req.headers['x-write-grant'],entry=[...intents].find(([,i])=>i.grant===token&&i.principal===principal),intent=entry?.[1];
    if(!intent||intent.revoked||clock()>=intent.expires||intent.operation!==(cancel?'verification.cancel':'verification.run'))throw new StudioError(403,'FORBIDDEN','Scoped verification grant required.');
    resourceId=intent.scope.resource_id;action=intent.scope.action;
    if(!req.headers['if-match'])throw new StudioError(428,'STALE_PROPOSAL','If-Match required.');
    if(req.headers['if-match']!==JSON.stringify(intent.scope.proposal_version_hash))throw new StudioError(412,'STALE_PROPOSAL','Request hash is stale.');
    if(cancel){if(cancel[1]!==resourceId)throw new StudioError(403,'FORBIDDEN','Grant is scoped to another run.');for await(const b of req)if(b.length)throw invalid('Cancel has no body.');}
    else{const request=await verification.validate(await json(req));if(!isDeepStrictEqual(request,intent.payload)||verification.bind(request)!==intent.scope.proposal_version_hash)throw new StudioError(412,'STALE_PROPOSAL','Request differs from the grant.');}
    const receipt=authority.authorize(principal,intent.scope,token);
    let result;if(cancel){consumeAuthorization(receipt,intent.scope);result=verification.cancel(resourceId);store.appendAudit(receipt,{event_type:action,resource_type:'verification',payload:{result:'SUCCESS',operation:'cancel',run_id:resourceId}});}else result=verification.start(receipt,intent.payload,resourceId,intent.scope);
    intents.delete(entry[0]);return send(cancel?200:202,result);
   }
   if(req.method!=='GET')throw new StudioError(403,'FORBIDDEN','Unsupported mutation.');
   if(url.pathname===prefix+'/verify/runs')return page(verification.list());
   const run=url.pathname.match(new RegExp('^'+prefix+'/verify/runs/(VR-[\\w-]+)(?:/(sarif|stream))?$'));
   if(run){if(url.search)throw invalid('No query allowed.');if(run[2]==='sarif')throw new StudioError(409,'NOT_SUPPORTED','Selected engine emits JSON diagnostics, not SARIF.');if(run[2]==='stream')throw new StudioError(409,'NOT_SUPPORTED','Use authenticated GET polling; browser WebSocket cannot attach the required header.');return send(200,verification.get(run[1]));}
   if(url.pathname===prefix+'/evidence/tasks')return page(await evidence.list());
   const task=url.pathname.match(new RegExp('^'+prefix+'/evidence/tasks/([^/]+)(?:/(events))?$'));
   if(task){let id;try{id=decodeURIComponent(task[1]);}catch{throw invalid('Invalid task.');}const detail=await evidence.detail(id);if(task[2])return page(detail.events);if(url.search)throw invalid('No query allowed.');const {events,...view}=detail;return send(200,view);}
   throw new StudioError(404,'NOT_FOUND','Unknown execution resource.');
  }catch(error){
   const status=error instanceof StudioError?error.status:503;
   try{if(mutation||status===403)record(status===403?'DENY':'ERROR',status,error instanceof StudioError?error.code:'EXECUTION_UNAVAILABLE');}catch{return send(503,null,{error:{code:'INTERNAL_ERROR',message:'Audit unavailable; operation halted.',halted:true,issues:[]}});}
   return send(status,null,{error:{code:error instanceof StudioError?error.code:'INTERNAL_ERROR',message:error instanceof StudioError?error.message:'Execution service unavailable.',halted:true,issues:[]}});
  }
 };
}
