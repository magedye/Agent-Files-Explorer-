"""Scoped custody and packaging helper for the owner-authorized 1.2.0 update."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGES = ROOT / 'governance_packages'
SOURCE = PACKAGES / 'candidates/AGHR_Candidate_1.2.0'
WORK = PACKAGES / 'candidates/AGHR_Reference_1.2.0_update_20261020'
FINAL = PACKAGES / 'references/Agent_Governance_Harness_Reference_1.2.0'
EVIDENCE = ROOT / 'docs/evidence/reference-1.2.0-update'
TEST_INPUT_PREFIXES = ('runtime/', 'tools/', 'tests/', 'schemas/', 'registry/', 'templates/',
                       'optional_skills/', 'procedures/', 'policies/', 'sources/', 'design/')

def stamp():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

def inventory(root):
    result = {}
    for base, dirs, files in os.walk(root, followlinks=False):
        for name in dirs + files:
            if (Path(base) / name).is_symlink():
                raise ValueError('Symlink in package; stop custody operation')
        dirs[:] = [name for name in dirs if name != '__pycache__']
        for name in files:
            if name.endswith('.pyc'):
                continue
            file = Path(base) / name
            result[file.relative_to(root).as_posix()] = {'sha256': sha(file), 'bytes': file.stat().st_size}
    return dict(sorted(result.items()))

def save(name, value):
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    with (EVIDENCE / name).open('x', encoding='utf-8') as stream:
        json.dump(value, stream, indent=2, ensure_ascii=False)
        stream.write('\n')

def prepare():
    if WORK.exists() or FINAL.exists():
        raise ValueError('Update destination already exists')
    before = inventory(SOURCE)
    save('before-files.json', {'observed_at': stamp(), 'root': SOURCE.relative_to(ROOT).as_posix(), 'files': before})
    source_zip = PACKAGES / 'candidates/AGHR_Candidate_1.2.0.zip'
    save('before-status.json', {
        'observed_at': stamp(), 'status': json.loads((SOURCE / 'PACKAGE_STATUS.json').read_text(encoding='utf-8')),
        'manifest_sha256': sha(SOURCE / 'MANIFEST.json'),
        'archive_sha256': sha(source_zip), 'owner_authority': 'Current user instruction, 2026-10-20: update and convert the candidate to a reference',
    })
    shutil.copytree(SOURCE, WORK, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    if inventory(WORK) != before:
        raise ValueError('Copy custody mismatch')
    print(json.dumps({'status': 'PREPARED', 'files': len(before), 'work': str(WORK)}))

def run_check(root, label, command):
    input_files = {name: row for name, row in inventory(root).items()
                   if name.startswith(TEST_INPUT_PREFIXES)}
    env = dict(os.environ, PYTHONIOENCODING='utf-8', PYTHONDONTWRITEBYTECODE='1')
    result = subprocess.run([sys.executable, '-B', *command], cwd=root, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace')
    save(label + '.json', {'observed_at': stamp(), 'root': root.relative_to(ROOT).as_posix(), 'argv': command,
                          'implementation_files': input_files, 'manifest_sha256': sha(root / 'MANIFEST.json'),
                          'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
    print(json.dumps({'check': label, 'exit_code': result.returncode, 'tail': result.stdout[-900:]}))
    return result.returncode

def freeze(root):
    files = inventory(root)
    payload = {name: row['sha256'] for name, row in files.items() if name != 'MANIFEST.json' and not name.startswith('verification/results/')}
    record = {'package': 'AGHR', 'version': '1.2.0', 'frozen_at': stamp(), 'algorithm': 'sha256',
              'exclusions': ['MANIFEST.json', '**/__pycache__/**', '**/*.pyc', 'verification/results/**'],
              'note': 'Hashes establish integrity, not author identity. Prior historical evidence is not current qualification.', 'files': payload}
    (root / 'MANIFEST.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': 'FROZEN', 'files': len(payload), 'manifest_sha256': sha(root / 'MANIFEST.json')}))

def compare(root):
    before = json.loads((EVIDENCE / 'before-files.json').read_text(encoding='utf-8'))['files']
    after = inventory(root)
    rows = [{'path': name, 'change': 'ADD' if name not in before else 'REMOVE' if name not in after else 'MODIFY',
             'before': before.get(name), 'after': after.get(name)}
            for name in sorted(set(before) | set(after)) if before.get(name) != after.get(name)]
    save('before-after-files.json', {'observed_at': stamp(), 'before_status': 'CANDIDATE_FOR_REVIEW',
                                   'after_status': json.loads((root / 'PACKAGE_STATUS.json').read_text(encoding='utf-8')), 'changes': rows})
    import difflib
    with (EVIDENCE / 'reference-update.diff').open('x', encoding='utf-8') as stream:
        for row in rows:
            name = row['path']
            if name.endswith(('.md', '.json', '.py', '.txt')) or name == 'VERSION':
                a = (SOURCE / name).read_text(encoding='utf-8').splitlines(True) if name in before else []
                b = (root / name).read_text(encoding='utf-8').splitlines(True) if name in after else []
                stream.writelines(difflib.unified_diff(a, b, fromfile='before/' + name, tofile='after/' + name))
    print(json.dumps({'changes': len(rows)}))

def promote():
    before = json.loads((EVIDENCE / 'before-files.json').read_text(encoding='utf-8'))['files']
    if inventory(SOURCE) != before:
        raise ValueError('Original candidate changed; stop promotion')
    tests = json.loads((EVIDENCE / 'qualifying-tests.json').read_text(encoding='utf-8'))
    check = json.loads((EVIDENCE / 'frozen-package-check.json').read_text(encoding='utf-8'))
    inputs = {name: row for name, row in inventory(WORK).items() if name.startswith(TEST_INPUT_PREFIXES)}
    if tests['exit_code'] or tests['implementation_files'] != inputs or check['exit_code'] or check['manifest_sha256'] != sha(WORK / 'MANIFEST.json'):
        raise ValueError('Promotion verification does not match the current implementation/manifest')
    archive = PACKAGES / 'archive/AGHR_Candidate_1.2.0_pre_update_20261020'
    old_zip = PACKAGES / 'candidates/AGHR_Candidate_1.2.0.zip'
    archive_zip = PACKAGES / 'archive/AGHR_Candidate_1.2.0_pre_update_20261020.zip'
    for target in (SOURCE, WORK, FINAL, archive, old_zip, archive_zip):
        if not target.resolve().is_relative_to(PACKAGES.resolve()):
            raise ValueError('Operation outside package workspace')
    if FINAL.exists() or archive.exists() or archive_zip.exists():
        raise ValueError('Promotion destination already exists')
    recorded = json.loads((EVIDENCE / 'before-status.json').read_text(encoding='utf-8'))
    if sha(old_zip) != recorded['archive_sha256']:
        raise ValueError('Original candidate ZIP changed; stop promotion')
    WORK.rename(FINAL)
    SOURCE.rename(archive)
    old_zip.rename(archive_zip)
    if inventory(archive) != before:
        raise ValueError('Archived candidate custody mismatch')
    distribution = FINAL.parent / (FINAL.name + '.zip')
    with zipfile.ZipFile(distribution, 'x', compression=zipfile.ZIP_DEFLATED) as output:
        for name in inventory(FINAL):
            output.write(FINAL / name, FINAL.name + '/' + name)
    with zipfile.ZipFile(distribution) as bundled:
        delivered = {name.removeprefix(FINAL.name + '/'): hashlib.sha256(bundled.read(name)).hexdigest() for name in bundled.namelist()}
    if delivered != {name: row['sha256'] for name, row in inventory(FINAL).items()}:
        raise ValueError('Distribution payload differs from the reference')
    save('delivery.json', {'observed_at': stamp(), 'reference': FINAL.relative_to(ROOT).as_posix(),
                          'archive': archive.relative_to(ROOT).as_posix(), 'distribution': distribution.relative_to(ROOT).as_posix(),
                          'sha256': sha(distribution), 'manifest_sha256': sha(FINAL / 'MANIFEST.json'),
                          'source_preserved': True, 'reference_designation': 'OWNER_DIRECTED', 'independent_review': 'NOT_PERFORMED',
                          'distribution_payload_verified': True,
                          'consumer_activation': 'NOT_PERFORMED', 'external_publication': 'NOT_PERFORMED'})
    print(json.dumps({'status': 'PROMOTED', 'path': str(FINAL), 'zip_sha256': sha(distribution)}))

def fetch_sources():
    from urllib.request import Request, urlopen
    def fetch(url):
        with urlopen(Request(url, headers={'User-Agent': 'AGHR-source-review'}), timeout=25) as response:
            return response.read()
    commit = json.loads(fetch('https://api.github.com/repos/Hainrixz/aprende-skill/commits/main'))['sha']
    names = ['skills/aprende/SKILL.md', 'skills/aprende/references/lesson-format.md',
             'skills/aprende/references/review-workflow.md', '.claude-plugin/plugin.json',
             'hooks/hooks.json', 'hooks-handlers/capture-signal.sh', 'hooks-handlers/stop-suggest.sh', 'LICENSE']
    destination = EVIDENCE / 'external-source'
    destination.mkdir(parents=True, exist_ok=False)
    rows = []
    for name in names:
        url = f'https://raw.githubusercontent.com/Hainrixz/aprende-skill/{commit}/{name}'
        data = fetch(url)
        target = destination / (name + '.source.txt' if name.endswith('.md') else name)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('xb') as stream: stream.write(data)
        rows.append({'path': name, 'url': url, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
    save('external-source-receipt.json', {'retrieved_at': stamp(), 'repository': 'Hainrixz/aprende-skill', 'commit': commit,
                                       'execution': 'NOT_PERFORMED', 'installation': 'NOT_PERFORMED', 'files': rows})
    print(json.dumps({'status': 'CAPTURED_NOT_EXECUTED', 'commit': commit, 'files': len(rows)}))

if __name__ == '__main__':
    action = sys.argv[1]
    if action == 'prepare': prepare()
    elif action == 'baseline':
        run_check(SOURCE, 'before-package-check', ['tools/check_package.py'])
        run_check(SOURCE, 'before-tests', ['tools/run_tests.py'])
    elif action == 'freeze': freeze(WORK)
    elif action == 'implementation':
        code = run_check(WORK, 'implementation-preflight', ['tools/check_package.py', '--preflight'])
        code |= run_check(WORK, 'implementation-tests', ['tools/run_tests.py'])
        sys.exit(code)
    elif action == 'check':
        code = run_check(WORK, 'updated-package-check', ['tools/check_package.py'])
        code |= run_check(WORK, 'updated-tests', ['tools/run_tests.py'])
        sys.exit(code)
    elif action == 'qualify':
        code = run_check(WORK, 'qualifying-package-check', ['tools/check_package.py'])
        code |= run_check(WORK, 'qualifying-tests', ['tools/run_tests.py'])
        sys.exit(code)
    elif action == 'compare': compare(WORK)
    elif action == 'final-check':
        sys.exit(run_check(WORK, 'frozen-package-check', ['tools/check_package.py']))
    elif action == 'promote': promote()
    elif action == 'sources': fetch_sources()
    else: raise ValueError('Unknown action')
