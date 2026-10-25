import fs from 'node:fs';
import {out,sha} from './prepare.mjs';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const p='docs/evidence/studio-e3-t19-2026-10-24/CUSTODY.lock.json',raw=fs.readFileSync(p);
if(sha(raw)!=='2869e66bf9ada6b7471bfbdb2060ae12ed9890c76057be8898678610a1251c9a')throw Error('E3_CUSTODY_DRIFT');
const exceptions=['docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/INDEX.md'];
const custody=JSON.parse(raw),mismatches=[],applicationChanges=[];let verified=0;
const preflight=JSON.parse(fs.readFileSync(out+'/PREFLIGHT.json'));
const authorizedApplicationChanges=['server/studio/db/persistent.js','server/studio/draft-runtime.js','server/studio/serve-draft.mjs','src/features/changes/DraftStudio.jsx'];
for(const [name,entry]of Object.entries(custody.files)){
 if(exceptions.includes(name))continue;
 if(authorizedApplicationChanges.includes(name)){
  const before=preflight.before[name],copy=fs.readFileSync(out+'/'+before.copy);
  if(sha(copy)!==entry.sha256||sha(copy)!==before.sha256)throw Error('APPLICATION_BEFORE_CUSTODY_DRIFT '+name);
  applicationChanges.push({path:name,before:entry.sha256,after:sha(fs.readFileSync(name)),before_copy:before.copy,authority:'Current owner instruction: implement T20/T21 in Draft app; immutable E1-E3 engine modules excluded'});continue;
 }
 if(sha(fs.readFileSync(name))!==entry.sha256)mismatches.push(name);else verified++;
}
verifyE4();
const result={status:mismatches.length?'FAIL':'PASS',custody:{path:p,sha256:sha(raw)},immutable_files_verified:verified,mismatches,authorized_application_changes:applicationChanges,derived_document_exceptions:exceptions,e4_source_unchanged:true,reference_120:'unchanged within accepted transitive custody',note:'Explicit sealed file lists only; no governance package crawl. Four owner-authorized app integration edits are not E1-E3 engine mutations.'};
fs.writeFileSync(out+'/PRESERVATION.json',JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));if(mismatches.length)process.exitCode=1;
