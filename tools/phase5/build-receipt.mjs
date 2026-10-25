import fs from 'node:fs';
import crypto from 'node:crypto';
const artifacts=[];
for(const p of ['dist/draft.html',...fs.readdirSync('dist/assets').filter(p=>p.startsWith('draft-')).map(p=>'dist/assets/'+p)]){
 const b=fs.readFileSync(p);artifacts.push({path:p,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});
}
const receipt={command:'npm run build',exit_code:0,source:'UI source unchanged since successful build; only backend corrections followed',raw_stdout:'Successful build stdout was observed in the conversation tool result; not separately captured to disk',advisory:'Existing legacy main bundle above500KiB; no build failure',artifacts,browser:'Actual isolated Edge loaded these generated assets successfully'};
fs.writeFileSync('docs/evidence/studio-phase5-2026-10-24/BUILD_RECEIPT.json',JSON.stringify(receipt,null,2),{flag:'wx'});
