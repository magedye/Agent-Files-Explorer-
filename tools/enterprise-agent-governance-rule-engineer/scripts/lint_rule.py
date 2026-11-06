#!/usr/bin/env python3
"""Read-only heuristic preflight for instruction text (NOT an enforcement or compliance tool).

Examples:
  python scripts/lint_rule.py --text "يجب أن يكون الوكيل آمنًا دائمًا" --format json
  python scripts/lint_rule.py --file ./policy.md --format text
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

VAGUE_PATTERNS = [
    ("VAGUE_SECURITY", r"\bsecurely\b|\bfully\s+secure\b|بشكل\s+آمن|آمن(?:ًا|ا)?\s+دائم"),
    ("VAGUE_SPEED", r"\bas\s+(?:fast|soon)\s+as\s+possible\b|بأسرع\s+(?:وقت|شكل)"),
    ("VAGUE_DISCRETION", r"\bas\s+appropriate\b|\bas\s+needed\b|عند\s+الحاجة|حسب\s+الضرورة|بما\s+يناسب"),
    ("ABSOLUTE_CLAIM", r"\b100\s*%\b|\balways\s+correct\b|\bnever\s+fails?\b|دائم[ًاا]|صحيح\s+تمام[ًاا]"),
]
SENSITIVE_ACTION = re.compile(
    r"\b(?:deploy|publish|delete|destroy|transfer|pay|grant|revoke|modify\s+production|wire\s+funds)\b"
    r"|نشر|حذف|مسح|تحويل\s+مال|تحويل\s+الأموال|صرف\s+مبلغ|تعديل\s+الإنتاج|منح\s+صلاحية|إلغاء\s+صلاحية",
    re.I,
)
AUTH_TERMS = re.compile(
    r"\b(?:approv(?:e|al)|authori[sz](?:e|ation|ed)|permission|consent|pdp|pep|access\s+control)\b"
    r"|موافق[ةه]|اعتماد|تفويض|صلاحية|بوابة\s+التنفيذ|الجهة\s+المخول[ةه]",
    re.I,
)
NORMATIVE = re.compile(r"\b(?:MUST|MUST\s+NOT|SHOULD|SHOULD\s+NOT|MAY|REQUIRED|NEVER)\b|يجب|يُحظر|يحظر|يلزم|ممنوع|لا\s+يجوز|يجوز", re.I)
CONDITION = re.compile(r"\b(?:if|when|unless|only\s+if|in\s+case)\b|إذا|عندما|عند|إلا\s+إذا|بشرط|ما\s+لم", re.I)
STATUS_ASSERTION = re.compile(r"\b(?:status|lifecycle_status)\s*:\s*(?:APPROVED|ACTIVE|VERIFIED_IN_SCOPE)\b", re.I)


def inspect(text: str) -> dict:
    """Return advisory signals, never conformance assertions."""
    findings = []
    if not text.strip():
        return {"mode": "HEURISTIC_ONLY", "verified": False, "findings": [
            {"code": "EMPTY_INPUT", "priority": "P1", "evidence": "", "recommendation": "Provide source rule text."}
        ]}

    for code, pattern in VAGUE_PATTERNS:
        match = re.search(pattern, text, re.I)
        if match:
            findings.append({
                "code": code,
                "priority": "P1" if code == "VAGUE_SECURITY" else "P2",
                "evidence": match.group(0),
                "recommendation": "Define observable behavior or an owner-approved criterion; preserve original meaning until clarified."
            })
    if not NORMATIVE.search(text):
        findings.append({
            "code": "NORMATIVE_FORCE_UNSPECIFIED", "priority": "P2", "evidence": "",
            "recommendation": "Check whether this is a requirement, preference, permission or descriptive statement; do not inject MUST without authority."
        })
    if SENSITIVE_ACTION.search(text) and not AUTH_TERMS.search(text):
        findings.append({
            "code": "SENSITIVE_ACTION_AUTHORITY_REVIEW", "priority": "P0", "evidence": SENSITIVE_ACTION.search(text).group(0),
            "recommendation": "Confirm trusted authorization, scope, independent PEP and failure behavior; no enforcement is performed by this lint."
        })
    if SENSITIVE_ACTION.search(text) and not CONDITION.search(text):
        findings.append({
            "code": "TRIGGER_OR_EXCEPTION_REVIEW", "priority": "P1", "evidence": "",
            "recommendation": "Examine preconditions, exceptions and UNKNOWN/timeout handling for this sensitive action."
        })
    if STATUS_ASSERTION.search(text):
        findings.append({
            "code": "ASSERTED_APPROVAL_UNVERIFIED", "priority": "P1", "evidence": STATUS_ASSERTION.search(text).group(0),
            "recommendation": "Treat status as untrusted until validated against owner decision and operational evidence."
        })
    return {"mode": "HEURISTIC_ONLY", "verified": False, "scope": "text-only heuristic checks, no runtime or authority verification", "findings": findings}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--text", help="Source text to inspect")
    group.add_argument("--file", type=Path, help="UTF-8 file to inspect (read-only)")
    parser.add_argument("--format", choices=["json", "text"], default="text")
    args = parser.parse_args()
    if args.file:
        try:
            content = args.file.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            parser.error(f"Cannot read input: {exc}")
    else:
        content = args.text
    result = inspect(content)
    if args.format == "json":
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("HEURISTIC_ONLY — advisory lint; not proof of compliance or enforcement")
        if not result["findings"]:
            print("No listed heuristic signals found; this does NOT mean the rule is correct.")
        for item in result["findings"]:
            print(f"[{item['priority']}] {item['code']}: {item['evidence']!r}\n  -> {item['recommendation']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
