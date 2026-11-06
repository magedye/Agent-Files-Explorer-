# Baseline v1 Adoption & Integration Closeout — Execution Record

Updated 2026-11-07 Asia/Aden. Locator for current execution authority and verified repository state.

Executed under Owner Directives `AFE-GOV-BASELINE-001`, `AFE-GOV-BASELINE-QUAL-002`, and `AFE-GOV-BASELINE-CLOSEOUT-003`:
- **Current Baseline on main:** Merged locally into `main` at commit `683c0813fecefc873c03b11b3b3ac50f12ce43a7` via fast-forward.
- **DEF-01 Remediation:** Closed out in `server/governance.js` by explicitly initializing `this._defaultBaselinePackageId = DEFAULT_BASELINE_PACKAGE_ID`. Verified with 2 new regression tests (total 13 tests in `tests/baseline_v1_adoption.test.mjs`).
- **Baseline v1 Integration (v1.4.0 with ADEQ 1.1):** `BASELINE_V1_INTEGRATED_ON_MAIN`.
  * `Agent_Governance_RCCA_Kit_EN_v1.4.0` registered in `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.4.0/`.
  * Official release manifest: `governance_packages/references/AGHR_Studio_1.4.0_Baseline_v1_RELEASE.json`.
  * Checksum verification: 166/166 files verified against `SHA256SUMS.txt`. Archive zip hash `cbe3039cf6423d4cf90e1dd9664f358fe67d714f2c51f288c9ad5779637931a9`.
  * Architecture integration: `server/security.js` (`AGHR_1_4_0_ROOT`, `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"`), `server/governance.js` (`aghr_1_4_0` package with 48 rules, 19 sources, 7 schemas, 7 adapters), `server/api.js` (`/api/governance/baseline`, `/api/governance/schemas`).
  * Default resolution: Default baseline for applicable new application workflows (`isDefaultBaseline: true`); existing studio release default `aghr_rc3` preserved intact.
  * Earlier v1.3.0 baseline reference preserved under `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.3.0/` and queryable as `aghr_1_3_0`.
- **Legacy Packages Preserved:** `aghr_rc3`, `aghr_1_3_0`, `aghr_1_2_0`, `aghr_1_1_0`, `aghr_1_0_0`, and `aapes_v2_1` remain intact, accessible, and unmodified.
- **INBOX Custody Intact:** 24 tracked root files remain unchanged; INBOX custody record documented in `docs/governance/INBOX_INTAKE_AND_CUSTODY_RECORD_2026-11-06.md`.
- **Legacy Reconciliation Workstream:** `AFE-GOV-LEGACY-RECONCILE-002` chartered with traceable backlog in `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_CHARTER.md`.
- **Verification Suites:** 267/267 tests passing (`npm test`), 69/69 SGO integration tests passing, 13/13 Baseline v1 adoption tests passing.
- **Non-Activation Invariants:** No external agent runtime, tool interception, or production environment activated. Owner endpoint remains fail-closed.

STOP: Completed, verified, and integrated into `main` locally. Stopped for sovereign owner review. Do NOT push to origin or deploy without explicit sovereign owner authorization.
