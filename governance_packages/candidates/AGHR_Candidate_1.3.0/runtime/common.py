"""Strict records, bounded schema checks and evidence/state semantics (stdlib)."""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MAX_RECORD_BYTES = 4_000_000

class GovernanceError(ValueError):
    """Invalid input or unsatisfied declared governance condition."""

def _pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise GovernanceError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result

def _constant(value: str) -> None:
    raise GovernanceError(f"Non-finite JSON value: {value}")

def loads(text: str) -> Any:
    try:
        return json.loads(text, object_pairs_hook=_pairs, parse_constant=_constant)
    except (json.JSONDecodeError, RecursionError) as exc:
        raise GovernanceError(f"Invalid JSON: {exc}") from exc

def load(path: Path) -> Any:
    if not path.is_file() or path.is_symlink():
        raise GovernanceError(f"Regular non-symlink file required: {path}")
    if path.stat().st_size > MAX_RECORD_BYTES:
        raise GovernanceError(f"Record exceeds {MAX_RECORD_BYTES} bytes: {path}")
    try:
        return loads(path.read_text(encoding="utf-8"))
    except UnicodeError as exc:
        raise GovernanceError("Record must be UTF-8") from exc

def canonical(value: Any) -> bytes:
    try:
        return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode()
    except (TypeError, ValueError) as exc:
        raise GovernanceError(f"Cannot encode record: {exc}") from exc

def digest(value: Any) -> str:
    return hashlib.sha256(canonical(value)).hexdigest()

def sha(path: Path) -> str:
    h=hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(65536), b""):
            h.update(block)
    return h.hexdigest()

def now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")

def instant(value: Any) -> dt.datetime:
    if not isinstance(value, str):
        raise GovernanceError("Timezone-aware ISO timestamp required")
    try:
        out=dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise GovernanceError(f"Invalid timestamp: {value}") from exc
    if out.tzinfo is None or out.utcoffset() is None:
        raise GovernanceError("Timestamp must include a timezone")
    return out

def safe_path(root: Path, relative: str, *, must_exist: bool=False) -> Path:
    """Conservative portable path check. Does not eliminate hostile OS races."""
    if not isinstance(relative,str) or not relative or len(relative)>512:
        raise GovernanceError("Invalid relative path")
    if "\\" in relative or ":" in relative or "\x00" in relative:
        raise GovernanceError("Only portable forward-slash relative paths are accepted")
    bits=relative.split("/")
    if any(x in ("", ".", "..") for x in bits) or Path(relative).is_absolute():
        raise GovernanceError("Empty, absolute or traversal path rejected")
    base=root.resolve(strict=True)
    current=base
    for part in bits:
        current=current/part
        if current.is_symlink():
            raise GovernanceError("Symlink path rejected")
        if current.exists() and current.is_file() and current.stat().st_nlink>1:
            raise GovernanceError("Hard-linked file rejected")
    if not current.resolve(strict=False).is_relative_to(base):
        raise GovernanceError("Path escapes root")
    if must_exist and not current.exists():
        raise GovernanceError(f"Missing path: {relative}")
    return current

def save_new(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True,exist_ok=True)
    payload=json.dumps(value,indent=2,ensure_ascii=False,allow_nan=False)+"\n"
    with path.open("x",encoding="utf-8") as stream:
        stream.write(payload);stream.flush();os.fsync(stream.fileno())

def replace_json(path: Path, value: Any) -> None:
    """Atomic file replacement, not cross-process transactional coordination."""
    payload=json.dumps(value,indent=2,ensure_ascii=False,allow_nan=False)+"\n"
    fd,tmp=tempfile.mkstemp(prefix=".aghr-record-",dir=path.parent)
    try:
        with os.fdopen(fd,"w",encoding="utf-8") as stream:
            stream.write(payload);stream.flush();os.fsync(stream.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)

