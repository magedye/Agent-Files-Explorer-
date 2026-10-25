// rc.3 §17. Every number carries its own denominator and evidence. Missing is null.
export const metricKeys=['policy_coverage_pct','eval_pass_rate_pct','exception_half_life_days','drift_rate_pct','calibration_coverage_pct','skill_qualification_coverage_pct','skill_eval_pass_rate_pct','false_success_rate_pct','discovery_recall_multilingual_pct','qualification_drift_count'];
const passed=x=>x.status==='PASS';
function metric(rows,predicate,unit='percent'){
 const n=rows.filter(predicate).length,d=rows.length;
 return {value:d?(unit==='count'?n:100*n/d):null,status:d?'OBSERVED':'NOT_RUN',numerator:d?n:null,denominator:d||null,unit,evidence:rows};
}
export function calculateMetrics({project,host,version,period,observations,items=[],capabilities=[],at=new Date().toISOString()}){
 const o=observations.filter(x=>x.project===project&&x.host===host&&x.version===version&&x.at>=period.from&&x.at<=period.to),group=k=>o.filter(x=>x.type===k);
 const p0=items.filter(i=>i.priority?.startsWith('P0')),caps=capabilities.filter(c=>c.priority?.startsWith('P0'));
 const known=(rows,predicate)=>({...metric(rows.filter(x=>x.observable!==false),predicate),excluded_unobservable:rows.filter(x=>x.observable===false).length});
 const m={policy_coverage_pct:known(group('critical_path'),x=>x.covering_items?.length>0),eval_pass_rate_pct:known(group('behavioral'),passed),
 exception_half_life_days:{value:null,status:'NOT_RUN',numerator:null,denominator:null,unit:'days',evidence:group('exception')},
 drift_rate_pct:known(group('pr_generate_check'),x=>x.status==='FAIL'),calibration_coverage_pct:metric(p0,x=>x.impact_evidence==='repo-measured'),
 skill_qualification_coverage_pct:metric(caps,x=>x.qualification_current===true),skill_eval_pass_rate_pct:known(group('skill_eval'),passed),
 false_success_rate_pct:known(group('skill_call'),x=>x.verified===true&&x.execution_bound!==true),
 discovery_recall_multilingual_pct:known(group('discovery').filter(x=>x.non_english===true),x=>x.matches>0||x.outcome==='NO_SKILL_MATCH'),
 qualification_drift_count:metric(group('qualification'),x=>x.host_version_changed===true&&x.requalified!==true,'count')};
 const days=group('exception').filter(x=>Number.isFinite(x.resolved_days)&&x.resolved_days>=0).map(x=>x.resolved_days).sort((a,b)=>a-b);
 if(days.length)m.exception_half_life_days={...m.exception_half_life_days,status:'OBSERVED',value:days.length%2?days[(days.length-1)/2]:(days[days.length/2-1]+days[days.length/2])/2,denominator:days.length};
 const honesty=known(group('honesty'),passed),behavioral=known(group('behavioral'),passed),accuracy=known(group('discovery_accuracy'),passed);
 const p0Violations=group('behavioral').filter(x=>x.p0_safety===true&&!passed(x));
 const alerts=[];
 if(m.false_success_rate_pct.value>0)alerts.push({code:'FALSE_SUCCESS',severity:'error',metric:'false_success_rate_pct'});
 if(honesty.value!==null&&honesty.value<100)alerts.push({code:'HONESTY_FAILURE',severity:'error'});
 if(p0Violations.length)alerts.push({code:'P0_SAFETY_VIOLATION',severity:'error',evidence:p0Violations});
 const raw={observations:o,items:p0,capabilities:caps};
 return {profile:'phase5-local.1',project,host,version,period,captured_at:at,metrics:m,honesty,behavioral,discovery_accuracy:accuracy,alerts,raw,raw_hash:null,
  grouped:{instructions:Object.fromEntries(metricKeys.slice(0,5).map(k=>[k,m[k]])),skills:Object.fromEntries(metricKeys.slice(5).map(k=>[k,m[k]]))},
  limits:{instruction_level:'L0',skill_level:'L0',qualification:'No runtime qualification or adoption level is granted by a metric.'}};
}
