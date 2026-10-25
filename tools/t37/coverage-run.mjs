import fs from 'node:fs';
import {spawn} from 'node:child_process';
// An affected backend acceptance pass, not a claim that the whole historical
// suite was rerun. c8 --all includes every server JS/MJS file, including those
// not loaded here, at zero coverage. Python coverage is a separate unmeasured gate.
const files=['governance_studio.test.mjs','i18n.test.mjs','security.test.mjs','studio_write_authorization.test.mjs','studio_persistence.test.mjs','studio_catalog.test.mjs','studio_e4_discovery.test.mjs','studio_e4_evidence.test.mjs','studio_e4_results.test.mjs','studio_e4_honesty.test.mjs','studio_e5_core.test.mjs','studio_phase4_contracts.test.mjs','studio_phase4.test.mjs','studio_phase5_metrics.test.mjs','studio_phase5_evaluators.test.mjs','studio_phase5.test.mjs','studio_unified.test.mjs','studio_live_capability.test.mjs','studio_project_adoption_integrity.test.mjs'];
for(const file of files)if(!fs.existsSync('tests/'+file))throw Error('MISSING_TEST '+file);
const steps=[['--test','--test-concurrency=1',...files.map(p=>'tests/'+p)],['tools/t36/api.mjs']],results=[];
for(const args of steps){const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true});const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});results.push({args,exit_code:code});if(code!==0)break;}
fs.writeFileSync('docs/evidence/studio-t37-2026-10-25/COVERAGE_RUN.json',JSON.stringify({at:new Date().toISOString(),scope:'Every server JS/MJS file; unloaded included at0. Python NOT_MEASURED.',steps:results},null,2)+'\n');if(results.some(r=>r.exit_code!==0)||results.length!==steps.length)process.exitCode=1;
