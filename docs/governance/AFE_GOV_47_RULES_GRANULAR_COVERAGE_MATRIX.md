# AFE-GOV — Canonical 47-Rule Granular Coverage & Independence Matrix
## Tri-Partite Operational Breakdown: Semantic Coverage, Mechanism Presence, and Proven Enforcement

**Document ID:** `AFE-GOV-47-RULES-GRANULAR-COVERAGE-MATRIX`  
**Parent Directive:** `AFE-GOV-POST-RECONCILE-004 — Decision Finalization & Controlled Enhancements`  
**Target Repository:** `D:\APP\Agent-Files-Explorer` on `main`  
**Legacy Reference:** `Agent_Governance_Harness_Reference_1.2.0` (47 Rules)  
**Adopted Baseline:** `Agent Governance & RCCA Kit EN v1.4.0 + ADEQ 1.1` (`Baseline v1`)  
**Status:** `CANONICAL_HARDENED_AUDIT / VERIFIED`

---

## 1. Tri-Partite Operational Evaluation Principles

In strict adherence to Directive `AFE-GOV-POST-RECONCILE-004`, this matrix decouples three often-conflated dimensions:

1. **Semantic Coverage (`SEMANTIC`):**
   - `FULL`: Baseline rule fully addresses the core principle and obligation.
   - `PARTIAL`: Baseline rule addresses part of the principle, but specific constraints or models differ.
   - `NONE`: Principle not addressed in baseline.

2. **Mechanism Presence (`MECHANISM`):**
   - `DETERMINISTIC_TEST`: Dedicated test code exists in repository (`tests/*.test.mjs` or `tests/*.py`).
   - `EXECUTABLE_WORKFLOW`: Procedural diagnostic or quality workflow exists (`workflows/*.md` or `agdl`).
   - `DATA_SCHEMA`: Formal JSON schema contract defines and validates the data (`schemas/*.schema.json`).
   - `PROMPT_PROCEDURAL`: Behavioral guidance provided to agent via text instructions.

3. **Proven Enforcement Level (`ENFORCEMENT`):**
   - `PROVEN_DETERMINISTIC_GATE`: Fails closed automatically; violation causes test failure or HTTP 403.
   - `QUALITY_PROCEDURAL_GUIDE`: Governed agent execution practice; deviations detectable via post-run check.
   - `ADVISORY_HEURISTIC`: Static linting signal; informational only.
   - `NO_ACTIVE_ENFORCEMENT`: Purely aspirational statement without automated gating.

4. **Review Independence Level (`INDEPENDENCE`):**
   > [!IMPORTANT]
   > The label `INDEPENDENT` is strictly forbidden when the executing agent reviews its own output or runs its own tests.
   - `FIRST_PARTY_AUTOMATED`: Automated tests executed by the local developer/agent harness.
   - `FIRST_PARTY_PROCEDURAL`: Agent self-evaluates based on prompt guidelines (Zero structural isolation).
   - `OWNER_AUTHENTIC_EXTERNAL`: Genuine human owner sign-off across protected boundary (Cryptographically anchored).

---

## 2. Summary Breakdown Across 47 Rules

- **Proven Deterministic Gates (Fails Closed):** 39 rules (83.0%)
- **Quality Procedural Guides (Workflows):** 5 rules (10.6%)
- **Prompt Procedural Only:** 3 rules (6.4%)
- **Structural Model Gaps (PARTIAL):** 2 rules (4.3%) — `AGHR-017` & `AGHR-029`
- **Review Independence Claimed as "INDEPENDENT":** **0 rules (0.0%)** (Properly designated as `FIRST_PARTY_AUTOMATED` or `OWNER_AUTHENTIC`).

---

## 3. Granular Tri-Partite Coverage Table

