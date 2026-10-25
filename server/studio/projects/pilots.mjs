import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {repository} from '../aghr/cli-bridge.js';

const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const anchor='docs/evidence/studio-pilots-2026-10-25/CUSTODY.lock.json';
const anchorHash='5cd10dd298c7e468b601d580dba5aa8b05e57da03a450231098b9d649cf5e7bd';
const ids=['pilot-app-l2','pilot-app-l3'];
function read(root,relative){
 if(typeof relative!=='string'||relative.includes('\\')||relative.startsWith('/')||relative.split('/').some(s=>!s||s==='.'||s==='..')||relative.includes(':'))throw Error('PILOT_PATH_UNSAFE');
 let p=root;for(const part of relative.split('/')){p=path.join(p,part);if(fs.lstatSync(p).isSymbolicLink())throw Error('PILOT_REPARSE_POINT');}
 const stat=fs.statSync(p);if(!stat.isFile()||stat.size>4*1024*1024)throw Error('PILOT_FILE_UNSAFE');return fs.readFileSync(p);
}
// The trust root is the exact accepted parent receipt, never an HTTP-supplied key.
export function verifyPublishedReceipt(publicBytes,expectedHash,readSource){
 if(digest(publicBytes)!==expectedHash)throw Error('PILOT_RECEIPT_DRIFT');
 const r=JSON.parse(publicBytes),payload=r.signed_receipt.payload,p=JSON.parse(payload);
 if(r.profile!=='SANDBOX_LOCAL_CI_V1'||p.profile!==r.profile||p.project!==r.public_trust.project||!crypto.verify(null,Buffer.from(payload),r.public_trust.public_key,Buffer.from(r.signed_receipt.signature,'base64')))throw Error('PILOT_SIGNATURE_INVALID');
 if(!ids.includes(p.project)||!['L2','L3'].includes(p.level))throw Error('PILOT_PROFILE_INVALID');
 const raw=readSource('.aghr/state.json'),state=JSON.parse(raw);
 if(digest(raw)!==r.state_sha256||JSON.stringify(state)!==JSON.stringify(r.published_state)||state.publication?.publisher!=='ci'||state.publication.commitHash!==p.merge_sha||state.adoptionLevel!==p.level||state.publication.ciRunRef!=='local-git-ci:'+p.run_id||Date.parse(state.publication.publishedAt)>p.expires)throw Error('PILOT_STATE_UNVERIFIED');
 for(const [file,hash]of Object.entries(p.files))if(digest(readSource(file))!==hash)throw Error('PILOT_SOURCE_DRIFT '+file);
 if(digest(readSource(p.evidence.path))!==p.evidence.sha256||Object.values(p.checks).some(s=>s!=='PASS'))throw Error('PILOT_CI_EVIDENCE_INVALID');
 return {receipt:r,payload:p,state};
}
export function createPilotCatalog(){
 const lockBytes=fs.readFileSync(path.join(repository,anchor));if(digest(lockBytes)!==anchorHash)throw Error('PILOT_TRUST_ANCHOR_DRIFT');
 const lock=JSON.parse(lockBytes),records=new Map();
 for(const id of ids){
  const root=path.join(repository,id);if(fs.lstatSync(root).isSymbolicLink())throw Error('PILOT_ROOT_UNSAFE');
  const locator=`docs/evidence/studio-pilots-2026-10-25/public-ci/${id}.json`,bytes=read(repository,locator);
  const verified=verifyPublishedReceipt(bytes,lock.files[locator].sha256,relative=>read(root,relative));
  const {payload,state}=verified,manifest=JSON.parse(read(root,'.aghr/package/aghr.json'));
  const sources=Object.keys(payload.files).filter(p=>p.startsWith('.aghr/package/policies/')&&p.endsWith('.json')).sort().map(p=>({path:p,bytes:read(root,p)}));
  const at=state.publication.publishedAt,workspace={id,name:manifest.name,package_path:path.join(root,'.aghr/package'),package_version:manifest.version,schema_version:'1.2',read_only:true,package_signature_verified:false,created_at:at,last_scanned_at:at};
  const project={id,workspace_id:id,name:id,path:root,host:'aghr-local-process',host_version:payload.qualifications[0]?.hostVersion||null,instruction_level:state.domainLevels.instructions,skill_level:state.domainLevels.skills,git_commit_sha:payload.merge_sha,last_scanned_at:at};
  const views=sources.map(s=>{const item=JSON.parse(s.bytes);return {item,source_path:s.path,source_hash:'sha256:'+digest(s.bytes),source_yaml:s.bytes.toString('utf8'),validation_status:'NOT_RUN',diagnostics:[],translation_unavailable:true,is_review_due:null,priority_tier:item.defaultTier||null,issuer_trust:{status:'UNKNOWN',evidence:[],reason:'Historical sandbox CI is verified; no package signing identity or fresh strict run is asserted.'}};});
  const prEvidence=JSON.parse(read(root,payload.evidence.path)),historicalCp=prEvidence.cp?.package;
  if(!historicalCp||historicalCp.proposal_version_hash!==payload.proposal_version_hash||historicalCp.workspace_id!==id||historicalCp.status!=='exported')throw Error('PILOT_CP_PROVENANCE_INVALID');
  records.set(id,{workspace,project,views,state,manifest,payload,historicalCp,receipt_path:locator,receipt_hash:'sha256:'+digest(bytes),receipt_bytes:bytes.length,root});
 }
 return {list:()=>[...records.values()],get:id=>records.get(id)||null,recheck(){return createPilotCatalog();}};
}
