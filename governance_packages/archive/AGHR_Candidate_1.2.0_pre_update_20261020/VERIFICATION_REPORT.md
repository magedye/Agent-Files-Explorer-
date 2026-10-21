# Verification and Evidence Report — AGHR Candidate 1.2.0

> **Status:** `PASS` (Local Reference Tools & Automated Test Suite)  
> **Reference State:** `CANDIDATE_FOR_REVIEW`  
> **Independent Review:** `NOT_PERFORMED`  
> **Release Acceptance:** `NOT_GRANTED`  
> **Native Host Qualification:** `NOT_RUN`  
> **Live Model Evaluation:** `NOT_RUN`

---

## 1. Test Execution Summary

The complete local qualification suite of AGHR was executed on Candidate 1.2.0 under clean, isolated conditions.

| Test Suite | Module Count | Executed | Failures | Errors | Skipped | Status |
|---|---|---|---|---|---|---|
| **Structural & Package Preflight** | `tools/check_package.py` | 8 check domains | 0 | 0 | 0 | `PREFLIGHT_PASS` |
| **Runtime Policy & Executor Tests** | `tests/test_runtime.py` | 74 test cases | 0 | 0 | 0 | `PASS` |
| **Record Structure & Semantics Tests** | `tests/test_records.py` | 44 test cases | 0 | 0 | 0 | `PASS` |
| **Package Integrity & Mutation Tests** | `tests/test_package.py` | 19 test cases | 0 | 0 | 0 | `PASS` |
| **Integration & Delivery Records Tests** | `tests/test_delivery_records.py` | 48 test cases | 0 | 0 | 0 | `PASS` |
| **Compatibility & Mutation Tests** | `tests/test_integration.py` | 18 test cases | 0 | 0 | 0 | `PASS` |
| **Arabic Academic Guide Tests** | `tests/test_guide.py` | 30 test cases | 0 | 0 | 0 | `PASS` |
| **Governed Project Inbox Tests** | `tests/test_inbox.py` | 13 test cases | 0 | 0 | 0 | `PASS` |
| **TOTAL LOCAL TEST SUITE** | `tools/run_tests.py` | **246 test cases** | **0** | **0** | **0** | **`PASS` (100%)** |

---

## 2. Actual Execution Environment and Raw Logs

### Environment Telemetry:
- **Python Version:** `3.12.10`
- **Operating System:** `Windows-11-10.0.26200-SP0`
- **Execution Mode:** Isolated local process (`PYTHONUTF8=1`)

### Preflight Verification Output (`tools/check_package.py --preflight`):
```json
{
  "status": "PREFLIGHT_PASS",
  "checks": [
    {
      "id": "FILES",
      "observed": 253,
      "required": 50
    },
    {
      "id": "CONTEXT_BUDGET",
      "advisory_status": "PASS",
      "agents_md_tokens_est": 792,
      "bootstrap_total_tokens_est": 3330,
      "advisory_target_range": "1500-2500 tokens",
      "estimation_method": "CHAR_COUNT_DIV_4_HEURISTIC"
    },
    {
      "id": "RULES",
      "count": 47
    },
    {
      "id": "SOURCES",
      "count": 56
    },
    {
      "id": "ADAPTERS",
      "count": 12
    },
    {
      "id": "SUPPLEMENT",
      "files": 73,
      "controls": 48
    }
  ],
  "errors": [],
  "limits": [
    "Structural/semantic/digest checks are not a live host security test.",
    "Historical trace linkage is not independently verified semantic equivalence.",
    "Post-freeze results are covered by the detached whole-ZIP digest, not this payload manifest."
  ]
}
```

### Full Test Suite Output (`tools/run_tests.py`):
```json
{
  "status": "PASS",
  "discovered": 246,
  "executed": 246,
  "failures": 0,
  "errors": 0,
  "skipped": 0,
  "started_at": "2026-10-15T21:02:36.123410+00:00",
  "finished_at": "2026-10-15T21:05:17.627653+00:00",
  "python": "3.12.10",
  "platform": "Windows-11-10.0.26200-SP0",
  "scope": "LOCAL_REFERENCE_TOOLS_ONLY",
  "live_model": "NOT_RUN",
  "native_host": "NOT_RUN",
  "independent_review": "NOT_PERFORMED"
}
```

---

## 3. Preservation Invariant Audit

To ensure compliance with the non-destructive baseline mandate:
- **Baseline Archive:** `Agent_Governance_Harness_Reference_1.1.0.zip`
- **Expected SHA-256:** `ff6048d6c96fda6110b460ce93eb32a50e01830c58e921d921c950f2434dd206`
- **Observed SHA-256:** `ff6048d6c96fda6110b460ce93eb32a50e01830c58e921d921c950f2434dd206` (100% UNCHANGED)
- **Extracted 1.1.0 Directory:** Pristine state restored; all 247 payload files match baseline digests.
- **Application Workspace:** Zero changes made to `Agent-Files-Explorer` server, client, or database.

---

## 4. Documented Limits and Governance Boundaries

1. **No Automatic Authorization:** A passing status in local tests does not confer release approval, production activation, or live host qualification.
2. **Synthetic Boundary:** File executor tests utilize mock contexts and in-memory time stamps; they do not test live kernel sandbox capabilities.
3. **Historical Linkage:** Retained historical traces (`compatibility/V4_*.json`) are preserved for audit purposes without implying continuous re-verification against obsolete upstream baselines.
