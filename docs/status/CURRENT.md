# Baseline v1 Adoption & Historical Governance Reconciliation — Derived Execution State

Updated 2026-11-12 Asia/Aden (owner-accepted). Ground truth is determined by actual Git HEAD, working tree, and passing tests.

Executed under Owner Directives `AFE-GOV-BASELINE-001` through `AFE-GOV-INTAKE-OPERATIONAL-CLOSURE-011`:
- **Branch & HEAD:** On `main`, synced with `origin/main`.
- **Master Status:** `OWNER_DECISIONS_RATIFIED / INTAKE_OPERATIONAL_COMPLETE_IN_SCOPE / P0_ARCHIVAL_VERIFIED / ACTIVE_INBOX_CLEARED / 24_HISTORICAL_PROTECTED / REAL_PROTOCOL_ESTABLISHED / LIVE_EXECUTION_DEFERRED_PENDING_BUDGET / RUNTIME_NOT_ACTIVE / REMOTE_PUBLISHED`
- **Workstream Execution:**
  * **Intake Operational Closure (011):** Live operational intake completed. 15 active items in `INBOX/NEW/` fully processed (5 archives + 1 rejected proposal archived in `docs/archive/governed_intake/` with verified replica hashes; 1 redundant directory purged; 8 reference assets cataloged in `docs/reference_library/`). 24 historical baseline root files in `INBOX/` verified intact (`PROTECTED_HISTORICAL`). Physical integration mechanism (`applyIntegration`) verified. 48/48 Node tests, 20/20 Python tests passing. Report: `docs/governance/AFE_GOV_INTAKE_OPERATIONAL_CLOSURE_011_REPORT.md`.
  * **Governed Intake Engine (010):** Qualified multi-source intake (chat, files, folders, safe ZIP). Established P0 Governed Archival Cycle. All 14 acceptance tests passing. Report: `docs/governance/AFE_GOV_FINAL_INTAKE_LIFECYCLE_010_REPORT.md`.
  * **Request Custody (009):** 9-field standard card and state machine in `docs/governance/GOVERNED_REQUEST_CUSTODY_PROCEDURE.md`. Verified via `tests/request_custody.test.mjs` (11/11 passing).
  * **Behavioral Validity (008):** QUAL-007 audited as synthetic. Protocol `AFE-GOV-REAL-QUAL-PROTOCOL-008` codified. Live execution deferred as `REQ-AFE-QUAL-008-LIVE` pending budget.
  * **Owner Decisions Ratified:** Decisions `DEC-001` to `DEC-010` ratified in `docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md`. Historical reconciliation closed.
  * **Dual Baseline Invariant:** `DEFAULT_PACKAGE_ID = "aghr_rc3"` for Studio v1.0.0; `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"` for new workflows. Optional tools (2A, 2B, 2C) remain diagnostic.
- **Verification Suites:** Full `npm test` = **357/357 (0 failures)**; 20/20 Python diagnostics. Published (`bb76bf8`, `77c7579`).
- **Non-Activation Invariants:** PEP/PDP remains strictly `NOT_ACTIVE`. Remote push and deployment isolated.
- **Acceptance State:** `OWNER_ACCEPTED_IN_SCOPE / CORRECTIVE_WORKSTREAM_CLOSED / RELEASE_NOT_AUTHORIZED`.

## Stop position
STOP: Operational intake processing, archival, and reference cataloging complete under AFE-GOV-INTAKE-OPERATIONAL-CLOSURE-011 on `main` (OPERATIONAL_COMPLETE_IN_SCOPE). Deferred item REQ-AFE-QUAL-008-LIVE maintained under governed custody (scope: NONE_DEFERRED; Next Review Due: 2026-12-01 [PROPOSED_TARGET_DATE / NOT_OWNER_RATIFIED]; Currently Authorized Action: NONE). Active INBOX cleared; 24 historical baseline files preserved. Do NOT push to origin or deploy without explicit owner directive.