KEYWORDS={"$schema","title","description","type","properties","required","additionalProperties","items","minItems","minLength","enum","minimum","pattern","anyOf"}
def validate_schema(value: Any, schema: dict[str,Any], at: str="$") -> list[str]:
    """Only the documented bundled subset; reject unknown keywords, never skip them."""
    errors=[]
    if not isinstance(schema,dict):return [f"{at}: invalid schema"]
    unsupported=set(schema)-KEYWORDS
    if unsupported:return [f"{at}: unsupported schema keywords {sorted(unsupported)}"]
    if "anyOf" in schema:
        branches=schema["anyOf"]
        if not isinstance(branches,list) or not branches:return [f"{at}: invalid anyOf"]
        if not any(not validate_schema(value,b,at) for b in branches):
            errors.append(f"{at}: no anyOf branch matches")
    types={"object":lambda x:isinstance(x,dict),"array":lambda x:isinstance(x,list),"string":lambda x:isinstance(x,str),"integer":lambda x:type(x) is int,"boolean":lambda x:type(x) is bool,"null":lambda x:x is None,"number":lambda x:type(x) in (int,float)}
    kind=schema.get("type")
    if kind is not None:
        if kind not in types:return errors+[f"{at}: unsupported type {kind}"]
        if not types[kind](value):return errors+[f"{at}: expected {kind}"]
    if "enum" in schema and not any(type(value) is type(v) and value==v for v in schema["enum"]):errors.append(f"{at}: invalid enum")
    if isinstance(value,dict):
        props=schema.get("properties",{})
        for key in schema.get("required",[]):
            if key not in value:errors.append(f"{at}.{key}: required")
        if schema.get("additionalProperties") is False:
            for key in set(value)-set(props):errors.append(f"{at}.{key}: unknown field")
        for key,sub in props.items():
            if key in value:errors.extend(validate_schema(value[key],sub,f"{at}.{key}"))
    if isinstance(value,list):
        if len(value)<schema.get("minItems",0):errors.append(f"{at}: too few items")
        if "items" in schema:
            for n,item in enumerate(value):errors.extend(validate_schema(item,schema["items"],f"{at}[{n}]"))
    if isinstance(value,str):
        if len(value)<schema.get("minLength",0):errors.append(f"{at}: too short")
        if "pattern" in schema and not re.search(schema["pattern"],value):errors.append(f"{at}: pattern mismatch")
    if type(value) in (int,float) and value<schema.get("minimum",value):errors.append(f"{at}: below minimum")
    return errors

def shape(value: Any, name: str) -> list[str]:
    return validate_schema(value,load(ROOT/"schemas"/f"{name}.schema.json"))

def unique(rows: list[dict], label: str) -> list[str]:
    ids=[r["id"] for r in rows]
    return [] if len(ids)==len(set(ids)) else [f"Duplicate {label} IDs"]

def check_evidence(row: dict, root: Path, candidate: str|None, environment: str, *, clock: dt.datetime|None=None) -> list[str]:
    errors=shape(row,"EVIDENCE")
    if errors:return errors
    if row["result"]=="PASS":
        if candidate is None or row["candidate_sha256"]!=candidate:errors.append("PASS candidate does not match current candidate")
        if row["environment_id"]!=environment:errors.append("PASS environment does not match")
        if row["target_count"]<1:errors.append("PASS requires nonempty target")
        if row["kind"]=="TEST" and row["tests_executed"]<1:errors.append("PASS test requires executed tests")
        if not row["artifacts"]:errors.append("PASS requires raw evidence artifact")
        try:
            a,b=instant(row["started_at"]),instant(row["finished_at"])
            if a>b:errors.append("Evidence ends before it starts")
            if b>(clock or dt.datetime.now(dt.timezone.utc))+dt.timedelta(seconds=5):errors.append("Evidence timestamp is in the future")
        except GovernanceError as exc:errors.append(str(exc))
    elif row["result"] in ("NOT_RUN","BLOCKED","NOT_APPLICABLE") and not row["limitations"]:
        errors.append("Nonexecuted/inapplicable check requires explanation")
    if row["result"]=="NOT_RUN" and row["tests_executed"]!=0:errors.append("NOT_RUN cannot claim executed tests")
    for art in row["artifacts"]:
        try:
            path=safe_path(root,art["path"],must_exist=True)
            if not path.is_file():errors.append("Evidence artifact is not a file")
            elif sha(path)!=art["sha256"]:errors.append(f"Evidence digest mismatch: {art['path']}")
        except (GovernanceError,OSError) as exc:errors.append(str(exc))
    return errors

