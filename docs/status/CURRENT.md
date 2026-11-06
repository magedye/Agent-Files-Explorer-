# Baseline v1 Adoption & Candidate Preservation — Derived Execution State

Updated 2026-11-06 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing test verification.

Executed under Owner Directives `AFE-GOV-BASELINE-001` and subsequent owner update directive:
- **Branch & Baseline:** Feature branch `feat/afe-gov-baseline-001` branched from `feat/aghr-qle-gov-obs-006-integrity` at commit `4849eb48eee5c4eb866163d51563a5b0e9d2b61c`.
- **SGO Candidate Status:** `MERGE_READY / OWNER_DECISION_REQUIRED`. Candidate integrity changes and all 69 SGO verification checks preserved intact. Not merged into `main` or pushed without owner authorization.
- **Baseline v1 Adoption (v1.4.0 with ADEQ 1.1):** `BASELINE_V1_ADOPTED`.
  * Active Release: `Agent Governance & RCCA Kit EN v1.4.0` registered in `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.4.0` (with ADEQ 1.1 quality layer, 24 Core + 24 ADEQ rules, 19 sources, 7 schemas, 7 quality workflows, 295 distinct passed tests).
  * Manifest: `governance_packages/references/AGHR_Studio_1.4.0_Baseline_v1_RELEASE.json`.
  * Integrity: 166/166 files verified against `SHA256SUMS.txt`; ZIP archive hash `cbe3039cf6423d4cf90e1dd9664f358fe67d714f2c51f288c9ad5779637931a9`.
  * Architecture Registration: `server/security.js` (`AGHR_1_4_0_ROOT`, `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"`), `server/governance.js` (`aghr_1_4_0` package with 48 rules, 19 sources, 7 schemas, 7 adapters), `server/api.js` (`/api/governance/baseline`, `/api/governance/schemas`).
  * Initial Reference Preserved: `Agent Governance & RCCA Kit EN v1.3.0` preserved in `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.3.0/` and queryable as `aghr_1_3_0`.
  * Default Resolution: New workflows default to `aghr_1_4_0`; existing studio release default `aghr_rc3` preserved intact.
- **Legacy Preservation:** `aghr_rc3`, `aghr_1_3_0`, `aghr_1_2_0`, `aghr_1_1_0`, `aghr_1_0_0`, and `aapes_v2_1` remain fully accessible and unmodified.
- **INBOX Custody:** 24 tracked root files remain unchanged; INBOX intake ledger updated in `docs/governance/INBOX_INTAKE_AND_CUSTODY_RECORD_2026-11-06.md`. Intermediate `v1.3.1` archive and `Prompt - Agent Execution Governance` retained in custody.
- **Legacy Reconciliation Workstream:** `AFE-GOV-LEGACY-RECONCILE-002` established with charter and backlog in `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_CHARTER.md`.
- **Verification Suites:** 265/265 tests passing (`npm test`), 69/69 discrete SGO tests passing, 11/11 Baseline v1 adoption tests passing, context health healthy (~4,500 tokens < 5,000 tokens limit).
- **Non-Activation Invariant:** Package status remains `IMPLEMENTED_CANDIDATE / NOT_ACTIVE / NOT_OWNER_ACCEPTED`. External agent runtimes, tool interception, and production environments remain unactivated.

## Stop position
STOP: Baseline v1 updated to v1.4.0 (ADEQ 1.1) and qualified on `feat/afe-gov-baseline-001`. SGO candidate preserved at `MERGE_READY / OWNER_DECISION_REQUIRED`. Do NOT merge, push, deploy, or activate rules without separate sovereign owner authorization.
