import crypto from 'node:crypto';
const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
const json=s=>{try{return JSON.parse(s||'{}');}catch{return {};}};
export function projectObservations(data,project){
 const rows=[],executions=new Map();
 const observedVersion=records=>{const executed=(records||[]).filter(r=>r.operation==='execute'),versions=new Set(executed.map(r=>r.identity?.host_version));return executed.length&&executed.every(r=>r.identity?.host===project.host&&r.identity?.scope===project.scope&&typeof r.identity.host_version==='string')&&versions.size===1?[...versions][0]:null;};
 for(const run of data.runs){const raw=json(run.raw_output);for(const r of raw.records||[])if(r.operation==='execute'&&r.run_id)executions.set(r.run_id,r);}
 const add=(run,type,value)=>rows.push({project:project.id,host:project.host,version:project.host_version,at:run.finished_at||run.started_at,type,run_id:run.id,source_hash:hash(run.raw_output||run.summary_json||''),...value});
 for(const run of data.runs){
  const raw=json(run.raw_output),summary=json(run.summary_json),r=raw.result||{},skill=summary.studio_skill;
  if(raw.run_id&&raw.scope===project.scope&&raw.status==='PASS'&&Array.isArray(raw.outputs)&&raw.records?.filter(r=>r.operation==='execute').length===3){
   // Phase4 receipts were produced by this process, retained only as historical
   // measurements. They cannot restore a live approval/qualification token.
   const version=observedVersion(raw.records);add(run,'skill_eval',{version,status:'PASS',scope:raw.scope,historical_only:true});
   raw.outputs.forEach((out,index)=>{for(const b of out.behavioral_evals||[])add(run,'behavioral',{version,status:b.status,fixture_id:b.id,execution_index:index,scope:raw.scope});});
  }else if(raw.execution_records?.some(r=>r.operation==='execute'&&r.identity?.scope===project.scope))add(run,'skill_eval',{version:observedVersion(raw.execution_records),status:'FAIL'});
  if(!skill||raw.host!==project.host||(raw.project_scope??skill.view?.state?.identity?.scope)!==project.scope)continue;
  const version=skill.view?.host_version??skill.view?.state?.identity?.host_version??null;
  if(['eval','qualify'].includes(raw.operation))add(run,'skill_eval',{version,status:skill.status==='passed'?'PASS':'FAIL',skill_id:skill.view?.skill_id});
  if(raw.operation!=='phase'){
   const state=raw.result||{},execution=executions.get(state.execution_run_id);
   const bound=execution?.exit_code===0&&execution.active_processes_after===0&&execution.identity?.scope===project.scope&&JSON.stringify(execution.identity)===JSON.stringify(state.identity);
   const verified=state.verified===true&&state.state==='VERIFIED',observable=!verified||!!execution||!state.execution_run_id||state.execution==='NOT_RUN';
   add(run,'skill_call',{version,verified,observable,execution_bound:!!bound,execution_run_id:state.execution_run_id,operation:raw.operation,...(!observable?{reason:'EXECUTION_OUTSIDE_OBSERVATION_WINDOW'}:{})});
  }
  // Never infer language from successful discovery; retain missing request
  // language as unobserved. Historical v3 records do not retain query text.
  if(raw.operation==='select'&&raw.discovery_request?.query_supplied)add(run,'discovery',{version,non_english:raw.discovery_request.non_english,matches:r.selected?.length||0,outcome:r.status,language_observation:raw.discovery_request.language_observation??'legacy heuristic'});
 }
 return rows;
}
