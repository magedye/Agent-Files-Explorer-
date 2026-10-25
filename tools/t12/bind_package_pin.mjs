// One-time refinement: bind the manifest and complete governing file set too.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const out='docs/evidence/studio-t12-mock-write-core-2026-10-23',file=out+'/HOST_FIXTURE_PIN.json';
const pin=JSON.parse(fs.readFileSync(file,'utf8'));if(pin.source_set)throw Error('Already bound');
fs.mkdirSync(out+'/before/fixture-binding',{recursive:true});fs.copyFileSync(file,out+'/before/fixture-binding/HOST_FIXTURE_PIN.json.raw');
for(const name of ['RUN_RESULTS.json','mock-validate.stdout.json','mock-validate.stderr.txt','mock-lint.stdout.json','mock-lint.stderr.txt','native-control.stdout.json','native-control.stderr.txt'])fs.copyFileSync(out+'/'+name,out+'/before/fixture-binding/'+name+'.raw');
const raw=JSON.parse(fs.readFileSync(path.join(pin.candidate_root,'.t12/SourceGrant.json'),'utf8')),payload=JSON.parse(Buffer.from(raw.payload_base64,'base64'));
pin.source_set={'aghr.json':crypto.createHash('sha256').update(fs.readFileSync(path.join(pin.candidate_root,'aghr.json'))).digest('hex'),...Object.fromEntries(payload.grants.map(g=>[g.item_path,g.source_sha256]))};
fs.writeFileSync(file,JSON.stringify(pin,null,2)+'\n');
fs.writeFileSync(out+'/BINDING_REFINEMENT.json',JSON.stringify({reason:'Adversarial self-review: bind complete governing set and manifest, preventing unsigned extra items or a changed manifest. Original signature/fixtures untouched; initial pin and raw runs preserved.',scope:'REQUIRED_FOR_CURRENT_ACCEPTANCE',reverification:'Run mock strict/lint and native control after this host-configuration change'},null,2)+'\n');
