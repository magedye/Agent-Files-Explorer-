// Owner-authorized T12 simulation. Never imported by application runtime.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {repository,engineRoot,sourceHash,verifySource,decodeResult} from '../../server/studio/aghr/cli-bridge.js';
export const profile='T12_OWNER_APPROVED_MOCK';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function verifyFixture(root,pin){
 if(pin.profile!==profile||pin.fixture_id!=='T12_47_OWNER_OVERRIDE_20261023')throw Error('MOCK_PROFILE_REQUIRED');
 const parent=path.join(repository,'governance_packages/candidates/AGHR_T12_Candidate'),relative=path.relative(parent,root);
 if(!relative||path.isAbsolute(relative)||relative.startsWith('..'))throw Error('MOCK_ROOT_INVALID');
 const read=name=>{let p=parent;for(const bit of [...relative.split(path.sep),...name.split('/')]){p=path.join(p,bit);const st=fs.lstatSync(p);if(st.isSymbolicLink()||st.isFile()&&st.size>1024*1024)throw Error('MOCK_SOURCE_UNSAFE');}return fs.readFileSync(p);};
 const pub=read('.t12/mock-public.pem'),raw=read('.t12/SourceGrant.json');
 if(sha(pub)!==pin.public_key_sha256||sha(raw)!==pin.receipt_sha256)throw Error('MOCK_BINDING_MISMATCH');
 const receipt=JSON.parse(raw),bytes=Buffer.from(receipt.payload_base64,'base64');
 if(receipt.profile!==profile||receipt.grant_label!=='OWNER_GRANTED_T12'||!crypto.verify(null,bytes,pub,Buffer.from(receipt.signature_base64,'base64')))throw Error('MOCK_SIGNATURE_INVALID');
 const data=JSON.parse(bytes),ids=new Set();
 if(data.profile!==profile||data.fixture_id!==pin.fixture_id||data.grant_label!=='OWNER_GRANTED_T12'||data.production_permission!=='NOT_GRANTED'||data.native_enforcement!=='NOT_RUN'||data.owner_directive_sha256!==pin.owner_directive_sha256||data.grants.length!==47)throw Error('MOCK_SCOPE_INVALID');
 for(const grant of data.grants){
  const id=grant.item_ids?.[0];if(grant.item_ids?.length!==1||!/^AGHR-0(0[1-9]|[1-3][0-9]|4[0-7])$/.test(id)||ids.has(id)||grant.item_path!==`policies/drafts/${id}.json`)throw Error('MOCK_GRANT_SET_INVALID');ids.add(id);
  const source=read(grant.item_path),item=JSON.parse(source);
  if(sha(source)!==grant.source_sha256||item.id!==id||grant.level!==item.authority.level||grant.owner!==item.authority.owner||grant.approved_by!==item.authority.approvedBy||grant.authority_source!==item.authority.source||grant.evidence_ref!==profile+':.t12/SourceGrant.json')throw Error('MOCK_POLICY_BINDING_MISMATCH');
 }
 if(JSON.stringify(Object.keys(data.gates).sort())!==JSON.stringify(['AGHR-004','AGHR-014','AGHR-016']))throw Error('MOCK_GATE_SET_INVALID');
 for(const [id,g]of Object.entries(data.gates))if(g.profile!==profile||g.path!==`policies/drafts/${id}.json`||g.gate_state!=='PRESENT_IN_SIMULATED_HOST'||JSON.stringify(g.gate)!==JSON.stringify({type:'human-approval',required:true}))throw Error('MOCK_GATE_INVALID');
 const expected={'aghr.json':pin.source_set?.['aghr.json'],...Object.fromEntries(data.grants.map(g=>[g.item_path,g.source_sha256]))};
 if(!pin.source_set||Object.keys(pin.source_set).length!==48||JSON.stringify(Object.keys(pin.source_set).sort())!==JSON.stringify(Object.keys(expected).sort()))throw Error('MOCK_SOURCE_SET_INVALID');
 for(const [name,hash]of Object.entries(expected))if(hash!==pin.source_set[name]||sha(read(name))!==hash)throw Error('MOCK_SOURCE_SET_INVALID');
 const files=[];const walk=dir=>{for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=dir+'/'+entry.name;if(entry.isSymbolicLink())throw Error('MOCK_SOURCE_UNSAFE');entry.isDirectory()?walk(name):files.push(name);}};
 for(const dir of ['capabilities','decisions','policies','profiles'])if(fs.existsSync(path.join(root,dir)))walk(dir);
 if(JSON.stringify(files.sort())!==JSON.stringify(Object.keys(expected).filter(p=>p!=='aghr.json').sort()))throw Error('MOCK_SOURCE_SET_INVALID');
 return {...data,source_set:pin.source_set,engine_hash:sourceHash,support_hashes:{'.t12/SourceGrant.json':sha(raw),'.t12/mock-public.pem':sha(pub)}};
}
export async function runMock({python,root,pin,command='validate'}){
 if(!['validate','lint'].includes(command))throw Error('MOCK_COMMAND_INVALID');
 const host=verifyFixture(root,pin);verifySource();
 const adapter=path.join(repository,'tools/t12/mock_engine.py'),launcher=path.join(repository,'server/studio/aghr/read-only-launcher.py');
 const args=['-I','-B','-S','-X','utf8',launcher,adapter,'--engine-root='+engineRoot,command,...(command==='validate'?['--strict']:[])];
 const startedAt=new Date().toISOString();
 const capture=await new Promise((resolve,reject)=>{
  const env=Object.fromEntries(['SystemRoot','WINDIR','SYSTEMDRIVE'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
  const child=spawn(python,args,{cwd:root,shell:false,windowsHide:true,env,stdio:['pipe','pipe','pipe']});
  const out=[],err=[];let bytes=0,failure;const timer=setTimeout(()=>{failure=Error('MOCK_TIMEOUT');child.kill();},45000);
  const collect=list=>b=>{bytes+=b.length;if(bytes>16*1024*1024){failure=Error('MOCK_OUTPUT_LIMIT');child.kill();}else list.push(b);};
  child.stdout.on('data',collect(out));child.stderr.on('data',collect(err));child.stdin.on('error',()=>{});
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);failure?reject(failure):resolve({code,stdout:Buffer.concat(out).toString('utf8'),stderr:Buffer.concat(err).toString('utf8')});});
  child.stdin.end(JSON.stringify(host));
 });
 verifySource();verifyFixture(root,pin);const result=decodeResult(capture.stdout,capture.stderr,capture.code,command);
 if(!result.report.checks.reason.startsWith(profile+':'))throw Error('MOCK_LABEL_REQUIRED');
 return {...result,profile,startedAt,finishedAt:new Date().toISOString(),invocation:{executable:python,args,cwd:root,shell:false,adapter_sha256:sha(fs.readFileSync(adapter)),bridge_sha256:sha(fs.readFileSync(new URL(import.meta.url)))}};
}
