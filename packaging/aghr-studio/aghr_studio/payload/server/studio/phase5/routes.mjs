import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {StudioError} from '../auth.js';
async function body(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new StudioError(400,'INVALID_REQUEST','JSON required.');let size=0;const chunks=[];for await(const b of req){size+=b.length;if(size>32768)throw new StudioError(413,'PAYLOAD_TOO_LARGE','Request exceeds32KiB.');chunks.push(b);}try{return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{throw new StudioError(400,'INVALID_REQUEST','Valid UTF8 JSON required.');}}
export function createPhase5Routes({service,workspace,authority,intents,clock,audit,fallback}){
 const base='/api/v1/workspaces/'+workspace.id,root=base+'/phase5';
 return async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),p=url.pathname;
  if(![root,base+'/metrics',base+'/dashboard','/api/v1/settings','/api/v1/audit/',base+'/reports'].some(x=>p===x||p.startsWith(x+'/')||x.endsWith('/')&&p.startsWith(x)))return fallback(req,res);
  const requestId=crypto.randomUUID(),mutation=req.method!=='GET';let action='phase5.write.request';
  const record=(result,status,reason)=>audit(req,{action,resourceId:'phase5',result,status,reason,requestId});
  const send=(status,data,error)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:requestId,contract_revision:'phase5-local.1',recorded_at:new Date().toISOString(),...(error?{error:{code:error.code||'INTERNAL_ERROR',message:error instanceof StudioError?error.message:'Phase5 unavailable.',halted:true}}:{})}}));};
  try{
   if(mutation)record('ATTEMPT',null,'Phase5 operation');const principal=authority.authenticate(req);
   if(req.method==='GET'){
    if(Number(req.headers['content-length'])>0||req.headers['transfer-encoding'])throw new StudioError(400,'INVALID_REQUEST','No GET body.');
    if(p===base+'/metrics/current'&&!url.search)return send(200,service.current());
    if(p===base+'/metrics/history'){if([...url.searchParams.keys()].some(k=>k!=='days'))throw new StudioError(400,'INVALID_REQUEST','Only days allowed.');return send(200,service.history(Number(url.searchParams.get('days')||90)));}
    if(p===base+'/dashboard'&&!url.search)return send(200,service.dashboard());
    if(p===root+'/items'&&!url.search)return send(200,service.source().items);
    if(p==='/api/v1/settings'&&!url.search)return send(200,service.settings());
    if(p==='/api/v1/audit/events'){
     const allowed=['actor','event_type','resource_type','date_from','date_to'];if([...url.searchParams.keys()].some(k=>!allowed.includes(k)))throw new StudioError(400,'INVALID_REQUEST','Unsupported audit filter.');
     let rows=service.source().audit;for(const [k,v]of url.searchParams)rows=rows.filter(e=>k==='date_from'?e.at>=v:k==='date_to'?e.at<=v:e[k]===v);return send(200,{events:rows,limit:10000});
    }
    if(p.startsWith('/api/v1/audit/events/')&&!url.search){const row=service.source().audit.find(e=>String(e.id)===p.split('/').at(-1));if(!row)throw new StudioError(404,'UNKNOWN_ID','Unknown audit event.');return send(200,row);}
    if(p.startsWith(root+'/intents/')&&!url.search){const i=intents.get(p.split('/').at(-1));if(!i||i.operation!=='phase5'||i.principal!==principal||i.revoked||clock()>=i.expires)throw new StudioError(403,'FORBIDDEN','Intent unavailable.');return send(200,{status:i.grant?'AUTHORIZED':'AWAITING_OPERATOR',grant:i.grant});}
   }
   if(url.search)throw new StudioError(400,'INVALID_REQUEST','No mutation query.');
   if(req.method==='POST'&&p===root+'/intents'){
    const request=service.validate(await body(req));action=request.operation;
    for(const [key,i]of intents)if(clock()>=i.expires)intents.delete(key);if(intents.size>=128)throw new StudioError(429,'RATE_LIMITED','Too many intents.');
    const id=crypto.randomUUID(),scope={workspace_id:workspace.id,target_project:'studio-drafts',action,resource_id:'phase5',proposal_version_hash:service.binding(request)};
    intents.set(id,{principal,operation:'phase5',payload:request,scope,prepared:{id:'phase5',title:action},expires:clock()+120000,grant:null});return send(200,{id,scope,status:'AWAITING_OPERATOR'});
   }
   if(req.method==='POST'&&p===root+'/run'||req.method==='PATCH'&&p.startsWith('/api/v1/settings/')||req.method==='POST'&&[base+'/metrics/snapshot','/api/v1/settings/test-signing',base+'/reports'].includes(p)){
    const token=req.headers['x-write-grant'],entry=[...intents].find(([,i])=>i.grant===token&&i.principal===principal),i=entry?.[1];
    if(!i||i.operation!=='phase5'||i.revoked||clock()>=i.expires)throw new StudioError(403,'FORBIDDEN','Exact one-use Phase5 grant required.');action=i.payload.operation;
    let input=await body(req);
    if(p.startsWith('/api/v1/settings/')&&req.method==='PATCH')input={operation:'settings.update',section:p.split('/').at(-1),value:input};
    if(p===base+'/metrics/snapshot')input={operation:'metrics.snapshot',...input};
    if(p==='/api/v1/settings/test-signing')input={operation:'settings.test-signing',...input};
    if(p===base+'/reports')input={operation:'reports.generate',...input};
    if(!req.headers['if-match'])throw new StudioError(428,'STALE_PROPOSAL','If-Match required.');
    if(req.headers['if-match']!==JSON.stringify(i.scope.proposal_version_hash)||service.binding(i.payload)!==i.scope.proposal_version_hash||!isDeepStrictEqual(i.payload,input))throw new StudioError(412,'STALE_PROPOSAL','Configuration or payload changed.');
    const receipt=authority.authorize(principal,i.scope,token),value=service.run(receipt,i.scope,input);intents.delete(entry[0]);return send(200,value);
   }
   throw new StudioError(mutation?403:404,mutation?'FORBIDDEN':'NOT_FOUND','Unsupported Phase5 endpoint.');
  }catch(error){const status=error instanceof StudioError?error.status:503;try{if(mutation||status===403)record(status===403?'DENY':'ERROR',status,error.code||'PHASE5_FAILED');}catch{return send(503,null,new StudioError(503,'INTERNAL_ERROR','Audit unavailable.'));}return send(status,null,error);}
 };
}
