#!/usr/bin/env python3
"""Validate Lisan Agent Skill package profiles: PROJECT_HUB or BLIND_LAB."""
from __future__ import annotations
from pathlib import Path
import hashlib, json, re, sys

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

common_required = [
    'SKILL.md', 'README.md', 'CHANGELOG.md', 'manifest.json', 'agents/openai.yaml',
    'rules/runtime/RUNTIME_KERNEL_V4.md', 'rules/runtime/STAGE_RULE_PACKS_V4.md',
    'rules/runtime/RULE_STATUS_LEDGER_V4.md',
    'references/quran/governance/LISAN_CONSTITUTIONAL_CORE_v4.0.md',
    'references/quran/governance/SOURCE_FIREWALL_CANONICAL.md',
    'references/quran/governance/CANONICAL_QURAN_TEXT_ARTIFACT_CONTRACT.md',
    'references/quran/resource-register.yaml',
    'methodology/quran/COMPACT_OPERATIONAL_RUNBOOK_V4.md',
    'methodology/quran/BLIND_LAB_MASTER_PROMPT_v3.0_CANONICAL_AR.md',
    'methodology/quran/stages/STAGE_2_ADVERSARIAL_FALSIFICATION_PROMPT.md',
    'methodology/quran/stages/STAGE_3_SEMANTIC_BOUNDARY_PROMPT.md',
    'templates/quran/10-blind-run-manifest.md',
    'templates/quran/11-occurrence-evidence-matrix.md',
    'templates/quran/13-lock-eligibility-report.md',
    'templates/quran/14-semantic-exclusion-ledger.md',
    'schemas/blind-run-manifest.schema.json',
    'schemas/lock-eligibility-report.schema.json',
    'scripts/validate_rule_consistency.py', 'scripts/validate_run_artifacts.py',
    'scripts/validate_operator_reference.py',
    'assets/quran/qac/quranic-corpus-morphology-0.4.txt',
]

try:
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
except Exception as exc:
    manifest = {}
    errors.append(f'invalid manifest: {exc}')
profile = manifest.get('package_profile')
if manifest.get('version') != '3.4.0':
    errors.append('version must be 3.4.0')
if profile not in {'PROJECT_HUB', 'BLIND_LAB'}:
    errors.append('invalid package_profile')

profile_required = []
if profile == 'PROJECT_HUB':
    profile_required = [
        'rules/06-quranic-semantic-constitution-v4.md',
        'rules/RULE_REGISTRY_V4.json',
        'rules/RULE_REGISTRY_ARABIC_INDEX.md',
        'references/quran/priors/semantic-definition-registry-v1.md',
        'references/quran/morphology/morphological-operator-registry-v0.2.json',
        'references/quran/morphology/LISAN_Quranic_Morphological_Operator_Reference_v0.2.md',
    ]
elif profile == 'BLIND_LAB':
    profile_required = [
        'rules/BLIND_SAFE_RULE_CATALOG.md',
        'rules/RULE_REGISTRY_BLIND_SAFE.json',
        'references/quran/morphology/morphological-operator-structural-registry-v0.2.json',
        'references/quran/morphology/LISAN_Quranic_Morphological_Operator_Reference_v0.2.md',
    ]
for relative in common_required + profile_required:
    if not (ROOT / relative).is_file():
        errors.append(f'missing required file: {relative}')

# Skill frontmatter and directory name.
try:
    skill_text = (ROOT / 'SKILL.md').read_text(encoding='utf-8')
    match = re.search(r'^name:\s*([^\n]+)', skill_text, re.M)
    name = match.group(1).strip() if match else ''
    if ROOT.name != name:
        errors.append(f'directory/name mismatch: {ROOT.name} != {name}')
    if len(skill_text.splitlines()) > 500:
        errors.append('SKILL.md exceeds 500 lines')
except Exception as exc:
    errors.append(f'invalid SKILL.md: {exc}')

