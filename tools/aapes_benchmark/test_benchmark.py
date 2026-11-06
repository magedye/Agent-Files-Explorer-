import unittest
from pathlib import Path
import json
import sys

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

    def test_non_existent_file_raises(self):
        with self.assertRaises(FileNotFoundError):
            assess_policies.evaluate_policy_pack(Path("non_existent_file.json"))


if __name__ == "__main__":
    unittest.main()
