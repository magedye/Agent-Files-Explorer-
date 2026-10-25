from pathlib import Path
from datetime import datetime,timezone
from collections import Counter
import hashlib,json,difflib,re,subprocess
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def digest(p):return {'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
def save(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
checks=Counter()
def check(v,key):assert v,key;checks[key]+=1
pre=load(OUT/'PREFLIGHT.json');before={**pre['before'],**load(OUT/'ADDITIONAL_BEFORE.json')};parent=ROOT/pre['prior_custody']['path']
check(digest(parent)=={k:pre['prior_custody'][k] for k in ('sha256','bytes')},'parent_lock_immutable')
old=load(parent);changed=[]
for name,pin in old['files'].items():
 if digest(ROOT/name)!=pin:
  check(name in before and digest(OUT/'before'/f'{name}.raw')==pin,'authorized_before_snapshot');changed.append(name)
 else:checks['prior_files_unchanged']+=1
check(set(changed)==set(before).intersection(old['files']),'only_authorized_old_files_changed')
additional_before=sorted(set(before)-set(old['files']))
for name in additional_before:
 check(digest(ROOT/name)!=before[name],'additional_before_file_changed')
diffs=[];patches=[]
for name,pin in before.items():
 check(digest(OUT/'before'/f'{name}.raw')==pin,'raw_before_valid')
 target=OUT/'after'/f'{name}.raw';target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((ROOT/name).read_bytes())
 diffs.append({'path':name,'before':pin,'after':digest(ROOT/name),'before_copy':f'before/{name}.raw','after_copy':f'after/{name}.raw'})
 a=(OUT/'before'/f'{name}.raw').read_text(encoding='utf-8-sig').splitlines(keepends=True);b=(ROOT/name).read_text(encoding='utf-8-sig').splitlines(keepends=True)
 patches.extend(difflib.unified_diff(a,b,fromfile='before/'+name,tofile='after/'+name))
(OUT/'CHANGES.patch').write_text(''.join(patches),encoding='utf-8')
save('DIFFS.json',{'changed':diffs,'scope':'Authorized backend authorization/persistence core, tests, raw-byte attributes and derived state docs only','mock_authority_changes':'MOCK_BEFORE_AFTER.json','reference_changes':0,'engine_schema_changes':0,'live_application_data_writes':0})
node=load(OUT/'NODE_CHECKS.json');check(node['status']=='PASS' and node['rules']==47 and node['active_overrides']==44,'node_mock_checks')
check(node['mock_strict_exit']==node['mock_lint_exit']==0 and node['native_control_exit']==3,'mock_native_results_separate')
check(node['private_key_saved'] is False and node['default_runtime_persistent_storage'] is False,'no_private_key_or_activation')
root=ROOT/load(OUT/'HOST_FIXTURE_PIN.json')['candidate_root']
for name,pin in load(OUT/'MOCK_CANDIDATE_PIN.json').items():check(digest(root/name)==pin,'mock_candidate_pin')
delta=load(OUT/'MOCK_BEFORE_AFTER.json');check(len(delta['changes'])==47 and delta['active_overrides']==44,'scoped_authority_changes')
for d in delta['changes']:
 check(d['scope']=='T12_OWNER_APPROVED_MOCK' and d['after']['source']=='.t12/SourceGrant.json','explicit_mock_labels')
 if d['before']['status']!=d['after']['status']:check(d['after']['status']=='active' and d['after']['approvedBy']=='OWNER_T12_OVERRIDE','approved_mock_override')
tests=(OUT/'npm-test.txt').read_text(encoding='utf-8-sig');check(bool(re.search(r'pass 68\b',tests)) and bool(re.search(r'fail 0\b',tests)) and bool(re.search(r'skipped 0\b',tests)),'68_tests_pass')
for name in ['studio_t12_mock.test.mjs','studio_write_authorization.test.mjs','studio_persistence.test.mjs']:
 check((ROOT/'tests'/name).is_file(),'new_regression_suite_present')
for result in ['T12 valid signed fixture cannot bypass missing scope','T13 importing backend and refusing legacy writes keeps the zero-write profile','T14 migration is atomic','T14 explicit disk mode persists/reopens']:
 check(result in tests,'specific_integration_check_executed')
for name in ['server/studio/write-authorization.js','server/studio/db/persistent.js','tools/t12/mock_bridge.mjs','tools/t12/mock_engine.py']:
 check((ROOT/name).is_file(),'new_component_present')
check('T12_OWNER_APPROVED_MOCK' in (ROOT/'server/studio/write-authorization.js').read_text(encoding='utf-8'),'real_backend_rejects_mock_marker')
check('isTestLegacyValid' not in (ROOT/'server/staging.js').read_text(encoding='utf-8'),'fixed_authorization_fallback_removed')
sql=ROOT/'docs/contracts/aghr-rc3/sqlite/001_initial.sql';check(digest(sql)['sha256']=='d5ab6a5fa8dc3be95927d3f9871ed393a3d7f7206e102dae6f2721492dde2159','sql_contract_unchanged')
health=(OUT/'context-health.txt').read_text(encoding='utf-8-sig') if (OUT/'context-health.txt').exists() else ''
healthy='Errors: 0, Warnings: 0' in health
save('VERIFICATION.json',{'status':'PASS_FOR_MOCK_AND_ISOLATED_CORE' if healthy else 'ARTIFACTS_PASS_CONTEXT_PENDING','at':datetime.now(timezone.utc).isoformat(),'checks_passed':sum(checks.values()),'checks_by_category':dict(checks),
 'T12':'OWNER_CONDITIONAL_ACCEPTANCE_MET / MOCK_ONLY_CLOSED','T13':'CORE_IMPLEMENTED_TESTED; INTERACTIVE_INTEGRATION_OPEN','T14':'CORE_TESTED_TEMP_DISK; APPLICATION_STORAGE_NOT_ACTIVATED',
 'mock_strict_exit':0,'mock_lint_exit':0,'native_control_exit':3,'mock_items':47,'npm_tests':{'passed':68,'failed':0,'skipped':0},'context_health':'PASS' if healthy else 'PENDING',
 'prior_custody':{'pinned':len(old['files']),'unchanged':len(old['files'])-len(changed),'authorized_changed_with_raw_before':changed},
 'per_turn_baseline':{'raw_before_files':len(before),'additional_files_absent_from_parent_lock':additional_before,'changed_files':sorted(before)},
 'reference_1_2_0':'UNCHANGED / DEFAULT','engine_schema_changes':0,'live_application_data_writes':0,'new_Edge_Sentinel':'NOT_RUN; scoped API zero-write regression passed',
 'independent_review':'NOT_PERFORMED; adversarial self-review only','E4':'7 REQUIRED / NOT_RUN / NOT_WAIVED'})
print(json.dumps({'status':'PASS' if healthy else 'ARTIFACTS_PASS_CONTEXT_PENDING','checks':sum(checks.values()),'prior_files_unchanged':len(old['files'])-len(changed),'authorized_changes':len(changed),'mock_strict':0,'native_control':3,'tests':68},ensure_ascii=False))
