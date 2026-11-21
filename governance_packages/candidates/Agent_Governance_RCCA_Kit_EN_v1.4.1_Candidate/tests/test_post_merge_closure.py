"""Focused structural and behavioral tests for post-merge Git and runtime closure."""
from __future__ import annotations

import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from agdl.post_merge import assess_post_merge

ROOT = Path(__file__).resolve().parents[1]
NOW = datetime(2026, 11, 21, 12, 0, tzinfo=timezone.utc)


def base_snapshot() -> dict:
    return {
        'schema_version': 'agdl-post-merge-1.0',
        'record_kind': 'DERIVED_NON_AUTHORITATIVE',
        'task_id': 'TASK-PM-001',
        'git': {
            'target_branch': 'main',
            'expected_remote_sha': 'aaaa1111',
            'observed_remote_sha': 'aaaa1111',
            'sync_mode': 'FF_ONLY',
            'sync_status': 'SYNCED',
            'fast_forward_possible': True,
            'dirty_worktree_collides': False,
            'divergent_local_commits': False,
            'linked_worktree_conflict': False,
            'pending_operations': [],
            'unrelated_changes_preserved': True,
        },
        'watchers': [],
        'branches': [],
        'runtime': {
            'refresh_required': False,
            'affected_services': [],
            'unrelated_services_restarted': False,
            'process_identity_verified': False,
            'health_passed': True,
            'loaded_revision_matches': True,
            'protected_state_intact': True,
            'reused_qualification_refs': ['LOCAL-SUITE-01'],
            'requalification_trigger': False,
            'destructive_auto_rollback_attempted': False,
        },
        'risk_acceptances': [],
        'excluded_operations': [],
        'owner_acceptance': 'PENDING',
        'production_activation': 'NOT_ACTIVE',
    }


