# Candidate Enhancement Packet 2A: Offline Rule Engineer Tooling
## Deep Code, Dependency, Permission & Verification Qualification

**Packet ID:** `CANDIDATE-PACKET-2A`  
**Parent Workstream:** `AFE-GOV-LEGACY-RECONCILE-002`  
**Source Origin:** `governance_packages/INBOX/NEW/Enterprise_Agent_Governance_Rule_Engineer_Skill_v1.0.0.zip`  
**Archive SHA-256:** `90b7931f24d1012130e9d40a0c64757530669c2794eb384cff9a4604ff10be61`  
**Target Placement:** `tools/rule_engineer/` (Proposed Developer Utility)  
**Status:** `QUALIFIED_PENDING_OWNER_DECISION (DEC-006)`

---

## 1. Executive Qualification Summary

Candidate Packet 2A introduces an offline heuristic preflight scanner for governance rules, drafted in Python. It originated from an enterprise rule-engineering skill package in `INBOX/NEW/`.

**Audit Verdict:** **PASSED ALL SAFETY & ARCHITECTURAL CHECKS.**
The tool is completely decoupled from runtime server operations, requires **zero external packages** (uses only standard library), makes **zero network calls**, performs **zero filesystem writes**, and explicitly disclaims regulatory or runtime certification.

---

## 2. Granular Code & Dependency Audit

### 2.1 File Census
| Relative Path in Zip | Size | Language / Type | Security & Architectural Audit |
|---|---|---|---|
| `scripts/lint_rule.py` | 5,365 B | Python 3.8+ | 100% Python Standard Library (`argparse`, `json`, `re`, `pathlib`). Pure read-only heuristic scanner. |
| `scripts/validate_skill.py` | 4,657 B | Python 3.8+ | Structural linter. Validates file presence, UTF-8 text encoding, and prohibits symlinks. Optional `yaml` import is gracefully caught. |
| `tests/test_skill.py` | 2,694 B | Python `unittest` | Standalone offline unit test suite verifying Arabic & English regex heuristics. |
| `SKILL.md` | 12,037 B | Markdown Specification | Skill instructions explaining rule crafting methodology and authority boundaries. |
| `README_AR.md` | 6,153 B | Arabic Documentation | Bilingual developer guide explaining how to inspect rules offline. |

### 2.2 Dependency Verification
- **External Packages:** **NONE.** Does not require `pip install`, `virtualenv`, or third-party wheels.
- **Python Compatibility:** Python 3.8, 3.9, 3.10, 3.11, 3.12 (Verified with local Python 3.12.10).
- **Import Statements in `lint_rule.py`:**
  ```python
  from __future__ import annotations
  import argparse
  import json
  import re
  from pathlib import Path
  ```

---

## 3. Security, Permissions & Execution Boundary

1. **Filesystem Access:** Read-only (`args.file.read_text(encoding="utf-8")`) or stdin (`args.text`). Never writes, mutates, deletes, or renames any file.
2. **Network Egress:** Zero socket, HTTP, or remote API calls. Runs 100% offline.
3. **Subprocess Spawning:** Zero `subprocess`, `os.system`, or shell execution.
4. **Safety Claims:** Explicitly injects:
   ```json
   {
     "mode": "HEURISTIC_ONLY",
     "verified": false,
     "scope": "text-only heuristic checks, no runtime or authority verification"
   }
   ```
   Prevents any user or agent from mistaking a linter pass for formal compliance.

---

## 4. Acceptance Criteria & Test Plan

- **AC-2A-01 (Zero-Dep Offline Execution):** Executing `py -m unittest tools/rule_engineer/tests/test_skill.py` must pass 100% using standard Python without installing packages.
- **AC-2A-02 (Bilingual Detection Accuracy):**
  - Must report `VAGUE_SECURITY` for `يجب أن يكون النظام آمنًا دائمًا`.
  - Must report `VAGUE_DISCRETION` for `The agent SHOULD log as appropriate.`.
  - Must report `SENSITIVE_ACTION_AUTHORITY_REVIEW` for unapproved deployments (`يجب نشر التغييرات`).
  - Must NOT report sensitive action failure when authorized (`لا يجوز نشر التغييرات دون موافقة مخولة`).
- **AC-2A-03 (Zero Regression Invariant):** Extraction to `tools/rule_engineer/` must have zero effect on `npm test` (all 267 tests remain passing) and zero changes to existing Studio APIs.
