"""Classify declared intake facts. Does NOT inspect an agent or authorize actions.

Python 3.10+, standard library only. Optional CLI reads a JSON object and writes
its advisory result to stdout. No networking, subprocesses, or project writes.
"""
from __future__ import annotations
import argparse
import json
import sys
from collections.abc import Mapping
from pathlib import Path

FIELDS = frozenset({
    "owner_paused", "write_action", "write_authorized", "within_scope",
    "required_source_available", "material_ambiguity",
    "unresolved_source_conflict", "can_resolve_from_sources",
    "high_impact_or_context_change", "matching_confirmation_valid",
    "new_material_effect", "required_controls_ready",
    "independent_work_authorized",
})


def assess_intake(facts: Mapping[str, object]) -> dict[str, object]:
    """Return advisory blockers from complete boolean input, never a permission.

    All facts are caller-declared and unverified. Missing, extra, non-boolean,
    and contradictory source-resolution facts raise ValueError.
    """
    if not isinstance(facts, Mapping) or set(facts) != FIELDS:
        raise ValueError("Supply exactly the documented intake fields.")
    if any(type(facts[k]) is not bool for k in FIELDS):
        raise ValueError("All intake facts must be booleans; unknown is not false.")
    if not facts["required_source_available"] and facts["can_resolve_from_sources"]:
        raise ValueError("Unavailable required source cannot resolve the decision.")
    reasons: list[str] = []
    if facts["owner_paused"]:
        reasons.append("OWNER_PAUSE")
    if not facts["required_source_available"]:
        reasons.append("REQUIRED_SOURCE_UNAVAILABLE")
    if not facts["within_scope"]:
        reasons.append("OUTSIDE_DECLARED_SCOPE")
    if facts["write_action"] and not facts["write_authorized"]:
        reasons.append("WRITE_AUTHORIZATION_NOT_REPORTED")
    if facts["unresolved_source_conflict"]:
        reasons.append("RESOLVE_AUTHORITY_CONFLICT")
    if facts["material_ambiguity"]:
        reasons.append("INSPECT_AUTHORIZED_SOURCES_FIRST" if facts["can_resolve_from_sources"]
                       else "ASK_MATERIAL_QUESTION_WITH_OPTIONS")
    if facts["new_material_effect"] or (facts["high_impact_or_context_change"]
                                       and not facts["matching_confirmation_valid"]):
        reasons.append("CONFIRM_CHANGED_OR_UNCOVERED_EFFECT")
    if not facts["required_controls_ready"]:
        reasons.append("REQUIRED_CONTROL_NOT_READY")
    if facts["owner_paused"]:
        route = "STOP_AND_CHECKPOINT"
    elif reasons:
        route = "HOLD_AFFECTED_ACTION_AND_REVIEW_BLOCKERS"
    else:
        route = "NO_MATERIAL_BLOCKER_REPORTED_IN_INPUT"
    return {
        "advisory_only": True,
        "facts_independently_verified": False,
        "permission_granted": False,
        "recommended_route": route,
        "blockers": reasons,
        "independent_work_candidate": bool(reasons and not facts["owner_paused"]
                                           and facts["independent_work_authorized"]),
        "independent_work_note": "Candidate only; its actual scope and controls need separate verification.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="JSON containing exactly the declared boolean fields")
    args = parser.parse_args()
    try:
        result = assess_intake(json.loads(args.input.read_text(encoding="utf-8")))
    except (OSError, ValueError, TypeError) as exc:
        print(f"Input error: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
