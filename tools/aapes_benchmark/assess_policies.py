#!/usr/bin/env python3
"""AAPES Policy Engineering Diagnostic Benchmark (Candidate Packet 2C)

Offline heuristic evaluator for policy specification readiness against AAPES domains.
This is an ADVISORY diagnostic oracle; it does NOT enforce runtime gates or certify compliance.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def evaluate_policy_pack(file_path: Path) -> dict:
    if not file_path.is_file():
        raise FileNotFoundError(f"Policy file not found: {file_path}")

    raw = file_path.read_text(encoding="utf-8")
    data = json.loads(raw)
    rules = data.get("rules", [])
    if not rules and isinstance(data, list):
        rules = data

    total_rules = len(rules)
    if total_rules == 0:
        return {
            "mode": "ADVISORY_DIAGNOSTIC_ORACLE",
            "runtime_enforcement": "DISABLED",
            "status": "EMPTY_OR_UNRECOGNIZED_POLICY_PACK",
            "readiness_score_pct": 0,
            "readiness_tier": "R0_NOT_READY",
            "evidence_found": [],
            "scope_and_coverage_boundaries": "Zero rules evaluated.",
            "uncertainties_and_gaps": ["No rules found in input file."],
            "disclaimer": "Informative score only. Does not confer runtime permission."
        }

    # Evaluate criteria
    has_id_and_title = 0
    has_obligation = 0
    has_authority = 0
    has_verification_refs = 0
    has_trigger_or_scope = 0

    evidence_rules = []
    uncertainties = []

    for r in rules:
        rid = r.get("id") or r.get("rule_id")
        title = r.get("title") or r.get("name")
        if rid and title:
            has_id_and_title += 1

        obligation = r.get("obligation") or r.get("instruction") or r.get("text")
        if obligation:
            has_obligation += 1

        authority = r.get("authority_plane") or r.get("authority") or r.get("basis")
        if authority:
            has_authority += 1

        test_refs = r.get("test_refs") or r.get("verification_case") or r.get("verification")
        if test_refs:
            has_verification_refs += 1
            evidence_rules.append(f"{rid}: has verification reference ({type(test_refs).__name__})")
        else:
            uncertainties.append(f"{rid}: missing explicit test_refs; operational enforcement cannot be confirmed offline.")

        trigger = r.get("trigger") or r.get("scope") or r.get("applies_when")
        if trigger:
            has_trigger_or_scope += 1

    # Weighted scoring (Design priorities, not probabilities)
    score_id = (has_id_and_title / total_rules) * 20.0
    score_ob = (has_obligation / total_rules) * 30.0
    score_auth = (has_authority / total_rules) * 20.0
    score_trig = (has_trigger_or_scope / total_rules) * 15.0
    score_ver = (has_verification_refs / total_rules) * 15.0

    total_score = round(score_id + score_ob + score_auth + score_trig + score_ver, 1)

    tier = "R0_ADVISORY"
    if total_score >= 90.0:
        tier = "R3_PRODUCTION_READINESS_HIGH"
    elif total_score >= 85.0:
        tier = "R2_STAGING_READINESS_MODERATE"
    elif total_score >= 75.0:
        tier = "R1_READ_ONLY_READINESS_ACCEPTABLE"

    return {
        "mode": "ADVISORY_DIAGNOSTIC_ORACLE",
        "runtime_enforcement": "DISABLED",
        "evaluation_target": str(file_path),
        "total_rules_evaluated": total_rules,
        "readiness_score_pct": total_score,
        "readiness_tier": tier,
        "criteria_breakdown": {
            "identity_and_naming_pct": round((has_id_and_title / total_rules) * 100, 1),
            "obligation_definition_pct": round((has_obligation / total_rules) * 100, 1),
            "authority_grounding_pct": round((has_authority / total_rules) * 100, 1),
            "trigger_and_scope_pct": round((has_trigger_or_scope / total_rules) * 100, 1),
            "verification_traceability_pct": round((has_verification_refs / total_rules) * 100, 1)
        },
        "evidence_found": evidence_rules[:10] + ([f"... and {len(evidence_rules)-10} more"] if len(evidence_rules) > 10 else []),
        "scope_and_coverage_boundaries": "Evaluates static specification attributes only. Does NOT execute tests or verify semantic logic.",
        "uncertainties_and_gaps": uncertainties[:10] + ([f"... and {len(uncertainties)-10} more"] if len(uncertainties) > 10 else []),
        "disclaimer": "INFORMATIONAL ONLY: This score reflects specification completeness. It is NOT an ISO certification, IEEE compliance mark, or permission to execute production tools."
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, required=True, help="Path to rules JSON file to evaluate")
    parser.add_argument("--format", choices=["json", "text"], default="text")
    args = parser.parse_args()

    try:
        res = evaluate_policy_pack(args.file)
    except Exception as exc:
        print(f"Error evaluating policy pack: {exc}", file=sys.stderr)
        return 1

    if args.format == "json":
        print(json.dumps(res, indent=2, ensure_ascii=False))
    else:
        print(f"=== AAPES Policy Specification Benchmark ===")
        print(f"Target: {res.get('evaluation_target')}")
        print(f"Rules Evaluated: {res.get('total_rules_evaluated')}")
        print(f"Readiness Score: {res.get('readiness_score_pct')}% ({res.get('readiness_tier')})")
        print(f"\nBreakdown:")
        for k, v in res.get("criteria_breakdown", {}).items():
            print(f"  - {k}: {v}%")
        print(f"\nUncertainties / Gaps: {len(res.get('uncertainties_and_gaps', []))} item(s)")
        print(f"Disclaimer: {res.get('disclaimer')}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
