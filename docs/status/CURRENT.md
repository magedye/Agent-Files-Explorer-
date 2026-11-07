# Baseline v1 Adoption & Historical Governance Reconciliation — Derived Execution State

Updated 2026-11-07 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing test verification.

Executed under Owner Directives `AFE-GOV-BASELINE-001`, `CLOSEOUT-003`, `RECONCILE-002`, `POST-RECONCILE-004`, `ASSURANCE-CORRECTION-005`, `OWNER-DECISIONS-006`, and `AFE-GOV-BEHAVIORAL-QUAL-007`:
- **Branch & HEAD:** On `main` (ahead of `origin/main`; no push authorized).
- **Master Ratification & Closeout Status:** `OWNER_DECISIONS_RECORDED / CONTROLLED_IMPLEMENTATION_VERIFIED / LEGACY_RECONCILIATION_OWNER_ACCEPTED_WITH_LIMITATIONS / BEHAVIORAL_QUALIFICATION_COMPLETED / RUNTIME_NOT_ACTIVE / REMOTE_NOT_PUBLISHED`
- **Workstream Execution:**
  * **Behavioral Impact Qualification (007):** Evaluated 6 core software tasks under Mode A (Native Host Alone) vs Mode B (Native Host + GOV/ADEQ). Mean quality score jumped from 53.7 to 97.5 (+81.6%), violations dropped from 7 to 0 (100% reduction), human interventions dropped from 5 to 0. Token overhead: +234.7%, latency delta: +95.3%. Full report in `docs/evidence/behavioral_qual_007/BEHAVIORAL_QUALIFICATION_REPORT.md` and dataset in `BEHAVIORAL_QUALIFICATION_DATA.json`.
  * **Master Decision Register Ratified:** All 10 adjudications (`DEC-001` through `DEC-010`) ratified as `OWNER_APPROVED` in `docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md`.
  * **Historical Reconciliation Formally Closed:** Workstream transitioned to `OWNER_ACCEPTED_WITH_DISCLOSED_LIMITATIONS` in `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_FINAL_REPORT.md` and `docs/governance/AFE_GOV_47_RULES_GRANULAR_COVERAGE_MATRIX.md`.
  * **Dual Reference Invariant Maintained:** `DEFAULT_PACKAGE_ID = "aghr_rc3"` preserved for closed Studio v1.0.0 contracts; `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"` active for new workflows.
  * **Tools Kept Strictly Optional:** Packets 2A, 2B, 2C, and Behavioral Qualification tooling remain optional developer/diagnostic utilities, not loaded automatically, no mandatory gates.
- **Verification Suites:** 106/106 direct turn tests passing (69 SGO integration, 13 Baseline v1 adoption, 12 Rule Engineer, 8 AAPES benchmark, 3 Behavioral Qualification, 1 custody), 267/267 full repository tests passing, context health verified (< 5,000 target).
- **Non-Activation Invariants:** PEP/PDP and external agent runtimes remain strictly `NOT_ACTIVE`. Production write protections and Git remote isolation preserved.

## Stop position
STOP: Behavioral qualification completed under AFE-GOV-BEHAVIORAL-QUAL-007 on `main`. Git working tree clean on tracked files. Do NOT push to origin, deploy, publish, or activate live agent runtime without explicit sovereign owner directive.
