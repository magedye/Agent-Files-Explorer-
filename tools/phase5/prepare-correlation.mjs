import fs from 'node:fs';
import path from 'node:path';
import {out,sha} from './prepare.mjs';
const log=fs.readFileSync(out+'/NPM_TEST_FINAL_V2.log','utf8');if(!log.includes('ℹ fail 0')||!log.includes('ℹ cancelled 0'))throw Error('FULL_REGRESSION_NOT_FINISHED');
const source=JSON.parse(fs.readFileSync(out+'/TESTED_SOURCE_FINAL_V2.json'));for(const [p,r]of Object.entries(source.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('BASELINE_SOURCE_DRIFT '+p);
const changes=['server/studio/phase5/observations.mjs','server/studio/phase5/metrics.mjs','server/studio/skills/lifecycle-service.js','tests/studio_phase5_metrics.test.mjs'],before={};
for(const p of changes){const bytes=fs.readFileSync(p),copy='correlation-before/'+p+'.raw';fs.mkdirSync(path.dirname(out+'/'+copy),{recursive:true});fs.writeFileSync(out+'/'+copy,bytes,{flag:'wx'});before[p]={sha256:sha(bytes),bytes:bytes.length,copy};}
fs.writeFileSync(out+'/CORRELATION_BASE.json',JSON.stringify({status:'COMPOSED_VERIFICATION_BASELINE',full_log:'NPM_TEST_FINAL_V2.log',full_source:'TESTED_SOURCE_FINAL_V2.json',before,reason:'Required metric-boundary corrections only: historical host versions, bounded execution observability, Arabic vs non-ASCII classification. Reverify all changed lifecycle/Phase5 integration; unchanged E1–E4 evidence remains valid.'},null,2),{flag:'wx'});console.log('Verified complete baseline and saved before-correlation bytes.');
