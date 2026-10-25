import fs from 'node:fs';
import {out,changed,sha} from './prepare.mjs';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const pre=JSON.parse(fs.readFileSync(out+'/PREFLIGHT.json')),parentRaw=fs.readFileSync(pre.parent.path),parent=JSON.parse(parentRaw);
if(sha(parentRaw)!==pre.parent.sha256)throw Error('PARENT_CUSTODY_DRIFT');let unchanged=0;const edits=[];
for(const [p,r]of Object.entries(parent.files)){
 if(changed.includes(p)){const old=pre.before[p];if(old.sha256!==r.sha256||sha(fs.readFileSync(out+'/'+old.copy))!==r.sha256)throw Error('BEFORE_DRIFT '+p);edits.push({path:p,before:r.sha256,after:sha(fs.readFileSync(p)),copy:old.copy});}
 else if(sha(fs.readFileSync(p))!==r.sha256)throw Error('PARENT_DRIFT '+p);else unchanged++;
}
for(const [p,old]of Object.entries(pre.before))if(sha(fs.readFileSync(out+'/'+old.copy))!==old.sha256)throw Error('SNAPSHOT_DRIFT '+p);
const e3Path='docs/evidence/studio-e3-t19-2026-10-24/CUSTODY.lock.json',e3Raw=fs.readFileSync(e3Path),e3=JSON.parse(e3Raw);if(sha(e3Raw)!=='2869e66bf9ada6b7471bfbdb2060ae12ed9890c76057be8898678610a1251c9a')throw Error('E3_CUSTODY_DRIFT');let immutable=0,inherited=0;
for(const [p,r]of Object.entries(e3.files)){
 if(changed.includes(p)){if(!parent.files[p]&&sha(fs.readFileSync(out+'/'+pre.before[p].copy))!==r.sha256)throw Error('E3_BEFORE_DRIFT '+p);continue;}
 if(parent.files[p]&&parent.files[p].sha256!==r.sha256){inherited++;continue;}
 if(sha(fs.readFileSync(p))!==r.sha256)throw Error('IMMUTABLE_DRIFT '+p);immutable++;
}
verifyE4();const frozen=JSON.parse(fs.readFileSync(out+'/TESTED_SOURCE_FINAL_V3.json'));for(const [p,r]of Object.entries(frozen.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('TESTED_SOURCE_DRIFT '+p);
fs.writeFileSync(out+'/'+(process.argv[2]||'PRESERVATION')+'.json',JSON.stringify({status:'PASS',parent_unchanged:unchanged,parent_total:Object.keys(parent.files).length,immutable_e3_files:immutable,inherited_parent_authorized_edits:inherited,authorized_edits:edits,tested_source_files:Object.keys(frozen.files).length,reference120:'Unchanged via sealed explicit paths; no governance crawl',e1_e4:'UNCHANGED',default_draft_db_used:false,state_written:false,source_apply:false},null,2),{flag:'wx'});console.log({status:'PASS',unchanged,immutable,inherited});
