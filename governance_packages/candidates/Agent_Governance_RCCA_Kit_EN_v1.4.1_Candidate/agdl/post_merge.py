"""Read-only post-merge closure diagnostic over supplied state metadata.

Does not execute Git commands, manage processes, modify files, or grant approval.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .io import loads, read_explicit
from .schema import check

ROOT = Path(__file__).resolve().parents[1]
RISKY_WATCHER_CLASSES = {'AUTO_WRITE', 'FILE_LOCK', 'UNSAFE_HOT_RELOAD'}


def _parse_expiry(raw: str) -> datetime | None:
    try:
        parsed = datetime.fromisoformat(raw.replace('Z', '+00:00'))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else None


def _check_git(git: dict[str, Any], issues: list[str], warnings: list[str]) -> str:
    if not git['unrelated_changes_preserved']:
        issues.append('unrelated_changes_not_preserved')
    if git['pending_operations']:
        issues.append('pending_git_operations_present')
    if git['dirty_worktree_collides']:
        issues.append('dirty_worktree_collision')
    if git['divergent_local_commits']:
        issues.append('divergent_local_branch')
    if git['linked_worktree_conflict']:
        issues.append('linked_worktree_conflict')
    if (git['expected_remote_sha'] and git['observed_remote_sha']
            and git['expected_remote_sha'] != git['observed_remote_sha']
            and not git['fast_forward_possible']):
        issues.append('remote_sha_changed_non_ff')
    elif (git['expected_remote_sha'] and git['observed_remote_sha']
            and git['expected_remote_sha'] != git['observed_remote_sha']):
        warnings.append('remote_sha_changed_during_sync_check_ff')
    if not git['fast_forward_possible'] and git['sync_status'] != 'ABORTED':
        issues.append('non_fast_forward_sync_blocked')
    if git['sync_mode'] in ('MERGE_COMMIT', 'REBASE'):
        issues.append('non_ff_sync_mode_disallowed_for_closure:' + git['sync_mode'])

    if issues:
        return 'SYNCED_CLOSED' if git['sync_status'] == 'SYNCED' else 'BLOCKED'
    if git['sync_status'] in ('SYNCED', 'NOT_NEEDED'):
        return 'SYNCED_CLOSED'
    if git['sync_status'] == 'ABORTED':
        return 'BLOCKED'
    return 'NOT_STARTED'


def _check_watchers(watchers: list[dict[str, Any]], issues: list[str], actions: dict[str, list[str]]) -> None:
    for w in watchers:
        if w['effect_class'] not in RISKY_WATCHER_CLASSES:
            actions['kept_running'].append(w['name'])
            continue
        if not w['quiesced']:
            issues.append('unsafe_watcher_not_quiesced:' + w['name'])
        elif not w['identity_verified']:
            issues.append('watcher_identity_not_verified:' + w['name'])
        else:
            actions['quiesced'].append(w['name'])


def _check_branches(branches: list[dict[str, Any]], issues: list[str], actions: dict[str, list[str]]) -> None:
    for b in branches:
        if not b['delete_requested']:
            actions['preserved_branches'].append(b['name'])
            continue
        integrated = b['ancestry_merged'] or b['tree_or_pr_equivalent']
        if b['unique_unmerged_commits'] > 0 or not integrated:
            issues.append('branch_deletion_blocked_unique_unmerged_work:' + b['name'])
            continue
        if b['dirty_or_untracked_worktree'] or b['pending_stash']:
            issues.append('branch_deletion_blocked_dirty_or_stash:' + b['name'])
            continue
        if not b['recoverability_recorded']:
            issues.append('branch_recoverability_not_recorded:' + b['name'])
            continue
        actions['eligible_for_deletion'].append(b['name'])


def _check_runtime(rt: dict[str, Any], git_closure: str, issues: list[str],
                   warnings: list[str]) -> tuple[str, str]:
    if rt['destructive_auto_rollback_attempted']:
        issues.append('prohibited_destructive_auto_rollback')
    if not rt['protected_state_intact']:
        issues.append('protected_state_integrity_compromised')
    integrity = 'VERIFIED_INTACT' if rt['protected_state_intact'] else 'COMPROMISED'

    if not rt['refresh_required']:
        if rt['affected_services'] or rt['unrelated_services_restarted']:
            issues.append('unnecessary_runtime_restart_attempted')
        if not rt['requalification_trigger'] and rt['reused_qualification_refs']:
            warnings.append('prior_qualification_reused_no_trigger')
        return 'NOT_REQUIRED', integrity

    if rt['unrelated_services_restarted']:
        issues.append('unrelated_services_restarted')
    if not rt['affected_services']:
        issues.append('affected_services_not_identified')
    if not rt['process_identity_verified']:
        issues.append('process_identity_not_verified')
    if not rt['health_passed']:
        issues.append('runtime_health_check_failed')
    if not rt['loaded_revision_matches']:
        issues.append('loaded_revision_mismatch')

    runtime_failed = any((
        not rt['process_identity_verified'],
        not rt['health_passed'],
        not rt['loaded_revision_matches'],
    ))
    if runtime_failed and git_closure == 'SYNCED_CLOSED':
        warnings.append('partial_runtime_failure_git_state_preserved')
    readiness = 'FAILED' if runtime_failed else 'READY'
    return readiness, integrity


def _check_acceptances_and_exclusions(
    acceptances: list[dict[str, Any]],
    exclusions: list[dict[str, Any]],
    now: datetime,
    issues: list[str],
    unknowns: list[str],
    actions: dict[str, list[str]],
) -> None:
    for item in acceptances:
        if not item['scope_matches']:
            issues.append('risk_acceptance_out_of_scope:' + item['id'])
            continue
        if item['material_change_invalidated']:
            issues.append('risk_acceptance_invalidated_by_change:' + item['id'])
            continue
        if item['valid_until'] is not None:
            expiry = _parse_expiry(item['valid_until'])
            if expiry is None:
                unknowns.append('risk_acceptance_invalid_expiry:' + item['id'])
                continue
            if expiry <= now:
                issues.append('risk_acceptance_expired:' + item['id'])
                continue
        actions['preserved_risk_acceptances'].append(item['id'])

    for exc in exclusions:
        if exc['attempted']:
            issues.append('excluded_operation_attempted:' + exc['operation'])
        elif not exc['scope_decision_ref'].strip():
            unknowns.append('excluded_operation_missing_decision_ref:' + exc['operation'])
        else:
            actions['excluded_out_of_scope'].append(exc['operation'])


def assess_post_merge(snapshot: Any, now: datetime | None = None) -> dict[str, Any]:
    """Evaluate a supplied post-merge closure snapshot without performing execution."""
    out: dict[str, Any] = {
        'schema_version': 'agdl-post-merge-report-1.0',
        'record_kind': 'DERIVED_NON_AUTHORITATIVE',
        'verdict': 'INCONCLUSIVE',
        'issues': [],
        'unknowns': [],
        'warnings': [],
        'axes': {
            'git_closure': 'NOT_STARTED',
            'runtime_readiness': 'NOT_RUN',
            'protected_data_integrity': 'UNKNOWN',
            'owner_acceptance': 'NOT_REQUESTED',
            'production_activation': 'NOT_ACTIVE',
        },
        'decisions': {
            'kept_running': [],
            'quiesced': [],
            'preserved_branches': [],
            'eligible_for_deletion': [],
            'preserved_risk_acceptances': [],
            'excluded_out_of_scope': [],
        },
        'auto_rollback_permitted': False,
        'destructive_git_reset_permitted': False,
        'execution_performed': False,
        'authorization_authenticated': False,
        'runtime_enforcement_verified': False,
        'exit_code': 3,
    }
    schema = loads(read_explicit(ROOT / 'schemas/post-merge.schema.json'))
    errors = check(snapshot, schema)
    if errors:
        out['unknowns'] = sorted('schema:' + e for e in errors)
        return out

    current_time = now or datetime.now(timezone.utc)
    issues: list[str] = []
    unknowns: list[str] = []
    warnings: list[str] = []

    git_closure = _check_git(snapshot['git'], issues, warnings)
    _check_watchers(snapshot['watchers'], issues, out['decisions'])
    _check_branches(snapshot['branches'], issues, out['decisions'])
    runtime_readiness, integrity = _check_runtime(snapshot['runtime'], git_closure, issues, warnings)
    _check_acceptances_and_exclusions(
        snapshot['risk_acceptances'],
        snapshot['excluded_operations'],
        current_time,
        issues,
        unknowns,
        out['decisions'],
    )

    if git_closure == 'SYNCED_CLOSED' and any(
        i.startswith(('branch_deletion_', 'unsafe_watcher_', 'watcher_identity_')) for i in issues
    ):
        git_closure = 'PARTIAL'

    out['issues'] = sorted(set(issues))
    out['unknowns'] = sorted(set(unknowns))
    out['warnings'] = sorted(set(warnings))
    out['axes'] = {
        'git_closure': git_closure,
        'runtime_readiness': runtime_readiness,
        'protected_data_integrity': integrity,
        'owner_acceptance': snapshot['owner_acceptance'],
        'production_activation': snapshot['production_activation'],
    }
    if out['issues']:
        out['verdict'] = 'CLOSURE_BLOCKED_OR_GAPS'
        out['exit_code'] = 2
    elif out['unknowns']:
        out['verdict'] = 'INCONCLUSIVE'
        out['exit_code'] = 3
    else:
        out['verdict'] = 'CLOSURE_CHECKS_PASSED'
        out['exit_code'] = 0
    return out
