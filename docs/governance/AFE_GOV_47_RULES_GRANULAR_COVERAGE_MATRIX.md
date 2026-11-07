# AFE-GOV — Canonical 47-Rule Granular Coverage & Independence Matrix
## Decoupled Assurance Breakdown: Semantic Coverage, Mechanism Presence, and Proven Enforcement Boundaries

**Document ID:** `AFE-GOV-47-RULES-GRANULAR-COVERAGE-MATRIX`  
**Parent Directive:** `AFE-GOV-ASSURANCE-CORRECTION-005 — Evidence Boundary Hardening`  
**Target Repository:** `D:\APP\Agent-Files-Explorer` on `main`  
**Legacy Reference:** `Agent_Governance_Harness_Reference_1.2.0` (47 Rules)  
**Adopted Baseline:** `Agent Governance & RCCA Kit EN v1.4.0 + ADEQ 1.1` (`Baseline v1`)  
**Status:** `CANONICAL_HARDENED_AUDIT / VERIFIED`

---

## 1. Four-Tier Enforcement Taxonomy & Operational Evaluation Principles

In strict adherence to Directive `AFE-GOV-ASSURANCE-CORRECTION-005`, this matrix decouples automated test assertions, procedural guides, and prompt instructions from true inline preventative runtime blocks:

1. **Semantic Coverage (`SEMANTIC`):**
   - `FULL`: Target baseline rules completely address the core principle and obligation.
   - `PARTIAL`: Target baseline rules address parts of the principle, but architectural models or constraints differ with documented gaps.
   - `NONE`: Principle not addressed in baseline.

2. **Mechanism Presence (`MECHANISM`):**
   - `DETERMINISTIC_TEST`: Test assertions verify property in test suites (`tests/*.test.mjs`, `tests/*.py`).
   - `DATA_SCHEMA`: Formal JSON schema defines contract (`schemas/*.schema.json`).
   - `IO_BRIDGE / HTTP_GATE`: Runtime filter, path boundary, or HTTP interceptor code.
   - `EXECUTABLE_WORKFLOW`: Structured diagnostic/quality procedure (`workflows/*.md`, `agdl`).
   - `PROMPT_PROCEDURAL`: Guidance text in prompt adapters.

3. **Four-Tier Enforcement Classification (`ENFORCEMENT`):**
   - **`PROVEN_PREVENTATIVE_BLOCK`:** Runtime software boundary actively halts execution, rejects input, returns HTTP 4xx, or aborts operation before state mutation (e.g. path traversal rejection, HTTP 403 on protected endpoint, JSON schema validation failure, SGO ledger tamper detection).
   - **`DETERMINISTIC_TEST_VERIFIED`:** Automated test asserts that a property holds during test execution. Verifies compliance in test scenarios; does NOT act as an inline runtime block in live agent sessions unless run in CI/preflight.
   - **`WORKFLOW_PROCEDURAL_GUIDE`:** Governed execution procedure (`workflows/*.md`, ADEQ QA cases); non-compliance detectable via procedural checks.
   - **`PROMPT_BEHAVIORAL_GUIDANCE`:** Behavioral instruction in prompt adapters; no software code interception.

4. **Review Independence Level (`INDEPENDENCE`):**
   > [!IMPORTANT]
   > The label `INDEPENDENT` is strictly forbidden when the executing agent reviews its own output or runs its own tests.
   - `FIRST_PARTY_AUTOMATED`: Automated verification executed by the developer/agent harness locally.
   - `FIRST_PARTY_PROCEDURAL`: Agent self-evaluates based on prompt guidelines (Zero structural isolation).
   - `OWNER_AUTHENTIC_EXTERNAL`: Genuine human owner sign-off across protected boundary (Cryptographically anchored).

---

## 2. Summary Breakdown Across 47 Rules

- **Proven Preventative Blocks (Fails Closed at Runtime):** **10 rules (21.3%)**
  (`AGHR-013`, `AGHR-017`, `AGHR-018`, `AGHR-019`, `AGHR-021`, `AGHR-022`, `AGHR-023`, `AGHR-026`, `AGHR-030`, `AGHR-044`)
