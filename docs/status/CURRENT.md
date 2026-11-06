# Baseline v1 Adoption & Candidate Preservation — Derived Execution State

Updated 2026-11-06 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing test verification.

Executed under Owner Directive `AFE-GOV-BASELINE-001`:
- **Branch & Baseline:** Feature branch `feat/afe-gov-baseline-001` branched from `feat/aghr-qle-gov-obs-006-integrity` at commit `4849eb48eee5c4eb866163d51563a5b0e9d2b61c`.
- **SGO Candidate Status:** `MERGE_READY / OWNER_DECISION_REQUIRED`. Candidate integrity changes and all 69 SGO verification checks preserved intact. Not merged into `main` or pushed without owner authorization.
- **Baseline v1 Adoption:** `BASELINE_V1_ADOPTED`.
  * Package: `Agent Governance & RCCA Kit EN v1.3.0` registered in `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.3.0`.
  * Manifest: `governance_packages/references/AGHR_Studio_1.3.0_Baseline_v1_RELEASE.json`.
  * Integrity: 102/102 files verified against `SHA256SUMS.txt`; ZIP archive hash `613bd920bb156314bd74d0e5034a6d74659d93dafc588611222bae7e4ea92766`.
  * Architecture Registration: `server/security.js` (`AGHR_1_3_0_ROOT`, `DEFAULT_BASELINE_PACKAGE_ID`, `RootRegistry`), `server/governance.js` (`aghr_1_3_0` package, 24 rules GOV-001..GOV-024, 14 sources S01..S14, 6 adapters, 4 profiles, 4 schemas), `server/api.js` (`/api/governance/baseline`, `/api/governance/schemas`).
  * Default Resolution: Default baseline for applicable new application workflows; existing studio release default `aghr_rc3` preserved intact.
- **Legacy Preservation:** `aghr_rc3`, `aghr_1_2_0`, `aghr_1_1_0`, `aghr_1_0_0`, and `aapes_v2_1` remain fully accessible and unmodified.
- **INBOX Custody:** 24 tracked root files remain unchanged; INBOX intake and custody ledger documented in `docs/governance/INBOX_INTAKE_AND_CUSTODY_RECORD_2026-11-06.md`.
- **Legacy Reconciliation Workstream:** `AFE-GOV-LEGACY-RECONCILE-002` established with charter and traceable backlog in `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_CHARTER.md`.
- **Verification Suites:** 265/265 tests passing (`npm test`), 69/69 discrete SGO tests passing, 11/11 Baseline v1 adoption tests passing, context health healthy (~4,300 tokens < 5,000 tokens limit).
- **Non-Activation Invariant:** Package status remains `IMPLEMENTED_CANDIDATE / NOT_ACTIVE / NOT_OWNER_ACCEPTED`. External agent runtimes, tool interception, and production environments remain unactivated.

## Stop position
STOP: Baseline v1 adopted and qualified on `feat/afe-gov-baseline-001`. SGO candidate preserved at `MERGE_READY / OWNER_DECISION_REQUIRED`. Do NOT merge, push, deploy, or activate rules without separate sovereign owner authorization.
