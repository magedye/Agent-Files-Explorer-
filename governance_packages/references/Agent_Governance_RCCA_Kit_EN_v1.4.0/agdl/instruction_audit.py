"""Explicit-source instruction inventory; not a runtime effective-instruction oracle.

Only caller-listed local paths are inspected. No scans for hidden host prompts or
model-internal state, no instruction interpretation, no policy enforcement.
"""
from __future__ import annotations
from pathlib import Path
from .io import InputError, digest, read_under

ALLOWED_TYPES = {'PROJECT_FILE', 'AGENT_FILE', 'SKILL', 'WORKFLOW', 'POLICY', 'OTHER'}

def audit_instructions(root: Path, catalog: dict) -> dict:
    report = {
        'schema_version': 'agdl-instruction-audit-1.3.1',
        'record_kind': 'DERIVED_NON_AUTHORITATIVE',
        'verdict': 'INCONCLUSIVE', 'sources': [], 'issues': [], 'unknowns': [],
        'possible_exact_duplicates': [],
        'runtime_instruction_loading_verified': False,
        'semantic_conflicts_resolved': False,
        'host_authority_authenticated': False,
        'execution_performed': False,
        'notes': [
            'Only caller-listed explicit files were inspected; omitted sources may exist.',
            'File discovery is not proof of automatic instruction loading.',
            'Recorded loading claims are never promoted into trusted runtime attestation.',
            'Source type or declared priority cannot assign a model/host instruction role.',
        ],
    }
    if not isinstance(catalog, dict) or catalog.get('schema_version') != 'agdl-instruction-sources-1':
        report['issues'].append('invalid_catalog_version')
        return _finish(report)
    rows = catalog.get('sources')
    if not isinstance(rows, list) or len(rows) > 100:
        report['issues'].append('sources_must_be_a_bounded_list')
        return _finish(report)
    seen_ids = set()
    by_hash = {}
    for i, row in enumerate(rows):
        if not isinstance(row, dict):
            report['issues'].append(f'invalid_source_record:{i}')
            continue
        ident, filename = row.get('id'), row.get('path')
        if not isinstance(ident, str) or not ident.strip() or ident in seen_ids:
            report['issues'].append(f'invalid_or_duplicate_source_id:{i}')
            continue
        seen_ids.add(ident)
        if row.get('source_type') not in ALLOWED_TYPES:
            report['issues'].append(f'unknown_source_type:{ident}')
            continue
        if not isinstance(filename, str):
            report['issues'].append(f'path_not_string:{ident}')
            continue
        result = {'id': ident, 'path': filename, 'source_type': row['source_type'],
                  'discovered': False, 'loaded': 'NOT_VERIFIED',
                  'enforced': 'NOT_VERIFIED', 'authority': 'NOT_DETERMINED',
                  'scope': row.get('scope', 'UNKNOWN') if isinstance(row.get('scope', 'UNKNOWN'), str) else 'UNKNOWN'}
        try:
            raw = read_under(root, filename)
            result['discovered'] = True
            result['sha256'] = digest(raw)
            result['size_bytes'] = len(raw)
            by_hash.setdefault(result['sha256'], []).append(ident)
        except (InputError, OSError) as exc:
            report['unknowns'].append(f'instruction_source_unreadable:{ident}:{exc}')
        if row.get('loading_claim'):
            report['notes'].append(f'loading_claim_unverified:{ident}')
        report['sources'].append(result)
    report['possible_exact_duplicates'] = [sorted(ids) for ids in by_hash.values() if len(ids) > 1]
    return _finish(report)


def _finish(report: dict) -> dict:
    report['issues'] = sorted(set(report['issues']))
    report['unknowns'] = sorted(set(report['unknowns']))
    report['notes'] = sorted(set(report['notes']))
    report['verdict'] = 'INVALID_INPUT' if report['issues'] else 'INCONCLUSIVE'
    report['exit_code'] = 2 if report['issues'] else 3
    return report