- **Deterministic Test-Verified Scenarios (Verified in Test Suites):** **29 rules (61.7%)**
- **Quality Procedural Guides (Workflows & Diagnostics):** **5 rules (10.6%)**
- **Prompt Behavioral Guidance Only:** **3 rules (6.4%)**
- **Structural Model Gaps (PARTIAL):** **2 rules (4.3%)** — `AGHR-017` & `AGHR-029`
- **Review Independence Claimed as "INDEPENDENT":** **0 rules (0.0%)** (Properly designated as `FIRST_PARTY_AUTOMATED` or `FIRST_PARTY_PROCEDURAL`).

---

## 3. Granular Tri-Partite Coverage & Enforcement Boundaries Table

| Legacy Rule ID & Title | Target Baseline Rules | Semantic Coverage | Mechanism Presence | Proven Enforcement Level | Protected Operation & Action Boundary | Blocking Mechanism | Proving Test / Concrete Evidence |
|---|---|---|---|---|---|---|---|
| **AGHR-001**<br>Developer-first technical reference | `GOV-001 + ADEQ-03` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Rule authority assignment; boundary prevents elevating rule authority over platform rules. | Test assertion failure on unauthorized authority assignment. | `tests/test_io_bridge_scope.py::CLITests.test_rule_authority_cannot_be_elevated` |
| **AGHR-002**<br>Authority dimensions | `GOV-001, GOV-003` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Impact classification; boundary prevents confusing impact score with authority level. | Test assertion failure separating impact from authority. | `tests/test_io_bridge_scope.py::CLITests.test_rule_impact_not_authority` |
| **AGHR-003**<br>Reality versus obligation | `GOV-007 + ADEQ-10, ADEQ-11` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Assurance claim evaluation; boundary flags ungrounded assertions. | Test assertion failure when required evidence artifact is missing. | `tests/test_assurance.py::AssuranceTests.test_missing_evidence` |
| **AGHR-004**<br>No automatic promotion | `GOV-021` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Candidate package lifecycle; boundary prevents auto-promotion to baseline. | Test assertion failure ensuring candidates remain unpromoted without owner directive. | `tests/baseline_v1_adoption.test.mjs` (BEH-10) |
| **AGHR-005**<br>Scoped conflict resolution | `GOV-010 + ADEQ-04` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Rule precedence evaluation; boundary resolves rule priority deterministically. | Test assertion failure when priority order is violated. | `tests/sgo_integration.test.mjs` (BEH-05, QA-02) |
| **AGHR-006**<br>Instruction economy | `GOV-011 + ADEQ-12` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Context window consumption; boundary enforces 5,000 token bootstrap limit. | Script exits code 1 if budget exceeded (`tools/check_context_health.mjs`). | `tools/check_context_health.mjs` |
| **AGHR-007**<br>Context and trust preservation | `GOV-005 + ADEQ-13, ADEQ-14` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Baseline stability; boundary prevents altering working code/tests. | Test assertion failure on regression in baseline adoption suite. | `tests/baseline_v1_adoption.test.mjs` |
| **AGHR-008**<br>Versioned adaptation | `GOV-013, GOV-024` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Policy revision change; boundary flags state mismatch across revisions. | Test assertion failure on revision mismatch. | `tests/test_assurance.py::ContinuityTests.test_continuity_revision_change` |
| **AGHR-009**<br>Verifiable product objective | `GOV-008 + ADEQ-01, ADEQ-19` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Objective acceptance; boundary requires concrete test verification. | Test assertion failure on ungrounded task completion. | `tests/baseline_v1_adoption.test.mjs` (BEH-08) |
| **AGHR-010**<br>Bounded continuation | `GOV-004 + ADEQ-16, ADEQ-22` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Autonomous iteration loop; boundary halts unguided recursive execution. | Harness execution timeout and step budget limit. | `tests/baseline_v1_adoption.test.mjs` (BEH-09) |
| **AGHR-011**<br>Proportionate planning | `GOV-011 + ADEQ-12` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Workflow complexity scaling; boundary permits minimal specs for trivial repairs. | Test assertion verifies lightweight profile acceptance. | `tests/test_assurance.py::AssuranceTests.test_quick_fix_need_not_create_spec` |
| **AGHR-012**<br>Preserve unrelated work | `GOV-005 + ADEQ-15` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Scope boundary; boundary prevents modifying files outside task objective. | Git diff and status assertion checks in test suite. | `tests/baseline_v1_adoption.test.mjs` |
| **AGHR-013**<br>API and dependency integrity | `GOV-016` | `FULL` | `DATA_SCHEMA + HTTP_GATE` | `PROVEN_PREVENTATIVE_BLOCK` | API payload ingestion; boundary rejects malformed JSON exports. | Schema validator rejects malformed payload with `VALIDATION_FAILED` (HTTP 400). | `tests/sgo_integration.test.mjs::ADV-02` |
| **AGHR-014**<br>No test gaming | `GOV-008` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Test integrity; boundary prevents test deletion or relaxing assertions. | Runner asserts exact count of active tests and enforces failure on regression. | `tests/baseline_v1_adoption.test.mjs` |
| **AGHR-015**<br>Reproduction and regression | `ADEQ-17` | `FULL` | `EXECUTABLE_WORKFLOW` | `WORKFLOW_PROCEDURAL_GUIDE` | Defect repair process; boundary requires symptom reproduction before patch. | Procedural workflow checkpoint in `workflows/defect_rca.md`. | ADEQ Case QA-11 |
| **AGHR-016**<br>Honest evidence | `GOV-007 + ADEQ-21` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Evidence reporting; boundary requires actual test runner output and disk paths. | Test assertion failure on synthetic or missing log entries. | `tests/sgo_integration.test.mjs` (AC-08, AC-10) |
| **AGHR-017**<br>Separate acceptance | `GOV-009, GOV-022` | `PARTIAL` | `DATA_SCHEMA + HTTP_GATE` | `PROVEN_PREVENTATIVE_BLOCK` | Normative decision authorization (`/api/v1/sgo/decisions/protected`). | HTTP 403 `BLOCKED_UNPROVISIONED_OWNER_AUTH` halts unauthenticated client execution (Fails closed). | `tests/sgo_integration.test.mjs::ADV-01, AC-35` |
| **AGHR-018**<br>Least privilege | `GOV-017` | `FULL` | `DETERMINISTIC_TEST + IO_BRIDGE` | `PROVEN_PREVENTATIVE_BLOCK` | Environment inspection; boundary prevents agent reading sensitive secrets. | IO bridge actively intercepts and redacts sensitive environment variables. | `tests/test_io_bridge_scope.py::IOTests.test_sensitive_env_rejected` |
| **AGHR-019**<br>Action-time authorization | `GOV-004, GOV-020` | `FULL` | `DETERMINISTIC_TEST + SECURITY_GATE` | `PROVEN_PREVENTATIVE_BLOCK` | Filesystem access; boundary prevents path traversal outside project root. | `server/security.js` / IO bridge validates real paths, throws access denied. | `tests/test_io_bridge_scope.py::ScopeTests.test_protected_over_allow`, `server/security.js` |
| **AGHR-020**<br>Protected control plane | `GOV-001, GOV-003` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Policy plane modification; boundary prevents lower planes mutating root rules. | Test assertion failure on unauthorized control plane modification. | `tests/test_io_bridge_scope.py::CLITests.test_rule_authority_cannot_be_elevated` |
| **AGHR-021**<br>Data and egress control | `GOV-002, GOV-017` | `FULL` | `DETERMINISTIC_TEST + IO_BRIDGE` | `PROVEN_PREVENTATIVE_BLOCK` | Outbound communication; boundary blocks network exfiltration and env leakage. | IO bridge blocks unauthorized network requests and strips credentials. | `tests/test_io_bridge_scope.py::IOTests.test_sensitive_env_rejected` |
| **AGHR-022**<br>Injection resistance | `GOV-002` | `FULL` | `DETERMINISTIC_TEST + IO_BRIDGE` | `PROVEN_PREVENTATIVE_BLOCK` | User payload evaluation; boundary isolates prompt injection from code evaluation. | IO bridge treats untrusted text strictly as inert string literal without shell execution. | `tests/test_io_bridge_scope.py::BridgeTests.test_injection_text_is_only_data`, `sgo_integration.test.mjs` (AC-33) |
| **AGHR-023**<br>Scoped approval | `GOV-004, GOV-009` | `FULL` | `DATA_SCHEMA + HTTP_GATE` | `PROVEN_PREVENTATIVE_BLOCK` | Endpoint authorization; boundary denies replayed, wrong scope, or unauthenticated tokens. | Server returns HTTP 403 / 409 and halts request processing. | `tests/sgo_integration.test.mjs` (AC-36) |
| **AGHR-024**<br>Bounded delegation | `GOV-004 + ADEQ-22` | `FULL` | `DATA_SCHEMA + TEST` | `DETERMINISTIC_TEST_VERIFIED` | Subagent task dispatch; boundary constrains subagent execution scope. | Schema validator enforces bounds defined in `schemas/delegation.schema.json`. | `schemas/delegation.schema.json`, `tests/baseline_v1_adoption.test.mjs` |
| **AGHR-025**<br>Safe retry | `GOV-019` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Fault recovery; boundary requires bounded backoff and recovery state. | Test assertion failure on unconstrained retry loop. | `tests/baseline_v1_adoption.test.mjs` (BEH-06) |
| **AGHR-026**<br>Durable canonical state | `GOV-006, GOV-015` | `FULL` | `DATA_SCHEMA + INTEGRITY_CHECK` | `PROVEN_PREVENTATIVE_BLOCK` | SGO audit ledger; boundary detects modification or record truncation. | `sgoStore.verifyLedgerIntegrity()` actively verifies SHA chain and throws error on tamper. | `tests/sgo_integration.test.mjs` (AC-11, AC-12) |
| **AGHR-027**<br>Resource budgets | `GOV-011` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Session resource consumption; boundary checks token and context size. | Health check script fails build if bootstrap token budget is exceeded. | `tools/check_context_health.mjs` |
| **AGHR-028**<br>Safe observability | `GOV-007, GOV-023` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Execution telemetry; boundary ensures audit events are structured. | Test assertion failure on unstructured or missing event telemetry. | `tests/sgo_integration.test.mjs` (AC-40) |
| **AGHR-029**<br>Unified change intake | `GOV-013 + ADEQ-02` | `PARTIAL` | `DATA_SCHEMA + GIT_TRACKING` | `DETERMINISTIC_TEST_VERIFIED` | Change tracking; boundary requires schema-validated trace logs. | Test assertion failure on untracked revision drift. | `tests/test_assurance.py::ContinuityTests.test_continuity_revision_change` |
| **AGHR-030**<br>Bounded exceptions | `GOV-004, GOV-020` | `FULL` | `DETERMINISTIC_TEST + SECURITY_GATE` | `PROVEN_PREVENTATIVE_BLOCK` | Rule conflict; boundary ensures protected security rules override allow rules. | Scope engine evaluates protected rules first and rejects overriding allows. | `tests/test_io_bridge_scope.py::ScopeTests.test_protected_over_allow` |
| **AGHR-031**<br>Evidence invalidation | `GOV-018` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Evidence freshness; boundary invalidates evidence upon HEAD hash change. | Test assertion failure when evidence SHA does not match current commit. | `tests/test_assurance.py::AssuranceTests.test_evidence_revision_stale` |
| **AGHR-032**<br>Source custody | `GOV-006, GOV-015` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Intake archive integrity; boundary prevents mutating tracked files in INBOX. | Custody test checks SHA-256 sums of all 24 tracked intake documents. | `tests/inbox_custody.test.mjs` |
| **AGHR-033**<br>Proportionate profiles | `GOV-011 + ADEQ-20` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Governance overhead scaling; boundary allows simple profiles for small changes. | Test assertion verifies lightweight assurance profile validity. | `tests/test_assurance.py::AssuranceTests.test_quick_fix_need_not_create_spec` |
| **AGHR-034**<br>Simple adequate architecture | `GOV-012 + ADEQ-07, ADEQ-18` | `FULL` | `EXECUTABLE_WORKFLOW` | `WORKFLOW_PROCEDURAL_GUIDE` | Architecture design; boundary guards against superfluous runtime layers. | Procedural evaluation via `workflows/preflight_qa.md`. | ADEQ Case QA-01, QA-03 |
| **AGHR-035**<br>Stop and recovery | `GOV-019 + ADEQ-09` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Error handling; boundary ensures graceful exit and status reporting on error. | Test assertion verifies negative error recovery without unhandled crash. | `tests/sgo_integration.test.mjs` (NEG-01..06) |
| **AGHR-036**<br>Bound claims to artifacts | `GOV-007 + ADEQ-21` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Compliance claims; boundary requires every claim to link to on-disk artifact. | Test assertion failure when referenced artifact path is missing. | `tests/sgo_integration.test.mjs` (AC-10) |
| **AGHR-037**<br>Tool protocol validity | `GOV-016, GOV-024` | `FULL` | `DATA_SCHEMA + TEST` | `DETERMINISTIC_TEST_VERIFIED` | Tool invocation; boundary validates parameters against JSON schema contract. | Test assertion failure on invalid tool invocation structure. | `tests/baseline_v1_adoption.test.mjs` (BEH-07, BEH-10) |
| **AGHR-038**<br>Instruction supply chain | `GOV-001, GOV-006` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Objective fidelity; boundary detects drift between user prompt and actions. | Test assertion failure on prompt drift detection. | `tests/test_assurance.py::AssuranceTests.test_original_request_drift` |
| **AGHR-039**<br>Host qualification | `GOV-024` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Execution platform; boundary requires supported OS and runtime features. | Test assertion verifies environment compatibility in preflight. | `tests/baseline_v1_adoption.test.mjs` (BEH-10) |
| **AGHR-040**<br>Behavioral outcome evaluation | `GOV-008 + ADEQ-19, ADEQ-24` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Closeout criteria; boundary prevents closing task with failing tests. | Test runner exits non-zero on failure; verified in adoption suite. | `tests/baseline_v1_adoption.test.mjs` (BEH-08) |
| **AGHR-041**<br>Smart clarification | `ADEQ-05, ADEQ-06` | `FULL` | `PROMPT_PROCEDURAL` | `PROMPT_BEHAVIORAL_GUIDANCE` | User interaction; boundary instructs agent to ask targeted questions on ambiguity. | N/A (prompt behavioral instruction; zero software code interception). | ADEQ Case QA-02 |
| **AGHR-042**<br>Better alternatives without substitution | `ADEQ-08` | `FULL` | `PROMPT_PROCEDURAL` | `PROMPT_BEHAVIORAL_GUIDANCE` | Technical proposals; boundary allows proposing improvements while executing request. | N/A (prompt behavioral instruction; zero software code interception). | ADEQ Case QA-03 |
| **AGHR-043**<br>Lifecycle-tailored delivery | `GOV-011 + ADEQ-12` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Delivery packaging; boundary aligns artifacts with project lifecycle phase. | Test assertion verifies delivery profile matching task scope. | `tests/test_assurance.py::AssuranceTests.test_quick_fix_need_not_create_spec` |
| **AGHR-044**<br>Branch visibility and safe closeout | `GOV-015` | `FULL` | `DETERMINISTIC_TEST + IO_BRIDGE` | `PROVEN_PREVENTATIVE_BLOCK` | Git push operations; boundary blocks unauthorized direct push to reserved branches. | IO bridge aborts push command with error if targeting `main`/`master`/`release`. | `tests/test_io_bridge_scope.py::ScopeTests.test_push_reserved_not_silent` |
| **AGHR-045**<br>Clear communication and handoff | `ADEQ-13, ADEQ-14` | `FULL` | `PROMPT_PROCEDURAL` | `PROMPT_BEHAVIORAL_GUIDANCE` | Session handoff; boundary guides agent to provide clear status and next steps. | N/A (prompt behavioral instruction in `docs/status/HANDOFF.md`). | ADEQ Case QA-14 |
| **AGHR-046**<br>Plan alignment and observable drift | `ADEQ-12` | `FULL` | `EXECUTABLE_WORKFLOW` | `WORKFLOW_PROCEDURAL_GUIDE` | Implementation monitoring; boundary detects drift between plan and code changes. | Procedural workflow check via `workflows/plan_drift_check.md`. | ADEQ Case QA-12 |
| **AGHR-047**<br>Standards applicability and claim limits | `GOV-003, GOV-007` | `FULL` | `DETERMINISTIC_TEST` | `DETERMINISTIC_TEST_VERIFIED` | Compliance claims; boundary restricts claims to verified repository scope. | Test assertion failure on over-extended compliance claims. | `tests/test_io_bridge_scope.py::CLITests.test_rule_impact_not_authority`, `test_missing_evidence` |

