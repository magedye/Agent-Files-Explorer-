"""Eight representative CLI/project scenarios using local scripted fixtures.

Real CLI subprocesses and file artifacts, not native Codex/Antigravity runs.
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from runtime.common import ROOT, load, sha
from tests.skill_fixtures import host_inventory, host_skill, recorded_result


class SkillScenarioTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.project = Path(temp.name)
        (self.project / "AGENTS.md").write_text("Fixture owner policy; preserve bytes.\n", encoding="utf-8")
        self.policy_hash = sha(self.project / "AGENTS.md")
        self.context = {"available_tools": ["read_file", "write_file", "run_test"],
                        "grant": {"permissions": ["READ_ONLY", "WORKSPACE_WRITE", "EXECUTE_TEST"]}}

    def write(self, name, value):
        path = self.project / name
        path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return path

    def cli(self, *args, expected=0):
        proc = subprocess.run([sys.executable, "-X", "utf8", "-B", str(ROOT / "runtime/cli.py"), *map(str, args)],
                              cwd=ROOT, capture_output=True, encoding="utf-8")
        self.assertEqual(proc.returncode, expected, proc.stdout + proc.stderr)
        return json.loads(proc.stdout)

    def prepare(self, task, *, context=None, inventory=None, selection=None, expected=0):
        args = ["skills", "--action", "lifecycle", "--task-record", self.write("task.json", task),
                "--context", self.write("context.json", self.context if context is None else context)]
        if inventory is not None:
            args += ["--host-inventory", self.write("host.json", inventory)]
        if selection is not None:
            args += ["--selection", self.write("selection.json", selection)]
        return self.cli(*args, expected=expected)

    def verify(self, result, criteria, context, *, expected=0):
        return self.cli("skills", "--action", "verify", "--skill-id", result["skill_id"],
                        "--result", self.write("verification-input.json", result),
                        "--criteria", self.write("criteria.json", criteria),
                        "--context", self.write("expected-context.json", {k: v for k, v in context.items() if k not in ("root", "evidence_root")}),
                        "--evidence-root", self.project, expected=expected)

    def test_01_feature_moves_through_planning_implementation_and_verification(self):
        stages = [("planning", "requirements", "requirements-traceability"),
                  ("implementation", "implementation", "incremental-change"),
                  ("verification", "verification", "risk-based-verification")]
        for phase, capability, sid in stages:
            result = self.prepare({"description": "تطوير ميزة صغيرة", "phase": phase, "required_capabilities": [capability]})
            self.assertEqual(result["selected_skills"], [sid])
            self.assertFalse(result["verified"])
        feature = self.project / "feature.py"
        feature.write_text("def total(a, b):\n    return a + b\n", encoding="utf-8")
        run = subprocess.run([sys.executable, "-X", "utf8", "-B", "-c", "from feature import total; assert total(2, 3) == 5; print('completed: total(2, 3) = 5')"],
                             cwd=self.project, capture_output=True, encoding="utf-8")
        self.assertEqual(run.returncode, 0, run.stderr)
        result, criteria, context = recorded_result(self.project, "risk-based-verification", candidate_sha256=sha(feature),
                                                     outputs={"risk_test_matrix": run.stdout.strip(), "gate_verdict": "completed: local addition case passed"})
        self.assertTrue(self.verify(result, criteria, context)["verified"])

    def test_02_simple_edit_needs_no_skill_and_has_no_execution_claim(self):
        result = self.prepare({"description": "تصحيح خطأ مطبعي", "complexity": "TRIVIAL"})
        self.assertEqual(result["lifecycle_status"], "NO_SKILL_NEEDED")
        self.assertEqual(result["instruction_slices"], [])
        self.assertEqual(result["execution_state"], "NOT_RUN")

    def test_03_overlapping_skills_use_project_preference_and_host_handoff(self):
        first, second = host_skill("fixture:user:first"), host_skill("fixture:plugin:second", source="PLUGIN")
        result = self.prepare({"phase": "review", "required_capabilities": ["tool_security"]}, inventory=host_inventory(first, second),
                              selection={"preferred_by_phase": {"review": [second["id"]]}})
        self.assertEqual(result["selected_skills"], [second["id"]])
        self.assertEqual(result["lifecycle_status"], "HOST_HANDOFF")
        self.assertEqual(result["instruction_slices"], [])
        self.assertEqual(result["host_activation"], "NOT_OBSERVABLE")

    def test_04_installed_skill_not_available_in_session_remains_blocked(self):
        skill = host_skill(available="NOT_AVAILABLE")
        result = self.prepare({"required_skills": [skill["id"]]}, inventory=host_inventory(skill), expected=1)
        self.assertEqual(result["blocked_skills"][skill["id"]]["status"], "NOT_AVAILABLE_IN_SESSION")
        self.assertEqual(result["instruction_slices"], [])

    def test_05_write_skill_cannot_convert_readonly_grant_into_direct_execution(self):
        context = self.context | {"grant": {"permissions": ["READ_ONLY"]}}
        result = self.prepare({"description": "تنفيذ تدريجي", "required_skills": ["incremental-change"]}, context=context, expected=1)
        self.assertEqual(result["lifecycle_status"], "BLOCKED")
        self.assertEqual(result["blocked_skills"]["incremental-change"]["status"], "AUTHORIZATION_CEILING_EXCEEDED")
        self.assertEqual(sha(self.project / "AGENTS.md"), self.policy_hash)

    def test_06_successful_load_does_not_hide_actual_scripted_execution_failure(self):
        prepared = self.prepare({"description": "أمن الأدوات"})
        self.assertEqual(prepared["lifecycle_status"], "LOADED")
        failed = subprocess.run([sys.executable, "-X", "utf8", "-B", "-c", "raise RuntimeError('intentional isolated fixture failure')"],
                                cwd=self.project, capture_output=True, encoding="utf-8")
        self.assertNotEqual(failed.returncode, 0)
        result, criteria, context = recorded_result(self.project, status="ERROR",
                                                     outputs={"security_assessment": failed.stderr, "tool_boundaries_report": "Fixture failure; no native skill executed"})
        verdict = self.verify(result, criteria, context, expected=1)
        self.assertFalse(verdict["verified"])
        self.assertEqual(verdict["host_qualification"], "NOT_RUN")

    def test_07_arabic_request_routes_without_english_intent_tokens(self):
        result = self.prepare({"description": "أراجع أَمْن الأدوات وحماية الأسرار", "phase": "review"})
        self.assertEqual(result["selected_skills"], ["agent-tool-security"])
        self.assertFalse(result["verified"])

    def test_08_failed_skill_evaluation_can_be_reviewed_as_lesson_without_promotion(self):
        result, criteria, context = recorded_result(self.project, status="ERROR")
        verdict = self.verify(result, criteria, context, expected=1)
        self.assertEqual(verdict["verdict"], "FAIL")
        (self.project / ".aghr").mkdir()
        self.write(".aghr/project.json", {"canonical_backend": "LOCAL_JSON"})
        lesson = load(ROOT / "templates/LESSON.json")
        lesson.update(lesson_id="LES-SKILL-FIXTURE-001", title="Synthetic skill failure observation")
        receipt = result["execution_record"]
        lesson["source"].update(locator=receipt["path"], sha256=receipt["sha256"])
        lesson["problem"] = "A scripted local skill-result evaluation reported ERROR; no general cause inferred."
        lesson["applicability"].update(candidate_id=context["candidate_sha256"], context="LOCAL_SCRIPTED_FIXTURE")
        lesson["evidence"] = [{"path": receipt["path"], "sha256": receipt["sha256"], "candidate_id": context["candidate_sha256"], "result": "FAIL"}]
        reviewed = self.cli("lesson", "--project", self.project, "--record", self.write("lesson.json", lesson),
                            "--candidate-id", context["candidate_sha256"], "--action", "review")
        self.assertEqual(reviewed["promotion_checks"], "BLOCKED")
        self.assertEqual(lesson["knowledge_state"], "CANDIDATE")
        self.assertEqual(lesson["execution_state"], "NOT_APPLIED")
        self.assertEqual(sha(self.project / "AGENTS.md"), self.policy_hash)
        self.assertFalse((self.project / ".aghr/intake/lessons").exists())
