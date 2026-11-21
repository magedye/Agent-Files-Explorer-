"""ADEQ diagnostics over explicitly supplied, derived metadata.

This module does not infer natural-language meaning, authenticate owner decisions,
run tools, change tasks, or certify an agent's behavior. It reuses RCCA as-is.
"""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Any

from .assurance import validate_record
from .io import InputError, canonical_json, digest, loads, read_explicit, read_under
from .schema import check

ROOT = Path(__file__).resolve().parents[1]
DOC_AXES = {'COMPLETENESS', 'CONSISTENCY', 'ACCURACY', 'TRACEABILITY',
            'CLARITY', 'CURRENTNESS', 'NON_DUPLICATION'}


def route(context: dict[str, Any]) -> dict[str, Any]:
    """Recommend procedural depth from declared facts; never grant authority."""
    schema = loads(read_explicit(ROOT / 'schemas/quality.schema.json'))['properties']['context']
    problems = check(context, schema)
    if problems:
        return {'verdict': 'INCONCLUSIVE', 'issues': problems, 'exit_code': 3,
                'authorization_granted': False}
    reasons = []
    if context['impact'] in ('HIGH', 'CRITICAL'):
        reasons.append('high_impact')
    if context['reversibility'] == 'NO':
        reasons.append('difficult_to_reverse')
    if context['work_type'] == 'ARCHITECTURE':
        reasons.append('architectural_change')
    unknown = any(context[k] == 'UNKNOWN' for k in ('impact', 'complexity', 'reversibility'))
    if reasons:
        profile = 'CONTROLLED'
    elif unknown:
        profile = 'ASSESS_FIRST'
        reasons.append('material_routing_input_unknown')
    elif (context['complexity'] == 'LOW' and context['impact'] == 'LOW'
          and context['reversibility'] == 'YES' and not context['material_decision']):
        profile = 'QUICK'
        reasons.append('small_clear_reversible_change')
    else:
        profile = 'STANDARD'
        reasons.append('nontrivial_scoped_change')
    return {'verdict': 'ROUTING_RECOMMENDATION_ONLY', 'profile': profile,
            'reasons': reasons, 'bug_workflow': context['work_type'] == 'BUG',
            'new_document_mandatory': False, 'authorization_granted': False,
            'exit_code': 3 if profile == 'ASSESS_FIRST' else 0}


def _report(stage: str) -> dict[str, Any]:
    return {'schema_version': 'adeq-report-1.1', 'record_kind': 'DERIVED_NON_AUTHORITATIVE',
            'stage': stage, 'findings': [], 'unknowns': [], 'warnings': [],
            'source_checks': [], 'coverage': [], 'remediation_proposals': [],
            'semantic_completeness_verified': False, 'agent_behavior_verified': False,
            'authorization_authenticated': False, 'independent_review_verified': False,
            'runtime_enforcement_verified': False, 'execution_performed': False,
            'owner_approval': 'NOT_EVALUATED'}


def _finish(report: dict[str, Any]) -> dict[str, Any]:
    for key in ('unknowns', 'warnings'):
        report[key] = sorted(set(report[key]))
    # Stable ordering and IDs make repeated inspections comparable without mutating a task log.
    unique = {f['id']: f for f in report['findings']}
    report['findings'] = sorted(unique.values(), key=lambda f: f['id'])
    report['remediation_proposals'] = [
        {'finding_id': f['id'], 'category': f['category'], 'requirement_ids': f['requirement_ids'],
         'existing_task_ids': f['task_ids'],
         'action': ('REVIEW_SCOPE_NO_AUTOMATIC_DELETION' if f['category'] == 'UNREQUESTED'
                    else 'REUSE_EXISTING_TASK' if f['task_ids'] else 'PROPOSE_SCOPED_WORK_ONLY'),
         'writes_performed': False}
        for f in report['findings']]
    report['verdict'] = ('QUALITY_GAPS_FOUND' if report['findings'] else
                         'INCONCLUSIVE' if report['unknowns'] else
                         'QUALITY_METADATA_READY_FOR_REVIEW')
    report['exit_code'] = 2 if report['findings'] else 3 if report['unknowns'] else 0
    return report


