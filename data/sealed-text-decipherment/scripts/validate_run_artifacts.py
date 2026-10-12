#!/usr/bin/env python3
"""Validate Blind Lab runtime artifacts against active JSON Schemas."""
from __future__ import annotations
from pathlib import Path
import argparse, json, sys
try:
    from jsonschema import Draft202012Validator
except Exception as exc:
    print('RUN_ARTIFACT_VALIDATION_UNAVAILABLE')
    print(f'- jsonschema dependency unavailable: {exc}')
    raise SystemExit(2)


def load(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def schema_dir(root: Path) -> Path:
    if (root / '11_VALIDATION').is_dir():
        return root / '11_VALIDATION'
    return root / 'schemas'

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
parser.add_argument('--manifest', type=Path)
parser.add_argument('--lock-report', type=Path)
parser.add_argument('--analysis-record', type=Path)
args = parser.parse_args()
root = args.root.resolve()
schemas = schema_dir(root)
checks = []
if args.manifest:
    checks.append((args.manifest, schemas / 'blind-run-manifest.schema.json'))
if args.lock_report:
    checks.append((args.lock_report, schemas / 'lock-eligibility-report.schema.json'))
if args.analysis_record:
    checks.append((args.analysis_record, schemas / 'quran-semantic-analysis-record.schema.json'))
if not checks:
    print('RUN_ARTIFACT_VALIDATION_SKIPPED')
    print('- provide --manifest and/or --lock-report and/or --analysis-record')
    raise SystemExit(2)
errors = []
for artifact, schema_path in checks:
    try:
        instance = load(artifact)
        schema = load(schema_path)
        validation_errors = sorted(Draft202012Validator(schema).iter_errors(instance), key=lambda err: list(err.path))
        for error in validation_errors:
            errors.append(f'{artifact}: {list(error.path)}: {error.message}')
    except Exception as exc:
        errors.append(f'{artifact}: {exc}')
if errors:
    print('RUN_ARTIFACTS_INVALID')
    for error in errors:
        print('-', error)
    raise SystemExit(1)
print('RUN_ARTIFACTS_VALID')
for artifact, _schema in checks:
    print(f'- {artifact}')
