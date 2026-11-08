# Baseline v1 Adoption & Historical Governance Reconciliation — Derived Execution State

Updated 2026-11-08 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing tests.

Executed under Owner Directives `AFE-GOV-BASELINE-001` through `AFE-GOV-BEHAVIORAL-VALIDITY-008`:
- **Branch & HEAD:** On `main` (ahead of `origin/main`; no push authorized).
- **Master Status:** `OWNER_DECISIONS_RECORDED / LEGACY_RECONCILIATION_OWNER_ACCEPTED_WITH_LIMITATIONS / BEHAVIORAL_SYNTHETIC_AUDIT_COMPLETED / REAL_PROTOCOL_ESTABLISHED / LIVE_EXECUTION_DEFERRED_PENDING_BUDGET / RUNTIME_NOT_ACTIVE / REMOTE_NOT_PUBLISHED`
- **Workstream Execution:**
  * **Behavioral Validity & Forensic Audit (008):** QUAL-007 adjudicated as `SYNTHETIC_EVALUATOR_TEST_ONLY`: zero live LLM calls; metrics generated from static fixtures in `tools/behavioral_qualification/run_qualification.py` and programmatic heuristics in `evaluator.py`. Circular evaluation identified and annotated with disclaimers. Full forensic report: `docs/governance/AFE_GOV_BEHAVIORAL_VALIDITY_008_AUDIT_REPORT.md`.
  * **Real-Agent Protocol Established:** Publication-grade protocol `AFE-GOV-REAL-QUAL-PROTOCOL-008` codified with 8 tasks (including neutral counter-scenarios T7 & T8 for pure overhead), tri-mode evaluation (Mode A: Host Alone, Mode B: Full GOV/ADEQ, Mode C: Tiered Candidate), double-blind review, and real process metrics. Live model execution deferred pending explicit budget authorization.
  * **Master Decision Register Ratified:** All 10 adjudications (`DEC-001` to `DEC-010`) ratified as `OWNER_APPROVED` in `docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md`.
  * **Historical Reconciliation Closed:** Workstream transitioned to `OWNER_ACCEPTED_WITH_DISCLOSED_LIMITATIONS` in `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_FINAL_REPORT.md`.
  * **Dual Reference Invariant Maintained:** `DEFAULT_PACKAGE_ID = "aghr_rc3"` preserved for closed Studio v1.0.0; `DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"` active for new workflows.
  * **Tools Kept Strictly Optional:** Packets 2A, 2B, 2C, and Behavioral Qualification tooling remain optional diagnostic utilities.
- **Verification Suites:** 106/106 direct turn tests passing, 267/267 full repository tests passing, context health verified (< 5,000 target).
- **Non-Activation Invariants:** PEP/PDP and external agent runtimes remain strictly `NOT_ACTIVE`. Production write protections and Git remote isolation preserved.

## Stop position
STOP: Behavioral validity forensic audit and real-agent protocol completed under AFE-GOV-BEHAVIORAL-VALIDITY-008 on `main`. Git working tree clean on tracked files. Do NOT push to origin, deploy, publish, or activate live agent runtime without explicit sovereign owner directive.
