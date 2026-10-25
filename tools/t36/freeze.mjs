import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const out='docs/evidence/studio-t36-completion-2026-10-25',target=out+'/TESTED_SOURCE.lock.json',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function verify(files){const drift=[];for(const [p,r]of Object.entries(files))if(sha(fs.readFileSync(p))!==r.sha256)drift.push(p);if(drift.length)throw Error('FROZEN_SOURCE_DRIFT '+JSON.stringify(drift));}
if(fs.existsSync(target)){const pin=JSON.parse(fs.readFileSync(target));verify(pin.files);verifyE4();console.log(JSON.stringify({status:'PASS',files:Object.keys(pin.files).length,sha256:sha(fs.readFileSync(target))}));}
else{
 verifyE4();const parent='docs/evidence/studio-pilots-2026-10-25/TESTED_SOURCE.lock.json',names=new Set(Object.keys(JSON.parse(fs.readFileSync(parent)).files));
 function add(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(['__pycache__','node_modules'].includes(entry.name))continue;const p=(dir+'/'+entry.name).replaceAll('\\','/');if(entry.isSymbolicLink())throw Error('SOURCE_REPARSE_POINT');if(entry.isDirectory())add(p);else names.add(p);}}
 for(const dir of ['server/studio','src/features','tools/t36','dist'])add(dir);
 for(const file of fs.readdirSync('tests'))if(file.endsWith('.test.mjs'))names.add('tests/'+file);
 for(const file of ['package.json','package-lock.json','vite.config.mjs','studio.html'])names.add(file);
 const files=Object.fromEntries([...names].sort().map(p=>[p,{sha256:sha(fs.readFileSync(p)),bytes:fs.statSync(p).size}]));
 fs.writeFileSync(target,JSON.stringify({profile:'T36_WINDOWS_EDGE_CANONICAL_59_CANDIDATE',at:new Date().toISOString(),parent:{path:parent,sha256:sha(fs.readFileSync(parent))},files},null,2)+'\n',{flag:'wx'});verify(files);console.log(JSON.stringify({status:'FROZEN',files:Object.keys(files).length,sha256:sha(fs.readFileSync(target))}));
}
