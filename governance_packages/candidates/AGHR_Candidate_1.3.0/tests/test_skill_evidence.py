"""P0 regressions: truthful states, actual criteria and bounded artifact evidence."""
import copy
import tempfile
import unittest
from pathlib import Path

from runtime.common import ROOT, GovernanceError
from runtime.skills import execute_skill_lifecycle, load_skill_details, select_minimal_effective_set, verify_skill_result
from tests.skill_fixtures import recorded_result


class SkillEvidenceTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.project = Path(temp.name)
        self.result, self.criteria, self.context = recorded_result(self.project)

    def check(self, result=None, criteria=None, skill_id="agent-tool-security", **context):
        return verify_skill_result(skill_id, self.result if result is None else result,
                                   self.criteria if criteria is None else criteria, **(self.context | context))

    def test_valid_recorded_artifacts_pass_only_the_declared_local_scope(self):
        verdict = self.check()
        self.assertEqual(verdict["verdict"], "PASS")
        self.assertEqual(verdict["host_qualification"], "NOT_RUN")
        self.assertEqual(verdict["effective_authority"], "NONE_FROM_VALIDATOR")

    def test_unknown_missing_and_failed_execution_states_never_pass(self):
        for status in (None, "UNKNOWN", "LOADED", "ERROR", "FAILED", "NOT_RUN"):
            with self.subTest(status=status):
                result = copy.deepcopy(self.result)
                result["status"] = status
                self.assertFalse(self.check(result)["verified"])

    def test_empty_outputs_and_unknown_skill_never_pass(self):
        for value in (None, "", "  ", {}, []):
            with self.subTest(value=value):
                result = copy.deepcopy(self.result)
                result["outputs"]["security_assessment"] = value
                self.assertEqual(self.check(result)["verdict"], "FAIL")
        self.assertTrue(any("NOT_FOUND" in issue for issue in self.check(skill_id="unknown")["findings"]))

    def test_task_criteria_are_evaluated_instead_of_only_output_names(self):
        criteria = copy.deepcopy(self.criteria)
        criteria[0].update(operator="equals", expected="A different required result")
        verdict = self.check(criteria=criteria)
        self.assertTrue(any("Task criterion not satisfied" in issue for issue in verdict["findings"]))
        self.assertNotIn(criteria[0]["id"], verdict["passed_criteria"])
        for invalid in ([], [{"id": "AC-only"}], self.criteria + [self.criteria[0]]):
            with self.subTest(criteria=invalid):
                self.assertFalse(self.check(criteria=invalid)["verified"])

    def test_missing_stale_changed_and_unrelated_evidence_is_rejected(self):
        for field, value in (("evidence", []), ("execution_record", {}), ("side_effects", None)):
            result = copy.deepcopy(self.result)
            result[field] = value
            self.assertFalse(self.check(result)["verified"])
        self.assertFalse(self.check(candidate_sha256="b" * 64)["verified"])
        self.assertFalse(self.check(environment_id="OTHER_ENV")["verified"])
        (self.project / self.result["execution_record"]["path"]).write_text("changed", encoding="utf-8")
        self.assertFalse(self.check()["verified"])

    def test_contradictory_evidence_and_unknown_effects_do_not_pass(self):
        result = copy.deepcopy(self.result)
        failed = copy.deepcopy(result["evidence"][0])
        failed.update(id="EV-failure", result="FAIL")
        result["evidence"].append(failed)
        self.assertFalse(self.check(result)["verified"])
        result = copy.deepcopy(self.result)
        result["side_effects"] = [{"effect": "write", "authorized": None}]
        self.assertFalse(self.check(result)["verified"])

    def test_loading_is_neither_activation_execution_nor_verification(self):
        result = execute_skill_lifecycle({"description": "tool_security"},
                                         {"available_tools": ["read_file"], "grant": {"permissions": ["READ_ONLY"]}})
        self.assertEqual(result["lifecycle_status"], "LOADED")
        self.assertEqual(result["execution_state"], "NOT_RUN")
        self.assertEqual(result["host_activation"], "NOT_OBSERVABLE")
        self.assertFalse(result["verified"])

    def test_permission_and_dependency_blocks_are_not_direct_execution(self):
        for context, expected in (({"available_tools": ["read_file", "write_file"]}, "AUTHORIZATION_CEILING_EXCEEDED"),
                                  ({"available_tools": ["read_file"]}, "MISSING_DEPENDENCIES")):
            result = select_minimal_effective_set({"description": "incremental refactor"}, ["incremental-change"], context)
            self.assertEqual(result["status"], "BLOCKED")
            self.assertEqual(result["blocked_skills"]["incremental-change"]["status"], expected)

    def test_unmatched_and_trivial_tasks_have_distinct_nonexecuted_states(self):
        context = {}
        for task, expected in (({"description": "unrelated"}, "NO_MATCHING_SKILLS"),
                               ({"description": "typo", "complexity": "TRIVIAL"}, "NO_SKILL_NEEDED")):
            result = execute_skill_lifecycle(task, context)
            self.assertEqual(result["lifecycle_status"], expected)
            self.assertFalse(result["verified"])

    def test_loader_rechecks_hash_before_reading_instructions(self):
        registry = {"skills": [{"id": "bad", "path": "optional_skills/agent-tool-security/SKILL.md", "sha256": "0" * 64}]}
        with self.assertRaises(GovernanceError):
            load_skill_details("bad", registry=registry)
