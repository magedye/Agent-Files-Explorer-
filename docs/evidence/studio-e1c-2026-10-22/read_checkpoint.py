"""Owned evidence driver; not an AGHR governing validator or public CLI."""

import base64
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
PACKAGE = ROOT / "governance_packages/candidates/AGHR_rc3_Core_Candidate"
sys.path.insert(0, str(PACKAGE / "tools"))
from loader import read_package


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def snapshot():
    # Enumerate this small owned candidate only, never reference/history roots.
    return {p.relative_to(PACKAGE).as_posix(): digest(p.read_bytes())
            for p in PACKAGE.rglob("*") if p.is_file()}


before = snapshot()
result = read_package(PACKAGE)
assert result.status == "READ" and result.validation_status == "NOT_RUN"
assert result.selection_mode == "DEFAULT_ROOTS"
assert len(result.items) == 1 and not result.auxiliary
item = result.items[0]
assert item.value["id"] == "OBS-REFERENCE-STATE-001"
assert item.value["kind"] == "OBSERVATION"
assert item.value["force"] == "INFORMATIVE"
assert item.value["impact"]["evidence"] == "assumed"
assert "authority" not in item.value
assert result.manifest.value["owner"] == "Platform Governance Team"
assert result.manifest.value["license"] == "MIT"
records = []
for source in result.sources:
    raw = (PACKAGE / source.path).read_bytes()
    assert source.complete and source.valid_utf8
    assert source.raw == raw and source.sha256 == digest(raw)
    assert source.text == raw.decode("utf-8")
    records.append({"path": source.path, "role": source.role,
                    "sha256": source.sha256, "raw_base64": base64.b64encode(raw).decode("ascii")})
assert {s["path"] for s in records} == {
    "aghr.json", "policies/observations/reference-state.json"}
assert before == snapshot(), "Reader wrote to or changed the real candidate"
print(json.dumps({"result": result.status, "validation_status": result.validation_status,
                  "input_type": "REAL_APPLICATION_SOURCE_CANDIDATE",
                  "owner_license": "PROVISIONAL_OWNER_LICENSE", "items": [item.value],
                  "item_location": asdict(item.location), "sources": records,
                  "package_files": len(before), "source_unchanged": True},
                 ensure_ascii=False, allow_nan=False))
