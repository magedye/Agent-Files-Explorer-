import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createPilotHost} from '../../server/studio/pilots/local-profile.mjs';
const out=path.resolve('docs/evidence/studio-pilots-2026-10-25');
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
export const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export const save=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
export async function verifiedHost(id,destination){
 if(!['pilot-app-l2','pilot-app-l3'].includes(id))throw Error('PILOT_NOT_REGISTERED');
 if(fs.existsSync(path.resolve(id,'.aghr/state.json')))throw Error('PUBLISHED_PILOT_IMMUTABLE: use an explicitly authorized fresh isolated replay; never rewrite an accepted pilot in place.');
 const host=createPilotHost({python,id});let qualification;
 try{
  // Self-declared source data cannot grant project authority or qualification.
  const untrusted=await host.validate({trusted:false});save(destination+'/UNTRUSTED.json',untrusted);assert.notEqual(untrusted.exit_code,0);
  if(id==='pilot-app-l3'){
   qualification=await host.qualify();save(destination+'/P0_QUALIFICATION.json',qualification);
   const record=qualification.qualification.data.qualification;
   const q=Object.fromEntries(['skillId','host','hostVersion','scope','contentHash','status'].map(k=>[k,record[k]]));
   q.qualifiedAt=record.qualifiedAt.slice(0,10);q.evidence=record.evidence.map(v=>'e4:execution/'+v.run_id+'#'+v.content_hash);
   for(const name of ['sql.json','capability.json']){const p=host.root+'/.aghr/candidate/policies/'+name,value=JSON.parse(fs.readFileSync(p));value.skillQualification=q;fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n');}
  }
  host.attestOwner();const valid=await host.validate();save(destination+'/VALID.json',valid);assert.equal(valid.exit_code,0,JSON.stringify(valid.findings));
  const p=host.root+'/.aghr/candidate/policies/identity.json',bytes=fs.readFileSync(p),item=JSON.parse(bytes),negatives=[];
  for(const key of ['authority.level','scope']){
   const broken=structuredClone(item);if(key==='scope')delete broken.scope;else delete broken.authority.level;
   try{fs.writeFileSync(p,JSON.stringify(broken));const result=await host.validate();save(destination+'/NEGATIVE_'+key.replace('.','_')+'.json',result);assert.equal(result.exit_code,1);negatives.push({missing:key,exit_code:result.exit_code,findings:result.findings});}
   finally{fs.writeFileSync(p,bytes);}
  }
  // A different host session cannot restore QUALIFIED from copied JSON.
  if(qualification){const foreign=createPilotHost({python,id});try{foreign.attestOwner();const copied=await foreign.validate();save(destination+'/COPIED_QUALIFICATION_REJECTED.json',copied);assert.equal(copied.exit_code,3);}finally{foreign.close();}}
  return {host,valid,qualification,negatives};
 }catch(e){save(destination+'/FAILED.json',{message:e.message,stack:e.stack,records:host.records,e4_records:host.e4?.records});host.close();throw e;}
}
if(process.argv[1]?.endsWith('/verify.mjs')||process.argv[1]?.endsWith('\\verify.mjs')){
 const id=process.argv[2]||'pilot-app-l2',dest=out+'/probe-'+id+'-'+Date.now();
 const result=await verifiedHost(id,dest);result.host.close();console.log(JSON.stringify({id,status:'PASS',exit_code:result.valid.exit_code,resolved:result.valid.resolved.length,out:dest}));
}
