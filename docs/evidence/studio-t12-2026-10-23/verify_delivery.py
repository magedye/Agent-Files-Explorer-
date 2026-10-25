"""Adversarial self-check of drafts, real executions and preservation receipts."""
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
import hashlib,json,re,subprocess
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2];C=ROOT/'governance_packages/candidates/AGHR_T12_Candidate'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def digest(p):return {'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
def save(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
checks=Counter()
def check(v,key):
 assert v,key
 checks[key]+=1
pre=load(OUT/'PREFLIGHT.json');runs=load(OUT/'RUN_RESULTS.json');pairs=load(OUT/'BEFORE_AFTER.json')['items']
prov=load(C/'drafting/FIELD_PROVENANCE.json')['items'];basepath=ROOT/'governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/registry/RULES.json'
base={r['id']:r for r in load(basepath)['rules']};expected={f'AGHR-{i:03}' for i in range(1,48)}
check(set(prov)==set(base)==expected and len(pairs)==47,'47_identities')
check(len(list((C/'policies/drafts').glob('*.json')))==47,'47_governing_files')
def leaves(v,p=''):
 if isinstance(v,dict):
  for k,w in v.items():yield from leaves(w,p+'/'+k)
 else:yield p,v
for pair in pairs:
 rid=pair['id'];item=load(C/f'policies/drafts/{rid}.json');old=base[rid];fields=prov[rid]['fields']
 check(pair['before_1_2_0']==old and pair['after_rc3']==item,'exact_before_after')
 check(item['id']==old['id'] and item['force']==old['force'],'force_identity_unchanged')
 check(item['rule']==f"Applies when: {old['applies_when']}.\n{old['text']}",'condition_and_rule_preserved')
 check(item['exceptions']['allowed']==old['waivable'],'waiver_flag_preserved')
 check(item['scope']=={'paths':['**']} and item['authority']['level']=='project','project_scope_only')
 check(item['authority']['status']=='draft' and item['authority']['approvedBy']=='PROVISIONAL_OWNER_REVIEW','no_final_approval_fabricated')
 check(item['impact']['evidence']=='assumed','no_measured_impact_fabricated')
 check(prov[rid]['item_sha256']==digest(C/prov[rid]['item_path'])['sha256'],'field_receipt_hash')
 check(prov[rid]['baseline_1_2_0']['sha256']==digest(basepath)['sha256'],'source_baseline_hash')
 check(set(fields)=={p for p,_ in leaves(item)},'every_field_annotated')
 for pointer,value in leaves(item):
  check(fields[pointer]['value']==value,'provenance_value_matches')
  check(fields[pointer]['status']==('SOURCE_VALUE_UNCHANGED' if pointer in ('/id','/force') else 'PROVISIONAL_OWNER_REVIEW'),'provisional_tag_on_authored_value')
 if old['force']=='MUST_NOT':
  check(item['severity']=='critical' and item['enforcement']['gate']=={'type':'human-approval','required':True} and item['enforcement']['mergeEffect']=='blocking','mandatory_gate_not_weakened')
 check(item['verification']['evalFixtures']==[f'drafting/eval-fixtures.json#/{rid}'],'verification_fixture_link')
 fixture=load(C/'drafting/eval-fixtures.json')[rid]
 check(fixture['status']==fixture['qualification']=='NOT_RUN' and fixture['criterion_ar'],'no_eval_execution_fabricated')
 check((OUT/'cases'/rid/f'policies/drafts/{rid}.json').read_bytes()==(C/f'policies/drafts/{rid}.json').read_bytes(),'per_rule_case_exact_bytes')
check(load(C/'aghr.json')['validation']==load(ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate/aghr.json')['validation'],'manifest_validation_not_weakened')
check(runs['per_rule']=={'strict_exit_0':0,'strict_blocked':47,'strict_invalid':0,'structural_pass':47},'honest_run_totals')
check(len(runs['runs'])==52,'execution_count')
engine_hash=load(ROOT/'docs/evidence/studio-e2-2026-10-22/SOURCE_PIN.json')['source_hash']
for run in runs['runs']:
 folder=OUT/'runs'/run['name'];stdout=load(folder/'stdout.json')
 check(digest(folder/'stdout.json')['sha256']==run['stdout_sha256'] and digest(folder/'stderr.txt')['sha256']==run['stderr_sha256'],'raw_run_hashes')
 check(stdout['exit_code']==run['process_exit_code'] and stdout['protocol_version']==run['protocol_version']=='3','actual_exit_protocol_agreement')
 check(stdout['source']['content_hash']==run['source_hash']==engine_hash,'unchanged_engine_identity')
 check(run['input_after_unchanged'] is True,'cli_zero_input_writes')
 if run['name'] in expected:check(run['structure']=='PASS' and run['result']=='BLOCKED' and run['process_exit_code']==3,'47_structure_pass_strict_blocked')
 if run['name'].startswith('negative-'):check(run['result']=='INVALID' and run['process_exit_code']==1,'negative_rejection')
 if run['name'].startswith('package-'):
  check(set(run['item_ids'])==expected and run['process_exit_code']==3 and run['structure']=='PASS','package_47_not_empty_success')
  check(run['diagnostics']=={'AUTHORITY_SOURCE_UNVERIFIED':47,'AUTHORITY_NOT_ACTIVE':44,'ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE':3},'precise_blocker_counts')
  findings=stdout['data']['validation']['findings'];check(not any(f['disposition']=='WARNING' for f in findings),'no_lint_optional_warnings')
check(load(OUT/'CANDIDATE_BEFORE_CLI.json')==load(OUT/'CANDIDATE_AFTER_CLI.json'),'before_after_cli_equal')
for name,pin in load(OUT/'CANDIDATE_FINAL_PIN.json').items():check(digest(C/name)==pin,'final_candidate_pin')
update=load(OUT/'PACKAGE_METADATA_UPDATE.json');check(update['engine_inputs_unchanged'],'post_run_engine_inputs_unchanged')
check(digest(OUT/update['changes'][0]['before_copy'])==update['changes'][0]['before'],'creation_metadata_before_preserved')
check(load(C/'PACKAGE_STATUS.json')['admitted_ids']==[] and load(C/'PACKAGE_STATUS.json')['strict_status']=='BLOCKED','no_admission_fabricated')
for name,pin in pre['inputs'].items():check(digest(ROOT/name)==pin,'source_inputs_unchanged')
parent=ROOT/pre['prior_custody']['path'];check(digest(parent)=={k:pre['prior_custody'][k] for k in ['sha256','bytes']},'prior_receipt_immutable')
changed=[];old_lock=load(parent)
for name,pin in old_lock['files'].items():
 if digest(ROOT/name)!=pin:
  check(name in pre['before'] and digest(OUT/'before'/f'{name}.raw')==pin,'only_derived_status_changed');changed.append(name)
 else:checks['prior_custody_unchanged']+=1
check(set(changed)==set(pre['before']),'four_status_docs_only')
diffs=[]
for name,before in pre['before'].items():
 dest=OUT/'after'/f'{name}.raw';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes((ROOT/name).read_bytes())
 diffs.append({'path':name,'before':before,'after':digest(ROOT/name),'before_copy':f'before/{name}.raw','after_copy':f'after/{name}.raw'})
save('DIFFS.json',{'changed':diffs,'new_candidate':'governance_packages/candidates/AGHR_T12_Candidate','new_evidence':OUT.relative_to(ROOT).as_posix(),'rules_before_after':'BEFORE_AFTER.json','prior_reference_changes':0,'app_source_changes':0,'engine_schema_changes':0})
status=subprocess.check_output(['git','status','--porcelain=v1'],cwd=ROOT,text=True)
def protected(text):return sorted(line for line in text.splitlines() if line[3:].startswith(('governance_packages/','src/','server/','tests/','tools/')) and not line[3:].startswith('governance_packages/candidates/AGHR_T12_Candidate/'))
check(protected(status)==protected(pre['git_status']),'unrelated_dirty_work_preserved')
pilot=load(OUT/'pilot.stdout.json');check(pilot['result']=='BLOCKED' and pilot['exit_code']==3 and pilot['data']['validation']['stages']['structure']['status']=='PASS','pilot_matches_observed_console_exit_3')
save('PILOT_RECEIPT.json',{'process_exit_code_observed':3,'capture_source':'PowerShell tool stdout: PILOT_NATIVE_EXIT=3','stdout':digest(OUT/'pilot.stdout.json'),'stderr':digest(OUT/'pilot.stderr.txt'),'elapsed_seconds':None,'note':'Pilot process exit recorded from observed tool transcript; not reconstructed as a timed per-rule test.'})
tests=(OUT/'npm-test.txt').read_text(encoding='utf-8-sig');check(bool(re.search(r'pass 57\b',tests)) and bool(re.search(r'fail 0\b',tests)),'application_tests_57_pass')
health=(OUT/'context-health.txt').read_text(encoding='utf-8-sig') if (OUT/'context-health.txt').exists() else ''
context_pass='Errors: 0, Warnings: 0' in health
save('VERIFICATION.json',{'at':datetime.now(timezone.utc).isoformat(),'artifact_status':'PASS','status':'PASS_FOR_DRAFT_DELIVERY_STRICT_BLOCKED' if context_pass else 'ARTIFACTS_PASS_CONTEXT_PENDING',
 'checks_passed':sum(checks.values()),'checks_by_category':dict(checks),'candidate_structure_pass':47,'native_strict_pass':0,'native_strict_blocked':47,'candidate_invalid':0,
 'actual_execution_count':53,'npm_tests':{'passed':57,'failed':0},'context_health':'PASS' if context_pass else 'PENDING',
 'prior_custody':{'pinned':len(old_lock['files']),'unchanged':len(old_lock['files'])-len(changed),'derived_docs_with_before':changed},
 'baseline_changes':0,'application_source_changes':0,'engine_schema_changes':0,'admitted_ids':[],'independent_review':'NOT_PERFORMED; adversarial self-checks only',
 'E4':'7 REQUIRED / NOT_RUN / NOT_WAIVED','T11':'ACCEPTED_BY_OWNER / CLOSED','T12':'STRICT_BLOCKED; not accepted or activated'})
print(json.dumps({'artifact_status':'PASS','checks':sum(checks.values()),'structure_pass':47,'strict_pass':0,'strict_blocked':47,'prior_files_unchanged':len(old_lock['files'])-len(changed),'context':'PASS' if context_pass else 'PENDING'},ensure_ascii=False))
