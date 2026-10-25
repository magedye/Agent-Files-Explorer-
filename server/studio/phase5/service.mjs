import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {StudioError} from '../auth.js';
import {resourceProfiles} from '../aghr/job-runner.js';
import {calculateMetrics} from './metrics.mjs';
import {projectObservations} from './observations.mjs';
import {exportReport} from './reports.mjs';
const sha=x=>'sha256:'+crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const fail=(code,message)=>new StudioError(422,code,message),roles=['developer','governance-owner','security-owner','architecture-board'];
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
const fields=(v,allowed)=>{if(!plain(v)||Object.keys(v).some(k=>!allowed.includes(k)))throw fail('INVALID_SETTINGS','Unknown configuration field.');};
export function createPhase5Service({store,catalog,authority,ownerActor,project,phase4,skills,clock=Date.now}){
 const registration=project||{id:'studio-drafts',name:'Unregistered Draft',root:null,scope:'**/*',host:'aghr-local-process',host_version:process.version,registration:'NOT_CONFIGURED'};
 const fixedLimits=Object.fromEntries(['eval','qualify'].map(k=>[k,{timeout_ms:resourceProfiles[k].timeoutMs,memory_mib:resourceProfiles[k].memoryBytes/1024**2}]));
 const defaults={roles:{[ownerActor]:'governance-owner'},git:{gpg_key_id:null,default_branch:'main',commit_message_template:'aghr: {title}'},limits:fixedLimits,hosts:[],security:{binding:'127.0.0.1',audit_retention_days:90,token_rotation:'per_session'}};
 let config=store.phase5Settings()||defaults;
 function settings(){return {revision:'phase5-local.1',hash:sha(config),project:registration,settings:config,evaluators:phase4.status(),resources:{effective:fixedLimits,mutable:false,reason:'T15 pinned by E1–E4 custody; changes require an engine CP, never a silent settings override.'},signing:{status:'NOT_CONFIGURED',warning:'UNSIGNED; GPG identity is not verified by a key label. Patch-only Draft exports.'},security:{session_rotation:'per_startup',listen:'127.0.0.1',audit_retention:'Minimum retention policy; no automatic audit deletion.'}};}
 function validateSettings(section,value){
  if(!Object.hasOwn(defaults,section))throw fail('UNKNOWN_SETTINGS_SECTION','Unknown section.');
  if(section==='roles'){
   if(!plain(value)||Object.keys(value).length>100||Object.entries(value).some(([a,r])=>!a.trim()||a.length>128||/[\x00-\x1f]/.test(a)||!roles.includes(r))||value[ownerActor]!=='governance-owner')throw fail('INVALID_ROLE_BINDING','Valid actors/roles and the installation owner are required.');
  }else if(section==='limits'){
   if(!isDeepStrictEqual(value,fixedLimits))throw fail('PINNED_RESOURCE_PROFILE','The effective 600s/3600s/2GiB profile is pinned; submit an engine CP to change it.');
  }else if(section==='git'){
   fields(value,Object.keys(defaults.git));if(value.gpg_key_id!==null||typeof value.default_branch!=='string'||!/^[-\w/.]{1,100}$/.test(value.default_branch)||value.default_branch.includes('..')||typeof value.commit_message_template!=='string'||value.commit_message_template.length>300||!value.commit_message_template.includes('{title}')||/[\x00-\x1f]/.test(value.commit_message_template))throw fail('UNVERIFIED_SIGNING_CONFIGURATION','GPG requires trusted operator key enrollment; branch and title template must be valid.');
  }else if(section==='security'){
   fields(value,Object.keys(defaults.security));if(value.binding!=='127.0.0.1'||value.token_rotation!=='per_session'||!Number.isInteger(value.audit_retention_days)||value.audit_retention_days<90||value.audit_retention_days>3650)throw fail('SECURITY_POLICY_REJECTED','Loopback, session rotation and at least90 days retention required.');
  }else{
   if(!Array.isArray(value)||value.length>5||new Set(value.map(v=>v.host)).size!==value.length)throw fail('INVALID_HOST_CONFIGURATION','At most five unique hosts.');
   for(const h of value){fields(h,['host','budget_bytes','binary_path','version_detection']);if(!['codex','antigravity','gemini-cli','claude-code','cursor'].includes(h.host)||h.budget_bytes!==32768)throw fail('TRUSTED_HOST_ENROLLMENT_REQUIRED','Native executable enrollment and budget changes require operator/engine qualification.');
    if(h.binary_path!==undefined&&(typeof h.binary_path!=='string'||!/^([A-Za-z]:[\\/]|\/)/.test(h.binary_path)||/[\x00-\x1f]/.test(h.binary_path)||!isDeepStrictEqual(h.version_detection,{kind:'argv',args:['--version']})))throw fail('INVALID_HOST_CONFIGURATION','Host metadata requires an absolute path and the allowlisted --version argv.');
    // This is inert display metadata. Runtime adapters use their separately
    // operator-registered descriptors and never execute settings binary paths.
   }
  }
  return structuredClone(value);
 }
 // Revalidate persisted settings before they acquire server authority.
 fields(config,Object.keys(defaults));for(const section of Object.keys(defaults)){if(!Object.hasOwn(config,section))throw fail('SETTINGS_INCOMPLETE','Missing saved section.');validateSettings(section,config[section]);}authority.applyRoleBindings(config.roles);
 function current(){
  const data=store.phase5Data(),to=new Date(clock()).toISOString(),from=new Date(clock()-90*86400000).toISOString();
  const items=catalog.views.map(v=>({id:v.item.id,kind:v.item.kind,priority:v.priority_tier,impact_evidence:v.item.impact?.evidence,source_hash:v.source_hash,source_path:v.source_path}));
  const live=skills.inventory().tasks;
  const capabilities=catalog.capabilities.map(v=>({id:v.item_id,skill_id:v.capability.skillId,priority:v.capability.defaultTier,qualification_current:live.some(t=>t.skill_id===v.capability.skillId&&t.host===registration.host&&t.qualification?.status==='QUALIFIED'&&t.qualification.record?.hostVersion===registration.host_version&&t.qualification.record?.scope===registration.scope),source_path:v.source_path,source_hash:v.content_hash}));
  const observations=projectObservations(data,registration);
  const qualifications=new Map();for(const task of live){const q=task.qualification?.historical;if(q&&task.host===registration.host&&q.scope===registration.scope)qualifications.set(task.skill_id,{project:registration.id,host:registration.host,version:registration.host_version,at:to,type:'qualification',skill_id:task.skill_id,host_version_changed:q.hostVersion!==registration.host_version,requalified:task.qualification.status==='QUALIFIED',source_hash:q.contentHash,driver_hash:q.driverHash,scope:q.scope});}observations.push(...qualifications.values());
  for(const path of registration.critical_paths||[]){const covering=catalog.views.filter(v=>['CONSTRAINT','CONTROL'].includes(v.item.kind)&&v.item.scope?.paths?.includes(path));observations.push({project:registration.id,host:registration.host,version:registration.host_version,at:to,type:'critical_path',path,covering_items:covering.map(v=>({id:v.item.id,source_hash:v.source_hash})),source_hash:sha({path,candidate:catalog.readSetHash}),source:'operator-registered critical path inventory; exact path match only'});}
  const result=calculateMetrics({project:registration.id,host:registration.host,version:registration.host_version,period:{from,to},observations,items,capabilities,at:to});
  result.candidate_hash='sha256:'+catalog.readSetHash;result.scope=registration.scope;result.raw_hash=sha(result.raw);result.observation_limits={runs:2000,audit:10000,snapshots:200,history_only:true,critical_path_inventory:registration.critical_paths?.length?'REGISTERED_EXACT_PATHS':'NOT_CONFIGURED',native_hosts:'REQUIRED / NOT_RUN / NOT_WAIVED'};return result;
 }
 function source(){const data=store.phase5Data();return {project:registration.id,candidate_hash:'sha256:'+catalog.readSetHash,metrics:current(),items:catalog.views.map(v=>({id:v.item.id,authority:v.item.authority??null,impact:v.item.impact,source_path:v.source_path,source_hash:v.source_hash,status:'NOT_RUN',reason:'Source indexing is not runtime compliance verification.',evidence:[]})),changes:data.changes,capabilities:skills.inventory(),audit:data.audit.map(e=>({...e,payload:JSON.parse(e.payload_json||'null')})),evidence:data.runs.map(r=>({id:r.id,status:r.status,command:r.command,source_hash:sha(r.raw_output||'')})),limitations:['Draft only; reference1.2.0 and canonical state unchanged.','Imported/historical evidence cannot grant live qualification.','Native and hosted CI qualification NOT_RUN.']};}
 function history(days=90){if(!Number.isInteger(days)||days<1||days>365)throw fail('INVALID_PERIOD','days must be1–365.');return store.phase5Snapshots().filter(s=>s.project===registration.id&&s.host===registration.host&&s.version===registration.host_version&&s.scope===registration.scope&&s.candidate_hash==='sha256:'+catalog.readSetHash&&Date.parse(s.captured_at)>=clock()-days*86400000);}
 function dashboard(){const m=current(),data=store.phase5Data(),items=catalog.views,now=clock();return {project:registration,levels:{instructions:{current:'L0',target:'L2',status:'NOT_QUALIFIED'},skills:{current:'L0',target:'L3',status:'NOT_QUALIFIED'},divergence:false},metrics:m,
  risks:[{id:'p0_unqualified',value:m.metrics.skill_qualification_coverage_pct.denominator===null?null:m.metrics.skill_qualification_coverage_pct.denominator-m.metrics.skill_qualification_coverage_pct.numerator,screen:'skills'},{id:'reviews_due',value:items.filter(v=>v.is_review_due).length,screen:'registry'},{id:'p0_assumed_60d',value:null,screen:'registry',status:'NOT_RUN'},{id:'exceptions_14d',value:items.filter(v=>v.item.kind==='EXCEPTION'&&Date.parse(v.item.expiresAt)>=now&&Date.parse(v.item.expiresAt)<=now+14*86400000).length,screen:'registry'},{id:'drift',value:m.metrics.drift_rate_pct.value,screen:'verification'},{id:'false_success',value:m.metrics.false_success_rate_pct.value,screen:'runtime'}],activity:data.audit.slice(0,20)};}
 const validate=request=>{
  fields(request,['operation','section','value','report','format']);if(!['settings.update','settings.test-signing','metrics.snapshot','reports.generate'].includes(request.operation))throw fail('INVALID_OPERATION','Unknown Phase5 operation.');
  if(request.operation==='settings.update'){if(Object.keys(request).some(k=>!['operation','section','value'].includes(k)))throw fail('INVALID_REQUEST','Unexpected settings fields.');validateSettings(request.section,request.value);}
  else if(request.operation==='reports.generate'){if(Object.keys(request).some(k=>!['operation','report','format'].includes(k)))throw fail('INVALID_REQUEST','Unexpected report fields.');exportReport(request.report,request.format,source());}
  else if(Object.keys(request).length!==1)throw fail('INVALID_REQUEST','Operation has no extra fields.');return structuredClone(request);
 };
 const binding=request=>sha({request,project:registration,settings_hash:sha(config),candidate_hash:catalog.readSetHash});
 return {settings,current,history,dashboard,source,validate,binding,
  run(receipt,bound,request){
   if(request.operation==='settings.update'){const next={...config,[request.section]:validateSettings(request.section,request.value)};store.phase5Commit(receipt,bound,{settings:next,settings_hash:sha(next),section:request.section});config=next;if(request.section==='roles')authority.applyRoleBindings(config.roles);return settings();}
   if(request.operation==='settings.test-signing')return store.phase5Commit(receipt,bound,{status:'NOT_CONFIGURED',verified:false,reason:'GPG key has not been enrolled by the trusted local operator. No signing claim or external key-store access.'});
   if(request.operation==='metrics.snapshot')return store.phase5Commit(receipt,bound,current());
   return store.phase5Commit(receipt,bound,exportReport(request.report,request.format,source()));
  }};
}
