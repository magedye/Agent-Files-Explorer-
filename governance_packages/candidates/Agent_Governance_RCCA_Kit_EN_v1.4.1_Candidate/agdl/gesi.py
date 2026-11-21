"""Read-only Governed Engineering Skills Integration (GESI) diagnostic.

Evaluates capability discovery state, session visibility, cross-root collisions,
task-to-skill matching, governance compatibility, trust/supply-chain metadata,
and selection decisions without installing skills, modifying host config, or
enforcing runtime permissions.
"""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path
from typing import Any

from .io import loads, read_explicit
from .schema import check

ROOT = Path(__file__).resolve().parents[1]
ACTIVE_EXISTING_STATES = {'ENABLED', 'LOADED', 'USED', 'VERIFIED'}
UNOBSERVABLE_STATES = {'UNKNOWN', 'NOT_OBSERVABLE'}


def _decision(
    skill_id: str,
    decision: str,
    reason: str,
    scope: str,
    evidence: list[str],
    constraints: list[str] | None = None,
) -> dict[str, Any]:
    return {
        'skill_id': skill_id,
        'decision': decision,
        'reason': reason,
        'applicable_scope': scope,
        'supporting_evidence': list(evidence),
        'constraints': list(constraints or []),
    }


def _scan_cross_root_collisions(
    candidates: list[dict[str, Any]],
    warnings: list[str],
    inventory_findings: list[str],
) -> set[str]:
    by_name: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for c in candidates:
        if c['origin'] != 'EXTERNAL_CATALOG':
            by_name[c['name'].strip().casefold()].append(c)
    divergent_names: set[str] = set()
    for norm_name, group in sorted(by_name.items()):
        if len(group) < 2:
            continue
        warnings.append('cross_root_same_name_collision:' + norm_name)
        inventory_findings.append('cross_root_same_name_collision:' + norm_name)
        revs = {c['observed_revision'] for c in group if c['observed_revision']}
        if len(revs) > 1:
            divergent_names.add(norm_name)
            warnings.append('cross_root_revision_divergence:' + norm_name)
            inventory_findings.append('cross_root_revision_divergence:' + norm_name)
    return divergent_names


def _inseparable_hard_blocks(cand: dict[str, Any], task: dict[str, Any]) -> list[str]:
    sid = cand['id']
    reasons: list[str] = []
    if (cand['conflicting_project_decisions']
            or (set(cand['conflicting_project_decisions']) & set(task['active_project_decisions']))):
        reasons.append('project_decision_conflict:' + sid)
    if cand['unreviewed_install_scripts']:
        reasons.append('unsafe_hooks_or_install_scripts:' + sid)
    if cand['unapproved_network_or_data_egress']:
        reasons.append('unapproved_network_or_data_egress:' + sid)
    if cand['unbounded_subagent_writers']:
        reasons.append('unbounded_subagent_writers:' + sid)
    if ((cand['pinned_revision'] and cand['observed_revision']
            and cand['pinned_revision'] != cand['observed_revision'])
            or cand['upstream_permission_or_behavior_drift']):
        reasons.append('upstream_revision_or_permission_drift:' + sid)
    if cand['pilot_status'] == 'FAILED_NO_MEANINGFUL_VALUE':
        reasons.append('pilot_failed_meaningful_value:' + sid)
    if task['host_id'] not in cand['supported_hosts']:
        reasons.append('host_incompatible:' + sid)
    return reasons


def _has_adaptation_basis(cand: dict[str, Any], require_separable_slice: bool = False) -> bool:
    if not cand['adaptable_with_constraints'] or not cand['proposed_constraints'] or not cand['evidence_refs']:
        return False
    if require_separable_slice and not cand.get('separable_adaptable_slice', False):
        return False
    return True


def _separable_and_workflow_conflicts(
    cand: dict[str, Any], task: dict[str, Any]
) -> tuple[list[str], bool]:
    """Return (conflict_codes, can_adapt_safely)."""
    sid = cand['id']
    slice_conflicts: list[str] = []
    workflow_conflicts: list[str] = []
    extra_perms = set(cand['required_permissions']) - set(task['allowed_permissions'])
    if cand['requires_unauthorized_git_or_deploy'] or extra_perms:
        slice_conflicts.append('unauthorized_git_or_deploy_or_permission:' + sid)
    if cand['missing_references']:
        slice_conflicts.append('missing_supplementary_resources:' + sid)
    if cand['auto_hooks'] and not cand['unreviewed_install_scripts']:
        slice_conflicts.append('unsafe_hooks_or_install_scripts:' + sid)

    if cand['requires_repeated_approvals'] and not task['allow_repeated_approvals']:
        workflow_conflicts.append('repeated_approval_gate_conflict:' + sid)
    if cand['enforces_mandatory_worktree'] and task['worktree_policy'] == 'SINGLE_WORKTREE':
        workflow_conflicts.append('incompatible_worktree_policy:' + sid)
    if cand['forbids_evidence_reuse_or_forces_full_rerun'] and task['allow_evidence_reuse']:
        workflow_conflicts.append('incompatible_testing_or_evidence_policy:' + sid)

    all_conflicts = slice_conflicts + workflow_conflicts
    if not all_conflicts:
        return [], True
    can_adapt = _has_adaptation_basis(cand, require_separable_slice=bool(slice_conflicts))
    return all_conflicts, can_adapt


