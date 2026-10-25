import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateMetrics,metricKeys} from '../server/studio/phase5/metrics.mjs';
import {exportReport} from '../server/studio/phase5/reports.mjs';
import {projectObservations} from '../server/studio/phase5/observations.mjs';
import {createPhase5Service} from '../server/studio/phase5/service.mjs';
const ctx={project:'project-a',host:'local',version:'v1',period:{from:'2026-10-01',to:'2026-10-31'},observations:[]};
const row=(type,extra={})=>({project:'project-a',host:'local',version:'v1',at:'2026-10-24',run_id:'actual-fixture',type,...extra});
test('T30 ten metrics retain NOT_RUN/null when there are no observations',()=>{const m=calculateMetrics(ctx);assert.equal(Object.keys(m.metrics).length,10);for(const v of Object.values(m.metrics)){assert.equal(v.value,null);assert.equal(v.denominator,null);}assert.equal(m.honesty.value,null);assert.equal(m.discovery_accuracy.value,null);});
test('T30 exact ten denominators, median, version isolation and raw evidence',()=>{
 const observations=[row('critical_path',{covering_items:['SEC-1']}),row('critical_path',{covering_items:[]}),row('behavioral',{status:'PASS'}),row('behavioral',{status:'FAIL'}),row('exception',{resolved_days:2}),row('exception',{resolved_days:8}),row('pr_generate_check',{status:'PASS'}),row('pr_generate_check',{status:'FAIL'}),row('skill_eval',{status:'PASS'}),row('skill_eval',{status:'FAIL'}),row('skill_call',{verified:true,execution_bound:true}),row('skill_call',{verified:true,execution_bound:false}),row('discovery',{non_english:true,outcome:'NO_SKILL_MATCH',matches:0}),row('discovery',{non_english:true,outcome:'DISCOVERY_UNAVAILABLE',matches:0}),row('qualification',{host_version_changed:true,requalified:false}),row('qualification',{host_version_changed:false,requalified:true}),row('skill_eval',{status:'PASS',version:'v2'}),row('skill_eval',{status:'PASS',project:'other'})];
 const m=calculateMetrics({...ctx,observations,items:[{id:'P0-a',priority:'P0-Integrity',impact_evidence:'repo-measured'},{id:'P0-b',priority:'P0-Safety',impact_evidence:'assumed'}],capabilities:[{id:'A',priority:'P0-Safety',qualification_current:true},{id:'B',priority:'P0-Safety',qualification_current:false}]});
 assert.deepEqual(metricKeys.map(k=>m.metrics[k].value),[50,50,5,50,50,50,50,50,50,1]);assert.equal(m.raw.observations.length,16);assert.equal(m.metrics.false_success_rate_pct.denominator,2);assert.equal(m.metrics.discovery_recall_multilingual_pct.denominator,2);assert.equal(m.alerts[0].code,'FALSE_SUCCESS');
});
test('T30 honesty, P0 violations and discovery truth are never hidden by averages',()=>{
 const m=calculateMetrics({...ctx,observations:[row('honesty',{status:'PASS'}),row('honesty',{status:'FAIL'}),...Array.from({length:99},()=>row('behavioral',{status:'PASS'})),row('behavioral',{status:'FAIL',p0_safety:true}),row('discovery',{non_english:true,outcome:'NO_SKILL_MATCH'}),row('discovery_accuracy',{status:'FAIL'})]});
 assert.equal(m.behavioral.value,99);assert.equal(m.honesty.value,50);assert.equal(m.metrics.discovery_recall_multilingual_pct.value,100);assert.equal(m.discovery_accuracy.value,0);assert(m.alerts.some(x=>x.code==='P0_SAFETY_VIOLATION'));assert(m.alerts.some(x=>x.code==='HONESTY_FAILURE'));
});
test('T32 SARIF, JSON, MD and metrics CSV preserve identifiers, hashes and absent status',()=>{
 const source={project:'project-a',candidate_hash:'sha256:'+'a'.repeat(64),items:[{id:'SEC-001',status:'NOT_RUN',source_path:'policies/security.yaml',source_hash:'sha256:'+'b'.repeat(64),evidence:[]}],changes:[],capabilities:[],audit:[],metrics:calculateMetrics(ctx),evidence:[{id:'VR-1',status:'failed'}],limitations:['Draft only']};
 const sarif=JSON.parse(exportReport('compliance','sarif',source).content);assert.equal(sarif.version,'2.1.0');assert.equal(sarif.runs[0].results[0].ruleId,'SEC-001');assert.equal(sarif.runs[0].results[0].properties.source_hash,source.items[0].source_hash);
 assert.equal(JSON.parse(exportReport('compliance','json',source).content).candidate_hash,source.candidate_hash);assert.match(exportReport('compliance','md',source).content,/SEC-001/);assert.equal(exportReport('metrics','csv',source).content.split('\r\n').length,11);assert.throws(()=>exportReport('audit','sarif',source));
});
test('T30 actual NO_SKILL_MATCH response still contributes to multilingual recall, without claiming an accuracy oracle',()=>{
 const project={id:'project-a',host:'local',host_version:'v1',scope:'p/**'};
 const data={runs:[{id:'VR-AR',finished_at:'2026-10-24',raw_output:JSON.stringify({host:'local',project_scope:'p/**',operation:'select',discovery_request:{query_supplied:true,non_english:true},result:{status:'NO_SKILL_MATCH',selected:[]}}),summary_json:JSON.stringify({studio_skill:{view:{host_version:'v1',state:{state:'NO_SKILL_MATCH'}},status:'passed'}})}]};
 const observations=projectObservations(data,project),m=calculateMetrics({...ctx,observations});assert.equal(m.metrics.discovery_recall_multilingual_pct.value,100);assert.equal(m.metrics.discovery_recall_multilingual_pct.denominator,1);assert.equal(m.discovery_accuracy.value,null);
 assert.equal(projectObservations(data,{...project,scope:'different/**'}).length,0);
});
test('T30 historical host versions are taken from original execution/lifecycle receipts, never relabeled to current',()=>{
 const project={id:'project-a',host:'local',host_version:'v1',scope:'p/**'},identity={host:'local',host_version:'v0',scope:'p/**'};
 const records=Array.from({length:3},(_,i)=>({operation:'execute',run_id:'OLD-'+i,identity}));
 const data={runs:[{id:'VR-OLD',finished_at:'2026-10-24',raw_output:JSON.stringify({run_id:'VR-OLD',scope:'p/**',status:'PASS',outputs:[{behavioral_evals:[{id:'old',status:'PASS'}]}],records})},{id:'VR-OLD-SKILL',finished_at:'2026-10-24',raw_output:JSON.stringify({host:'local',project_scope:'p/**',operation:'eval',result:{status:'PASS'}}),summary_json:JSON.stringify({studio_skill:{status:'passed',view:{host_version:'v0'}}})}]};
 const observations=projectObservations(data,project);assert(observations.length>0);assert(observations.every(o=>o.version==='v0'));const current=calculateMetrics({...ctx,observations});assert.equal(current.metrics.skill_eval_pass_rate_pct.value,null);assert.equal(current.metrics.eval_pass_rate_pct.value,null);
 assert.equal(calculateMetrics({...ctx,version:'v0',observations}).metrics.skill_eval_pass_rate_pct.value,100);
});
test('T30 a referenced execution beyond the observation window is unknown; explicit missing execution remains false success',()=>{
 const project={id:'project-a',host:'local',host_version:'v1',scope:'p/**'};
 const run=(id,reference)=>({id,finished_at:'2026-10-24',raw_output:JSON.stringify({host:'local',project_scope:'p/**',operation:'verify',result:{state:'VERIFIED',verified:true,execution:'EXECUTED',...(reference?{execution_run_id:reference}:{})}}),summary_json:JSON.stringify({studio_skill:{status:'passed',view:{host_version:'v1'}}})});
 let observations=projectObservations({runs:[run('VR-OLD','EXEC-BEYOND-WINDOW')]},project),m=calculateMetrics({...ctx,observations});assert.equal(m.metrics.false_success_rate_pct.value,null);assert.equal(m.metrics.false_success_rate_pct.excluded_unobservable,1);assert.equal(observations[0].reason,'EXECUTION_OUTSIDE_OBSERVATION_WINDOW');
 observations=projectObservations({runs:[run('VR-FALSE',null)]},project);m=calculateMetrics({...ctx,observations});assert.equal(m.metrics.false_success_rate_pct.value,100);assert.equal(m.alerts[0].code,'FALSE_SUCCESS');
});
test('T30 live qualified P0 capabilities count for the exact host/project tuple; qualified historical labels cannot restore them',()=>{
 const project={id:'project-a',host:'local',host_version:'v1',scope:'p/**'},task={skill_id:'skill-a',host:'local',qualification:{status:'QUALIFIED',record:{hostVersion:'v1',scope:'p/**'},historical:{hostVersion:'v1',scope:'p/**',contentHash:'sha256:a',driverHash:'sha256:b'}}};
 // Adapter unit fixture, not host execution evidence. The production supplier
 // is the existing lifecycle service, whose private E4 contexts derive status.
 const data={runs:[],audit:[],changes:[]},store={phase5Settings:()=>null,phase5Data:()=>data,phase5Snapshots:()=>[]},catalog={readSetHash:'a'.repeat(64),views:[],capabilities:[{item_id:'CAP-A',capability:{skillId:'skill-a',defaultTier:'P0-Safety'},content_hash:'sha256:c'}]};
 const service=createPhase5Service({store,catalog,authority:{applyRoleBindings(){}},ownerActor:'owner',project,phase4:{status:()=>({})},skills:{inventory:()=>({tasks:[task]})},clock:()=>Date.parse('2026-10-24T00:00:00Z')});
 let m=service.current();assert.equal(m.metrics.skill_qualification_coverage_pct.value,100);assert.equal(m.metrics.qualification_drift_count.value,0);assert.equal(m.metrics.skill_qualification_coverage_pct.evidence[0].id,'CAP-A');
 task.qualification.status='NOT_RUN';task.qualification.historical.hostVersion='v0';m=service.current();assert.equal(m.metrics.skill_qualification_coverage_pct.value,0);assert.equal(m.metrics.qualification_drift_count.value,1);
 task.qualification.historical.scope='other/**';assert.equal(service.current().metrics.qualification_drift_count.value,null);
});
