# Baseline v1 Adoption & Historical Governance Reconciliation — Derived Execution State

Updated 2026-11-07 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing test verification.

Executed under Owner Directives `AFE-GOV-BASELINE-001`, `AFE-GOV-BASELINE-QUAL-002`, `AFE-GOV-BASELINE-CLOSEOUT-003`, and `AFE-GOV-LEGACY-RECONCILE-002`:
- **Branch & HEAD:** On `main` at commit `3ca16c5` (9 commits ahead of `origin/main`; no push authorized).
- **DEF-01 Remediation:** Closed out in `server/governance.js` by explicitly initializing `this._defaultBaselinePackageId = DEFAULT_BASELINE_PACKAGE_ID`. Verified with 2 regression tests (total 13 tests in `tests/baseline_v1_adoption.test.mjs`).
- **Baseline v1 Adoption (v1.4.0 with ADEQ 1.1):** `BASELINE_V1_INTEGRATED_ON_MAIN`.
  * Active Release: `Agent Governance & RCCA Kit EN v1.4.0` in `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.4.0` (with ADEQ 1.1 quality layer, 24 Core + 24 ADEQ rules, 19 sources, 7 schemas, 7 quality workflows).
  * Manifest: `governance_packages/references/AGHR_Studio_1.4.0_Baseline_v1_RELEASE.json`.
  * Integrity: 166/166 files verified against `SHA256SUMS.txt`; ZIP archive hash `cbe3039cf6423d4cf90e1dd9664f358fe67d714f2c51f288c9ad5779637931a9`.
  * Architecture Registration: `server/security.js` (`AGHR_1_4_0_ROOT`, `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"`), `server/governance.js` (`aghr_1_4_0` package), `server/api.js`.
  * Preserved References: `aghr_rc3` preserved as official local release default for Studio v1.0.0; `aghr_1_3_0` preserved as frozen baseline reference; `aghr_1_2_0` preserved for Governed Learning; `aghr_1_1_0` & `1.0.0` archived.
- **Historical Governance Reconciliation Deliverables (AFE-GOV-LEGACY-RECONCILE-002 Hardened):**
  * Canonical Synthesis Report: `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_FINAL_REPORT.md`.
  * Granular 47-Rule Coverage Matrix: `docs/governance/AFE_GOV_47_RULES_GRANULAR_COVERAGE_MATRIX.md` (3 full textual/operational, 2 textual/semantic, 37 semantic/operational, 3 semantic procedural, 2 partial gaps: `AGHR-017` & `AGHR-029`).
  * Master Owner Decision Register: `docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md` (10 core adjudications `DEC-001` through `DEC-010`).
  * Qualified Enhancement Packets: `docs/governance/candidates/PACKET_2A_RULE_ENGINEER_QUALIFICATION.md`, `PACKET_2B_ARABIC_OPERATIONAL_PROFILE.md`, `PACKET_2C_AAPES_DIAGNOSTIC_BENCHMARK.md`.
- **Verification Suites:** 83/83 fresh turn tests passing (69 SGO integration, 13 Baseline v1 adoption, 1 custody), 267/267 historical tests passing, context health verified (~4,929 tokens < 5,000 target).
- **Non-Activation Invariant:** Package status remains `IMPLEMENTED_CANDIDATE / NOT_ACTIVE / NOT_OWNER_ACCEPTED`. External agent runtimes, tool interception, and production environments remain unactivated.

## Stop position
STOP: Hardened Historical Governance Reconciliation completed and deposited in `docs/governance/`. Git working tree clean on tracked files. Stopped for owner review. Do NOT push to origin, deploy, publish, or activate live agent runtime without explicit sovereign owner directive.
