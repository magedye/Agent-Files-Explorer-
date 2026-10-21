"""Bounded skill-result checks against task criteria and existing EVIDENCE records.

These checks inspect recorded local artifacts. They never authenticate the
producer, grant an effect, attest native skill activation, or accept a release.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

from runtime.common import ROOT, GovernanceError, canonical, check_evidence, load, safe_path, sha


def _has_content(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict)):
        values = value.values() if isinstance(value, dict) else value
        return bool(value) and any(_has_content(item) for item in values)
    return isinstance(value, (bool, int, float))


def _criterion_passes(criterion: dict, value: Any) -> bool:
    operator = criterion.get("operator")
    if operator == "nonempty":
        return _has_content(value)
    if operator == "equals" and "expected" in criterion:
        return canonical(value) == canonical(criterion["expected"])
    if operator == "contains":
        expected = criterion.get("expected")
        return isinstance(value, str) and isinstance(expected, str) and bool(expected.strip()) and expected in value
    return False


def verify_skill_result(
    skill_id: str,
    execution_result: dict[str, Any],
    task_criteria: list[dict[str, Any]] | None = None,
    registry: dict[str, Any] | None = None,
    root: Path | None = None,
    *,
    evidence_root: Path | None = None,
    candidate_sha256: str | None = None,
    environment_id: str | None = None,
) -> dict[str, Any]:
    """PASS requires explicit success, evaluated criteria and matching artifacts.

    Expected candidate/environment and evidence root are caller-supplied context,
    separate from the result being checked. File hashes establish integrity,
    not the truth of a producer's account or permission to perform an action.
    """
    findings: list[str] = []
    passed_criteria: list[str] = []
    reg = registry if registry is not None else load((root or ROOT) / "optional_skills/REGISTER.json")
    skill = next((row for row in reg.get("skills", []) if row.get("id") == skill_id), None)
    if skill is None:
        findings.append(f"NOT_FOUND: unregistered skill '{skill_id}'")
    if not isinstance(execution_result, dict):
        execution_result = {}
        findings.append("Execution result must be an object")
    try:
        canonical(execution_result)
    except (GovernanceError, RecursionError):
        findings.append("Execution result must contain finite, acyclic JSON data")
        execution_result = {}
    if execution_result.get("status") != "SUCCESS":
        findings.append("Explicit execution status SUCCESS is required; UNKNOWN is not success")
    if execution_result.get("skill_id") != skill_id:
        findings.append("Execution skill_id must match the selected registered skill")
    run_id = execution_result.get("run_id")
    if not isinstance(run_id, str) or not run_id.strip():
        findings.append("Execution run_id is required")
    if not evidence_root or not candidate_sha256 or not environment_id:
        findings.append("Expected evidence root, candidate digest and environment are required")
    if execution_result.get("candidate_sha256") != candidate_sha256:
        findings.append("Execution candidate does not match expected candidate")
    if execution_result.get("environment_id") != environment_id:
        findings.append("Execution environment does not match expected environment")

    receipt = execution_result.get("execution_record")
    if not isinstance(receipt, dict) or not evidence_root:
        findings.append("A hashed execution_record artifact is required")
        receipt = {}
    else:
        try:
            receipt_path = safe_path(evidence_root, receipt.get("path", ""), must_exist=True)
            if sha(receipt_path) != receipt.get("sha256"):
                findings.append("Execution record digest mismatch")
            recorded = load(receipt_path)
            for field in ("run_id", "skill_id", "status", "candidate_sha256", "environment_id", "outputs", "side_effects"):
                if field not in recorded or canonical(recorded[field]) != canonical(execution_result.get(field)):
                    findings.append(f"Execution record does not match result field: {field}")
        except (GovernanceError, OSError, TypeError, KeyError) as exc:
            findings.append(f"Execution record: {exc}")

    outputs = execution_result.get("outputs")
    if not isinstance(outputs, dict):
        findings.append("Outputs must be an object")
        outputs = {}
    expected_outputs = (skill or {}).get("output_criteria", [])
    if not expected_outputs:
        findings.append("Registered skill must define expected output criteria")
    for key in expected_outputs:
        if key not in outputs or not _has_content(outputs[key]):
            findings.append(f"Missing or empty expected skill deliverable: {key}")

    required: dict[str, dict] = {}
    content_passes: set[str] = set()
    criterion_ids: set[str] = set()
    if not isinstance(task_criteria, list) or not task_criteria:
        findings.append("Nonempty task_criteria are required")
        task_criteria = []
    for criterion in task_criteria:
        if not isinstance(criterion, dict):
            findings.append("Task criterion must be an object")
            continue
        cid, key = criterion.get("id"), criterion.get("output_key")
        if not isinstance(cid, str) or not cid.strip() or cid in criterion_ids:
            findings.append("Task criterion IDs must be nonempty and unique")
            continue
        criterion_ids.add(cid)
        if not isinstance(criterion.get("required", True), bool):
            findings.append(f"Criterion {cid}: required must be boolean")
            continue
        if not isinstance(key, str) or not key or criterion.get("operator") not in ("nonempty", "equals", "contains"):
            findings.append(f"Criterion {cid}: explicit output_key and supported operator are required")
            continue
        if criterion.get("operator") in ("equals", "contains") and "expected" not in criterion:
            findings.append(f"Criterion {cid}: expected value is required")
            continue
        if criterion.get("required", True):
            required[cid] = criterion
            try:
                if key not in outputs or not _criterion_passes(criterion, outputs[key]):
                    findings.append(f"Task criterion not satisfied: {cid}")
                else:
                    content_passes.add(cid)
            except (GovernanceError, RecursionError):
                findings.append(f"Invalid criterion value: {cid}")
    if not required:
        findings.append("At least one required task criterion is necessary")
    covered_outputs = {criterion["output_key"] for criterion in required.values()}
    for key in expected_outputs:
        if key not in covered_outputs:
            findings.append(f"Expected output has no required acceptance criterion: {key}")

    rows = execution_result.get("evidence")
    if not isinstance(rows, list) or not rows:
        findings.append("Nonempty EVIDENCE records are required")
        rows = []
    seen: set[str] = set()
    valid_passes: set[str] = set()
    negative: set[str] = set()
    for row in rows:
        if not isinstance(row, dict):
            findings.append("Evidence record must be an object")
            continue
        eid = row.get("id")
        if not isinstance(eid, str) or eid in seen:
            findings.append("Evidence IDs must be nonempty and unique")
            continue
        seen.add(eid)
        if not evidence_root or not candidate_sha256 or not environment_id:
            continue
        try:
            issues = check_evidence(row, evidence_root, candidate_sha256, environment_id)
        except (GovernanceError, OSError, TypeError, KeyError) as exc:
            issues = [str(exc)]
        findings.extend(f"Evidence {eid}: {issue}" for issue in issues)
        if issues:
            continue
        if receipt and receipt not in row["artifacts"]:
            findings.append(f"Evidence {eid}: execution record must be linked as an artifact")
            continue
        ids = set(row["criterion_ids"])
        if row["candidate_sha256"] != candidate_sha256 or row["environment_id"] != environment_id:
            findings.append(f"Evidence {eid}: candidate/environment mismatch")
            continue
        if row["result"] == "PASS":
            valid_passes.update(ids)
        elif row["result"] in ("FAIL", "ERROR", "BLOCKED", "NOT_RUN"):
            negative.update(ids)
    for cid in required:
        if cid not in valid_passes:
            findings.append(f"Criterion lacks matching PASS artifact evidence: {cid}")
        elif cid in negative:
            findings.append(f"Conflicting or unexecuted evidence for required criterion: {cid}")
        elif cid in content_passes:
            passed_criteria.append(cid)

    effects = execution_result.get("side_effects")
    if not isinstance(effects, list):
        findings.append("Explicit side_effects observation list is required")
    elif any(not isinstance(effect, dict) or effect.get("authorized") is not True for effect in effects):
        findings.append("Unauthorized or unassessed side effect reported")
    verified = not findings
    return {
        "verified": verified,
        "verdict": "PASS" if verified else "FAIL",
        "findings": findings,
        "passed_criteria": sorted(passed_criteria),
        "verification_scope": "RECORDED_LOCAL_ARTIFACTS_ONLY",
        "host_qualification": "NOT_RUN",
        "effective_authority": "NONE_FROM_VALIDATOR",
    }
