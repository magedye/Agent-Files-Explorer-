#!/usr/bin/env python3
"""Validate Lisan rule registries for project, Project Hub Skill, or Blind Lab Skill."""
from __future__ import annotations
from pathlib import Path
import argparse, json, re, sys


def discover_root(start: Path) -> Path:
    for p in [start, *start.parents]:
        if (p / '03_RULES').is_dir() or (p / 'rules').is_dir():
            return p
    raise FileNotFoundError('could not discover project/skill root')


def fail(errors: list[str]) -> None:
    print('RULE_REGISTRY_INCONSISTENT')
    for error in errors:
        print('-', error)
    raise SystemExit(1)

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path)
args = parser.parse_args()
ROOT = args.root.resolve() if args.root else discover_root(Path(__file__).resolve().parent)
errors: list[str] = []

if (ROOT / '03_RULES').is_dir():
    reg = ROOT / '03_RULES/FORMAL_RULE_REGISTRY_v3.4.0.md'
    ledger = ROOT / '03_RULES/RULE_STATUS_LEDGER_V4.md'
    index = ROOT / '03_RULES/RULE_REGISTRY_ARABIC_INDEX.md'
    machine = ROOT / '03_RULES/RULE_REGISTRY_V4.json'
    mode = 'FULL'
elif (ROOT / 'rules/RULE_REGISTRY_BLIND_SAFE.json').is_file():
    reg = ROOT / 'rules/BLIND_SAFE_RULE_CATALOG.md'
    ledger = ROOT / 'rules/runtime/RULE_STATUS_LEDGER_V4.md'
    index = None
    machine = ROOT / 'rules/RULE_REGISTRY_BLIND_SAFE.json'
    mode = 'BLIND_SAFE'
else:
    reg = ROOT / 'rules/06-quranic-semantic-constitution-v4.md'
    ledger = ROOT / 'rules/runtime/RULE_STATUS_LEDGER_V4.md'
    index = ROOT / 'rules/RULE_REGISTRY_ARABIC_INDEX.md'
    machine = ROOT / 'rules/RULE_REGISTRY_V4.json'
    mode = 'FULL'

for path in [reg, ledger, machine, *( [index] if index else [] )]:
    if not path.is_file():
        errors.append(f'missing: {path.relative_to(ROOT)}')
if errors:
    fail(errors)

try:
    data = json.loads(machine.read_text(encoding='utf-8'))
except Exception as exc:
    fail([f'invalid machine registry: {exc}'])
rules = data.get('rules', [])
json_ids = [int(str(item['rule_id']).lstrip('R')) for item in rules]
expected = list(range(1, 114))
if json_ids != expected:
    errors.append('machine registry must contain sequential R01-R113')

allowed_weights = {'CONSTITUTIONAL / CRITICAL', 'HIGH', 'MEDIUM', 'SUPPORTING / HYPOTHESIS'}
for item in rules:
    rid = item.get('rule_id', '?')
    if item.get('weight') not in allowed_weights:
        errors.append(f'invalid weight {rid}: {item.get("weight")}')
    for field in ('name', 'description', 'impact', 'trigger', 'failure_mode_prevented', 'status', 'family'):
        if not item.get(field):
            errors.append(f'missing {field}: {rid}')

catalog_text = reg.read_text(encoding='utf-8')
if mode == 'FULL':
    md_ids = [int(x) for x in re.findall(r'^## R(\d+) —', catalog_text, re.M)]
    if md_ids != expected:
        errors.append('Markdown registry must contain sequential R01-R113')
    idx_text = index.read_text(encoding='utf-8') if index else ''
    idx_ids = [int(x) for x in re.findall(r'^\| R(\d+) \|', idx_text, re.M)]
    if idx_ids != expected:
        errors.append('Arabic index must contain sequential R01-R113')
else:
    # Blind catalog must retain IDs and labels without semantic provenance/examples.
    catalog_ids = sorted({int(x) for x in re.findall(r'R(\d{2,3})', catalog_text)})
    if catalog_ids != expected:
        errors.append('Blind-safe catalog must reference sequential R01-R113')

ledger_text = ledger.read_text(encoding='utf-8')
for rid in expected:
    if not re.search(rf'^\| R{rid:02d} \|', ledger_text, re.M):
        errors.append(f'R{rid:02d} absent from status ledger')

for stale in ('INTEGRATE_V3_2', 'PROPOSED / REGRESSION_PENDING rather than'):
    if stale in catalog_text or stale in ledger_text:
        errors.append(f'stale status phrase found: {stale}')

if errors:
    fail(errors)
print('RULE_REGISTRY_CONSISTENT')
print(f'mode={mode}')
print(f'rules={len(rules)}')
print(f'root={ROOT}')