class PostMergeStructuralTests(unittest.TestCase):
    def test_procedure_exists_and_keeps_non_enforcement_and_distinct_axes(self):
        doc = (ROOT / 'docs/16_POST_MERGE_CLOSURE.md').read_text(encoding='utf-8')
        for phrase in (
            'declarative operational instructions',
            '--ff-only',
            'Git closure',
            'Runtime readiness',
            'Protected-data integrity',
            'Owner acceptance',
            'Production activation',
            'No new skill or parallel rule register is created',
        ):
            self.assertIn(phrase, doc)
        # Ensure no extra skill directory was created under skills/
        skill_dirs = sorted(p.name for p in (ROOT / 'skills').iterdir() if p.is_dir())
        self.assertEqual(skill_dirs, ['adeq-quality'])

    def test_cli_post_merge_check_is_read_only_and_non_authoritative(self):
        snap = base_snapshot()
        with tempfile.TemporaryDirectory(prefix='agdl_pm_') as tmp:
            path = Path(tmp) / 'pm.json'
            path.write_text(json.dumps(snap), encoding='utf-8')
            res = subprocess.run(
                [sys.executable, '-B', '-m', 'agdl', 'post-merge-check', '--snapshot', str(path)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=15,
                env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
            )
            self.assertEqual(res.returncode, 0, res.stderr)
            out = json.loads(res.stdout)
            self.assertEqual(out['verdict'], 'CLOSURE_CHECKS_PASSED')
            self.assertFalse(out['execution_performed'])
            self.assertFalse(out['authorization_authenticated'])
            self.assertFalse(out['runtime_enforcement_verified'])
            self.assertFalse(out['auto_rollback_permitted'])


class PostMergeBehavioralTests(unittest.TestCase):
    def test_dirty_and_divergent_local_branches_block_sync(self):
        dirty = base_snapshot()
        dirty['git'].update(sync_status='ABORTED', fast_forward_possible=False, dirty_worktree_collides=True)
        r_dirty = assess_post_merge(dirty, NOW)
        self.assertEqual(r_dirty['exit_code'], 2)
        self.assertIn('dirty_worktree_collision', r_dirty['issues'])
        self.assertEqual(r_dirty['axes']['git_closure'], 'BLOCKED')
        self.assertFalse(r_dirty['destructive_git_reset_permitted'])

        div = base_snapshot()
        div['git'].update(sync_status='ABORTED', fast_forward_possible=False, divergent_local_commits=True)
        r_div = assess_post_merge(div, NOW)
        self.assertIn('divergent_local_branch', r_div['issues'])
        self.assertEqual(r_div['axes']['git_closure'], 'BLOCKED')

        pending = base_snapshot()
        pending['git'].update(sync_status='ABORTED', pending_operations=['rebase-merge'])
        self.assertIn('pending_git_operations_present', assess_post_merge(pending, NOW)['issues'])

    def test_remote_sha_changes_during_sync(self):
        non_ff = base_snapshot()
        non_ff['git'].update(
            expected_remote_sha='aaaa1111',
            observed_remote_sha='bbbb2222',
            fast_forward_possible=False,
            sync_status='ABORTED',
        )
        res = assess_post_merge(non_ff, NOW)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('remote_sha_changed_non_ff', res['issues'])
        self.assertEqual(res['axes']['git_closure'], 'BLOCKED')

        still_ff = base_snapshot()
        still_ff['git'].update(
            expected_remote_sha='aaaa1111',
            observed_remote_sha='bbbb2222',
            fast_forward_possible=True,
            sync_status='SYNCED',
        )
        ok = assess_post_merge(still_ff, NOW)
        self.assertEqual(ok['exit_code'], 0)
        self.assertIn('remote_sha_changed_during_sync_check_ff', ok['warnings'])

    def test_watchers_harmless_vs_unsafe_side_effects(self):
        snap = base_snapshot()
        snap['watchers'] = [
            {'name': 'status-ui', 'effect_class': 'HARMLESS_READ_ONLY', 'quiesced': False, 'identity_verified': False},
            {'name': 'other-repo', 'effect_class': 'UNRELATED', 'quiesced': False, 'identity_verified': False},
            {'name': 'codegen-watch', 'effect_class': 'AUTO_WRITE', 'quiesced': True, 'identity_verified': True},
        ]
        ok = assess_post_merge(snap, NOW)
        self.assertEqual(ok['exit_code'], 0)
        self.assertEqual(ok['decisions']['kept_running'], ['status-ui', 'other-repo'])
        self.assertEqual(ok['decisions']['quiesced'], ['codegen-watch'])

        unsafe = copy.deepcopy(snap)
        unsafe['watchers'][2]['quiesced'] = False
        bad = assess_post_merge(unsafe, NOW)
        self.assertEqual(bad['exit_code'], 2)
        self.assertIn('unsafe_watcher_not_quiesced:codegen-watch', bad['issues'])

        unverified_id = copy.deepcopy(snap)
        unverified_id['watchers'][2]['identity_verified'] = False
        bad_id = assess_post_merge(unverified_id, NOW)
        self.assertIn('watcher_identity_not_verified:codegen-watch', bad_id['issues'])

    def test_branch_deletion_with_unique_unmerged_work_vs_squash_equivalence(self):
        unmerged = base_snapshot()
        unmerged['branches'] = [{
            'name': 'feat/wip',
            'tip_sha': 'cccc3333',
            'delete_requested': True,
            'ancestry_merged': False,
            'tree_or_pr_equivalent': False,
            'unique_unmerged_commits': 2,
            'dirty_or_untracked_worktree': False,
            'pending_stash': False,
            'recoverability_recorded': True,
        }]
        r_block = assess_post_merge(unmerged, NOW)
        self.assertEqual(r_block['exit_code'], 2)
        self.assertIn('branch_deletion_blocked_unique_unmerged_work:feat/wip', r_block['issues'])
        self.assertEqual(r_block['axes']['git_closure'], 'PARTIAL')

        squash = base_snapshot()
        squash['branches'] = [{
            'name': 'feat/squashed',
            'tip_sha': 'dddd4444',
            'delete_requested': True,
            'ancestry_merged': False,
            'tree_or_pr_equivalent': True,
            'unique_unmerged_commits': 0,
            'dirty_or_untracked_worktree': False,
            'pending_stash': False,
            'recoverability_recorded': True,
        }]
        r_ok = assess_post_merge(squash, NOW)
        self.assertEqual(r_ok['exit_code'], 0)
        self.assertEqual(r_ok['decisions']['eligible_for_deletion'], ['feat/squashed'])

    def test_runtime_refresh_not_required_reuses_qualification(self):
        snap = base_snapshot()
        res = assess_post_merge(snap, NOW)
        self.assertEqual(res['exit_code'], 0)
        self.assertEqual(res['axes']['runtime_readiness'], 'NOT_REQUIRED')
        self.assertIn('prior_qualification_reused_no_trigger', res['warnings'])

        wasted = base_snapshot()
        wasted['runtime']['unrelated_services_restarted'] = True
        self.assertIn('unnecessary_runtime_restart_attempted', assess_post_merge(wasted, NOW)['issues'])

    def test_partial_operational_failure_preserves_git_state(self):
        partial = base_snapshot()
        partial['runtime'].update(
            refresh_required=True,
            affected_services=['local-studio-dev'],
            process_identity_verified=True,
            health_passed=False,
            loaded_revision_matches=False,
            protected_state_intact=True,
            destructive_auto_rollback_attempted=False,
        )
        res = assess_post_merge(partial, NOW)
        self.assertEqual(res['exit_code'], 2)
        self.assertEqual(res['axes']['git_closure'], 'SYNCED_CLOSED')
        self.assertEqual(res['axes']['runtime_readiness'], 'FAILED')
        self.assertEqual(res['axes']['protected_data_integrity'], 'VERIFIED_INTACT')
        self.assertFalse(res['auto_rollback_permitted'])
        self.assertFalse(res['destructive_git_reset_permitted'])
        self.assertIn('partial_runtime_failure_git_state_preserved', res['warnings'])

        rollback_try = copy.deepcopy(partial)
        rollback_try['runtime']['destructive_auto_rollback_attempted'] = True
        self.assertIn('prohibited_destructive_auto_rollback', assess_post_merge(rollback_try, NOW)['issues'])

    def test_existing_valid_risk_acceptance_preserved_and_expired_rejected(self):
        snap = base_snapshot()
        snap['risk_acceptances'] = [{
            'id': 'DEC-009',
            'decision_ref': 'docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md',
            'valid_until': '2099-01-01T00:00:00Z',
            'scope_matches': True,
            'material_change_invalidated': False,
        }]
        ok = assess_post_merge(snap, NOW)
        self.assertEqual(ok['exit_code'], 0)
        self.assertEqual(ok['decisions']['preserved_risk_acceptances'], ['DEC-009'])

        expired = copy.deepcopy(snap)
        expired['risk_acceptances'][0]['valid_until'] = '2026-01-01T00:00:00Z'
        bad = assess_post_merge(expired, NOW)
        self.assertEqual(bad['exit_code'], 2)
        self.assertIn('risk_acceptance_expired:DEC-009', bad['issues'])

    def test_explicitly_excluded_operations_not_incomplete(self):
        snap = base_snapshot()
        snap['excluded_operations'] = [
            {'operation': 'push', 'scope_decision_ref': 'DEC-REMOTE-ISOLATION', 'attempted': False},
            {'operation': 'deploy', 'scope_decision_ref': 'DEC-LOCAL-ONLY', 'attempted': False},
        ]
        ok = assess_post_merge(snap, NOW)
        self.assertEqual(ok['exit_code'], 0)
        self.assertEqual(ok['decisions']['excluded_out_of_scope'], ['push', 'deploy'])

        attempted = copy.deepcopy(snap)
        attempted['excluded_operations'][0]['attempted'] = True
        self.assertIn('excluded_operation_attempted:push', assess_post_merge(attempted, NOW)['issues'])


if __name__ == '__main__':
    unittest.main()
