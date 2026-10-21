"""Governed Project Inbox (_INBOX/) — Safe submission discovery, registration and lifecycle."""
from __future__ import annotations
import hashlib
import json
import os
import re
import threading
import zipfile
from pathlib import Path
from typing import Any

from runtime.common import (
    ROOT, GovernanceError, digest, load, now, replace_json, safe_path, save_new, sha, shape
)

_INBOX_LOCK = threading.RLock()
VALID_DISPOSITIONS = {"ADOPT", "RECONCILE", "REJECT", "DEFER", "HOLD", "REFERENCE_ONLY"}
UNTRUSTED_PATTERNS = [
    re.compile(r'"auto_approve"\s*:\s*true', re.I),
    re.compile(r'"approved"\s*:\s*true', re.I),
    re.compile(r'"status"\s*:\s*"APPROVED"', re.I),
    re.compile(r'"release_acceptance"\s*:\s*"RELEASE_ACCEPTED"', re.I),
    re.compile(r'"independent_review"\s*:\s*"APPROVED"', re.I),
    re.compile(r'grant\s+unconditional\s+execution', re.I),
    re.compile(r'bypass\s+governance', re.I)
]


def _registry_path(project: Path) -> Path:
    return safe_path(project, ".aghr/intake/inbox_registry.json")


def _load_registry(project: Path) -> dict[str, Any]:
    path = _registry_path(project)
    if path.exists():
        record = load(path)
        if not isinstance(record, dict) or not isinstance(record.get("items"), dict):
            raise GovernanceError("Invalid inbox registry; preserve and reconcile it")
        return record
    return {"schema_version": "1.0", "items": {}}


def _save_registry(project: Path, reg: dict[str, Any]) -> None:
    path = _registry_path(project)
    replace_json(path, reg)


def _check_zip_safety(path: Path) -> tuple[bool, str, int]:
    """Inspect ZIP archive members for traversal without extracting."""
    try:
        with zipfile.ZipFile(path, "r") as z:
            infos = z.infolist()
            total_size = sum(info.file_size for info in infos)
            for info in infos:
                name = info.filename
                if name.startswith(("/", "\\")):
                    return False, f"Absolute path member: {name}", total_size
                if ".." in name.split("/") or ".." in name.split("\\"):
                    return False, f"Directory traversal member: {name}", total_size
                if "\\" in name:
                    return False, f"Non-portable Windows backslash in member: {name}", total_size
            return True, "SAFE_ARCHIVE", total_size
    except zipfile.BadZipFile as exc:
        return False, f"Bad zip archive: {exc}", 0


def _check_untrusted_claims(path: Path) -> list[str]:
    claims = []
    if path.suffix in {".md", ".json", ".txt", ".html", ".xml", ".yaml", ".yml"}:
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
            for pat in UNTRUSTED_PATTERNS:
                if pat.search(content):
                    claims.append(f"Untrusted authority assertion matched pattern: {pat.pattern}")
        except Exception:
            pass
    return claims


