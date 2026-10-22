"""Reader tests use synthetic bytes and disposable projects, not an adopted package."""

from dataclasses import replace
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))  # Owned source only, never an input project.
from diagnostics import ReadFailure
import loader
from loader import ReaderLimits, parse_source, read_package


class ParserTests(unittest.TestCase):
    def reject(self, raw, code, *, path="policies/test.yaml", **kwargs):
        with self.assertRaises(ReadFailure) as caught:
            parse_source(path, raw, **kwargs)
        self.assertEqual(caught.exception.diagnostic.code, code)
        self.assertTrue(caught.exception.sources)
        return caught.exception

    def test_preserves_bytes_hash_and_missing_fields(self):
        raw = "# وصف\r\nid: DOC-1\r\nrule: احتفظ بالمصدر\r\n".encode("utf-8")
        result = parse_source("policies/عربي.yml", raw)
        self.assertEqual(result.source.raw, raw)
        self.assertEqual(result.source.sha256, hashlib.sha256(raw).hexdigest())
        item = result.documents[0].value
        self.assertNotIn("authority", item)
        self.assertEqual(item["rule"], "احتفظ بالمصدر")
        location = result.documents[0].location
        self.assertEqual((location.line, location.column), (2, 1))
        self.assertEqual(location.start_byte, raw.index(b"id:"))

    def test_multiple_documents_and_list_member_positions(self):
        raw = b"---\nid: ONE\n---\n- id: TWO\n- id: THREE\n"
        result = parse_source("policies/test.yaml", raw)
        self.assertEqual(len(result.documents), 2)
        second = result.documents[1]
        self.assertEqual(second.value[1]["id"], "THREE")
        self.assertEqual(second.members[1].location.document, 1)
        self.assertEqual(second.members[1].location.pointer, "/1")
        self.assertEqual((second.members[1].location.line, second.members[1].location.column), (5, 3))

    def test_dates_and_legacy_booleans_remain_strings(self):
        result = parse_source("policies/test.yaml", b"id: X\ndate: 2026-10-22\nword: on\nother: no\nflag: true\ncount: 12\nratio: 1e2\n")
        value = result.documents[0].value
        self.assertEqual((value["date"], value["word"], value["other"]), ("2026-10-22", "on", "no"))
        self.assertIs(value["flag"], True)
        self.assertEqual((value["count"], value["ratio"]), (12, 100.0))
        self.assertIs(yaml.safe_load("on"), True)  # Base library resolver was not changed.

    def test_duplicate_keys_have_exact_second_location(self):
        error = self.reject(b"id: ONE\nauthority:\n  owner: one\n  owner: two\n", "DUPLICATE_KEY")
        self.assertEqual((error.diagnostic.line, error.diagnostic.column), (4, 3))
        self.reject(b'{"id":"ONE","id":"TWO"}', "DUPLICATE_KEY", path="policies/test.json")

    def test_aliases_tags_merges_and_non_string_keys_reject(self):
        for raw, code in [(b"&self [*self]", "YAML_ALIAS_UNSUPPORTED"), (b"!!python/object/apply:builtins.len [[1]]", "YAML_TAG_UNSUPPORTED"), (b"{<<: {id: X}}", "YAML_MERGE_UNSUPPORTED"), (b"{1: value}", "NON_STRING_KEY")]:
            with self.subTest(code=code):
                self.reject(raw, code)

    def test_strict_json_and_non_finite_scalars_reject(self):
        for raw, code in [(b"id: X", "INVALID_JSON"), (b'{"id":"X",}', "INVALID_JSON"), (b'{"x": NaN}', "INVALID_JSON_SCALAR"), (b'{"x": 1e999}', "INVALID_JSON_SCALAR")]:
            with self.subTest(raw=raw):
                self.reject(raw, code, path="policies/test.json")
        self.reject(b"value: 1e999", "INVALID_SCALAR")
        self.reject(b'{"x":' + b"1" * 257 + b"}", "INVALID_JSON_SCALAR", path="policies/test.json")
        self.reject(b"value: " + b"1" * 257, "INVALID_SCALAR")

    def test_unicode_escape_pairs_preserve_valid_json_text(self):
        result = parse_source("policies/test.json", b'{"id":"X","rule":"\\ud83d\\ude00"}')
        self.assertEqual(result.documents[0].value["rule"], "\U0001f600")
        self.reject(b'{"rule":"\\ud800"}', "INVALID_SCALAR", path="policies/test.json")

    def test_invalid_utf8_is_preserved_for_display_only(self):
        raw = b"id: X\nrule: \xff"
        error = self.reject(raw, "INVALID_UTF8")
        self.assertEqual(error.sources[0].raw, raw)
        self.assertFalse(error.sources[0].valid_utf8)
        self.assertIn("\ufffd", error.sources[0].text)

    def test_parse_bounds_and_incomplete_source_hash(self):
        self.reject(b"[[[[value]]]]", "PARSE_LIMIT_EXCEEDED", limits=replace(ReaderLimits(), max_depth=3))
        self.reject(b"[one, two, three]", "PARSE_LIMIT_EXCEEDED", limits=replace(ReaderLimits(), max_nodes=3))
        self.reject(b"---\nid: A\n---\nid: B", "DOCUMENT_LIMIT_EXCEEDED", limits=replace(ReaderLimits(), max_documents=1))
        error = self.reject(b"id: TOO-LONG", "FILE_LIMIT_EXCEEDED", limits=replace(ReaderLimits(), max_file_bytes=4))
        self.assertFalse(error.sources[0].complete)
        self.assertIsNone(error.sources[0].sha256)
        self.assertEqual(error.sources[0].raw, b"id: T")

    def test_empty_malformed_and_unsupported_format_reject(self):
        self.reject(b"# only a comment", "EMPTY_SOURCE")
        self.reject(b"id: [", "INVALID_YAML")
        self.reject(b"id: X", "UNSUPPORTED_FORMAT", path="policies/test.md")

    def test_limits_are_explicit_positive_configuration(self):
        for value in (0, -1, True):
            with self.assertRaises(ValueError):
                ReaderLimits(max_nodes=value)
        with self.assertRaises(ValueError):
            parse_source("policies/test.yaml", b"id: X", limits=0)


