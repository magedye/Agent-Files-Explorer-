"""Verify frozen sources, real outputs and scoped Draft evidence before sealing."""
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter
import difflib
import hashlib
import json
import re
import sqlite3
import subprocess

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
checks = Counter()


def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def digest(path):
    raw = path.read_bytes()
    return {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def check(condition, name):
    assert condition, name
    checks[name] += 1


pre = load(OUT / 'PREFLIGHT.json')
parent = ROOT / pre['parent']['path']
check(digest(parent) == {k: pre['parent'][k] for k in ('sha256', 'bytes')}, 'parent_lock_immutable')
old = load(parent)['files']
before = pre['before']
changed = []
for name, pin in old.items():
    if digest(ROOT / name) != pin:
        check(name in before, 'old_change_authorized')
        check(digest(OUT / 'before' / (name + '.raw')) == pin, 'original_raw_before_matches_parent')
        changed.append(name)
    else:
        checks['old_files_unchanged'] += 1
check(set(changed) == set(before), 'exact_per_turn_changed_paths')
diffs, patches = [], []
for name, pin in before.items():
    prior = OUT / 'before' / (name + '.raw')
    check(digest(prior) == pin, 'raw_before_valid')
    after = OUT / 'after' / (name + '.raw')
    after.parent.mkdir(parents=True, exist_ok=True)
    after.write_bytes((ROOT / name).read_bytes())
    diffs.append({'path': name, 'before': pin, 'after': digest(ROOT / name),
                  'before_copy': 'before/' + name + '.raw', 'after_copy': 'after/' + name + '.raw'})
    patches.extend(difflib.unified_diff(prior.read_text(encoding='utf-8-sig').splitlines(keepends=True),
                                      (ROOT / name).read_text(encoding='utf-8-sig').splitlines(keepends=True),
                                      fromfile='before/' + name, tofile='after/' + name))
(OUT / 'CHANGES.patch').write_text(''.join(patches), encoding='utf-8')
save('DIFFS.json', {'changed_existing': diffs, 'reference_changes': 0, 'engine_schema_changes': 0,
                    'allowed_runtime_writes': ['Draft SQLite/audit', 'isolated test storage/profile', 'operator evidence'],
                    'canonical_source_writes_by_application': 0})

tests = (OUT / 'npm-test.txt').read_text(encoding='utf-8-sig')
for pattern in [r'tests 77\b', r'pass 77\b', r'fail 0\b', r'skipped 0\b']:
    check(bool(re.search(pattern, tests)), 'full_suite_77_pass')
for name in ['T13/T14/T16 real HTTP draft grants', 'Pinned Python rejects missing authority.level',
             'Failure inserting audit rolls back CP', 'T15 actual timeout reaps root and child tree',
             'T15 actual hard memory limit', 'T15 user cancellation differs']:
    check(name in tests, 'required_regression_executed')
check('--test-concurrency=2' in tests, 'deterministic_test_concurrency')
check('built in' in (OUT / 'build.txt').read_text(encoding='utf-8-sig'), 'frontend_build')

sentinel = load(OUT / 'BROWSER_SENTINEL.json')
check(sentinel['status'] == 'PASS' and sentinel['unchanged'] and sentinel['protected_files'] == 1521, 'edge_source_sentinel')
check(sentinel['unexpected_repository_events'] == [] and sentinel['source_writes'] == 0, 'no_unclassified_source_writes')
browser = load(OUT / 'BROWSER.json')
check(browser['status'] == 'PASS' and 'Edg/' in browser['browser'], 'actual_isolated_edge')
check(browser['console_errors'] == [] and browser['browser_storage_writes'] == [], 'no_runtime_errors_or_browser_secret_persistence')
pin = load(OUT / 'PROGRAM_PIN.json')
check(pin['unchanged'], 'browser_program_and_assets_stable')
for group in ('program', 'built_assets'):
    for name, sha in pin[group].items():
        check(digest(ROOT / name)['sha256'] == sha, 'current_' + group + '_matches_observation')

contracts = load(OUT / 'API_CONTRACTS.json')
check(contracts['status'] == 'PASS' and len(contracts['results']) == 3 and all(not r['errors'] for r in contracts['results']), 'create_request_response_error_contracts')
check(load(OUT / 'HTTP_DENIED.json')['status'] == 403, 'actual_http_403')
packages = load(OUT / 'HTTP_CREATED_LIST.json')['data']
check(len(packages) == 1 and packages[0]['status'] == 'draft', 'actual_http_saved_draft')
check(all(c['status'] == 'NOT_RUN' for c in packages[0]['checks'].values()), 'no_false_strict_or_downstream_success')
cp = packages[0]
bound = {key: cp[key] for key in ('base_package_version', 'base_candidate_hash', 'title', 'kind', 'target_item_id', 'source', 'proposed_yaml')}
canonical = json.dumps(bound, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
check(cp['proposal_version_hash'] == 'sha256:' + hashlib.sha256(canonical).hexdigest(), 'actual_cp_restricted_domain_jcs')
request = load(OUT / 'HTTP_CREATE_REQUEST.json')
check(request['proposed_yaml'] == cp['proposed_yaml'] and request['title'] == cp['title'], 'actual_request_content_preserved')

db = sqlite3.connect((OUT / 'ISOLATED_DRAFT_DB.sqlite').as_uri() + '?mode=ro', uri=True)
try:
    tables = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
    check(len(tables) == 12, 'isolated_snapshot_twelve_tables')
    check(db.execute('SELECT COUNT(*) FROM change_packages').fetchone()[0] == 1, 'isolated_cp_survived_restart')
    check(db.execute("SELECT COUNT(*) FROM audit_events WHERE json_extract(payload_json,'$.result')='DENY'").fetchone()[0] > 0, 'durable_denial_audit')
    check(db.execute("SELECT COUNT(*) FROM audit_events WHERE event_type='cp.create' AND json_extract(payload_json,'$.result')='SUCCESS'").fetchone()[0] == 1, 'one_atomic_cp_success_audit')
    check(db.execute('SELECT COUNT(*) FROM audit_events WHERE simulated_role IS NOT NULL').fetchone()[0] == 0, 'audit_real_server_identity_only')
finally:
    db.close()
activation = load(OUT / 'APP_STORAGE_ACTIVATION.json')
check(activation['status'] == 'PASS' and len(activation['observations']) == 2, 'default_app_storage_activated_and_reopened')
check(all(o['tables'] == 12 and o['drafts'] == 0 for o in activation['observations']), 'live_store_clean_no_test_cps')
check(not activation['services_left_running'] and not activation['secrets_persisted'], 'activation_harness_closed')
check(digest(ROOT / 'docs/contracts/aghr-rc3/sqlite/001_initial.sql')['sha256'] == 'd5ab6a5fa8dc3be95927d3f9871ed393a3d7f7206e102dae6f2721492dde2159', 'sql_contract_unchanged')
check('Errors: 0, Warnings: 0' in (OUT / 'context-health.txt').read_text(encoding='utf-8-sig'), 'context_health')
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
check(head == pre['HEAD'] and branch == pre['branch'], 'git_custody_unchanged')
save('VERIFICATION.json', {
    'status': 'PASS_FOR_LOCAL_DRAFT_AND_WINDOWS_FIXTURES', 'at': datetime.now(timezone.utc).isoformat(),
    'checks_passed': sum(checks.values()), 'checks_by_category': dict(checks),
    'npm_tests': {'passed': 77, 'failed': 0, 'skipped': 0}, 'API_contracts': 3,
    'browser': 'ISOLATED_EDGE_PASS', 'source_sentinel': 'PASS / 1521 unchanged; authorized fixture DB writes only',
    'default_persistent_storage': activation['path'], 'tables': 12,
    'prior_custody': {'files': len(old), 'unchanged': len(old) - len(changed), 'authorized_changes': changed},
    'T13_T14': 'IMPLEMENTED / TESTED_LOCAL_DRAFT',
    'T15': 'IMPLEMENTED / TESTED_WINDOWS_FIXTURES; real eval/qualify NOT_RUN',
    'T16': 'INITIAL_CREATE_LIST_DETAIL_DRAFT_SLICE_TESTED; E5/full lifecycle OPEN',
    'reference_1_2_0': 'UNCHANGED / ORIGINAL_APPLICATION_DEFAULT', 'engine_and_schemas': 'UNCHANGED',
    'independent_review': 'NOT_PERFORMED', 'release_acceptance': 'NOT_GRANTED',
    'E4': '7 REQUIRED / NOT_RUN / NOT_WAIVED', 'branch': branch, 'HEAD': head,
})
print(json.dumps({'status': 'PASS', 'checks': sum(checks.values()), 'tests': 77, 'contracts': 3,
                  'old_unchanged': len(old) - len(changed), 'authorized_changed': len(changed)}))
