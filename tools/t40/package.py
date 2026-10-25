"""Local, deterministic custody/package builder; never publishes or signs."""
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/evidence/studio-release-2026-10-25'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8-sig'))


def save(name, value):
    path = OUT / name
    if path.exists():
        raise RuntimeError(f'PRESERVE_EXISTING_ARTIFACT: {name}')
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def record(path):
    data = path.read_bytes()
    return {'sha256': digest(data), 'bytes': len(data)}


def safe(name):
    parts = name.split('/')
    if Path(name).is_absolute() or '\\' in name or ':' in name or any(p in ('', '.', '..', '.git', 'ci-private', 'backups', 'staging', '__pycache__') for p in parts):
        raise RuntimeError(f'UNSAFE_PATH: {name}')
    if Path(name).suffix.lower() in ('.key', '.pem', '.pfx', '.token', '.secret', '.pyc'):
        raise RuntimeError(f'SECRET_OR_GENERATED_PATH: {name}')
    return name


def archive(path, entries):
    if path.exists():
        raise RuntimeError(f'PRESERVE_EXISTING_ARCHIVE: {path}')
    with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name, data in sorted(entries.items()):
            info = zipfile.ZipInfo(safe(name), date_time=(2026, 10, 25, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            z.writestr(info, data)
    with zipfile.ZipFile(path) as z:
        if z.testzip() is not None or sorted(z.namelist()) != sorted(entries):
            raise RuntimeError('ARCHIVE_MEMBER_MISMATCH')
        for name, data in entries.items():
            if z.read(name) != data:
                raise RuntimeError(f'ARCHIVE_BYTES_MISMATCH: {name}')


def freeze():
    coverage = read('docs/evidence/studio-release-2026-10-25/coverage/coverage-summary.json')['total']
    if coverage['lines']['covered'] / coverage['lines']['total'] < .8:
        raise RuntimeError('MANDATORY_COVERAGE_GATE_FAILED')
    baseline_name = 'docs/evidence/studio-t36-completion-2026-10-25/v3/TESTED_SOURCE.lock.json'
    baseline = read(baseline_name)
    test_only_changes = []
    for name, expected in baseline['files'].items():
        if record(ROOT / name) != expected:
            if name != 'tests/inbox_custody.test.mjs':
                raise RuntimeError(f'T36_SOURCE_DRIFT: {name}')
            test_only_changes.append({'path': name, 'before': expected, 'after': record(ROOT / name), 'reason': 'STALE_CONTEXT: preserve all23 originals and pin the one pre-existing INBOX addition; no product change'})
    names = set(baseline['files'])
    # Bounded product/test/tool roots only. Governance packages are never crawled.
    for folder in ('server', 'src', 'tests', 'tools', '.github', 'docs/contracts/aghr-rc3', 'docs/specs/aghr-rc3'):
        for p in (ROOT / folder).rglob('*'):
            rel = p.relative_to(ROOT).as_posix()
            if p.is_symlink() or p.is_junction():
                raise RuntimeError(f'REPARSE_POINT: {rel}')
            if '__pycache__' not in p.parts and p.is_file() and p.suffix != '.pyc':
                names.add(safe(rel))
    names.update(('AGENTS.md', 'PROJECT_MAP.md', 'package.json', 'package-lock.json', 'vite.config.mjs',
                  'index.html', 'draft.html', 'phase0.html', '.gitignore', '.gitattributes',
                  'packaging/aghr-studio/pyproject.toml', 'packaging/aghr-studio/aghr_studio/__init__.py',
                  '.github/aghr-publisher-policy.json',
                  'docs/governance/STUDIO_WINDOWS_SCOPE_2026_10_25.md',
                  'docs/evidence/inbox/2026-10-20-custody.json',
                  'docs/evidence/inbox/2026-10-21-01-custody.json',
                  'docs/evidence/inbox/2026-10-21-02-custody.json',
                  'docs/evidence/inbox/2026-10-25-custody.json',
                  'docs/governance/STUDIO_T37_T40_OWNER_DECISION_2026_10_25.md'))
    entries = {safe(n): (ROOT / n).read_bytes() for n in sorted(names)}
    source = {'profile': 'FROZEN_WINDOWS_LOCAL_DRAFT_FOR_OWNER_DECISION',
              'git_head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
              'git_branch': subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip(),
              'custody': 'Dirty working-tree bytes are authoritative for this candidate; HEAD alone cannot reproduce it.',
              'parent': {'path': baseline_name, **record(ROOT / baseline_name)},
              'test_only_changes': test_only_changes,
              'files': {n: {'sha256': digest(b), 'bytes': len(b)} for n, b in entries.items()}}
    save('FROZEN_SOURCE.lock.json', source)
    archive(OUT / 'FROZEN_SOURCE.zip', entries)
    build = read('docs/evidence/studio-t38-2026-10-25/PACKAGE_BUILD.lock.json')
    wheel = ROOT / build['wheel']['path']
    if record(wheel)['sha256'] != build['wheel']['sha256']:
        raise RuntimeError('T38_WHEEL_DRIFT')
    distribution = read('docs/evidence/studio-t38-2026-10-25/DISTRIBUTION.lock.json')
    payload = ROOT / 'packaging/aghr-studio/aghr_studio/payload'
    for name, expected in distribution['files'].items():
        if record(payload / name) != expected:
            raise RuntimeError(f'INSTALLED_PAYLOAD_DRIFT: {name}')
    with zipfile.ZipFile(wheel) as z:
        for name, expected in distribution['files'].items():
            data = z.read('aghr_studio/payload/' + name)
            if {'sha256': digest(data), 'bytes': len(data)} != expected:
                raise RuntimeError(f'WHEEL_PAYLOAD_DRIFT: {name}')
    save('FROZEN_CANDIDATE.json', {
        'target_decision_version': '1.0.0', 'installed_wheel_version': '0.1.0.dev20261025+win.3',
        'source': {'path': 'FROZEN_SOURCE.lock.json', **record(OUT / 'FROZEN_SOURCE.lock.json')},
        'source_archive': {'path': 'FROZEN_SOURCE.zip', **record(OUT / 'FROZEN_SOURCE.zip')},
        'wheel': {'path': build['wheel']['path'], **record(wheel)},
        'payload_files_verified': len(distribution['files']), 'coverage': coverage,
        'source_product_changes_since_T36': [], 'publisher_signature': 'UNSIGNED_NOT_AUTHENTICATED',
        'public_release': 'NOT_AUTHORIZED', 'owner_T40_signature': 'PENDING'})
    lock = read('package-lock.json')
    audit = read('docs/evidence/studio-release-2026-10-25/NPM_AUDIT.json')
    wheels = read('docs/evidence/studio-t38-2026-10-25/WHEELHOUSE.lock.json')['wheels']
    for item in wheels:
        if record(ROOT / 'temp/t38-wheelhouse' / item['name'])['sha256'] != item['sha256']:
            raise RuntimeError('DEPENDENCY_WHEEL_DRIFT')
    with zipfile.ZipFile(wheel) as z:
        names = z.namelist()
        dev_members = [n for n in names if '/node_modules/vite/' in n or '/node_modules/source-map-js/' in n]
    if dev_members:
        raise RuntimeError('UNEXPECTED_DEV_DEPENDENCY_IN_WHEEL')
    save('DEPENDENCIES.json', {
        'package_lock': record(ROOT / 'package-lock.json'), 'npm_tree_exit': int((OUT / 'NPM_TREE.exit.txt').read_text(encoding='utf-8-sig').strip()),
        'npm_integrity_entries': sum(bool(v.get('integrity')) for v in lock['packages'].values()),
        'runtime_ws_version': lock['packages']['node_modules/ws']['version'],
        'full_npm_audit': audit['metadata'],
        'production_npm_audit': read('docs/evidence/studio-release-2026-10-25/NPM_AUDIT_PRODUCTION.json')['metadata'],
        'known_vulnerabilities': audit['vulnerabilities'], 'vulnerable_packages_are_dev': all(lock['packages']['node_modules/' + n].get('dev') for n in audit['vulnerabilities']),
        'dev_packages_in_installer': dev_members, 'python_wheels_hash_verified': wheels,
        'limits': ['No dependency upgrades', 'npm audit is a point-in-time registry check, not a full security audit', 'Python vulnerability database NOT_CHECKED', 'Node/Python/pipx external prerequisites', 'License remains provisional/internal; no public license clearance']})
    save('SIGNATURES.json', {'publisher': 'UNSIGNED_NOT_AUTHENTICATED', 'gpg': 'NOT_CONFIGURED_OWNER_ACCEPTED_WARNING',
                            'source_and_wheel_hashes': 'SHA256_INTEGRITY_ONLY', 'wheel_RECORD': 'Per-member packaging integrity, not publisher authentication',
                            'owner_T40': 'PENDING_SIGNATURE', 'private_key_access': 'NONE', 'public_release': 'NOT_AUTHORIZED'})
    print(json.dumps(read('docs/evidence/studio-release-2026-10-25/FROZEN_CANDIDATE.json'), indent=2))


def packet():
    source = read('docs/evidence/studio-release-2026-10-25/FROZEN_SOURCE.lock.json')
    for name, expected in source['files'].items():
        if record(ROOT / name) != expected:
            raise RuntimeError(f'FROZEN_SOURCE_DRIFT: {name}')
    entries = {}
    # Only explicitly selected public evidence is exported, never raw token logs.
    selected = read('docs/evidence/studio-release-2026-10-25/PACKET_INPUTS.json')
    for dest, name in selected.items():
        entries[safe(dest)] = (ROOT / name).read_bytes()
    receipt = {n: {'sha256': digest(b), 'bytes': len(b)} for n, b in sorted(entries.items())}
    entries['MANIFEST.sha256.json'] = (json.dumps(receipt, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    entries['SHA256SUMS.txt'] = ''.join(f"{v['sha256']}  {n}\n" for n, v in receipt.items()).encode('utf-8')
    target = OUT / 'AGHR_Studio_v1.0.0_T40_OWNER_SIGNATURE_PACKET.zip'
    archive(target, entries)
    save('PACKET_RECEIPT.json', {'archive': target.name, **record(target), 'members': len(entries),
                              'byte_verification': 'PASS_ALL_MEMBERS', 'signature': 'PENDING_OWNER',
                              'public_release': 'NOT_AUTHORIZED'})
    print(json.dumps(read('docs/evidence/studio-release-2026-10-25/PACKET_RECEIPT.json'), indent=2))


if __name__ == '__main__':
    {'freeze': freeze, 'packet': packet}[sys.argv[1]]()
