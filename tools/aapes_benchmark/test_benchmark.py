import unittest
from pathlib import Path
import json
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
import assess_policies


class BenchmarkTests(unittest.TestCase):
    def test_evaluate_rules_140(self):
        target = Path("governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.4.0/policies/RULES.json")
        res = assess_policies.evaluate_policy_pack(target)
        self.assertEqual(res["total_rules_evaluated"], 24)
        self.assertGreaterEqual(res["readiness_score_pct"], 90.0)
        self.assertEqual(res["readiness_tier"], "R3_PRODUCTION_READINESS_HIGH")
        self.assertEqual(res["mode"], "ADVISORY_DIAGNOSTIC_ORACLE")
        self.assertEqual(res["runtime_enforcement"], "DISABLED")
        self.assertIn("disclaimer", res)

    def test_non_existent_file_raises(self):
        with self.assertRaises(FileNotFoundError):
            assess_policies.evaluate_policy_pack(Path("non_existent_file.json"))

    def test_malformed_json_raises(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            tf.write("{ this is invalid json :::")
            tf_path = Path(tf.name)
        try:
            with self.assertRaises(ValueError):
                assess_policies.evaluate_policy_pack(tf_path)
        finally:
            tf_path.unlink(missing_ok=True)

    def test_non_dict_or_list_root_raises(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            tf.write("12345")
            tf_path = Path(tf.name)
        try:
            with self.assertRaises(ValueError):
                assess_policies.evaluate_policy_pack(tf_path)
        finally:
            tf_path.unlink(missing_ok=True)

    def test_incomplete_rules_degrades_score_and_flags_uncertainties(self):
        incomplete_pack = {
            "rules": [
                {
                    # Missing id, title, obligation, authority, verification, trigger
                    "notes": "totally incomplete rule"
                }
            ]
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            json.dump(incomplete_pack, tf)
            tf_path = Path(tf.name)
        try:
            res = assess_policies.evaluate_policy_pack(tf_path)
            self.assertEqual(res["total_rules_evaluated"], 1)
            self.assertEqual(res["readiness_score_pct"], 0.0)
            self.assertEqual(res["readiness_tier"], "R0_ADVISORY")
            # All criteria should be 0.0%
            for k, val in res["criteria_breakdown"].items():
                self.assertEqual(val, 0.0, f"Criteria {k} should be 0.0")
            # Check uncertainties were generated
            uncertainties_str = " ".join(res["uncertainties_and_gaps"])
            self.assertIn("Missing id and title", uncertainties_str)
            self.assertIn("Missing obligation definition", uncertainties_str)
            self.assertIn("Missing authority grounding", uncertainties_str)
            self.assertIn("Missing trigger or scope definition", uncertainties_str)
            self.assertIn("Missing valid explicit test_refs", uncertainties_str)
        finally:
            tf_path.unlink(missing_ok=True)

    def test_false_positive_text_not_counted_as_test_refs(self):
        rules_with_text_test = {
            "rules": [
                {
                    "id": "RULE-TEST-01",
                    "title": "Rule with test words in prose",
                    "obligation": "Always run test and verify integration in unit test suites",
                    "authority": "DOC-AUTH-1",
                    "scope": "All testing modules",
                    # No test_refs provided, or invalid placeholders
                    "verification": "none"
                },
                {
                    "id": "RULE-TEST-02",
                    "title": "Rule with placeholder verification",
                    "obligation": "Ensure integrity",
                    "authority": "DOC-AUTH-2",
                    "scope": "All modules",
                    "test_refs": ["tbd", "pending", ""]
                }
            ]
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            json.dump(rules_with_text_test, tf)
            tf_path = Path(tf.name)
        try:
            res = assess_policies.evaluate_policy_pack(tf_path)
            self.assertEqual(res["total_rules_evaluated"], 2)
            # Both rules have id, obligation, authority, trigger, but 0 valid verification refs
            self.assertEqual(res["criteria_breakdown"]["verification_traceability_pct"], 0.0)
            self.assertEqual(len(res["evidence_found"]), 0)
            uncertainties_str = " ".join(res["uncertainties_and_gaps"])
            self.assertIn("Missing valid explicit test_refs", uncertainties_str)
        finally:
            tf_path.unlink(missing_ok=True)

    def test_disclaimer_and_oracle_mode_always_present(self):
        empty_pack = {"rules": []}
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            json.dump(empty_pack, tf)
            tf_path = Path(tf.name)
        try:
            res = assess_policies.evaluate_policy_pack(tf_path)
            self.assertEqual(res["mode"], "ADVISORY_DIAGNOSTIC_ORACLE")
            self.assertEqual(res["runtime_enforcement"], "DISABLED")
            self.assertIn("INFORMATIONAL ONLY", res["disclaimer"])
        finally:
            tf_path.unlink(missing_ok=True)

    def test_malformed_rule_entry_handled_gracefully(self):
        mixed_pack = {
            "rules": [
                "a string instead of a dict",
                12345,
                {
                    "id": "VALID-01",
                    "title": "Valid Rule",
                    "obligation": "Must be valid",
                    "authority": "Policy Plane",
                    "scope": "Global",
                    "test_refs": ["test_valid.py"]
                }
            ]
        }
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
            json.dump(mixed_pack, tf)
            tf_path = Path(tf.name)
        try:
            res = assess_policies.evaluate_policy_pack(tf_path)
            self.assertEqual(res["total_rules_evaluated"], 3)
            # Only 1 of 3 is valid
            self.assertAlmostEqual(res["criteria_breakdown"]["identity_and_naming_pct"], 33.3, places=1)
            uncertainties_str = " ".join(res["uncertainties_and_gaps"])
            self.assertIn("Malformed rule entry", uncertainties_str)
        finally:
            tf_path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
