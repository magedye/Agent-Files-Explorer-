# AGHR Candidate 1.2.0 — Baseline and Gap Analysis Matrix

> **Scope:** Independent engineering update based on `Agent_Governance_Harness_Reference_1.1.0.zip`.  
> **Classification Scheme:** `COVERED` (fully satisfied) | `PARTIAL` (addressed with documented boundaries) | `MISSING` (not present in baseline) | `CONFLICT` (divergence reconciled).

---

## 1. Baseline Inventory Summary

| Component | 1.1.0 Baseline Metric | 1.2.0 Candidate Metric | Variance & Rationale |
|---|---|---|---|
| **Normative Rules** | 47 rules (40 original IDs) | 47 rules (40 original IDs) | Exact preservation; zero rule weakening |
| **Primary Sources** | 56 primary source records | 56 primary source records | Fully preserved in `sources/REGISTER.json` |
| **Host / Provider Adapters** | 6 host, 6 provider adapters | 6 host, 6 provider adapters | Preserved; qualification status `NOT_RUN` |
| **Historical & Audit Trees** | 73 v4 files, 48 v4 controls, frozen baseline | 73 v4 files, 48 v4 controls, frozen baseline | Preserved intact; quarantined as `ON_DEMAND_AUDIT` |
| **Unit & Integration Tests** | 233 local automated tests | 246 local automated tests | +13 comprehensive tests for Governed Inbox |
| **Context Bootstrap Footprint** | Undefined / ~4,800 tokens blind | ~792 tokens (`AGENTS.md`), 3,330 total bootstrap | Controlled within advisory budget target |
| **Governed Inbox Staging** | None (`_INBOX` undefined) | Full Governed Project Inbox (`_INBOX/`) | Safe drop-in staging without execution grant |

---

## 2. Requirement Gap & Reconciliation Matrix

| Requirement | Baseline Status | Candidate Status | Owning Component / Path | Evidence / Verification | Action Taken |
|---|---|---|---|---|---|
| **Progressive Disclosure & Routing** | `PARTIAL` (Linear reading) | `COVERED` | `AGENTS.md`, `CONTENTS.md`, `START_HERE.md` | `check_package.py` preflight (token est: 792) | Added Task-Based Entry Matrix, 5-layer classification, and explicit retrieval classifications (`CANONICAL_CORE`, `ON_DEMAND_TASK`, `ON_DEMAND_AUDIT`). |
| **Context Budget Target (1,500–2,500 tokens)** | `MISSING` (No tool enforcement) | `COVERED` | `tools/check_package.py` (`check_context_budget`) | `check_package.py` checks output | Implemented automated byte, character, line, and token heuristic analysis in test tools. |
| **Single Source of Truth for State** | `PARTIAL` (Dispersed prose) | `COVERED` | `policies/STATE_AND_RECOVERY.md`, `templates/HANDOFF.md` | `test_records.py` | Declared `.aghr/state.json` as sole canonical source; markdown files (`CURRENT.md`, `HANDOFF.md`) strictly treated as derived views. |
| **Quarantine Heavy Folders without Loss** | `PARTIAL` (Not explicitly guarded) | `COVERED` | `AGENTS.md`, `CONTENTS.md` | `check_integration.py`, `test_package.py` | Labeled `compatibility/`, `verification/`, `design/frozen/` as `ON_DEMAND_AUDIT` in router while preserving 100% of internal files and verification integrity. |
| **Cross-Platform & Windows Portability** | `CONFLICT` (Failed on Windows due to `\\` and `cp1252`) | `COVERED` | `tools/check_package.py`, `check_integration.py`, `evaluations/grade.py`, `runtime/cli.py` | `run_tests.py` (246/246 tests PASS) | Replaced raw string conversions with `.as_posix()` and added `encoding='utf-8'` across all text reads. |
| **Governed Project Inbox (`_INBOX/`)** | `MISSING` | `COVERED` | `runtime/inbox.py`, `procedures/PROJECT_INBOX.md`, `templates/INBOX_DISPOSITION.md` | `tests/test_inbox.py` (13/13 tests PASS) | Implemented 8-stage intake lifecycle (Discovery, Registration, Classification, Authority Audit, Reconciliation, Disposition, Authorized Work, Audit Trail). |
| **Non-Grant Invariant on Inbox Files** | `MISSING` | `COVERED` | `runtime/inbox.py`, `procedures/PROJECT_INBOX.md` | `test_inbox.py` (`test_untrusted_authority_claims`) | Code rejects unearned authority claims (`"approved": true`) and enforces `execution: "NOT_AUTHORIZED_BY_CAPTURE"`. |
| **Canonical Overwrite & Archive Protection** | `MISSING` | `COVERED` | `runtime/inbox.py` (`_check_zip_safety`, conflict detection) | `test_inbox.py` (`test_conflict_with_canonical_file`, `test_unsafe_archive_rejected`) | Blocks zip directory traversal (`../`) and flags filename collisions against canonical files before registration. |
| **Concurrency & Interrupted Recovery** | `MISSING` | `COVERED` | `runtime/inbox.py` (`_INBOX_LOCK`, atomic replace) | `test_inbox.py` (`test_concurrency_with_running_task`, `test_interrupted_processing_recovery`) | Guarded by re-entrant locks and atomic file swap; non-blocking with respect to task state updater. |
