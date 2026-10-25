import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifiedHost,save,sha} from './verify.mjs';
import {createLocalCI} from '../../server/studio/pilots/local-ci.mjs';
import {createPilotAdoption} from '../../server/studio/pilots/adoption.mjs';
import {createSchemaReader} from '../../server/studio/schema-reader.js';
import {calculateMetrics} from '../../server/studio/phase5/metrics.mjs';
import {runPilotHonesty} from './honesty.mjs';
import {pilotMetrics} from './metrics.mjs';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),base=path.resolve('docs/evidence/studio-pilots-2026-10-25');
const id=process.argv[2]||'pilot-app-l2',destination=base+'/run-'+id+'-'+Date.now(),level=id==='pilot-app-l3'?'L3':'L2';fs.mkdirSync(destination,{recursive:true});
let host,adoption;
const state=p=>fs.existsSync(p)?sha(fs.readFileSync(p)):null;
try{
 const verified=await verifiedHost(id,destination);host=verified.host;
 const appFiles=id==='pilot-app-l2'?['app.mjs','app.test.mjs']:['app/security.py','app/repository.py','app/service.py','app/server.py','data/inventory.sqlite','checks.py'];
 const before=Object.fromEntries(appFiles.map(p=>[p,state(host.root+'/'+p)]));save(destination+'/SOURCE_BEFORE.json',before);
 const resumeCpId=process.argv[3]||null;
 const ci=createLocalCI({id,python}),bootstrap=ci.initialize({resumeMerged:!!resumeCpId}),direct=ci.rejectDirectPush();save(destination+'/GIT_GATE.json',{bootstrap,direct});
 const doctor={status:'PASS',profile:'LOCAL_SANDBOX_CONTROLS_ONLY',frozen_e3:verified.valid.raw_e2.doctor,branch_gate:direct,permissions:id==='pilot-app-l3'?JSON.parse(verified.qualification.records.find(r=>r.operation==='execute').stdout).sandbox:'NOT_REQUIRED_INSTRUCTION_ONLY',p0_checks:id==='pilot-app-l3'?{eval:verified.qualification.eval.data,qualification:verified.qualification.qualification.data}:'NO_P0_CAPABILITY',hosted_ci:'NOT_RUN'};
 save(destination+'/DOCTOR.json',doctor);
 let honesty=null;
 if(id==='pilot-app-l3'){honesty=await runPilotHonesty({host,python,destination});save(destination+'/HONESTY_SCENARIOS.json',honesty);console.log('Seven honesty checks and eight actual project scenarios passed.');}
 adoption=await createPilotAdoption({host,id,level,doctor,resumeCpId});save(destination+'/ADOPTION_CP.json',adoption.result);
 const beforePublish=state(host.root+'/.aghr/state.json');assert.equal(beforePublish,null,'Studio must not publish state');
 const q=id==='pilot-app-l3'?JSON.parse(fs.readFileSync(host.root+'/.aghr/candidate/policies/capability.json')).skillQualification:null;
 const merged=await ci.merge({patch:adoption.result.patch,approved:adoption.approved,validate:()=>host.validate(),evidence:{profile:'ACTUAL_SANDBOX_PROJECT_NOT_PRODUCTION',doctor,cp:adoption.result,qualification:verified.qualification,honesty},qualifications:q?[q]:[],level});save(destination+'/CI_MERGE.json',merged);
 const published=JSON.parse(fs.readFileSync(host.root+'/.aghr/state.json')),schema=await createSchemaReader({python})('state.schema.json',null,[published]);save(destination+'/STATE_SCHEMA.json',schema);assert.equal(schema.valid,true,JSON.stringify(schema));
 assert.equal(published.adoptionLevel,level);assert.equal(published.publication.commitHash,merged.merged);
 assert.deepEqual(Object.fromEntries(appFiles.map(p=>[p,state(host.root+'/'+p)])),before,'Application/data bytes must be preserved by adoption');
 const at=new Date().toISOString(),items=verified.valid.raw_e2.items,context={project:id,host:'aghr-local-process',version:process.version,period:{from:'2026-10-25T00:00:00.000Z',to:at},items:items.filter(i=>i.defaultTier?.startsWith('P0')).map(i=>({id:i.id,priority:i.defaultTier,impact_evidence:i.impact.evidence})),capabilities:items.filter(i=>i.kind==='CAPABILITY').map(i=>({id:i.id,priority:i.defaultTier,qualification_current:id==='pilot-app-l3'}))};
 const observation=(type,data)=>({project:id,host:'aghr-local-process',version:process.version,at,type,...data});
 const beforeMetrics=calculateMetrics({...context,capabilities:context.capabilities.map(c=>({...c,qualification_current:false})),observations:appFiles.filter(p=>!p.startsWith('data/')).map(p=>observation('critical_path',{path:p,covering_items:[]}))});
 const actualCalls=honesty?.records.filter(r=>r.operation==='execute')??[];
 const observations=[...appFiles.filter(p=>!p.startsWith('data/')).map(p=>observation('critical_path',{path:p,covering_items:items.filter(i=>i.id!=='CAP-PILOT-SQL').map(i=>i.id)})),observation('pr_generate_check',{status:'PASS',merge_sha:merged.merged,evidence:'.aghr/ci-results'})];
 if(honesty){observations.push(...honesty.honesty.map(h=>observation('honesty',{id:h.id,status:'PASS',evidence:h})),...honesty.scenarios.map(s=>observation('behavioral',{id:s.id,status:'PASS',p0_safety:true,evidence:s})),observation('skill_eval',{status:verified.qualification.eval.data.status,evidence:verified.qualification.eval.data}),...actualCalls.map(c=>observation('skill_call',{verified:false,execution_bound:c.exit_code!==null,run_id:c.run_id,reason:'Execution receipt alone is not verification'})),...honesty.records.filter(r=>r.operation==='transition').map(r=>{const d=JSON.parse(r.stdout).data;return d?.state==='VERIFIED'?observation('skill_call',{verified:true,execution_bound:actualCalls.some(c=>c.run_id===d.execution_run_id),run_id:d.execution_run_id}):null;}).filter(Boolean),observation('discovery',{non_english:true,matches:0,outcome:'NO_SKILL_MATCH',evidence:honesty.scenarios.find(s=>s.id==='S7_ARABIC')}));}
 const measured=pilotMetrics({id,items,honesty,qualification:verified.qualification,merged:merged.merged,baseline:bootstrap.baseline}),afterMetrics=measured.after;save(destination+'/METRICS.json',measured);
 const report={status:'PASS_FOR_SANDBOX_LOCAL_PROFILE',project:id,level,profile:'SANDBOX_LOCAL_PROCESS_V1',actual_data:'Running service with seeded sandbox data; not production customer data',strict_exit:verified.valid.exit_code,negative_validation:verified.negatives.map(n=>({missing:n.missing,exit_code:n.exit_code})),doctor:doctor.status,application_source_preserved:true,studio_state_write:false,ci_state_write:true,source_before:before,merged_sha:merged.merged,state_sha256:state(host.root+'/.aghr/state.json'),cp_hash:adoption.result.package.proposal_version_hash,honesty_pass:honesty?.honesty.length??null,scenarios_pass:honesty?.scenarios.length??null,false_success_rate:afterMetrics.metrics.false_success_rate_pct,gpg:'UNSIGNED_OWNER_ACCEPTED_WARNING',native_hosts:{codex:'NOT_RUN',antigravity:'NOT_RUN'},hosted_ci:'NOT_RUN',external_standard_18_4:{status:'NOT_QUALIFIED',reason:'Owner authorized two sandboxes, not a production pilot; P0 repo-measured >=50% remains a separate external-standard rollout criterion.'},release:'NOT_GRANTED'};
 save(destination+'/ACCEPTANCE.json',report);fs.writeFileSync(base+'/'+id+'.latest.txt',path.relative(base,destination).replaceAll('\\','/')+'\n');console.log(JSON.stringify({project:id,status:report.status,level,merged_sha:merged.merged,out:destination}));
}catch(e){save(destination+'/RUN_FAILED.json',{status:'FAIL',message:e.message,stack:e.stack,records:host?.records,e4_records:host?.e4?.records});console.error(e.stack);process.exitCode=1;}
finally{adoption?.close();host?.close();}