def check_state(state: dict, project_root: Path, *, ready: bool=False) -> list[str]:
    errors=shape(state,"STATE")
    if errors:return errors
    for name in ("goals","work","checks","pending","decisions"):errors.extend(unique(state[name],name))
    goals={g["id"]:g for g in state["goals"]};work={w["id"]:w for w in state["work"]}
    criteria={c["id"]:g["id"] for g in state["goals"] for c in g["criteria"]}
    count=sum(len(g["criteria"]) for g in state["goals"])
    if count!=len(criteria):errors.append("Duplicate criterion IDs")
    for item in state["work"]:
        if item["goal_id"] not in goals:errors.append(f"Unknown goal for {item['id']}")
        if any(criteria.get(c)!=item["goal_id"] for c in item["criterion_ids"]):errors.append(f"Unknown or foreign criterion for {item['id']}")
        if any(d not in work for d in item["depends_on"]):errors.append(f"Unknown dependency for {item['id']}")
        if item["status"]=="BLOCKED" and not item["blocker"]:errors.append(f"Missing blocker for {item['id']}")
    active=set();done=set()
    def walk(wid):
        if wid in active:return True
        if wid in done or wid not in work:return False
        active.add(wid)
        if any(walk(d) for d in work[wid]["depends_on"]):return True
        active.remove(wid);done.add(wid);return False
    if any(walk(w) for w in work):errors.append("Dependency cycle")
    passed=set()
    for row in state["checks"]:
        check_errors=check_evidence(row,project_root,state["candidate_sha256"],state["environment_id"])
        errors.extend(f"{row['id']}: {e}" for e in check_errors)
        if any(c not in criteria for c in row["criterion_ids"]):errors.append(f"Unknown evidence criterion: {row['id']}")
        if not check_errors and row["result"]=="PASS":passed.update(row["criterion_ids"])
    for item in state["work"]:
        if item["status"]=="VERIFIED" and not set(item["criterion_ids"]).issubset(passed):errors.append(f"Unproved VERIFIED work: {item['id']}")
    for item in state["pending"]:
        if item["work_id"] not in work:errors.append(f"Unknown pending work: {item['id']}")
        if item["status"] in ("RESOLVED","DEFERRED","WITHDRAWN") and not item["resolution_ref"]:errors.append(f"Disposition lacks reference: {item['id']}")
    if ready:
        failed={c for row in state["checks"] if row["result"] in ("FAIL","ERROR") for c in row["criterion_ids"]}
        if passed & failed:errors.append("Conflicting PASS/failure evidence requires reconciliation before readiness")
        if not goals or not work:errors.append("Ready claim requires nonempty goals and work")
        required={c["id"] for g in goals.values() for c in g["criteria"] if c["required"]}
        if not required or not required.issubset(passed):errors.append("Required criteria are not evidenced PASS")
        if any(w["status"]!="VERIFIED" for w in work.values()):errors.append("Work remains unverified; cancellations need separate scoped readiness")
        if any(p["blocking"] and p["status"]!="RESOLVED" for p in state["pending"]):errors.append("Blocking pending work remains")
    errors.extend(check_delivery(state,ready=ready))
    return errors

def check_project(project: dict, *, ready: bool=False) -> list[str]:
    errors=shape(project,"PROJECT")
    if errors:return errors
    sec=project["security"]
    high=sec["production_access"] or sec["irreversible_operations"] or sec["data_class"] in ("CONFIDENTIAL","RESTRICTED") or sec["independent_review_required"]
    if high and project["profile"]!="CONTROLLED":errors.append("Declared high-risk facts require CONTROLLED")
    if project["profile"]=="LITE" and (sec["data_class"] not in ("PUBLIC","INTERNAL_NON_SENSITIVE") or sec["external_mutations"]):errors.append("LITE eligibility is not established")
    if project["canonical_backend"]=="DECLARED_EXTERNAL" and not project["external_backend_ref"]:errors.append("External canonical backend requires mapping reference")
    if project["adoption"]["state"]=="EFFECTIVE":
        if not project["adoption"]["decision_ref"] or not project["adoption"]["effective_scope"]:errors.append("Effective adoption needs decision and scope")
    if ready:
        if project["adoption"]["state"]!="EFFECTIVE":errors.append("Adoption is not effective")
        if sec["data_class"]=="UNKNOWN":errors.append("Data classification unresolved")
        if not project["provider"]["model"] or not project["host"]["version"]:errors.append("Model/host identity unresolved")
        if not project["host"]["qualification_ref"]:errors.append("Host qualification evidence reference required")
        if project["artifact_kind"]=="UNKNOWN":errors.append("Artifact kind unresolved")
        for cmd in project["commands"]:
            if cmd["verification_status"]=="TESTED" and not cmd["evidence_ref"]:errors.append("Tested command lacks evidence reference")
    return errors