def scan_inbox(project: Path) -> dict[str, Any]:
    """Discover and catalog files in _INBOX/ without granting any execution authority."""
    project = project.resolve()
    inbox = project / "_INBOX"
    if not inbox.is_dir():
        return {
            "status": "INBOX_NOT_FOUND",
            "inbox_path": "_INBOX",
            "message": "_INBOX directory does not exist in project root",
            "items": [],
            "total_count": 0
        }

    registry = _load_registry(project).get("items", {})
    known_digests = {item.get("sha256"): req_id for req_id, item in registry.items() if "sha256" in item}

    items = []
    seen_hashes_in_scan: dict[str, str] = {}
    canonical_files = {p.relative_to(project).as_posix() for p in project.rglob("*") if p.is_file() and not p.relative_to(project).as_posix().startswith(("_INBOX/", ".aghr/", ".git/"))}
    ref_dir = project / ".aghr/reference"
    if ref_dir.is_dir():
        for p in ref_dir.rglob("*"):
            if p.is_file() and not p.name.endswith(".pyc"):
                canonical_files.add(p.relative_to(ref_dir).as_posix())

    for child in sorted(inbox.iterdir(), key=lambda p: p.name):
        if child.name in {".gitkeep", "README.md"}:
            continue

        item_info: dict[str, Any] = {
            "name": child.name,
            "relative_path": f"_INBOX/{child.name}",
            "is_symlink": child.is_symlink(),
            "status": "PENDING_CLASSIFICATION",
            "conflicts": [],
            "untrusted_claims": []
        }

        if child.is_symlink():
            item_info["status"] = "SYMLINK_REJECTED"
            item_info["error"] = "Symlinks inside _INBOX are strictly rejected"
            items.append(item_info)
            continue

        if not child.is_file():
            item_info["status"] = "DIRECTORY_IGNORED"
            item_info["note"] = "Subdirectories in _INBOX require archive packaging or explicit structure"
            items.append(item_info)
            continue

        # In-flight modification check (read before and after)
        try:
            stat_1 = child.stat()
            digest_1 = sha(child)
            stat_2 = child.stat()
            digest_2 = sha(child)
            if stat_1.st_mtime != stat_2.st_mtime or digest_1 != digest_2:
                item_info["status"] = "IN_FLIGHT_MUTATION_DETECTED"
                item_info["error"] = "File changed while being fingerprinted; drop is still in progress"
                items.append(item_info)
                continue
        except (OSError, ValueError) as exc:
            item_info["status"] = "READ_ERROR"
            item_info["error"] = str(exc)
            items.append(item_info)
            continue

        item_info["sha256"] = digest_1
        item_info["bytes"] = stat_1.st_size
        item_info["modified_at"] = stat_1.st_mtime

        # Check archive safety
        if child.suffix == ".zip":
            is_safe, reason, uncompressed = _check_zip_safety(child)
            item_info["is_archive"] = True
            item_info["archive_safe"] = is_safe
            item_info["uncompressed_bytes"] = uncompressed
            if not is_safe:
                item_info["status"] = "UNSAFE_ARCHIVE_REJECTED"
                item_info["error"] = reason
                items.append(item_info)
                continue

        # Check untrusted authority claims
        claims = _check_untrusted_claims(child)
        if claims:
            item_info["untrusted_claims"] = claims
            item_info["untrusted_authority_flag"] = True

        # Check potential conflict with existing canonical files
        target_candidates = [child.name]
        if child.name.startswith("override_"):
            target_candidates.append(child.name[len("override_"):])
        for cname in target_candidates:
            matches = [cf for cf in canonical_files if cf == cname or cf.endswith("/" + cname)]
            if matches:
                item_info["conflicts"].append({
                    "conflict_type": "CANONICAL_OVERWRITE_PREVENTED",
                    "existing_paths": matches,
                    "action_required": "Must be reviewed as RECONCILE or REPLACE; direct overwrite is blocked."
                })

        # Check duplicate
        if digest_1 in seen_hashes_in_scan:
            item_info["status"] = "DUPLICATE_IN_CURRENT_DROP"
            item_info["duplicate_of"] = seen_hashes_in_scan[digest_1]
        elif digest_1 in known_digests:
            item_info["status"] = "ALREADY_REGISTERED"
            item_info["registered_request_id"] = known_digests[digest_1]
        else:
            seen_hashes_in_scan[digest_1] = child.name
            if item_info["conflicts"]:
                item_info["status"] = "CONFLICT_DETECTED"
            elif item_info["untrusted_claims"]:
                item_info["status"] = "UNTRUSTED_ASSERTION_FLAGGED"
            else:
                item_info["status"] = "READY_FOR_INTAKE"

        items.append(item_info)

    return {
        "status": "INBOX_SCAN_COMPLETED",
        "inbox_path": "_INBOX",
        "scanned_at": now(),
        "total_items": len(items),
        "ready_for_intake": sum(x["status"] == "READY_FOR_INTAKE" for x in items),
        "conflicts_detected": sum(bool(x.get("conflicts")) for x in items),
        "untrusted_claims_detected": sum(bool(x.get("untrusted_claims")) for x in items),
        "items": items,
        "governance_rule": "SUBMISSION_IS_NEVER_AN_EXECUTION_GRANT",
        "limits": [
            "Discovering a file in _INBOX does not grant execution or approve changes.",
            "Original submissions are preserved in immutable custody.",
            "Canonical documents cannot be overwritten without competent reviewed adoption."
        ]
    }


