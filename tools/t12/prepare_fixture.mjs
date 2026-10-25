// Explicit owner-authorized simulation only. Never imported by Studio runtime.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {repository} from '../../server/studio/aghr/cli-bridge.js';
const out=path.join(repository,'docs/evidence/studio-t12-mock-write-core-2026-10-23');
const original=path.join(repository,'governance_packages/candidates/AGHR_T12_Candidate');
const root=path.join(original,'owner-approved-mock');
if(fs.existsSync(root))throw Error('Preserve existing mock fixture');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');};
const profile='T12_OWNER_APPROVED_MOCK',pin=read(path.join(repository,'docs/evidence/studio-t12-2026-10-23/CANDIDATE_FINAL_PIN.json'));
for(const [name,info]of Object.entries(pin)){
 const bytes=fs.readFileSync(path.join(original,name));if(sha(bytes)!==info.sha256)throw Error('Original draft drift');
 fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),bytes);
}
const directive={profile,grant_label:'OWNER_GRANTED_T12',source:'Explicit owner message authorizing this simulation and conditional T12 closure',scope:'47-rule T12 fixture only; not real backend write authority',mock_E3_ids:['AGHR-004','AGHR-014','AGHR-016'],production_permission:'NOT_GRANTED'};
write(path.join(out,'OWNER_DIRECTIVE.json'),directive);
const provenance=read(path.join(root,'drafting/FIELD_PROVENANCE.json'));const grants=[],gates={},changes=[];
for(let i=1;i<=47;i++){
 const id=`AGHR-${String(i).padStart(3,'0')}`,name=`policies/drafts/${id}.json`,item=read(path.join(root,name)),before=structuredClone(item.authority);
 item.authority.source='.t12/SourceGrant.json';
 if(['MUST','MUST_NOT'].includes(item.force)){item.authority.status='active';item.authority.approvedBy='OWNER_T12_OVERRIDE';}
 write(path.join(root,name),item);
 for(const key of ['source','status','approvedBy'])if(item.authority[key]!==before[key])provenance.items[id].fields['/authority/'+key]={value:item.authority[key],previous_value:before[key],status:profile,basis:'OWNER_GRANTED_T12: fixture-only override, not production approval'};
 provenance.items[id].item_sha256=sha(fs.readFileSync(path.join(root,name)));provenance.items[id].simulation=profile;
 grants.push({item_path:name,source_sha256:provenance.items[id].item_sha256,authority_source:item.authority.source,level:item.authority.level,owner:item.authority.owner,approved_by:item.authority.approvedBy,evidence_ref:profile+':.t12/SourceGrant.json',item_ids:[id]});
 if(item.force==='MUST_NOT')gates[id]={path:name,gate:item.enforcement.gate,gate_state:'PRESENT_IN_SIMULATED_HOST',profile};
 changes.push({id,before,after:item.authority,scope:profile});
}
provenance.simulation=profile;write(path.join(root,'drafting/FIELD_PROVENANCE.json'),provenance);
const payload={profile,grant_label:'OWNER_GRANTED_T12',fixture_id:'T12_47_OWNER_OVERRIDE_20261023',as_of:'2026-10-23',owner_directive_sha256:sha(fs.readFileSync(path.join(out,'OWNER_DIRECTIVE.json'))),grants,gates,native_enforcement:'NOT_RUN',production_permission:'NOT_GRANTED'};
const bytes=Buffer.from(JSON.stringify(payload)),{publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');
const pub=publicKey.export({format:'pem',type:'spki'});
write(path.join(root,'.t12/SourceGrant.json'),{profile,grant_label:'OWNER_GRANTED_T12',payload_base64:bytes.toString('base64'),signature_base64:crypto.sign(null,bytes,privateKey).toString('base64')});
fs.writeFileSync(path.join(root,'.t12/mock-public.pem'),pub);
write(path.join(root,'PACKAGE_STATUS.json'),{status:'OWNER_APPROVED_MOCK_ONLY',profile,rules:47,mandatory_authority_active:44,production_permission:'NOT_GRANTED',real_backend_authorization:'NOT_GRANTED',reference_promotion:'NOT_AUTHORIZED'});
fs.writeFileSync(path.join(root,'README.md'),'# T12 owner-approved mock\n\nT12_OWNER_APPROVED_MOCK / OWNER_GRANTED_T12. 47 rules; 44 active authority overrides apply only in this signed simulation. Real E3, production trust and backend write permissions remain NOT_GRANTED. Original sibling drafts are preserved.\n');
const support={'.t12/SourceGrant.json':sha(fs.readFileSync(path.join(root,'.t12/SourceGrant.json'))),'.t12/mock-public.pem':sha(pub)};
write(path.join(out,'HOST_FIXTURE_PIN.json'),{profile,fixture_id:payload.fixture_id,candidate_root:path.relative(repository,root).replaceAll('\\','/'),as_of:payload.as_of,public_key_sha256:sha(pub),receipt_sha256:support['.t12/SourceGrant.json'],support_hashes:support,owner_directive_sha256:payload.owner_directive_sha256,source_set:{'aghr.json':sha(fs.readFileSync(path.join(root,'aghr.json'))),...Object.fromEntries(grants.map(g=>[g.item_path,g.source_sha256]))}});
write(path.join(out,'MOCK_BEFORE_AFTER.json'),{profile,changes,original_rule_count:47,active_overrides:changes.filter(c=>c.before.status!==c.after.status).length});
console.log(JSON.stringify({profile,rules:47,active_overrides:44,private_key_saved:false}));
