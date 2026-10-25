import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {repository} from './aghr/cli-bridge.js';

const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
// Only operator-owned manifests supply paths. No HTTP path reaches this function.
export function readPinned(relative, expected){
 const parts=relative.split('/');
 if(path.isAbsolute(relative)||parts.some(p=>!p||p==='.'||p==='..'||p.includes('\\')||p.includes(':')))throw Error('SOURCE_PATH_INVALID');
 let absolute=repository;
 for(const part of parts){absolute=path.join(absolute,part);if(fs.lstatSync(absolute).isSymbolicLink())throw Error('SOURCE_REPARSE_POINT');}
 if(!fs.statSync(absolute).isFile()||fs.statSync(absolute).size>8*1024*1024)throw Error('SOURCE_SIZE_INVALID');
 const bytes=fs.readFileSync(absolute),hash=sha(bytes);
 if(expected&&hash!==expected)throw Error('SOURCE_HASH_MISMATCH');
 return {path:relative,hash:'sha256:'+hash,text:bytes.toString('utf8')};
}

export function createReviewSource(){
 const manifestPath='docs/evidence/studio-phase1-2026-10-23/SAMPLE_MANIFEST.json';
 const manifest=JSON.parse(readPinned(manifestPath).text);
 const source=readPinned(manifest.register.path,manifest.register.sha256);
 const register=JSON.parse(source.text),byId=new Map(register.items.map(i=>[i.id,i]));
 if(manifest.ids.length!==50||new Set(manifest.ids).size!==50)throw Error('SAMPLE_IDENTITY_INVALID');
 const selected=manifest.ids.map(id=>{if(!byId.has(id))throw Error('SAMPLE_UNIT_MISSING');return byId.get(id);});
 // Read only selected, explicitly recorded files, never enumerate a package.
 const sources=new Map();
 function verify(item){
  const key=item.source.path;
  if(!sources.has(key)){
   try{sources.set(key,{...readPinned(key,item.source.sha256),status:'VERIFIED_BYTES'});}
   catch(error){sources.set(key,{path:key,hash:'sha256:'+item.source.sha256,text:null,status:'SOURCE_UNAVAILABLE',diagnostic:error.code||error.message});}
  }
  return sources.get(key);
 }
 const items=selected.map(row=>({...row,source_integrity:verify(row).status}));
 const profiles=register.items.filter(i=>i.record_type==='PROFILE').map(row=>({...row,source_integrity:verify(row).status}));
 const hosts=register.items.filter(i=>i.record_type==='HOST_QUALIFICATION').map(row=>({...row,source_integrity:verify(row).status}));
 const skills=items.filter(i=>i.record_type==='SKILL').map(row=>{
  const p=row.original_payload;
  const relative=path.posix.dirname(path.posix.dirname(row.source.path))+'/'+p.path;
  let instructions;try{instructions={...readPinned(relative,p.sha256),status:'EXISTS'};}catch(error){instructions={path:relative,hash:'sha256:'+p.sha256,text:null,status:'UNAVAILABLE',reason:error.code||error.message};}
  return {id:row.id,skill_id:row.source_id,title:row.title,record:row,instructions,availability:{existence:instructions.status,discovery:'DISCOVERY_UNAVAILABLE',reason:'No native host discovery connected in this read-only profile.'},qualification:{status:'NOT_RUN',records:[]},usage:{status:'NOT_RUN',events:[]}};
 });
 return {
  summary:{manifest_path:manifestPath,manifest,register_hash:source.hash,units:items.length,review_status:'PENDING_REVIEW',T11a:'NOT_RUN',adopted:false},
  items,skills,profiles,hosts,
  detail(id){return items.find(i=>i.id===id)||null;},
  source(id){const row=items.find(i=>i.id===id);return row?sources.get(row.source.path):null;},
 };
}
