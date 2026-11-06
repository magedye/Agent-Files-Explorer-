# Baseline v1 Adoption & Candidate Preservation — Execution Record

Updated 2026-11-06 Asia/Aden. Locator for current execution authority and verified repository state.

Executed under Owner Directives `AFE-GOV-BASELINE-001` and subsequent owner update directive on branch `feat/afe-gov-baseline-001`:
- **Current Candidate Preservation:** `feat/aghr-qle-gov-obs-006-integrity` at commit `4849eb48eee5c4eb866163d51563a5b0e9d2b61c` verified and preserved intact. Status: `MERGE_READY / OWNER_DECISION_REQUIRED`.
- **Baseline v1 Adoption (v1.4.0 with ADEQ 1.1):** `BASELINE_V1_ADOPTED`.
  * `Agent_Governance_RCCA_Kit_EN_v1.4.0` registered in `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.4.0/`.
  * Official release manifest: `governance_packages/references/AGHR_Studio_1.4.0_Baseline_v1_RELEASE.json`.
  * Checksum verification: 166/166 files verified against `SHA256SUMS.txt`. Archive zip hash `cbe3039cf6423d4cf90e1dd9664f358fe67d714f2c51f288c9ad5779637931a9`.
  * Architecture integration: `server/security.js` (`AGHR_1_4_0_ROOT`, `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"`), `server/governance.js` (`aghr_1_4_0` package with 48 rules, 19 sources, 7 schemas, 7 adapters), `server/api.js` (`/api/governance/baseline`, `/api/governance/schemas`).
  * Default resolution: Default baseline for applicable new application workflows (`isDefaultBaseline: true`); existing studio release default `aghr_rc3` preserved intact.
  * Earlier v1.3.0 baseline reference preserved under `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.3.0/` and queryable as `aghr_1_3_0`.
- **Legacy Packages Preserved:** `aghr_rc3`, `aghr_1_3_0`, `aghr_1_2_0`, `aghr_1_1_0`, `aghr_1_0_0`, and `aapes_v2_1` remain intact, accessible, and unmodified.
- **INBOX Custody Intact:** 24 tracked root files remain unchanged; INBOX custody record documented in `docs/governance/INBOX_INTAKE_AND_CUSTODY_RECORD_2026-11-06.md`.
- **Legacy Reconciliation Workstream:** `AFE-GOV-LEGACY-RECONCILE-002` chartered with traceable backlog in `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_CHARTER.md`.
- **Verification Suites:** 265/265 tests passing (`npm test`), 69/69 SGO integration tests passing, 11/11 Baseline v1 adoption tests passing.
- **Non-Activation Invariants:** No external agent runtime, tool interception, or production environment activated. Owner endpoint remains fail-closed.

STOP: Completed and qualified on `feat/afe-gov-baseline-001`. SGO candidate preserved at `MERGE_READY / OWNER_DECISION_REQUIRED`. Stopped for sovereign owner review.
