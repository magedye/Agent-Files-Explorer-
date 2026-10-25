import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createCodexAdapter,createAntigravityAdapter} from '../../server/studio/hosts/native-adapters.mjs';
import {out} from './prepare.mjs';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const codex='C:/Users/Majed/.vscode/extensions/openai.chatgpt-26.1002.51308-win32-x64/bin/windows-x86_64/codex.exe';
const result={at:new Date().toISOString(),codex:{},antigravity:{},qualification:'NOT_RUN',honesty:'REQUIRED / NOT_RUN / NOT_WAIVED'};
const adapter=createCodexAdapter({python,binary:codex,cwd:process.cwd()});
for(const operation of ['version','help']){
 const saved=out+'/codex-'+operation+'.json';
 if(fs.existsSync(saved)){const r=JSON.parse(fs.readFileSync(saved,'utf8'));result.codex[operation]={status:r.job.status,exit_code:r.job.exit_code};continue;}
 const r=await adapter.run(operation);fs.writeFileSync(out+'/codex-'+operation+'.json',JSON.stringify({...r,receipt:undefined},null,2),{flag:'wx'});
 result.codex[operation]={status:r.job.status,exit_code:r.job.exit_code};
}
try{await adapter.run('discover');throw Error('Unexpected unisolated access');}catch(error){result.codex.discovery={status:'NOT_RUN',reason:error.message};}
result.codex.native_execution='NOT_RUN';
result.codex.gap='Installed CLI confirmed. An isolated authenticated native session is not configured; owner profile/authentication is not read, copied or changed. Metadata/help cannot qualify native skill execution.';
let agy='';try{agy=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-Command agy -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source'],{encoding:'utf8',windowsHide:true}).trim();}catch(error){if(error.status!==1||error.stdout?.length||error.stderr?.length)throw error;}
result.antigravity={desktop_found:fs.existsSync('C:/Users/Majed/AppData/Local/Programs/Antigravity/Antigravity.exe'),headless_cli:agy||null,native_execution:'NOT_RUN',gap:'Desktop installation is not the documented agy headless channel. No agy runtime/isolated authenticated session is configured.'};
const anti=createAntigravityAdapter({python,binary:agy||null,cwd:process.cwd()});
if(!agy)try{await anti.run('execute',{prompt:'noop'});}catch(error){result.antigravity.rejection=error.message;}
fs.writeFileSync(out+'/NATIVE_HOST_RESULTS.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
