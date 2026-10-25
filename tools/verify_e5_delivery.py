"""Verify exact authorized delivery, preserve differences, optionally seal once."""
import difflib
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/evidence/studio-e5-t16-preview-2026-10-23'
sha = lambda b: hashlib.sha256(b).hexdigest()
load = lambda p: json.loads(p.read_text(encoding='utf-8'))
results=[]
def check(condition, label):
    results.append({'check':label,'status':'PASS' if condition else 'FAIL'})

preflight=load(OUT/'PREFLIGHT.json')
parent=ROOT/preflight['parent_lock']
check(sha(parent.read_bytes())==preflight['parent_sha256'],'parent custody receipt')
prior=load(parent)
changed=set(preflight['before_paths'])
snapshot=lambda phase,name:OUT/phase/(name+'.raw' if name.endswith('.md') else name)
for name,meta in prior['files'].items():
    actual=snapshot('before',name) if name in changed else ROOT/name
    check(sha(actual.read_bytes())==meta['sha256'], 'preserve:'+name)

diffs=[];patch=[]
for name in sorted(changed):
    old=snapshot('before',name).read_bytes();new=(ROOT/name).read_bytes()
    target=snapshot('after',name);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(new)
    diffs.append({'path':name,'before_snapshot':snapshot('before',name).relative_to(OUT).as_posix(),'after_snapshot':target.relative_to(OUT).as_posix(),'before_sha256':sha(old),'after_sha256':sha(new),'changed':old!=new,'before_bytes':len(old),'after_bytes':len(new),'before_crlf':old.count(b'\r\n'),'after_crlf':new.count(b'\r\n')})
    patch.extend(difflib.unified_diff([s+'\n' for s in old.decode('utf-8').splitlines()],[s+'\n' for s in new.decode('utf-8').splitlines()],fromfile='before/'+name,tofile='after/'+name))
(OUT/'DIFFS.json').write_text(json.dumps(diffs,indent=2)+'\n',encoding='utf-8')
(OUT/'CHANGES.patch').write_bytes((''.join(patch)).encode('utf-8'))
if '--prepare' in sys.argv:
    if any(r['status']=='FAIL' for r in results):raise RuntimeError('Parent custody failed')
    print(json.dumps({'status':'DIFFS_PREPARED','paths':len(diffs)}));raise SystemExit(0)

extension=ROOT/'server/studio/aghr/e5/EXTENSION.lock.json'
for name,h in load(extension)['files'].items():check(sha((ROOT/name).read_bytes())==h,'extension:'+name)
bridge=(ROOT/'server/studio/aghr/draft-validator.js').read_text(encoding='utf-8')
check("extensionSourceHash='"+sha(extension.read_bytes())+"'" in bridge,'hardcoded host extension pin')
tests=(OUT/'NPM_TEST.log').read_text(encoding='utf-8')
check(bool(re.search(r'tests 80\b',tests) and re.search(r'pass 80\b',tests) and re.search(r'fail 0\b',tests) and re.search(r'skipped 0\b',tests)), 'npm80/80,no skips')
check('built in' in (OUT/'BUILD.log').read_text(encoding='utf-8'),'build')
cli=load(OUT/'cli/RESULTS.json');check(cli['status']=='PASS' and len(cli['cases'])==8,'actual8CLI cases')
for case in cli['cases']:
    raw=(OUT/'cli'/(case['name']+'.stdout.json')).read_bytes();report=json.loads(raw)
    check(sha(raw)==case['stdout_sha256'] and report['protocol_version']=='3' and report['exit_code']==case['exit_code'] and report['source']['content_hash']==sha(extension.read_bytes()),'CLI:'+case['name'])

