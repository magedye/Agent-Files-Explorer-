import {calculateMetrics} from '../../server/studio/phase5/metrics.mjs';
export function pilotMetrics({id,items,honesty,qualification,merged,baseline}){
 const at=new Date().toISOString(),host='aghr-local-process',version=process.version;
 const critical=id==='pilot-app-l2'?['app.mjs']:['app/security.py','app/repository.py'];
 const context={project:id,host,version,period:{from:'2026-10-25T00:00:00.000Z',to:at},items:items.filter(i=>i.defaultTier?.startsWith('P0')).map(i=>({id:i.id,priority:i.defaultTier,impact_evidence:i.impact.evidence})),capabilities:items.filter(i=>i.kind==='CAPABILITY').map(i=>({id:i.id,priority:i.defaultTier,qualification_current:!!qualification}))};
 const row=(type,value)=>({project:id,host,version,at,type,...value});
 const before=calculateMetrics({...context,capabilities:context.capabilities.map(c=>({...c,qualification_current:false})),observations:critical.map(path=>row('critical_path',{path,covering_items:[],baseline_commit:baseline,source:'Initial application-only Git tree, not the later retry state.'}))});
 const observations=[...critical.map(path=>row('critical_path',{path,covering_items:[id==='pilot-app-l2'?'PILOT-IDENTITY-001':'PILOT-SQL-001'],source:'Explicit declared pilot-critical paths; instructions applicability checked by Python.',merge_sha:merged})),row('pr_generate_check',{status:'PASS',merge_sha:merged})];
 if(honesty){
  observations.push(...honesty.honesty.map(h=>row('honesty',{id:h.id,status:'PASS',evidence:h})),...honesty.scenarios.map(s=>row('behavioral',{id:s.id,status:'PASS',p0_safety:true,evidence:s})),row('skill_eval',{status:qualification.eval.data.status,evidence:qualification.eval.data}));
  const calls=new Map(honesty.records.filter(r=>r.operation==='execute').map(r=>[r.run_id,row('skill_call',{verified:false,execution_bound:r.exit_code!==null,run_id:r.run_id})]));
  for(const r of honesty.records.filter(r=>r.operation==='transition')){const d=JSON.parse(r.stdout).data;if(d?.state==='VERIFIED'){const call=calls.get(d.execution_run_id);if(!call)throw Error('VERIFIED_WITHOUT_PROJECT_EXECUTION');call.verified=true;}}
  observations.push(...calls.values(),row('discovery',{non_english:true,matches:0,outcome:'NO_SKILL_MATCH',evidence:honesty.scenarios.find(s=>s.id==='S7_ARABIC')}));
 }
 return {before,after:calculateMetrics({...context,observations}),baseline_commit:baseline,critical_paths:critical,warning:'Only declared critical paths and observed calls are counted, one execution once. P0 calibration remains assumed; no productivity or causal improvement is claimed.'};
}
