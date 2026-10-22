"""Real E2 subprocess acceptance, never E4 host/skill qualification."""

import base64
import json
import os
from pathlib import Path
import subprocess
import sys

from jsonschema import Draft202012Validator
from e2_support import FixtureCase, ROOT, item


class GoverningCliTests(FixtureCase):
    def invoke(self, root, *args, entrypoint=None):
        env = {key: os.environ[key] for key in ("SYSTEMROOT", "WINDIR", "TEMP", "TMP") if key in os.environ}
        process = subprocess.run([sys.executable, "-I", "-B", "-X", "utf8", str(entrypoint or ROOT / "tools/cli.py"), *args],
                                 cwd=root, env=env, capture_output=True, timeout=90, shell=False)
        self.assertTrue(process.stdout, process.stderr.decode("utf-8", errors="replace"))
        report = json.loads(process.stdout.decode("utf-8"))
        Draft202012Validator(json.loads((ROOT / "CLI_CONTRACT.json").read_text(encoding="utf-8"))).validate(report)
        self.assertEqual(process.returncode, report["exit_code"])
        self.assertEqual(process.stdout.count(b"\n"), 1)
        return process, report

    @staticmethod
    def snapshot(root):
        return {p.relative_to(root).as_posix(): p.read_bytes() if p.is_file() else None for p in root.rglob("*")}

    def test_real_source_validate_and_lint_are_actual_successes(self):
        for args in (("validate", "--strict"), ("lint",)):
            process, report = self.invoke(ROOT, *args)
            self.assertEqual(process.returncode, 0)
            self.assertEqual(report["result"], "VALID")
            self.assertEqual(report["checks"]["status"], "COMPLETE")
            self.assertEqual(report["data"]["validation"]["qualification"], "NOT_RUN")
            self.assertIn("E4 deferred", report["data"]["validation"]["runtime_honesty"])
            self.assertTrue(all(report["inputs"][key] for key in ("candidate_hash", "config_hash", "inputs_hash")))

    def test_both_mandatory_forces_missing_level_return_invalid_one(self):
        for force in ("MUST", "MUST_NOT"):
            value = item(force=force); del value["authority"]["level"]
            root = self.fixture(value); before = self.snapshot(root)
            process, report = self.invoke(root, "validate", "--strict")
            self.assertEqual(process.returncode, 1)
            self.assertEqual(report["result"], "INVALID")
            self.assertTrue(any(d["pointer"] == "/authority/level" for d in report["diagnostics"]))
            self.assertEqual(before, self.snapshot(root))

    def test_no_strict_flag_cannot_weaken_required_authority(self):
        value = item(force="MUST"); del value["authority"]["level"]
        process, _ = self.invoke(self.fixture(value), "validate")
        self.assertEqual(process.returncode, 1)

    def test_enterprise_claim_and_source_map_cannot_self_authenticate(self):
        value = item(force="MUST"); value["authority"]["level"] = "enterprise"
        root = self.fixture(value)
        self.write(root, "SOURCE_MAP.json", {"publisher": "ci", "trusted": True, "authority": {"level": "enterprise", "status": "VERIFIED"}})
        process, report = self.invoke(root, "validate", "--strict")
        self.assertEqual(process.returncode, 3)
        self.assertEqual(report["data"]["validation"]["authority"]["SYNTHETIC"]["status"], "UNKNOWN")
        self.assertIn("AUTHORITY_SOURCE_UNVERIFIED", [d["code"] for d in report["diagnostics"]])

    def test_missing_gate_and_bad_dates_are_invalid_not_blocked_success(self):
        value = item(force="MUST_NOT"); value["severity"] = "critical"
        process, _ = self.invoke(self.fixture(value), "lint")
        self.assertEqual(process.returncode, 1)
        value = item(force="MUST"); value["authority"]["effectiveFrom"] = "2026-02-30"
        process, _ = self.invoke(self.fixture(value), "validate", "--strict")
        self.assertEqual(process.returncode, 1)

    def test_missing_evidence_blocks_even_with_valid_numeric_calibration(self):
        value = item(); value["impact"] = {"evidence": "repo-measured", "lastCalibrated": "2026-10-20", "measuredDelta": 0.9}
        process, report = self.invoke(self.fixture(value), "validate", "--strict")
        self.assertEqual(process.returncode, 3)
        self.assertIn("CALIBRATION_E5_EVIDENCE_UNAVAILABLE", [d["code"] for d in report["diagnostics"]])

    def test_malformed_utf8_remains_raw_error_two(self):
        root = self.fixture(); raw = b'{"id":"BAD","rule":"\xff"}'
        (root / "policies/items.json").write_bytes(raw)
        process, report = self.invoke(root, "validate", "--strict")
        self.assertEqual(process.returncode, 2)
        source = next(s for s in report["data"]["read_error"]["sources"] if s["path"] == "policies/items.json")
        self.assertEqual(base64.b64decode(source["raw_base64"]), raw)

    def test_lint_rejects_documentation_count_mismatch(self):
        from test_evidence import DocumentationTests
        root = DocumentationTests.library(self, count=1)
        process, report = self.invoke(root, "lint")
        self.assertEqual(process.returncode, 1)
        self.assertIn("SKILL_DOCUMENTATION_COUNT_MISMATCH", [d["code"] for d in report["diagnostics"]])

    def test_missing_skill_register_is_error_two(self):
        from test_evidence import DocumentationTests
        root = DocumentationTests.library(self)
        (root / "optional_skills/REGISTER.json").unlink()
        process, report = self.invoke(root, "lint")
        self.assertEqual(process.returncode, 2)
        self.assertEqual(report["result"], "ERROR")

    def test_language_changes_rendering_only(self):
        value = item(); value["scope"] = {"paths": ["src/**"], "language": ["en"]}
        root = self.fixture(value)
        reports = [self.invoke(root, "validate", "--strict", "--path", "src/a.py", "--language", lang)[1] for lang in ("ar", "en")]
        self.assertEqual([r["result"] for r in reports], ["VALID", "VALID"])
        self.assertEqual(reports[0]["inputs"]["candidate_hash"], reports[1]["inputs"]["candidate_hash"])
        self.assertNotEqual(reports[0]["inputs"]["config_hash"], reports[1]["inputs"]["config_hash"])
        self.assertEqual([v["id"] for v in reports[0]["data"]["validation"]["items"]], [v["id"] for v in reports[1]["data"]["validation"]["items"]])
        self.assertTrue(reports[0]["data"]["validation"]["items"][0]["presentation"]["translation_unavailable"])

    def test_context_absence_does_not_implicitly_apply_a_targeted_rule(self):
        value = item(); value["scope"]["appliesToAgents"] = ["codex"]
        process, report = self.invoke(self.fixture(value), "validate", "--path", "src/a.py")
        self.assertEqual(process.returncode, 3)
        self.assertIn("SCOPE_CONTEXT_REQUIRED", [d["code"] for d in report["diagnostics"]])

    def test_invalid_context_and_grant_flags_are_usage_errors(self):
        root = self.fixture()
        for extra in (("--path", "../outside"), ("--as-of", "20260230"), ("--language", "unknown"), ("--trust-context", "fake.json")):
            process, report = self.invoke(root, "validate", *extra)
            self.assertEqual(process.returncode, 2)
            self.assertEqual(report["diagnostics"][0]["code"], "INVALID_ARGUMENTS")

    def test_input_identity_is_stable_and_changes_when_input_changes(self):
        root = self.fixture()
        first = self.invoke(root, "validate", "--as-of", "2026-10-22")[1]
        second = self.invoke(root, "validate", "--as-of", "2026-10-22")[1]
        self.assertEqual(first["inputs"], second["inputs"])
        value = item(); value["rule"] = "Changed synthetic source."
        self.write(root, "policies/items.json", value)
        changed = self.invoke(root, "validate", "--as-of", "2026-10-22")[1]
        self.assertNotEqual(first["inputs"]["candidate_hash"], changed["inputs"]["candidate_hash"])
        self.assertEqual(first["source"], changed["source"])

    def test_foreign_code_and_command_text_are_never_executed(self):
        value = item(); value["verification"] = {"commands": ["cmd /c echo this-must-never-execute > MUTATED"]}
        root = self.fixture(value)
        for name in ("validate.py", "lint.py", "loader.py", "sitecustomize.py"):
            (root / name).write_text("raise RuntimeError('foreign input imported')", encoding="utf-8")
        before = self.snapshot(root)
        process, _ = self.invoke(root, "validate", "--strict")
        self.assertEqual(process.returncode, 0)
        self.assertEqual(before, self.snapshot(root))

    def test_api_cli_audit_blocks_writes_processes_and_network(self):
        root = self.fixture()
        (root / ".aghr/runtime_evidence").mkdir(parents=True)
        (root / ".aghr/state.json").write_text('{"sentinel":true}', encoding="utf-8")
        (root / ".aghr/runtime_evidence/task.jsonl").write_text('{"sentinel":true}\n', encoding="utf-8")
        guard = root / "audit_guard.py"
        guard.write_text("\n".join([
            "import os, sys", "sys.path.insert(0, " + repr(str(ROOT / "tools")) + ")", "import cli",
            "def audit(event, args):", "    if event == 'open':", "        mode = args[1] or ''", "        flags = args[2] if isinstance(args[2], int) else 0",
            "        if any(x in mode for x in 'wa+x') or flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND):", "            raise AssertionError('filesystem write attempted')",
            "    if event in ('os.mkdir','os.remove','os.rmdir','os.rename','os.truncate','os.chmod','os.utime','os.link','os.symlink','subprocess.Popen') or event.startswith('socket.'):",
            "        raise AssertionError('mutation/process/network attempted')", "sys.addaudithook(audit)", "raise SystemExit(cli.main(sys.argv[1:]))",
        ]), encoding="utf-8")
        before = self.snapshot(root)
        for args in (("validate", "--strict"), ("lint",)):
            process, _ = self.invoke(root, *args, entrypoint=guard)
            self.assertEqual(process.returncode, 0)
        self.assertEqual(before, self.snapshot(root))
