"""Explicitly synthetic artifacts for local skill-result checks, not host proof."""
import datetime as dt
import json
from pathlib import Path

from runtime.common import ROOT, load, sha


def recorded_result(project: Path, skill_id="agent-tool-security", *, run_id="fixture-run-1", outputs=None,
                    candidate_sha256="a" * 64, environment_id="LOCAL_SCRIPTED_FIXTURE", status="SUCCESS"):
    skill = next(s for s in load(ROOT / "optional_skills/REGISTER.json")["skills"] if s["id"] == skill_id)
    if outputs is None:
        outputs = {key: "Synthetic local check completed" for key in skill["output_criteria"]}
    criteria = [{"id": f"AC-{n}", "required": True, "output_key": key, "operator": "contains", "expected": "completed"}
                for n, key in enumerate(outputs, 1)]
    stamp = dt.datetime.now(dt.timezone.utc).isoformat()
    result = {"run_id": run_id, "skill_id": skill_id, "status": status, "candidate_sha256": candidate_sha256,
              "environment_id": environment_id, "outputs": outputs, "side_effects": []}
    path = project / f"{run_id}.json"
    path.write_text(json.dumps(result, ensure_ascii=False) + "\n", encoding="utf-8")
    receipt = {"path": path.name, "sha256": sha(path)}
    result["execution_record"] = receipt
    result["evidence"] = [{"id": f"EV-{run_id}", "criterion_ids": [c["id"] for c in criteria], "kind": "INSPECTION",
                           "result": "PASS" if status == "SUCCESS" else "FAIL", "candidate_sha256": candidate_sha256, "environment_id": result["environment_id"],
                           "started_at": stamp, "finished_at": stamp, "command_or_method": "Synthetic local fixture inspection",
                           "target_count": len(outputs), "tests_executed": 0, "artifacts": [receipt],
                           "limitations": ["Not a native host/model qualification"], "producer": "local-test-fixture"}]
    context = {"root": ROOT, "evidence_root": project, "candidate_sha256": candidate_sha256,
               "environment_id": result["environment_id"]}
    return result, criteria, context


def host_inventory(*skills):
    return {"host": {"id": "SCRIPTED_HOST", "version": "fixture-v1", "observation_ref": "urn:synthetic:host-metadata"},
            "completeness": "PARTIAL", "skills": list(skills)}


def host_skill(sid="fixture:user:review", *, capability="tool_security", available="AVAILABLE", source="USER"):
    return {"id": sid, "name": "shared-name", "version": "fixture-v1", "source_kind": source,
            "locator": "host-owned locator; AGHR must not read it", "presence": "ABSENT" if source == "CATALOG" else "PRESENT",
            "session_availability": "NOT_AVAILABLE" if source == "CATALOG" else available, "host_qualification": "NOT_RUN",
            "triggers": ["tool security", "أمن الأدوات"], "capabilities": [capability],
            "required_tools": ["read_file"], "permissions": ["READ_ONLY"], "conflicts_with": [],
            "output_criteria": ["report"]}
