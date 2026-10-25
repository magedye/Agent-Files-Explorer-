"""Freeze scoped delivery evidence. Never include the mutable app database."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]


def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def digest(path):
    raw = path.read_bytes()
    return {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


assert not (OUT / 'CUSTODY.lock.json').exists(), 'Refuse to replace an evidence seal'
verification = load(OUT / 'VERIFICATION.json')
assert verification['status'] == 'PASS_FOR_LOCAL_DRAFT_AND_WINDOWS_FIXTURES'
assert verification['checks_passed'] == 1600
assert verification['npm_tests'] == {'passed': 77, 'failed': 0, 'skipped': 0}
pre = load(OUT / 'PREFLIGHT.json')
parent = ROOT / pre['parent']['path']
assert digest(parent) == {k: pre['parent'][k] for k in ('sha256', 'bytes')}
for group in ('program', 'built_assets'):
    for name, sha in load(OUT / 'PROGRAM_PIN.json')[group].items():
        assert digest(ROOT / name)['sha256'] == sha, name
new_sources = [
    'draft.html', 'server/studio/draft-runtime.js', 'server/studio/draft-routes.js',
    'server/studio/serve-draft.mjs', 'server/studio/aghr/draft-validator.js',
    'server/studio/aghr/draft-adapter.py', 'server/studio/aghr/job-runner.js',
    'server/studio/aghr/windows-job.py', 'src/features/changes/main.jsx',
    'src/features/changes/DraftStudio.jsx', 'src/features/changes/draft.css',
    'tests/studio_draft_runtime.test.mjs', 'tests/studio_job_runner.test.mjs',
    'tools/test_draft_studio_edge.mjs', 'docs/features/STUDIO_DRAFT_MODE.md',
]
assert not set(new_sources).intersection(load(parent)['files'])
save('NEW_FILES.json', {'scope': 'Created during this authorized turn; source additions only',
                       'files': {name: {'before': None, 'after': digest(ROOT / name)} for name in new_sources}})
save('RUNS.json', {
    'scope': 'Observed local command results; hashes are not approval signatures',
    'runs': [
        {'command': 'npm test', 'exit_code': 0, 'raw': 'npm-test.txt', 'passed': 77, 'failed': 0, 'skipped': 0},
        {'command': 'npm run build', 'exit_code': 0, 'raw': 'build.txt', 'warning': 'Existing large legacy bundle'},
        {'command': 'node tools/test_draft_studio_edge.mjs', 'exit_code': 0, 'raw': 'browser-run.txt'},
        {'command': 'python -X utf8 -B verify_api_contracts.py', 'exit_code': 0, 'raw': 'api-contracts.txt', 'contracts': 3},
        {'command': 'node activate_default_storage.mjs', 'exit_code': 0, 'raw': 'storage-activation.txt'},
        {'command': 'node tools/check_context_health.mjs', 'exit_code': 0, 'raw': 'context-health.txt', 'errors': 0, 'warnings': 0},
        {'command': 'python -X utf8 -B verify_delivery.py', 'exit_code': 0, 'raw': 'delivery-verification.txt', 'checks': 1600},
    ],
    'initial_failures': 'Retained with classifications in ROOT_CAUSES.json; no waiver',
})
save('DELIVERY.json', {
    'at': datetime.now(timezone.utc).isoformat(),
    'branch': verification['branch'], 'HEAD': verification['HEAD'],
    'working_tree': 'UNCOMMITTED; preexisting work preserved',
    'T12': 'FORMALLY_ACCEPTED_BY_OWNER_MOCK_ONLY; native CLI BLOCKED/3 unchanged',
    'T13': 'IMPLEMENTED / TESTED_LOCAL_DRAFT; all supported business mutations require live scoped one-use grant; other writes403 and audited',
    'T14': {'status': 'IMPLEMENTED / TESTED_LOCAL_DRAFT', 'tables': 12,
            'default_application_store': '.governance/studio-drafts/studio.sqlite',
            'actual_activation': 'APP_STORAGE_ACTIVATION.json', 'live_test_cps': 0,
            'cp_and_success_audit': 'ATOMIC', 'audit_denials': 'DURABLE'},
    'T15': {'status': 'IMPLEMENTED / TESTED_WINDOWS_FIXTURES',
            'eval': {'timeout_ms': 600000, 'memory_bytes': 2147483648},
            'qualify': {'timeout_ms': 3600000, 'memory_bytes': 2147483648},
            'fixture_memory_bytes': 134217728, 'actual_eval_qualify': 'NOT_RUN',
            'raw_peak_counter': 'Retained verbatim; internal interpretation above configured test cap remainsUNKNOWN; allocation denial and hard-limit readback separately proven'},
    'T16': {'status': 'INITIAL_CREATE_LIST_DETAIL_DRAFT_SLICE_TESTED',
            'request': 'Locked Create schema; exact prepared content + grant + If-Match',
            'frontend': 'Arabic/English RTL/LTR; native textarea, not full schema editor',
            'hash_profile': 'LOCAL_ADAPTER_NOT_E5; restricted JCS domain verified',
            'strict_and_downstream_checks': 'NOT_RUN',
            'remaining': 'Qualified E5 engine-owned proposal processing, operational kinds/calibration, edit/validate/submit and full lifecycle'},
    'verification': {'tests': verification['npm_tests'], 'contracts': 3, 'artifact_checks': 1600,
                     'browser': 'Isolated Microsoft Edge/direct CDP PASS',
                     'source_sentinel': '1521 protected prior files unchanged; fixture SQLite/profile writes authorized',
                     'context_health': '0 errors / 0 warnings'},
    'preserved': {'reference_1_2_0': 'UNCHANGED / ORIGINAL_APPLICATION_DEFAULT',
                  'read_only_profile': 'UNCHANGED / MEMORY_ONLY',
                  'engine46_and_schemas': 'UNCHANGED', 'contracts': 'UNCHANGED',
                  'canonical_source_writes': 0, 'final_packages_published': 0},
    'prior_custody': verification['prior_custody'],
    'E3_real': 'NOT_STARTED', 'E4': '7 REQUIRED / NOT_RUN / NOT_WAIVED',
    'independent_review': 'NOT_PERFORMED', 'release_acceptance': 'NOT_GRANTED',
    'next_action': 'Continue T16 through qualified E5 processing; preserve Draft-only/source boundaries.',
})
paths = set(load(parent)['files']) | set(pre['before']) | set(new_sources) | {pre['parent']['path']}
for path in OUT.rglob('*'):
    if path.is_file():
        assert not path.is_symlink()
        paths.add(path.relative_to(ROOT).as_posix())
lock_name = (OUT / 'CUSTODY.lock.json').relative_to(ROOT).as_posix()
assert lock_name not in paths
assert not any(name.startswith('.governance/') for name in paths)
files = {name: digest(ROOT / name) for name in sorted(paths)}
save('CUSTODY.lock.json', {
    'algorithm': 'SHA-256 raw bytes; excludes this lock itself; hashes are not approval signatures',
    'at': datetime.now(timezone.utc).isoformat(),
    'scope': 'Authorized Draft backend/UI, Windows resource fixtures, actual outputs, raw before/after and prior custody chain',
    'qualification': 'LOCAL_DRAFT_AND_WINDOWS_FIXTURES_ONLY; no real E3/E4/release acceptance',
    'excluded_runtime': '.governance/studio-drafts/studio.sqlite and journals are mutable; observation receipt only',
    'parent_receipt': pre['parent'], 'files': files,
})
for name, pin in files.items():
    assert digest(ROOT / name) == pin, 'Drift while sealing: ' + name
print(json.dumps({'status': 'SEALED_AND_VERIFIED', 'files': len(files), 'lock': lock_name,
                  **digest(OUT / 'CUSTODY.lock.json')}))
