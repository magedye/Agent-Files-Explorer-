"""E1.c evidence checks against frozen sources; not an AGHR strict validator.

Schema API: https://python-jsonschema.readthedocs.io/en/v4.26.0/referencing/
"""

from copy import deepcopy
from dataclasses import asdict
import base64
import hashlib
import json
from pathlib import Path
import sys

from jsonschema import Draft202012Validator
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[3]
EVIDENCE = Path(__file__).resolve().parent
PACKAGE = ROOT / "governance_packages/candidates/AGHR_rc3_Core_Candidate"
CONTRACTS = ROOT / "docs/contracts/aghr-rc3"
sys.path.insert(0, str(PACKAGE / "tools"))
from loader import read_package


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def snapshot():
    # This owned thirteen-file candidate is the entire enumeration boundary.
    return {p.relative_to(PACKAGE).as_posix(): sha(p.read_bytes())
            for p in PACKAGE.rglob("*") if p.is_file()}


before = snapshot()
pin = load(EVIDENCE / "SOURCE_PIN.json")
assert before == pin["files"]
result = read_package(PACKAGE)
assert result.status == "READ" and result.validation_status == "NOT_RUN"
assert result.selection_mode == "DEFAULT_ROOTS"
assert len(result.items) == 1 and not result.auxiliary
located = result.items[0]
item, manifest = located.value, result.manifest.value
assert item["id"] == "OBS-REFERENCE-STATE-001"
assert (item["kind"], item["force"]) == ("OBSERVATION", "INFORMATIVE")
assert item["impact"] == {"band": "info", "evidence": "assumed"}
assert "authority" not in item and "signed" not in manifest
source_map = load(PACKAGE / "SOURCE_MAP.json")
provenance = load(PACKAGE / "PROVENANCE.json")
status = load(PACKAGE / "PACKAGE_STATUS.json")
decision = load(EVIDENCE / "E1C_4_OWNER_LICENSE.json")
assert sha((EVIDENCE / "E1C_4_OWNER_LICENSE.json").read_bytes()) == source_map["owner_license"]["receipt_sha256"]
assert manifest["owner"] == provenance["license"]["owner"] == decision["owner"]
assert manifest["license"] == provenance["license"]["spdx"] == decision["license"]
assert decision["status"] == status["owner_license"]["state"] == "PROVISIONAL_OWNER_LICENSE"
assert provenance["license"]["status"] == source_map["decision_state"] == decision["status"]
assert decision["signed_decision"] == "NOT_SUPPLIED"
assert decision["final_acceptance"] == "PENDING_EXPLICIT_OWNER_SIGNATURE"
assert not decision["future_changes"]["automatic_rebuild"]
assert not decision["future_changes"]["automatic_promotion"]
assert status["release_acceptance"] == status["reference_promotion"] == "NOT_GRANTED"
assert status["engine_binding"] == "NOT_CONFIGURED"
for binding in decision["source_of_truth"]:
    raw = (PACKAGE / binding["path"]).read_bytes()
    assert sha(raw) == binding["sha256"] and len(raw) == binding["bytes"]
assert source_map["owner_license"]["bindings"] == decision["source_of_truth"]
assert status["owner_license"]["source_of_truth"] == decision["source_of_truth"]
assert sha(decision["instruction_text"].encode("utf-8")) == decision["instruction_text_sha256"]
origin = source_map["items"][0]
assert sha((PACKAGE / origin["path"]).read_bytes()) == origin["sha256"]
source = origin["source"]
raw = (ROOT / source["repository_path"]).read_bytes()
assert sha(raw) == source["sha256"] and len(raw) == source["bytes"]
assert raw == (ROOT / source["snapshot_repository_path"]).read_bytes()
excerpt = raw[source["byte_start"]:source["byte_end"]]
assert excerpt.decode("utf-8") == source["excerpt"]
assert base64.b64encode(excerpt).decode("ascii") == source["excerpt_raw_base64"]
assert raw.decode("utf-8").splitlines()[30:32] == source["excerpt"].splitlines()
assert 'DEFAULT_PACKAGE_ID = "aghr_1_2_0"' in source["excerpt"]
assert "AGHR_ROOT = AGHR_1_2_0_ROOT" in source["excerpt"]
for ref in source_map["governing_sources"]:
    assert sha((ROOT / ref.get("snapshot_repository_path", ref["repository_path"])).read_bytes()) == ref["sha256"]
template = (EVIDENCE / "sources/MIT.spdx.txt").read_bytes()
assert sha(template) == decision["license_template"]["sha256"]
proposed = template.decode("utf-8").replace(
    "Copyright (c) <year> <copyright holders>",
    "Copyright (c) 2026 Platform Governance Team")
license_text = (PACKAGE / "LICENSE").read_text(encoding="utf-8")
assert license_text.startswith("PROVISIONAL_OWNER_LICENSE\n") and license_text.endswith(proposed)
records = []
for record in result.sources:
    raw = (PACKAGE / record.path).read_bytes()
    assert record.raw == raw and record.complete and record.valid_utf8
    assert record.sha256 == sha(raw) and record.text == raw.decode("utf-8")
    records.append({"path": record.path, "role": record.role, "sha256": record.sha256,
                    "raw_base64": base64.b64encode(raw).decode("ascii")})
assert len(records) == 2
item_raw = (PACKAGE / located.location.path).read_bytes()
assert json.loads(item_raw[located.location.start_byte:located.location.end_byte]) == item

# Local structural checks only. Registry has no network retrieval callback.
schemas = {}
for name in ("aghr", "item", "common", "capability", "qualification"):
    schemas[name] = load(CONTRACTS / (name + ".schema.json"))
registry = Registry().with_resources((s["$id"], Resource.from_contents(s)) for s in schemas.values())
validators = {k: Draft202012Validator(schemas[k], registry=registry) for k in ("aghr", "item")}
validators["aghr"].validate(manifest)
validators["item"].validate(item)
negative = []
for missing in ("owner", "license"):
    changed = deepcopy(manifest)
    del changed[missing]
    assert not validators["aghr"].is_valid(changed)
    negative.append("manifest_missing_" + missing)
changed = deepcopy(item)
changed["force"] = "MUST"
assert not validators["item"].is_valid(changed)
negative.append("mandatory_item_without_authority")
changed = deepcopy(item)
changed["impact"]["evidence"] = "repo-measured"
assert not validators["item"].is_valid(changed)
negative.append("measured_item_without_calibration_fields")
assert before == snapshot(), "Candidate changed during the E1.c read/structure checks"
print(json.dumps({"status": "VERIFIED_FOR_E1C_PROVISIONAL_READ_AND_STRUCTURE",
                  "source_hash": pin["source_hash"], "package_files": len(before),
                  "reader": {"status": result.status, "validation_status": result.validation_status,
                             "items": [item], "location": asdict(located.location), "sources": records},
                  "structural_schema": {"positive_inputs": 2, "negative_vectors": negative,
                                        "local_schemas": len(schemas), "network_retrieval": False},
                  "provenance": "SOURCE_SNAPSHOT_EXCERPT_AND_FIELD_MAP_CHECKED",
                  "owner_license": "PROVISIONAL_OWNER_LICENSE", "signed_decision": "NOT_SUPPLIED",
                  "source_unchanged": True, "governance_validation": "NOT_RUN",
                  "native_host_qualification": "NOT_RUN", "independent_review": "NOT_PERFORMED",
                  "release_acceptance": "NOT_GRANTED"}, ensure_ascii=False, allow_nan=False))
