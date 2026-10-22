"""One-time E1.d custody tool. Never imported or executed by the app/CLI.

Copies locked contract.1 bytes. Ref traversal follows JSON Schema positions,
not default/example/const instance data. No schema evaluation or network.
"""

import hashlib
import json
from pathlib import Path
import re
from urllib.parse import unquote, urldefrag, urljoin

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "governance_packages/candidates/AGHR_rc3_Core_Candidate/schemas"
CONTRACTS = ROOT / "docs/contracts/aghr-rc3"
EVIDENCE = Path(__file__).resolve().parent
assert (EVIDENCE / "PREFLIGHT.json").is_file()


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def walk(schema, pointer=""):
    if not isinstance(schema, dict):
        return
    yield pointer, schema
    for key in ("$defs", "definitions", "properties", "patternProperties", "dependentSchemas"):
        for name, child in schema.get(key, {}).items():
            escaped = name.replace("~", "~0").replace("/", "~1")
            yield from walk(child, pointer + "/" + key + "/" + escaped)
    for key in ("allOf", "anyOf", "oneOf", "prefixItems"):
        for i, child in enumerate(schema.get(key, [])):
            yield from walk(child, pointer + "/" + key + "/" + str(i))
    for key in ("items", "contains", "not", "if", "then", "else", "additionalProperties",
                "unevaluatedProperties", "propertyNames", "unevaluatedItems", "contentSchema"):
        if key in schema:
            yield from walk(schema[key], pointer + "/" + key)


lock_raw = (CONTRACTS / "CONTRACTS.lock.json").read_bytes()
lock = json.loads(lock_raw)
assert lock["contract_revision"] == "contract.1"
files = [row for row in lock["files"] if row["path"].endswith(".schema.json")]
assert len(files) == 16
raws, schemas = {}, {}
for row in files:
    raw = (ROOT / row["path"]).read_bytes()
    assert sha(raw) == row["sha256"] and len(raw) == row["bytes"]
    name = Path(row["path"]).name
    raws[name], schemas[name] = raw, json.loads(raw)
ids = {value["$id"]: name for name, value in schemas.items()}
assert len(ids) == len(schemas)
reference_raw = (ROOT / "docs/specs/aghr-rc3/AGHR_REFERENCE.md").read_bytes()
lines = reference_raw.decode("utf-8").splitlines()
start = lines.index("### 3.2 Canonical Item Schema (Complete)")
end = lines.index("### 3.3 Field-Severity Tiers (Minimum Required Fields)")
fields = [(i + 1, re.match(r"^([A-Za-z][A-Za-z0-9]*):", lines[i]).group(1))
          for i in range(start, end) if re.match(r"^([A-Za-z][A-Za-z0-9]*):", lines[i])]
assert len(fields) == 17 and len({name for _, name in fields}) == 17
item = schemas["item.schema.json"]
assert all(name in item["properties"] for _, name in fields)
kinds = []
for i, line in enumerate(lines):
    if re.match(r"^\| [0-9]+ \| \*\*[A-Z]+\*\* \|", line):
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        number, name = int(cells[0]), cells[1].strip("*")
        kinds.append({"name": name, "group": "core" if number <= 6 else "advanced",
                      "synonyms": cells[2], "function": cells[3], "typical_location": cells[4],
                      "reference_line": i + 1})
assert [k["name"] for k in kinds] == item["properties"]["kind"]["enum"] and len(kinds) == 13
honesty = [{"id": "HON-" + str(n + 1), "requirement": line.strip()[2:],
            "reference_line": i + 1, "runtime_status": "REQUIRED / NOT_RUN / NOT_WAIVED"}
           for n, (i, line) in enumerate((i, line) for i, line in enumerate(lines)
                                        if 637 <= i < 644 and line.strip().startswith("- "))]
assert len(honesty) == 7
model = {"model_revision": "rc3-contract.1-model.1", "target_spec_version": "1.0.0-rc.3",
         "schema_version": "1.2", "reference": {"repository_path": "docs/specs/aghr-rc3/AGHR_REFERENCE.md",
                                                 "sha256": sha(reference_raw)},
         "fields": [{"name": name, "reference_line": line,
                     "schema_path": "item.schema.json", "schema_pointer": "/properties/" + name,
                     "required_unconditionally": name in item["required"]} for line, name in fields],
         "specialized_fields": [{"name": name, "schema_path": "item.schema.json",
                                 "schema_pointer": "/properties/" + name}
                                for name in item["properties"] if name not in {f for _, f in fields}],
         "kinds": kinds, "forces": item["properties"]["force"]["enum"],
         "severities": item["properties"]["severity"]["enum"], "honesty_checks": honesty,
         "semantics": "Inventory and source projection only. Conditions remain in the original schemas. No defaults or authority are inferred; validation and runtime qualification are NOT_RUN."}
model_raw = encoded(model)
entries, reference_count = [], 0
for name, schema in sorted(schemas.items()):
    refs = []
    for pointer, node in walk(schema):
        for keyword in ("$ref", "$dynamicRef"):
            if keyword not in node:
                continue
            uri, fragment = urldefrag(urljoin(schema["$id"], node[keyword]))
            assert uri in ids, (name, pointer, node[keyword])
            target = schemas[ids[uri]]
            if fragment:
                assert fragment.startswith("/"), "Anchors need an explicit closure extension"
                for part in unquote(fragment).split("/")[1:]:
                    part = part.replace("~1", "/").replace("~0", "~")
                    target = target[int(part)] if isinstance(target, list) else target[part]
            assert isinstance(target, (dict, bool)), "Reference must identify a schema"
            refs.append({"pointer": pointer + "/" + keyword, "reference": node[keyword],
                         "target_path": ids[uri], "fragment": fragment})
    reference_count += len(refs)
    entries.append({"path": name, "bytes": len(raws[name]), "sha256": sha(raws[name]),
                    "source_path": "docs/contracts/aghr-rc3/" + name,
                    "schema_id": schema["$id"], "dialect": schema["$schema"], "references": refs})
closure = {"closure_revision": "rc3-contract.1-schemas.1", "contract_revision": "contract.1",
           "schema_version": "1.2", "source_lock": {"repository_path": "docs/contracts/aghr-rc3/CONTRACTS.lock.json",
                                                    "sha256": sha(lock_raw)},
           "copy_policy": "Raw byte copies; original $id/$ref preserved; no automatic rebuild or network retrieval",
           "files": entries, "local_reference_count": reference_count,
           "model_index": {"path": "MODEL_INDEX.json", "bytes": len(model_raw), "sha256": sha(model_raw)}}
closure_raw = encoded(closure)
OUT.mkdir(exist_ok=False)
for name, raw in raws.items():
    with (OUT / name).open("xb") as stream:
        stream.write(raw)
for name, raw in (("MODEL_INDEX.json", model_raw), ("SCHEMAS.lock.json", closure_raw)):
    with (OUT / name).open("xb") as stream:
        stream.write(raw)
receipt = {"status": "BYTE_IDENTICAL_LOCAL_CLOSURE", "schemas": len(entries),
           "local_references": reference_count, "main_fields": len(fields), "kinds": len(kinds),
           "specialized_fields": len(model["specialized_fields"]), "honesty_checks": len(honesty),
           "closure_sha256": sha(closure_raw), "source_lock_sha256": sha(lock_raw),
           "model_sha256": sha(model_raw), "schema_evaluation": "NOT_RUN", "files": entries}
(EVIDENCE / "SCHEMA_CLOSURE.json").write_bytes(encoded(receipt))
print(json.dumps({k: v for k, v in receipt.items() if k != "files"}))
