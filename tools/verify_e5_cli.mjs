import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const out=path.resolve('docs/evidence/studio-e5-t16-preview-2026-10-23/cli');fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const engine='governance_packages/candidates/AGHR_rc3_Core_Candidate',pin=JSON.parse(fs.readFileSync('docs/evidence/studio-e2-2026-10-22/SOURCE_PIN.json'));
const source=()=>Object.fromEntries(Object.keys(pin.files).map(p=>[p,sha(fs.readFileSync(engine+'/'+p))]));
const before=source();assert.deepEqual(before,pin.files);
const request=JSON.parse(fs.readFileSync('docs/evidence/studio-e5-t16-preview-2026-10-23/VALID_INPUT.json','utf8'));
const policy=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_T12_Candidate/policies/drafts/AGHR-001.json','utf8'));
const value=item=>({...request,payload:{title:'CLI fixture',kind:item.kind,proposed_yaml:JSON.stringify(item)}});
const missing=structuredClone(policy);delete missing.authority.level;
const noScope=structuredClone(policy);delete noScope.scope;
const cases=[['hash',['change-hash'],request,0,'READ'],['strict-valid',['validate','--strict'],request,0,'VALID'],['lint-valid',['lint'],request,0,'VALID'],['missing-authority',['validate','--strict'],value(missing),1,'INVALID'],['missing-scope',['validate','--strict'],value(noScope),1,'INVALID'],['unverified-authority',['validate','--strict'],value(policy),3,'BLOCKED'],['unsupported',['doctor'],request,2,'ERROR'],['invalid-json',['validate','--strict'],'{',1,'INVALID']];
const results=[];
for(const [name,args,input,exit,result]of cases){
 const raw=typeof input==='string'?input:JSON.stringify(input),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
 const argv=['-I','-B','-S','-X','utf8',path.resolve('server/studio/aghr/read-only-launcher.py'),path.resolve('server/studio/aghr/e5/cli.py'),...args];
 const c=spawn(python,argv,{windowsHide:true,env:Object.fromEntries(['SystemRoot','WINDIR','SYSTEMDRIVE'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]))});
 const stdout=[],stderr=[];c.stdout.on('data',b=>stdout.push(b));c.stderr.on('data',b=>stderr.push(b));c.stdin.end(raw);
 const timer=setTimeout(()=>c.kill(),30000);const code=await new Promise((r,j)=>{c.on('error',j);c.on('exit',r);});clearTimeout(timer);
 const output=Buffer.concat(stdout),error=Buffer.concat(stderr);fs.writeFileSync(path.join(out,name+'.input.json'),raw);fs.writeFileSync(path.join(out,name+'.stdout.json'),output);fs.writeFileSync(path.join(out,name+'.stderr.txt'),error);
 const report=JSON.parse(output);assert.equal(code,exit,name+': '+error);assert.equal(report.exit_code,exit);assert.equal(report.result,result);assert.equal(report.protocol_version,'3');assert.equal(report.source.content_hash,sha(fs.readFileSync('server/studio/aghr/e5/EXTENSION.lock.json')));
 results.push({name,command:args,exit_code:code,result,stdout_sha256:sha(output),stderr_bytes:error.length,source:report.source});
}
assert.deepEqual(source(),before);fs.writeFileSync(path.join(out,'RESULTS.json'),JSON.stringify({status:'PASS',cases:results,source_files_unchanged:46,e4:'REQUIRED / NOT_RUN / NOT_WAIVED'},null,2)+'\n');console.log(JSON.stringify({status:'PASS',cases:results.length}));
