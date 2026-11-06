"""Source, reference and evidence diagnostics. Never grants runtime authority."""
from __future__ import annotations
from pathlib import Path
from typing import Any
from . import legacy
from .io import InputError, digest, loads, read_under, read_explicit
from .schema import check

ROOT = Path(__file__).resolve().parents[1]

def _report(stage: str) -> dict:
    return {'schema_version': 'agdl-report-1.3', 'record_kind': 'DERIVED_NON_AUTHORITATIVE',
            'stage': stage, 'verdict': 'INCONCLUSIVE', 'issues': [], 'unknowns': [], 'warnings': [],
            'reference_checks': [], 'semantic_completeness_verified': False,
            'runtime_enforcement_verified': False, 'authorization_authenticated': False,
            'independent_review_verified': False, 'owner_approval': 'NOT_EVALUATED',
            'execution_performed': False}

def _finish(report: dict) -> dict:
    for key in ('issues', 'unknowns', 'warnings'):
        report[key] = sorted(set(report[key]))
    report['verdict'] = ('GAPS_FOUND' if report['issues'] else 'INCONCLUSIVE' if report['unknowns'] else 'METADATA_READY_FOR_REVIEW')
    report['exit_code'] = 2 if report['issues'] else 3 if report['unknowns'] else 0
    return report

def index(items: list[dict], kind: str, issues: list[str]) -> dict[str, dict]:
    result = {}
    for item in items:
        key = item['id']
        if key in result:
            issues.append(f'duplicate_{kind}_id:{key}')
        result[key] = item
    return result

