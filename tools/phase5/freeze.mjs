import fs from 'node:fs';
import path from 'node:path';
import {out,sha,changed} from './prepare.mjs';
const parent=JSON.parse(fs.readFileSync('docs/evidence/studio-phase4-2026-10-24/CUSTODY.lock.json'));
const files=new Set(Object.keys(parent.files).filter(p=>/\.(js|mjs|jsx|css|py|json)$/.test(p)));
for(const dir of ['server/studio/phase5','src/features/measurement']){function visit(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const name=path.posix.join(p,e.name);if(e.isDirectory())visit(name);else files.add(name);}}visit(dir);}
for(const p of [...changed.filter(p=>!p.startsWith('docs/')),'tests/studio_phase5.test.mjs','tests/studio_phase5_metrics.test.mjs','tests/studio_phase5_evaluators.test.mjs'])files.add(p);
const capture=Object.fromEntries([...files].sort().map(p=>[p,{sha256:sha(fs.readFileSync(p)),bytes:fs.statSync(p).size}]));
fs.writeFileSync(out+'/'+(process.argv[2]||'TESTED_SOURCE_FINAL')+'.json',JSON.stringify({at:new Date().toISOString(),files:capture,authority:'Source freeze for final regression; no product edits during the run.'},null,2),{flag:'wx'});console.log('Frozen',files.size,'source files.');
