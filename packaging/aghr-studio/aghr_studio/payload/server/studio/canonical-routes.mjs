import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {StudioError} from './auth.js';
import {consumeAuthorization} from './write-authorization.js';
import {sourceHash as e4Hash} from './aghr/e4-bridge.js';
import {repository} from './aghr/cli-bridge.js';
const hash=value=>'sha256:'+crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const artifact=(locator,bytes)=>({path:locator,content_hash:hash(bytes),bytes:Buffer.byteLength(bytes)});
const fail=(status,code,message)=>new StudioError(status,code,message);
async function json(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(400,'INVALID_REQUEST','JSON required.');const chunks=[];let size=0;for await(const b of req){size+=b.length;if(size>65536)throw fail(413,'PAYLOAD_TOO_LARGE','Request exceeds64KiB.');chunks.push(b);}try{return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{throw fail(400,'INVALID_REQUEST','Valid UTF8 JSON required.');}}
export function canonicalMetrics(m,workspace){
 const proof=artifact(`/api/v1/workspaces/${workspace.id}/phase5/metrics/current#raw`,JSON.stringify(m.raw));
 const metric=v=>{
  const observed=v&&Number.isFinite(v.value),unit=v?.unit||'percent';
  if(!observed)return {status:'NOT_RUN',value:null,unit,numerator:null,denominator:null,evidence:[],reason:v?.reason||'No measured observation in this scope.'};
  return {status:'MEASURED',value:v.value,unit,numerator:unit==='percent'?v.numerator:v.numerator??null,denominator:v.denominator>0?v.denominator:null,evidence:[proof]};
 };
 const names=Object.keys(m.metrics);return {workspace_id:workspace.id,captured_at:m.captured_at,candidate_hash:m.candidate_hash,package_version:workspace.package_version,period_start:m.period.from,period_end:m.period.to,instruction_metrics:Object.fromEntries(names.slice(0,5).map(k=>[k,metric(m.metrics[k])])),skill_metrics:Object.fromEntries(names.slice(5).map(k=>[k,metric(m.metrics[k])])),honesty:metric(m.honesty),behavioral:metric(m.behavioral),discovery_reporting_accuracy:metric(m.discovery_accuracy)};
}
export function canonicalSettings(studio){
 const current=studio.phase5.settings(),p=current.settings,pin='server/studio/aghr/e4/SOURCE.lock.json',distribution=artifact(pin,fs.readFileSync(path.join(repository,pin))),control='docs/evidence/studio-draft-auth-cp-2026-10-23/resources-checkpoint.txt';
 const init=studio.store.auditEvents(1000).find(e=>e.event_type==='storage.initialize');if(!init)throw Error('STORAGE_AUTHORIZATION_EVIDENCE_MISSING');
 return {contract_revision:'contract.1',listen:{host:'127.0.0.1'},authentication:{credential:'ephemeral_per_startup',header:'X-Studio-Token',principal_bindings:Object.entries(p.roles).map(([principal,role])=>({principal,roles:[role]}))},storage:{mode:'persistent',database:studio.store.file,filesystem_writes:true,authorization_ref:artifact('sqlite:audit_events/'+init.id,JSON.stringify(init))},sources:{package:'read_only',canonical_state:'read_only',runtime_evidence:'read_only'},engine:{implementation:'pinned_python_aghr',status:'PINNED',executable:studio.python,identity:{version:'rc3+e4-local.1',content_hash:'sha256:'+e4Hash,schema_version:'1.2',distribution},shell:false,reason:'Pinned local engine; native host qualification is separate.'},limits:p.limits,resource_controls:{require_qualified_process_tree_adapter:true,unavailable_adapter_action:'block',overflow_status:'resource_limit_exceeded'},authorization:{simulated_role_grants_permissions:false,approvals_invalidated_on_proposal_change:true},git:p.git,hosts:p.hosts.filter(h=>h.binary_path),security:p.security,intake:{watcher_enabled:studio.watcher.status?.().running||false,allowed_extensions:['.md','.yaml','.json'],result:'draft_change_package_only'}};
}
const projectView=row=>({id:row.id,workspace_id:row.workspace_id,name:row.name,path:row.path,host:row.host,host_version:row.host_version,instruction_level:row.instruction_level,skill_level:row.skill_level,...(row.git_commit_sha?{git_commit_sha:row.git_commit_sha}:{}),last_scanned_at:row.last_scanned_at});
const workspaceView=row=>({id:row.id,name:row.name,package_path:row.package_path,package_version:row.package_version,schema_version:row.schema_version,read_only:true,package_signature_verified:!!row.package_signature_verified,created_at:row.created_at,last_scanned_at:row.last_scanned_at});
export function createCanonicalRoutes({studio,pilots,fallback}){
 const base='/api/v1/workspaces/'+studio.workspace.id;
 const audit=(req,action,result,status,reason,resourceId=null)=>studio.store.recordAttempt({...studio.authority.auditIdentity(req),action,result,status,reason,resourceId,requestId:crypto.randomUUID()});
 const schema=async(ref,value)=>{const [file,def]=ref.split('#/$defs/'),r=await studio.schema(file,def,[value]);if(!r.valid)throw fail(400,'INVALID_REQUEST',r.issues.map(i=>i.pointer+': '+i.message).join('; '));};
 const target=wsId=>wsId===studio.workspace.id?{workspace:studio.workspace}:pilots.get(wsId)||(()=>{const row=studio.store.registrations().workspaces.find(w=>w.id===wsId),source=pilots.list().find(p=>p.workspace.package_path===row?.package_path);return row&&source?{...source,workspace:workspaceView(row)}:null;})();
 const binding=(request)=>hash({request,registry:studio.store.registrations(),settings:studio.phase5.settings().hash});
 async function prepare(request){
  if(!request||Object.keys(request).some(k=>!['method','path','body'].includes(k))||!['POST','PATCH','DELETE'].includes(request.method)||typeof request.path!=='string'||request.path.includes('?'))throw fail(400,'INVALID_REQUEST','Expected exact method, path and optional body.');
  const p=request.path,parts=p.split('/').filter(Boolean);let operation,value,action,resource;
  if(p==='/workspaces'&&request.method==='POST'){
   await schema('api.read.schema.json#/$defs/WorkspaceCreate',request.body);
   const source=pilots.list().find(v=>path.resolve(request.body.package_path)===v.workspace.package_path);if(!source)throw fail(403,'FORBIDDEN','Only owner-authorized sandbox package paths are registered in this Draft profile.');
   operation='workspace.add';value={...source.workspace,id:'WS-'+crypto.randomUUID(),name:request.body.name};resource=value.id;
  }else if(parts[0]==='workspaces'&&parts.length===2&&request.method==='DELETE'){
   operation='workspace.remove';value={id:parts[1]};resource=parts[1];
  }else if(parts[0]==='workspaces'&&parts[2]==='projects'&&parts.length===3&&request.method==='POST'){
   await schema('api.read.schema.json#/$defs/ProjectCreate',request.body);const source=pilots.list().find(v=>path.resolve(request.body.path)===v.root);if(!source||request.body.host!=='aghr-local-process'||request.body.host_version!==process.version)throw fail(403,'FORBIDDEN','Only the registered local sandbox host tuple is authorized.');
   operation='project.add';value={...source.project,id:'PR-'+crypto.randomUUID(),workspace_id:parts[1],name:request.body.name,host_version:process.version,state:source.state};resource=value.id;
  }else if(parts[0]==='workspaces'&&parts[2]==='projects'&&parts.length===4&&request.method==='DELETE'){
   operation='project.remove';value={id:parts[3],workspace_id:parts[1]};resource=value.id;
  }else if(parts[0]==='workspaces'&&request.method==='POST'&&parts.at(-1)==='scan'&&[3,5].includes(parts.length)){
   if(!target(parts[1]))throw fail(404,'UNKNOWN_ID','Unknown workspace.');operation=parts.length===3?'workspace.scan':'project.scan';resource=parts.length===3?parts[1]:parts[3];value={workspace_id:parts[1],project_id:parts.length===5?parts[3]:null};
   if(value.project_id&&!studio.store.registrations().projects.some(p=>p.id===value.project_id&&p.workspace_id===parts[1])&&pilots.get(parts[1])?.project.id!==value.project_id)throw fail(404,'UNKNOWN_ID','Unknown project.');
  }else if(request.method==='PATCH'&&p.startsWith('/settings/')){
   const section=parts[1],definitions={roles:'RolesPatch',git:'GitPatch',limits:'LimitsPatch',hosts:'HostsPatch',security:'SecurityPatch'};if(!definitions[section])throw fail(404,'UNKNOWN_ID','Unknown settings section.');await schema('settings.schema.json#/$defs/'+definitions[section],request.body);
   const current=studio.phase5.settings().settings;let configured;
   if(section==='roles'){if(request.body.bindings.some(b=>b.roles.length!==1))throw fail(422,'NOT_SUPPORTED','Current server roles require one effective role per principal.');configured=Object.fromEntries(request.body.bindings.map(b=>[b.principal,b.roles[0]]));}
   else configured=section==='hosts'?request.body.hosts:{...current[section],...request.body};
   operation='phase5';value=studio.phase5.validate({operation:'settings.update',section,value:configured});action='settings.update';resource='phase5';
  }else if(request.method==='POST'&&(p==='/settings/test-signing'||p===`/workspaces/${studio.workspace.id}/metrics/snapshot`)){
   operation='phase5';value={operation:p.startsWith('/settings')?'settings.test-signing':'metrics.snapshot'};action=value.operation;resource='phase5';
  }else throw fail(400,'NOT_SUPPORTED','This action uses its existing scoped workflow intent.');
  if(operation!=='phase5')action='registration.'+operation;
  return {request,value,operation,scope:{workspace_id:studio.workspace.id,target_project:'studio-drafts',action,resource_id:resource,proposal_version_hash:operation==='phase5'?studio.phase5.binding(value):binding(request)}};
 }
 return async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),p=url.pathname,extended=req.headers['x-studio-view']==='extended';
  const registration=/^\/api\/v1\/workspaces(?:\/[^/]+(?:\/scan|\/projects(?:\/[^/]+(?:\/scan|\/config)?)?)?)?$/.test(p);
  const special=p==='/api/v1/generation-download-intents'||p===base+'/generate/export'||p==='/api/v1/canonical/intents'||p.startsWith('/api/v1/canonical/intents/')||registration&&!(req.method==='GET'&&p==='/api/v1/workspaces')||!extended&&(p.startsWith('/api/v1/settings')||p.startsWith(base+'/metrics')||p.startsWith('/api/v1/audit/'))||p===base+'/phase5/metrics/current';
  if(!special)return fallback(req,res);
  const send=(status,data,error,meta={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:crypto.randomUUID(),contract_revision:'contract.1',recorded_at:new Date().toISOString(),...(Array.isArray(data)?{total:data.length,limit:500,next_cursor:null}:{}),...meta,...(error?{error:{code:error.code||'INTERNAL_ERROR',message:error instanceof StudioError?error.message:'Canonical API unavailable.',halted:true,issues:[]}}:{})}}));};
  const page=rows=>{const limit=Number(url.searchParams.get('limit')||100),fingerprint=hash({rows,query:[...url.searchParams].filter(([k])=>!['limit','cursor'].includes(k))});if(!Number.isInteger(limit)||limit<1||limit>500)throw fail(400,'INVALID_REQUEST','Invalid limit.');let offset=0;if(url.searchParams.has('cursor')){let c;try{c=JSON.parse(Buffer.from(url.searchParams.get('cursor'),'base64url').toString('utf8'));}catch{throw fail(400,'INVALID_REQUEST','Invalid cursor.');}if(c.hash!==fingerprint||!Number.isSafeInteger(c.offset)||c.offset<0)throw fail(409,'CONFLICT','Cursor belongs to a different snapshot.');offset=c.offset;}return send(200,rows.slice(offset,offset+limit),null,{total:rows.length,limit,next_cursor:offset+limit<rows.length?Buffer.from(JSON.stringify({hash:fingerprint,offset:offset+limit})).toString('base64url'):null});};
  const mutation=req.method!=='GET';let action='canonical.write';
  try{
   if(mutation)audit(req,action,'ATTEMPT',null,'Canonical operation received');
   const principal=studio.authority.authenticate(req);
   const allowedQuery=req.method==='GET'&&p===base+'/metrics/history'?['days','limit','cursor']:req.method==='GET'&&p==='/api/v1/audit/events'?['actor','event_type','date_from','date_to','limit','cursor']:registration&&req.method==='GET'&&p.endsWith('/projects')?['limit','cursor']:[];
   for(const [key,value]of url.searchParams)if(!allowedQuery.includes(key)||url.searchParams.getAll(key).length!==1||!value||value.length>4096)throw fail(400,'INVALID_REQUEST','Unsupported canonical query.');
   if(req.method==='GET'){
    if(p===base+'/phase5/metrics/current')return send(200,studio.phase5.current());
    if(p==='/api/v1/settings')return send(200,canonicalSettings(studio));
    if(p===base+'/metrics/current')return send(200,canonicalMetrics(studio.phase5.current(),studio.workspace));
    if(p===base+'/metrics/history'){const days=Number(url.searchParams.get('days')||90);if(!Number.isInteger(days)||days<1||days>3650)throw fail(400,'INVALID_REQUEST','Invalid history days.');const current=studio.phase5.current();return page(studio.store.phase5Snapshots().filter(m=>m.project===current.project&&m.host===current.host&&m.version===current.version&&m.scope===current.scope&&m.candidate_hash===current.candidate_hash&&Date.parse(m.captured_at)>=Date.now()-days*86400000).map(m=>canonicalMetrics(m,studio.workspace)));}
    if(p==='/api/v1/audit/events'||p.startsWith('/api/v1/audit/events/')){let events=studio.phase5.source().audit.map(({payload_json,ip_address,user_agent,...e})=>({...e,...(ip_address?{ip_address}:{}),...(user_agent?{user_agent}:{})}));if(p==='/api/v1/audit/events'){for(const [key,value]of url.searchParams){if(['limit','cursor'].includes(key))continue;if(key.startsWith('date_')&&!Number.isFinite(Date.parse(value)))throw fail(400,'INVALID_REQUEST','Invalid time.');events=events.filter(e=>key==='date_from'?e.at>=value:key==='date_to'?e.at<=value:e[key]===value);}return page(events);}const row=events.find(e=>String(e.id)===p.split('/').at(-1));if(!row)throw fail(404,'UNKNOWN_ID','Unknown event.');return send(200,row);}
    if(p.startsWith('/api/v1/canonical/intents/')){const i=studio.intents.get(p.split('/').at(-1));if(!i||i.operation!=='canonical'||i.principal!==principal||i.revoked||Date.now()>=i.expires)throw fail(403,'FORBIDDEN','Intent unavailable.');return send(200,{id:p.split('/').at(-1),scope:i.scope,status:i.grant?'GRANTED':'AWAITING_OPERATOR',grant:i.grant});}
    const parts=p.slice('/api/v1/'.length).split('/'),source=target(parts[1]),registered=studio.store.registrations().projects;
    if(parts[2]==='projects'&&parts.length===3){if(!source)throw fail(404,'UNKNOWN_ID','Unknown workspace.');const rows=registered.filter(p=>p.workspace_id===parts[1]).map(projectView),fixed=pilots.get(parts[1])?.project;return page([...(fixed?[fixed]:[]),...rows]);}
    if(parts[2]==='projects'&&parts[4]==='config'){const row=registered.find(r=>r.id===parts[3]&&r.workspace_id===parts[1]);if(!row)return fallback(req,res);return send(200,{project_id:row.id,state:JSON.parse(row.config_state_json),source:null,profile:'SANDBOX_LOCAL_CI_V1',selections:[]});}
    return fallback(req,res);
   }
   if(req.method==='POST'&&p==='/api/v1/generation-download-intents'){
    const input=await json(req);if(!input||Object.keys(input).some(k=>!['cp_id','request'].includes(k)))throw fail(400,'INVALID_REQUEST','Expected CP and download request.');await schema('api.execution.schema.json#/$defs/GenerateExportRequest',input.request);
    const cp=studio.store.draft(input.cp_id);if(!cp?.generation||!['approved','exported'].includes(cp.status))throw fail(422,'VALIDATION_FAILED','An approved generated CP is required.');
    const id=crypto.randomUUID(),scope={workspace_id:studio.workspace.id,target_project:'studio-drafts',action:'cp.export.patch',resource_id:cp.id,proposal_version_hash:cp.generation.content_hash};
    studio.intents.set(id,{principal,operation:'generation-download',prepared:{id:cp.id,title:'Download approved generation'},payload:input.request,previousHash:cp.proposal_version_hash,scope,expires:Date.now()+120000,grant:null});return send(200,{id,scope,status:'AWAITING_OPERATOR'});
   }
   if(req.method==='POST'&&p===base+'/generate/export'){
    const token=req.headers['x-write-grant'],entry=[...studio.intents].find(([,i])=>i.grant===token&&i.principal===principal),i=entry?.[1];
    if(!i||i.operation!=='generation-download'||i.revoked||Date.now()>=i.expires)throw fail(403,'FORBIDDEN','Exact approved generation grant required.');
    const input=await json(req),cp=studio.store.draft(i.scope.resource_id);if(req.headers['if-match']!==JSON.stringify(i.scope.proposal_version_hash)||cp?.proposal_version_hash!==i.previousHash||cp?.generation?.content_hash!==i.scope.proposal_version_hash||!isDeepStrictEqual(input,i.payload))throw fail(412,'STALE_PROPOSAL','Generated content or proposal changed.');
    const proposal={title:cp.title,kind:cp.kind,proposed_yaml:cp.proposed_yaml,...(cp.source?{source:cp.source}:{}),...(cp.target_item_id?{target_item_id:cp.target_item_id}:{})};
    await studio.draftValidator.exportRun(proposal,cp,studio.authority.describe(principal),studio.store.requirements(cp.id));
    if(studio.store.draft(cp.id).proposal_version_hash!==cp.proposal_version_hash)throw fail(412,'STALE_PROPOSAL','Proposal changed during download check.');
    const receipt=studio.authority.authorize(principal,i.scope,token);consumeAuthorization(receipt,i.scope);studio.store.appendAudit(receipt,{event_type:i.scope.action,resource_type:'generation',payload:{result:'SUCCESS',content_hash:i.scope.proposal_version_hash,repository_written:false,download_only:true}});studio.intents.delete(entry[0]);
    return send(200,{content:cp.generation.content,content_hash:cp.generation.content_hash,filename:'AGENTS.md',repository_written:false});
   }
   if(p==='/api/v1/canonical/intents'&&req.method==='POST'){
    const input=await json(req),prepared=await prepare(input);action=prepared.scope.action;
    for(const [id,i]of studio.intents)if(Date.now()>=i.expires)studio.intents.delete(id);if(studio.intents.size>=128)throw fail(429,'RATE_LIMITED','Too many intents.');
    const id=crypto.randomUUID();studio.intents.set(id,{principal,operation:'canonical',prepared:{id:prepared.scope.resource_id,title:action},canonical:prepared,scope:prepared.scope,expires:Date.now()+120000,grant:null});return send(200,{id,scope:prepared.scope,status:'AWAITING_OPERATOR'});
   }
   const token=req.headers['x-write-grant'],entry=[...studio.intents].find(([,i])=>i.grant===token&&i.principal===principal),intent=entry?.[1];
   if(!intent||intent.operation!=='canonical'||intent.revoked||Date.now()>=intent.expires)throw fail(403,'FORBIDDEN','An exact canonical write grant is required.');
   const expected=intent.canonical,body=expected.request.body===undefined?undefined:await json(req),request={method:req.method,path:p.slice('/api/v1'.length),...(body===undefined?{}:{body})};action=intent.scope.action;
   if(expected.request.body===undefined)for await(const chunk of req)if(chunk.length)throw fail(400,'INVALID_REQUEST','This operation has no request body.');
   if(!req.headers['if-match'])throw fail(428,'STALE_PROPOSAL','If-Match required.');
   if(req.headers['if-match']!==JSON.stringify(intent.scope.proposal_version_hash)||!isDeepStrictEqual(request,expected.request)||(expected.operation==='phase5'?studio.phase5.binding(expected.value):binding(request))!==intent.scope.proposal_version_hash)throw fail(412,'STALE_PROPOSAL','Action or source registry changed.');
   const receipt=studio.authority.authorize(principal,intent.scope,token);let result,status=200;
   if(expected.operation==='phase5'){const value=studio.phase5.run(receipt,intent.scope,expected.value);result=expected.value.operation==='metrics.snapshot'?canonicalMetrics(value,studio.workspace):expected.value.operation==='settings.test-signing'?{status:'NOT_RUN',key_id:null,evidence:[],repository_written:false,reason:value.reason}:canonicalSettings(studio);}
   else{
    let value=expected.value;
    if(expected.operation.endsWith('.scan')){const started=performance.now(),source=target(value.workspace_id);if(!source)throw fail(404,'UNKNOWN_ID','Unknown workspace.');let issues=[],counts;
     if(source.workspace.id===studio.workspace.id){const run=await studio.readCatalog.scan(studio.readBridge);issues=run.report.diagnostics.map(d=>({code:d.code,message:d.message,severity:'error'}));counts={items:studio.readCatalog.snapshot().views.length};}else{pilots.recheck();counts={items:source.views.length};}
     value={workspace_id:value.workspace_id,scanned_at:new Date().toISOString(),duration_ms:Math.max(0,Math.round(performance.now()-started)),counts,issues,source_written:false};
    }
    result=studio.store.registrationCommit(receipt,intent.scope,expected.operation,value);if(expected.operation.endsWith('.add'))status=201;
   }
   studio.intents.delete(entry[0]);return send(status,result);
  }catch(error){const status=error instanceof StudioError?error.status:503;if(mutation||status===403){try{audit(req,action,status===403?'DENY':'ERROR',status,error.code||error.message);}catch{return send(503,null,fail(503,'INTERNAL_ERROR','Audit unavailable.'));}}return send(status,null,error);}
 };
}
export {workspaceView,projectView};
