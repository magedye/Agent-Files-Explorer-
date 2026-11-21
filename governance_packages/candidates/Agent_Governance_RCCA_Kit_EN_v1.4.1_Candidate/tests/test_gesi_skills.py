"""Focused structural and behavioral tests for Governed Engineering Skills Integration (GESI)."""
from __future__ import annotations

import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from agdl.gesi import assess_skills

ROOT = Path(__file__).resolve().parents[1]


def make_candidate(cid: str = 'host:user:debugging', **overrides) -> dict:
    row = {
        'id': cid,
        'name': cid.split(':')[-1],
        'origin': 'USER',
        'artifact_kind': 'STANDALONE_SKILL',
        'state': 'ENABLED',
        'capabilities': ['root_cause_debugging'],
        'supported_hosts': ['codex', 'antigravity'],
        'required_permissions': ['read', 'test'],
        'pinned_revision': 'rev-1',
        'observed_revision': 'rev-1',
        'upstream_permission_or_behavior_drift': False,
        'missing_references': [],
        'auto_hooks': False,
        'unreviewed_install_scripts': False,
        'requires_unauthorized_git_or_deploy': False,
        'requires_repeated_approvals': False,
        'enforces_mandatory_worktree': False,
        'forbids_evidence_reuse_or_forces_full_rerun': False,
        'unapproved_network_or_data_egress': False,
        'unbounded_subagent_writers': False,
        'conflicting_project_decisions': [],
        'adaptable_with_constraints': False,
        'proposed_constraints': [],
        'pilot_status': 'NOT_REQUIRED',
        'adoption_authorized': True,
        'evidence_refs': ['INV-001'],
    }
    row.update(overrides)
    return row


def base_snapshot() -> dict:
    return {
        'schema_version': 'agdl-gesi-1.0',
        'record_kind': 'DERIVED_NON_AUTHORITATIVE',
        'task': {
            'task_id': 'TASK-GESI-001',
            'intent': 'diagnose bug',
            'technology': 'python',
            'complexity': 'MEDIUM',
            'risk_tier': 'R1',
            'phase': 'execution',
            'host_id': 'codex',
            'required_capabilities': ['root_cause_debugging'],
            'allowed_permissions': ['read', 'edit', 'test'],
            'worktree_policy': 'SINGLE_WORKTREE',
            'allow_repeated_approvals': False,
            'allow_evidence_reuse': True,
            'active_project_decisions': ['DEC-001', 'DEC-009'],
        },
        'candidates': [],
    }


