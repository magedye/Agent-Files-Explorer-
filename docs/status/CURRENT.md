# Baseline v1 Adoption & Historical Governance Reconciliation — Derived Execution State

Updated 2026-11-08 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing tests.

Executed under Owner Directives `AFE-GOV-BASELINE-001` through `AFE-GOV-FINAL-INTAKE-LIFECYCLE-010`:
- **Branch & HEAD:** On `main` (ahead of `origin/main`; no push authorized).
- **Master Status:** `OWNER_DECISIONS_RECORDED / INTAKE_LIFECYCLE_QUALIFIED / P0_ARCHIVAL_VERIFIED / REAL_PROTOCOL_ESTABLISHED / LIVE_EXECUTION_DEFERRED_PENDING_BUDGET / RUNTIME_NOT_ACTIVE / REMOTE_NOT_PUBLISHED`
- **Workstream Execution:**
  * **Governed Intake & Archival (010):** Qualified permanent system for multi-source intake (chat, files, folders, safe ZIP). Established P0 Governed Archival Cycle with descriptive naming, replica hash check, inbox clearance, partial-processing custody, and `docs/reference_library/`. All 14 acceptance tests passing (`tests/intake_lifecycle.test.mjs`). Report: `docs/governance/AFE_GOV_FINAL_INTAKE_LIFECYCLE_010_REPORT.md`.
  * **Request Custody (009):** Closed operational gap. 9-field standard card and state machine in `docs/governance/GOVERNED_REQUEST_CUSTODY_PROCEDURE.md`. Verified via `tests/request_custody.test.mjs` (11/11 passing).
  * **Behavioral Validity (008):** QUAL-007 audited as `SYNTHETIC_EVALUATOR_TEST_ONLY`. Real protocol `AFE-GOV-REAL-QUAL-PROTOCOL-008` codified (8 tasks). Live execution deferred as `REQ-AFE-QUAL-008-LIVE` pending budget.
  * **Owner Decisions Ratified:** Decisions `DEC-001` to `DEC-010` ratified in `docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md`. Historical reconciliation closed.
  * **Dual Baseline Invariant:** `DEFAULT_PACKAGE_ID = "aghr_rc3"` for closed Studio v1.0.0; `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"` for new workflows. Optional tools (2A, 2B, 2C) remain diagnostic.
- **Verification Suites:** 39/39 direct node tests passing, 11/11 python tests passing, 267+ full repository tests passing, context health verified (< 5,000 target).
- **Non-Activation Invariants:** PEP/PDP remains strictly `NOT_ACTIVE`. Remote push and deployment isolated.

## Stop position
STOP: Governed intake lifecycle integration and P0 archival qualified and accepted under AFE-GOV-FINAL-INTAKE-LIFECYCLE-010 on `main` (COMPLETE_IN_SCOPE). Deferred item REQ-AFE-QUAL-008-LIVE maintained under governed custody (scope: NONE_DEFERRED; Next Review Due: 2026-12-01 [PROPOSED_TARGET_DATE / NOT_OWNER_RATIFIED]; Currently Authorized Action: NONE). Working tree clean on tracked files. Do NOT push to origin or deploy without explicit owner directive.