def _is_inactive_or_unobservable(cand: dict[str, Any]) -> tuple[bool, str | None]:
    if cand['origin'] == 'EXTERNAL_CATALOG':
        return False, None
    vis = cand.get('session_visibility')
    state = cand['state']
    if state in UNOBSERVABLE_STATES or vis in UNOBSERVABLE_STATES:
        return True, 'session_visibility_not_observable'
    if vis == 'UNANNOUNCED' or state not in ACTIVE_EXISTING_STATES:
        return True, 'claimed_install_not_enabled_or_loaded'
    return False, None


def _record_finding(
    codes: list[str],
    is_relevant_uncovered: bool,
    inventory_findings: list[str],
    issues: list[str],
    warnings: list[str],
    *,
    as_unknown: bool = False,
    unknowns: list[str] | None = None,
) -> None:
    inventory_findings.extend(codes)
    if is_relevant_uncovered:
        if as_unknown and unknowns is not None:
            unknowns.extend(codes)
        else:
            issues.extend(codes)
    else:
        warnings.extend(codes)


def _evaluate_candidate(
    cand: dict[str, Any],
    task: dict[str, Any],
    covered_caps: set[str],
    divergent_names: set[str],
    inventory_findings: list[str],
    issues: list[str],
    unknowns: list[str],
    warnings: list[str],
) -> tuple[dict[str, Any], bool, bool]:
    sid = cand['id']
    scope = f"{task['host_id']}:{task['phase']}:{task['task_id']}"
    ev = cand['evidence_refs']
    needed = set(task['required_capabilities'])
    cand_caps = set(cand['capabilities'])
    task_relevant = (not needed) or bool(needed & cand_caps)
    relevant_uncovered = (not needed) or bool((needed & cand_caps) - covered_caps)

    inactive, state_reason = _is_inactive_or_unobservable(cand)
    hard = _inseparable_hard_blocks(cand, task)
    conflicts, can_adapt = _separable_and_workflow_conflicts(cand, task)

    # M2: Evaluate safety, supply-chain, and governance risks BEFORE installation/activation state.
    blocking_reasons = list(hard)
    if conflicts and (hard or not can_adapt):
        blocking_reasons.extend(conflicts)
    if blocking_reasons:
        _record_finding(blocking_reasons, relevant_uncovered, inventory_findings, issues, warnings)
        reason_text = ','.join(blocking_reasons)
        if inactive:
            reason_text += ';inactive_skill_not_executed'
        return _decision(sid, 'REJECT', reason_text, scope, ev), False, False

    # M5: Reject ambiguous unpinned cross-root revision divergence.
    norm_name = cand['name'].strip().casefold()
    if (cand['origin'] != 'EXTERNAL_CATALOG' and norm_name in divergent_names
            and (not cand['pinned_revision'] or cand['pinned_revision'] != cand['observed_revision'])):
        code = 'cross_root_ambiguous_revision:' + sid
        _record_finding([code], relevant_uncovered, inventory_findings, issues, warnings)
        return _decision(sid, 'REJECT', code, scope, ev), False, False

    # M5: Distinguish disk installation from session announcement/visibility.
    if inactive and state_reason is not None:
        code = f'{state_reason}:{sid}'
        as_unknown = state_reason == 'session_visibility_not_observable'
        _record_finding(
            [code],
            relevant_uncovered,
            inventory_findings,
            issues,
            warnings,
            as_unknown=as_unknown,
            unknowns=unknowns,
        )
        detail = 'session_visibility_not_observable' if as_unknown else f"state_not_enabled_or_loaded:{cand['state']}"
        return _decision(sid, 'DEFER', detail, scope, ev), False, False

    if not task_relevant:
        return _decision(sid, 'DEFER', 'capability_not_needed_for_task:' + sid, scope, ev), False, False

    useful = (needed & cand_caps) - covered_caps if needed else (cand_caps - covered_caps)
    if not useful:
        warnings.append('duplicate_capability_skipped:' + sid)
        return _decision(sid, 'REJECT', 'duplicate_or_covered_capability:' + sid, scope, ev), False, False

    # M3 & M4: Preserve explicit constraints across all selected decisions.
    constraints = list(cand['proposed_constraints'])
    adapted = bool(conflicts and can_adapt)
    if adapted:
        warnings.extend(conflicts)
    if constraints:
        warnings.append('explicit_constraints_preserved:' + sid)

    covered_caps.update(cand_caps)
    if cand['origin'] != 'EXTERNAL_CATALOG':
        if adapted:
            return (
                _decision(sid, 'ADAPT_WITH_CONSTRAINTS', 'existing_skill_constrained', scope, ev, constraints),
                True,
                False,
            )
        return _decision(sid, 'USE_EXISTING', 'covered_by_qualified_existing_skill', scope, ev, constraints), True, False

    if adapted:
        return (
            _decision(sid, 'ADAPT_WITH_CONSTRAINTS', 'external_skill_requires_governance_constraints', scope, ev, constraints),
            True,
            True,
        )
    if cand['pilot_status'] == 'NOT_RUN':
        return _decision(sid, 'PILOT_FIRST', 'complementary_external_requires_representative_pilot', scope, ev, constraints), True, True
    if cand['adoption_authorized'] and cand['pilot_status'] in ('PASSED_MEANINGFUL_VALUE', 'NOT_REQUIRED'):
        return _decision(sid, 'ADOPT_EXTERNAL', 'complementary_external_authorized_and_compatible', scope, ev, constraints), True, True
    covered_caps.difference_update(useful)
    return _decision(sid, 'DEFER', 'external_adoption_not_yet_authorized', scope, ev, constraints), False, False


