import fs from 'node:fs';
import path from 'node:path';
import {createBridge} from '../../packaging/aghr-studio/aghr_studio/payload/server/studio/aghr/cli-bridge.js';
import {createJobRunner} from '../../packaging/aghr-studio/aghr_studio/payload/server/studio/aghr/job-runner.js';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),runner=createJobRunner({python}),out='docs/evidence/studio-t38-2026-10-25/RESOURCE_PROBE.json';let receipt;
const bridge=createBridge({python,jobRunner:{async run(...args){receipt=await runner.run(...args);fs.writeFileSync(out,JSON.stringify({profile:'COPIED_PAYLOAD_REAL_CLI_WITH_UNCHANGED_LIMITS',receipt},null,2)+'\n');return receipt;}}});
try{const r=await bridge.run('validate');console.log(JSON.stringify({status:r.report.result,exit_code:r.exitCode,reason:receipt.reason,duration_ms:receipt.duration_ms}));}catch(error){console.log(JSON.stringify({status:'FAIL',error:error.message,reason:receipt?.reason,duration_ms:receipt?.duration_ms}));process.exitCode=1;}
