import fs from 'node:fs';
import {spawn} from 'node:child_process';
const steps=[['--test','--test-concurrency=1','tests/studio_ci_publisher.test.mjs','tests/studio_ci_parity.test.mjs','tests/studio_e5_lifecycle.test.mjs','tests/studio_phase3_skills.test.mjs'],['tools/t36/api.mjs']],results=[];
// Additional actual scenarios selected from the initial uncovered files. This
// does not erase the first run's T26/T27 failures or change its evidence.
for(const args of steps){const child=spawn(process.execPath,args,{stdio:'inherit',windowsHide:true});const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});results.push({args,exit_code:code});}
fs.writeFileSync('docs/evidence/studio-t37-2026-10-25/COVERAGE_SUPPLEMENT.json',JSON.stringify({at:new Date().toISOString(),inherited_failed_run:'COVERAGE_RUN.json',source:'Same unchanged T36V3 backend',steps:results},null,2)+'\n');if(results.some(r=>r.exit_code!==0))process.exitCode=1;
