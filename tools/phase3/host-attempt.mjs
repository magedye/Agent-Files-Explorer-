import fs from 'node:fs';
import path from 'node:path';
import {createJobRunner} from '../../server/studio/aghr/job-runner.js';
import {out} from './prepare.mjs';
const dir=fs.mkdtempSync(path.resolve('temp/phase3-native-'));fs.mkdirSync(dir+'/state');fs.mkdirSync(dir+'/project');
const input=dir+'/input.json';fs.writeFileSync(input,JSON.stringify({state:dir+'/state',cwd:dir+'/project',binary:'C:/Users/Majed/.vscode/extensions/openai.chatgpt-26.1002.51308-win32-x64/bin/windows-x86_64/codex.exe'}));
const runner=createJobRunner({python:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe')});
const result=await runner.run('check',{executable:path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),args:['-I','-B','-S','-X','utf8',path.resolve('tools/phase3/host-attempt.py'),input],cwd:dir,maxOutputBytes:65536});
fs.writeFileSync(out+'/NATIVE_SINGLE_ATTEMPT.json',JSON.stringify({attempts:1,job:result,host:'codex',honesty:'REQUIRED / NOT_RUN / NOT_WAIVED',antigravity:'agy was absent in accepted previous observation; no installation attempted'},null,2),{flag:'wx'});console.log(JSON.stringify({status:result.status,exit_code:result.exit_code,output:result.stdout}));
