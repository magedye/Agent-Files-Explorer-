import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {StringDecoder} from 'node:string_decoder';
import {repository,engineRoot,verifySource,decodeResult,sourceHash as e2Hash} from './aghr/cli-bridge.js';
import {createJobRunner,resourceProfiles} from './aghr/job-runner.js';
import {createE4Engine,sourceHash as e4Hash,verifyE4} from './aghr/e4-bridge.js';
import {StudioError} from './auth.js';
import {createBoundedValidator} from './aghr/bounded-validator.js';
const sha=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
const issue=(code,message)=>({code,message,severity:'error'});
const artifact=(name,bytes)=>({path:name,content_hash:sha(bytes),bytes:Buffer.byteLength(bytes)});
const clone=structuredClone;
export function createVerificationService({python,workspace,store,validator,schema,e4Config={skills:[],permissions:[]}}){
 const runner=createJobRunner({python}),runs=new Map(),queue=[];let current,closed=false;
 const pin=fs.readFileSync(path.join(repository,'server/studio/aghr/e4/SOURCE.lock.json'));
 const distribution=artifact('server/studio/aghr/e4/SOURCE.lock.json',pin);
 const controlEvidencePath='docs/evidence/studio-draft-auth-cp-2026-10-23/resources-checkpoint.txt',controlProof=fs.readFileSync(path.join(repository,controlEvidencePath));
 if(sha(controlProof)!=='sha256:a80a4da311db0d10791c5eba1ad16e9c05b4c15428f7abf7fbff6df5cabd8248')throw Error('CONTROL_QUALIFICATION_DRIFT');
 const engine={implementation:'pinned_python_aghr',status:'PINNED',executable:python,shell:false,identity:{version:'rc3+e4-local.1',content_hash:'sha256:'+e4Hash,schema_version:'1.2',distribution},reason:'Local command profile only; native host qualification is independent.'};
 const controls={platform:'win32',adapter:'windows-job-list',status:'QUALIFIED',process_tree:true,wall_clock:true,memory:true,evidence:[artifact(controlEvidencePath,controlProof)]};
 const configHash=sha(JSON.stringify({limits:resourceProfiles,engine:e4Hash,skills:e4Config.skills,permissions:e4Config.permissions}));
 const bind=request=>sha(JSON.stringify({request,config_hash:configHash,candidate:e2Hash}));
 const action=request=>'verify.run.'+(['eval','qualify'].includes(request.command)?request.command:'fast');
 const options=request=>{
  const args={};for(const text of request.args){const m=text.match(/^--([a-z_]+)(?:=(.*))?$/s);if(!m||Object.hasOwn(args,m[1]))throw new StudioError(400,'INVALID_REQUEST','Only declared structured options are accepted.');args[m[1]]=m[2]??true;}
  const allowed=['validate','lint'].includes(request.command)?['strict','path','agent','host_version','environment','stage','task_type','language']:['eval','qualify'].includes(request.command)?['skill','task','criteria','input','runs']:['cp'];
  for(const [k,v]of Object.entries(args))if(!allowed.includes(k)||(v===true&&k!=='strict'))throw new StudioError(400,'INVALID_REQUEST','Unknown command option.');
  if(args.strict&&request.command!=='validate')throw new StudioError(400,'INVALID_REQUEST','Strict is valid only for validate.');
  if(['generate','doctor','check'].includes(request.command)&&!/^CP-[\w-]+$/.test(args.cp||''))throw new StudioError(400,'INVALID_REQUEST','A saved Draft CP is required.');
  if(['eval','qualify'].includes(request.command)){
   if(!/^[\w.-]{1,128}$/.test(args.skill||'')||!/^[\w.-]{1,128}$/.test(args.task||'')||typeof args.criteria!=='string')throw new StudioError(400,'INVALID_REQUEST','Skill, task and task criteria are required.');
   try{JSON.parse(args.criteria);if(args.input)JSON.parse(args.input);}catch{throw new StudioError(400,'INVALID_REQUEST','Criteria and input must be JSON.');}
   if(args.runs&&(!/^\d+$/.test(args.runs)||Number(args.runs)<3||Number(args.runs)>20))throw new StudioError(400,'INVALID_REQUEST','Runs must be between 3 and 20.');
  }return args;
 };
 const frame=(r,type,value)=>{r.frames.push({run_id:r.view.id,sequence:r.frames.length,at:new Date().toISOString(),type,...(type==='status'?{status:value}:{text:value})});};
 const get=id=>{const r=runs.get(id);if(r)return clone(r.view);const saved=store.verificationRuns().find(x=>x.id===id);if(!saved)throw new StudioError(404,'UNKNOWN_ID','Unknown verification run.');if(saved.status==='running'){saved.status='errored';saved.termination_reason='engine_error';saved.finished_at=new Date().toISOString();saved.summary.errors.push(issue('INTERRUPTED_RUN','Run belonged to a previous server process; completion was not observed.'));}return saved;};
 async function execute(r){
  const v=r.view,args=options(v),decoders={stdout:new StringDecoder('utf8'),stderr:new StringDecoder('utf8')};
  const deadline=setTimeout(()=>{r.deadlineExceeded=true;r.controller.abort();},resourceProfiles[v.command].timeoutMs);
  let lastSaved=0;
  const output=({stream,bytes})=>{const text=decoders[stream].write(bytes);v['raw_'+stream]+=text;v.raw_output+=text;frame(r,stream,text);if(Date.now()-lastSaved>1000){r.save(clone(v));lastSaved=Date.now();}};
  let job,exit;
  try{
   verifyE4();
   if(['validate','lint'].includes(v.command)){
    const commandArgs=[v.command,...(v.command==='validate'?['--strict']:[]),...Object.entries(args).filter(([k])=>k!=='strict').map(([k,value])=>'--'+k.replaceAll('_','-')+'='+value)];
    job=await runner.run(v.command,{executable:python,args:['-I','-B','-S','-X','utf8',path.join(repository,'server/studio/aghr/read-only-launcher.py'),path.join(engineRoot,'tools/cli.py'),...commandArgs],cwd:engineRoot,signal:r.controller.signal,onOutput:output,maxOutputBytes:4*1024**2});
    verifySource();if(['passed','failed'].includes(job.status))decodeResult(job.stdout,job.stderr,job.exit_code,v.command);
    exit=job.exit_code;
   }else if(['eval','qualify'].includes(v.command)){
    r.e4=createE4Engine({python,...e4Config});r.controller.signal.addEventListener('abort',()=>r.e4.close(),{once:true});
    const task=r.e4.createTask({task_id:args.task});
    const result=await r.e4[v.command](task,args.skill,{input:args.input?JSON.parse(args.input):{},task_criteria:args.criteria,runs:Number(args.runs||3)});
    for(const receipt of r.e4.records){if(receipt.stdout)output({stream:'stdout',bytes:Buffer.from(receipt.stdout)});if(receipt.stderr)output({stream:'stderr',bytes:Buffer.from(receipt.stderr)});}
    job=result.receipt;exit=job.exit_code;
    // SELECTED/NO_SKILL_MATCH or loading is not an evaluation PASS.
    if(!['PASS','QUALIFIED'].includes(result.data.status))exit=exit||3;
   }else{
    const cp=store.draft(args.cp);if(!cp)throw new StudioError(404,'UNKNOWN_ID','Unknown draft.');
    const payload={title:cp.title,kind:cp.kind,proposed_yaml:cp.proposed_yaml,...(cp.source?{source:cp.source}:{}),...(cp.target_item_id?{target_item_id:cp.target_item_id}:{})};
    r.validator=await createBoundedValidator({python,base:{base_package_version:cp.base_package_version,base_candidate_hash:cp.base_candidate_hash}});
    r.controller.signal.addEventListener('abort',()=>r.validator.close(),{once:true});
    const result=v.command==='generate'?await r.validator.generateRun(payload,{agent:'codex',profile:'draft-l1',dry_run:true}):v.command==='doctor'?await r.validator.doctorRun(payload):await (async()=>{const report=await r.validator.check(payload);return {data:report,receipt:report.resource_receipt};})();
    job=result.receipt;exit=job?.exit_code??(result.data?.result==='VALID'||result.data?.status==='PASS'?0:3);
    if(job?.stdout)output({stream:'stdout',bytes:Buffer.from(job.stdout)});if(job?.stderr)output({stream:'stderr',bytes:Buffer.from(job.stderr)});
   }
   for(const s of ['stdout','stderr']){const text=decoders[s].end();if(text){v['raw_'+s]+=text;v.raw_output+=text;frame(r,s,text);}}
   if(r.deadlineExceeded){v.status='resource_limit_exceeded';v.termination_reason='timeout';v.exit_code=null;}
   else if(r.controller.signal.aborted){v.status='errored';v.termination_reason='user_cancelled';v.exit_code=null;}
   else if(job?.status==='resource_limit_exceeded'&&['timeout','memory_limit'].includes(job.reason)){v.status='resource_limit_exceeded';v.termination_reason=job.reason;v.exit_code=null;}
   else if(job?.reason==='output_limit'){v.status='errored';v.termination_reason='engine_error';v.summary.errors.push(issue('OUTPUT_LIMIT_EXCEEDED','Output capture limit exceeded.'));}
   else{
    v.status=exit===0?'passed':'failed';v.exit_code=exit;v.termination_reason='completed';
    if(exit!==0)v.summary.errors.push(issue('ENGINE_REJECTED','Engine exit '+exit+'; inspect raw output.'));
   }
   const raw=JSON.stringify({job,executions:r.e4?structuredClone(r.e4.records):[],exit_code:exit,inputs_hash:v.inputs_hash});r.receiptRaw=raw;
   v.evidence=[artifact('sqlite:verification_runs/'+v.id+'#receipt_raw',raw)];
   if(v.status==='passed')v.engine={...engine,status:'QUALIFIED',qualification_evidence:v.evidence};
   v.resource_peak_mib=job?.resource_peak_mb??null;
  }catch(error){
   if(error.receipt){r.receiptRaw=JSON.stringify(error.receipt);if(error.receipt.stdout)output({stream:'stdout',bytes:Buffer.from(error.receipt.stdout)});if(error.receipt.stderr)output({stream:'stderr',bytes:Buffer.from(error.receipt.stderr)});}
   if(r.e4)for(const receipt of r.e4.records){if(receipt.stdout)output({stream:'stdout',bytes:Buffer.from(receipt.stdout)});if(receipt.stderr)output({stream:'stderr',bytes:Buffer.from(receipt.stderr)});}
   const limited=error.message.match(/resource_limit_exceeded:(timeout|memory_limit)/);
   v.status=r.deadlineExceeded||limited?'resource_limit_exceeded':'errored';v.termination_reason=r.deadlineExceeded?'timeout':limited?limited[1]:r.controller.signal.aborted?'user_cancelled':'engine_error';v.summary.errors.push(issue('RUN_FAILED',error instanceof StudioError?error.message:error.message.slice(0,200)));
  }
  finally{
   clearTimeout(deadline);r.e4?.close();r.validator?.close();v.finished_at=new Date().toISOString();v.duration_ms=Date.now()-r.created;
   frame(r,'status',v.status);
   try{r.save(clone(v),r.receiptRaw??null);}catch(error){
    // Completion without its durable audit receipt cannot be a successful run.
    v.status='errored';v.termination_reason='engine_error';v.summary.errors.push(issue('PERSISTENCE_FAILED','Completion could not be committed with its audit record.'));frame(r,'status',v.status);
    try{r.save(clone(v),r.receiptRaw??null);}catch{/* In-memory error remains visible; no PASS is returned. */}
   }
  }
 }
 async function pump(){if(current||closed)return;const r=queue.shift();if(!r)return;current=r;try{if(!r.controller.signal.aborted)await execute(r);}finally{current=null;queueMicrotask(()=>pump().catch(()=>{}));}}
 return {bind,action,options,
  async validate(request){const result=await schema('api.execution.schema.json','VerifyRequest',[request]);if(!result.valid)throw new StudioError(400,'INVALID_REQUEST','Invalid command request.');options(request);return clone(request);},
  start(receipt,request,id,scope){
   if(closed||queue.length>=16)throw new StudioError(429,'RATE_LIMITED','Verification queue is full.');
   const at=new Date().toISOString(),profile=resourceProfiles[request.command];
   const view={id,workspace_id:workspace.id,command:request.command,args:clone(request.args),status:'running',exit_code:null,started_at:at,finished_at:null,duration_ms:null,resource_peak_mib:null,limits:{timeout_ms:profile.timeoutMs,memory_mib:profile.memoryBytes/1024**2},engine:clone(engine),control_adapter:clone(controls),termination_reason:null,raw_stdout:'',raw_stderr:'',raw_output:'',summary:{errors:[],warnings:[],p0_issues:0},linked_package_id:null,candidate_hash:'sha256:'+e2Hash,inputs_hash:bind(request),config_hash:configHash,evidence:[]};
   const r={view,frames:[],controller:new AbortController(),created:Date.now(),save:store.beginVerification(receipt,view,scope)};runs.set(id,r);frame(r,'status','running');queue.push(r);setImmediate(()=>pump().catch(()=>{}));return {run_id:id};
  },get,
  list(){const ids=new Set([...runs.keys(),...store.verificationRuns().map(x=>x.id)]);return [...ids].map(get).sort((a,b)=>b.started_at.localeCompare(a.started_at));},
  cancel(id){const r=runs.get(id);if(!r||r.view.status!=='running')throw new StudioError(409,'CONFLICT','Run is not active.');r.controller.abort();if(r!==current){r.view.status='errored';r.view.termination_reason='user_cancelled';r.view.finished_at=new Date().toISOString();r.view.duration_ms=Date.now()-r.created;frame(r,'status','errored');r.save(clone(r.view));}return get(id);},
  frames:id=>clone(runs.get(id)?.frames||[]),
  close(){closed=true;for(const r of runs.values())if(r.view.status==='running')r.controller.abort();if(!current)return;return (async()=>{while(current)await new Promise(resolve=>setTimeout(resolve,50));})();},
 };
}
