"""Host metadata and project/phase choices; no native host invocation."""
import unittest

from runtime.common import ROOT, GovernanceError, load
from runtime.skill_catalog import build_catalog
from runtime.skills import check_skill_prerequisites, discover_skills, execute_skill_lifecycle, load_skill_details, select_minimal_effective_set
from tests.skill_fixtures import host_inventory, host_skill


class SkillSelectionTests(unittest.TestCase):
    def setUp(self):
        self.registry = load(ROOT / "optional_skills/REGISTER.json")
        self.context = {"available_tools": ["read_file"], "grant": {"permissions": ["READ_ONLY"]}}

    def catalog(self, *skills):
        return build_catalog(self.registry, host_inventory(*skills))

    def test_arabic_english_and_diacritics_route_without_subword_false_positives(self):
        for text in ("افحص أمن الأدوات وحماية الأسرار", "أَمْنُ الأَدَوَات", "Assess tool security"):
            with self.subTest(text=text):
                rows = discover_skills({"description": text})
                self.assertEqual(rows[0]["id"], "agent-tool-security")
        self.assertEqual(discover_skills({"description": "insecurity tooling unnamed"}), [])

    def test_source_categories_and_same_name_identities_remain_distinct(self):
        skills = [host_skill(f"fixture:{kind.lower()}:same", source=kind) for kind in ("SYSTEM", "USER", "PROJECT", "PLUGIN", "CATALOG")]
        catalog = self.catalog(*skills)
        self.assertEqual(len(catalog["skills"]), 16)
        self.assertEqual(len({s["id"] for s in catalog["skills"]}), 16)
        self.assertEqual(catalog["inventory_completeness"], "PARTIAL")
        external = skills[-1]
        self.assertEqual(check_skill_prerequisites(external["id"], self.context, catalog)["status"], "NOT_AVAILABLE_IN_SESSION")
        external["presence"] = "PRESENT"
        with self.assertRaises(GovernanceError):
            self.catalog(external)

    def test_incomplete_or_duplicate_host_metadata_is_not_silently_repaired(self):
        for mutate in (lambda s: s.pop("session_availability"), lambda s: s.update(id="agent-tool-security")):
            skill = host_skill()
            mutate(skill)
            with self.assertRaises(GovernanceError):
                self.catalog(skill)
        with self.assertRaises(GovernanceError):
            self.catalog(host_skill(), host_skill())

    def test_installed_but_unavailable_skill_is_blocked(self):
        skill = host_skill(available="NOT_AVAILABLE")
        check = check_skill_prerequisites(skill["id"], self.context, self.catalog(skill))
        self.assertEqual(check["status"], "NOT_AVAILABLE_IN_SESSION")
        result = execute_skill_lifecycle({"required_skills": [skill["id"]]}, self.context | {"host_inventory": host_inventory(skill)})
        self.assertEqual(result["lifecycle_status"], "BLOCKED")

    def test_project_phase_preference_selects_one_of_overlapping_alternatives(self):
        first, second = host_skill("fixture:user:first"), host_skill("fixture:plugin:second", source="PLUGIN")
        context = self.context | {"project_selection": {"preferred_by_phase": {"review": [second["id"]]}}}
        selected = select_minimal_effective_set({"phase": "review", "required_capabilities": ["tool_security"]},
                                                [first["id"], second["id"]], context, self.catalog(first, second))
        self.assertEqual(selected["selected_skills"], [second["id"]])
        context["project_selection"]["excluded_skills"] = [second["id"]]
        selected = select_minimal_effective_set({"phase": "review"}, [first["id"], second["id"]], context, self.catalog(first, second))
        self.assertEqual(selected["selected_skills"], [first["id"]])

    def test_three_distinct_phase_needs_are_not_truncated_to_two_skills(self):
        skills = [host_skill(f"fixture:user:{n}", capability=f"cap-{n}") for n in range(3)]
        ids = [s["id"] for s in skills]
        task = {"required_capabilities": [f"cap-{n}" for n in range(3)]}
        result = select_minimal_effective_set(task, ids, self.context, self.catalog(*skills))
        self.assertEqual(result["selected_skills"], ids)
        task["max_skills"] = 2
        self.assertEqual(select_minimal_effective_set(task, ids, self.context, self.catalog(*skills))["status"], "BLOCKED")

    def test_combined_skill_removes_a_redundant_earlier_preference(self):
        first = host_skill("fixture:user:one", capability="one")
        combined = host_skill("fixture:user:combined", capability="one")
        combined["capabilities"].append("two")
        context = self.context | {"project_selection": {"preferred_by_phase": {"review": [first["id"]]}}}
        result = select_minimal_effective_set({"phase": "review", "required_capabilities": ["one", "two"]},
                                             [first["id"], combined["id"]], context, self.catalog(first, combined))
        self.assertEqual(result["selected_skills"], [combined["id"]])

    def test_uncovered_need_remains_blocked_even_for_plain_execution_request(self):
        result = execute_skill_lifecycle({"description": "unrelated", "required_capabilities": ["absent"], "force_plain_execution": True}, self.context)
        self.assertEqual(result["lifecycle_status"], "BLOCKED")
        self.assertIn("absent", result["unmet_capabilities"] if "unmet_capabilities" in result else result["rationale"])

    def test_conflicting_required_skills_block_but_unused_alternatives_do_not(self):
        first, second = host_skill("fixture:user:first"), host_skill("fixture:user:second")
        first["conflicts_with"] = [second["id"]]
        registry = self.catalog(first, second)
        result = select_minimal_effective_set({}, [first["id"], second["id"]], self.context, registry)
        self.assertEqual(result["selected_skills"], [first["id"]])
        result = select_minimal_effective_set({"required_skills": [first["id"], second["id"]]}, [], self.context, registry)
        self.assertEqual(result["status"], "BLOCKED")

    def test_host_loader_returns_handoff_without_reading_host_paths(self):
        skill = host_skill()
        skill["path"] = "Z:/nonexistent-host-private-location/SKILL.md"
        result = load_skill_details(skill["id"], registry=self.catalog(skill))
        self.assertEqual(result["status"], "HOST_LOAD_REQUIRED")
        self.assertFalse(result["loaded_on_demand"])
        self.assertNotIn("sections", result)

    def test_qualification_is_scoped_and_does_not_follow_presence(self):
        skill = host_skill()
        context = self.context | {"project_selection": {"require_qualified_skills": True}}
        self.assertEqual(check_skill_prerequisites(skill["id"], context, self.catalog(skill))["status"], "HOST_QUALIFICATION_REQUIRED")
        skill["host_qualification"] = "TESTED"
        with self.assertRaises(GovernanceError):
            self.catalog(skill)
        skill["qualification"] = {"host_id": "SCRIPTED_HOST", "host_version": "different", "skill_version": "fixture-v1", "scope": "fixture", "evidence_ref": "urn:synthetic:test"}
        with self.assertRaises(GovernanceError):
            self.catalog(skill)

    def test_instruction_budget_blocks_without_emitting_large_instruction_text(self):
        context = self.context | {"project_selection": {"instruction_budget_tokens": 1}}
        result = execute_skill_lifecycle({"description": "tool security"}, context)
        self.assertEqual(result["lifecycle_status"], "BLOCKED")
        self.assertEqual(result["instruction_slices"], [])
        self.assertFalse(result["verified"])

    def test_explicit_empty_catalog_is_not_replaced_by_package_defaults(self):
        self.assertEqual(discover_skills({"description": "tool security"}, registry={"skills": []}), [])
        self.assertEqual(check_skill_prerequisites("agent-tool-security", self.context, registry={"skills": []})["status"], "NOT_FOUND")