class PackageTests(unittest.TestCase):
    def temporary(self):
        owned = tempfile.TemporaryDirectory(prefix="aghr-e1b-")
        self.assertEqual(Path(owned.name).resolve().parent, Path(tempfile.gettempdir()).resolve())
        return owned

    def project(self, directory):
        root = Path(directory) / "حزمة اختبار"
        root.mkdir()
        manifest = {"id": "fixture", "name": "Synthetic reader fixture", "schemaVersion": "1.2", "version": "0.0.0-test", "owner": "TEST_ONLY", "license": "TEST_ONLY", "compatibility": {"agents": ["codex"], "targets": {"codex": {"file": "AGENTS.md"}}}, "validation": {"strict": True}}
        self.write(root, "aghr.json", json.dumps(manifest).encode("utf-8"))
        self.write(root, "policies/base.yaml", b"id: BASE\nkind: OBSERVATION\nforce: INFORMATIVE\nrule: original\n")
        return root

    def write(self, root, relative, raw):
        path = root / relative
        self.assertTrue(path.resolve().is_relative_to(root.resolve()))
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        return path

    def reject(self, root, code, **kwargs):
        with self.assertRaises(ReadFailure) as caught:
            read_package(root, **kwargs)
        self.assertEqual(caught.exception.diagnostic.code, code)
        return caught.exception

    def test_reads_manifest_items_and_preserves_all_fields(self):
        with self.temporary() as directory:
            root = self.project(directory)
            result = read_package(root)
            self.assertEqual(result.status, "READ")
            self.assertEqual(result.validation_status, "NOT_RUN")
            self.assertEqual(result.manifest.value["owner"], "TEST_ONLY")
            self.assertEqual(result.items[0].value["id"], "BASE")
            self.assertNotIn("authority", result.items[0].value)
            for source in result.sources:
                self.assertEqual(source.raw, (root / source.path).read_bytes())
                self.assertEqual(source.sha256, hashlib.sha256(source.raw).hexdigest())
                self.assertNotIn("\\", source.path)

    def test_lists_multidoc_and_deterministic_order(self):
        with self.temporary() as directory:
            root = self.project(directory)
            self.write(root, "policies/2.json", b'[{"id":"LIST-A"},{"id":"LIST-B"}]')
            self.write(root, "decisions/d.yml", b"id: DOC-A\n---\nid: DOC-B\n")
            result = read_package(root)
            self.assertEqual([item.value["id"] for item in result.items], ["DOC-A", "DOC-B", "LIST-A", "LIST-B", "BASE"])
            self.assertEqual(result.items[3].location.pointer, "/1")
            self.assertEqual(result.items[1].location.document, 1)

    def test_auxiliary_documents_are_never_governance_items(self):
        with self.temporary() as directory:
            root = self.project(directory)
            for relative in ["profiles/p.yaml", "capabilities/qualifications/q.json", "capabilities/project-selections/s.yaml"]:
                self.write(root, relative, b'{"id":"BASE","unmeasured":null,"groups":[{"original":true}]}')
            self.write(root, "capabilities/skill.yaml", b"id: CAP-X\nkind: CAPABILITY\nskillId: available-later\n")
            result = read_package(root)
            self.assertEqual([item.value["id"] for item in result.items], ["CAP-X", "BASE"])
            self.assertEqual({file.source.role for file in result.auxiliary}, {"profile", "qualification", "selection"})
            self.assertTrue(all(file.documents[0].value["groups"] == [{"original": True}] for file in result.auxiliary))

    def test_duplicate_ids_in_files_and_documents_reject(self):
        with self.temporary() as directory:
            root = self.project(directory)
            target = self.write(root, "policies/duplicate.yaml", b"id: BASE")
            error = self.reject(root, "DUPLICATE_ID")
            self.assertIsNotNone(error.diagnostic.line)
            target.write_bytes(b"id: ONE\n---\nid: ONE")
            self.reject(root, "DUPLICATE_ID")

    def test_invalid_utf8_preserves_original_and_context(self):
        with self.temporary() as directory:
            root = self.project(directory)
            self.write(root, "policies/bad.yaml", b"id: X\nrule: \xff")
            error = self.reject(root, "INVALID_UTF8")
            self.assertEqual(error.sources[0].path, "aghr.json")
            bad = next(source for source in error.sources if source.path == "policies/bad.yaml")
            self.assertEqual(bad.raw, b"id: X\nrule: \xff")
            self.assertFalse(bad.valid_utf8)

    def test_manifest_missing_malformed_type_and_version_reject(self):
        with self.temporary() as directory:
            root = self.project(directory)
            manifest = root / "aghr.json"
            manifest.unlink()
            self.reject(root, "SOURCE_IO_ERROR")
            for raw, code in [(b"not json", "INVALID_JSON"), (b"[]", "INVALID_MANIFEST"), (b'{"schemaVersion":"1.1"}', "UNSUPPORTED_SCHEMA_VERSION"), (b'{"schemaVersion":"1.2","schemaVersion":"1.1"}', "DUPLICATE_KEY")]:
                with self.subTest(code=code):
                    manifest.write_bytes(raw)
                    self.reject(root, code)

    def test_bad_item_shapes_and_empty_package_reject(self):
        with self.temporary() as directory:
            root = self.project(directory)
            item = root / "policies/base.yaml"
            for raw, code in [(b"- string", "INVALID_ITEM_SHAPE"), (b"rule: missing identifier", "MISSING_ITEM_ID"), (b"id: 1", "MISSING_ITEM_ID"), (b"id: ''", "MISSING_ITEM_ID")]:
                with self.subTest(code=code):
                    item.write_bytes(raw)
                    self.reject(root, code)
            item.unlink()
            self.reject(root, "NO_ITEMS_FOUND")

    def test_explicit_paths_are_scoped_and_overlap_rejects(self):
        with self.temporary() as directory:
            root = self.project(directory)
            self.write(root, "policies/bad.yaml", b"id: [")
            result = read_package(root, source_paths=("policies/base.yaml",))
            self.assertEqual(len(result.items), 1)
            self.assertEqual(result.selection_mode, "EXPLICIT_PATHS")
            self.assertEqual(result.source_paths, ("policies/base.yaml",))
            self.reject(root, "OVERLAPPING_SOURCE_PATHS", source_paths=("policies", "policies/base.yaml"))
            self.reject(root, "SOURCE_IO_ERROR", source_paths=("policies/missing.yaml",))
            self.reject(root, "INVALID_SOURCE_SELECTION", source_paths="policies/base.yaml")

    def test_absolute_parent_windows_and_forbidden_paths_reject(self):
        with self.temporary() as directory:
            root = self.project(directory)
            for relative in ["../outside.yaml", "/outside.yaml", "C:/outside.yaml", "C:outside.yaml", "policies\\base.yaml", "policies/../outside.yaml", "policies//base.yaml", "policies/.. /outside.yaml", "policies/\ud800.yaml"]:
                with self.subTest(relative=relative):
                    self.reject(root, "INVALID_SOURCE_PATH", source_paths=(relative,))
            for relative in ["archive", "policies/verification", "policies/.aghr/state.json", "src"]:
                with self.subTest(relative=relative):
                    self.reject(root, "DISALLOWED_SOURCE_PATH", source_paths=(relative,))

    def test_does_not_crawl_foreign_roots_or_execute_code(self):
        with self.temporary() as directory:
            root = self.project(directory)
            self.write(root, "verification/bad.yaml", b"\xff")
            self.write(root, "compatibility/bad.yaml", b"\xff")
            self.write(root, "src/bad.yaml", b"\xff")
            marker = root / "executed.txt"
            self.write(root, "policies/code.py", ("from pathlib import Path\nPath(" + repr(str(marker)) + ").write_text('bad')\n").encode("utf-8"))
            result = read_package(root)
            self.assertEqual(len(result.items), 1)
            self.assertFalse(marker.exists())
            self.assertEqual({source.path for source in result.sources}, {"aghr.json", "policies/base.yaml"})

    def test_nested_repository_and_package_reject_before_descent(self):
        with self.temporary() as directory:
            root = self.project(directory)
            nested = root / "policies/nested"
            nested.mkdir()
            marker = nested / ".git"
            marker.write_text("not traversed", encoding="utf-8")
            self.reject(root, "NESTED_SOURCE_ROOT")
            marker.unlink()
            (nested / "aghr.json").write_text("{}", encoding="utf-8")
            self.reject(root, "NESTED_SOURCE_ROOT")

    def test_explicit_file_selection_cannot_cross_nested_repository(self):
        with self.temporary() as directory:
            root = self.project(directory)
            self.write(root, "policies/nested/.git", b"not followed")
            self.write(root, "policies/nested/item.yaml", b"id: NESTED")
            self.reject(root, "NESTED_SOURCE_ROOT", source_paths=("policies/nested/item.yaml",))

    def test_source_byte_file_entry_depth_and_item_limits(self):
        with self.temporary() as directory:
            root = self.project(directory)
            self.reject(root, "FILE_COUNT_EXCEEDED", limits=replace(ReaderLimits(), max_files=1))
            manifest_size = (root / "aghr.json").stat().st_size
            self.reject(root, "TOTAL_BYTES_EXCEEDED", limits=replace(ReaderLimits(), max_total_bytes=manifest_size + 3))
            self.write(root, "policies/huge.yaml", b"x" * 1025)
            self.reject(root, "FILE_LIMIT_EXCEEDED", limits=replace(ReaderLimits(), max_file_bytes=1024))
            (root / "policies/huge.yaml").unlink()
            self.write(root, "policies/another.yaml", b"id: ANOTHER")
            self.reject(root, "DIRECTORY_ENTRY_LIMIT_EXCEEDED", limits=replace(ReaderLimits(), max_entries=1))
            self.reject(root, "ITEM_COUNT_EXCEEDED", limits=replace(ReaderLimits(), max_items=1))
            self.write(root, "policies/a/b/deep.yaml", b"id: DEEP")
            self.reject(root, "DIRECTORY_DEPTH_EXCEEDED", limits=replace(ReaderLimits(), max_directory_depth=2))
            self.reject(root, "DIRECTORY_DEPTH_EXCEEDED", source_paths=("policies/a/b/deep.yaml",), limits=replace(ReaderLimits(), max_directory_depth=2))

    def test_read_failure_is_not_an_empty_success(self):
        with self.temporary() as directory:
            root = self.project(directory)
            with patch.object(loader.os, "scandir", side_effect=PermissionError("fixture denial")):
                error = self.reject(root, "SOURCE_IO_ERROR")
            self.assertEqual(error.sources[0].path, "aghr.json")

    def test_source_modification_during_read_is_rejected(self):
        with self.temporary() as directory:
            root = self.project(directory)
            original = loader.parse_source
            def concurrent_change(relative, raw, **kwargs):
                parsed = original(relative, raw, **kwargs)
                if relative == "policies/base.yaml":
                    (root / "aghr.json").write_bytes((root / "aghr.json").read_bytes() + b" ")
                return parsed
            with patch.object(loader, "parse_source", side_effect=concurrent_change):
                self.reject(root, "SOURCE_CHANGED")

    def test_actual_junction_or_symlink_cannot_escape_root(self):
        with self.temporary() as directory:
            root = self.project(directory)
            target = Path(directory) / "outside"
            target.mkdir()
            (target / "secret.yaml").write_bytes(b"id: OUTSIDE")
            link = root / "policies/link"
            if os.name == "nt":
                import _winapi
                _winapi.CreateJunction(str(target), str(link))
            else:
                link.symlink_to(target, target_is_directory=True)
            try:
                error = self.reject(root, "LINK_UNSUPPORTED")
                self.assertTrue(all(b"OUTSIDE" not in source.raw for source in error.sources))
            finally:
                self.assertTrue(link.parent.resolve().is_relative_to(root.resolve()))
                if os.name == "nt":
                    self.assertTrue(link.is_junction())
                    link.rmdir()  # Remove only the owned junction, never its target.
                else:
                    link.unlink()
            self.assertTrue((target / "secret.yaml").is_file())

    def test_reader_writes_nothing(self):
        with self.temporary() as directory:
            root = self.project(directory)
            def snapshot():
                return {p.relative_to(root).as_posix(): (p.read_bytes() if p.is_file() else None) for p in root.rglob("*")}
            before = snapshot()
            read_package(root)
            self.assertEqual(before, snapshot())


if __name__ == "__main__":
    unittest.main(verbosity=2)
