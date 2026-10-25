import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawn} from 'node:child_process';
test('E5 Python RFC8785, exact payload, strict E2, edit schema and approval binding',async()=>{
 const child=spawn(path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),['-I','-B','-S','-X','utf8',path.resolve('server/studio/aghr/read-only-launcher.py'),path.resolve('tests/helpers/e5_core_cases.py'),process.cwd()],{windowsHide:true});
 let log='';child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
 const timer=setTimeout(()=>child.kill(),60000);
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});clearTimeout(timer);
 assert.equal(code,0,log);assert.match(log,/Ran 7 tests/);
});
