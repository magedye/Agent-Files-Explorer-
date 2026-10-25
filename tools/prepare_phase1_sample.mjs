// Operator evidence preparation only. The read-only server never imports this tool.
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='docs/reviews/aghr-items-2026-10-22/';
const raw=fs.readFileSync(root+'REVIEW_REGISTER.json'), register=JSON.parse(raw);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const counts={CORE_RULE:15,SKILL:5,STANDARD_RECOMMENDATION:5,DOCUMENT_CLAUSE:7,DOCUMENT_TABLE_ROW:4,EXAMPLE_BLOCK:2,PROFILE:1,ADAPTER:2,SCENARIO:2,HOST_QUALIFICATION:1,SOURCE_REFERENCE:1,SCHEMA:1,TEMPLATE:1,ENFORCEMENT_RECORD:2,CATALOG_METADATA:1};
const preferred=['AGHR-038','AGHR-041','AGHR-047'];
const ids=[];
for(const [type,count] of Object.entries(counts)){
 const rows=register.items.filter(i=>i.record_type===type);
 rows.sort((a,b)=>Number(preferred.includes(b.id))-Number(preferred.includes(a.id))||a.id.localeCompare(b.id));
 ids.push(...rows.slice(0,count).map(i=>i.id));
}
if(ids.length!==50||new Set(ids).size!==50)throw Error('Invalid sample');
const manifest={version:1,profile:'PHASE1_PRESENTATION_ONLY',review_status:'PENDING_REVIEW',T11a:'NOT_RUN',selection:'Category quotas from approved T11a plan; first stable IDs with explicit learning/skills rule preference. Frozen before review.',register:{path:root+'REVIEW_REGISTER.json',sha256:sha(raw)},counts,ids,metrics:{classification:null,ambiguity:null,semantic_duplicates:null,review_seconds:null,extraction_route:null},note:'Selection and browser presentation do not complete T11a or adopt policy.'};
const target='docs/evidence/studio-phase1-2026-10-23/SAMPLE_MANIFEST.json';
if(fs.existsSync(target))throw Error('Sample already frozen; do not overwrite');
fs.writeFileSync(target,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({units:ids.length,categories:Object.keys(counts).length,skills:ids.filter(i=>i.startsWith('SKILL-'))}));