| Legacy Rule ID & Title | Target Baseline Rules | Semantic Coverage | Mechanism Presence | Proven Enforcement Level | Review Independence Level | Identified Structural Gaps | Specific Repository Evidence |
|---|---|---|---|---|---|---|---|
| **AGHR-001**<br>Developer-first technical reference | `GOV-001 + ADEQ-03` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::CLITests.test_rule_authority_cannot_be_elevated<br>ADEQ case: QA-07 |
| **AGHR-002**<br>Authority dimensions | `GOV-001, GOV-003` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::CLITests.test_rule_authority_cannot_be_elevated<br>GOV test: tests/test_io_bridge_scope.py::CLITests.test_rule_impact_not_authority |
| **AGHR-003**<br>Reality versus obligation | `GOV-007 + ADEQ-10, ADEQ-11` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_missing_evidence<br>ADEQ case: QA-17<br>ADEQ case: QA-17 |
| **AGHR-004**<br>No automatic promotion | `GOV-021` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-10 |
| **AGHR-005**<br>Scoped conflict resolution | `GOV-010 + ADEQ-04` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-05<br>ADEQ case: QA-02 |
| **AGHR-006**<br>Instruction economy | `GOV-011 + ADEQ-12` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_quick_fix_need_not_create_spec<br>ADEQ case: QA-12 |
| **AGHR-007**<br>Context and trust preservation | `GOV-005 + ADEQ-13, ADEQ-14` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-07<br>ADEQ case: QA-14<br>ADEQ case: QA-06 |
| **AGHR-008**<br>Versioned adaptation | `GOV-013, GOV-024` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::ContinuityTests.test_continuity_revision_change<br>GOV test: BEH-10 |
| **AGHR-009**<br>Verifiable product objective | `GOV-008 + ADEQ-01, ADEQ-19` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-08<br>ADEQ case: QA-01<br>ADEQ case: QA-04 |
| **AGHR-010**<br>Bounded continuation | `GOV-004 + ADEQ-16, ADEQ-22` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-09<br>ADEQ case: QA-08<br>ADEQ case: QA-18 |
| **AGHR-011**<br>Proportionate planning | `GOV-011 + ADEQ-12` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_quick_fix_need_not_create_spec<br>ADEQ case: QA-12 |
| **AGHR-012**<br>Preserve unrelated work | `GOV-005 + ADEQ-15` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-07<br>ADEQ case: QA-14<br>tests/baseline_v1_adoption.test.mjs<br>tests/sgo_evaluations.test.mjs |
| **AGHR-013**<br>API and dependency integrity | `GOV-016` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-07 |
| **AGHR-014**<br>No test gaming | `GOV-008` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-08<br>tests/baseline_v1_adoption.test.mjs<br>tests/sgo_evaluations.test.mjs |
| **AGHR-015**<br>Reproduction and regression | `ADEQ-17` | `FULL` | `EXECUTABLE_WORKFLOW` | `QUALITY_PROCEDURAL_GUIDE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | ADEQ case: QA-11 |
| **AGHR-016**<br>Honest evidence | `GOV-007 + ADEQ-21` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_missing_evidence<br>ADEQ case: QA-10<br>tests/baseline_v1_adoption.test.mjs<br>tests/sgo_evaluations.test.mjs |
| **AGHR-017**<br>Separate acceptance | `GOV-009` | `PARTIAL` | `DETERMINISTIC_TEST + SCHEMA` | `PROVEN_DETERMINISTIC_GATE` | `OWNER_AUTHENTIC_EXTERNAL (for approvals) / FIRST_PARTY_AUTOMATED (for tests)` | Multi-persona staff role-play replaced by real automated verification + owner approval (GOV-022). | GOV test: tests/test_assurance.py::AssuranceTests.test_complete_metadata_is_not_approval |
| **AGHR-018**<br>Least privilege | `GOV-017` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::IOTests.test_sensitive_env_rejected |
| **AGHR-019**<br>Action-time authorization | `GOV-004, GOV-020` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-09<br>GOV test: tests/test_io_bridge_scope.py::ScopeTests.test_protected_over_allow |
| **AGHR-020**<br>Protected control plane | `GOV-001, GOV-003` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::CLITests.test_rule_authority_cannot_be_elevated<br>GOV test: tests/test_io_bridge_scope.py::CLITests.test_rule_impact_not_authority |
| **AGHR-021**<br>Data and egress control | `GOV-002, GOV-017` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::BridgeTests.test_injection_text_is_only_data<br>GOV test: tests/test_io_bridge_scope.py::IOTests.test_sensitive_env_rejected |
| **AGHR-022**<br>Injection resistance | `GOV-002` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::BridgeTests.test_injection_text_is_only_data |
| **AGHR-023**<br>Scoped approval | `GOV-004, GOV-009` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-09<br>GOV test: tests/test_assurance.py::AssuranceTests.test_complete_metadata_is_not_approval |
| **AGHR-024**<br>Bounded delegation | `GOV-004 + ADEQ-22` | `FULL` | `DATA_SCHEMA + TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-09<br>ADEQ case: QA-18 |
| **AGHR-025**<br>Safe retry | `GOV-019` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-06 |
| **AGHR-026**<br>Durable canonical state | `GOV-006, GOV-015` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_original_request_drift<br>GOV test: tests/test_io_bridge_scope.py::ScopeTests.test_push_reserved_not_silent |
| **AGHR-027**<br>Resource budgets | `GOV-011` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_quick_fix_need_not_create_spec |
| **AGHR-028**<br>Safe observability | `GOV-007, GOV-023` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_missing_evidence<br>GOV test: BEH-09 |
| **AGHR-029**<br>Unified change intake | `GOV-013 + ADEQ-02` | `PARTIAL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | Relational SQLite state replaced by file-based git + JSON schemas. | GOV test: tests/test_assurance.py::ContinuityTests.test_continuity_revision_change<br>ADEQ case: QA-04 |
| **AGHR-030**<br>Bounded exceptions | `GOV-004, GOV-020` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-09<br>GOV test: tests/test_io_bridge_scope.py::ScopeTests.test_protected_over_allow |
| **AGHR-031**<br>Evidence invalidation | `GOV-018` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_evidence_revision_stale |
| **AGHR-032**<br>Source custody | `GOV-006, GOV-015` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_original_request_drift<br>GOV test: tests/test_io_bridge_scope.py::ScopeTests.test_push_reserved_not_silent |
| **AGHR-033**<br>Proportionate profiles | `GOV-011 + ADEQ-20` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_quick_fix_need_not_create_spec<br>ADEQ case: QA-15 |
| **AGHR-034**<br>Simple adequate architecture | `GOV-012 + ADEQ-07, ADEQ-18` | `FULL` | `EXECUTABLE_WORKFLOW` | `QUALITY_PROCEDURAL_GUIDE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-10<br>ADEQ case: QA-03<br>ADEQ case: QA-01 |
| **AGHR-035**<br>Stop and recovery | `GOV-019 + ADEQ-09` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-06<br>ADEQ case: QA-13 |
| **AGHR-036**<br>Bound claims to artifacts | `GOV-007 + ADEQ-21` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_missing_evidence<br>ADEQ case: QA-10 |
| **AGHR-037**<br>Tool protocol validity | `GOV-016, GOV-024` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-07<br>GOV test: BEH-10 |
| **AGHR-038**<br>Instruction supply chain | `GOV-001, GOV-006` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::CLITests.test_rule_authority_cannot_be_elevated<br>GOV test: tests/test_assurance.py::AssuranceTests.test_original_request_drift |
| **AGHR-039**<br>Host qualification | `GOV-024` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-10 |
| **AGHR-040**<br>Behavioral outcome evaluation | `GOV-008 + ADEQ-19, ADEQ-24` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: BEH-08<br>ADEQ case: QA-04<br>ADEQ case: QA-19 |
| **AGHR-041**<br>Smart clarification | `ADEQ-05, ADEQ-06` | `FULL` | `PROMPT_PROCEDURAL` | `QUALITY_PROCEDURAL_GUIDE` | `FIRST_PARTY_PROCEDURAL` | None (fully aligned) | ADEQ case: QA-02<br>ADEQ case: QA-18 |
| **AGHR-042**<br>Better alternatives without substitution | `ADEQ-08` | `FULL` | `PROMPT_PROCEDURAL` | `QUALITY_PROCEDURAL_GUIDE` | `FIRST_PARTY_PROCEDURAL` | None (fully aligned) | ADEQ case: QA-03 |
| **AGHR-043**<br>Lifecycle-tailored delivery | `GOV-011 + ADEQ-12` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_assurance.py::AssuranceTests.test_quick_fix_need_not_create_spec<br>ADEQ case: QA-12 |
| **AGHR-044**<br>Branch visibility and safe closeout | `GOV-015` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::ScopeTests.test_push_reserved_not_silent |
| **AGHR-045**<br>Clear communication and actionable handoff | `ADEQ-13, ADEQ-14` | `FULL` | `PROMPT_PROCEDURAL` | `QUALITY_PROCEDURAL_GUIDE` | `FIRST_PARTY_PROCEDURAL` | None (fully aligned) | ADEQ case: QA-14<br>ADEQ case: QA-06 |
| **AGHR-046**<br>Plan alignment and observable drift | `ADEQ-12` | `FULL` | `EXECUTABLE_WORKFLOW` | `QUALITY_PROCEDURAL_GUIDE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | ADEQ case: QA-12 |
| **AGHR-047**<br>Standards applicability and claim limits | `GOV-003, GOV-007` | `FULL` | `DETERMINISTIC_TEST` | `PROVEN_DETERMINISTIC_GATE` | `FIRST_PARTY_AUTOMATED` | None (fully aligned) | GOV test: tests/test_io_bridge_scope.py::CLITests.test_rule_impact_not_authority<br>GOV test: tests/test_assurance.py::AssuranceTests.test_missing_evidence |

---

## 4. Technical Analysis: AGHR-017 & AGHR-029 Equivalence & Differences

### 4.1 AGHR-017 (Separate Acceptance)
- **Functional Equivalence:** **EQUIVALENT_PRINCIPLE_SUPERIOR_MECHANISM**.
  - *Legacy Mechanism:* The agent prompt simulated a "Developer" persona and a "Reviewer" persona. Both ran in the same context window with identical LLM weights, producing synthetic self-dialogue with zero real isolation.
  - *Baseline v1 Mechanism:* Replaces the synthetic staff illusion with an enforceable system boundary:
    1. Technical verification is executed via deterministic tests (`npm test`, `GOV-007`).
    2. The agent is strictly prohibited from claiming "INDEPENDENT" review (`GOV-022`).
    3. Normative approval is guarded by `POST /api/v1/sgo/decisions/protected`, which fails closed (HTTP 403 `BLOCKED_UNPROVISIONED_OWNER_AUTH`) without authentic owner credentials.
  - *Loss Assessment:* Loss of synthetic prompt role-play (intentional removal of manufactured independence). Zero loss of protection.

### 4.2 AGHR-029 (Unified Change Intake)
- **Functional Equivalence:** **FUNCTIONALLY_EQUIVALENT_REPLACEMENT**.
  - *Legacy Mechanism:* Centralized 12-table SQLite database (`governance.db`) managed via Python `cli3.py` daemon.
  - *Baseline v1 Mechanism:* Dual-gated file-based architecture:
    1. Git commit ancestry provides cryptographically immutable, tamper-evident audit history (`GOV-006`, `GOV-015`).
    2. Lightweight, human-auditable JSON schemas (`trace.schema.json`, `action.schema.json`) enforce change impact classification, authority tracking, and evidence linkage.
    3. Zero-dependency offline `agdl` CLI replaces heavy subprocess execution.
  - *Loss Assessment:* Loss of native SQL `SELECT` / `JOIN` syntax from CLI. Gain in portability, human readability, zero native C-extension dependencies, and Git cryptographic verification.
