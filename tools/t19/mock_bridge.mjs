// Explicit owner-authorized test tool. No application runtime imports this file.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {repository} from '../../server/studio/aghr/cli-bridge.js';
import {verifyE3,sourceHash as nativeHash} from '../../server/studio/aghr/bounded-validator.js';
import {createJobRunner} from '../../server/studio/aghr/job-runner.js';
export const profile='T19_OWNER_APPROVED_MOCK';
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=(root,name)=>{const absolute=path.resolve(root,name);if(!absolute.startsWith(path.resolve(root)+path.sep))throw Error('MOCK_UNSAFE_PATH');let p=path.resolve(root);for(const bit of name.split('/')){p=path.join(p,bit);if(fs.lstatSync(p).isSymbolicLink())throw Error('MOCK_UNSAFE_PATH');}const st=fs.statSync(absolute);if(!st.isFile()||st.size>1024**2)throw Error('MOCK_UNSAFE_FILE');return fs.readFileSync(absolute);};
export function verifyFixture(root,pin){
 verifyE3();if(pin.profile!==profile||pin.native_source_hash!==nativeHash)throw Error('MOCK_PROFILE_REQUIRED');
 for(const [name,hash]of Object.entries(pin.tools))if(sha(read(repository,name))!==hash)throw Error('MOCK_TOOL_DRIFT');
 for(const [name,hash]of Object.entries(pin.files))if(sha(read(root,name))!==hash)throw Error('MOCK_FIXTURE_DRIFT');
 const pub=read(root,'mock-public.pem'),payload=JSON.parse(read(root,'PROPOSAL.json')),parts={},hashes={};
 for(const name of ['SourceGrant','GitHubGate','EvalResult']){
  const raw=read(root,name+'.json'),e=JSON.parse(raw),bytes=Buffer.from(e.payload_base64,'base64');
  if(e.profile!==profile||!crypto.verify(null,bytes,pub,Buffer.from(e.signature_base64,'base64')))throw Error('MOCK_SIGNATURE_INVALID');
  const p=JSON.parse(bytes);if(p.profile!==profile||p.kind!==name||!isDeepStrictEqual(p.binding,pin.binding)||p.production_permission!=='NOT_GRANTED')throw Error('MOCK_RECEIPT_BINDING');parts[name]=p.value;hashes[name+'.json']='sha256:'+sha(raw);
 }
 const item=JSON.parse(payload.proposed_yaml),a=item.authority,g=parts.SourceGrant;
 if(item.id!=='SEC-001'||a.level!=='enterprise'||item.force!=='MUST_NOT'||item.severity!=='critical'||g.level!==a.level||g.owner!==a.owner||g.approved_by!==a.approvedBy||g.authority_source!==a.source||g.source_sha256!==sha(payload.proposed_yaml)||g.item_path!=='policies/drafts/proposal.yaml'||JSON.stringify(g.item_ids)!=='["SEC-001"]'||g.evidence_ref!==profile+':SourceGrant.json')throw Error('MOCK_SOURCE_BINDING');
 if(!isDeepStrictEqual(parts.GitHubGate.gate,item.enforcement.gate)||parts.GitHubGate.gate.type!=='github-branch-protection'||parts.GitHubGate.gate.required!==true||parts.GitHubGate.profile!==profile||parts.GitHubGate.observed_remotely!==false)throw Error('MOCK_GATE_BINDING');
 if(parts.EvalResult.profile!=='T19_MOCK_EVAL_EVIDENCE'||parts.EvalResult.status!=='PASS'||parts.EvalResult.executed!==false||parts.EvalResult.real_e4_status!=='NOT_RUN')throw Error('MOCK_EVAL_LABEL_REQUIRED');
 if(pin.binding.payload_sha256!==sha(JSON.stringify(payload)))throw Error('MOCK_PROPOSAL_BINDING');
 return {profile,binding:pin.binding,source:g,gate:parts.GitHubGate,eval:parts.EvalResult,receipt_hashes:hashes,production_permission:'NOT_GRANTED'};
}
export function createMockValidator({python,base,root,pin,native}){
 const runner=createJobRunner({python}),records=[];verifyFixture(root,pin);
 async function invoke(operation,payload,extra={}){
  const host=verifyFixture(root,pin),prepared=await native.prepare(payload);
  if(prepared.proposal_version_hash!==pin.binding.proposal_version_hash||!isDeepStrictEqual(base,pin.binding.base))throw Error('MOCK_PROPOSAL_BINDING');
  const raw=Buffer.from(JSON.stringify({operation,payload,base,host,mock_source_hash:pin.source_hash,...extra}));
  if(raw.length>262144)throw Error('MOCK_INPUT_LIMIT');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t19-mock-')),input=path.join(dir,'input.json');
  let job;try{
   fs.writeFileSync(input,raw,{flag:'wx'});
   job=await runner.run(operation,{executable:python,args:['-I','-B','-S','-X','utf8',path.join(repository,'server/studio/aghr/read-only-launcher.py'),path.join(repository,'tools/t19/mock_engine.py'),input],cwd:repository,maxOutputBytes:4*1024**2});
  }finally{if(fs.existsSync(input))fs.unlinkSync(input);fs.rmdirSync(dir);}
  verifyFixture(root,pin);const report=JSON.parse(job.stdout);
  if(report.protocol_version!=='3'||report.command!==operation||report.source?.content_hash!==pin.source_hash||report.exit_code!==job.exit_code||report.exit_code!=={READ:0,VALID:0,INVALID:1,ERROR:2,BLOCKED:3}[report.result]||job.active_processes_after!==0||job.started.hard_memory_bytes!==job.limits.memoryBytes||(job.started.limit_flags&0x2200)!==0x2200)throw Error('MOCK_FALSE_SUCCESS');
  const receipt={profile,operation,protocol_version:'3',engine_hash:pin.source_hash,input_hash:'sha256:'+sha(raw),stdout:job.stdout,stderr:job.stderr,exit_code:job.exit_code,limits:job.limits,started:job.started,active_processes_after:job.active_processes_after,duration_ms:job.duration_ms};
  records.push(receipt);if(!report.data){const error=Error(report.diagnostics[0]?.message||'MOCK_REJECTED');error.receipt=receipt;throw error;}return {data:report.data,receipt};
 }
 return {records,invoke,
  async check(payload){const r=await invoke('validate',payload);return {...r.data,resource_receipt:r.receipt};},
  doctorRun:payload=>invoke('doctor',payload),
  approvalRun:(payload,cp,decision,actor,requirements)=>invoke('approval',payload,{cp,decision,actor,requirements}),
  exportRun:(payload,cp,actor,requirements)=>invoke('export',payload,{cp,actor,requirements})};
}
