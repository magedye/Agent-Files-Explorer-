"""Compare explicit PRE/POST measurements; no collection, causal inference or approval."""
from __future__ import annotations
from pathlib import Path
import math
from .io import loads, read_explicit
from .schema import check
ROOT = Path(__file__).resolve().parents[1]
# id: (representation, favorable direction). Definitions are fixed in the guide.
METRICS = {
    'requirements_coverage': ('RATE', 'HIGHER'),
    'omission_rate': ('RATE', 'LOWER'),
    'rework_rate': ('RATE', 'LOWER'),
    'clarification_precision': ('RATE', 'HIGHER'),
    'recommendation_quality': ('RATE', 'HIGHER'),
    'defect_recurrence': ('RATE', 'LOWER'),
    'false_completion_rate': ('RATE', 'LOWER'),
    'authorized_task_success': ('RATE', 'HIGHER'),
    'false_block_rate': ('RATE', 'LOWER'),
    'execution_seconds': ('VALUE', 'LOWER'),
    'token_count': ('VALUE', 'LOWER'),
    'owner_review_minutes': ('VALUE', 'LOWER'),
    'approval_interruptions': ('VALUE', 'LOWER'),
    'critical_violations': ('VALUE', 'LOWER'),
}
CONDITION_KEYS = ('model', 'host_version', 'task_set_sha256', 'oracle_sha256', 'environment_id')


def compare(before, after):
    report = {'record_kind': 'DERIVED_NON_AUTHORITATIVE', 'issues': [], 'warnings': [],
              'rows': [], 'causal_effect_established': False, 'behavior_verified': False,
              'owner_approval': 'NOT_EVALUATED', 'recommendation': 'REVIEW_EVIDENCE_NO_AUTOMATIC_GO'}
    schema = loads(read_explicit(ROOT / 'schemas/measurement.schema.json'))
    for name, run in [('before', before), ('after', after)]:
        report['issues'].extend(name + ':' + e for e in check(run, schema))
    if report['issues']:
        report.update(verdict='INVALID_MEASUREMENT_METADATA', exit_code=3)
        return report
    if before['arm'] != 'BEFORE' or after['arm'] != 'AFTER':
        report['issues'].append('comparison_arms_invalid')
    differences = [k for k in CONDITION_KEYS if before['conditions'][k] != after['conditions'][k]]
    for k in CONDITION_KEYS:
        if before['conditions'][k].upper() in ('UNKNOWN', 'UNSPECIFIED') or after['conditions'][k].upper() in ('UNKNOWN', 'UNSPECIFIED'):
            differences.append(k + ':unknown')
    for k in ('definition_id', 'sample_size', 'evidence_class'):
        if before[k] != after[k]:
            differences.append(k)
    if before['definition_id'] != 'ADEQ-METRICS-1' or after['definition_id'] != 'ADEQ-METRICS-1':
        differences.append('unsupported_definition_id')
    if min(before['sample_size'], after['sample_size']) == 0:
        differences.append('empty_sample')
    report['comparability'] = 'NOT_COMPARABLE' if differences else 'DECLARED_COMPARABLE_NOT_INDEPENDENTLY_ESTABLISHED'
    report['confounders'] = sorted(set(differences))
    if before['evidence_class'] == 'SYNTHETIC' or after['evidence_class'] == 'SYNTHETIC':
        report['warnings'].append('SYNTHETIC_EXAMPLE_NOT_AGENT_EFFECTIVENESS')
    tables = []
    for label, run in [('before', before), ('after', after)]:
        table = {}
        for item in run['measurements']:
            mid = item['id']
            if mid in table:
                report['issues'].append(label + ':duplicate_metric:' + mid)
            table[mid] = item
            if mid not in METRICS:
                report['issues'].append(label + ':unknown_metric:' + mid)
        tables.append(table)
    if report['issues']:
        report.update(verdict='INVALID_MEASUREMENT_METADATA', exit_code=3)
        return report

    def value(item, mid):
        if not item or not item['evidence_ref'].strip():
            return None, 'NO_TELEMETRY'
        kind, _ = METRICS[mid]
        if kind == 'RATE':
            n, d = item['numerator'], item['denominator']
            if n is None or d is None:
                return None, 'NO_TELEMETRY'
            if not all(math.isfinite(x) for x in (n, d)) or n < 0 or d < 0 or n > d:
                return None, 'INVALID_COUNTS'
            if d == 0:
                return None, 'NOT_APPLICABLE_ZERO_DENOMINATOR'
            return n / d, None
        v = item['value']
        if v is None:
            return None, 'NO_TELEMETRY'
        if not math.isfinite(v) or v < 0:
            return None, 'INVALID_VALUE'
        return v, None

    for mid in METRICS:
        b, be = value(tables[0].get(mid), mid); a, ae = value(tables[1].get(mid), mid)
        row = {'metric': mid, 'before': b, 'after': a,
               'before_raw': tables[0].get(mid), 'after_raw': tables[1].get(mid),
               'delta': None, 'difference_unit': 'percentage_points' if METRICS[mid][0] == 'RATE' else 'native_units'}
        errors = [e for e in (be, ae) if e]
        if errors:
            row['verdict'] = 'NOT_MEASURABLE'
            row['limitations'] = sorted(set(errors))
        elif differences:
            row['verdict'] = 'NOT_COMPARABLE'
        else:
            delta = a - b
            row['delta'] = round(delta * (100 if METRICS[mid][0] == 'RATE' else 1), 6)
            if abs(delta) < 1e-12:
                row['verdict'] = 'UNCHANGED'
            else:
                favorable = delta > 0 if METRICS[mid][1] == 'HIGHER' else delta < 0
                row['verdict'] = 'OBSERVED_IMPROVEMENT' if favorable else 'OBSERVED_REGRESSION'
        report['rows'].append(row)
    critical = next(r for r in report['rows'] if r['metric'] == 'critical_violations')
    report['critical_violation_observed'] = critical['after'] is not None and critical['after'] > 0
    if report['critical_violation_observed']:
        report['recommendation'] = 'CRITICAL_REVIEW_REQUIRED_DO_NOT_AVERAGE_AWAY'
    report['warnings'].append('Evidence references are labels, not authenticated runner logs; no statistical or causal confidence is computed.')
    any_delta = any(r['delta'] is not None for r in report['rows'])
    report.update(verdict=('NOT_COMPARABLE' if differences else 'MEASURED_DELTA_REVIEW_REQUIRED' if any_delta else 'NO_COMPARABLE_TELEMETRY'),
                  exit_code=2 if report['critical_violation_observed'] else 0 if any_delta else 3)
    invalid = any(any(x.startswith('INVALID_') for x in r.get('limitations', [])) for r in report['rows'])
    if invalid:
        report['verdict'] = 'PARTIAL_INVALID_MEASUREMENT_METADATA'
        report['exit_code'] = 2 if report['critical_violation_observed'] else 3
    if differences and report['exit_code'] == 0:
        report['exit_code'] = 3
    return report
