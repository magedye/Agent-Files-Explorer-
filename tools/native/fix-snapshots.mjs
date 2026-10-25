import fs from 'node:fs';
import path from 'node:path';
import {out,sha} from './prepare.mjs';
const file=out+'/PREFLIGHT.json',raw=fs.readFileSync(file),p=JSON.parse(raw);fs.mkdirSync(out+'/attempts',{recursive:true});
fs.writeFileSync(out+'/attempts/PREFLIGHT_PATHS_BEFORE.json',raw,{flag:'wx'});
const corrections=[];
for(const [source,record]of Object.entries(p.before)){
 if(record.copy.endsWith('.raw'))continue;
 const previous=path.resolve(out,record.copy),next=previous+'.raw';
 if(!previous.startsWith(path.resolve(out)+path.sep)||sha(fs.readFileSync(previous))!==record.sha256)throw Error('SNAPSHOT_CUSTODY_MISMATCH');
 fs.renameSync(previous,next);corrections.push({source,before:record.copy,after:record.copy+'.raw',sha256:record.sha256});record.copy+='.raw';
}
fs.writeFileSync(file,JSON.stringify(p,null,2));fs.writeFileSync(out+'/SNAPSHOT_PATH_CORRECTION.json',JSON.stringify({reason:'Custody bytes are raw originals, not relocated active Markdown documents. The context/link check correctly rejects relative links interpreted at snapshot locations.',source_bytes_changed:false,corrections},null,2),{flag:'wx'});
