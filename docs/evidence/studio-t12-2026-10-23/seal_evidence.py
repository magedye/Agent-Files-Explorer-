"""Freeze the actual draft delivery, including its unmet strict-success gate."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];C=ROOT/'governance_packages/candidates/AGHR_T12_Candidate'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def digest(p):return {'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
def save(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if (OUT/'CUSTODY.lock.json').exists():raise FileExistsError('Do not replace a sealed receipt')
v=load(OUT/'VERIFICATION.json');pre=load(OUT/'PREFLIGHT.json')
assert v['status']=='PASS_FOR_DRAFT_DELIVERY_STRICT_BLOCKED' and v['checks_passed']==4153
assert v['npm_tests']=={'passed':57,'failed':0} and v['context_health']=='PASS'
assert 'Errors: 0, Warnings: 0' in (OUT/'context-health.txt').read_text(encoding='utf-8-sig')
for name,pin in load(OUT/'CANDIDATE_FINAL_PIN.json').items():assert digest(C/name)==pin
parent=ROOT/pre['prior_custody']['path'];assert digest(parent)=={k:pre['prior_custody'][k] for k in ('sha256','bytes')}
save('DELIVERY.json',{'at':datetime.now(timezone.utc).isoformat(),'task':'Owner-authorized drafting of 47 rules and T12 draft packaging',
 'status':'DRAFTING_COMPLETE / T12_STRICT_BLOCKED','T11b':'ACCEPTED_BY_OWNER / CLOSED','branch':pre['branch'],'HEAD':pre['HEAD'],
 'candidate':C.relative_to(ROOT).as_posix(),'drafts':47,'provisional_marker':'PROVISIONAL_OWNER_REVIEW','authority_levels':{'project':47,'organization':0,'enterprise':0},
 'impact_evidence':{'assumed':47},'structure_pass':47,'native_strict_exit_0':0,'native_strict_blocked':47,'candidate_structurally_invalid':0,
 'package_validate_strict':{'result':'BLOCKED','exit':3},'package_validate':{'result':'BLOCKED','exit':3},'package_lint':{'result':'BLOCKED','exit':3},
 'blockers':{'AUTHORITY_SOURCE_UNVERIFIED':47,'AUTHORITY_NOT_ACTIVE':44,'ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE':3},
 'negative_controls':{'missing_authority_level':'INVALID/1','missing_scope':'INVALID/1'},'actual_CLI_runs':53,'protocol_version':'3',
 'checks':{'artifact_assertions':4153,'npm_tests_passed':57,'npm_tests_failed':0,'context_errors':0,'context_warnings':0},
 'prior_custody':v['prior_custody'],'reference_1_2_0':'UNCHANGED / DEFAULT','app_source_changes':0,'engine_schema_changes':0,
 'active_or_app_imports':0,'admitted_ids':[],'generation':0,'E4':'7 REQUIRED / NOT_RUN / NOT_WAIVED','independent_review':'NOT_PERFORMED',
 'license_owner_status':'PROVISIONAL as previously accepted; not a current blocker',
 'next_action':'Owner review of drafted values; future separately scoped trusted-host authority grant path and real E3 evidence. No further engine/activation work authorized here.',
 'deliverables':['README.md','BEFORE_AFTER_AR.md','BEFORE_AFTER.json','RUN_RESULTS.json','VERIFICATION.json','DIFFS.json','CANDIDATE_FINAL_PIN.json']})
paths={ROOT/name for name in load(parent)['files']};paths.add(parent)
paths.update(p for p in OUT.rglob('*') if p.is_file() and p.name!='CUSTODY.lock.json')
paths.update(p for p in C.rglob('*') if p.is_file())
assert all(p.is_relative_to(ROOT) and not p.is_symlink() for p in paths)
files={p.relative_to(ROOT).as_posix():digest(p) for p in sorted(paths)}
save('CUSTODY.lock.json',{'algorithm':'SHA-256 raw bytes; excludes this lock itself; hashes are not approval signatures','at':datetime.now(timezone.utc).isoformat(),
 'scope':'47 provisional drafts, raw native CLI results, before/after records, prior custody chain and four derived status edits',
 'strict_success':'NOT_ACHIEVED; 47 BLOCKED, zero admitted', 'parent_receipt':{'path':parent.relative_to(ROOT).as_posix(),**digest(parent)},'files':files})
assert all(digest(ROOT/name)==pin for name,pin in files.items())
print(json.dumps({'status':'SEALED_DRAFT_DELIVERY_STRICT_BLOCKED','files':len(files),'drafts':47,'strict_exit_0':0,'strict_blocked':47,'lock':digest(OUT/'CUSTODY.lock.json')},ensure_ascii=False))