---

## 4. Technical Analysis & Rigorous Boundary Evaluations

### 4.1 AGHR-017: Boundaries of `BLOCKED_UNPROVISIONED_OWNER_AUTH`
- **Architectural Classification:** `ARCHITECTURAL_SUBSTITUTION_WITH_DOCUMENTED_BOUNDARIES`.
- **Legacy Mechanism:** The historical AGHR 1.2.0 rule specified a simulated multi-persona staff ("Developer", "Verifier", "Reviewer") executing in the same prompt context.
- **Baseline v1 Replacement:** Deprecates the synthetic staff illusion in favor of `GOV-022` (anti-collusion: executing agent cannot approve its own work as independent) and an authenticated endpoint: `POST /api/v1/sgo/decisions/protected`.
- **Proven Evidence (Test ADV-01 in `tests/sgo_integration.test.mjs`):**
  - Proves that HTTP requests attempting to approve protected decisions fail closed with HTTP 403 `BLOCKED_UNPROVISIONED_OWNER_AUTH`.
  - Proves that client-supplied flags (e.g., `synthetic: true`, `allowSyntheticFixture: true`, `scope: "owner"`) are ignored and rejected.
- **Explicit Technical Boundary (What is NOT Proven):**
  > [!WARNING]
  > The test proves only that **unprovisioned synthetic client calls fail closed**.
  > It does **NOT** prove that real owner identity, cryptographic authentication (e.g. mTLS, WebAuthn, FIDO2, or asymmetric PGP/SSH keys), or live human consent are provisioned.
  > In this development environment, production owner credentials are deliberately unprovisioned and dormant. Therefore, normative owner approval cannot be executed through the HTTP API without provisioning authentic out-of-band credentials.