class GesiBehavioralTests(unittest.TestCase):
    def test_01_existing_skills_cover_task_no_install_recommended(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate('ext:superpowers:systematic-debugging', origin='EXTERNAL_CATALOG', state='DISCOVERED'),
            make_candidate('host:user:debugging-and-error-recovery', origin='USER', state='ENABLED'),
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 0)
        self.assertEqual(res['verdict'], 'USE_EXISTING_NO_INSTALL')
        self.assertFalse(res['install_recommended'])
        self.assertEqual(res['selected_skills'], ['host:user:debugging-and-error-recovery'])
        decisions = {d['skill_id']: d for d in res['decisions']}
        self.assertEqual(decisions['host:user:debugging-and-error-recovery']['decision'], 'USE_EXISTING')
        self.assertEqual(decisions['ext:superpowers:systematic-debugging']['decision'], 'REJECT')

    def test_02_external_skill_complementary_capability_adopted_or_piloted(self):
        snap = base_snapshot()
        snap['task']['required_capabilities'] = ['security_audit']
        snap['candidates'] = [
            make_candidate(
                'ext:trailofbits:static-analysis',
                origin='EXTERNAL_CATALOG',
                state='DISCOVERED',
                capabilities=['security_audit'],
                pilot_status='NOT_RUN',
                adoption_authorized=False,
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 0)
        self.assertEqual(res['verdict'], 'EXTERNAL_ADOPTION_CANDIDATE')
        self.assertTrue(res['install_recommended'])
        self.assertEqual(res['decisions'][0]['decision'], 'PILOT_FIRST')

        snap_ok = copy.deepcopy(snap)
        snap_ok['candidates'][0].update(pilot_status='PASSED_MEANINGFUL_VALUE', adoption_authorized=True)
        res_ok = assess_skills(snap_ok)
        self.assertEqual(res_ok['exit_code'], 0)
        self.assertEqual(res_ok['decisions'][0]['decision'], 'ADOPT_EXTERNAL')

    def test_03_duplicate_candidates_for_same_function_deduplicated(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate('host:user:debug-a', state='LOADED'),
            make_candidate('host:plugin:debug-b', origin='PLUGIN', state='ENABLED'),
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 0)
        self.assertEqual(res['selected_skills'], ['host:user:debug-a'])
        decisions = {d['skill_id']: d for d in res['decisions']}
        self.assertEqual(decisions['host:plugin:debug-b']['decision'], 'REJECT')
        self.assertIn('duplicate_or_covered_capability:host:plugin:debug-b', decisions['host:plugin:debug-b']['reason'])

    def test_04_skill_attempting_unauthorized_git_or_deploy_rejected(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'ext:yeet',
                origin='EXTERNAL_CATALOG',
                state='DISCOVERED',
                required_permissions=['read', 'push', 'deploy'],
                requires_unauthorized_git_or_deploy=True,
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertEqual(res['verdict'], 'GAPS_OR_CONFLICTS_FOUND')
        self.assertIn('unauthorized_git_or_deploy_or_permission:ext:yeet', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'REJECT')

    def test_05_skill_requiring_repeated_approvals_rejected_or_constrained(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'ext:gated-loop',
                origin='EXTERNAL_CATALOG',
                state='DISCOVERED',
                requires_repeated_approvals=True,
                adaptable_with_constraints=False,
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('repeated_approval_gate_conflict:ext:gated-loop', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'REJECT')

        constrained = copy.deepcopy(snap)
        constrained['candidates'][0].update(
            adaptable_with_constraints=True,
            proposed_constraints=['Operate under single task grant without mid-task re-prompts.'],
        )
        res_c = assess_skills(constrained)
        self.assertEqual(res_c['exit_code'], 0)
        self.assertEqual(res_c['decisions'][0]['decision'], 'ADAPT_WITH_CONSTRAINTS')
        self.assertTrue(res_c['decisions'][0]['constraints'])

    def test_06_skill_enforcing_incompatible_worktree_or_testing_workflow_rejected(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'ext:superpowers:using-git-worktrees',
                origin='EXTERNAL_CATALOG',
                state='DISCOVERED',
                artifact_kind='WORKFLOW_FRAMEWORK',
                enforces_mandatory_worktree=True,
                forbids_evidence_reuse_or_forces_full_rerun=True,
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('incompatible_worktree_policy:ext:superpowers:using-git-worktrees', res['issues'])
        self.assertIn('incompatible_testing_or_evidence_policy:ext:superpowers:using-git-worktrees', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'REJECT')

    def test_07_skill_referencing_missing_supplementary_resources_rejected(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'pkg:adeq-incomplete',
                origin='PACKAGE_REFERENCE',
                state='LOADED',
                missing_references=['../../policies/CORE.md'],
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('missing_supplementary_resources:pkg:adeq-incomplete', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'REJECT')

    def test_08_skill_with_unsafe_hooks_or_install_scripts_rejected(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'ext:ecc-bundle',
                origin='EXTERNAL_CATALOG',
                state='DISCOVERED',
                artifact_kind='HOOK_OR_PLUGIN_BUNDLE',
                auto_hooks=True,
                unreviewed_install_scripts=True,
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('unsafe_hooks_or_install_scripts:ext:ecc-bundle', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'REJECT')

    def test_09_claimed_installation_not_enabled_or_loaded_blocked(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate('host:plugin:review-agent', origin='PLUGIN', state='INSTALLED')
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('claimed_install_not_enabled_or_loaded:host:plugin:review-agent', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'DEFER')
        self.assertEqual(res['selected_skills'], [])

    def test_10_upstream_revision_or_permission_drift_blocked(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'ext:ms-azure',
                origin='EXTERNAL_CATALOG',
                state='DISCOVERED',
                pinned_revision='sha-old',
                observed_revision='sha-new',
                upstream_permission_or_behavior_drift=True,
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('upstream_revision_or_permission_drift:ext:ms-azure', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'REJECT')

    def test_11_pilot_failing_to_demonstrate_meaningful_value_rejected(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'ext:low-value',
                origin='EXTERNAL_CATALOG',
                state='DISCOVERED',
                pilot_status='FAILED_NO_MEANINGFUL_VALUE',
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('pilot_failed_meaningful_value:ext:low-value', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'REJECT')

    def test_12_proposed_adoption_conflicting_with_project_decision_rejected(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'ext:ecc:runtime-pep',
                origin='EXTERNAL_CATALOG',
                state='DISCOVERED',
                conflicting_project_decisions=['DEC-009'],
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertIn('project_decision_conflict:ext:ecc:runtime-pep', res['issues'])
        self.assertEqual(res['decisions'][0]['decision'], 'REJECT')

    def test_13_trivial_task_recommends_no_skill_needed(self):
        snap = base_snapshot()
        snap['task']['complexity'] = 'TRIVIAL'
        snap['task']['required_capabilities'] = []
        snap['candidates'] = [make_candidate('host:user:debugging')]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 0)
        self.assertEqual(res['verdict'], 'NO_SKILL_NEEDED')
        self.assertFalse(res['install_recommended'])
        self.assertEqual(res['selected_skills'], [])

    def test_15_M1_unrelated_unsafe_skill_reported_in_inventory_without_blocking_safe_task(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate('host:user:debugging-and-error-recovery', state='ENABLED'),
            make_candidate(
                'host:codex:unrelated-telemetry',
                origin='USER',
                state='ENABLED',
                capabilities=['llm_telemetry'],
                required_permissions=['read', 'external_publish'],
                unapproved_network_or_data_egress=True,
                conflicting_project_decisions=['SQLCHAT-NO-UNAPPROVED-EGRESS'],
            ),
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 0)
        self.assertEqual(res['verdict'], 'USE_EXISTING_NO_INSTALL')
        self.assertEqual(res['selected_skills'], ['host:user:debugging-and-error-recovery'])
        self.assertEqual(res['issues'], [])
        self.assertIn('unapproved_network_or_data_egress:host:codex:unrelated-telemetry', res['inventory_findings'])
        decisions = {d['skill_id']: d for d in res['decisions']}
        self.assertEqual(decisions['host:codex:unrelated-telemetry']['decision'], 'REJECT')

    def test_16_M1_relevant_unsafe_skill_cannot_be_selected_and_blocks_when_unmet(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate(
                'host:user:unsafe-debugger',
                origin='USER',
                state='ENABLED',
                capabilities=['root_cause_debugging'],
                unapproved_network_or_data_egress=True,
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 2)
        self.assertEqual(res['verdict'], 'GAPS_OR_CONFLICTS_FOUND')
        self.assertEqual(res['selected_skills'], [])
        self.assertIn('unapproved_network_or_data_egress:host:user:unsafe-debugger', res['issues'])
        self.assertIn('required_capability_unmet:root_cause_debugging', res['issues'])

    def test_17_M2_inactive_installed_unsafe_skill_rejected_for_safety_without_claiming_execution(self):
        snap = base_snapshot()
        snap['candidates'] = [
            make_candidate('host:user:debugging-and-error-recovery', state='ENABLED'),
            make_candidate(
                'project:demo:graph-bundle',
                origin='PROJECT',
                artifact_kind='HOOK_OR_PLUGIN_BUNDLE',
                state='INSTALLED',
                session_visibility='UNANNOUNCED',
                capabilities=['codebase_knowledge_graph'],
                auto_hooks=True,
                unreviewed_install_scripts=True,
                unapproved_network_or_data_egress=True,
            ),
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 0)
        decisions = {d['skill_id']: d for d in res['decisions']}
        d = decisions['project:demo:graph-bundle']
        self.assertEqual(d['decision'], 'REJECT')
        self.assertIn('inactive_skill_not_executed', d['reason'])
        self.assertIn('unsafe_hooks_or_install_scripts:project:demo:graph-bundle', res['inventory_findings'])
        self.assertIn('unapproved_network_or_data_egress:project:demo:graph-bundle', res['inventory_findings'])
        self.assertFalse(res['execution_performed'])

    def test_18_M3_explicit_constraints_preserved_on_use_existing_and_adapted_selections(self):
        snap = base_snapshot()
        snap['task']['required_capabilities'] = ['self_code_review']
        snap['candidates'] = [
            make_candidate(
                'host:user:code-review-and-quality',
                origin='USER',
                state='ENABLED',
                session_visibility='ANNOUNCED',
                capabilities=['self_code_review'],
                required_permissions=['read'],
                adaptable_with_constraints=True,
                proposed_constraints=['Label output SELF_REVIEW only; never substitute for V3 review (DEC-001).'],
            )
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 0)
        self.assertEqual(res['decisions'][0]['decision'], 'USE_EXISTING')
        self.assertEqual(
            res['decisions'][0]['constraints'],
            ['Label output SELF_REVIEW only; never substitute for V3 review (DEC-001).'],
        )
        self.assertIn('explicit_constraints_preserved:host:user:code-review-and-quality', res['warnings'])

    def test_19_M4_safe_partial_adaptation_requires_separable_slice_constraints_and_evidence(self):
        snap = base_snapshot()
        snap['task']['required_capabilities'] = ['incremental_implementation']
        snap['candidates'] = [
            make_candidate(
                'project:demo:additive-batch',
                origin='PROJECT',
                state='ENABLED',
                capabilities=['incremental_implementation'],
                required_permissions=['read', 'edit', 'test', 'push', 'merge'],
                requires_unauthorized_git_or_deploy=True,
                adaptable_with_constraints=True,
                separable_adaptable_slice=True,
                proposed_constraints=['Execute local Steps 1-4 only; Steps 5-7 push/merge require separate owner grant.'],
                evidence_refs=['SKILL.md#L39-L102'],
            )
        ]
        res_ok = assess_skills(snap)
        self.assertEqual(res_ok['exit_code'], 0)
        self.assertEqual(res_ok['decisions'][0]['decision'], 'ADAPT_WITH_CONSTRAINTS')
        self.assertTrue(res_ok['decisions'][0]['constraints'])

        # Without separable_adaptable_slice or without evidence_refs, partial adaptation must be rejected.
        not_separable = copy.deepcopy(snap)
        not_separable['candidates'][0]['separable_adaptable_slice'] = False
        res_bad = assess_skills(not_separable)
        self.assertEqual(res_bad['exit_code'], 2)
        self.assertEqual(res_bad['decisions'][0]['decision'], 'REJECT')

        # Inseparable hard conflict (e.g. unreviewed install script) cannot be bypassed by adaptation flags.
        hard_mixed = copy.deepcopy(snap)
        hard_mixed['candidates'][0]['unreviewed_install_scripts'] = True
        res_hard = assess_skills(hard_mixed)
        self.assertEqual(res_hard['exit_code'], 2)
        self.assertEqual(res_hard['decisions'][0]['decision'], 'REJECT')

    def test_20_M5_unobservable_session_visibility_and_cross_root_same_name_collision(self):
        snap = base_snapshot()
        snap['task']['required_capabilities'] = ['root_cause_debugging']
        snap['candidates'] = [
            make_candidate(
                'host:user:custom-tool-a',
                name='shared-helper',
                origin='USER',
                discovery_root='.agents/skills',
                state='NOT_OBSERVABLE',
                session_visibility='NOT_OBSERVABLE',
                capabilities=['root_cause_debugging'],
                pinned_revision='rev-a',
                observed_revision='rev-a',
            ),
            make_candidate(
                'host:codex:custom-tool-b',
                name='shared-helper',
                origin='USER',
                discovery_root='.codex/skills',
                state='INSTALLED',
                session_visibility='UNKNOWN',
                capabilities=['extra_audit'],
                pinned_revision='rev-b',
                observed_revision='rev-b',
            ),
        ]
        res = assess_skills(snap)
        self.assertEqual(res['exit_code'], 3)
        self.assertEqual(res['verdict'], 'INCONCLUSIVE')
        self.assertEqual(res['selected_skills'], [])
        self.assertIn('session_visibility_not_observable:host:user:custom-tool-a', res['unknowns'])
        self.assertIn('cross_root_same_name_collision:shared-helper', res['inventory_findings'])
        self.assertIn('cross_root_revision_divergence:shared-helper', res['inventory_findings'])
        decisions = {d['skill_id']: d for d in res['decisions']}
        self.assertEqual(decisions['host:user:custom-tool-a']['decision'], 'DEFER')
        self.assertEqual(decisions['host:user:custom-tool-a']['reason'], 'session_visibility_not_observable')


class GesiStructuralAndCLITests(unittest.TestCase):
    def test_14_cli_skills_check_and_structural_doc_and_skill_links(self):
        doc = (ROOT / 'docs/17_GOVERNED_ENGINEERING_SKILLS.md').read_text(encoding='utf-8')
        for token in (
            'DISCOVERED', 'INSTALLED', 'ENABLED', 'LOADED', 'USED', 'VERIFIED',
            'USE_EXISTING', 'ADOPT_EXTERNAL', 'ADAPT_WITH_CONSTRAINTS', 'PILOT_FIRST', 'REJECT', 'DEFER',
            'addyosmani/agent-skills', 'obra/superpowers', 'trailofbits/skills', 'affaan-m/ECC', 'microsoft/skills',
            'Project Skills Assessment (GESI)',
        ):
            self.assertIn(token, doc)
        skill_dirs = sorted(p.name for p in (ROOT / 'skills').iterdir() if p.is_dir())
        self.assertEqual(skill_dirs, ['adeq-quality'])

        snap = base_snapshot()
        snap['candidates'] = [make_candidate('host:user:debugging-and-error-recovery')]
        with tempfile.TemporaryDirectory(prefix='agdl_gesi_') as tmp:
            p = Path(tmp) / 'gesi.json'
            p.write_text(json.dumps(snap), encoding='utf-8')
            res = subprocess.run(
                [sys.executable, '-B', '-m', 'agdl', 'skills-check', '--snapshot', str(p)],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=15,
                env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
            )
            self.assertEqual(res.returncode, 0, res.stderr)
            out = json.loads(res.stdout)
            self.assertEqual(out['verdict'], 'USE_EXISTING_NO_INSTALL')
            self.assertFalse(out['execution_performed'])
            self.assertFalse(out['installation_performed'])
            self.assertFalse(out['authorization_authenticated'])
            self.assertFalse(out['runtime_enforcement_verified'])


if __name__ == '__main__':
    unittest.main()
