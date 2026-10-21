"""Derive progress from canonical records. Read-only; no Git/network/model calls."""
from __future__ import annotations
from pathlib import Path
from runtime.common import check_project, check_state


def progress_report(project: dict, state: dict, root: Path) -> dict:
    errors=check_project(project)+check_state(state,root)
    if project.get("project_id")!=state.get("project_id"):
        errors.append("Project/state identity mismatch")
    if errors:
        return {"status":"FAIL","errors":errors,"overall_compliance_verdict":"NOT_ASSESSED","permission_granted":False}
    criteria={c["id"] for g in state["goals"] for c in g["criteria"] if c["required"]}
    passed={c for check in state["checks"] if check["result"]=="PASS" for c in check["criterion_ids"]}
    failed={c for check in state["checks"] if check["result"] in ("FAIL","ERROR") for c in check["criterion_ids"]}
    # Do not silently choose newer/older contradictory evidence. Reconciliation is required.
    conflicts=sorted(passed & failed);proven=(passed-failed)&criteria
    d=state.get("delivery",{});findings=d.get("findings",[])
    critical=[f["id"] for f in findings if f["severity"]=="CRITICAL" and f["status"]=="OPEN"]
    return {
        "status":"EVIDENCE_CONFLICT" if conflicts else "DERIVED_VIEW",
        "scope":"DECLARED_CANONICAL_SNAPSHOT_ONLY",
        "canonical_backend":project["canonical_backend"],
        "external_snapshot_needs_refresh":project["canonical_backend"]=="DECLARED_EXTERNAL",
        "declared_tasks":len(state["work"]),
        "tasks_with_verified_status":sum(w["status"]=="VERIFIED" for w in state["work"]),
        "required_criteria":len(criteria),"criteria_with_checked_pass_evidence":len(proven),
        "criterion_evidence_fraction":len(proven)/len(criteria) if criteria else None,
        "conflicting_criterion_ids":conflicts,
        "measurement_scope_complete_as_declared":d.get("measurement_scope_complete",False),
        "phase":d.get("phase","UNKNOWN"),"git_observation":d.get("git_observation"),
        "open_findings":sum(f["status"]=="OPEN" for f in findings),"open_critical_findings":critical,
        "overall_compliance_verdict":"NOT_ASSESSED","release_acceptance":"NOT_GRANTED",
        "permission_granted":False,
        "limits":["Valid record/artifact hashes do not authenticate the human decision or evidence producer.",
                  "No live Git, host or model observation; missing telemetry is unknown.",
                  "Task counts and criterion coverage are separate from plan completeness and product acceptance."]}
