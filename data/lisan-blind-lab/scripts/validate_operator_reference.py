#!/usr/bin/env python3
"""Validate Lisan morphological operator references for full and blind-safe packages."""
from __future__ import annotations
from collections import Counter, defaultdict
from pathlib import Path
import argparse, hashlib, json, re, sys

EXPECTED_QAC_HASH = 'a1d12923815341face765083805d2148ed2d9f5cc3f7d6665219d887675d8c46'

try:
    from jsonschema import Draft202012Validator
except Exception:
    Draft202012Validator = None


def discover(start: Path) -> tuple[Path, dict[str, Path], str]:
    for root in [start, *start.parents]:
        if (root / '12_MORPHOLOGICAL_OPERATOR_REFERENCE').is_dir():
            return root, {
                'qac': root / '07_REFERENCE_INPUTS/QAC_STRUCTURAL_NOTES.txt',
                'registry': root / '12_MORPHOLOGICAL_OPERATOR_REFERENCE/LISAN_Quranic_Morphological_Operator_Registry_v0.2.json',
                'md': root / '12_MORPHOLOGICAL_OPERATOR_REFERENCE/LISAN_Quranic_Morphological_Operator_Reference_v0.2.md',
                'schema': root / '11_VALIDATION/morphological-operator-entry.schema.json',
                'rules': root / '03_RULES/FORMAL_RULE_REGISTRY_v3.4.0.md',
            }, 'FULL'
        structural = root / 'references/quran/morphology/morphological-operator-structural-registry-v0.2.json'
        if structural.is_file():
            return root, {
                'qac': root / 'assets/quran/qac/quranic-corpus-morphology-0.4.txt',
                'registry': structural,
                'md': root / 'references/quran/morphology/LISAN_Quranic_Morphological_Operator_Reference_v0.2.md',
                'schema': root / 'schemas/morphological-operator-entry.schema.json',
                'rules': root / 'rules/BLIND_SAFE_RULE_CATALOG.md',
            }, 'BLIND_STRUCTURAL'
        full = root / 'references/quran/morphology/morphological-operator-registry-v0.2.json'
        if full.is_file():
            return root, {
                'qac': root / 'assets/quran/qac/quranic-corpus-morphology-0.4.txt',
                'registry': full,
                'md': root / 'references/quran/morphology/LISAN_Quranic_Morphological_Operator_Reference_v0.2.md',
                'schema': root / 'schemas/morphological-operator-entry.schema.json',
                'rules': root / 'rules/06-quranic-semantic-constitution-v4.md',
            }, 'FULL'
    raise FileNotFoundError('operator reference layout not found')


def fail(errors: list[str]) -> None:
    print('OPERATOR_REFERENCE_INVALID')
    for error in errors:
        print('-', error)
    raise SystemExit(1)

ap = argparse.ArgumentParser()
ap.add_argument('--root', type=Path)
ns = ap.parse_args()
ROOT, paths, mode = discover((ns.root or Path(__file__).resolve().parent).resolve())
errors: list[str] = []
for key, path in paths.items():
    if not path.is_file():
        errors.append(f'missing {key}: {path}')
if errors:
    fail(errors)
if hashlib.sha256(paths['qac'].read_bytes()).hexdigest() != EXPECTED_QAC_HASH:
    errors.append('QAC hash mismatch')

try:
    data = json.loads(paths['registry'].read_text(encoding='utf-8'))
except Exception as exc:
    fail([f'invalid registry JSON: {exc}'])
operators = data.get('operators', [])
if mode == 'FULL' and data.get('version') != '0.2.0':
    errors.append('full registry version must be 0.2.0')
if mode == 'BLIND_STRUCTURAL' and not str(data.get('version', '')).startswith('0.2.0'):
    errors.append('blind structural registry must derive from v0.2.0')
if len(operators) != 33:
    errors.append(f'expected 33 operators, got {len(operators)}')

if mode == 'FULL' and Draft202012Validator:
    schema = json.loads(paths['schema'].read_text(encoding='utf-8'))
    validator = Draft202012Validator(schema)
    for index, entry in enumerate(operators):
        for err in validator.iter_errors(entry):
            errors.append(f'operator[{index}] {list(err.path)}: {err.message}')
if mode == 'BLIND_STRUCTURAL':
    forbidden = {'semantic_candidate', 'local_realizations', 'semantic_status', 'claim_scope', 'confidence', 'examples', 'excluded_inferences', 'next_test'}
    for index, entry in enumerate(operators):
        leaked = sorted(forbidden.intersection(entry))
        if leaked:
            errors.append(f'blind operator[{index}] contains semantic fields: {leaked}')

