"""Portable read projection. No governance evaluation, activation or disk writes."""

import base64
from copy import deepcopy
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import stat

from diagnostics import fail

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_LOCK_SHA256 = "56748ef28ef23b011f5aa4134ee3c2975a3c668e8cb0b32512b83f6f7c2e0ce8"
MAX_OUTPUT_BYTES = 64 * 1024 * 1024


def compact_json(value):
    # Stable transport encoding, not CP/JCS canonicalization.
    # https://docs.python.org/3.12/library/json.html#json.dumps
    return json.dumps(value, ensure_ascii=False, allow_nan=False, sort_keys=True, separators=(",", ":"))


def load_assets(asset_root=None):
    """Read only the owned, hash-anchored contract copies; never fetch a $ref."""
    root = ROOT / "schemas" if asset_root is None else Path(asset_root)

    def read(name, expected):
        path = root / name
        try:
            info = path.lstat()
            if (root.is_symlink() or root.is_junction() or path.is_symlink() or path.is_junction()
                    or not stat.S_ISREG(info.st_mode) or info.st_size > 1024 * 1024):
                fail("SCHEMA_ASSET_UNAVAILABLE", "Owned schema asset is not a bounded regular file.", "schemas/" + name)
            raw = path.read_bytes()
        except OSError:
            fail("SCHEMA_ASSET_UNAVAILABLE", "Cannot read the complete owned schema closure.", "schemas/" + name)
        if hashlib.sha256(raw).hexdigest() != expected:
            fail("SCHEMA_ASSET_MISMATCH", "Owned schema asset does not match the frozen revision.", "schemas/" + name)
        return json.loads(raw.decode("utf-8"))

    lock = read("SCHEMAS.lock.json", SCHEMA_LOCK_SHA256)
    for entry in lock["files"]:
        read(entry["path"], entry["sha256"])
    model = read(lock["model_index"]["path"], lock["model_index"]["sha256"])
    return lock, model


def source_record(source):
    return {"path": source.path, "role": source.role, "sha256": source.sha256,
            "raw_base64": base64.b64encode(source.raw).decode("ascii"), "text": source.text,
            "complete": source.complete, "valid_utf8": source.valid_utf8}


def build_catalog(package, *, asset_root=None):
    """Preserve source shape and distinguish missing fields from explicit null.

    Unknown kinds/fields are retained for E2. Declared qualification/evidence
    values remain source data, never qualified or verified observations.
    """
    lock, model = load_assets(asset_root)
    fields = [field["name"] for field in model["fields"]]
    extensions = {field["name"] for field in model["specialized_fields"]}
    items = []
    for item in package.items:
        value = item.value
        projected = {name: {"presence": "PRESENT", "value": deepcopy(value[name])}
                     if name in value else {"presence": "ABSENT"} for name in fields}
        items.append({"value": deepcopy(value), "location": asdict(item.location),
                      "fields": projected,
                      "other_fields": {name: {"known_to_model": name in extensions, "value": deepcopy(v)}
                                       for name, v in value.items() if name not in fields},
                      "kind_in_model": any(value.get("kind") == row["name"] for row in model["kinds"]),
                      "validation_status": "NOT_RUN"})
    sources = [source_record(source) for source in package.sources]
    mapping = {source["path"]: source["sha256"] for source in sources}
    read_set_hash = hashlib.sha256(compact_json(mapping).encode("utf-8")).hexdigest()
    documents = [{"source_path": file.source.path, "role": file.source.role,
                  "document": document.location.document, "value": deepcopy(document.value),
                  "location": asdict(document.location)}
                 for file in package.files for document in file.documents]
    return {"catalog_version": "1", "status": "READ", "validation_status": "NOT_RUN",
            "trust_status": "NOT_EVALUATED", "qualification_status": "NOT_RUN",
            "read_set_hash": read_set_hash, "read_set_hash_algorithm": "sha256-path-map-v1",
            "read_set_hash_scope": "Raw bytes of the selected read set only; not a governing candidate/config/inputs hash",
            "selection": {"mode": package.selection_mode, "source_paths": list(package.source_paths)},
            "manifest": {"value": deepcopy(package.manifest.value), "location": asdict(package.manifest.location)},
            "schema_closure": {"lock_sha256": SCHEMA_LOCK_SHA256, **lock}, "model": model,
            "sources": sources, "documents": documents, "items": items,
            "auxiliary_paths": [file.source.path for file in package.auxiliary]}


def serialize_catalog(catalog):
    encoded = compact_json(catalog)
    if len(encoded.encode("utf-8")) > MAX_OUTPUT_BYTES:
        fail("CATALOG_OUTPUT_LIMIT", "Catalog exceeds the bounded transport size.", ".")
    return encoded