def validate_record(record: Any, root: Path, request: str, stage: str = 'G5', current_revision: str | None = None) -> dict:
    report = _report(stage)
    if stage not in ('G1', 'G2', 'G5'):
        report['issues'].append('unknown_gate')
        return _finish(report)
    schema = loads(read_explicit(ROOT / 'schemas/trace.schema.json'))
    errors = check(record, schema)
    if errors:
        report['issues'].extend('schema:' + error for error in errors)
        return _finish(report)
    try:
        raw = read_under(root, request)
        text = raw.decode('utf-8-sig')
    except (InputError, UnicodeError, OSError) as exc:
        report['unknowns'].append('request_unreadable:' + str(exc))
        return _finish(report)
    request_hash = digest(raw)
    trace = record['rcca']
    # Do not call legacy G5: its R1 independence floor is not this single-owner profile.
    # G1/G2 are reused verbatim; G5 is replaced explicitly, not run as a second rival gate.
    try:
        old_issues, old_warnings = legacy.validate(text, request_hash, trace, 'G1' if stage == 'G1' else 'G2')
    except (ValueError, TypeError, KeyError, AttributeError) as exc:
        report['issues'].append('legacy_contract_invalid:' + type(exc).__name__)
        return _finish(report)
    report['issues'].extend(old_issues)
    report['warnings'].extend(old_warnings)
    refs = index(record['references'], 'reference', report['issues'])
    evidence = index(record['evidence'], 'evidence', report['issues'])
    tasks = index(record['tasks'], 'task', report['issues'])
    requirements = {r['id']: r for r in trace['requirements']}
    checked = set()
    for ident, ref in refs.items():
        try:
            content = read_under(root, ref['path'])
            actual_hash = digest(content)
            ok = actual_hash == ref['sha256']
            report['reference_checks'].append({'id': ident, 'path': ref['path'], 'hash_matches': ok})
            if ok:
                checked.add(ident)
            else:
                report['issues'].append('reference_hash_mismatch:' + ident)
        except (InputError, OSError) as exc:
            report['unknowns'].append(f'reference_unreadable:{ident}:{exc}')
    bindings = record['bindings']
    for rid in bindings:
        if rid not in requirements:
            report['issues'].append('binding_unknown_requirement:' + rid)
    for rid in requirements:
        if rid not in bindings:
            report['issues'].append('requirement_binding_missing:' + rid)
    for rid, binding in bindings.items():
        for ref_id in binding['spec_refs'] + binding['implementation_refs']:
            if ref_id not in refs:
                report['issues'].append(f'binding_reference_missing:{rid}:{ref_id}')
        for ref_id in binding['spec_refs']:
            if ref_id in refs and refs[ref_id]['kind'] != 'SPEC':
                report['issues'].append(f'spec_reference_wrong_kind:{rid}:{ref_id}')
        for ref_id in binding['implementation_refs']:
            if ref_id in refs and refs[ref_id]['kind'] != 'IMPLEMENTATION':
                report['issues'].append(f'implementation_reference_wrong_kind:{rid}:{ref_id}')
        for task_id in binding['task_refs']:
            if task_id not in tasks:
                report['issues'].append(f'binding_task_missing:{rid}:{task_id}')
        for eid in binding['evidence_refs']:
            if eid not in evidence:
                report['issues'].append(f'binding_evidence_missing:{rid}:{eid}')
            elif rid not in evidence[eid]['requirement_ids']:
                report['issues'].append(f'evidence_link_not_reciprocal:{rid}:{eid}')
    for eid, ev in evidence.items():
        if ev['artifact_ref'] not in refs:
            report['issues'].append('evidence_artifact_missing:' + eid)
        elif refs[ev['artifact_ref']]['kind'] not in ('TEST_LOG', 'INSPECTION_LOG'):
            report['issues'].append('evidence_artifact_wrong_kind:' + eid)
        if ev['source_sha256'] != request_hash:
            report['issues'].append('evidence_request_stale:' + eid)
        if ev['subject_revision'] != record['subject_revision']:
            report['issues'].append('evidence_revision_stale:' + eid)
        if record['environment'] == 'PROJECT' and ev['evidence_class'] == 'SYNTHETIC':
            report['issues'].append('synthetic_evidence_for_project:' + eid)
        for rid in ev['requirement_ids']:
            if rid not in requirements or eid not in bindings.get(rid, {}).get('evidence_refs', []):
                report['issues'].append(f'evidence_requirement_not_reciprocal:{eid}:{rid}')
    for tid, task in tasks.items():
        ref_id = task['source_ref']
        if ref_id not in refs or refs[ref_id]['kind'] != 'TASK_RECORD':
            report['issues'].append('task_source_reference_invalid:' + tid)
    if current_revision is not None and current_revision != record['subject_revision']:
        report['issues'].append('current_revision_mismatch')
    if stage in ('G2', 'G5'):
        auth_id = trace['authorization'].get('source_ref')
        if auth_id not in refs or refs[auth_id]['kind'] != 'DELEGATION':
            report['issues'].append('delegation_reference_invalid')
        elif auth_id not in checked:
            report['unknowns'].append('delegation_reference_not_checked')
        if record['risk_tier'] != trace['risk_tier']:
            report['issues'].append('risk_tier_mismatch')
    if stage == 'G5':
        if current_revision is None or not current_revision.strip() or current_revision.upper() in ('UNKNOWN', 'UNSPECIFIED'):
            report['unknowns'].append('current_revision_not_supplied')
        if record['risk_tier'] == 'UNKNOWN':
            report['unknowns'].append('risk_tier_unknown')
        if record['risk_tier'] in ('R2', 'R3'):
            report['unknowns'].append('high_risk_external_qualification_required')
        for review_name in ('coverage_review', 'completion_review'):
            review = record[review_name]
            ref_id = review['artifact_ref']
            if review['status'] != 'REVIEWED':
                report['unknowns'].append(review_name + '_not_recorded')
            elif ref_id not in refs or refs[ref_id]['kind'] != 'REVIEW' or ref_id not in checked:
                report['unknowns'].append(review_name + '_evidence_not_checked')
            if review['status'] == 'REVIEWED' and not review['reviewer'].strip():
                report['unknowns'].append(review_name + '_reviewer_not_recorded')
            if review['mode'] == 'SELF':
                report['warnings'].append(review_name + '_self_review_not_independent')
        for rid, req in requirements.items():
            normative = req['normative']
            if req['applicability'] == 'UNKNOWN':
                if normative in ('MUST', 'MUST_NOT'):
                    report['unknowns'].append('applicability_unknown:' + rid)
                continue
            if req['applicability'] == 'NOT_APPLICABLE':
                if normative in ('MUST', 'MUST_NOT'):
                    ex = req.get('exception', {})
                    ref_id = ex.get('authority_reference')
                    if ex.get('approved') is not True or ref_id not in refs or refs[ref_id]['kind'] != 'DECISION' or ref_id not in checked:
                        report['issues'].append('not_applicable_without_decision_reference:' + rid)
                    else:
                        report['warnings'].append('exception_authority_still_requires_external_confirmation:' + rid)
                continue
            if normative in ('MUST', 'MUST_NOT'):
                state = req['implementation_state']
                if state == 'UNKNOWN':
                    report['unknowns'].append('implementation_unknown:' + rid)
                elif state != 'IMPLEMENTED':
                    report['issues'].append('missing_implementation:' + rid)
                binding = bindings.get(rid, {})
                if not binding.get('spec_refs') and not binding.get('no_spec_reason', '').strip():
                    report['issues'].append('spec_link_or_proportionality_reason_missing:' + rid)
                if not binding.get('task_refs') and not binding.get('no_task_reason', '').strip():
                    report['issues'].append('task_link_or_proportionality_reason_missing:' + rid)
                for tid in binding.get('task_refs', []):
                    if tid in tasks and tasks[tid]['status'] != 'DONE':
                        report['issues'].append(f'linked_task_not_complete:{rid}:{tid}')
                if not binding.get('implementation_refs'):
                    report['issues'].append('implementation_snapshot_missing:' + rid)
                ev_ids = binding.get('evidence_refs', [])
                if not ev_ids:
                    report['issues'].append('missing_verification:' + rid)
                if req['verification']['status'] != 'PASSED':
                    report['issues'].append('verification_not_passed:' + rid)
                elif req['verification']['evidence_ref'] not in ev_ids:
                    report['issues'].append('rcca_evidence_pointer_not_linked:' + rid)
                for eid in ev_ids:
                    ev = evidence.get(eid)
                    if ev is None:
                        continue
                    if ev['result'] != 'PASSED':
                        report['issues'].append('evidence_not_passed:' + eid)
                    if ev['artifact_ref'] not in checked:
                        report['unknowns'].append('evidence_artifact_unchecked:' + eid)
                    if not ev['command_or_method'].strip() or not ev['observed_result'].strip():
                        report['issues'].append('evidence_method_or_observation_missing:' + eid)
            elif normative == 'SHOULD' and req['verification']['status'] != 'PASSED':
                if len(req.get('deviation_reason', '').strip()) < 10:
                    report['issues'].append('should_deviation_unrecorded:' + rid)
                else:
                    report['warnings'].append('should_deviation_documented:' + rid)
        report['warnings'].append('evidence_contents_and_semantic_oracles_require_review')
    report['source_sha256'] = request_hash
    report['requirements_count'] = len(requirements)
    report['checked_references_count'] = len(checked)
    return _finish(report)