### 4.2 AGHR-029: SQLite vs. Git/JSON Schema Functional Gaps
- **Architectural Classification:** `ARCHITECTURAL_SUBSTITUTION_WITH_DOCUMENTED_GAPS`.
- **Legacy Mechanism:** AGHR 1.2.0 relied on a centralized 12-table SQLite database (`governance.db`) managed by a Python `cli3.py` daemon subprocess.
- **Baseline v1 Replacement:** Replaces SQLite with Git commit lineage, portable JSON schemas (`trace.schema.json`, `action.schema.json`), and the zero-dependency `agdl` CLI.
- **Identified Functional Gaps (What was Lost):**
  1. *Dynamic SQL Relational Queries:* Loss of ad-hoc relational joins (`SELECT ... JOIN ... WHERE ... GROUP BY`). Filtering now requires application-level iteration or custom scripts.
  2. *Database-Engine Foreign Key Constraints:* SQLite enforced referential integrity and cascading updates at the database engine level. Git/JSON relies on schema validation and application logic across separate JSON files.
  3. *Transactional Daemon Locks:* SQLite provided engine-level transaction isolation (`BEGIN IMMEDIATE`). Git/JSON relies on Git index locks and atomic file overwrites.
- **Documented Architectural Gains (What was Gained):**
  1. *Human Readability & Auditability:* Git diffs and JSON files are directly inspectable without SQLite binary tools.
  2. *Zero Native Binary Dependencies:* Eliminates SQLite native C-extension compilation issues across heterogeneous OS environments.
  3. *Content-Addressable Provenance:* Every change is permanently anchored to a Git commit object.

### 4.3 Git Integrity & Tamper-Resistance: Technical Realities
- **Proven Cryptographic Capabilities:**
  - Git structures all files, trees, and commits into a content-addressable Merkle Directed Acyclic Graph (DAG).
  - Every commit SHA is computed over tree content, parent commit SHAs, committer timestamp, and commit message.
  - Silent modification of any past object alters all descendant commit SHAs, making silent tampering cryptographically detectable.
- **Technical Boundaries & Limitations (What Git Alone Does NOT Provide):**
  > [!IMPORTANT]
  > Git alone does **NOT** guarantee absolute local immutability.
  > In a local repository clone, any developer or process with write access to `.git/` can rewrite history (`git commit --amend`, `git rebase -i`, `git filter-branch`) without violating Git integrity.
  > Absolute tamper-resistance requires:
  > 1. Cryptographically signed commits (`git commit -S` using GPG or SSH keys verified against an independent public key ring).
  > 2. Append-only remote branch protections (e.g., repository rules forbidding force-pushes and branch deletions).
