from pathlib import Path
import hashlib
import json
from datetime import datetime, timezone

OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def digest(p):return {'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
def write(name,v):(OUT/name).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
verification=read(OUT/'VERIFICATION.json');pre=read(OUT/'PREFLIGHT.json');m=read(OUT/'METRICS.json')
assert verification['status']=='PASS' and verification['checks_passed']==222
health=(OUT/'context-health.txt').read_text(encoding='utf-8');tests=(OUT/'npm-test.txt').read_text(encoding='utf-8')
assert 'Errors: 0, Warnings: 0' in health and 'pass 57' in tests and 'fail 0' in tests
diffs=[]
for name,before in pre['before'].items():
    source=ROOT/name;after=digest(source)
    assert digest(OUT/'before'/f'{name}.raw')==before
    if after!=before:
        target=OUT/'after'/f'{name}.raw';target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(source.read_bytes())
        diffs.append({'path':name,'before':before,'after':after,'before_copy':f'before/{name}.raw','after_copy':f'after/{name}.raw'})
write('DIFFS.json',{'scope':'Derived status/task/navigation docs only; source inventory, app, runtime, candidate and reference unchanged','changed':diffs,'governing_effect':'NONE','new_results_folder':str(OUT.relative_to(ROOT)).replace('\\','/')})
write('DELIVERY.json',{'at':datetime.now(timezone.utc).isoformat(),'task':'T11a actual 50-unit review','status':'REVIEW_COMPLETE_PENDING_OWNER_ACCEPTANCE','Phase1':'ACCEPTED_BY_OWNER','dispositions':m['dispositions'],'owner_required':26,'ambiguity_rate':0.52,'complete_governing_rc3_imports':0,'legacy_normative_rules_in_unresolved':15,'semantic_duplicates_confirmed':0,'semantic_pairs_reviewed':39,'review_seconds':m['time']['review'],'extraction':m['extraction'],'verification':{'artifact_assertions':222,'npm_tests':57,'context_errors':0,'context_warnings':0},'preservation':verification['previous_custody'],'T11b':'NOT_STARTED / BLOCKED_PENDING_OWNER_ACCEPTANCE_OF_T11a','reference_1_2_0':'UNCHANGED','migration':'NONE','independent_review':'NOT_PERFORMED','E4':'7 REQUIRED / NOT_RUN / NOT_WAIVED','deliverables':['T11A_REVIEW_AR.md','T11A_REVIEW.csv']})
old_lock=ROOT/'docs/evidence/studio-phase1-2026-10-23/CUSTODY.lock.json'
paths={ROOT/name for name in read(old_lock)['files']}
paths.add(old_lock)
paths.update(ROOT/name for name in read(OUT/'SOURCE_PIN.json'))
paths.update(p for p in OUT.rglob('*') if p.is_file() and p.name!='CUSTODY.lock.json')
assert all(not p.is_symlink() and p.is_relative_to(ROOT) for p in paths)
files={str(p.relative_to(ROOT)).replace('\\','/'):digest(p) for p in sorted(paths)}
write('CUSTODY.lock.json',{'algorithm':'SHA-256 raw bytes, excludes this lock itself; not a signature or owner acceptance','at':datetime.now(timezone.utc).isoformat(),'scope':'T11a artifacts plus accepted prior source/evidence custody, raw before/after status docs','files':files})
assert all(digest(ROOT/name)==value for name,value in files.items())
print(json.dumps({'status':'SEALED','files':len(files),'changed_status_docs':len(diffs),'decisions':24,'unresolved':26,'source_writes':0}))
