"""Comprehensive tests for Skill-Aware Execution & Reuse (runtime/skills.py).

Verifies:
1. Matching skill discovery & progressive on-demand loading
2. Non-mandatory graceful direct execution when no skill adds value
3. Skill conflict detection & isolation
4. Missing dependency rejection
5. Skill execution failure handling & reporting
6. Authorization ceiling enforcement preventing privilege escalation
"""
import unittest
import tempfile
from pathlib import Path
from tests.skill_fixtures import recorded_result

from runtime.skills import (
    discover_skills,
    check_skill_prerequisites,
    select_minimal_effective_set,
    load_skill_details,
    verify_skill_result,
    execute_skill_lifecycle
)

ROOT = Path(__file__).resolve().parents[1]


class SkillAwareExecutionTests(unittest.TestCase):

    def test_matching_skill_discovery_and_progressive_loading(self):
        """Scenario 1: Suitable skill exists -> Discovered, selected, loaded on-demand, verified."""
        task = {
            "description": "Assess tool security and credential exposure for newly added MCP server",
            "intent": ["tool_security", "permission_audit"],
            "domain": "security"
        }
        context = {
            "available_tools": ["read_file"],
            "grant": {"permissions": ["READ_ONLY"]},
            "active_skills": []
        }
        
        # 1. Discovery
        candidates = discover_skills(task, root=ROOT)
        self.assertTrue(len(candidates) > 0)
        self.assertEqual(candidates[0]["id"], "agent-tool-security")
        
        # 2. Prerequisite Check
        check = check_skill_prerequisites("agent-tool-security", context, root=ROOT)
        self.assertTrue(check["eligible"])
        self.assertEqual(check["status"], "ELIGIBLE")
        
        # 3. Minimal Effective Set Selection
        selection = select_minimal_effective_set(task, [c["id"] for c in candidates], context, root=ROOT)
        self.assertEqual(selection["status"], "SELECTED")
        self.assertEqual(selection["selected_skills"], ["agent-tool-security"])
        
        # 4. Progressive On-Demand Loading
        details = load_skill_details("agent-tool-security", root=ROOT)
        self.assertEqual(details["id"], "agent-tool-security")
        self.assertTrue(details["loaded_on_demand"])
        self.assertIn("name", details["frontmatter"])
        self.assertEqual(details["frontmatter"]["name"], "agent-tool-security")
        self.assertTrue(details["token_est"] > 0)
        self.assertTrue(details["token_est"] < 1500)
        
        # 5. Outcome Verification
        with tempfile.TemporaryDirectory() as folder:
            execution_result, criteria, evidence_context = recorded_result(Path(folder))
            verdict = verify_skill_result("agent-tool-security", execution_result, criteria, **evidence_context)
        self.assertTrue(verdict["verified"])
        self.assertEqual(verdict["verdict"], "PASS")

    def test_no_skill_adds_value_graceful_direct_execution(self):
        """Scenario 2: No skill needed or adds value -> Graceful direct execution (non-mandatory)."""
        # Case A: Routine trivial task
        task_trivial = {
            "description": "Fix typo in line 12 of README.md",
            "complexity": "TRIVIAL"
        }
        selection = select_minimal_effective_set(task_trivial, ["incremental-change"], context={}, root=ROOT)
        self.assertEqual(selection["status"], "NO_SKILL_NEEDED")
        self.assertEqual(selection["selected_skills"], [])
        
        # Case B: Plain execution requested
        task_plain = {
            "description": "Examine tool security",
            "force_plain_execution": True
        }
        candidates = discover_skills(task_plain, root=ROOT)
        self.assertEqual(candidates, [])
        
        # Case C: Unrelated task with no trigger matches
        task_unrelated = {
            "description": "Compile C++ kernel driver module with clang",
            "intent": ["compile_c_driver"],
            "domain": "embedded_systems"
        }
        candidates_unrelated = discover_skills(task_unrelated, root=ROOT)
        self.assertEqual(candidates_unrelated, [])
        
        # End-to-end lifecycle verification
        lifecycle = execute_skill_lifecycle(task_trivial, context={}, root=ROOT)
        self.assertEqual(lifecycle["lifecycle_status"], "NO_SKILL_NEEDED")
        self.assertEqual(lifecycle["selected_skills"], [])
        self.assertEqual(lifecycle["instruction_slices"], [])

    def test_skill_conflict_detection(self):
        """Scenario 3: Mutual conflict between candidate skills -> Detected and prevented."""
        # Simulated registry with a declared conflict
        mock_registry = {
            "skills": [
                {
                    "id": "skill-alpha",
                    "path": "optional_skills/agent-tool-security/SKILL.md",
                    "sha256": "00fb742a08b84a0f260e94533145ca198d3b09b89d141a356d7e82f2c690d77b",
                    "conflicts_with": ["skill-beta"],
                    "required_tools": ["read_file"],
                    "permissions": ["READ_ONLY"]
                },
                {
                    "id": "skill-beta",
                    "path": "optional_skills/architecture-options/SKILL.md",
                    "sha256": "579f4573936ffa650aa4457a06670a00b4b2101adf6e45fe7a6ed2425c5d6704",
                    "conflicts_with": ["skill-alpha"],
                    "required_tools": ["read_file"],
                    "permissions": ["READ_ONLY"]
                }
            ]
        }
        task = {"description": "Complex transformation requiring conflicting approaches", "required_skills": ["skill-alpha", "skill-beta"]}
        
        # Both candidate skills proposed
        selection = select_minimal_effective_set(
            task,
            ["skill-alpha", "skill-beta"],
            context={"available_tools": ["read_file"], "grant": {"permissions": ["READ_ONLY"]}},
            registry=mock_registry,
            root=ROOT
        )
        self.assertEqual(selection["status"], "BLOCKED")
        self.assertEqual(selection["selected_skills"], [])
        self.assertIn("mutually incompatible", selection["rationale"])

        # Also test conflict with currently active skill in context
        context_with_active = {
            "available_tools": ["read_file"],
            "grant": {"permissions": ["READ_ONLY"]},
            "active_skills": ["skill-beta"]
        }
        check = check_skill_prerequisites("skill-alpha", context_with_active, registry=mock_registry, root=ROOT)
        self.assertFalse(check["eligible"])
        self.assertEqual(check["status"], "SKILL_CONFLICT")

    def test_missing_dependencies_rejected(self):
        """Scenario 4: Missing host tools or dependencies -> Skill rejected from loading."""
        task = {
            "description": "Perform risk-based testing on safety gate",
            "intent": "risk_testing"
        }
        # risk-based-verification requires both 'read_file' and 'run_test'
        # Context provides ONLY 'read_file'
        context_missing_tools = {
            "available_tools": ["read_file"],  # Missing 'run_test'
            "grant": {"permissions": ["EXECUTE_TEST"]},
            "active_skills": []
        }
        
        check = check_skill_prerequisites("risk-based-verification", context_missing_tools, root=ROOT)
        self.assertFalse(check["eligible"])
        self.assertEqual(check["status"], "MISSING_DEPENDENCIES")
        self.assertIn("run_test", check["missing_dependencies"])
        
        # Missing dependencies remain a block; they do not authorize direct execution.
        selection = select_minimal_effective_set(
            task,
            ["risk-based-verification"],
            context=context_missing_tools,
            root=ROOT
        )
        self.assertEqual(selection["status"], "BLOCKED")
        self.assertEqual(selection["selected_skills"], [])

    def test_skill_execution_failure_handling(self):
        """Scenario 5: Skill execution failure or invalid output -> Handled gracefully without crash."""
        # Case A: Explicit error reported by tool
        failed_execution = {
            "status": "ERROR",
            "outputs": {},
            "side_effects": []
        }
        res_a = verify_skill_result("agent-tool-security", failed_execution, root=ROOT)
        self.assertFalse(res_a["verified"])
        self.assertEqual(res_a["verdict"], "FAIL")
        self.assertTrue(len(res_a["findings"]) > 0)
        
        # Case B: Missing expected deliverables
        incomplete_execution = {
            "status": "SUCCESS",
            "outputs": {
                # Missing 'tool_boundaries_report' which is expected by agent-tool-security
                "security_assessment": "Completed assessment."
            },
            "side_effects": []
        }
        res_b = verify_skill_result("agent-tool-security", incomplete_execution, root=ROOT)
        self.assertFalse(res_b["verified"])
        self.assertEqual(res_b["verdict"], "FAIL")
        self.assertTrue(any("Missing or empty expected skill deliverable" in f for f in res_b["findings"]))

    def test_authorization_ceiling_prevents_escalation(self):
        """Scenario 6: Skill requiring permissions beyond task grant -> Blocked with AUTHORIZATION_CEILING_EXCEEDED."""
        # incremental-change requires WORKSPACE_WRITE permission
        # Task grant is strictly READ_ONLY
        strict_read_only_context = {
            "available_tools": ["read_file", "write_file"],
            "grant": {"permissions": ["READ_ONLY"]},  # Does NOT grant WORKSPACE_WRITE
            "active_skills": []
        }
        
        check = check_skill_prerequisites("incremental-change", strict_read_only_context, root=ROOT)
        self.assertFalse(check["eligible"])
        self.assertEqual(check["status"], "AUTHORIZATION_CEILING_EXCEEDED")
        self.assertIn("WORKSPACE_WRITE", check["escalated_permissions"])
        
        # Now grant WORKSPACE_WRITE and verify it passes
        authorized_write_context = {
            "available_tools": ["read_file", "write_file"],
            "grant": {"permissions": ["READ_ONLY", "WORKSPACE_WRITE"]},
            "active_skills": []
        }
        check_authorized = check_skill_prerequisites("incremental-change", authorized_write_context, root=ROOT)
        self.assertTrue(check_authorized["eligible"])
        self.assertEqual(check_authorized["status"], "ELIGIBLE")


if __name__ == "__main__":
    unittest.main()
