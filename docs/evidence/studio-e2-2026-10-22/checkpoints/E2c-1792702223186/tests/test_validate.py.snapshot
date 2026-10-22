"""E2.a acceptance vectors; structural acceptance is not runtime qualification."""

from copy import deepcopy
from dataclasses import replace
from e2_support import FixtureCase, item
from validate import SchemaChecks, check_structure


class StructuralTests(FixtureCase):
    @classmethod
    def setUpClass(cls):
        cls.schemas = SchemaChecks()

    def errors(self, value):
        return check_structure(self.package(value), self.schemas)

    def test_all_force_tiers_have_positive_examples(self):
        for force in ("INFORMATIVE", "MAY", "SHOULD", "SHOULD_NOT", "MUST", "MUST_NOT"):
            with self.subTest(force=force):
                self.assertEqual(self.errors(item(force=force)), [])

    def test_both_mandatory_forces_reject_missing_authority_level(self):
        for force in ("MUST", "MUST_NOT"):
            for severity in ("info", "low", "medium", "high", "critical"):
                with self.subTest(force=force, severity=severity):
                    value = item(force=force); value["severity"] = severity
                    del value["authority"]["level"]
                    self.assertTrue(any(e["pointer"] == "/authority/level" for e in self.errors(value)))

    def test_must_requires_each_authority_field_and_verification(self):
        for field in ("source", "owner", "approvedBy", "status", "effectiveFrom"):
            value = item(force="MUST"); del value["authority"][field]
            self.assertTrue(self.errors(value), field)
        value = item(force="MUST"); del value["verification"]
        self.assertTrue(self.errors(value))

    def test_should_requires_owner_and_rationale(self):
        for force in ("SHOULD", "SHOULD_NOT"):
            for field in ("authority", "rationale"):
                value = item(force=force); del value[field]
                self.assertTrue(self.errors(value))

    def test_critical_and_high_prohibitions_require_real_structure(self):
        for severity in ("critical", "high"):
            value = item(force="MUST_NOT"); value["severity"] = severity
            self.assertTrue(self.errors(value))
            value["verification"] = {"evalFixtures": ["synthetic/not-run"]}
            value["enforcement"] = {"technical": ["synthetic-control"], "mergeEffect": "blocking", "gate": {"type": "synthetic-gate", "required": True}}
            self.assertEqual(self.errors(value), [])
            for field in ("gate", "mergeEffect"):
                broken = deepcopy(value); del broken["enforcement"][field]
                self.assertTrue(self.errors(broken))

    def test_real_dates_and_nonempty_fields_are_enforced(self):
        for stamp in ("2026-02-30", "2026-13-01", "20260101"):
            value = item(force="MUST"); value["authority"]["effectiveFrom"] = stamp
            self.assertTrue(self.errors(value))
        value = item(); value["rule"] = "   "
        self.assertTrue(self.errors(value))

    def test_every_kind_is_representable_in_schema_without_activation(self):
        for row in self.schemas.model["kinds"]:
            value = item(kind=row["name"])
            self.assertEqual(self.errors(value), [], row["name"])

    def test_unknown_fields_kinds_and_weakening_manifest_reject(self):
        for name, value in (("kind", "UNKNOWN"), ("authority", {"level": "administrator"}), ("opaque", True)):
            data = item(); data[name] = value
            self.assertTrue(self.errors(data))
        package = self.package(item()); manifest = deepcopy(package.manifest.value)
        manifest["validation"]["coreKindsOnly"] = False
        self.assertTrue(check_structure(replace(package, manifest=replace(package.manifest, value=manifest)), self.schemas))

    def test_qualification_and_calibration_structural_requirements(self):
        value = item(); value["impact"] = {"evidence": "repo-measured"}
        self.assertTrue(self.errors(value))
        value = item(kind="CAPABILITY"); del value["skillQualification"]["hostVersion"]
        self.assertTrue(self.errors(value))

    def test_missing_scope_is_never_filled_in(self):
        value = item(); del value["scope"]
        package = self.package(value)
        self.assertTrue(check_structure(package, self.schemas))
        self.assertNotIn("scope", package.items[0].value)

    def test_partial_source_selection_cannot_pass_whole_package_validation(self):
        package = self.package(item())
        package = replace(package, selection_mode="EXPLICIT_PATHS", source_paths=("policies/items.json",))
        self.assertTrue(any(e["code"] == "PARTIAL_SOURCE_SELECTION" and e["disposition"] == "BLOCKED" for e in check_structure(package, self.schemas)))
