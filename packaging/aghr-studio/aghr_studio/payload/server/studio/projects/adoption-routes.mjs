import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {StudioError} from '../auth.js';
import {createProjectAdoption,adoptionView} from './adoption.mjs';
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=(status,code,message)=>new StudioError(status,code,message);
async function body(req){if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(400,'INVALID_REQUEST','JSON required.');const chunks=[];let size=0;for await(const b of req){size+=b.length;if(size>65536)throw fail(413,'PAYLOAD_TOO_LARGE','Request too large.');chunks.push(b);}try{return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{throw fail(400,'INVALID_REQUEST','Valid UTF8 JSON required.');}}
export function createAdoptionRoutes({studio,pilots,python,fallback}){
 const service=createProjectAdoption({studio,pilots,python}),base='/api/v1/workspaces/'+studio.workspace.id,root=base+'/adoptions';
 const actions={edit:'cp.edit_any',validate:'cp.validate',generate:'cp.generate.preview',preview:'cp.preview',submit:'cp.submit',approve:'cp.approve.governance',export:'cp.export.patch',doctor:'cp.doctor'};
 const intent=(principal,operation,cp,payload,prepared)=>{
  for(const [id,i]of studio.intents)if(Date.now()>=i.expires)studio.intents.delete(id);if(studio.intents.size>=128)throw fail(429,'RATE_LIMITED','Too many intents.');
  const id=crypto.randomUUID(),scope={workspace_id:studio.workspace.id,target_project:'studio-drafts',action:cp?actions[operation]:'cp.create',resource_id:cp?.id||prepared.id,proposal_version_hash:prepared?.proposal_version_hash||cp.proposal_version_hash};
  studio.intents.set(id,{principal,operation:'project-adoption',projectOperation:operation,prepared:prepared||{id:cp.id,title:cp.title},scope,payload,previousHash:cp?.proposal_version_hash,expires:Date.now()+120000,grant:null});return {id,scope,status:'AWAITING_OPERATOR'};
 };
 return async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),p=url.pathname,cpMatch=p.match(new RegExp('^'+base+'/cps/(CP-[\\w-]+)(?:/(intents|validate|preview|submit|approve|export|doctor))?$')),cp=cpMatch&&studio.store.draft(cpMatch[1]);
  const selected=cp&&adoptionView(cp)?cp:null,download=p===base+'/generate/preview'&&[...studio.intents.values()].some(i=>i.grant===req.headers['x-write-grant']&&i.operation==='project-adoption');
  if(p!=='/api/v1/project-adoption-intents'&&!p.startsWith(root)&&!selected&&!download)return fallback(req,res);
  const mutation=req.method!=='GET',requestId=crypto.randomUUID();let action='adoption.write';
  const audit=(result,status,reason)=>studio.store.recordAttempt({...studio.authority.auditIdentity(req),action,resourceId:selected?.id||null,result,status,reason,requestId});
  const send=(status,data,error)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{request_id:requestId,contract_revision:'contract.1',recorded_at:new Date().toISOString(),...(error?{error:{code:error.code||'INTERNAL_ERROR',message:error instanceof StudioError?error.message:'Project adoption unavailable.',halted:true,issues:[]}}:{})}}));};
  try{
   if(mutation)audit('ATTEMPT',null,'Project adoption operation received');const principal=studio.authority.authenticate(req);if(url.search)throw fail(400,'INVALID_REQUEST','No adoption query.');
   const parts=p.startsWith(root+'/')?p.slice(root.length+1).split('/'):[],adoptionCp=parts.length?service.get(parts[0]):null;
   if(req.method==='GET'){
    if(adoptionCp){if(parts.length===1)return send(200,service.view(adoptionCp));if(parts.length===2&&parts[1]==='diff'){if(!adoptionCp.preview)throw fail(409,'CONFLICT','Prepare an authorized preview first.');return send(200,adoptionCp.preview);}}
    if(selected&&cpMatch&&!cpMatch[2])return send(200,selected);return fallback(req,res);
   }
   if(req.method==='POST'&&p==='/api/v1/project-adoption-intents'){
    const input=await body(req);if(!input||Object.keys(input).length!==1||!input.request)throw fail(400,'INVALID_REQUEST','Expected adoption request.');const prepared=await service.prepare(input.request);return send(200,intent(principal,'create',null,input.request,prepared));
   }
   if(req.method==='POST'&&selected&&cpMatch[2]==='intents'){
    if(req.headers['if-match']!==JSON.stringify(selected.proposal_version_hash))throw fail(412,'STALE_PROPOSAL','Exact current hash required.');
    const input=await body(req);if(!input||Object.keys(input).some(k=>!['operation','payload'].includes(k))||!actions[input.operation])throw fail(400,'INVALID_REQUEST','Unknown adoption lifecycle operation.');
    const expected=['edit','generate','approve','export'].includes(input.operation);if(expected!==(input.payload!==undefined))throw fail(400,'INVALID_REQUEST','Invalid operation payload.');
    let prepared;
    if(input.operation==='edit'){service.verifyCapsule({...selected,proposed_yaml:input.payload?.proposed_yaml});prepared=await studio.draftValidator.prepare(service.payload(selected),{edit:input.payload});const draft={...selected,proposed_yaml:prepared.proposed_yaml};if(!service.view(draft)||service.view(draft).target_project_id!==service.view(selected).target_project_id)throw fail(422,'VALIDATION_FAILED','Adoption identity cannot change during editing.');}
    if(input.operation==='generate'){const r=await studio.schema('api.execution.schema.json','GeneratePreviewRequest',[input.payload]);if(!r.valid||input.payload.agent!=='aghr-local-process'||input.payload.profile!==service.view(selected).profile)throw fail(400,'INVALID_REQUEST','Use the registered local project profile.');}
    if(input.operation==='approve'){const r=await studio.schema('api.change.schema.json','ApprovalRequest',[input.payload]);if(!r.valid)throw fail(400,'INVALID_REQUEST','Invalid approval request.');}
    if(input.operation==='export'&&(!input.payload||Object.keys(input.payload).length!==1||input.payload.format!=='patch'))throw fail(400,'INVALID_REQUEST','Patch only.');
    return send(200,intent(principal,input.operation,selected,input.payload,prepared));
   }
   const token=req.headers['x-write-grant'],entry=[...studio.intents].find(([,i])=>i.grant===token&&i.principal===principal),i=entry?.[1];
   if(!i||i.operation!=='project-adoption'||i.revoked||Date.now()>=i.expires)throw fail(403,'FORBIDDEN','Exact project adoption grant required.');action=i.scope.action;
   if(req.headers['if-match']!==JSON.stringify(i.projectOperation==='edit'?i.previousHash:i.scope.proposal_version_hash))throw fail(412,'STALE_PROPOSAL','Proposal hash changed.');
   if(i.projectOperation==='create'){
    if(req.method!=='POST'||p!==root||!isDeepStrictEqual(await body(req),i.payload))throw fail(412,'STALE_PROPOSAL','Create request differs from its authorization.');const receipt=studio.authority.authorize(principal,i.scope,token),created=studio.store.createDraft(receipt,i.prepared);studio.intents.delete(entry[0]);return send(201,service.view(created));
   }
   const current=studio.store.draft(i.scope.resource_id),operation=i.projectOperation;if(!current||current.proposal_version_hash!==i.previousHash)throw fail(412,'STALE_PROPOSAL','Adoption proposal changed.');
   const byCp=selected?.id===current.id&&(operation==='edit'?req.method==='PATCH'&&!cpMatch[2]:req.method==='POST'&&cpMatch[2]===operation),byAdoption=adoptionCp?.id===current.id&&req.method==='POST'&&parts.length===2&&parts[1]===(operation==='export'?'apply':operation);
   if(!byCp&&!byAdoption&&!(operation==='generate'&&download&&req.method==='POST'))throw fail(403,'FORBIDDEN','Grant is scoped to a different action.');
   if(['edit','generate','approve','export'].includes(operation)){const input=await body(req),normalized=byAdoption&&operation==='export'&&input?.mode==='patch'?{format:'patch'}:input;if(!isDeepStrictEqual(normalized,i.payload))throw fail(412,'STALE_PROPOSAL','Payload differs from grant.');}else for await(const b of req)if(b.length)throw fail(400,'INVALID_REQUEST','No body allowed.');
   const receipt=studio.authority.authorize(principal,i.scope,token);let result,status=200;
   if(operation==='edit')result=studio.store.editDraft(receipt,current.id,current.proposal_version_hash,{...i.prepared,id:current.id});
   else if(operation==='validate'){const r=await service.run(current,'validate');result=studio.store.checkDraft(receipt,current.id,current.proposal_version_hash,{...r.data,resource_receipt:r.receipt});status=202;}
   else if(operation==='generate'){const r=await service.run(current,'generate');result=studio.store.previewDraft(receipt,current.id,current.proposal_version_hash,r.data,r.receipt);}
   else if(operation==='preview'){const r=await service.run(current,'preview');result=studio.store.savePreview(receipt,current.id,current.proposal_version_hash,r.data,r.receipt);}
   else if(operation==='doctor'){const r=await service.run(current,'validate');result=studio.store.saveDoctor(receipt,current.id,current.proposal_version_hash,{data:r.data.doctor,receipt:r.receipt});}
   else if(operation==='submit')result=studio.store.submitDraft(receipt,current.id,current.proposal_version_hash);
   else if(operation==='approve'){const r=await service.run(current,'approval',{cp:current,decision:i.payload,actor:studio.authority.describe(principal),requirements:studio.store.requirements(current.id)});result=studio.store.approveDraft(receipt,current.id,current.proposal_version_hash,i.payload,r.data,hash(current),r.receipt);}
   else if(operation==='export'){const observed=await service.run(current,'validate');if(observed.data.result!=='VALID')throw fail(422,'VALIDATION_FAILED','Fresh project strict validation is required.');const r=await service.run(current,'export',{cp:current,actor:studio.authority.describe(principal),requirements:studio.store.requirements(current.id)});result=studio.store.exportDraft(receipt,current.id,current.proposal_version_hash,r.data,hash(current),r.receipt);if(result.artifact.bytes===0)result.warnings.push('No changes: this exact package is already adopted. Empty patch does not grant a new adoption level.');}
   studio.intents.delete(entry[0]);return send(status,result);
  }catch(error){const status=error instanceof StudioError?error.status:503;if(mutation||status===403)try{audit(status===403?'DENY':'ERROR',status,error.code||error.message);}catch{return send(503,null,fail(503,'INTERNAL_ERROR','Audit unavailable.'));}return send(status,null,error);}
 };
}
