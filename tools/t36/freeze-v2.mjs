import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
const folder='docs/evidence/studio-t36-completion-2026-10-25',target=folder+'/v2/TESTED_SOURCE.lock.json',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const additions=['server/studio/projects/capabilities.mjs','tests/studio_project_adoption_integrity.test.mjs','tests/studio_live_capability.test.mjs','tools/t36/freeze-v2.mjs','tools/t36/playwright-v2.config.mjs','tools/t36/live.spec.mjs'];
const allowed=new Set(['server/studio/projects/adoption.mjs','server/studio/projects/adoption-routes.mjs','server/studio/projects/adoption-command.py','server/studio/unified-runtime.mjs','server/studio/schema-reader.js','src/features/capabilities/Capabilities.jsx','src/features/capabilities/SkillDetail.jsx','src/features/studio/StudioApp.jsx','tests/studio_unified.test.mjs']);
if(fs.existsSync(target)){
 const pin=JSON.parse(fs.readFileSync(target)),drift=Object.entries(pin.files).filter(([p,r])=>!fs.existsSync(p)||sha(fs.readFileSync(p))!==r.sha256).map(([p])=>p);if(drift.length)throw Error('V2_SOURCE_DRIFT '+JSON.stringify(drift));verifyE4();console.log(JSON.stringify({status:'PASS',files:Object.keys(pin.files).length,sha256:sha(fs.readFileSync(target))}));
}else{
 const parent=folder+'/TESTED_SOURCE.lock.json',bytes=fs.readFileSync(parent);if(sha(bytes)!=='b4c44d3038eee5a9bb82d049a8a1bd3cc8909eea8d2c7d43d44c13c20a46a9a4')throw Error('V1_PIN_DRIFT');const previous=JSON.parse(bytes),names=new Set(),changes=[];
 for(const [p,r]of Object.entries(previous.files)){if(p.startsWith('dist/'))continue;const actual=sha(fs.readFileSync(p));if(actual!==r.sha256){if(!allowed.has(p))throw Error('UNEXPECTED_SUCCESSOR_CHANGE '+p);changes.push({path:p,before:r.sha256,after:actual});}names.add(p);}
 for(const p of additions)names.add(p);
 function add(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=(dir+'/'+e.name).replaceAll('\\','/');if(e.isSymbolicLink())throw Error('BUILD_REPARSE_POINT');if(e.isDirectory())add(p);else names.add(p);}}add('dist');verifyE4();
 const files=Object.fromEntries([...names].sort().map(p=>[p,{sha256:sha(fs.readFileSync(p)),bytes:fs.statSync(p).size}]));fs.writeFileSync(target,JSON.stringify({profile:'T36_V2_WINDOWS_EDGE_LOCAL_DRAFT',at:new Date().toISOString(),parent:{path:parent,sha256:sha(bytes),files:Object.keys(previous.files).length},changes,added:additions,generated_assets:'dist rebuilt from preserved V1 sources; original bytes in v2/before/dist',evidence_inheritance:'V1 broad162/164 retained; failing schema case and all affected integrations rerun. V2 working15/15 preceded the added source-verifier callback; final affected/API/browser receipts must identify their actual version.',files},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'FROZEN',files:Object.keys(files).length,changes:changes.length,sha256:sha(fs.readFileSync(target))}));
}
