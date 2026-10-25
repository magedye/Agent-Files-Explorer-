// Projection-only synthetic vectors; never used as a real engine verdict.
import fs from 'node:fs';
import crypto from 'node:crypto';
export function syntheticBridge({duplicate=false,unresolved=false}={}) {
 const report=JSON.parse(JSON.parse(fs.readFileSync('docs/evidence/studio-phase0-runtime-2026-10-23/cli-strict.json','utf8')).stdout);
 const base=report.data.catalog.items[0];
 const values=Array.from({length:3},(_,n)=>({...structuredClone(base.value),id:'SYNTHETIC-'+n,title:'Synthetic projection vector',authority:{status:'active'},nextReview:n===0?'2020-01-01':'2099-01-01'}));
 values.push({...structuredClone(base.value),id:'SYNTHETIC-CAP',kind:'CAPABILITY',skillId:'synthetic-read',source:'aghr',function:'verification',inputs:[],outputs:[],permissions:{read:[],write:[],network:'deny',secrets:'deny'}});
 if(unresolved)values[0].conflictPolicy={overrides:['UNRESOLVED-UNIT-ONLY']};
 if(duplicate)values.push(structuredClone(values[0]));
 const raw=Buffer.from(JSON.stringify(values)),sha=crypto.createHash('sha256').update(raw).digest('hex'),source='policies/synthetic.json';
 report.data.catalog.sources=[{path:source,raw_base64:raw.toString('base64'),sha256:sha,text:raw.toString('utf8'),complete:true}];
 report.data.catalog.items=values.map(value=>({...structuredClone(base),value,location:{...base.location,path:source}}));
 return {async run(){return {report:structuredClone(report),startedAt:'2026-10-23T00:00:00Z',finishedAt:'2026-10-23T00:00:01Z'};}};
}
