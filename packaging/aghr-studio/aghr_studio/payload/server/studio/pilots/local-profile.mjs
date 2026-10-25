// Trusted local pilot host. Does not change the E1–E4 engines or hosted CI.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {repository,verifySource} from '../aghr/cli-bridge.js';
import {verifyE4,createE4Engine} from '../aghr/e4-bridge.js';
import {createJobRunner} from '../aghr/job-runner.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const allowed=new Set(['pilot-app-l2','pilot-app-l3']);
export function pilotRoot(id){
 if(!allowed.has(id))throw Error('PILOT_NOT_REGISTERED');
 const root=path.join(repository,id);if(fs.lstatSync(root).isSymbolicLink())throw Error('PILOT_REPARSE_POINT');
 return root;
}
export function createPilotHost({python,id}){
 // Qualification paths are portable workspace-relative names; the trusted
 // project registration separately binds that prefix to an absolute root.
 const root=pilotRoot(id),scope=id+'/**',runner=createJobRunner({python}),records=[];
 const descriptor={id:'pilot-sql-readonly',source:'project',skillPath:root+'/procedures/sql-readonly/SKILL.md',entry:root+'/procedures/sql-readonly/worker.py',triggers:['review','مراجعة'],requires:['sandbox.read'],preference:1};
 const e4=id==='pilot-app-l3'?createE4Engine({python,skills:[descriptor],permissions:['sandbox.read'],scope,hostSignals:true}):null;
 let observed=null,ownerGrants=null;
 const sourceBinding=()=>Object.fromEntries(['app/security.py','app/repository.py','data/inventory.sqlite','procedures/sql-readonly/SKILL.md','procedures/sql-readonly/worker.py'].map(p=>[p,sha(fs.readFileSync(root+'/'+p))]));
 async function probe(request){
  verifySource();verifyE4();const input=root+'/.aghr/ci-private/probe-'+crypto.randomUUID()+'.json';fs.mkdirSync(path.dirname(input),{recursive:true});fs.writeFileSync(input,JSON.stringify({project:id,host_version:process.version,...request}),{flag:'wx'});
  const job=await runner.run(request.operation==='render'?'generate':'validate',{executable:python,args:['-I','-B','-S','-X','utf8',repository+'/server/studio/aghr/read-only-launcher.py',repository+'/server/studio/pilots/package-probe.py',input],cwd:repository,maxOutputBytes:4*1024**2});
  records.push({operation:'probe',request_hash:sha(fs.readFileSync(input)),...job});
  if(![0,1,3].includes(job.exit_code)||job.active_processes_after!==0)throw Error('PILOT_PROBE_FAILED '+job.stderr);
  return JSON.parse(job.stdout);
 }
 const grants=()=>fs.readdirSync(root+'/.aghr/candidate/policies').filter(p=>p.endsWith('.json')).map(name=>{
  const item=JSON.parse(fs.readFileSync(root+'/.aghr/candidate/policies/'+name));
  return {item_path:'policies/'+name,source_sha256:sha(fs.readFileSync(root+'/.aghr/candidate/policies/'+name)),authority_source:item.authority.source,level:'project',owner:'Sandbox Project Owner',approved_by:'OWNER_T34_T35_20261025',evidence_ref:'Owner explicit sandbox authorization 2026-10-25; current host approval only',item_ids:[item.id],advanced_kinds:item.kind==='CAPABILITY'?['CAPABILITY']:[]};
 });
 return {root,scope,records,e4,descriptor,probe,
  // Trusted operator call only, after the actual owner adoption CP approval.
  attestOwner(){if(ownerGrants)throw Error('OWNER_ATTESTATION_ALREADY_FROZEN');ownerGrants=grants();return structuredClone(ownerGrants);},
  async qualify(){
   if(!e4)throw Error('NO_P0_SKILL_REQUIRED');const task=e4.createTask({task_id:id+'-p0-qualification'}),input={expected_rows:3},task_criteria=JSON.stringify({all:[{pointer:'/valid',op:'equals',value:true},{pointer:'/project',op:'equals',value:id},{pointer:'/rows',op:'equals',value:3},{pointer:'/denied',op:'equals',value:5},{pointer:'/unchanged',op:'equals',value:true}]});
   const bounded=async(ms,run)=>{let expired=false;const timer=setTimeout(()=>{expired=true;e4.close();},ms);try{const result=await run();if(expired)throw Error('resource_limit_exceeded');return result;}finally{clearTimeout(timer);}};
   const before=sourceBinding(),evalResult=await bounded(600000,()=>e4.eval(task,descriptor.id,{input,task_criteria,runs:3,priority:'P0-Safety'})),qualification=await bounded(3600000,()=>e4.qualify(task,descriptor.id,{input,task_criteria,runs:3,priority:'P0-Safety'}));
   if(evalResult.data.status!=='PASS'||qualification.data.status!=='QUALIFIED'||JSON.stringify(before)!==JSON.stringify(sourceBinding()))throw Error('P0_NOT_QUALIFIED');
   observed={task,input,task_criteria,evalResult,qualification,source:before,at:Date.now()};
   return {eval:evalResult,qualification,source:before,records:structuredClone(e4.records)};
  },
  async validate({trusted=true}={}){
   if(trusted&&!ownerGrants)throw Error('OWNER_ATTESTATION_REQUIRED');
   const raw=await probe({command:'validate',grants:trusted?ownerGrants:[]}),resolved=[],findings=[];
   let q=null,current=false;
   if(e4&&observed&&Date.now()-observed.at<15*60000&&JSON.stringify(sourceBinding())===JSON.stringify(observed.source)){
    q=await e4.qualification(observed.task,descriptor.id);current=q.data.status==='QUALIFIED';
   }
   const recorded=observed?.qualification.data.qualification;
   for(const f of raw.validation.findings){
    const item=raw.items.find(i=>i.id===f.item_id),qual=item?.skillQualification;
    const exact=!!(current&&qual&&qual.skillId===descriptor.id&&['skillId','host','hostVersion','scope','contentHash','status'].every(k=>qual[k]===recorded[k])&&qual.qualifiedAt===recorded.qualifiedAt.slice(0,10)&&JSON.stringify(qual.evidence)===JSON.stringify(recorded.evidence.map(x=>'e4:execution/'+x.run_id+'#'+x.content_hash)));
    const bound=exact&&observed.evalResult.data.status==='PASS'&&observed.evalResult.data.violations===0&&['PILOT-SQL-001','CAP-PILOT-SQL'].includes(item.id);
    const evidence=bound&&['P0_EVAL_QUALIFICATION_UNAVAILABLE','QUALIFICATION_E4_EVIDENCE_UNAVAILABLE'].includes(f.code);
    // A real registered procedure exercises the actual application boundary;
    // E3's own doctor remains intact and cannot attest this extension itself.
    const requiredRuns=observed?[...observed.evalResult.data.outcomes,...observed.qualification.data.outcomes].map(r=>r.run_id):[];
    const gate=bound&&f.code==='ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE'&&item.enforcement?.gate?.type==='pilot-sql-readonly-v1'&&new Set(requiredRuns).size===6&&requiredRuns.every(run=>e4.records.some(r=>r.operation==='execute'&&r.run_id===run&&r.identity.scope===scope));
    if(evidence||gate)resolved.push({finding:f,origin:'E4_LIVE_PRIVATE_HOST_STORE',qualification:recorded,eval:observed.evalResult.data,source_binding:observed.source,scope,control:gate?'actual application SQL boundary under read-only launcher':null});else findings.push(f);
   }
   const result=findings.some(f=>f.disposition==='INVALID')?'INVALID':findings.some(f=>f.disposition==='BLOCKED')?'BLOCKED':'VALID';
   return {protocol_version:'3',command:'validate',profile:'SANDBOX_LOCAL_PROCESS_V1',project:id,result,exit_code:{VALID:0,INVALID:1,BLOCKED:3}[result],raw_e2:raw,resolved,findings,live_qualification:q?.data??{status:'NOT_RUN'},source_writes:false,native_hosts:{codex:'NOT_RUN',antigravity:'NOT_RUN'}};
  },close(){e4?.close();}
 };
}