# Profile isolation.
prior_files = [path for path in ROOT.rglob('*') if path.is_file() and ('priors' in path.parts or 'ala-basira' in path.name.lower())]
semantic_oracles = {
    'quran-n-sh-z-regression.md', 'quran-k-t-b-regression.md', 'quran-b-w-a-methodology-regression.md',
    'NSHZ_REGRESSION.md', 'KTB_REGRESSION.md', 'BWA_METHODOLOGY_REGRESSION.md',
}
if profile == 'BLIND_LAB':
    if prior_files:
        errors.append('BLIND_LAB contains prior files: ' + ', '.join(str(path.relative_to(ROOT)) for path in prior_files[:5]))
    for path in ROOT.rglob('*'):
        if path.is_file() and path.name in semantic_oracles:
            errors.append(f'BLIND_LAB contains semantic oracle: {path.relative_to(ROOT)}')
    # No root-specific methodological examples in rule catalog.
    catalog = ROOT / 'rules/BLIND_SAFE_RULE_CATALOG.md'
    if catalog.is_file():
        text = catalog.read_text(encoding='utf-8')
        for marker in ('نشوز', 'ن ش ز', 'كتب على نفسه', 'ك ت ب', 'ب و أ'):
            if marker in text:
                errors.append(f'BLIND_LAB rule catalog contains root-specific marker: {marker}')

# JSON validity.
for path in (ROOT / 'schemas').glob('*.json'):
    try:
        json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'invalid JSON {path.relative_to(ROOT)}: {exc}')
for relative in ('rules/RULE_REGISTRY_V4.json', 'rules/RULE_REGISTRY_BLIND_SAFE.json'):
    path = ROOT / relative
    if path.is_file():
        try:
            json.loads(path.read_text(encoding='utf-8'))
        except Exception as exc:
            errors.append(f'invalid JSON {relative}: {exc}')

qac = ROOT / 'assets/quran/qac/quranic-corpus-morphology-0.4.txt'
if qac.is_file() and hashlib.sha256(qac.read_bytes()).hexdigest() != 'a1d12923815341face765083805d2148ed2d9f5cc3f7d6665219d887675d8c46':
    errors.append('QAC hash mismatch')

# Checksums are mandatory and exclude their own file.
checksum_file = ROOT / 'checksums.sha256'
if not checksum_file.is_file():
    errors.append('checksums.sha256 missing')
else:
    seen: set[str] = set()
    for line in checksum_file.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        parts = line.split(None, 1)
        if len(parts) != 2:
            errors.append('malformed checksum line')
            continue
        expected, relative = parts
        relative = relative.strip().lstrip('*')
        if relative == 'checksums.sha256':
            errors.append('checksums file must not checksum itself')
            continue
        seen.add(relative)
        path = ROOT / relative
        if not path.is_file():
            errors.append(f'checksummed file missing: {relative}')
        elif hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            errors.append(f'checksum mismatch: {relative}')
    actual = {str(path.relative_to(ROOT)) for path in ROOT.rglob('*') if path.is_file() and path.name != 'checksums.sha256'}
    missing_from_index = sorted(actual - seen)
    extra = sorted(seen - actual)
    if missing_from_index:
        errors.append(f'files absent from checksums: {missing_from_index[:5]}')
    if extra:
        errors.append(f'checksum entries without files: {extra[:5]}')

# Avoid obvious generation truncation artifacts. Build markers to avoid self-matching.
markers = ('tokens ' + 'truncated', '<' + 'TRUNCATED' + '>')
for path in ROOT.rglob('*'):
    if path.is_file() and path.suffix.lower() in {'.md', '.json', '.py', '.txt', '.yaml', '.yml'}:
        text = path.read_text(encoding='utf-8', errors='replace')
        for marker in markers:
            if marker in text:
                errors.append(f'truncation marker in {path.relative_to(ROOT)}')

if errors:
    print('PACKAGE_INVALID')
    for error in errors:
        print('-', error)
    raise SystemExit(1)
print('PACKAGE_VALID')
print(f'profile={profile}')
print(f'root={ROOT}')
print(f'files={sum(1 for path in ROOT.rglob("*") if path.is_file())}')
