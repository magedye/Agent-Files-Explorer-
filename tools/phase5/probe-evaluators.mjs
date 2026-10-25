import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {registeredProject} from '../../server/studio/phase5/project.mjs';
import {createJobRunner} from '../../server/studio/aghr/job-runner.js';
const c=registeredProject(),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),runner=createJobRunner({python});
const root=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-project-eval-'));
const binding={run_id:'probe',scope:c.project.scope},item=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json'));
for(const [name,input]of [['measurement',{binding,item}],['meta',{binding,change:{files:[{path:'schemas/project-metadata.schema.json',content:JSON.stringify({type:'object',required:['name'],properties:{name:{type:'string'}},'x-aghr-examples':{valid:[{name:'project'}],invalid:[{}]}})}]}}]]){
 const p=path.join(root,name+'.json');fs.writeFileSync(p,JSON.stringify(input));
 const job=await runner.run('eval',{executable:python,args:['-I','-B','-S','-X','utf8',path.resolve('server/studio/aghr/read-only-launcher.py'),c.e4Config.skills[0].entry,p],cwd:path.resolve('.')});
 fs.writeFileSync('docs/evidence/studio-phase5-2026-10-24/PROBE_'+name.toUpperCase()+'.json',JSON.stringify(job,null,2),{flag:'wx'});
 console.log(name,job.exit_code,job.stdout.slice(0,500),job.stderr.slice(0,300));
}
