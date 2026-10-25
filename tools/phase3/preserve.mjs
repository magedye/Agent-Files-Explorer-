import fs from 'node:fs';
import {out,changed,sha} from './prepare.mjs';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const pre=JSON.parse(fs.readFileSync(out+'/PREFLIGHT.json')),raw=fs.readFileSync(pre.parent.path),parent=JSON.parse(raw);
if(sha(raw)!==pre.parent.sha256)throw Error('PARENT_PIN_DRIFT');
let parentVerified=0;const exceptions=[];
for(const [p,r]of Object.entries(parent.files)){
 if(changed.includes(p)){const b=pre.before[p];if(sha(fs.readFileSync(out+'/'+b.copy))!==r.sha256||b.sha256!==r.sha256)throw Error('BEFORE_PIN_DRIFT '+p);exceptions.push({path:p,before:r.sha256,after:sha(fs.readFileSync(p)),before_copy:b.copy});}
 else if(sha(fs.readFileSync(p))!==r.sha256)throw Error('PARENT_DRIFT '+p);else parentVerified++;
}
const e3path='docs/evidence/studio-e3-t19-2026-10-24/CUSTODY.lock.json',e3=fs.readFileSync(e3path);if(sha(e3)!=='2869e66bf9ada6b7471bfbdb2060ae12ed9890c76057be8898678610a1251c9a')throw Error('E3_CUSTODY_DRIFT');
let immutable=0;for(const [p,r]of Object.entries(JSON.parse(e3).files)){if(changed.includes(p))continue;if(sha(fs.readFileSync(p))!==r.sha256)throw Error('IMMUTABLE_DRIFT '+p);immutable++;}
verifyE4();
fs.writeFileSync(out+'/PRESERVATION.json',JSON.stringify({status:'PASS',parent_unchanged:parentVerified,parent_files:Object.keys(parent.files).length,exceptions,immutable_e3_files:immutable,e4_pin_unchanged:true,reference_120:'Preserved via accepted transitive custody; no package crawl.',original_and_state_written:false},null,2),{flag:'wx'});
console.log(JSON.stringify({status:'PASS',parent_unchanged:parentVerified,authorized_changes:exceptions.length,immutable_e3_files:immutable}));
