import fs from 'node:fs';
import {out,changed,sha} from './prepare.mjs';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const pre=JSON.parse(fs.readFileSync(out+'/PREFLIGHT.json')),raw=fs.readFileSync(pre.parent.path),parent=JSON.parse(raw);
if(sha(raw)!==pre.parent.sha256)throw Error('PARENT_CUSTODY_DRIFT');let unchanged=0;const edits=[];
for(const [p,r]of Object.entries(parent.files)){
 if(changed.includes(p)){const old=pre.before[p];if(old.sha256!==r.sha256||sha(fs.readFileSync(out+'/'+old.copy))!==r.sha256)throw Error('BEFORE_DRIFT '+p);edits.push({path:p,before:r.sha256,after:sha(fs.readFileSync(p)),copy:old.copy});}
 else if(sha(fs.readFileSync(p))!==r.sha256)throw Error('PARENT_DRIFT '+p);else unchanged++;
}
const e3path='docs/evidence/studio-e3-t19-2026-10-24/CUSTODY.lock.json',e3raw=fs.readFileSync(e3path);if(sha(e3raw)!=='2869e66bf9ada6b7471bfbdb2060ae12ed9890c76057be8898678610a1251c9a')throw Error('E3_CUSTODY_DRIFT');const e3=JSON.parse(e3raw);let immutable=0;
for(const [p,r]of Object.entries(e3.files)){
 if(changed.includes(p)){if(!parent.files[p]){const old=pre.before[p];if(sha(fs.readFileSync(out+'/'+old.copy))!==r.sha256)throw Error('E3_BEFORE_DRIFT '+p);edits.push({path:p,before:r.sha256,after:sha(fs.readFileSync(p)),copy:old.copy});}continue;}
 if(sha(fs.readFileSync(p))!==r.sha256)throw Error('IMMUTABLE_DRIFT '+p);immutable++;
}verifyE4();
fs.writeFileSync(out+'/PRESERVATION.json',JSON.stringify({status:'PASS',parent_unchanged:unchanged,parent_total:Object.keys(parent.files).length,immutable_e3_files:immutable,authorized_edits:edits,e1_e4:'UNCHANGED',reference120:'Unchanged via explicit transitive sealed file lists; no governance package crawl',default_draft_db_used:false,state_written:false,source_apply:false},null,2),{flag:'wx'});console.log(JSON.stringify({status:'PASS',parent_unchanged:unchanged,immutable_e3_files:immutable,authorized_edits:edits.length}));
