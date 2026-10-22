"""Read projection tests; no AGHR strict or native-host qualification claims."""

import base64
from copy import deepcopy
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import unquote

from jsonschema import Draft202012Validator, ValidationError

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from catalog import build_catalog, compact_json, load_assets, serialize_catalog
from diagnostics import ReadFailure
from loader import read_package


class FixtureCase(unittest.TestCase):
    def fixture(self, item=None):
        owned = tempfile.TemporaryDirectory(prefix="aghr-e1d-")
        self.addCleanup(owned.cleanup)
        root = Path(owned.name)
        self.assertEqual(root.resolve().parent, Path(tempfile.gettempdir()).resolve())
        (root / "policies").mkdir()
        (root / "aghr.json").write_text('{"schemaVersion":"1.2"}', encoding="utf-8")
        value = {"id": "VECTOR", "kind": "OBSERVATION", "rule": "عربي", "force": "INFORMATIVE"}
        (root / "policies/items.json").write_text(json.dumps(item or value, ensure_ascii=False), encoding="utf-8")
        return root


class CatalogTests(FixtureCase):

    def test_frozen_schemas_fields_and_kinds(self):
        lock, model = load_assets()
        self.assertEqual(len(lock["files"]), 16)
        self.assertEqual(lock["local_reference_count"], 564)
        self.assertEqual(len(model["fields"]), 17)
        self.assertEqual(len(model["kinds"]), 13)
        self.assertEqual(sum(k["group"] == "core" for k in model["kinds"]), 6)
        self.assertEqual(len(model["honesty_checks"]), 7)
        self.assertTrue(all(h["runtime_status"] == "REQUIRED / NOT_RUN / NOT_WAIVED"
                            for h in model["honesty_checks"]))

    def test_absent_null_unknown_and_raw_are_distinct(self):
        value = {"id": "VECTOR", "title": None, "kind": "UNRECOGNIZED",
                 "skillId": "unknown", "opaque": {"$ref": "literal", "path": "C:\\x"}}
        root = self.fixture(value)
        package = read_package(root)
        catalog = build_catalog(package)
        projected = catalog["items"][0]
        self.assertEqual(projected["fields"]["title"], {"presence": "PRESENT", "value": None})
        self.assertEqual(projected["fields"]["authority"], {"presence": "ABSENT"})
        self.assertTrue(projected["other_fields"]["skillId"]["known_to_model"])
        self.assertFalse(projected["other_fields"]["opaque"]["known_to_model"])
        self.assertFalse(projected["kind_in_model"])
        self.assertEqual(projected["value"], value)
        self.assertEqual(catalog["validation_status"], "NOT_RUN")
        for source in catalog["sources"]:
            raw = (root / source["path"]).read_bytes()
            self.assertEqual(base64.b64decode(source["raw_base64"]), raw)
            self.assertEqual(hashlib.sha256(raw).hexdigest(), source["sha256"])
        projected["value"]["opaque"]["$ref"] = "changed"
        self.assertEqual(package.items[0].value, value)

    def test_every_kind_and_main_field_round_trips_without_activation(self):
        _, model = load_assets()
        value = {f["name"]: {"literal": f["name"]} for f in model["fields"]}
        value["id"] = "VECTOR"
        root = self.fixture()
        for kind in model["kinds"]:
            with self.subTest(kind=kind["name"]):
                value["kind"] = kind["name"]
                (root / "policies/items.json").write_text(json.dumps(value), encoding="utf-8")
                result = json.loads(serialize_catalog(build_catalog(read_package(root))))
                self.assertEqual(result["items"][0]["value"], value)
                self.assertEqual(len(result["items"][0]["fields"]), 17)
                self.assertEqual(result["qualification_status"], "NOT_RUN")

    def test_every_closed_reference_resolves_to_a_local_schema(self):
        lock, _ = load_assets()
        schemas = {e["path"]: json.loads((ROOT / "schemas" / e["path"]).read_text(encoding="utf-8"))
                   for e in lock["files"]}
        count = 0
        for entry in lock["files"]:
            for reference in entry["references"]:
                value = schemas[reference["target_path"]]
                fragment = unquote(reference["fragment"])
                for part in fragment.split("/")[1:]:
                    key = part.replace("~1", "/").replace("~0", "~")
                    value = value[int(key)] if isinstance(value, list) else value[key]
                self.assertIsInstance(value, (dict, bool))
                count += 1
        self.assertEqual(count, 564)

    def test_grouped_documents_auxiliary_metrics_and_locations_survive(self):
        root = self.fixture()
        (root / "policies/items.json").unlink()
        raw = ("- id: FIRST\r\n  kind: OBSERVATION\r\n  title: null\r\n"
               "  rule: عربي\r\n---\r\nid: SECOND\r\nkind: CAPABILITY\r\n"
               "skillQualification:\r\n  - status: NOT_OBSERVABLE\r\n  - status: NOT_RUN\r\n").encode("utf-8")
        (root / "policies/items.yaml").write_bytes(raw)
        (root / "capabilities/qualifications").mkdir(parents=True)
        metrics = {"id": "FIRST", "metrics": {"latency": {"median": 0, "p95": None}}, "status": "QUALIFIED"}
        (root / "capabilities/qualifications/q.json").write_text(json.dumps(metrics), encoding="utf-8")
        result = json.loads(serialize_catalog(build_catalog(read_package(root))))
        self.assertEqual([i["value"]["id"] for i in result["items"]], ["FIRST", "SECOND"])
        docs = [d for d in result["documents"] if d["source_path"].endswith(".yaml")]
        self.assertIsInstance(docs[0]["value"], list)
        self.assertEqual(docs[1]["value"]["skillQualification"],
                         [{"status": "NOT_OBSERVABLE"}, {"status": "NOT_RUN"}])
        metric_doc = next(d for d in result["documents"] if d["role"] == "qualification")
        self.assertEqual(metric_doc["value"], metrics)
        self.assertEqual(result["auxiliary_paths"], ["capabilities/qualifications/q.json"])
        source = next(s for s in result["sources"] if s["path"].endswith(".yaml"))
        self.assertEqual(base64.b64decode(source["raw_base64"]), raw)
        self.assertEqual(result["items"][1]["location"]["document"], 1)
        self.assertEqual(result["items"][0]["location"]["pointer"], "/0")

    def test_relocation_determinism_and_explicit_selection_are_visible(self):
        root = self.fixture()
        original = serialize_catalog(build_catalog(read_package(root)))
        copied = root / "نسخة"
        copied.mkdir()
        shutil.copyfile(root / "aghr.json", copied / "aghr.json")
        shutil.copytree(root / "policies", copied / "policies")
        self.assertEqual(original, serialize_catalog(build_catalog(read_package(copied))))
        partial = build_catalog(read_package(root, source_paths=["policies/items.json"]))
        self.assertEqual(partial["selection"]["mode"], "EXPLICIT_PATHS")
        self.assertEqual(partial["selection"]["source_paths"], ["policies/items.json"])
        self.assertNotEqual(partial["selection"], json.loads(original)["selection"])

    def test_missing_asset_does_not_create_an_empty_success(self):
        root = self.fixture()
        assets = root / "assets"
        shutil.copytree(ROOT / "schemas", assets)
        (assets / "item.schema.json").unlink()
        with self.assertRaises(ReadFailure) as failure:
            build_catalog(read_package(root), asset_root=assets)
        self.assertEqual(failure.exception.diagnostic.code, "SCHEMA_ASSET_UNAVAILABLE")

    def test_tampering_with_schema_and_rewriting_lock_cannot_refresh_it(self):
        root = self.fixture()
        assets = root / "assets"
        shutil.copytree(ROOT / "schemas", assets)
        target = assets / "item.schema.json"
        target.write_bytes(target.read_bytes() + b" ")
        with self.assertRaises(ReadFailure) as failure:
            build_catalog(read_package(root), asset_root=assets)
        self.assertEqual(failure.exception.diagnostic.code, "SCHEMA_ASSET_MISMATCH")
        lock = json.loads((assets / "SCHEMAS.lock.json").read_text(encoding="utf-8"))
        next(e for e in lock["files"] if e["path"] == target.name)["sha256"] = hashlib.sha256(target.read_bytes()).hexdigest()
        (assets / "SCHEMAS.lock.json").write_text(json.dumps(lock), encoding="utf-8")
        with self.assertRaises(ReadFailure) as failure:
            build_catalog(read_package(root), asset_root=assets)
        self.assertEqual(failure.exception.diagnostic.path, "schemas/SCHEMAS.lock.json")

    def test_transport_size_limit_rejects_before_emission(self):
        catalog = build_catalog(read_package(self.fixture()))
        with patch("catalog.MAX_OUTPUT_BYTES", 1), self.assertRaises(ReadFailure) as failure:
            serialize_catalog(catalog)
        self.assertEqual(failure.exception.diagnostic.code, "CATALOG_OUTPUT_LIMIT")

    def test_seven_declared_claim_vectors_remain_unverified_source_data(self):
        # Read-boundary guards only; the seven real runtime checks remain NOT_RUN.
        vectors = [
            {"VERIFIED": True, "execution": None},
            {"skill_id": "UNKNOWN_ID", "result": "PASS"},
            {"outputs": {}, "result": "PASS"},
            {"task_criteria": {"required": "real evidence"}, "result": "PASS"},
            {"permission": "BLOCKED", "fallback": "NO_SKILL_MATCH"},
            {"source": "HOST_SIGNAL", "host_signal": None},
            {"hostVersion": "new", "qualification": {"hostVersion": "old", "status": "QUALIFIED"}},
        ]
        root = self.fixture()
        for n, declared in enumerate(vectors, 1):
            with self.subTest(honesty=n):
                value = {"id": "VECTOR", "kind": "OBSERVATION", "declared": declared}
                (root / "policies/items.json").write_text(json.dumps(value), encoding="utf-8")
                catalog = build_catalog(read_package(root))
                self.assertEqual(catalog["items"][0]["value"], value)
                self.assertEqual(catalog["status"], "READ")
                self.assertEqual(catalog["validation_status"], "NOT_RUN")
                self.assertEqual(catalog["qualification_status"], "NOT_RUN")
                self.assertEqual(catalog["trust_status"], "NOT_EVALUATED")


