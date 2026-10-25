import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const out=path.resolve('docs/evidence/studio-e3-t19-2026-10-24/cli');fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(path.join(out,'RESULTS.json')))throw Error('Retain existing CLI evidence; choose a new delivery for a new run.');
const valid=JSON.parse(fs.readFileSync('docs/evidence/studio-e5-t16-preview-2026-10-23/VALID_INPUT.json','utf8'));
const sec=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_T06_SEC001_Candidate/complete/policies/security/secrets.json','utf8'));
const value=item=>({...valid,payload:{title:'E3 CLI',kind:item.kind,proposed_yaml:JSON.stringify(item)}});
const broken=structuredClone(sec);delete broken.authority.level;
const local=structuredClone(sec);local.enforcement.gate.type='studio-patch-secret-scanner-v1';
const cases=[['valid',['validate','--strict'],valid,0],['missing-authority',['validate','--strict'],value(broken),1],['canonical-sec001',['validate','--strict'],value(sec),3],['github-unobserved',['doctor'],value(sec),3],['real-local-gate',['doctor'],value(local),0],['generation',['generate'],{...valid,preview:{agent:'codex',profile:'draft-l1',dry_run:true}},0],['untrusted-grant',['validate','--strict'],{...valid,source_grants:[{level:'enterprise'}]},2],['unknown-command',['unknown'],valid,2]];
const results=[];
for(const [name,argv,input,expected]of cases){
 const filename=path.join(out,name+'.input.json');fs.writeFileSync(filename,JSON.stringify(input));
 const args=['tools/aghr_studio_cli.mjs',...argv,'--input='+filename];
 const c=spawn(process.execPath,args,{windowsHide:true});const stdout=[],stderr=[];c.stdout.on('data',b=>stdout.push(b));c.stderr.on('data',b=>stderr.push(b));const timer=setTimeout(()=>c.kill(),60000);const exit=await new Promise((r,j)=>{c.on('error',j);c.on('exit',r);});clearTimeout(timer);
 const raw=Buffer.concat(stdout),err=Buffer.concat(stderr);fs.writeFileSync(path.join(out,name+'.stdout.json'),raw);fs.writeFileSync(path.join(out,name+'.stderr.txt'),err);
 const report=JSON.parse(raw);assert.equal(exit,expected,name+': '+err);assert.equal(report.exit_code,expected);assert.equal(report.protocol_version,'3');
 if(expected===0)assert(report.source?.content_hash&&report.checks.status==='COMPLETE');
 results.push({name,invocation:{executable:process.execPath,args,shell:false},exit_code:exit,result:report.result,engine_hash:report.source.content_hash});
}
fs.writeFileSync(path.join(out,'RESULTS.json'),JSON.stringify({status:'PASS',cases:results,e4:'REQUIRED / NOT_RUN / NOT_WAIVED'},null,2)+'\n');console.log(JSON.stringify({status:'PASS',cases:results.length}));
