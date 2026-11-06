"""Offline checks for packaging and the optional text-only linter.

Tests do not exercise an AI model, a PDP/PEP, organizational authority or user approval.
"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import lint_rule  # noqa: E402
import validate_skill  # noqa: E402


class PackageTests(unittest.TestCase):
    def test_valid_skill_bundle(self):
        self.assertEqual(validate_skill.validate(ROOT), [])

    def test_default_draft(self):
        self.assertIn('lifecycle_status: "DRAFT"', (ROOT / "assets/full-rule.yaml").read_text(encoding="utf-8"))

    def test_no_false_approval_in_template(self):
        template = (ROOT / "assets/full-rule.yaml").read_text(encoding="utf-8")
        self.assertIn("authorized_for_activation: false", template)
        self.assertIn("active: false", template)

    def test_source_and_deployment_distinct(self):
        src = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("SOURCE_TEXT != POLICY_AUTHORITY != ENFORCEMENT", src)
        self.assertIn("No silent source mutation", src)

    def test_examples_include_risks(self):
        for name in ("01-output-format.md", "02-production-action.md", "03-conflict.md", "04-financial-action.md"):
            self.assertTrue((ROOT / "examples" / name).is_file())


class LintTests(unittest.TestCase):
    def codes(self, text):
        return {v["code"] for v in lint_rule.inspect(text)["findings"]}

    def test_reports_ambiguous_arabic(self):
        self.assertIn("VAGUE_SECURITY", self.codes("يجب أن يكون النظام آمنًا دائمًا"))

    def test_reports_sens_action_without_approval(self):
        self.assertIn("SENSITIVE_ACTION_AUTHORITY_REVIEW", self.codes("يجب نشر التغييرات"))

    def test_approval_reduces_that_signal(self):
        self.assertNotIn("SENSITIVE_ACTION_AUTHORITY_REVIEW", self.codes("لا يجوز نشر التغييرات دون موافقة مخولة"))

    def test_no_compliance_claim(self):
        result = lint_rule.inspect("يجب نشر الملفات بموافقة المالك عند الطلب")
        self.assertFalse(result["verified"])
        self.assertEqual(result["mode"], "HEURISTIC_ONLY")

    def test_asserted_status_detected(self):
        self.assertIn("ASSERTED_APPROVAL_UNVERIFIED", self.codes("status: APPROVED"))

    def test_empty_input(self):
        self.assertIn("EMPTY_INPUT", self.codes("  "))

    def test_english_vagueness(self):
        self.assertIn("VAGUE_DISCRETION", self.codes("The agent SHOULD log as appropriate."))


if __name__ == "__main__":
    unittest.main()