class CatalogCliTests(FixtureCase):
    def invoke(self, root, *args, engine=ROOT, entrypoint=None):
        env = {key: os.environ[key] for key in ("SYSTEMROOT", "WINDIR", "TEMP", "TMP") if key in os.environ}
        result = subprocess.run([sys.executable, "-I", "-B", "-X", "utf8",
                                 str(entrypoint or engine / "tools/cli.py"), *args],
                                cwd=root, env=env, capture_output=True, timeout=60, shell=False)
        value = json.loads(result.stdout.decode("utf-8"))
        contract = json.loads((engine / "CLI_CONTRACT.json").read_text(encoding="utf-8"))
        Draft202012Validator(contract).validate(value)
        self.assertEqual(result.returncode, value["exit_code"])
        self.assertEqual(result.stdout.count(b"\n"), 1)
        return result, value

    def snapshot(self, root):
        return {p.relative_to(root).as_posix(): ("file", p.read_bytes()) if p.is_file() else ("directory", None)
                for p in root.rglob("*")}

    def test_real_candidate_catalog_is_lossless_and_portable(self):
        root = self.fixture()
        copied = root / "محرك منقول"
        shutil.copytree(ROOT, copied)
        process, report = self.invoke(ROOT, "catalog")
        moved, moved_report = self.invoke(copied, "catalog", engine=copied)
        self.assertEqual(process.stdout, moved.stdout)
        self.assertEqual(moved_report["result"], "READ")
        self.assertEqual(report["checks"]["status"], "NOT_RUN")
        self.assertEqual(report["data"]["catalog"]["items"][0]["value"]["id"], "OBS-REFERENCE-STATE-001")
        for source in report["data"]["catalog"]["sources"]:
            self.assertEqual(base64.b64decode(source["raw_base64"]), (ROOT / source["path"]).read_bytes())

    def test_malformed_utf8_preserves_raw_without_partial_success(self):
        root = self.fixture()
        bad = b'{"id":"BROKEN","rule":"\xff"}'
        (root / "policies/items.json").write_bytes(bad)
        process, report = self.invoke(root, "catalog")
        self.assertEqual(process.returncode, 2)
        self.assertEqual(report["result"], "ERROR")
        self.assertNotIn("catalog", report["data"])
        source = next(s for s in report["data"]["read_error"]["sources"] if s["path"].startswith("policies/"))
        self.assertEqual(base64.b64decode(source["raw_base64"]), bad)
        self.assertFalse(source["valid_utf8"])

    def test_schema_integrity_error_keeps_already_read_source(self):
        root = self.fixture()
        engine = root / "engine"
        shutil.copytree(ROOT, engine)
        target = engine / "schemas/item.schema.json"
        target.write_bytes(target.read_bytes() + b" ")
        process, report = self.invoke(root, "catalog", engine=engine)
        self.assertEqual(process.returncode, 2)
        self.assertEqual(report["diagnostics"][0]["code"], "SCHEMA_ASSET_MISMATCH")
        self.assertEqual(len(report["data"]["read_error"]["sources"]), 2)

    def test_foreign_python_is_not_imported(self):
        root = self.fixture()
        for name in ("loader.py", "catalog.py", "diagnostics.py"):
            (root / name).write_text("raise RuntimeError('foreign Python imported')", encoding="utf-8")
        before = self.snapshot(root)
        process, report = self.invoke(root, "catalog")
        self.assertEqual(process.returncode, 0)
        self.assertEqual(report["result"], "READ")
        self.assertEqual(before, self.snapshot(root))

    def test_audit_guard_blocks_all_filesystem_writes_and_subprocess_network(self):
        root = self.fixture()
        (root / ".aghr/runtime_evidence").mkdir(parents=True)
        (root / ".aghr/state.json").write_text('{"sentinel":true}', encoding="utf-8")
        (root / ".aghr/runtime_evidence/task.jsonl").write_text('{"sentinel":true}\n', encoding="utf-8")
        guard = root / "audit_guard.py"
        guard.write_text("\n".join([
            "import os, sys",
            "sys.path.insert(0, " + repr(str(ROOT / "tools")) + ")",
            "import cli",
            "def audit(event, args):",
            "    if event == 'open':",
            "        mode = args[1] or ''",
            "        flags = args[2] if isinstance(args[2], int) else 0",
            "        if any(x in mode for x in 'wa+x') or flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND):",
            "            raise AssertionError('filesystem write attempted')",
            "    if event in ('os.mkdir','os.remove','os.rmdir','os.rename','os.truncate','os.chmod','os.utime','os.link','os.symlink','subprocess.Popen') or event.startswith('socket.'):",
            "        raise AssertionError('mutation/process/network attempted')",
            "sys.addaudithook(audit)",
            "raise SystemExit(cli.main(['catalog']))",
        ]), encoding="utf-8")
        before = self.snapshot(root)
        process, report = self.invoke(root, entrypoint=guard)
        self.assertEqual(process.returncode, 0)
        self.assertEqual(report["result"], "READ")
        self.assertEqual(before, self.snapshot(root))

    def test_protocol_rejects_fabricated_validation_and_qualification(self):
        _, report = self.invoke(self.fixture(), "catalog")
        contract = json.loads((ROOT / "CLI_CONTRACT.json").read_text(encoding="utf-8"))
        validator = Draft202012Validator(contract)
        for field, value in (("checks", {"status": "COMPLETE", "reason": None}), ("data", None)):
            fake = deepcopy(report)
            fake[field] = value
            with self.assertRaises(ValidationError):
                validator.validate(fake)
        fake = deepcopy(report)
        fake["data"]["catalog"]["qualification_status"] = "QUALIFIED"
        with self.assertRaises(ValidationError):
            validator.validate(fake)

    def test_read_errors_and_arguments_never_become_empty_success(self):
        root = self.fixture()
        for args in (("catalog", "--strict"), ("catalog", "--root", "outside")):
            process, report = self.invoke(root, *args)
            self.assertEqual(process.returncode, 2)
            self.assertEqual(report["result"], "ERROR")
        (root / "policies/items.json").write_text('[{"id":"SAME"},{"id":"SAME"}]', encoding="utf-8")
        process, report = self.invoke(root, "catalog")
        self.assertEqual(process.returncode, 2)
        self.assertEqual(report["diagnostics"][0]["code"], "DUPLICATE_ID")


if __name__ == "__main__":
    unittest.main()
