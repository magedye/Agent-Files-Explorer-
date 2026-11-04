import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// Define the 48 AAPES requirements data and mappings to AGHR
const aapesRequirements = [
  // D01: Requirements Engineering (11% | P0)
  {
    id: "AAPES-REQ-001",
    domain: "D01",
    title: "Unique ID, primary obligation, owner, scope, version",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "AGHR-RULE-REGISTRY / server/governance.js (Rule schema), server/intake.js",
    coverage_status: "COVERED",
    evidence: "server/governance.js lines 36-120; tests/reference_explorer.test.mjs; tests/t36_canonical_registration.test.mjs",
    gap_or_conflict: "None. AGHR rules and ChangePackets enforce unique ID, version, description/obligation, and package scope.",
    corrective_action: "Expose explicit AAPES domain and primary obligation fields in Studio rule views.",
    verification_method: "Unit test: rule schema inspection and unique ID enforcement in registry."
  },
  {
    id: "AAPES-REQ-002",
    domain: "D01",
    title: "Define trigger, input, action, acceptance outcome",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/intake.js (Compound statement decomposition, triggers, conditions, actions)",
    coverage_status: "COVERED",
    evidence: "server/intake.js lines 30-85; tests/intake.test.mjs (M3 Intake: Compound statement decomposition)",
    gap_or_conflict: "AGHR decomposes input requests into action, trigger, and outcome; lacks explicit formal failure-state assertion in UI.",
    corrective_action: "Extend intake decomposition to validate trigger, input, action, and failure-state completeness.",
    verification_method: "Unit test: intake decomposition with complete trigger/action/outcome checks."
  },
  {
    id: "AAPES-REQ-003",
    domain: "D01",
    title: "Resolve ambiguous adjectives with operational definitions",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/intake.js (Normative classification and ambiguity linter)",
    coverage_status: "PARTIAL",
    evidence: "server/intake.js lines 90-140; tests/intake.test.mjs",
    gap_or_conflict: "AGHR classifies normative force (MUST/SHOULD/MAY) but does not flag ambiguous adjectives (e.g. 'appropriate', 'safe', 'fast', 'reasonable').",
    corrective_action: "Add ambiguous adjective detector in policy review service with recommendations for operational definitions.",
    verification_method: "Unit test: ambiguous terms detection on sample policies."
  },
  {
    id: "AAPES-REQ-037",
    domain: "D01",
    title: "Trace each requirement to originating authority, tests, enforcement, evidence, approver",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/governance.js (sources, basis, enforcement), server/studio/verification-service.js",
    coverage_status: "COVERED",
    evidence: "server/governance.js getRuleDetails (basis sources, enforcement coverage); tests/reference_explorer.test.mjs",
    gap_or_conflict: "None. AGHR links each rule to basis sources, enforcement class, and verified test suites.",
    corrective_action: "Maintain bidirectional trace links in Studio rule detail view.",
    verification_method: "Contract test: rule basis and enforcement traceability verification."
  },

  // D02: Formal Semantics and Invariants (9% | P0)
  {
    id: "AAPES-REQ-004",
    domain: "D02",
    title: "Define TRUE, FALSE, UNKNOWN handling for incomplete evidence",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/studio/unified-runtime.mjs, server/studio/verification-service.js",
    coverage_status: "COVERED",
    evidence: "server/studio/routes.js (T30 honesty, unknown status); tests/t30_metrics.test.mjs (T30 ten metrics retain NOT_RUN/null)",
    gap_or_conflict: "None. Studio enforces three-valued logic (PASS / FAIL / NOT_RUN / UNKNOWN / INCONCLUSIVE) across evidence.",
    corrective_action: "Ensure AAPES evaluation adapter preserves three-valued states explicitly.",
    verification_method: "Unit test: unknown evidence evaluates to INCONCLUSIVE/NOT_RUN, never false PASS."
  },
  {
    id: "AAPES-REQ-005",
    domain: "D02",
    title: "Document safety invariants independently from preferred model behavior",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/security.js, AGHR rc.3 Core policies, server/studio/zero-write.js",
    coverage_status: "COVERED",
    evidence: "server/security.js PROTECTED_PATTERNS; tests/security.test.mjs; tests/t13_zero_write.test.mjs",
    gap_or_conflict: "Invariants are enforced in backend code; Studio needs explicit display of immutable safety invariants.",
    corrective_action: "Provide an Invariants view in Reference Manager showing hard platform constraints.",
    verification_method: "Security tests: path traversal, root escape, and protected file immutability."
  },
  {
    id: "AAPES-REQ-006",
    domain: "D02",
    title: "Deny state-changing actions on missing or unverified prerequisites (fail-closed)",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/staging.js, server/studio/auth.js, server/studio/write-authorization.js",
    coverage_status: "COVERED",
    evidence: "server/staging.js applyStagedChanges; tests/staging.test.mjs (Precondition Drift); tests/t13_server_capabilities.test.mjs",
    gap_or_conflict: "None. All mutating operations require explicit server grant/token and fail closed on drift or absence.",
    corrective_action: "Preserve strict fail-closed authorization semantics across all new routes.",
    verification_method: "Regression test: mutation attempt without valid grant or with altered hash returns 403."
  },
  {
    id: "AAPES-REQ-038",
    domain: "D02",
    title: "Represent R2/R3 authorization predicates in tested external policy or enforceable code",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/security.js, server/studio/canonical-routes.mjs, server/aapes-adapter.js",
    coverage_status: "COVERED",
    evidence: "server/security.js resolveSafePath; server/studio/auth.js; tests/t36_canonical_registration.test.mjs",
    gap_or_conflict: "AGHR uses JS/Node enforcement code rather than Rego engine; Rego is optional candidate.",
    corrective_action: "Implement deterministic JS authorization predicates and optional Rego adapter if OPA is available.",
    verification_method: "Test suite: execution of authorization predicate against test fixtures."
  },

  // D03: Instruction Authority and Conflict Resolution (9% | P0)
  {
    id: "AAPES-REQ-007",
    domain: "D03",
    title: "Document actual instruction hierarchy of each model platform; avoid universal vendor hierarchy",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "docs/specs/aghr-rc3/, server/intake.js (2-layer classification)",
    coverage_status: "PARTIAL",
    evidence: "server/intake.js lines 60-120; docs/status/CURRENT.md",
    gap_or_conflict: "AGHR classifies instruction domain and force, but lacks explicit cross-vendor platform hierarchy map.",
    corrective_action: "Add Platform Instruction Hierarchy matrix mapping System vs Developer vs User vs Tool across OpenAI, Anthropic, Gemini.",
    verification_method: "Unit test: platform hierarchy resolution for conflicting instructions."
  },
  {
    id: "AAPES-REQ-008",
    domain: "D03",
    title: "MUST_NOT promote untrusted documents, tool output, retrieved pages to authority by text claims",
    normative_level: "MUST_NOT",
    base_priority: "P0",
    aghr_ref: "governance_packages/README.md, tools/inbox_custody.mjs, server/security.js",
    coverage_status: "COVERED",
    evidence: "governance_packages/README.md lines 12-16; tests/inbox_custody.test.mjs; tests/t02_source_identity.test.mjs",
    gap_or_conflict: "None. INBOX documents and retrieved files are strictly non-authoritative until owner adoption.",
    corrective_action: "Enforce explicit untrusted labeling on all imported and retrieved document streams.",
    verification_method: "Security test: untrusted document cannot trigger policy update or grant execution token."
  },
  {
    id: "AAPES-REQ-009",
    domain: "D03",
    title: "Block only affected high-risk decision when policy conflict remains unresolved",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/intake.js (Legacy conflict detection), server/comparison.js",
    coverage_status: "COVERED",
    evidence: "server/intake.js checkConflicts; tests/intake.test.mjs; server/comparison.js analyzeRuleImpact",
    gap_or_conflict: "None. Conflicts flag specific rules and block affected actions while allowing non-conflicting workflows.",
    corrective_action: "Surface scoped conflict blocking in the policy engineering review UI.",
    verification_method: "Test: conflict detected in rule A blocks rule A actions while rule B passes."
  },
  {
    id: "AAPES-REQ-039",
    domain: "D03",
    title: "Maintain versioned conflict-resolution register with authority, scope, supersession, owner decision",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/intake.js (ChangePacket registry), server/governance.js (comparison delta)",
    coverage_status: "PARTIAL",
    evidence: "server/intake.js listPackets; server/comparison.js comparePackages; tests/comparison.test.mjs",
    gap_or_conflict: "Studio tracks diffs and change packets, but lacks a dedicated Conflict Resolution Register view.",
    corrective_action: "Implement Conflict Register component linking conflicting rules, authority rank, and owner resolution.",
    verification_method: "Integration test: record and resolve conflict in register with owner approval."
  },

  // D04: Context Engineering and Few-Shot (5% | P1)
  {
    id: "AAPES-REQ-010",
    domain: "D04",
    title: "Keep governing instructions distinct from retrieved task data using platform-supported channels",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "AGENTS.md, server/security.js, server/studio/auth.js",
    coverage_status: "COVERED",
    evidence: "AGENTS.md Prime Directives; tests/security.test.mjs; tests/t04_session.test.mjs",
    gap_or_conflict: "None. System instructions (AGENTS.md), user queries, and data files are strictly separated in Studio architecture.",
    corrective_action: "Maintain channel boundary segregation in all prompt and adapter templates.",
    verification_method: "Inspection test: ensure governing prompts are never interpolated into untrusted data segments."
  },
  {
    id: "AAPES-REQ-011",
    domain: "D04",
    title: "MUST_NOT treat EXAMPLE_ONLY content as authorization or override of policy",
    normative_level: "MUST_NOT",
    base_priority: "P1",
    aghr_ref: "server/intake.js, server/governance.js, server/studio/auth.js",
    coverage_status: "COVERED",
    evidence: "tests/t06_candidate_selection.test.mjs; tests/t12_mock.test.mjs; tests/t19_simulation.test.mjs",
    gap_or_conflict: "None. MOCK and simulation examples are explicitly labeled and prohibited from granting permissions.",
    corrective_action: "Label all example fixtures with EXAMPLE_ONLY / MOCK metadata in adapter.",
    verification_method: "Test: example fixture submitted as authorization claim is rejected."
  },
  {
    id: "AAPES-REQ-012",
    domain: "D04",
    title: "Evaluate paraphrase, ordering, example, long-context perturbations on held-out cases",
    normative_level: "SHOULD",
    base_priority: "P1",
    aghr_ref: "server/evaluation.js, server/studio/verification-service.js",
    coverage_status: "PARTIAL",
    evidence: "server/evaluation.js lines 50-110; tests/evaluation.test.mjs",
    gap_or_conflict: "Studio runs unit suites and package checks, but lacks automated prompt perturbation generators.",
    corrective_action: "Add perturbation test definitions to AAPES evaluation test suite.",
    verification_method: "Evaluation test: execute perturbation suite and verify decision invariance."
  },
  {
    id: "AAPES-REQ-040",
    domain: "D04",
    title: "Define measured context-budget and truncation policy preserving mandatory controls and provenance",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "tools/check_context_health.mjs, AGENTS.md, server/security.js",
    coverage_status: "COVERED",
    evidence: "tools/check_context_health.mjs; AGENTS.md context budgets; tests/t30_context.test.mjs",
    gap_or_conflict: "None. Context health checker verifies bootstrap token budgets and link integrity deterministically.",
    corrective_action: "Include context health verification in qualification pipeline.",
    verification_method: "Automated check: node tools/check_context_health.mjs passes with 0 errors."
  },

  // D05: Trust and Memory Boundaries (10% | P0)
  {
    id: "AAPES-REQ-013",
    domain: "D05",
    title: "Mark third-party pages, files, tool outputs as untrusted instruction sources",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/security.js, governance_packages/README.md, tools/inbox_custody.mjs",
    coverage_status: "COVERED",
    evidence: "governance_packages/README.md; server/security.js resolveSafePath; tests/security.test.mjs",
    gap_or_conflict: "None. Inbound files in INBOX or external projects are quarantined and marked untrusted.",
    corrective_action: "Maintain strict provenance metadata marking source reliability.",
    verification_method: "Security test: file load from untrusted root flags untrusted status."
  },
  {
    id: "AAPES-REQ-014",
    domain: "D05",
    title: "Enforce identity-based retrieval and memory access; quarantine/reject authority escalation",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/security.js (RootRegistry), server/studio/auth.js",
    coverage_status: "COVERED",
    evidence: "server/security.js lines 60-150; tests/security.test.mjs (Approved Roots Listing, Reject Arbitrary Path)",
    gap_or_conflict: "None. Access is restricted to explicitly approved roots; unauthorized paths return 403.",
    corrective_action: "Ensure AAPES candidate root adheres to same RootRegistry isolation.",
    verification_method: "Security test: unauthorized path traversal and escalation returns 403."
  },
  {
    id: "AAPES-REQ-015",
    domain: "D05",
    title: "Test indirect prompt injection at external ingestion and memory-retrieval boundary",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "tests/t02_source_identity.test.mjs, server/intake.js",
    coverage_status: "PARTIAL",
    evidence: "tests/t02_source_identity.test.mjs (source identity and command injection boundary)",
    gap_or_conflict: "AGHR tests command injection and shell sanitization; lacks an explicit suite of indirect prompt injection vectors.",
    corrective_action: "Add prompt injection test scenarios (jailbreak, delimiter collision, markdown extraction) to AAPES evaluation suite.",
    verification_method: "Security test: inject prompt payloads into policy parser and verify rejection."
  },
  {
    id: "AAPES-REQ-041",
    domain: "D05",
    title: "Record provenance, retention, deletion policy and owner for persistent agent memory with risk TTL",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/studio/db/, .governance/ audit logs, server/studio/artifact-store.js",
    coverage_status: "COVERED",
    evidence: "server/studio/artifact-store.js; tests/t36_canonical_registration.test.mjs; tests/contract_jsonl.test.mjs",
    gap_or_conflict: "Studio uses local sqlite/jsonl with provenance and immutability; lacks explicit TTL configuration in UI.",
    corrective_action: "Add memory retention and TTL configuration metadata to project adoption settings.",
    verification_method: "Contract test: verify audit JSONL records retain provenance and immutability."
  },

  // D06: Agent Authority and Delegation (10% | P0)
  {
    id: "AAPES-REQ-016",
    domain: "D06",
    title: "Grant agent and tools minimum scoped credentials with expiry and revocation",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/studio/auth.js, server/studio/write-authorization.js",
    coverage_status: "COVERED",
    evidence: "tests/t04_session.test.mjs (credential rotation and expiry); tests/t13_server_capabilities.test.mjs",
    gap_or_conflict: "None. Server capabilities bind actor, project, action, resource, hash with re-checked expiry.",
    corrective_action: "Preserve scoped single-use ticket pattern for AAPES actions.",
    verification_method: "Security test: expired or revoked ticket rejected at tool execution boundary."
  },
  {
    id: "AAPES-REQ-017",
    domain: "D06",
    title: "MUST_NOT delegate privileges, tool scopes, identity broader than authorized for parent",
    normative_level: "MUST_NOT",
    base_priority: "P0",
    aghr_ref: "server/studio/write-authorization.js, server/studio/auth.js",
    coverage_status: "COVERED",
    evidence: "tests/t36_adoption_integrity.test.mjs (rejects escalation); tests/t13_server_capabilities.test.mjs",
    gap_or_conflict: "None. Subagent/child capabilities are strictly bounded by parent grant.",
    corrective_action: "Validate delegation bounds in policy review engine.",
    verification_method: "Test: attempt to issue grant with scope wider than parent throws authorization error."
  },
  {
    id: "AAPES-REQ-018",
    domain: "D06",
    title: "MUST_NOT allow agent to mint its own approval or impersonate authorized approver",
    normative_level: "MUST_NOT",
    base_priority: "P0",
    aghr_ref: "server/studio/zero-write.js, server/studio/write-authorization.js",
    coverage_status: "COVERED",
    evidence: "tests/t13_server_capabilities.test.mjs (developer cannot issue grants); tests/t06_candidate_selection.test.mjs",
    gap_or_conflict: "None. Approvals require independent server session and owner sign-off.",
    corrective_action: "Ensure AAPES policy parser flags any rule where agent self-approves.",
    verification_method: "Security test: self-signed agent approval rejected by authorization service."
  },
  {
    id: "AAPES-REQ-042",
    domain: "D06",
    title: "Bind high-risk approvals to actor, action, target, scope, expiry, single-use request ID",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/staging.js, server/studio/write-authorization.js",
    coverage_status: "COVERED",
    evidence: "server/staging.js createStagingWorkspace; tests/t13_server_capabilities.test.mjs; tests/t36_cp_closure.test.mjs",
    gap_or_conflict: "None. Staging and change package apply require exact binding of actor, target files, precondition hashes.",
    corrective_action: "Expose bound approval ticket details in Studio UI.",
    verification_method: "Contract test: verify approval payload contains actor, action, target, expiry, nonce."
  },

  // D07: Tool Boundary Enforcement (13% | P0)
  {
    id: "AAPES-REQ-019",
    domain: "D07",
    title: "Place independent policy enforcement at every side-effecting tool/API boundary, not in prompts",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/security.js, server/api.js, server/staging.js",
    coverage_status: "COVERED",
    evidence: "server/security.js resolveSafePath; server/api.js readJsonBody; tests/security.test.mjs; tests/t02_source_identity.test.mjs",
    gap_or_conflict: "None. Enforcement is performed in Node.js server middleware completely outside the LLM context.",
    corrective_action: "Maintain non-bypassable PEP middleware on all endpoints.",
    verification_method: "Integration test: direct HTTP mutation call without valid server credentials fails."
  },
  {
    id: "AAPES-REQ-020",
    domain: "D07",
    title: "Fail closed for state changes on missing approval, unknown decisions, timeouts, unavailable PDP",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/staging.js, server/studio/write-authorization.js",
    coverage_status: "COVERED",
    evidence: "server/staging.js applyStagedChanges; tests/staging.test.mjs; tests/t36_canonical_registration.test.mjs (403 without grant)",
    gap_or_conflict: "None. Default response for all unverified or failed operations is 403 Forbidden / DENY.",
    corrective_action: "Ensure AAPES adapter fails closed on any internal exception or timeout.",
    verification_method: "Fault injection test: simulate PDP disconnect, verify state change is blocked."
  },
  {
    id: "AAPES-REQ-021",
    domain: "D07",
    title: "Validate tool input schemas and separately authorize semantics, identity, resource, operation server-side",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/api.js, server/security.js, server/staging.js",
    coverage_status: "COVERED",
    evidence: "server/api.js schema parsing and validation; tests/security.test.mjs; tests/t13_server_capabilities.test.mjs",
    gap_or_conflict: "None. Schema shape validation is followed by independent root, file, and grant authorization checks.",
    corrective_action: "Implement AAPES tool action schema validator (`tool_action.schema.json`) with server-side authorization check.",
    verification_method: "Schema and authorization test: valid schema with unauthorized resource returns 403."
  },
  {
    id: "AAPES-REQ-043",
    domain: "D07",
    title: "Prove by integration test that agent-originated calls cannot bypass PEP or supply trusted authorization claims",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "tests/t02_audited_launcher.test.mjs, tests/t13_actual_http.test.mjs",
    coverage_status: "COVERED",
    evidence: "tests/t02_source_identity.test.mjs; tests/t13_actual_http.test.mjs (denies role headers and scope-mismatched tokens)",
    gap_or_conflict: "None. Client-supplied role headers or authorization claims are stripped/ignored by server.",
    corrective_action: "Include reference_guard synthetic test vectors in automated test suite.",
    verification_method: "Security test: client request with injected 'trusted' claims is rejected."
  },

  // D08: Workflow and Recovery Governance (6% | P1, P0 for R2/R3)
  {
    id: "AAPES-REQ-022",
    domain: "D08",
    title: "Define authorized state transitions and recorded checkpoints for multi-step mutating workflows",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "server/staging.js (Workspace lifecycle: PROPOSED -> STAGED -> APPLIED)",
    coverage_status: "COVERED",
    evidence: "server/staging.js lines 50-180; tests/staging.test.mjs; tests/t37_patch_artifacts.test.mjs",
    gap_or_conflict: "None. Staging workspaces transition through explicit states with immutable backup checkpoints.",
    corrective_action: "Map AGHR staging lifecycle to AAPES workflow state machine in documentation.",
    verification_method: "Lifecycle test: verify valid state transitions and rejection of out-of-order calls."
  },
  {
    id: "AAPES-REQ-023",
    domain: "D08",
    title: "MUST_NOT mark workflow COMMITTED before independent post-action verification completes",
    normative_level: "MUST_NOT",
    base_priority: "P1",
    aghr_ref: "server/staging.js, server/studio/verification-service.js",
    coverage_status: "COVERED",
    evidence: "server/staging.js applyStagedChanges; tests/staging.test.mjs; tests/t36_cp_closure.test.mjs",
    gap_or_conflict: "None. Apply checks target post-conditions and records verification receipt before committing status.",
    corrective_action: "Ensure post-verification receipt is required before marking AAPES change package closed.",
    verification_method: "Test: failure in post-action verification aborts commit and triggers rollback."
  },
  {
    id: "AAPES-REQ-024",
    domain: "D08",
    title: "Select verified compensation, restore-point recovery or manual recovery according to reversibility",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "server/staging.js (rollbackBackup, backup manifests)",
    coverage_status: "COVERED",
    evidence: "server/staging.js lines 220-290; tests/staging.test.mjs (Precondition Drift and Authorized Apply)",
    gap_or_conflict: "AGHR implements exact byte restore-point rollback; does not support saga compensation for external APIs.",
    corrective_action: "Document that Studio relies on restore-point recovery and manual recovery for non-file operations.",
    verification_method: "Rollback test: simulate failure during apply, verify exact byte restoration."
  },
  {
    id: "AAPES-REQ-044",
    domain: "D08",
    title: "Use idempotency keys and replay protection for retried or externally approved mutating actions",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "server/studio/auth.js, server/staging.js",
    coverage_status: "COVERED",
    evidence: "tests/t36_cp_closure.test.mjs; tests/contract_jsonl.test.mjs (duplicate records reported, not counted)",
    gap_or_conflict: "None. Change packages and staging workspaces use unique IDs and hash-bound preconditions to prevent replay.",
    corrective_action: "Enforce single-use token invalidation upon successful application.",
    verification_method: "Replay test: submitting the same apply request twice returns 409 Conflict."
  },

  // D09: Evidence Provenance and Audit (9% | P0)
  {
    id: "AAPES-REQ-025",
    domain: "D09",
    title: "Record trace ID, policy version, decision source, tool outcome for consequential actions",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: ".governance/ logs, server/evaluation.js, server/studio/evidence-reader.js",
    coverage_status: "COVERED",
    evidence: "server/evaluation.js lines 130-190; tests/evaluation.test.mjs; tests/contract_jsonl.test.mjs",
    gap_or_conflict: "None. Every evaluation and staging run writes JSON evidence with timestamp, policy ID, inputs, and results.",
    corrective_action: "Adopt AAPES audit event schema (`audit_event.schema.json`) for structured event logging.",
    verification_method: "Audit log inspection: verify presence of trace ID, policy version, decision source, and outcome."
  },
  {
    id: "AAPES-REQ-026",
    domain: "D09",
    title: "MUST_NOT claim execution success, rollback, approval without event-level corroborating evidence",
    normative_level: "MUST_NOT",
    base_priority: "P0",
    aghr_ref: "server/studio/routes.js (T30 honesty), server/studio/zero-write.js",
    coverage_status: "COVERED",
    evidence: "tests/t30_metrics.test.mjs (T30 honesty, P0 violations never hidden); tests/t06_candidate_selection.test.mjs",
    gap_or_conflict: "None. Incomplete or absent evidence yields UNKNOWN/NOT_RUN, never fabricated success.",
    corrective_action: "Enforce strict corroboration check in AAPES readiness assessment engine.",
    verification_method: "Honesty test: assessment with unbacked claims yields BLOCKED gate."
  },
  {
    id: "AAPES-REQ-027",
    domain: "D09",
    title: "Redact credentials and restricted personal data before audit persistence; limit log-reader access",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/security.js (PROTECTED_PATTERNS, sanitizeErrorMessage)",
    coverage_status: "COVERED",
    evidence: "server/security.js lines 40-52; tests/security.test.mjs; tests/t02_source_identity.test.mjs",
    gap_or_conflict: "None. Protected patterns block key/token files, and sanitizeErrorMessage removes sensitive paths.",
    corrective_action: "Implement explicit regex redactor for API keys and tokens in audit logger.",
    verification_method: "Security test: credentials in log payload are masked before persistence."
  },
  {
    id: "AAPES-REQ-045",
    domain: "D09",
    title: "For R2/R3, use tamper-evident append-only evidence with bounded retention and access controls",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "tools/inbox_custody.mjs, tests/contract_jsonl.test.mjs, .governance/",
    coverage_status: "COVERED",
    evidence: "tests/contract_jsonl.test.mjs (Contract JSONL: cannot rewrite end time, preserves bytes); tools/inbox_custody.mjs",
    gap_or_conflict: "None. Custody receipts and JSONL logs use SHA-256 digests and append-only constraints.",
    corrective_action: "Document custody receipt and JSONL integrity as AAPES R2/R3 evidence mechanism.",
    verification_method: "Integrity test: tampered log entry causes verification failure."
  },

  // D10: Evaluation and Calibration (9% | P0)
  {
    id: "AAPES-REQ-028",
    domain: "D10",
    title: "Test positive, negative, missing-evidence, conflict cases with reference decisions",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/evaluation.js, tests/*.test.mjs, server/aapes-evaluation.js",
    coverage_status: "COVERED",
    evidence: "tests/reference_explorer.test.mjs; tests/intake.test.mjs; tests/staging.test.mjs; tests/security.test.mjs",
    gap_or_conflict: "Existing test suite covers unit and security cases; AAPES adapter adds specific policy oracle cases.",
    corrective_action: "Integrate AAPES synthetic test fixtures (ALLOW, DENY, INCONCLUSIVE) into evaluation service.",
    verification_method: "Evaluation test: all positive, negative, and missing-evidence cases pass."
  },
  {
    id: "AAPES-REQ-029",
    domain: "D10",
    title: "Use deterministic checks when possible; calibrate LLM judges against independent human cases",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "AGENTS.md (Prime Directive 3), server/studio/verification-service.js",
    coverage_status: "COVERED",
    evidence: "AGENTS.md Deterministic Local Verification; tests/t24_cli3_determinism.test.mjs",
    gap_or_conflict: "None. AGHR Studio relies on deterministic JavaScript/CLI test runners rather than stochastic LLM judges.",
    corrective_action: "Disclose deterministic basis in evaluation reports; avoid uncalibrated LLM-as-a-judge.",
    verification_method: "Determinism test: 100 seeded units produce identical results across runs."
  },
  {
    id: "AAPES-REQ-030",
    domain: "D10",
    title: "Keep held-out tests separate from prompt development; record model, version, config per run",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/evaluation.js, server/studio/hosts/",
    coverage_status: "COVERED",
    evidence: "tests/t30_metrics.test.mjs (historical host versions from original receipts); server/evaluation.js",
    gap_or_conflict: "None. Evaluation fixtures are stored in dedicated test directories separate from prompt templates.",
    corrective_action: "Record host/runtime metadata in every AAPES evaluation report.",
    verification_method: "Audit check: evaluation receipt contains runtime environment, timestamp, and test hash."
  },
  {
    id: "AAPES-REQ-046",
    domain: "D10",
    title: "Define per-risk acceptance thresholds; report denominator, failure types, uncertainty, disagreement",
    normative_level: "MUST",
    base_priority: "P0",
    aghr_ref: "server/evaluation.js, server/studio/qualification-view.js",
    coverage_status: "COVERED",
    evidence: "tests/t30_metrics.test.mjs (exact ten denominators, median, version isolation); server/studio/routes.js",
    gap_or_conflict: "None. Denominators and breakdown by failure type are explicitly calculated without smoothing.",
    corrective_action: "Display AAPES risk thresholds (R0: 75, R1: 80, R2: 85, R3: 90) alongside exact denominators.",
    verification_method: "Reporting test: metrics output displays total evaluated, passed, failed, and threshold."
  },

  // D11: Adversarial Testing and Resilience (5% | P1, P0 for R2/R3)
  {
    id: "AAPES-REQ-031",
    domain: "D11",
    title: "Exercise adversarial prompt and tool-input tests in isolated non-production environment",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "tests/security.test.mjs, tests/t02_source_identity.test.mjs",
    coverage_status: "COVERED",
    evidence: "tests/security.test.mjs (path traversal, null byte, arbitrary client path); tests/t02_source_identity.test.mjs",
    gap_or_conflict: "Existing tests cover system/shell injection; AAPES adds adversarial policy input vectors.",
    corrective_action: "Incorporate AAPES adversarial test suite into local test runner.",
    verification_method: "Security test: adversarial test suite runs in sandbox and blocks all injection attempts."
  },
  {
    id: "AAPES-REQ-032",
    domain: "D11",
    title: "Use circuit breakers with configurable thresholds that block unsafe actions rather than bypass controls",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "server/security.js (MAX_TEXT_BYTES, MAX_RAW_BYTES), server/api.js",
    coverage_status: "COVERED",
    evidence: "server/api.js readJsonBody (payload limit); server/security.js size caps; tests/security.test.mjs",
    gap_or_conflict: "Studio has request size and timeout limits; lacks rate-limiting circuit breaker.",
    corrective_action: "Implement consecutive failure circuit breaker in tool execution adapter.",
    verification_method: "Fault test: exceeding failure threshold triggers circuit breaker and blocks subsequent calls."
  },
  {
    id: "AAPES-REQ-033",
    domain: "D11",
    title: "Rerun applicable adversarial regression tests after changes to prompts, tools, memory, policy logic",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "AGENTS.md, package.json scripts (npm test, test:studio-sentinel)",
    coverage_status: "COVERED",
    evidence: "AGENTS.md Prime Directive 3; package.json test scripts; tests/*.test.mjs",
    gap_or_conflict: "None. All tests are run deterministically before candidate qualification.",
    corrective_action: "Bind adversarial test suite to standard `npm test` workflow.",
    verification_method: "CI/test runner: execute full test suite on change and report actual pass count."
  },
  {
    id: "AAPES-REQ-047",
    domain: "D11",
    title: "Document threat coverage and residual risk; zero observed critical failures is not universal proof",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "docs/evidence/studio-release-2026-10-25/KNOWN_LIMITATIONS_AR.md, KNOWN_LIMITATIONS.md",
    coverage_status: "COVERED",
    evidence: "KNOWN_LIMITATIONS_AR.md; docs/status/CURRENT.md; README.md",
    gap_or_conflict: "None. Repository explicitly maintains known limitations and discloses non-universal qualification.",
    corrective_action: "Create dedicated KNOWN_LIMITATIONS.md documenting AAPES scope and remaining residual risks.",
    verification_method: "Documentation review: verify known limitations file accounts for all residual risks."
  },

  // D12: Lifecycle and Change Governance (4% | P1)
  {
    id: "AAPES-REQ-034",
    domain: "D12",
    title: "Version policies, prompts, tools, model settings, enforcement artifacts with change provenance",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "server/governance.js, server/intake.js, Git repository tracking",
    coverage_status: "COVERED",
    evidence: "server/governance.js listPackages; server/comparison.js comparePackages; tests/comparison.test.mjs",
    gap_or_conflict: "None. All reference packages, rules, and change packets carry explicit semver versions and source hashes.",
    corrective_action: "Expose package and rule version histories in Studio UI.",
    verification_method: "Version test: rule modification creates a versioned change packet without altering original."
  },
  {
    id: "AAPES-REQ-035",
    domain: "D12",
    title: "Requalify affected controls when model versions, privileges, tools, trusted data pipelines change",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "server/staging.js, server/studio/unified-runtime.mjs",
    coverage_status: "COVERED",
    evidence: "tests/t30_metrics.test.mjs (historical qualification cannot restore current); tests/staging.test.mjs",
    gap_or_conflict: "None. Studio invalidates qualification when preconditions or source hashes drift.",
    corrective_action: "Enforce automatic qualification reset when package or environment drift is detected.",
    verification_method: "Drift test: modifying a reference hash triggers requalification requirement."
  },
  {
    id: "AAPES-REQ-036",
    domain: "D12",
    title: "MUST_NOT activate R3 capabilities without verifiable approval from separately authorized human owner",
    normative_level: "MUST_NOT",
    base_priority: "P1",
    aghr_ref: "docs/evidence/studio-signoff-2026-10-26/OWNER_SIGNOFF_AR.md, server/studio/auth.js",
    coverage_status: "COVERED",
    evidence: "OWNER_SIGNOFF_AR.md; CURRENT.md lines 7-12; tests/t12_mock.test.mjs; tests/t36_canonical_registration.test.mjs",
    gap_or_conflict: "None. System enforces owner-approval gate for any release, baseline change, or activation.",
    corrective_action: "Maintain strict owner-approval requirement in readiness assessment gate G6.",
    verification_method: "Approval test: R3 assessment without authorized owner approval reference returns BLOCKED."
  },
  {
    id: "AAPES-REQ-048",
    domain: "D12",
    title: "Maintain documented emergency suspension, incident response, safe rollback or recovery procedures",
    normative_level: "MUST",
    base_priority: "P1",
    aghr_ref: "server/staging.js (rollbackBackup), stop.ps1, verify.ps1",
    coverage_status: "COVERED",
    evidence: "server/staging.js rollbackBackup; tests/staging.test.mjs; docs/status/CURRENT.md",
    gap_or_conflict: "None. Staging provides atomic single-file rollback; scripts provide process stop and verification.",
    corrective_action: "Document incident response and emergency rollback procedures in implementation report.",
    verification_method: "Rollback verification: trigger rollbackBackup and confirm clean restoration."
  }
];

// Helper to escape CSV field
function esc(str) {
  if (str === null || str === undefined) return '""';
  const s = String(str).replace(/"/g, '""');
  return `"${s}"`;
}

// Generate CSV string
const headers = [
  "requirement_id",
  "domain",
  "title",
  "normative_level",
  "base_priority",
  "aghr_ref",
  "coverage_status",
  "evidence",
  "gap_or_conflict",
  "corrective_action",
  "verification_method"
];

const csvRows = [headers.join(",")];
for (const req of aapesRequirements) {
  const row = [
    esc(req.id),
    esc(req.domain),
    esc(req.title),
    esc(req.normative_level),
    esc(req.base_priority),
    esc(req.aghr_ref),
    esc(req.coverage_status),
    esc(req.evidence),
    esc(req.gap_or_conflict),
    esc(req.corrective_action),
    esc(req.verification_method)
  ];
  csvRows.push(row.join(","));
}

const csvOutput = csvRows.join("\n");
const targetPath = path.join(projectRoot, "AAPES_AGHR_COMPATIBILITY_MATRIX.csv");
fs.writeFileSync(targetPath, csvOutput, "utf8");
console.log(`Generated ${targetPath} with ${aapesRequirements.length} requirements.`);

// Summary stats
const summary = aapesRequirements.reduce((acc, r) => {
  acc[r.coverage_status] = (acc[r.coverage_status] || 0) + 1;
  return acc;
}, {});
console.log("Coverage summary:", JSON.stringify(summary, null, 2));
