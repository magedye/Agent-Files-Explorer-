"""Offline diagnostic CLI. Standard output only; no install, run, approve or deploy command."""
from __future__ import annotations
import argparse
import json
import platform
import sys
from pathlib import Path
from . import __version__
from .io import InputError, digest, loads, read_explicit, read_under
from .legacy import blank_template
from .assurance import validate_record, continuity
from .bridge import import_document, export_raw
from .delegation import assess
from .rules import lint

def emit(value):
    print(json.dumps(value, indent=2, ensure_ascii=True, allow_nan=False))

def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--version', action='version', version=__version__)
    s = p.add_subparsers(dest='command', required=True)
    s.add_parser('doctor')
    t = s.add_parser('template'); t.add_argument('--root', required=True, type=Path); t.add_argument('--request', required=True)
    v = s.add_parser('validate'); v.add_argument('--root', required=True, type=Path); v.add_argument('--request', required=True); v.add_argument('--record', required=True, type=Path); v.add_argument('--stage', choices=['G1','G2','G5'], default='G5'); v.add_argument('--revision')
    b = s.add_parser('bridge-import'); b.add_argument('--root', required=True, type=Path); b.add_argument('--file', required=True); b.add_argument('--format', choices=['generic','speckit','openspec'], default='generic')
    e = s.add_parser('bridge-export'); e.add_argument('--envelope', required=True, type=Path)
    c = s.add_parser('continuity'); c.add_argument('--record', required=True, type=Path); c.add_argument('--revision', required=True)
    d = s.add_parser('scope-check'); d.add_argument('--grant', required=True, type=Path); d.add_argument('--action', required=True, type=Path); d.add_argument('--request-sha256', required=True)
    r = s.add_parser('rules-lint'); r.add_argument('--catalog', type=Path, default=Path(__file__).resolve().parents[1]/'policies/RULES.json')
    return p

def main(argv=None):
    args = parser().parse_args(argv)
    try:
        if args.command == 'doctor':
            emit({'version': __version__, 'python': platform.python_version(), 'os': platform.system(),
                'stdlib_only': True, 'runtime_enforcement': False,
                'host_configuration_inspected': False, 'project_adoption': 'NOT_PERFORMED'})
        elif args.command == 'template':
            raw = read_under(args.root, args.request)
            trace = blank_template(raw.decode('utf-8-sig'), digest(raw))
            emit({'schema_version':'agdl-1.3','record_kind':'DERIVED_NON_AUTHORITATIVE',
                'environment':'PROJECT','subject_revision':'UNKNOWN','risk_tier':'UNKNOWN',
                'rcca':trace,'bindings':{},'references':[],'evidence':[],'tasks':[],
                'coverage_review':{'status':'NOT_REVIEWED','artifact_ref':'','reviewer':'','mode':'SELF'},
                'completion_review':{'status':'NOT_REVIEWED','artifact_ref':'','reviewer':'','mode':'SELF'}})
        elif args.command == 'validate':
            result = validate_record(loads(read_explicit(args.record)), args.root, args.request, args.stage, args.revision)
            emit(result); return result['exit_code']
        elif args.command == 'bridge-import':
            emit(import_document(args.root, args.file, args.format))
        elif args.command == 'bridge-export':
            sys.stdout.buffer.write(export_raw(loads(read_explicit(args.envelope))))
        elif args.command == 'continuity':
            result = continuity(loads(read_explicit(args.record)), args.revision)
            emit(result); return result['exit_code']
        elif args.command == 'scope-check':
            result = assess(loads(read_explicit(args.grant)), loads(read_explicit(args.action)), args.request_sha256)
            emit(result)
            return 0 if result['verdict'].startswith('ELIGIBLE_ONLY') else 2 if result['verdict'] == 'NOT_ELIGIBLE' else 3
        elif args.command == 'rules-lint':
            issues = lint(loads(read_explicit(args.catalog)))
            emit({'verdict':'METADATA_VALID' if not issues else 'INVALID_METADATA','issues':issues,'runtime_enforcement_verified':False})
            return 2 if issues else 0
        return 0
    except (InputError, OSError, UnicodeError, ValueError, TypeError, KeyError, RecursionError) as exc:
        emit({'verdict':'INCONCLUSIVE','reason':str(exc),'execution_performed':False,
            'authorization_authenticated':False,'exit_code':3})
        return 3

if __name__ == '__main__':
    raise SystemExit(main())
