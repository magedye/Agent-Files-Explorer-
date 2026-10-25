"""Exact scoped custody and evidence verification; never rewrites earlier receipts."""
from pathlib import Path
import hashlib
import json
import difflib
import re
import sqlite3
import subprocess
import sys

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'docs/evidence/studio-e3-t19-2026-10-24'
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8'))
results=[]
def check(value,name):results.append({'check':name,'status':'PASS' if value else 'FAIL'})

preflight=load(OUT/'PREFLIGHT.json');parent=ROOT/preflight['parent_lock'];prior=load(parent)
check(sha(parent.read_bytes())==preflight['parent_sha256'],'parent custody receipt')
changed=set(preflight['before_paths'])
snapshot=lambda stage,n:OUT/stage/(n+'.raw' if n.endswith('.md') else n)
for name,meta in prior['files'].items():
    p=snapshot('before',name) if name in changed else ROOT/name
    check(sha(p.read_bytes())==meta['sha256'],'preserve:'+name)
diffs=[];patch=[]
for name in sorted(changed):
    old=snapshot('before',name).read_bytes();new=(ROOT/name).read_bytes();dest=snapshot('after',name);dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(new)
    diffs.append({'path':name,'before':snapshot('before',name).relative_to(OUT).as_posix(),'after':dest.relative_to(OUT).as_posix(),'before_sha256':sha(old),'after_sha256':sha(new),'before_bytes':len(old),'after_bytes':len(new),'before_crlf':old.count(b'\r\n'),'after_crlf':new.count(b'\r\n')})
    patch.extend(difflib.unified_diff([x+'\n' for x in old.decode('utf-8').splitlines()],[x+'\n' for x in new.decode('utf-8').splitlines()],fromfile='before/'+name,tofile='after/'+name))
(OUT/'DIFFS.json').write_bytes((json.dumps(diffs,indent=2)+'\n').encode())
(OUT/'CHANGES.patch').write_bytes(''.join(patch).encode())
if '--prepare' in sys.argv:
    if any(r['status']=='FAIL' for r in results):raise RuntimeError('Parent custody mismatch')
    print(json.dumps({'status':'DIFFS_PREPARED','paths':len(diffs)}));raise SystemExit(0)

pin=ROOT/'server/studio/aghr/e3/SOURCE.lock.json';engine_hash=sha(pin.read_bytes())
for name,h in load(pin)['files'].items():check(sha((ROOT/name).read_bytes())==h,'E3 pin:'+name)
check("sourceHash='"+engine_hash+"'" in (ROOT/'server/studio/aghr/bounded-validator.js').read_text(encoding='utf-8'),'host hardcoded E3 pin')
log=(OUT/'NPM_TEST.log').read_text(encoding='utf-8')
check(all(re.search(p,log) for p in [r'tests 82\b',r'pass 82\b',r'fail 0\b',r'skipped 0\b']),'npm82/82,no skips')
check('built in' in (OUT/'BUILD.log').read_text(encoding='utf-8'),'build')
cli=load(OUT/'cli/RESULTS.json');check(cli['status']=='PASS' and len(cli['cases'])==8,'actual CLI8/8')
for case in cli['cases']:
    report=load(OUT/'cli'/(case['name']+'.stdout.json'))
    check(report['protocol_version']=='3' and report['exit_code']==case['exit_code'] and report['source']['content_hash']==engine_hash,'CLI:'+case['name'])

