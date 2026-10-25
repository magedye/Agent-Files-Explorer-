// Test-only bridge. Never imported by Studio routes or offered as a user mode.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {repository,engineRoot,sourceHash,verifySource,decodeResult} from '../../server/studio/aghr/cli-bridge.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const supportPaths=['.t06/mock-public.pem','.t06/mock-evidence.json','.t06/source-attestation.json'];

export function verifyMockFixture(root,pin) {
 if(pin.profile!=='T06_MOCK_ONLY'||pin.fixture_id!=='OWNER_AUTHORIZED_SEC001_MOCK_20261023')throw Error('MOCK_PROFILE_REQUIRED');
 const parent=path.join(repository,'governance_packages/candidates/AGHR_T06_SEC001_Candidate');
 const relative=path.relative(parent,root);
 if(!relative||path.isAbsolute(relative)||relative.startsWith('..'))throw Error('MOCK_ROOT_OUTSIDE_CANDIDATE');
 let current=parent;for(const part of relative.split(path.sep)){current=path.join(current,part);if(fs.lstatSync(current).isSymbolicLink())throw Error('MOCK_REPARSE_POINT');}
 const read=name=>{let p=root;for(const part of name.split('/')){p=path.join(p,part);const st=fs.lstatSync(p);if(st.isSymbolicLink()||st.size>1024*1024)throw Error('MOCK_SOURCE_UNSAFE');}return fs.readFileSync(p);};
 const pub=read(supportPaths[0]),receiptRaw=read(supportPaths[1]),source=read('policies/security/secrets.yaml');
 if(sha(pub)!==pin.public_key_sha256||sha(receiptRaw)!==pin.receipt_sha256||sha(source)!==pin.source_sha256)throw Error('MOCK_BINDING_MISMATCH');
 const receipt=JSON.parse(receiptRaw),payload=Buffer.from(receipt.payload_base64,'base64');
 if(receipt.profile!=='T06_MOCK_ONLY'||!crypto.verify(null,payload,pub,Buffer.from(receipt.signature_base64,'base64')))throw Error('MOCK_SIGNATURE_INVALID');
 const value=JSON.parse(payload);
 if(value.profile!==pin.profile||value.fixture_id!==pin.fixture_id||value.item_id!=='SEC-001'||value.item_path!=='policies/security/secrets.yaml'||value.source_sha256!==pin.source_sha256||value.gate_state!=='PRESENT_IN_SIMULATED_HOST'||JSON.stringify(value.gate)!==JSON.stringify(pin.gate)||value.production_qualification!=='NOT_GRANTED'||value.native_enforcement!=='NOT_RUN')throw Error('MOCK_PAYLOAD_MISMATCH');
 if(value.profile!==pin.profile)throw Error('MOCK_PROFILE_REQUIRED');
 for(const key of ['source','level','owner','approved_by']){const field=key==='source'?'authority_source':key;if(value[field]!==pin.authority[key])throw Error('MOCK_AUTHORITY_BINDING_MISMATCH');}
 return {profile:'T06_MOCK_ONLY',fixture_id:pin.fixture_id,as_of:pin.as_of,engine_hash:sourceHash,public_key_sha256:pin.public_key_sha256,receipt_sha256:pin.receipt_sha256,owner_directive_sha256:pin.owner_directive_sha256,gate:pin.gate,
  grant:{item_path:value.item_path,source_sha256:value.source_sha256,authority_source:value.authority_source,level:value.level,owner:value.owner,approved_by:value.approved_by,evidence_ref:'T06_MOCK_ONLY:.t06/mock-evidence.json',item_ids:['SEC-001']},support_hashes:Object.fromEntries(supportPaths.map(name=>[name,sha(read(name))]))};
}

export async function runMockValidation({python,root,pin}) {
 const host=verifyMockFixture(root,pin);verifySource();
 const launcher=path.join(repository,'server/studio/aghr/read-only-launcher.py'),adapter=path.join(repository,'tools/t06/mock_engine.py');
 const args=['-I','-B','-S','-X','utf8',launcher,adapter,'--engine-root='+engineRoot,'validate','--strict'];
 const startedAt=new Date().toISOString();
 const capture=await new Promise((resolve,reject)=>{
  const env=Object.fromEntries(['SystemRoot','WINDIR','SYSTEMDRIVE'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  const child=spawn(python,args,{cwd:root,shell:false,windowsHide:true,env,stdio:['pipe','pipe','pipe']});
  const out=[],err=[];let bytes=0,failure;
  const timer=setTimeout(()=>{failure=Error('MOCK_TIMEOUT');child.kill();},30000);
  const collect=list=>b=>{bytes+=b.length;if(bytes>16*1024*1024){failure=Error('MOCK_OUTPUT_LIMIT');child.kill();}else list.push(b);};
  child.stdout.on('data',collect(out));child.stderr.on('data',collect(err));child.stdin.on('error',()=>{});
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);if(failure)reject(failure);else resolve({code,stdout:Buffer.concat(out).toString('utf8'),stderr:Buffer.concat(err).toString('utf8')});});
  child.stdin.end(JSON.stringify(host));
 });
 verifySource();verifyMockFixture(root,pin);
 const result=decodeResult(capture.stdout,capture.stderr,capture.code,'validate');
 if(!result.report.checks.reason?.startsWith('T06_MOCK_ONLY:'))throw Error('MOCK_SCOPE_LABEL_REQUIRED');
 return {...result,profile:'T06_MOCK_ONLY',startedAt,finishedAt:new Date().toISOString(),invocation:{executable:python,args,cwd:root,shell:false,adapter_sha256:sha(fs.readFileSync(adapter)),bridge_sha256:sha(fs.readFileSync(new URL(import.meta.url))),host_fixture:host}};
}