def assess_quality(snapshot: Any, root: Path, stage: str = 'PRE',
                   current_revision: str | None = None) -> dict[str, Any]:
    """Inspect a snapshot. PRE is planning-quality, POST adds unchanged RCCA G5.

    Source values, trust labels, observations and review claims remain operator
    assertions. Byte consistency is established, not their truth or authority.
    """
    report = _report(stage)
    if stage not in ('PRE', 'POST'):
        report['unknowns'].append('unknown_quality_stage')
        return _finish(report)
    schema = loads(read_explicit(ROOT / 'schemas/quality.schema.json'))
    errors = check(snapshot, schema)
    if errors:
        report['unknowns'].extend('schema:' + e for e in errors)
        return _finish(report)
    if len(snapshot['sources']) > 500 or len(snapshot['claims']) > 2000:
        report['unknowns'].append('diagnostic_input_cardinality_limit')
        return _finish(report)
    report['input_digest'] = digest(canonical_json(snapshot))
    report['routing'] = route(snapshot['context'])
    report['warnings'].extend(['DECLARED_METADATA_NOT_AUTHENTICATED',
                              'SEMANTIC_REVIEW_AND_LIVE_AGENT_EVALUATION_STILL_REQUIRED'])
    if not current_revision or current_revision.upper() in ('UNKNOWN', 'UNSPECIFIED'):
        report['unknowns'].append('current_revision_not_supplied')
    elif current_revision != snapshot['subject_revision']:
        report['unknowns'].append('quality_snapshot_revision_stale')
    if report['routing']['profile'] == 'ASSESS_FIRST':
        report['unknowns'].append('routing_inputs_unknown')

    trace = None
    try:
        raw = read_under(root, snapshot['trace_ref']['path'])
        if digest(raw) != snapshot['trace_ref']['sha256']:
            report['unknowns'].append('trace_snapshot_hash_mismatch')
            return _finish(report)
        trace = loads(raw)
        base_stage = 'G1' if stage == 'PRE' else 'G5'
        base = validate_record(trace, root, snapshot['request_path'], base_stage, current_revision)
        report['rcca_report'] = base
        if trace.get('subject_revision') != snapshot['subject_revision']:
            report['unknowns'].append('trace_and_quality_revision_mismatch')
    except (InputError, OSError, ValueError, TypeError, KeyError, RecursionError) as exc:
        report['unknowns'].append('trace_not_checkable:' + type(exc).__name__)
        return _finish(report)
    if any(i.startswith(('schema:', 'legacy_contract_invalid:')) for i in base['issues']):
        report['unknowns'].append('invalid_rcca_contract')
        return _finish(report)
    report['unknowns'].extend('rcca:' + x for x in base['unknowns'])
    requirements = {r['id']: r for r in trace['rcca']['requirements']}
    tasks = {t['id']: t for t in trace.get('tasks', [])}
    bindings = trace.get('bindings', {})

    def add(code: str, category: str, detail: str, reqs=(), task_ids=(), sources=()):
        rids = sorted(set(reqs)); tids = set(task_ids)
        for rid in rids:
            tids.update(bindings.get(rid, {}).get('task_refs', []))
        ids = sorted(tids)
        # Observation IDs and assessment timestamps are deliberately excluded.
        key = {'code': code, 'category': category, 'detail': detail, 'requirements': rids,
               'tasks': ids, 'sources': sorted(set(sources))}
        fid = 'QF-' + digest(canonical_json(key))[:20]
        report['findings'].append({'id': fid, 'code': code, 'category': category,
                                   'detail': detail, 'requirement_ids': rids,
                                   'task_ids': ids, 'source_refs': key['sources']})

    for issue in base['issues']:
        rids = [rid for rid in requirements if rid in issue.split(':')]
        tids = [tid for tid in tasks if tid in issue.split(':')]
        category = ('UNVERIFIED' if any(t in issue for t in ('verification', 'evidence', 'review'))
                    else 'MISSING' if any(t in issue for t in ('missing_', '_missing', 'not_complete'))
                    else 'CONTRADICTS')
        add('RCCA_GATE_ISSUE', category, issue, rids, tids)

    refs = {}; checked = set()
    for row in snapshot['sources']:
        sid = row['id']
        if sid in refs:
            add('DUPLICATE_SOURCE', 'CONTRADICTS', sid)
            continue
        refs[sid] = row
        try:
            content = read_under(root, row['path'])
            matched = digest(content) == row['sha256']
            report['source_checks'].append({'id': sid, 'hash_matches': matched})
            if not matched:
                report['unknowns'].append('quality_source_stale:' + sid)
            elif row['trust'] == 'PROJECT_REFERENCE':
                checked.add(sid)
            else:
                report['warnings'].append('untrusted_or_unknown_source_not_authority:' + sid)
        except (InputError, OSError) as exc:
            report['unknowns'].append('source_not_checkable:' + sid + ':' + type(exc).__name__)

    def need(sid: str, purpose: str, kinds=()):
        if not sid or sid not in checked:
            report['unknowns'].append(purpose + ':unchecked_source:' + (sid or 'NONE'))
            return False
        if kinds and refs[sid]['role'] not in kinds:
            add('REFERENCE_KIND_MISMATCH', 'CONTRADICTS', purpose + ':' + sid)
            return False
        return True

    def requirement_links(rids, purpose):
        for rid in rids:
            if rid not in requirements:
                add('UNKNOWN_REQUIREMENT_LINK', 'CONTRADICTS', purpose + ':' + rid)

    # Read the same IDs and states as RCCA, rather than keeping another editable task table.
    for rid, req in requirements.items():
        binding = bindings.get(rid, {})
        report['coverage'].append({'requirement_id': rid,
                                  'source_unit_ids': req.get('source_unit_ids', []),
                                  'task_ids': binding.get('task_refs', []),
                                  'implementation_refs': binding.get('implementation_refs', []),
                                  'evidence_refs': binding.get('evidence_refs', []),
                                  'implementation_state': req.get('implementation_state', 'UNKNOWN'),
                                  'verification': req.get('verification', {}).get('status', 'UNKNOWN')})
        mandatory = req['normative'] in ('MUST', 'MUST_NOT') and req['applicability'] == 'APPLICABLE'
        if stage == 'PRE' and mandatory:
            if not binding.get('task_refs') and not binding.get('no_task_reason', '').strip():
                add('PLAN_COVERAGE_MISSING', 'MISSING', rid, [rid])
            for tid in binding.get('task_refs', []):
                if tid not in tasks:
                    add('PLAN_TASK_REFERENCE_MISSING', 'MISSING', tid, [rid])
    linked = {tid for b in bindings.values() for tid in b.get('task_refs', [])}
    for tid, task in tasks.items():
        scope = task.get('completion_scope', 'UNKNOWN')
        if tid not in linked and scope == 'UNKNOWN':
            add('UNCLASSIFIED_TASK', 'UNREQUESTED', tid, task_ids=[tid])
        elif tid not in linked:
            report['warnings'].append('unlinked_task_classified:' + tid + ':' + scope)

    for a in snapshot['ambiguities']:
        requirement_links(a['requirement_ids'], a['id'])
        if a['status'] == 'RESOLVED':
            need(a['resolution_ref'], 'ambiguity_resolution:' + a['id'])
        elif a['impact'] == 'BLOCKING':
            add('BLOCKING_AMBIGUITY', 'UNVERIFIED', a['id'], a['requirement_ids'])
            option_ids = {option['id'] for option in a['options']}
            if (not option_ids or a['recommendation'] not in option_ids or not a['question'].strip()
                    or len(option_ids) != len(a['options'])):
                add('CLARIFICATION_OPTIONS_MISSING', 'MISSING', a['id'], a['requirement_ids'])
        else:
            report['warnings'].append('nonblocking_assumption_disclosed:' + a['id'])

    material = snapshot['context']['material_decision'] or report['routing']['profile'] == 'CONTROLLED'
    if material and not snapshot['decisions']:
        add('MATERIAL_RECOMMENDATION_MISSING', 'MISSING', snapshot['context']['task_id'])
    for d in snapshot['decisions']:
        options = {o['id'] for o in d['options']}
        if len(options) != len(d['options']):
            add('DUPLICATE_OPTION_ID', 'CONTRADICTS', d['id'])
        if not options or d['recommendation'] not in options:
            add('RECOMMENDATION_OPTION_INVALID', 'MISSING', d['id'])
        for sid in d['support_refs']:
            need(sid, 'decision_support:' + d['id'])
        if d['status'] in ('PENDING', 'PROPOSED') and material:
            add('MATERIAL_DECISION_UNRESOLVED', 'UNVERIFIED', d['id'])
        if d['status'] in ('OWNER_DECIDED', 'DELEGATED_DECISION'):
            if d['chosen_option'] not in options:
                add('CHOSEN_OPTION_INVALID', 'CONTRADICTS', d['id'])
            need(d['decision_ref'], 'decision_record:' + d['id'], ('DECISION',))
            report['warnings'].append('decision_authority_not_authenticated:' + d['id'])

    groups = defaultdict(list)
    seen_claim_ids = set()
    for c in snapshot['claims']:
        if c['id'] in seen_claim_ids:
            add('DUPLICATE_CLAIM_ID', 'CONTRADICTS', c['id'])
        seen_claim_ids.add(c['id'])
        requirement_links(c['requirement_ids'], c['id'])
        if c['lifecycle'] == 'HISTORICAL':
            need(c['supersession_ref'], 'historical_claim_disposition:' + c['id'], ('DECISION',))
            continue
        if need(c['source_ref'], 'claim_source:' + c['id']):
            groups[(c['scope_key'], c['key'])].append(c)
    for (scope, key), group in sorted(groups.items()):
        if len({c['value'] for c in group}) > 1:
            add('EXPLICIT_CROSS_ARTIFACT_CONFLICT', 'CONTRADICTS', scope + ':' + key,
                [rid for c in group for rid in c['requirement_ids']],
                sources=[c['source_ref'] for c in group])
        elif len(group) > 1:
            report['warnings'].append('repeated_explicit_fact:' + scope + ':' + key)

    for o in snapshot['observations']:
        requirement_links(o['requirement_ids'], o['id'])
        for tid in o['task_ids']:
            if tid not in tasks:
                add('OBSERVATION_TASK_UNKNOWN', 'CONTRADICTS', tid)
        for sid in o['source_refs']:
            need(sid, 'observation_source:' + o['id'])
        if not o['source_refs']:
            report['unknowns'].append('observation_without_source:' + o['id'])
        add('DECLARED_REVIEW_OBSERVATION', o['category'], o['description'],
            o['requirement_ids'], o['task_ids'], o['source_refs'])

    confidence = snapshot['confidence']
    expected = (('solution', 'feasibility') if stage == 'PRE' else ('correctness',)) if material else ()
    for kind in expected:
        if kind not in confidence:
            report['unknowns'].append('confidence_judgment_missing:' + kind)
    for kind, c in confidence.items():
        for sid in c['support_refs']:
            need(sid, 'confidence_support:' + kind)
        if c['level'] == 'HIGH' and not c['support_refs']:
            report['unknowns'].append('high_confidence_without_support:' + kind)
        percent = c.get('percentage')
        if percent:
            if not (0 <= percent['lower'] <= percent['upper'] <= 100):
                add('CONFIDENCE_RANGE_INVALID', 'CONTRADICTS', kind)
            if percent['basis'] == 'EMPIRICALLY_CALIBRATED':
                need(percent['calibration_ref'], 'confidence_calibration:' + kind)
                report['warnings'].append('calibration_validity_not_authenticated:' + kind)
            else:
                report['warnings'].append('subjective_uncalibrated_percentage:' + kind)
        if stage == 'POST' and kind == 'correctness' and c['level'] == 'HIGH' and base['exit_code']:
            add('CONFIDENCE_EXCEEDS_RECORDED_VERIFICATION', 'CONTRADICTS', kind)

    review = snapshot['review']
    if stage == 'POST':
        if review['status'] != 'REVIEWED':
            report['unknowns'].append('semantic_quality_review_not_recorded')
        else:
            need(review['artifact_ref'], 'quality_review', ('REVIEW',))
            if not review['reviewer'].strip():
                report['unknowns'].append('quality_reviewer_unknown')
        if review['independent_required_by_project']:
            need(review['policy_ref'], 'independence_requirement')
            if review['mode'] == 'SELF' or not review['separation_note'].strip():
                report['unknowns'].append('required_independent_review_not_demonstrated')
        if review['mode'] == 'SELF':
            report['warnings'].append('self_review_not_independent')
        else:
            report['warnings'].append('separate_review_claim_not_authenticated')
    high_effect = (snapshot['context']['impact'] in ('HIGH', 'CRITICAL') or
                   snapshot['context']['reversibility'] in ('NO', 'UNKNOWN'))
    if high_effect:
        rollback = snapshot['rollback']
        if rollback['strategy'] in ('NOT_APPLICABLE', 'UNKNOWN'):
            add('RECOVERY_STRATEGY_MISSING', 'MISSING', snapshot['context']['task_id'])
        need(rollback['procedure_ref'], 'recovery_procedure', ('PROCEDURE',))
        if rollback['rehearsal'] == 'FAILED':
            add('RECOVERY_REHEARSAL_FAILED', 'CONTRADICTS', snapshot['context']['task_id'])
        elif rollback['rehearsal'] == 'PASSED':
            need(rollback['evidence_ref'], 'recovery_rehearsal', ('TEST_LOG', 'INSPECTION_LOG'))
        else:
            report['unknowns'].append('recovery_rehearsal_not_verified')
        if not rollback['residual_risk'].strip():
            report['unknowns'].append('recovery_residual_risk_not_stated')

    axes = set()
    for dc in snapshot['document_checks']:
        if dc['criterion'] in axes:
            add('DUPLICATE_DOCUMENT_CRITERION', 'CONTRADICTS', dc['criterion'])
        axes.add(dc['criterion'])
        if dc['status'] == 'GAP':
            add('DOCUMENT_QUALITY_GAP', 'PARTIAL', dc['criterion'] + ':' + dc['note'])
        elif dc['status'] == 'NOT_REVIEWED':
            report['unknowns'].append('document_check_unreviewed:' + dc['criterion'])
        elif dc['status'] == 'REVIEWED_CLEAR':
            need(dc['artifact_ref'], 'document_review:' + dc['criterion'], ('REVIEW',))
    if snapshot['context']['documentation_changed'] and report['routing']['profile'] != 'QUICK':
        for missing in sorted(DOC_AXES - axes):
            report['unknowns'].append('document_check_missing:' + missing)

    if snapshot['context']['work_type'] == 'BUG':
        bug = snapshot.get('bug')
        if not bug:
            report['unknowns'].append('bug_analysis_not_recorded')
        else:
            if bug['cause_status'] in ('HYPOTHESIS', 'UNKNOWN'):
                report['warnings'].append('root_cause_not_confirmed')
            if stage == 'POST':
                if bug['symptom_resolved'] is not True:
                    add('ORIGINAL_SYMPTOM_NOT_VERIFIED_RESOLVED', 'UNVERIFIED', bug['symptom'])
                need(bug['before_ref'], 'bug_before_evidence', ('TEST_LOG', 'INSPECTION_LOG'))
                need(bug['after_ref'], 'bug_after_evidence', ('TEST_LOG', 'INSPECTION_LOG'))
                if not bug['regression_refs']:
                    report['unknowns'].append('bug_regression_evidence_missing')
                for sid in bug['regression_refs']:
                    need(sid, 'bug_regression', ('TEST_LOG', 'INSPECTION_LOG'))
    return _finish(report)