def _candidate_priority(cand: dict[str, Any], task: dict[str, Any]) -> int:
    hard = _inseparable_hard_blocks(cand, task)
    conflicts, can_adapt = _separable_and_workflow_conflicts(cand, task)
    if hard or (conflicts and not can_adapt):
        return 2
    inactive, _ = _is_inactive_or_unobservable(cand)
    if inactive:
        return 2
    if cand['origin'] != 'EXTERNAL_CATALOG':
        return 0
    return 1


def assess_skills(snapshot: Any) -> dict[str, Any]:
    """Evaluate a GESI skills-assessment snapshot without installing or enforcing."""
    out: dict[str, Any] = {
        'schema_version': 'agdl-gesi-report-1.0',
        'record_kind': 'DERIVED_NON_AUTHORITATIVE',
        'verdict': 'INCONCLUSIVE',
        'selected_skills': [],
        'install_recommended': False,
        'decisions': [],
        'inventory_findings': [],
        'issues': [],
        'unknowns': [],
        'warnings': [],
        'execution_performed': False,
        'installation_performed': False,
        'authorization_authenticated': False,
        'runtime_enforcement_verified': False,
        'exit_code': 3,
    }
    schema = loads(read_explicit(ROOT / 'schemas/gesi.schema.json'))
    errors = check(snapshot, schema)
    if errors:
        out['unknowns'] = sorted('schema:' + e for e in errors)
        return out

    task = snapshot['task']
    candidates = snapshot['candidates']
    seen_ids: set[str] = set()
    issues: list[str] = []
    unknowns: list[str] = []
    warnings: list[str] = []
    inventory_findings: list[str] = []
    for c in candidates:
        if c['id'] in seen_ids:
            issues.append('duplicate_candidate_id:' + c['id'])
        seen_ids.add(c['id'])
    if issues:
        out['issues'] = sorted(set(issues))
        out['inventory_findings'] = sorted(set(issues))
        out['verdict'] = 'GAPS_OR_CONFLICTS_FOUND'
        out['exit_code'] = 2
        return out

    if task['complexity'] == 'TRIVIAL' and not task['required_capabilities']:
        out['verdict'] = 'NO_SKILL_NEEDED'
        out['exit_code'] = 0
        return out

    divergent_names = _scan_cross_root_collisions(candidates, warnings, inventory_findings)
    ordered = sorted(candidates, key=lambda c: _candidate_priority(c, task))
    covered_caps: set[str] = set()
    decision_by_id: dict[str, dict[str, Any]] = {}
    selected: list[str] = []
    install_needed = False

    for cand in ordered:
        dec, is_selected, is_install = _evaluate_candidate(
            cand, task, covered_caps, divergent_names, inventory_findings, issues, unknowns, warnings
        )
        decision_by_id[cand['id']] = dec
        if is_selected:
            selected.append(cand['id'])
        if is_install:
            install_needed = True

    uncovered = sorted(set(task['required_capabilities']) - covered_caps)
    if uncovered and unknowns and not issues:
        # Preserve INCONCLUSIVE when the unmet required capability stems from unobservable session visibility.
        pass
    else:
        for cap in uncovered:
            issues.append('required_capability_unmet:' + cap)

    out['decisions'] = [decision_by_id[c['id']] for c in candidates]
    out['selected_skills'] = selected
    out['install_recommended'] = install_needed
    out['inventory_findings'] = sorted(set(inventory_findings))
    out['issues'] = sorted(set(issues))
    out['unknowns'] = sorted(set(unknowns))
    out['warnings'] = sorted(set(warnings))
    if out['issues']:
        out['verdict'] = 'GAPS_OR_CONFLICTS_FOUND'
        out['exit_code'] = 2
    elif out['unknowns']:
        out['verdict'] = 'INCONCLUSIVE'
        out['exit_code'] = 3
    elif install_needed:
        out['verdict'] = 'EXTERNAL_ADOPTION_CANDIDATE'
        out['exit_code'] = 0
    elif selected:
        out['verdict'] = 'USE_EXISTING_NO_INSTALL'
        out['exit_code'] = 0
    else:
        out['verdict'] = 'NO_SKILL_NEEDED'
        out['exit_code'] = 0
    return out
