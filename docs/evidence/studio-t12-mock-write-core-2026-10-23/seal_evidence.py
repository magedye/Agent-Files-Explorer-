"""Seal the exact mock delivery and isolated authorization/storage core."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]


def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def digest(path):
    raw = path.read_bytes()
    return {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


assert not (OUT / 'CUSTODY.lock.json').exists(), 'Refuse to overwrite an existing evidence seal'
verification = load(OUT / 'VERIFICATION.json')
assert verification['status'] == 'PASS_FOR_MOCK_AND_ISOLATED_CORE'
assert verification['checks_passed'] == 1571
assert verification['context_health'] == 'PASS'
assert verification['npm_tests'] == {'passed': 68, 'failed': 0, 'skipped': 0}
preflight = load(OUT / 'PREFLIGHT.json')
parent_path = ROOT / preflight['prior_custody']['path']
parent_pin = {key: preflight['prior_custody'][key] for key in ('sha256', 'bytes')}
assert digest(parent_path) == parent_pin
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
assert head == preflight['HEAD'] and branch == preflight['branch']

save('DELIVERY.json', {
    'at': datetime.now(timezone.utc).isoformat(),
    'branch': branch, 'HEAD': head, 'working_tree': 'UNCOMMITTED; preexisting work preserved',
    'T12': {
        'status': 'CLOSED_FOR_T12_OWNER_APPROVED_MOCK_ONLY',
        'owner_conditional_acceptance': 'MET per explicit current owner directive',
        'candidate': load(OUT / 'HOST_FIXTURE_PIN.json')['candidate_root'],
        'rules': 47, 'active_mandatory_overrides': 44,
        'mock_validate_strict_exit': 0, 'mock_lint_exit': 0, 'native_cli_control_exit': 3,
        'source_grant': 'OWNER_GRANTED_T12 / T12_OWNER_APPROVED_MOCK; ephemeral Ed25519 test key',
        'E3_mock_rules': ['AGHR-004', 'AGHR-014', 'AGHR-016'],
        'private_key_persisted': False,
        'real_publisher_authentication': 'UNKNOWN',
        'governance_release_acceptance': 'NOT_GRANTED',
    },
    'T13': {
        'status': 'CORE_IMPLEMENTED_TESTED; INTERACTIVE_INTEGRATION_OPEN',
        'implemented': [
            'Server-owned identity and scoped expiring grants; revalidation at the effect',
            'Opaque one-use receipts; mock labels and JSON cannot grant real privileges',
            'Legacy writes rejected before body parsing; fixed authorization fallback removed',
        ],
        'live_write_routes_activated': False,
    },
    'T14': {
        'status': 'CORE_TESTED_TEMP_DISK; APPLICATION_STORAGE_NOT_ACTIVATED',
        'tables': 12, 'default_application_storage': ':memory:',
        'evidence': 'Authorized temporary SQLite disk: migrate, audit, reopen, atomic rollback, FK and DDL drift checks',
    },
    'verification': {
        'npm_tests': verification['npm_tests'], 'artifact_checks': verification['checks_passed'],
        'context_health': '0 errors / 0 warnings',
        'new_browser_sentinel': 'NOT_RUN; scoped protected Node/API zero-write regression passed',
        'independent_review': 'NOT_PERFORMED; adversarial self-review only',
    },
    'preserved': {
        'reference_1_2_0': 'UNCHANGED / DEFAULT', 'original_T12_drafts': 'UNCHANGED',
        'engine_and_schemas': 'UNCHANGED', 'public_contracts': 'UNCHANGED',
        'live_application_data_writes': 0,
    },
    'prior_custody': verification['prior_custody'],
    'per_turn_baseline': verification['per_turn_baseline'],
    'deferred_gates': {'E3_real': 'NOT_STARTED', 'E4': '7 REQUIRED / NOT_RUN / NOT_WAIVED'},
    'next_action': 'Complete T13/T14 interactive identity/grant/business-controller/audit integration with isolated tests; keep live application writes disabled.',
})

paths = set(load(parent_path)['files'])
paths.add(preflight['prior_custody']['path'])
paths.update(preflight['before'])
paths.update(load(OUT / 'ADDITIONAL_BEFORE.json'))
paths.update([
    'server/studio/write-authorization.js', 'server/studio/db/persistent.js',
    'tests/studio_t12_mock.test.mjs', 'tests/studio_write_authorization.test.mjs',
    'tests/studio_persistence.test.mjs',
])
for directory in [OUT, ROOT / 'tools/t12', ROOT / load(OUT / 'HOST_FIXTURE_PIN.json')['candidate_root']]:
    for path in directory.rglob('*'):
        if path.is_file():
            assert not path.is_symlink(), 'Evidence must not traverse symlinks'
            paths.add(path.relative_to(ROOT).as_posix())
lock_name = (OUT / 'CUSTODY.lock.json').relative_to(ROOT).as_posix()
assert lock_name not in paths
files = {name: digest(ROOT / name) for name in sorted(paths)}
save('CUSTODY.lock.json', {
    'algorithm': 'SHA-256 raw bytes; excludes this lock itself; hashes are not approval signatures',
    'at': datetime.now(timezone.utc).isoformat(),
    'scope': 'Owner-approved T12 mock variant, isolated T13/T14 backend core, actual outputs, before/after and prior custody chain',
    'T12': 'CLOSED_FOR_T12_OWNER_APPROVED_MOCK_ONLY; native CLI remains BLOCKED/3',
    'T13_T14': 'ISOLATED_CORE_TESTED; integration and live activation open',
    'parent_receipt': {'path': preflight['prior_custody']['path'], **parent_pin},
    'files': files,
})
for name, pin in files.items():
    assert digest(ROOT / name) == pin, 'File changed during sealing: ' + name
print(json.dumps({'status': 'SEALED_AND_VERIFIED', 'files': len(files), 'lock': lock_name, **digest(OUT / 'CUSTODY.lock.json')}))
