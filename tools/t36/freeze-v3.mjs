import fs from 'node:fs';
import crypto from 'node:crypto';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const base='docs/evidence/studio-t36-completion-2026-10-25',target=base+'/v3/TESTED_SOURCE.lock.json',parent=base+'/v2/TESTED_SOURCE.lock.json',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(fs.existsSync(target)){
 const pin=JSON.parse(fs.readFileSync(target));for(const [p,r]of Object.entries(pin.files))if(sha(fs.readFileSync(p))!==r.sha256)throw Error('V3_SOURCE_DRIFT '+p);verifyE4();console.log(JSON.stringify({status:'PASS',files:Object.keys(pin.files).length,sha256:sha(fs.readFileSync(target))}));
}else{
 const bytes=fs.readFileSync(parent);if(sha(bytes)!=='6b814adf6087db6086d9115614cd2af0ed9e1754df75166520992f16c9351add')throw Error('V2_PIN_DRIFT');const previous=JSON.parse(bytes),names=new Set(),changes=[];
 for(const [p,r]of Object.entries(previous.files)){if(p.startsWith('dist/'))continue;const actual=sha(fs.readFileSync(p));if(actual!==r.sha256){if(p!=='src/features/phase0/PhaseZero.jsx')throw Error('UNEXPECTED_CHANGE '+p);changes.push({path:p,before:r.sha256,after:actual});}names.add(p);}
 names.add('tools/t36/freeze-v3.mjs');function add(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isSymbolicLink())throw Error('REPARSE_POINT');if(e.isDirectory())add(p);else names.add(p);}}add('dist');verifyE4();
 const files=Object.fromEntries([...names].sort().map(p=>[p,{sha256:sha(fs.readFileSync(p)),bytes:fs.statSync(p).size}]));fs.writeFileSync(target,JSON.stringify({profile:'T36_V3_WINDOWS_EDGE_LOCAL_DRAFT',at:new Date().toISOString(),parent:{path:parent,sha256:sha(bytes)},changes,inheritance:'V2 API59/59 and affected6/6 remain scoped to unchanged backend; V3 reruns all three Edge flows. No broad164/164 claim.',files},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'FROZEN',files:Object.keys(files).length,sha256:sha(fs.readFileSync(target))}));
}
