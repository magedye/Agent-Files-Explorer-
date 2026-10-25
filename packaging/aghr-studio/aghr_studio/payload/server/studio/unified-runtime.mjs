import crypto from 'node:crypto';
import path from 'node:path';
import {createDraftStudio} from './draft-runtime.js';
import {createReadRoutes} from './routes.js';
import {createPilotCatalog} from './projects/pilots.mjs';
import {StudioError} from './auth.js';
import {createVerificationStream} from './verification-stream.mjs';
import {createCanonicalRoutes,workspaceView} from './canonical-routes.mjs';
import {createAdoptionRoutes} from './projects/adoption-routes.mjs';
import {createClosureRoutes,historyView} from './projects/history.mjs';
import {currentCapabilities} from './projects/capabilities.mjs';

const fields=['skillId','source','function','permissions','inputs','outputs','instructionsPath','defaultTier','requiredApprovals','conflictsWith','alternatives','minimumStatus','requiredOnHosts','maxAgeDays'];
const capability=v=>({item_id:v.item.id,capability:Object.fromEntries(fields.filter(k=>v.item[k]!==undefined).map(k=>[k,v.item[k]])),qualifications:[],availability:[{state:'UNKNOWN',evidence:[],reason:'Historical sandbox CI does not establish live host availability.'}],source_path:v.source_path,content_hash:v.source_hash,issuer_trust:v.issuer_trust});
export async function createUnifiedStudio(options){
 const pilots=createPilotCatalog(),local=pilots.get('pilot-app-l3');
 const localConfig={skills:[{id:'pilot-sql-readonly',source:'project',skillPath:path.join(local.root,'procedures/sql-readonly/SKILL.md'),entry:path.join(local.root,'procedures/sql-readonly/worker.py'),triggers:['review','مراجعة'],requires:['sandbox.read'],preference:1}],permissions:['sandbox.read'],scope:'pilot-app-l3/**',hostSignals:true};
 const studio=await createDraftStudio({...options,evidenceProjectRoot:options.evidenceProjectRoot||local.root,e4Config:options.e4Config||localConfig});studio.python=options.python;
 const read=createReadRoutes({catalog:studio.readCatalog,bridge:studio.readBridge,review:studio.readReview,session:{authenticate(req){return studio.authority.describe(studio.authority.authenticate(req));}}});
 const parent=studio.handle,stream=createVerificationStream({authority:studio.authority,verification:studio.verification,workspaceId:studio.workspace.id});
 studio.handle=async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),p=url.pathname,match=p.match(/^\/api\/v1\/workspaces\/([^/]+)(?:\/(.*))?$/),registration=match&&studio.store.registrations().workspaces.find(w=>w.id===match[1]),source=registration&&pilots.list().find(v=>v.workspace.package_path===registration.package_path),pilot=match&&(pilots.get(match[1])||(source?{...source,workspace:workspaceView(registration),project:{...source.project,workspace_id:registration.id}}:null));
  const send=(status,data,error,meta={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:crypto.randomUUID(),recorded_at:new Date().toISOString(),contract_revision:'contract.1',...meta,...(error?{error:{code:error.code||'INTERNAL_ERROR',message:error instanceof StudioError?error.message:'Read model unavailable.',halted:true,issues:[]}}:{})}}));};
  try{
   if(req.method==='GET'&&p==='/api/v1/operational-context'){studio.authority.authenticate(req);return send(200,{draft_workspace:studio.workspace.id,skill_project:options.e4Config?'OPERATOR_CONFIGURED':'pilot-app-l3',evidence_project:options.evidenceProjectRoot||local.root,source_written:false,qualification_restored:false});}
   const submitEvidence=p.match(/^\/api\/v1\/workspaces\/rc3-local\/evidence\/tasks\/([\w.-]+)\/submit-to-ci$/);
   if(submitEvidence&&req.method==='POST'){
    const principal=studio.authority.authenticate(req),entry=[...studio.intents].find(([,i])=>i.grant===req.headers['x-write-grant']&&i.principal===principal),i=entry?.[1];
    if(!i||i.operation!=='ci.bundle'||i.revoked||Date.now()>=i.expires||i.scope.resource_id!==submitEvidence[1]){studio.store.recordAttempt({...studio.authority.auditIdentity(req),action:'verify.run.skills',resourceId:submitEvidence[1],result:'DENY',status:403,reason:'CI bundle grant required',requestId:crypto.randomUUID()});throw new StudioError(403,'FORBIDDEN','Exact evidence bundle grant required.');}
    if(req.headers['if-match']!==JSON.stringify(i.scope.proposal_version_hash))throw new StudioError(412,'STALE_PROPOSAL','Evidence hash changed.');for await(const b of req)if(b.length)throw new StudioError(400,'INVALID_REQUEST','No request body.');
    const receipt=studio.authority.authorize(principal,i.scope,i.grant);await studio.submission.run(receipt,i.payload,i.scope);studio.intents.delete(entry[0]);return send(200,{task_id:i.payload.task_id,source_hash:i.payload.source_hash,state_written:false,evidence_written:false,ci_status:'NOT_RUN'});
   }
   const streamTicket=p.match(/^\/api\/v1\/workspaces\/rc3-local\/verify\/runs\/(VR-[\w-]+)\/stream-ticket$/);
   if(streamTicket&&req.method==='GET'){if(url.search)throw new StudioError(400,'INVALID_REQUEST','No ticket query.');return send(200,stream.ticket(req,streamTicket[1]));}
   const sarif=p.match(/^\/api\/v1\/workspaces\/rc3-local\/verify\/runs\/(VR-[\w-]+)\/sarif$/);
   if(sarif&&req.method==='GET'){studio.authority.authenticate(req);const run=studio.verification.get(sarif[1]);return send(200,{version:'2.1.0',runs:[{tool:{driver:{name:'AGHR',version:run.engine.identity.version}},results:run.summary.errors.map(e=>({ruleId:e.code,level:'error',message:{text:e.message}})),invocations:[{executionSuccessful:run.status==='passed',properties:{status:run.status,run_id:run.id,exit_code:run.exit_code,source:'actual Python diagnostics'}}]}]});}
   const intercept=p==='/api/v1/workspaces'&&req.method==='GET'||pilot||p==='/api/v1/projects/published';
   if(intercept){
    studio.authority.authenticate(req);
    if(req.method!=='GET'){studio.store.recordAttempt({...studio.authority.auditIdentity(req),action:'published-project.write',resourceId:match?.[1],result:'DENY',status:403,reason:'Published sandbox is immutable',requestId:crypto.randomUUID()});throw new StudioError(403,'FORBIDDEN','Published sandbox sources and state are read-only. Use a new Draft CP.');}
    if(Number(req.headers['content-length'])||req.headers['transfer-encoding'])throw new StudioError(400,'INVALID_REQUEST','No GET body.');
    if(p==='/api/v1/workspaces')return send(200,[studio.workspace,...pilots.list().map(v=>v.workspace),...studio.store.registrations().workspaces.filter(w=>w.id!==studio.workspace.id).map(workspaceView)],null,{limit:500,total:3+studio.store.registrations().workspaces.filter(w=>w.id!==studio.workspace.id).length,next_cursor:null});
    if(p==='/api/v1/projects/published')return send(200,pilots.list().map(v=>({project:v.project,state:v.state,receipt:{path:v.receipt_path,hash:v.receipt_hash,status:'VERIFIED_HISTORICAL_SANDBOX_CI'},live_qualification:'NOT_RUN',source_written:false})));
    const tail=match[2]||'',parts=tail.split('/'),item=pilot.views.find(v=>v.item.id===parts[1]),model=currentCapabilities(pilot,studio,()=>pilots.recheck()),caps=model.views;
    if(tail==='projects')return send(200,[pilot.project],null,{total:1,limit:100,next_cursor:null});
    if(tail===`projects/${pilot.project.id}/config`)return send(200,{project_id:pilot.project.id,state:pilot.state,source:{path:pilot.receipt_path,content_hash:pilot.receipt_hash,bytes:pilot.receipt_bytes},profile:'SANDBOX_LOCAL_CI_V1',selections:[]});
    if(tail==='published')return send(200,{project:pilot.project,state:pilot.state,receipt:{path:pilot.receipt_path,hash:pilot.receipt_hash,status:'VERIFIED_HISTORICAL_SANDBOX_CI'},live_qualification:'NOT_RUN',source_written:false});
    if(tail==='cps')return send(200,[historyView(pilot,studio.store)],null,{total:1,limit:100,next_cursor:null});
    if(tail==='cps/'+pilot.historicalCp.id)return send(200,historyView(pilot,studio.store));
    if(parts[0]==='instructions'){
     if(parts.length===1){const allowed=['q','kind','force','authority_level','status','impact_evidence','priority','is_review_due','limit','cursor'];if([...url.searchParams.keys()].some(k=>!allowed.includes(k))||url.searchParams.get('cursor'))throw new StudioError(400,'INVALID_REQUEST','Unsupported filter/cursor.');let rows=pilot.views;for(const [key,value]of url.searchParams){if(['limit','cursor'].includes(key))continue;rows=rows.filter(v=>key==='q'?(v.item.id+' '+v.item.title+' '+v.source_yaml).toLowerCase().includes(value.toLowerCase()):String(key==='authority_level'?v.item.authority?.level:key==='status'?v.item.authority?.status:key==='impact_evidence'?v.item.impact?.evidence:key==='priority'?v.priority_tier:key==='is_review_due'?v.is_review_due:v.item[key])===value);}return send(200,rows,null,{total:rows.length,limit:500,next_cursor:null});}
     if(!item)throw new StudioError(404,'UNKNOWN_ID','Unknown item.');if(parts.length===2)return send(200,item);
     if(['relations','history','evals','calibrations'].includes(parts[2]))return send(200,[]);
    }
    if(tail==='capabilities')return send(200,caps,null,{total:caps.length,limit:100,next_cursor:null});
    if(tail==='capabilities/matrix')return send(200,model.matrix);
    if(parts[0]==='capabilities'){const c=caps.find(c=>c.item_id===parts[1]);if(!c)throw new StudioError(404,'UNKNOWN_ID','Unknown capability.');if(parts.length===2)return send(200,c);if(parts[2]==='qualification'){const allowed={host:'host',host_version:'hostVersion',scope:'scope',content_hash:'contentHash'};let rows=c.qualifications;for(const [key,value]of url.searchParams){if(!allowed[key]||url.searchParams.getAll(key).length!==1||!value||value.length>1024)throw new StudioError(400,'INVALID_REQUEST','Invalid qualification tuple query.');rows=rows.filter(q=>q[allowed[key]]===value);}return send(200,rows);}if(parts[2]==='usage')return send(200,model.usages.get(c.item_id)||[]);}
    throw new StudioError(404,'UNKNOWN_ID','Unknown published project resource.');
   }
   const cpBase=`/api/v1/workspaces/${studio.workspace.id}/cps`;
   if(p===cpBase){req.url=`/api/v1/workspaces/${studio.workspace.id}/change-packages`+url.search;return parent(req,res);}
   const more=p.match(/^\/api\/v1\/workspaces\/rc3-local\/(instructions|capabilities)\/([^/]+)\/(evals|calibrations|qualification|usage)$/);
   if(req.method==='GET'&&more){studio.authority.authenticate(req);const snap=studio.readCatalog.snapshot(),item=snap.views.find(v=>v.item?.id===more[2]);if(!item)throw new StudioError(404,'UNKNOWN_ID','Unknown item.');if(more[1]==='capabilities'&&item.item.kind!=='CAPABILITY')throw new StudioError(404,'UNKNOWN_ID','Unknown capability.');if(more[3]==='evals')return send(200,studio.verification.list().filter(r=>r.command==='eval'&&r.linked_package_id&&studio.store.draft(r.linked_package_id)?.target_item_id===more[2]));return send(200,[]);}
   if(req.method==='GET'&&(p.startsWith('/api/v1/review-sample')||['/api/v1/read-profile','/api/v1/read-scope'].includes(p)||p===`/api/v1/workspaces/${studio.workspace.id}/projects`||p.startsWith(`/api/v1/workspaces/${studio.workspace.id}/instructions`)||p.startsWith(`/api/v1/workspaces/${studio.workspace.id}/capabilities`)))return read(req,res);
   if(req.method==='POST'&&/\/verify\/runs\/VR-[\w-]+\/cancel$/.test(p)&&req.headers['x-studio-view']!=='extended'){
    const original=res.end.bind(res);res.end=function(bytes,...args){try{const envelope=JSON.parse(bytes);if(res.statusCode===200)envelope.data={accepted:true,resource_id:envelope.data.id};return original(JSON.stringify(envelope),...args);}catch{return original(bytes,...args);}};
   }
   return parent(req,res);
  }catch(error){return send(error instanceof StudioError?error.status:503,null,error);}
 };
 const unifiedHandle=studio.handle,canonical=createCanonicalRoutes({studio,pilots,fallback:unifiedHandle}),adoptions=createAdoptionRoutes({studio,pilots,python:options.python,fallback:canonical});studio.handle=createClosureRoutes({studio,pilots,fallback:adoptions});
 const close=studio.close;return {...studio,pilots,attachStreams:stream.attach,close(){stream.close();return close();}};
}
