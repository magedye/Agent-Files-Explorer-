import fs from 'node:fs';
import path from 'node:path';
import {createPilotHost} from '../../server/studio/pilots/local-profile.mjs';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
for(const id of ['pilot-app-l2','pilot-app-l3']){
 const host=createPilotHost({python,id}),root=host.root+'/.aghr/candidate';
 const manifest=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/aghr.json'));
 manifest.id=id;manifest.name=id+' scoped sandbox package';manifest.compatibility={agents:['aghr-local-process'],targets:{'aghr-local-process':{file:'AGENTS.md',budgetBytes:32768}}};
 write(root+'/aghr.json',manifest);
 fs.writeFileSync(root+'/CHANGELOG.md','# Sandbox package\n\n1.0.0-rc.3 — local pilot only; not a release.\n',{flag:'wx'});
 const authority={source:'owner://T34-T35/2026-10-25/'+id,level:'project',owner:'Sandbox Project Owner',approvedBy:'OWNER_T34_T35_20261025',status:'active',effectiveFrom:'2026-10-25'};
 const base={kind:'CONSTRAINT',force:'MUST',severity:'medium',scope:{paths:['**/*']},rationale:'Owner-authorized sandbox adoption; no authority outside this project.',authority,impact:{band:'medium',evidence:'assumed'},verification:{commands:[id==='pilot-app-l2'?'node --test app.test.mjs':'python -B checks.py']}};
 const principle=await host.probe({operation:'principle'});
 write(root+'/policies/principle.json',{...base,id:'PRIN-007',title:'Truthful skill-state reporting',kind:'PRINCIPLE',rule:principle.rule});
 write(root+'/policies/identity.json',{...base,id:'PILOT-IDENTITY-001',title:'Project identity in public read responses',rule:'Read API responses MUST identify this sandbox project. Do not claim authority over another project.'});
 if(id==='pilot-app-l3'){
  const q={skillId:host.descriptor.id,host:'aghr-local-process',hostVersion:process.version,scope:host.scope,contentHash:'sha256:'+ (await import('node:crypto')).createHash('sha256').update(fs.readFileSync(host.descriptor.skillPath)).digest('hex'),status:'NOT_RUN'};
  write(root+'/policies/sql.json',{...base,id:'PILOT-SQL-001',title:'Read-only inventory boundary',force:'MUST_NOT',severity:'critical',rule:'The inventory inspection procedure MUST_NOT execute mutating, multiple, extension-loading or metadata SQL. Enforce both SQL authorization and SQLite read-only permissions.',scope:{paths:[id+'/app/**',id+'/data/**'],skillIds:[host.descriptor.id]},defaultTier:'P0-Safety',enforcement:{textual:true,technical:['pilot-sql-readonly-v1'],failureAction:'block',mergeEffect:'blocking',gate:{type:'pilot-sql-readonly-v1',required:true}},verification:{commands:['python -B checks.py'],evalFixtures:['procedures/sql-readonly/worker.py']},skillQualification:q});
  write(root+'/policies/capability.json',{...base,id:'CAP-PILOT-SQL',title:'Project SQL inspection procedure',kind:'CAPABILITY',force:'MAY',severity:'high',rule:'Use the registered local read-only procedure when evaluating the inventory SQL boundary. Loading is not execution.',skillId:host.descriptor.id,source:'project',function:'security',instructionsPath:'procedures/sql-readonly/SKILL.md',permissions:{read:['app/**','data/inventory.sqlite'],write:[],network:'deny',secrets:'deny'},inputs:[],outputs:[],defaultTier:'P0-Safety',minimumStatus:'QUALIFIED',requiredOnHosts:['aghr-local-process'],maxAgeDays:1,skillQualification:q});
 }
 fs.appendFileSync(id+'/.gitignore','.aghr/candidate/\n');
 fs.writeFileSync(id+'/README.md',`# ${id}\n\nActual isolated sandbox application for ${id.endsWith('l2')?'T34 / L2 instructions':'T35 / L3 local P0 safety'}.\n\nData are seeded sandbox business records, not production customer data.\nThe sole selected host is aghr-local-process. Native Codex/Antigravity remain NOT_RUN.\nGPG commit signing is unsigned with owner-approved warning. Local CI job receipts use a separate ephemeral Ed25519 key; this is not a GPG identity or release signature.\nCandidate documents are operator-authored; Studio writes only its isolated Draft database.\nCanonical project state is written only by the local post-merge CI publisher.\n`,{flag:'wx'});
 host.close();console.log('Scaffolded '+id+' candidate; runtime qualification NOT_RUN.');
}
