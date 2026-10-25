import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {StudioError} from '../auth.js';
const denied=()=>new StudioError(403,'FORBIDDEN','A scoped skill-operation grant is required.');
async function body(req){
 if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new StudioError(400,'INVALID_REQUEST','JSON required.');
 let size=0;const parts=[];for await(const b of req){size+=b.length;if(size>65536)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Request exceeds64KiB.');parts.push(b);}
 try{return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(parts)));}catch{throw new StudioError(400,'INVALID_REQUEST','Valid UTF-8 JSON required.');}
}
export function createSkillRoutes({service,submission,workspace,authority,intents,clock,audit,fallback}){
 const prefix='/api/v1/workspaces/'+workspace.id+'/skill-lifecycle';
 return async(req,res)=>{
  let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{return fallback(req,res);}
  if(url.pathname!==prefix&&!url.pathname.startsWith(prefix+'/'))return fallback(req,res);
  const requestId=crypto.randomUUID(),mutation=req.method!=='GET';let resourceId=null;
  const record=(result,status,reason)=>audit(req,{action:'verify.run.skills',resourceId,result,status,reason,requestId});
  const send=(status,data,error)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:requestId,recorded_at:new Date().toISOString(),contract_revision:'contract.1',...(error?{error:{code:error.code||'INTERNAL_ERROR',message:error instanceof StudioError?error.message:'Skill service unavailable.',halted:true,issues:[]}}:{})}}));};
  try{
   if(mutation)record('ATTEMPT',null,'Skill operation requested');const principal=authority.authenticate(req);
   if(url.search||req.url.length>8192)throw new StudioError(400,'INVALID_REQUEST','No query supported.');
   if(req.method==='GET'){
    if(Number(req.headers['content-length'])>0||req.headers['transfer-encoding'])throw new StudioError(400,'INVALID_REQUEST','No GET body.');
    if(url.pathname===prefix)return send(200,service.inventory());
    if(url.pathname===prefix+'/scenarios')return send(200,service.scenarios());
    if(url.pathname===prefix+'/history')return send(200,service.history());
    const m=url.pathname.slice(prefix.length).match(/^\/tasks\/([\w.-]+)$/);if(m)return send(200,service.get(m[1]));
   }
   if(req.method==='POST'&&[prefix+'/intents',prefix+'/ci-intents'].includes(url.pathname)){
    const ci=url.pathname.endsWith('/ci-intents'),input=await body(req);
    if(ci&&(!input||Object.keys(input).join(',')!=='task_id'))throw new StudioError(400,'INVALID_REQUEST','Only task_id accepted.');
    const payload=ci?await submission.prepare(input.task_id):service.options(input);resourceId=payload.task_id;
    for(const [key,i]of intents)if(clock()>=i.expires)intents.delete(key);if(intents.size>=128)throw new StudioError(429,'RATE_LIMITED','Too many pending intents.');
    const id=crypto.randomUUID(),scope={workspace_id:workspace.id,target_project:'studio-drafts',action:'verify.run.skills',resource_id:resourceId,proposal_version_hash:ci?'sha256:'+crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'):service.binding(payload)};
    const intent={principal,operation:ci?'ci.bundle':'skill.lifecycle',payload,scope,prepared:{id:resourceId,title:ci?'CI bundle':payload.operation},expires:clock()+120000,grant:null};intents.set(id,intent);record('ATTEMPT',200,'Prepared only; no execution before grant');return send(200,{id,scope,status:'AWAITING_OPERATOR',expires_at:new Date(intent.expires).toISOString()});
   }
   if(req.method==='POST'&&[prefix+'/run',prefix+'/ci-bundle'].includes(url.pathname)){
    const ci=url.pathname.endsWith('/ci-bundle');
    const token=req.headers['x-write-grant'],entry=[...intents].find(([,i])=>i.grant===token&&i.principal===principal),intent=entry?.[1];
    if(!intent||intent.operation!==(ci?'ci.bundle':'skill.lifecycle')||intent.revoked||clock()>=intent.expires)throw denied();resourceId=intent.scope.resource_id;
    if(!req.headers['if-match'])throw new StudioError(428,'STALE_PROPOSAL','If-Match required.');
    if(req.headers['if-match']!==JSON.stringify(intent.scope.proposal_version_hash))throw new StudioError(412,'STALE_PROPOSAL','Request differs from grant.');
    const input=await body(req),payload=ci?input:service.options(input);
    if(ci){if(!payload||Object.keys(payload).join(',')!=='task_id'||payload.task_id!==resourceId)throw new StudioError(412,'STALE_PROPOSAL','Task differs from grant.');}
    else if(!isDeepStrictEqual(payload,intent.payload)||service.binding(payload)!==intent.scope.proposal_version_hash)throw new StudioError(412,'STALE_PROPOSAL','Task/content changed.');
    const receipt=authority.authorize(principal,intent.scope,token),result=ci?await submission.run(receipt,intent.payload,intent.scope):await service.run(receipt,payload,intent.scope);intents.delete(entry[0]);return send(200,result);
   }
   if(mutation)throw denied();throw new StudioError(404,'NOT_FOUND','Unknown skill route.');
  }catch(error){const status=error instanceof StudioError?error.status:503;try{if(mutation||status===403)record(status===403?'DENY':'ERROR',status,error.code||'SKILL_SERVICE_FAILED');}catch{return send(503,null,new StudioError(503,'INTERNAL_ERROR','Audit unavailable; halted.'));}return send(status,null,error);}
 };
}