def check_request(request: dict) -> list[str]:
    """Validate intake meaning that is representable in records, not human intent."""
    errors=shape(request,"REQUEST")
    if errors:return errors
    try:instant(request["source"]["captured_at"])
    except GovernanceError as exc:errors.append(str(exc))
    errors.extend(unique(request["items"],"request item"))
    questions=request.get("clarifications",[])
    errors.extend(unique(questions,"clarification"))
    for q in questions:
        options=q["options"]; errors.extend(unique(options,"clarification option"))
        if q["recommendation_id"] is not None and q["recommendation_id"] not in {o["id"] for o in options}:
            errors.append(f"Unknown recommendation option: {q['id']}")
        if q["recommendation_id"] is not None and not q["recommendation_reason"]:
            errors.append(f"Recommendation lacks reason: {q['id']}")
        if q["material"] and q["status"]=="BOUNDED_ASSUMPTION":
            errors.append(f"Material decision cannot be assumed: {q['id']}")
        if q["status"]=="RESOLVED" and not q["decision_ref"]:
            errors.append(f"Resolved clarification lacks decision reference: {q['id']}")
        if q["status"]=="UNRESOLVED" and q["decision_ref"] is not None:
            errors.append(f"Unresolved clarification claims a decision: {q['id']}")
    return errors


def check_delivery(state: dict, *, ready: bool=False) -> list[str]:
    """Called only after STATE shape validation. No Git or model observation."""
    d=state.get("delivery")
    if d is None:return []
    errors=[]; checks={c["id"]:c for c in state["checks"]}
    if d["execution_mode"]=="CONTINUOUS_WITHIN_GRANT" and not d["grant_ref"]:
        errors.append("Continuous mode requires a grant reference; mode is not authority")
    if d["measurement_scope_complete"] and not d["plan_baseline_ref"]:
        errors.append("Complete measurement scope requires a plan baseline reference")
    g=d["git_observation"]
    if g["observed_at"] is not None:
        try:instant(g["observed_at"])
        except GovernanceError as exc:errors.append(str(exc))
    if (g["branch"] is not None or g["default_branch"] is not None or g["remote_checked"] or g["unmerged_branches"]) and (not g["observed_at"] or not g["evidence_ref"]):
        errors.append("Git observation requires timestamp and evidence reference")
    if len(g["unmerged_branches"])!=len(set(g["unmerged_branches"])):
        errors.append("Duplicate unmerged branch observations")
    errors.extend(unique(d["findings"],"finding"))
    for f in d["findings"]:
        refs=f["evidence_ids"]+f["retest_evidence_ids"]
        if any(i not in checks for i in refs):errors.append(f"Unknown finding evidence: {f['id']}")
        if f["kind"]=="OBSERVED_VIOLATION" and not f["evidence_ids"]:errors.append(f"Observed violation needs evidence: {f['id']}")
        if (f["kind"]=="APPROVED_REPLAN" or f["status"]=="ACCEPTED_LIMITATION") and not f["decision_ref"]:
            errors.append(f"Finding decision missing: {f['id']}")
        if f["status"]=="RESOLVED":
            if not f["retest_evidence_ids"]:errors.append(f"Resolved finding needs retest evidence: {f['id']}")
            if any(checks.get(i,{}).get('result')!='PASS' for i in f['retest_evidence_ids']):errors.append(f"Retest is not PASS: {f['id']}")
        if ready and f["severity"] in ("CRITICAL","HIGH") and f["status"]=="OPEN":
            errors.append(f"Open material finding blocks readiness: {f['id']}")
    return errors