def register_inbox_item(
    project: Path,
    filename: str,
    *,
    requester: str = "OWNER",
    classification: str = "PROPOSAL",
    notes: str = ""
) -> dict[str, Any]:
    """Capture an inbox submission into an immutable .aghr/intake/ request record."""
    with _INBOX_LOCK:
        project = project.resolve()
        item_path = safe_path(project, f"_INBOX/{filename}", must_exist=True)

        if item_path.is_symlink():
            raise GovernanceError("Symlink cannot be registered")
        if not item_path.is_file():
            raise GovernanceError("Regular inbox file required")
        if item_path.suffix.lower() == '.zip':
            safe, reason, _ = _check_zip_safety(item_path)
            if not safe:raise GovernanceError(reason)

        digest_val = sha(item_path)
        req_id = f"REQ-INBOX-{digest_val[:12]}"
        intake_file = safe_path(project, f".aghr/intake/{req_id}.json")

        reg = _load_registry(project)
        if req_id in reg.get("items", {}) and intake_file.exists():
            prior = load(intake_file)
            indexed = reg['items'][req_id]
            if prior.get('source', {}).get('sha256') != digest_val or (indexed.get('request_sha256') and sha(intake_file) != indexed['request_sha256']):
                raise GovernanceError('Previously captured inbox request changed')
            return {
                "status": "ALREADY_REGISTERED",
                "request_id": req_id,
                "path": intake_file.relative_to(project).as_posix(),
                "sha256": digest_val,
                "execution": "NOT_AUTHORIZED_BY_CAPTURE"
            }
        if req_id in reg.get('items', {}) and not intake_file.exists():
            raise GovernanceError('Indexed inbox request is missing; explicit reconciliation required')

        claims = _check_untrusted_claims(item_path)
        if sha(item_path) != digest_val:
            raise GovernanceError("Inbox file changed during registration")

        request_record = {
            "schema_version": "1.0",
            "request_id": req_id,
            "mode": "REVIEW",
            "source": {
                "locator": f"_INBOX/{filename}",
                "sha256": digest_val,
                "captured_at": now(),
                "available_scope": f"Inbox drop item '{filename}' captured from _INBOX without execution grant."
            },
            "original_text": f"Inbox submission: {filename}. Requester: {requester}. Notes: {notes or 'None'}",
            "goal": f"Evaluate and reconcile inbox submission '{filename}'.",
            "scope": [f"Read and evaluate _INBOX/{filename}"],
            "exclusions": [
                "No automatic execution",
                "No automatic replacement of canonical assets",
                "No publication"
            ],
            "authority_ref": None,
            "acceptance_criteria": [
                "Submission evaluated against current canonical baseline without silent overwrite."
            ],
            "items": [],
            "clarifications": []
        }

        errors = shape(request_record, "REQUEST")
        if errors:
            raise GovernanceError(f"Generated intake record invalid: {'; '.join(errors)}")

        recovered = False
        if intake_file.exists():
            prior = load(intake_file)
            if shape(prior, "REQUEST") or prior.get("source", {}).get("sha256") != digest_val or prior.get("request_id") != req_id:
                raise GovernanceError("Existing inbox request cannot be reconciled safely")
            recovered = True
        else:
            save_new(intake_file, request_record)

        # Update inbox registry
        reg.setdefault("items", {})[req_id] = {
            "filename": filename,
            "sha256": digest_val,
            "request_sha256": sha(intake_file),
            "captured_at": now(),
            "classification": classification,
            "disposition": "PENDING_REVIEW",
            "disposition_rationale": None,
            "authority_ref": None,
            "has_untrusted_claims": bool(claims),
            "untrusted_claims": claims
        }
        _save_registry(project, reg)

        return {
            "status": "RECOVERED_REGISTRY" if recovered else "CAPTURED",
            "request_id": req_id,
            "path": intake_file.relative_to(project).as_posix(),
            "sha256": digest_val,
            "promotion": "NONE",
            "execution": "NOT_AUTHORIZED_BY_CAPTURE",
            "has_untrusted_claims": bool(claims)
        }


def resolve_inbox_disposition(
    project: Path,
    request_id: str,
    *,
    disposition: str,
    rationale: str,
    authority_ref: str
) -> dict[str, Any]:
    """Record a formal disposition for an inbox item."""
    with _INBOX_LOCK:
        if disposition not in VALID_DISPOSITIONS:
            raise GovernanceError(f"Invalid disposition '{disposition}'. Must be one of {sorted(VALID_DISPOSITIONS)}")
        if not rationale.strip():
            raise GovernanceError("Disposition requires a clear, non-empty rationale")
        if not authority_ref.strip():
            raise GovernanceError("Disposition requires a valid authority reference")

        project = project.resolve()
        reg = _load_registry(project)
        items = reg.get("items", {})
        if request_id not in items:
            raise GovernanceError(f"Inbox request ID not found: {request_id}")

        intake_file = safe_path(project, f".aghr/intake/{request_id}.json", must_exist=True)
        rec = load(intake_file)
        if shape(rec, "REQUEST"):
            raise GovernanceError("Historical or invalid request requires explicit migration before disposition")
        expected = items[request_id].get('request_sha256')
        if expected and sha(intake_file) != expected:
            raise GovernanceError('Captured inbox request changed before disposition')
        decision = {"request_id": request_id, "request_sha256": sha(intake_file), "disposition": disposition,
                    "rationale": rationale, "authority_ref": authority_ref}
        decision_path = safe_path(project, f".aghr/intake/inbox-decisions/{request_id}/{digest(decision)}.json")
        if decision_path.exists():
            existing = load(decision_path)
            if any(existing.get(key) != value for key, value in decision.items()):
                raise GovernanceError("Existing decision identity mismatch")
        else:
            save_new(decision_path, {**decision, "recorded_at": now(), "authority_authentication": "NOT_PERFORMED_BY_LOCAL_TOOL"})

        # Update registry entry
        items[request_id]["disposition"] = disposition
        items[request_id]["disposition_rationale"] = rationale
        items[request_id]["authority_ref"] = authority_ref
        items[request_id]["disposed_at"] = now()
        items[request_id]["decision_ref"] = decision_path.relative_to(project).as_posix()
        _save_registry(project, reg)

        return {
            "status": "DISPOSITION_RECORDED",
            "request_id": request_id,
            "disposition": disposition,
            "authority_ref": authority_ref,
            "rationale": rationale,
            "decision_ref": decision_path.relative_to(project).as_posix(),
            "authority_authentication": "NOT_PERFORMED_BY_LOCAL_TOOL",
            "execution": "REQUIRES_SEPARATE_AUTHORIZED_WORK_ITEM" if disposition == "ADOPT" else "NOT_APPLICABLE"
        }
