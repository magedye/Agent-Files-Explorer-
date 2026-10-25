// Real local process host. Deliberately cannot impersonate Codex/Antigravity.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const sha=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
export function createLocalProcessHost({skills=[]}={}){
 const definitions=structuredClone(skills);
 const capture=()=>{
  try{
   const rows=definitions.map(s=>{
    if(!s.id||!['system','user','project','plugin'].includes(s.source)||!path.isAbsolute(s.skillPath)||fs.lstatSync(s.skillPath).isSymbolicLink())throw Error('INVALID_SKILL_DESCRIPTOR');
    const raw=fs.readFileSync(s.skillPath);new TextDecoder('utf-8',{fatal:true}).decode(raw);
    if(!raw.length||raw.length>1024**2)throw Error('SKILL_CONTENT_LIMIT');
    const available=typeof s.entry==='string'&&path.isAbsolute(s.entry)&&fs.existsSync(s.entry)&&fs.statSync(s.entry).isFile()&&!fs.lstatSync(s.entry).isSymbolicLink();
    return {id:s.id,source:s.source,exists:true,available,instruction_hash:sha(raw),entry_hash:available?sha(fs.readFileSync(s.entry)):null,triggers:s.triggers??[],capabilities:s.capabilities??[],requires:s.requires??[],preference:s.preference??100};
   });
   return {host_id:'aghr-local-process',host_version:process.version,registry_status:'available',skills:rows,observation:'actual local registered driver inventory; not a native agent skill listing'};
  }catch(error){return {host_id:'aghr-local-process',host_version:process.version,registry_status:'unavailable',skills:[],reason:error.message};}
 };
 return Object.freeze({capture,descriptor(id){return definitions.find(s=>s.id===id);}});
}
