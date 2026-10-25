"""Owner-authorized T06 simulation adapter, not the production AGHR CLI.

Use the unchanged E2 pipeline. The caller-owned SourceGrant is simulated and
the unavailable E3 dependency alone is replaced by an explicitly labelled stub.
Never rewrite the returned result/exit code or invoke verification commands.
"""
import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys
from unittest.mock import patch

parser = argparse.ArgumentParser(allow_abbrev=False)
parser.add_argument("--engine-root", required=True)
parser.add_argument("command", choices=("validate",))
parser.add_argument("--strict", action="store_true", required=True)
args = parser.parse_args()
engine = Path(args.engine_root)
sys.path.insert(0, str(engine / "tools"))
from cli import source_identity, response, emit
from catalog import build_catalog, compact_json, serialize_catalog
from loader import read_package, read_support_sources
from scope import ScopeContext
from authority import SourceGrant
from validate import validate_package
import evidence
from jsonschema import Draft202012Validator

raw = sys.stdin.buffer.read(65537)
if len(raw) > 65536:
    raise ValueError("Bounded host fixture exceeded")
host = json.loads(raw)
if host["profile"] != "T06_MOCK_ONLY" or host["fixture_id"] != "OWNER_AUTHORIZED_SEC001_MOCK_20261023":
    raise ValueError("Only the owner-authorized isolated simulation is allowed")
identity = source_identity()
if identity["content_hash"] != host["engine_hash"]:
    raise ValueError("Engine pin mismatch")
root = Path.cwd()
package = read_package(root)
payload = build_catalog(package)
support = read_support_sources(root, tuple((p, "provenance") for p in host["support_hashes"]))
if {s.path: s.sha256 for s in support} != host["support_hashes"]:
    raise ValueError("Mock receipt changed after caller signature verification")
grant = SourceGrant(**{**host["grant"], "item_ids": tuple(host["grant"]["item_ids"])})
source = next(s for s in package.sources if s.path == grant.item_path)
if source.sha256 != grant.source_sha256:
    raise ValueError("Source changed after caller verification")
original = evidence.check_evidence

def explicit_mock_dependency(current, context):
    issues = original(current, context)
    # This substitution is deliberately confined to one signed local fixture.
    # Schema, authority matching, qualifications, calibration and every other
    # finding are still evaluated by the real E2 implementation.
    members = [m for m in current.items if m.value["id"] == "SEC-001"]
    allowed = len(members) == 1 and members[0].location.path == grant.item_path
    if allowed:
        value = members[0].value
        allowed = (value["force"] == "MUST_NOT" and value["severity"] == "critical"
                   and value.get("enforcement", {}).get("gate") == host["gate"]
                   and host["gate"] == {"type": "github-branch-protection", "required": True})
    return [f for f in issues if not (allowed and f["code"] == "ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE"
            and f["item_id"] == "SEC-001" and f["path"] == grant.item_path)]

context = ScopeContext(as_of=host["as_of"])
with patch("evidence.check_evidence", explicit_mock_dependency):
    verification, additional = validate_package(package, root, context, grants=(grant,))
sources = {s.path: s for s in (*package.sources, *support, *additional)}
observed = read_support_sources(root, tuple((s.path, s.role) for s in sources.values()))
if any(s.sha256 != sources[s.path].sha256 for s in observed) or source_identity()["content_hash"] != identity["content_hash"]:
    raise ValueError("Input drift")
digest = lambda v: hashlib.sha256(compact_json(v).encode("utf-8")).hexdigest()
candidate_hash = digest({s.path: s.sha256 for s in sources.values()})
config = {"command": "validate", "strict": True, "profile": "T06_MOCK_ONLY", "host_fixture": host,
          "adapter_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          "context": {**asdict(context), "as_of": str(context.day)}, "trust_grants": [asdict(grant)]}
report = response("validate", verification["result"], verification["exit_code"], identity,
                  data={"catalog": payload, "validation": verification})
report["inputs"] = {"candidate_hash": candidate_hash, "config_hash": digest(config),
                    "inputs_hash": digest({"engine": identity["content_hash"], "candidate": candidate_hash,
                                           "config": digest(config), "schema_closure": payload["schema_closure"]["lock_sha256"]}),
                    "catalog": [{"path": s.path, "sha256": s.sha256, "role": s.role} for s in sorted(sources.values(), key=lambda s: s.path)]}
report["checks"] = {"status": "BLOCKED" if verification["result"] == "BLOCKED" else "COMPLETE",
                    "reason": "T06_MOCK_ONLY: caller authority and required-gate dependency simulated; real enterprise authority, native gate enforcement, E3 doctor and E4 qualification NOT_VERIFIED."}
report["diagnostics"] = [{**issue, "stage": "E2.e"} for issue in verification["findings"] if issue["disposition"] != "WARNING"]
Draft202012Validator(json.loads((engine / "CLI_CONTRACT.json").read_text(encoding="utf-8"))).validate(report)
serialize_catalog(report)
print("T06_MOCK_ONLY: local simulation; never a production enforcement or enterprise-authority verdict.", file=sys.stderr)
raise SystemExit(emit(report, "json"))
