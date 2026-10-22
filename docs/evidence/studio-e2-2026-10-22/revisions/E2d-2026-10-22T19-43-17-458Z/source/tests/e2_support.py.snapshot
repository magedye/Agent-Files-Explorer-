"""Synthetic E2 fixtures. They are never an adopted policy or host qualification."""

from copy import deepcopy
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from loader import read_package


def item(identifier="SYNTHETIC", force="INFORMATIVE", kind="OBSERVATION"):
    value = {"id": identifier, "kind": kind, "force": force, "severity": "info",
             "scope": {}, "rule": "Synthetic test instruction only.", "impact": {"evidence": "assumed"}}
    if force in ("SHOULD", "SHOULD_NOT", "MUST", "MUST_NOT"):
        value.update(rationale="Synthetic reason.", authority={"owner": "synthetic-owner"})
    if force in ("MUST", "MUST_NOT"):
        value["authority"].update(source="policies/items.json", level="project", approvedBy="synthetic-approver", status="active", effectiveFrom="2026-01-01")
    if force == "MUST":
        value["verification"] = {"commands": ["synthetic-never-executed"]}
    if kind == "CAPABILITY":
        value.update(skillId=identifier, source="project", function="verification",
                     permissions={"read": [], "write": [], "network": "deny", "secrets": "deny"}, inputs=[], outputs=[],
                     skillQualification={"skillId": identifier, "host": "codex", "hostVersion": "synthetic-1", "scope": "**/*", "contentHash": "sha256:" + "0" * 64, "status": "NOT_RUN"})
    if kind == "EXCEPTION":
        value.update(expiresOn="2026-12-31", references=["SYNTHETIC-TARGET"])
    return value


class FixtureCase(unittest.TestCase):
    def fixture(self, values=None, *, manifest=None):
        temporary = tempfile.TemporaryDirectory(prefix="aghr-e2-synthetic-")
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        (root / "policies").mkdir()
        data = json.loads((ROOT / "aghr.json").read_text(encoding="utf-8")) if manifest is None else deepcopy(manifest)
        self.write(root, "aghr.json", data)
        self.write(root, "policies/items.json", values if values is not None else item())
        return root

    @staticmethod
    def write(root, name, value):
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(value, ensure_ascii=False, allow_nan=False), encoding="utf-8")

    def package(self, value):
        return read_package(self.fixture(value))