sys.path.insert(0,str(ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools'))
from validate import SchemaChecks
schemas=SchemaChecks();contracts=0
def contract(file,definition,value,label):
    global contracts
    v=schemas.validators[file];v=v.evolve(schema={'$ref':v.schema['$id']+'#/$defs/'+definition});errors=list(v.iter_errors(value));contracts+=1
    check(not errors,'contract:'+label+(' '+errors[0].message if errors else ''))

native=load(OUT/'NATIVE_WORKFLOW.json');check(native['status']=='PASS','native workflow')
for i,record in enumerate(native['records']):
    op=record['operation'];body=record.get('body',{})
    if 'status' in record and isinstance(record['status'],int) and record['status']>=400:
        contract('transport.schema.json','ErrorEnvelope',body,'error'+str(i));continue
    data=body.get('data')
    if data is not None:
        if op in ('validate','submit','edit','doctor','approve','actual-local-source-attestation','stale-source-attestation-blocked'):contract('api.change.schema.json','Package',data,op+str(i))
        if op=='generate':contract('api.execution.schema.json','Generation',data,op+str(i))
        if op=='preview':contract('api.change.schema.json','Preview',data,op+str(i))
        if op=='export':contract('api.change.schema.json','Export',data,op+str(i));check(sha((OUT/'OBS-T18.APPROVED_TEST.patch').read_bytes())==data['artifact']['content_hash'].split(':')[1],'approved test artifact bytes')
        if op=='draft-patch':check(data['draft_only'] and data['approval']=='NOT_GRANTED' and sha((OUT/'SEC-001.REVIEW_ONLY.patch').read_bytes())==data['artifact']['content_hash'].split(':')[1],'SEC001 review-only artifact bytes')
    if op=='real-generation-stages':
        for stage,g in record['stages'].items():
            contract('api.execution.schema.json','Generation',g,'real-stage:'+stage);check(g['stage']==stage,'stage:'+stage)
    if op in ('actual-host-lookup','actual-compact-rule-lookup'):
        r=record['data']['resource'];check(r['engine_hash']==engine_hash and r['limits']=={'timeoutMs':30000,'memoryBytes':2147483648} and r['active_processes_after']==0,'actual bounded host lookup:'+op)

for name in ['HTTP_REAL_APPROVAL.json','HTTP_REAL_INVALIDATION.json','HTTP_SEC001_BLOCKED.json']:
    contract('api.change.schema.json','Package',load(OUT/name),name)
contract('api.change.schema.json','Create',load(OUT/'HTTP_CREATE_REQUEST.json'),'actual browser Create')
browser=load(OUT/'BROWSER.json');sentinel=load(OUT/'BROWSER_SENTINEL.json');pins=load(OUT/'PROGRAM_PIN.json')
check(browser['status']=='PASS' and browser['browser'].startswith('Edg/') and browser['console_errors']==[] and browser['browser_storage_writes']==[],'actual isolated Edge bilingual')
check(sentinel['status']=='PASS' and sentinel['source_writes']==0 and sentinel['protected_files']==1786 and sentinel['unexpected_repository_events']==[],'source zero-write Sentinel1786')
for group in ['program','built_assets']:
    for name,h in pins[group].items():check(sha((ROOT/name).read_bytes())==h,'browser bytes:'+name)

runs_dir=OUT/'raw-runs';runs_dir.mkdir(exist_ok=True)
with sqlite3.connect('file:'+(OUT/'NATIVE_ISOLATED.sqlite').as_posix()+'?mode=ro',uri=True) as db:
    db.row_factory=sqlite3.Row
    check(db.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchone()[0]==12,'native SQLite12')
    check(db.execute('SELECT count(*) FROM change_package_approvals').fetchone()[0]==2,'actual approval rows2')
    check(db.execute('SELECT count(*) FROM change_package_approval_history').fetchone()[0]>=1,'actual invalidated history')
    sec=db.execute("SELECT * FROM change_packages WHERE json_extract(proposed_yaml,'$.id')='SEC-001'").fetchone()
    check(sec is not None and sec['status']=='draft' and sec['export_path'] is None,'canonical SEC001 not approved/exported')
    for row in db.execute('SELECT id,command,raw_stdout FROM verification_runs'):
        raw=row['raw_stdout'];(runs_dir/(row['id']+'.json')).write_bytes(raw.encode('utf-8'));data=json.loads(raw);receipt=data.get('resource_receipt') or data.get('resourceReceipt') or data.get('receipt')
        if receipt:check(receipt['engine_hash']==engine_hash and receipt['active_processes_after']==0 and receipt['limits']=={'timeoutMs':30000,'memoryBytes':2147483648},'bounded run:'+row['id'])
with sqlite3.connect('file:'+(OUT/'ISOLATED_DRAFT_DB.sqlite').as_posix()+'?mode=ro',uri=True) as db:
    check(db.execute('SELECT count(*) FROM change_package_approval_history').fetchone()[0]==1,'browser real approval invalidated')
    check(db.execute("SELECT count(*) FROM change_packages WHERE status IN ('approved','exported','closed')").fetchone()[0]==0,'browser no false approved SEC001')

check((OUT/'SEC-001.REVIEW_ONLY.patch').read_bytes().startswith(b'# AGHR REVIEW-ONLY DRAFT; NOT APPROVED'),'review-only header')
check(load(OUT/'GAPS.json')['e4']=='REQUIRED / NOT_RUN / NOT_WAIVED; P0 eval must precede approved acceptance/export','E4 deferred no waiver')
check(subprocess.run(['git','diff','--quiet','HEAD','--','governance_packages/references/Agent_Governance_Harness_Reference_1.2.0'],cwd=ROOT).returncode==0,'tracked reference1.2.0 unchanged')
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();check(head==preflight['head'],'HEAD custody')
check('Errors: 0, Warnings: 0' in (OUT/'CONTEXT_HEALTH.log').read_text(encoding='utf-8'),'context health0/0')
failures=[r for r in results if r['status']=='FAIL']
verification={'status':'FAIL' if failures else 'PASS','checks':len(results),'contract_checks':contracts,'head':head,'test_count':82,'cli_cases':8,'e3':'LOCAL_PROFILE_ONLY','t19':'BLOCKED_CANONICAL_SEC001; REVIEW_ONLY_PATCH','e4':'REQUIRED / NOT_RUN / NOT_WAIVED','failures':failures,'results':results}
(OUT/'VERIFICATION.json').write_bytes((json.dumps(verification,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
if failures:print(json.dumps({'status':'FAIL','failures':failures},ensure_ascii=False));raise SystemExit(1)
if '--seal' in sys.argv:
    lock=OUT/'CUSTODY.lock.json'
    if lock.exists():raise RuntimeError('Never overwrite an existing custody lock')
    names=set(prior['files'])|{parent.relative_to(ROOT).as_posix()}
    names.update(p.relative_to(ROOT).as_posix() for p in OUT.rglob('*') if p.is_file() and p!=lock)
    names.update(load(pin)['files']);names.add(pin.relative_to(ROOT).as_posix())
    names.update(['server/studio/aghr/bounded-validator.js','server/studio/artifact-store.js','src/features/changes/ReviewPanel.jsx','tests/studio_e3_approval.test.mjs','tests/studio_patch_bytes.test.mjs','tools/aghr_get_rule.mjs','tools/aghr_studio_cli.mjs','tools/verify_studio_e3_cli.mjs','tools/test_e3_studio_edge.mjs','tools/pin_studio_e3.py','tools/verify_studio_e3_delivery.py'])
    listing=OUT/'NEW_FILES.json';listing.write_bytes((json.dumps({'paths':sorted(names-set(prior['files']))},indent=2)+'\n').encode());names.add(listing.relative_to(ROOT).as_posix())
    files={}
    for name in sorted(names):
        b=(ROOT/name).read_bytes();files[name]={'sha256':sha(b),'bytes':len(b)}
    lock.write_bytes((json.dumps({'algorithm':'SHA256 raw bytes; not an owner signature','scope':'Local E3/T17/T18 tested; canonical SEC001/T19 BLOCKED; E4 not run; no release acceptance','parent_receipt':{'path':parent.relative_to(ROOT).as_posix(),'sha256':sha(parent.read_bytes())},'files':files},indent=2)+'\n').encode())
    print(json.dumps({'status':'SEALED','files':len(files),'lock_sha256':sha(lock.read_bytes()),'checks':len(results),'contract_checks':contracts}))
else:print(json.dumps({'status':'PASS','checks':len(results),'contract_checks':contracts}))
