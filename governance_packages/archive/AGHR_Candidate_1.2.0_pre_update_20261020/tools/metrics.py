"""Evidence-record arithmetic only; no evidence authentication or compliance verdict.

All observations and decision references are provided by the caller. This helper
never writes to a project or invokes external tools. Python 3.10+ standard library.
"""
from __future__ import annotations
from collections import Counter
from collections.abc import Mapping, Sequence

STATUSES = frozenset({"PASS", "FAIL", "NOT_RUN", "BLOCKED", "UNKNOWN", "NOT_APPLICABLE", "WAIVED"})
SEVERITIES = frozenset({"critical", "high", "medium", "low"})


def fraction(numerator: int, denominator: int | None) -> float | None:
    """A zero/unknown denominator is not 100%; reject invalid counts."""
    if type(numerator) is not int or numerator < 0:
        raise ValueError("Numerator must be a non-negative integer.")
    if denominator is None:
        return None
    if type(denominator) is not int or denominator < 0 or numerator > denominator:
        raise ValueError("Invalid denominator or numerator exceeds denominator.")
    return None if denominator == 0 else numerator / denominator


def summarize_controls(records: Sequence[Mapping[str, object]], *,
                       measurement_scope_complete: bool) -> dict[str, object]:
    """Summarize unique declared records; never output an overall PASS.

    PASS/FAIL require a nonempty evidence-reference list. WAIVED/NOT_APPLICABLE
    require a rationale and decision reference. Reference presence is not proof
    that it is valid, current, authorized, or independently reviewed.
    """
    if type(measurement_scope_complete) is not bool:
        raise ValueError("Scope completeness must be explicitly declared.")
    if not isinstance(records, (list, tuple)):
        raise ValueError("Records must be a list or tuple.")
    seen: set[str] = set()
    counts: Counter[str] = Counter({s: 0 for s in sorted(STATUSES)})
    critical: list[str] = []
    for row in records:
        if not isinstance(row, Mapping):
            raise ValueError("Each record must be an object.")
        required = {"id", "status", "severity", "evidence_refs", "decision_ref", "rationale"}
        if set(row) != required:
            raise ValueError("Unexpected or missing record fields.")
        rid, status, severity = row["id"], row["status"], row["severity"]
        if not isinstance(rid, str) or not rid.strip() or rid in seen:
            raise ValueError("Record identifiers must be unique nonempty strings.")
        if not isinstance(status, str) or status not in STATUSES:
            raise ValueError("Unknown record status.")
        if not isinstance(severity, str) or severity not in SEVERITIES:
            raise ValueError("Unknown severity.")
        refs = row["evidence_refs"]
        if not isinstance(refs, list) or any(not isinstance(x, str) or not x.strip() for x in refs):
            raise ValueError("Evidence references must be nonempty strings in a list.")
        if status in {"PASS", "FAIL"} and not refs:
            raise ValueError("Observed PASS/FAIL needs a declared evidence reference.")
        for key in ("decision_ref", "rationale"):
            if row[key] is not None and not isinstance(row[key], str):
                raise ValueError(f"{key} must be a string or null.")
        if status in {"WAIVED", "NOT_APPLICABLE"} and any(
            not isinstance(row[k], str) or not row[k].strip() for k in ("decision_ref", "rationale")
        ):
            raise ValueError("Waivers and non-applicability need a decision reference and rationale.")
        seen.add(rid)
        counts[status] += 1
        if status == "FAIL" and severity == "critical":
            critical.append(rid)
    applicable = len(records) - counts["NOT_APPLICABLE"]
    required_count = applicable - counts["WAIVED"]
    examined = counts["PASS"] + counts["FAIL"]
    return {
        "advisory_only": True,
        "evidence_authenticated": False,
        "scope_complete_as_declared": measurement_scope_complete,
        "counts": dict(counts),
        "total_records": len(records),
        "applicable_including_waived": applicable,
        "required_nonwaived": required_count,
        "examined": examined,
        "check_completion_fraction": fraction(examined, required_count),
        "observed_pass_fraction_among_examined": fraction(counts["PASS"], examined),
        "critical_failures": critical,
        "overall_compliance_verdict": "NOT_ASSESSED",
    }