def continuity(record: dict, current_revision: str) -> dict:
    """Optional verification of supplied task references; not a task scheduler."""
    report = _report('CONTINUITY')
    schema = loads(read_explicit(ROOT / 'schemas/trace.schema.json'))
    errors = check(record, schema)
    if errors:
        report['issues'].extend('schema:' + error for error in errors)
        return _finish(report)
    tasks = index(record['tasks'], 'task', report['issues'])
    if not current_revision.strip() or current_revision.upper() in ('UNKNOWN', 'UNSPECIFIED'):
        report['unknowns'].append('resume_revision_not_known')
    elif record['subject_revision'] != current_revision:
        report['unknowns'].append('resume_revision_changed_reconcile_first')
    visiting, visited = set(), set()
    def visit(tid):
        if tid in visiting:
            report['issues'].append('dependency_cycle:' + tid)
            return
        if tid in visited:
            return
        visiting.add(tid)
        for dep in tasks[tid]['depends_on']:
            if dep not in tasks:
                report['issues'].append(f'unknown_dependency:{tid}:{dep}')
            else:
                visit(dep)
                if tasks[tid]['status'] in ('DOING', 'DONE') and tasks[dep]['status'] != 'DONE':
                    report['issues'].append(f'unsatisfied_dependency:{tid}:{dep}')
        visiting.remove(tid)
        visited.add(tid)
    for tid in tasks:
        visit(tid)
    report['candidate_ready_task_refs'] = []
    if not report['issues'] and not report['unknowns']:
        report['candidate_ready_task_refs'] = [tid for tid, task in tasks.items()
            if task['status'] == 'TODO' and all(tasks[d]['status'] == 'DONE' for d in task['depends_on'])]
    report['warnings'].append('run_G2_and_reconcile_files_grant_and_request_before_resuming')
    return _finish(report)