form_counts: Counter[str] = Counter()
form_roots: defaultdict[str, set[str]] = defaultdict(set)
feature_counts: Counter[str] = Counter()
feature_roots: defaultdict[str, set[str]] = defaultdict(set)
tri = quad = malformed = 0
tri_roots: set[str] = set(); quad_roots: set[str] = set()
with paths['qac'].open('r', encoding='utf-8-sig', newline='') as handle:
    for line_no, raw in enumerate(handle, 1):
        if not raw.strip() or raw.startswith('#') or raw.startswith('LOCATION\t'):
            continue
        columns = raw.rstrip('\r\n').split('\t')
        if len(columns) != 4:
            malformed += 1
            continue
        _location, _surface, tag, feature_raw = columns
        features = feature_raw.split('|')
        root = next((item[5:] for item in features if item.startswith('ROOT:')), None)
        form = next((item.strip('()') for item in features if item.startswith('(') and item.endswith(')')), None)
        if tag == 'V':
            bucket = form or 'UNTAGGED'
            form_counts[bucket] += 1
            if root:
                form_roots[bucket].add(root)
            if form is None and root:
                if len(root) == 3:
                    tri += 1; tri_roots.add(root)
                elif len(root) == 4:
                    quad += 1; quad_roots.add(root)
            for feature, key in [('PERF','PERF'),('IMPF','IMPF'),('IMPV','IMPV'),('PASS','PASSIVE'),('MOOD:SUBJ','SUBJ'),('MOOD:JUS','JUS')]:
                if feature in features:
                    feature_counts[key] += 1
                    if root: feature_roots[key].add(root)
        if 'VN' in features:
            feature_counts['VERBAL_NOUN'] += 1
            if root: feature_roots['VERBAL_NOUN'].add(root)
        if 'PCPL' in features and 'ACT' in features:
            feature_counts['ACTIVE_PARTICIPLE'] += 1
            if root: feature_roots['ACTIVE_PARTICIPLE'].add(root)
        if 'PCPL' in features and 'PASS' in features:
            feature_counts['PASSIVE_PARTICIPLE'] += 1
            if root: feature_roots['PASSIVE_PARTICIPLE'].add(root)
if malformed:
    errors.append(f'malformed QAC rows: {malformed}')

by_id = {entry.get('operator_id'): entry for entry in operators}
expected: dict[str, tuple[int, int]] = {
    'UNTAGGED_BASE_BUCKET': (form_counts['UNTAGGED'], len(form_roots['UNTAGGED'])),
    'FORM_I_TRILITERAL_BASE_CANDIDATE': (tri, len(tri_roots)),
    'QUADRILITERAL_UNTAGGED_SUBSET': (quad, len(quad_roots)),
}
expected.update({f'FORM_{form}': (form_counts[form], len(form_roots[form])) for form in ('II','III','IV','V','VI','VII','VIII','IX','X','XI','XII')})
expected.update({key: (feature_counts[key], len(feature_roots[key])) for key in ('PERF','IMPF','IMPV','PASSIVE','SUBJ','JUS','VERBAL_NOUN','ACTIVE_PARTICIPLE','PASSIVE_PARTICIPLE')})
for operator_id, (token_count, root_count) in expected.items():
    entry = by_id.get(operator_id)
    if not entry:
        errors.append(f'missing {operator_id}')
        continue
    if entry.get('token_count') != token_count:
        errors.append(f'{operator_id} token_count {entry.get("token_count")} != {token_count}')
    if entry.get('root_candidate_count') != root_count:
        errors.append(f'{operator_id} root_count {entry.get("root_candidate_count")} != {root_count}')

if mode == 'FULL':
    markdown = paths['md'].read_text(encoding='utf-8')
    for operator_id, (token_count, root_count) in expected.items():
        # Empty published cells are accepted only when both verified counts are zero.
        line = next((ln for ln in markdown.splitlines() if f'`{operator_id}`' in ln), None)
        if line is None:
            errors.append(f'Markdown row missing: {operator_id}')
            continue
        cells = [cell.strip() for cell in line.strip().strip('|').split('|')]
        if token_count == 0 and root_count == 0:
            continue
        if str(token_count) not in cells or str(root_count) not in cells:
            errors.append(f'Markdown count row mismatch: {operator_id}')
    rules_text = paths['rules'].read_text(encoding='utf-8')
    for marker in ('## R112 —', '## R113 —'):
        if marker not in rules_text:
            errors.append(f'missing {marker}')
else:
    if not any(str(data.get('semantic_values','')).startswith(prefix) for prefix in ('ABSENT','REMOVED','NONE')):
        errors.append('blind structural registry must declare semantic values absent/removed')

if errors:
    fail(errors)
print('OPERATOR_REFERENCE_VALID')
print(f'mode={mode}')
print(f'root={ROOT}')
print(f'operators={len(operators)}')
print(f'untagged={form_counts["UNTAGGED"]} tri={tri} quad={quad}')
