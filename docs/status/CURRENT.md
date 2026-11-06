# Baseline v1 Adoption & Historical Governance Reconciliation — Derived Execution State

Updated 2026-11-07 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing test verification.

Executed under Owner Directives `AFE-GOV-BASELINE-001`, `AFE-GOV-BASELINE-QUAL-002`, `AFE-GOV-BASELINE-CLOSEOUT-003`, and `AFE-GOV-LEGACY-RECONCILE-002`:
- **Branch & HEAD:** On `main` at commit `522b63d` (7 commits ahead of `origin/main`; no push authorized).
- **DEF-01 Remediation:** Closed out in `server/governance.js` by explicitly initializing `this._defaultBaselinePackageId = DEFAULT_BASELINE_PACKAGE_ID`. Verified with 2 regression tests (total 13 tests in `tests/baseline_v1_adoption.test.mjs`).
- **Baseline v1 Adoption (v1.4.0 with ADEQ 1.1):** `BASELINE_V1_INTEGRATED_ON_MAIN`.
  * Active Release: `Agent Governance & RCCA Kit EN v1.4.0` in `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.4.0` (with ADEQ 1.1 quality layer, 24 Core + 24 ADEQ rules, 19 sources, 7 schemas, 7 quality workflows).
  * Manifest: `governance_packages/references/AGHR_Studio_1.4.0_Baseline_v1_RELEASE.json`.
  * Integrity: 166/166 files verified against `SHA256SUMS.txt`; ZIP archive hash `cbe3039cf6423d4cf90e1dd9664f358fe67d714f2c51f288c9ad5779637931a9`.
  * Architecture Registration: `server/security.js` (`AGHR_1_4_0_ROOT`, `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"`), `server/governance.js` (`aghr_1_4_0` package), `server/api.js`.
  * Preserved References: `aghr_rc3` preserved as official local release default for Studio v1.0.0; `aghr_1_3_0` preserved as frozen baseline reference; `aghr_1_2_0` preserved for Governed Learning; `aghr_1_1_0` & `1.0.0` archived.
- **Historical Governance Reconciliation (AFE-GOV-LEGACY-RECONCILE-002 Hardened):**
  * Completed independent audit of 8 packages, 24 INBOX files, 13 INBOX/NEW items, 47 legacy AGHR rules, and 48 AAPES requirements.
  * Formulated corrected 7-tier authority hierarchy (Layers 0A to 6) separating platform instructions, host sandboxes, owner decisions, and candidate oracles.
  * Re-evaluated 47 legacy rules: 3 Full Textual & Operational, 2 Textual & Semantic, 37 Semantic & Operational, 3 Semantic Procedural Only, and 2 concrete structural gaps (`AGHR-017` role-play and `AGHR-029` SQLite).
  * Three supersessions formally reclassified as `PENDING_OWNER_RECOMMENDATION`.
  * Created 10-item Owner Decision Register (`DEC-001` to `DEC-010`).
  * Qualified Candidate Packet 2A (`tools/rule_engineer/`) as 100% Python standard library. Formulated Packets 2B and 2C.
  * Canonical report committed in `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_FINAL_REPORT.md`.
- **Verification Suites:** 83/83 fresh turn tests passing (69 SGO integration, 13 Baseline v1 adoption, 1 custody), 267/267 historical tests passing, context health verified (~4,721 tokens < 5,000 target).
- **Non-Activation Invariant:** Package status remains `IMPLEMENTED_CANDIDATE / NOT_ACTIVE / NOT_OWNER_ACCEPTED`. External agent runtimes, tool interception, and production environments remain unactivated.

## Stop position
STOP: Hardened Historical Governance Reconciliation completed and deposited in `docs/governance/`. Git working tree clean on tracked files. Stopped for owner review. Do NOT push to origin, deploy, publish, or activate live agent runtime without explicit sovereign owner directive.
