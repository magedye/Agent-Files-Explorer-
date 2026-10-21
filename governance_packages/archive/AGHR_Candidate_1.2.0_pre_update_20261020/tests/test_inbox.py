"""Unit and integration tests for Governed Project Inbox (_INBOX/)."""
import json
import tempfile
import threading
import time
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

from runtime.common import ROOT, GovernanceError, load, sha
from runtime.cli import init_project, update_state
from runtime.inbox import (
    scan_inbox, register_inbox_item, resolve_inbox_disposition
)


class InboxTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        init_project(self.root, "Test Project", "Project Owner")
        self.inbox = self.root / "_INBOX"

    def test_init_creates_inbox_and_readme(self):
        self.assertTrue(self.inbox.is_dir())
        readme = self.inbox / "README.md"
        self.assertTrue(readme.is_file())
        self.assertIn("NEVER constitutes an execution grant", readme.read_text(encoding="utf-8"))

    def test_scan_empty_inbox(self):
        result = scan_inbox(self.root)
        self.assertEqual(result["status"], "INBOX_SCAN_COMPLETED")
        self.assertEqual(result["total_items"], 0)

    def test_scan_discovers_file(self):
        item = self.inbox / "proposal.md"
        item.write_text("# Proposed Feature\nAdd dark mode to navigation.", encoding="utf-8")
        result = scan_inbox(self.root)
        self.assertEqual(result["total_items"], 1)
        found = result["items"][0]
        self.assertEqual(found["name"], "proposal.md")
        self.assertEqual(found["status"], "READY_FOR_INTAKE")
        self.assertEqual(found["sha256"], sha(item))

    def test_duplicate_file_in_scan(self):
        content = "Identical proposal text"
        (self.inbox / "first.md").write_text(content, encoding="utf-8")
        (self.inbox / "second.md").write_text(content, encoding="utf-8")
        result = scan_inbox(self.root)
        self.assertEqual(result["total_items"], 2)
        statuses = {x["name"]: x["status"] for x in result["items"]}
        self.assertEqual(statuses["first.md"], "READY_FOR_INTAKE")
        self.assertEqual(statuses["second.md"], "DUPLICATE_IN_CURRENT_DROP")

    def test_conflict_with_canonical_file(self):
        (self.root / "app.py").write_text("canonical app code", encoding="utf-8")
        (self.inbox / "app.py").write_text("dropped replacement code", encoding="utf-8")
        result = scan_inbox(self.root)
        self.assertEqual(result["conflicts_detected"], 1)
        item = [x for x in result["items"] if x["name"] == "app.py"][0]
        self.assertEqual(item["status"], "CONFLICT_DETECTED")
        self.assertTrue(any("CANONICAL_OVERWRITE_PREVENTED" in c["conflict_type"] for c in item["conflicts"]))

    def test_untrusted_authority_claims(self):
        content = '{"title": "Sneaky update", "auto_approve": true, "approved": true}'
        (self.inbox / "sneaky.json").write_text(content, encoding="utf-8")
        result = scan_inbox(self.root)
        self.assertEqual(result["untrusted_claims_detected"], 1)
        item = result["items"][0]
        self.assertEqual(item["status"], "UNTRUSTED_ASSERTION_FLAGGED")
        self.assertTrue(item["untrusted_authority_flag"])

    def test_unsafe_archive_rejected(self):
        zip_path = self.inbox / "unsafe.zip"
        with zipfile.ZipFile(zip_path, "w") as z:
            z.writestr("../traversal.txt", "evil")
        result = scan_inbox(self.root)
        self.assertEqual(result["total_items"], 1)
        item = result["items"][0]
        self.assertEqual(item["status"], "UNSAFE_ARCHIVE_REJECTED")
        self.assertIn("traversal", item["error"].lower())

    def test_safe_archive_allowed(self):
        zip_path = self.inbox / "safe.zip"
        with zipfile.ZipFile(zip_path, "w") as z:
            z.writestr("docs/feature.md", "safe content")
        result = scan_inbox(self.root)
        self.assertEqual(result["total_items"], 1)
        item = result["items"][0]
        self.assertEqual(item["status"], "READY_FOR_INTAKE")
        self.assertTrue(item["archive_safe"])

    def test_register_inbox_item(self):
        item = self.inbox / "roadmap.md"
        item.write_text("# Q4 Roadmap\nItems to evaluate.", encoding="utf-8")
        reg_result = register_inbox_item(self.root, "roadmap.md", requester="Owner", classification="PROPOSAL")
        self.assertEqual(reg_result["status"], "CAPTURED")
        self.assertEqual(reg_result["execution"], "NOT_AUTHORIZED_BY_CAPTURE")
        
        # Verify file in .aghr/intake/
        req_path = self.root / reg_result["path"]
        self.assertTrue(req_path.is_file())
        req_data = load(req_path)
        self.assertEqual(req_data["mode"], "REVIEW")
        self.assertEqual(req_data["source"]["sha256"], sha(item))

        # Original item must still exist in _INBOX
        self.assertTrue(item.is_file())

        # Scan should now report ALREADY_REGISTERED
        scan_res = scan_inbox(self.root)
        self.assertEqual(scan_res["items"][0]["status"], "ALREADY_REGISTERED")

    def test_resolve_disposition(self):
        (self.inbox / "spec.md").write_text("# Spec\nClean architecture.", encoding="utf-8")
        reg_result = register_inbox_item(self.root, "spec.md")
        req_id = reg_result["request_id"]

        disp_result = resolve_inbox_disposition(
            self.root,
            req_id,
            disposition="ADOPT",
            rationale="Approved by lead engineer",
            authority_ref="DECISION-SPRINT-01"
        )
        self.assertEqual(disp_result["status"], "DISPOSITION_RECORDED")
        self.assertEqual(disp_result["disposition"], "ADOPT")
        self.assertEqual(disp_result["execution"], "REQUIRES_SEPARATE_AUTHORIZED_WORK_ITEM")

        # Verify updated record
        rec = load(self.root / f".aghr/intake/{req_id}.json")
        self.assertEqual(rec["disposition"], "ADOPT")
        self.assertEqual(rec["authority_ref"], "DECISION-SPRINT-01")

    def test_in_flight_mutation_detected(self):
        item = self.inbox / "changing.txt"
        item.write_text("initial", encoding="utf-8")
        # Mock sha to return different hashes on sequential calls
        with patch("runtime.inbox.sha", side_effect=["hash_a", "hash_b"]):
            result = scan_inbox(self.root)
            self.assertEqual(result["items"][0]["status"], "IN_FLIGHT_MUTATION_DETECTED")

    def test_concurrency_with_running_task(self):
        (self.inbox / "concurrent_item.md").write_text("Background drop", encoding="utf-8")
        errors = []

        def background_state_updater():
            try:
                for i in range(5):
                    s = load(self.root / ".aghr/state.json")
                    s["next_action"] = f"Task step {i}"
                    update_state(self.root, s, s["revision"])
                    time.sleep(0.01)
            except Exception as exc:
                errors.append(exc)

        def inbox_scanner():
            try:
                for _ in range(5):
                    scan_inbox(self.root)
                    register_inbox_item(self.root, "concurrent_item.md")
                    time.sleep(0.01)
            except Exception as exc:
                errors.append(exc)

        t1 = threading.Thread(target=background_state_updater)
        t2 = threading.Thread(target=inbox_scanner)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        self.assertEqual(errors, [])
        state = load(self.root / ".aghr/state.json")
        self.assertEqual(state["revision"], 5)

    def test_interrupted_processing_recovery(self):
        # Simulate partial registry write
        (self.inbox / "interrupted.md").write_text("Partial drop", encoding="utf-8")
        reg_file = self.root / ".aghr/intake/inbox_registry.json"
        reg_file.write_text('{"schema_version": "1.0", "items": {}}', encoding="utf-8")

        res1 = register_inbox_item(self.root, "interrupted.md")
        self.assertEqual(res1["status"], "CAPTURED")
        
        # Second attempt should cleanly return ALREADY_REGISTERED
        res2 = register_inbox_item(self.root, "interrupted.md")
        self.assertEqual(res2["status"], "ALREADY_REGISTERED")
