#!/usr/bin/env python3
"""Unit tests for Behavioral Qualification Benchmark Tooling."""
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from scenarios import SCENARIOS
from evaluator import EVALUATORS, estimate_tokens, EvaluationScore
import run_qualification


class QualificationToolTests(unittest.TestCase):
    def test_scenarios_count_and_domains(self):
        self.assertEqual(len(SCENARIOS), 6)
        domains = {s.domain for s in SCENARIOS}
        expected_domains = {
            "Requirements Analysis",
            "Defect Repair",
            "Feature Implementation",
            "Code Review",
            "Conflict Resolution",
            "Test Verification"
        }
        self.assertEqual(domains, expected_domains)

    def test_evaluator_dispatch(self):
        for s in SCENARIOS:
            self.assertIn(s.id, EVALUATORS)
            # Run evaluator on sample text
            score = EVALUATORS[s.id]("governed", "sample response with null test and get /api/v1/metrics/export")
            self.assertIsInstance(score, EvaluationScore)
            self.assertGreaterEqual(score.total_score, 0.0)
            self.assertLessEqual(score.total_score, 100.0)

    def test_benchmark_execution_and_export(self):
        res = run_qualification.run_benchmark()
        self.assertIn("mode_a_baseline", res)
        self.assertIn("mode_b_governed", res)
        self.assertIn("comparative_analysis", res)
        
        agg_a = res["mode_a_baseline"]["aggregate"]
        agg_b = res["mode_b_governed"]["aggregate"]
        
        # Mode B must strictly score higher on quality than Mode A
        self.assertGreater(agg_b["mean_total_score"], agg_a["mean_total_score"])
        # Mode B must have zero violations
        self.assertEqual(agg_b["total_violations_count"], 0)
        # Mode A must have violations recorded
        self.assertGreater(agg_a["total_violations_count"], 0)
        
        # Verify JSON file was written
        json_file = Path("docs/evidence/behavioral_qual_007/BEHAVIORAL_QUALIFICATION_DATA.json")
        self.assertTrue(json_file.is_file())


if __name__ == "__main__":
    unittest.main()
