import fs from 'node:fs';
import path from 'node:path';
import {createCodexAdapter} from '../../server/studio/hosts/native-adapters.mjs';
import {out} from './prepare.mjs';
const root=fs.mkdtempSync(path.resolve('temp/native-codex-')),state=path.join(root,'state'),cwd=path.join(root,'project');fs.mkdirSync(state);fs.mkdirSync(cwd);
const dir=path.join(cwd,'.agents/skills/aghr-native-probe');fs.mkdirSync(dir,{recursive:true});const skillPath=path.join(dir,'SKILL.md');
fs.writeFileSync(skillPath,'---\nname: aghr-native-probe\ndescription: AGHR isolated native observation probe.\n---\nRead probe.txt using an available read-only tool, then return its exact text. Do not write files, use the network or launch other agents.\n');
fs.writeFileSync(path.join(cwd,'probe.txt'),'AGHR_NATIVE_READ_PROBE_20261024\n');
const adapter=createCodexAdapter({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),binary:'C:/Users/Majed/.vscode/extensions/openai.chatgpt-26.1002.51308-win32-x64/bin/windows-x86_64/codex.exe',cwd,stateDirectory:state,isolated:true,skill:{name:'aghr-native-probe',path:skillPath}});
const results={at:new Date().toISOString(),cwd,state_directory:state,environment_overrides:false,existing_thread_access:false,native_qualification:'NOT_RUN'};
for(const operation of ['discover','execute']){
 try{
  const r=await adapter.run(operation,{prompt:'$aghr-native-probe Read probe.txt with a read-only tool as instructed. Do not write, access the network, or start any other agents.'});
  const observation=adapter.observation(r.receipt);fs.writeFileSync(out+'/codex-live-'+operation+'.json',JSON.stringify(observation,null,2),{flag:'wx'});results[operation]={status:r.job.status,exit_code:r.job.exit_code,turn_completed:observation.turn_completed,skill_execution:observation.skill_execution};
  if(r.job.status!=='passed')break;
 }catch(error){results[operation]={status:'ENVIRONMENT_BLOCKED',reason:error.message};break;}
}
fs.writeFileSync(out+'/CODEX_LIVE_RESULTS.json',JSON.stringify(results,null,2),{flag:'wx'});console.log(JSON.stringify(results));
