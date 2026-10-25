// Read-only local Codex shell adapter. No HTTP identity or source writes.
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createBoundedValidator} from '../server/studio/aghr/bounded-validator.js';
const args=new Map(process.argv.slice(2).map(a=>{const n=a.indexOf('=');if(n<0)throw Error('Use --name=value');return [a.slice(0,n),a.slice(n+1)];}));
if([...args.keys()].some(k=>!['--cp-id','--hash','--id','--database','--python'].includes(k)))throw Error('Unsupported lookup option');
const database=path.resolve(args.get('--database')||'.governance/studio-drafts/studio.sqlite');
if(fs.lstatSync(database).isSymbolicLink()||!fs.statSync(database).isFile())throw Error('Unsafe database');
const db=new DatabaseSync(database,{readOnly:true});let cp,origin;
try{
 cp=db.prepare('SELECT * FROM change_packages WHERE id=?').get(args.get('--cp-id'));
 if(!cp||cp.proposal_version_hash!==args.get('--hash'))throw Error('STALE_PROPOSAL');
 origin=JSON.parse(db.prepare("SELECT payload_json FROM audit_events WHERE event_type='cp.create' AND resource_id=? AND json_extract(payload_json,'$.result')='SUCCESS' ORDER BY id LIMIT 1").get(cp.id).payload_json);
}finally{db.close();}
const payload={title:cp.title,kind:cp.kind,proposed_yaml:cp.proposed_yaml,...(origin.source?{source:origin.source}:{}),...(cp.target_item_id?{target_item_id:cp.target_item_id}:{})};
const validator=await createBoundedValidator({python:path.resolve(args.get('--python')||'temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),base:{base_package_version:cp.base_package_version,base_candidate_hash:origin.base_candidate_hash}});
try{const result=await validator.lookupRun(payload,args.get('--id'),undefined,{cp_id:cp.id,database});console.log(JSON.stringify({protocol_version:'3',result:'READ',proposal_version_hash:cp.proposal_version_hash,rule:result.data,resource:result.receipt}));}finally{validator.close();}