sys.path.insert(0,str(ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools'))
from validate import SchemaChecks
schemas=SchemaChecks();contract_count=0
def contract(name,definition,value,label):
    global contract_count
    v=schemas.validators[name];v=v.evolve(schema={'$ref':v.schema['$id']+'#/$defs/'+definition})
    errors=list(v.iter_errors(value));check(not errors,'contract:'+label+(' '+str(errors[0].message) if errors else ''));contract_count+=1
for filename in ['HTTP_CREATED_LIST.json','HTTP_VALIDATED.json','HTTP_SUBMITTED.json','HTTP_EDIT_INVALIDATION.json']:
    contract('api.change.schema.json','Packages',load(OUT/filename)['data'],filename)
contract('api.change.schema.json','Create',load(OUT/'HTTP_CREATE_REQUEST.json'),'actual browser Create')
contract('transport.schema.json','ErrorEnvelope',load(OUT/'HTTP_DENIED.json')['body'],'actual403')
contract('api.execution.schema.json','Generation',load(OUT/'HTTP_GENERATION_PREVIEW.json'),'actual browser generation')
lifecycle=load(OUT/'LIFECYCLE_HTTP.json');check(lifecycle['status']=='PASS','HTTP lifecycle')
for phase in lifecycle['results']:
    if 'cp' in phase:contract('api.change.schema.json','Package',phase['cp'],'HTTP:'+phase['phase'])
    if 'generation' in phase:contract('api.execution.schema.json','Generation',phase['generation'],'HTTP generation:'+phase['phase'])
generation=load(OUT/'GENERATION_CASES.json')
for stage,value in generation['cases'].items():contract('api.execution.schema.json','Generation',value,'generation:'+stage)
check([generation['cases'][s]['stage'] for s in ('full','compress','compact','fail')]==['full','compress','compact','fail'],'four generation stages')
check(generation['cases']['lookup_not_qualified']['stage']=='fail','unqualified lookup refused')

browser=load(OUT/'BROWSER.json');sentinel=load(OUT/'BROWSER_SENTINEL.json')
check(browser['status']=='PASS' and browser['browser'].startswith('Edg/') and not browser['console_errors'] and browser['browser_storage_writes']==[],'actual isolated Edge')
check(sentinel['status']=='PASS' and sentinel['source_writes']==0 and sentinel['protected_files']==1632 and sentinel['unexpected_repository_events']==[],'source zero-write Sentinel1632')
pins=load(OUT/'PROGRAM_PIN.json')
for group in ('program','built_assets'):
    for name,h in pins[group].items():check(sha((ROOT/name).read_bytes())==h,'browser exact bytes:'+name)

with sqlite3.connect('file:'+(OUT/'ISOLATED_DRAFT_DB.sqlite').as_posix()+'?mode=ro',uri=True) as db:
    check(db.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchone()[0]==12,'SQLite12 unchanged')
    check(db.execute('SELECT count(*) FROM change_packages').fetchone()[0]==1,'isolated browser CP persisted')
    check(db.execute("SELECT count(*) FROM change_packages WHERE status IN ('approved','exported','closed')").fetchone()[0]==0,'no approval/export')
    check(db.execute("SELECT count(*) FROM audit_events WHERE json_extract(payload_json,'$.result')='DENY'").fetchone()[0]>0,'durable denial audit')
gaps=load(OUT/'GAPS.json');check(gaps['e4_seven_honesty_checks']=='REQUIRED / NOT_RUN / NOT_WAIVED','E4 deferred not waived')
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();check(head==preflight['head'],'HEAD custody unchanged')
check('Errors: 0' in (OUT/'CONTEXT_HEALTH.log').read_text(encoding='utf-8'),'context health')
failures=[r for r in results if r['status']=='FAIL']
verification={'status':'FAIL' if failures else 'PASS','checks':len(results),'contract_checks':contract_count,'head':head,'branch':preflight['branch'],'test_count':80,'cli_cases':8,'browser':browser['browser'],'e4':'REQUIRED / NOT_RUN / NOT_WAIVED','failures':failures,'results':results}
(OUT/'VERIFICATION.json').write_text(json.dumps(verification,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if failures:
    print(json.dumps({'status':'FAIL','failures':failures},ensure_ascii=False));raise SystemExit(1)
if '--seal' in sys.argv:
    dest=OUT/'CUSTODY.lock.json'
    if dest.exists():raise RuntimeError('Never overwrite an existing custody lock')
    names=set(prior['files'])|{parent.relative_to(ROOT).as_posix()}
    names.update(p.relative_to(ROOT).as_posix() for p in OUT.rglob('*') if p.is_file() and p!=dest)
    names.update(load(extension)['files']);names.add(extension.relative_to(ROOT).as_posix())
    names.update(['tests/studio_e5_core.test.mjs','tests/studio_e5_lifecycle.test.mjs','tests/studio_generation_preview.test.mjs','tests/helpers/e5_core_cases.py','tests/helpers/e5_generation_cases.py','tools/test_e5_studio_edge.mjs','tools/verify_e5_cli.mjs','tools/verify_e5_delivery.py'])
    added=sorted(names-set(prior['files']))
    listing=OUT/'NEW_FILES.json'
    listing.write_text(json.dumps({'scope':'new code, vendor, delivery artifacts and retained evidence','paths':added},indent=2)+'\n',encoding='utf-8')
    names.add(listing.relative_to(ROOT).as_posix())
    files={}
    for name in sorted(names):
        b=(ROOT/name).read_bytes();files[name]={'sha256':sha(b),'bytes':len(b)}
    dest.write_text(json.dumps({'algorithm':'SHA256 raw bytes; hashes are not owner signatures','scope':'E5 proposal core/T16 local lifecycle/T17 dry-run; no E4/T18/release','parent_receipt':{'path':parent.relative_to(ROOT).as_posix(),'sha256':sha(parent.read_bytes())},'files':files},indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':'SEALED','files':len(files),'lock_sha256':sha(dest.read_bytes()),'verification_checks':len(results),'contract_checks':contract_count}))
else:print(json.dumps({'status':'PASS','checks':len(results),'contract_checks':contract_count}))
