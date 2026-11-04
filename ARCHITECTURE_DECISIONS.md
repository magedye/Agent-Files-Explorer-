# AGHR Governance Studio — Architecture Decisions Record (ADR)

**Directive / Task ID:** `AGHR-AAPES-INTEGRATION-001`  
**Date:** 2026-11-04 / 2026-11-05  
**Status:** ACCEPTED (Development Scope)  
**Applies To:** AGHR Governance Studio extending with AAPES v2.1  

---

## ADR-01: Extend AGHR Governance Studio via Adapter Architecture (No Rebuild)

### Context
AGHR Governance Studio v1.0.0 is an accepted, closed release with pinned engine bytes, deterministic test suites, and extensive evidence. Directive `AGHR-AAPES-INTEGRATION-001` requires integrating the AAPES v2.1 framework. A naive approach might seek to rewrite the studio's data models or replace AGHR schemas with AAPES schemas.

### Decision
We **extend** AGHR Governance Studio using an **adapter-based architecture**.
- **AGHR rc.3 (`aghr_rc3`):** Remains the authoritative, native governance reference and default for all new projects.
- **AAPES v2.1 (`aapes_v2_1`):** Registered as an independent, review-candidate external framework (`kind: "EXTERNAL_CANDIDATE"`).
- **AAPES Adapter Layer:** Bridges AAPES concepts (12 domains, 48 requirements, risk classes R0-R3, stage gates G0-G7, BCP 14 normative parsing) with existing AGHR contracts, intake pipelines, and evaluation runners.
- **Execution Controls:** Enforcement mechanisms remain outside the LLM in trusted Node.js server middleware.

### Consequences
- Prevents breaking changes to existing v1.0.0 contracts.
- Existing 172 tests remain completely green.
- AAPES capabilities are available alongside native AGHR governance.

---

## ADR-02: Native Trusted Implementation of AAPES Algorithms (No Privileged Script Execution)

### Context
The AAPES v2.1 ZIP contains reference Python scripts (`assess_readiness.py`, `validate_pack.py`, `reference_guard.py`). Executing foreign scripts directly inside the Studio's runtime poses security and dependency risks (e.g. Python venv, jsonschema, pyyaml availability on host).

### Decision
Implement the AAPES evaluation, readiness scoring, and policy validation algorithms **natively in trusted Node.js / JavaScript**:
- Core logic of `assess_readiness.py` is implemented in `server/aapes-assessment.js`.
- Policy validation, BCP 14 parsing, and atomicity checks are implemented in `server/aapes-policy.js`.
- The ZIP's archive members and Python scripts are treated as **declarative specifications and reference fixtures**, not privileged executable code.

### Consequences
- Zero external runtime dependency (runs natively with existing Node 20+ runtime).
- 100% deterministic test coverage in `node --test`.
- Eliminates command injection or untrusted script execution vectors.

---

## ADR-03: Strict Separation of Diagnostic Score from Hard-Gate Qualification

### Context
A critical failure mode in risk governance is allowing a high diagnostic score (e.g. 95%) to mask or compensate for an untested, failing, or unverified critical safety gate.

### Decision
The readiness assessment engine calculates and publishes five distinct, uncoupled outputs:
1. `diagnostic_score`: A weighted maturity score (0–100%) across applicable domains.
2. `hard_gate_decision`: Explicitly `BLOCKED` or `READY_FOR_AUTHORIZED_REVIEW`.
3. `critical_blockers`: Full array of specific blocker strings (e.g., failed gates, missing owner approval, unverified P0 maturity).
4. `veto_signals`: Hard safety signals that MUST be FALSE.
5. `approval_status`: Human owner authorization record.

**Invariant:** A high diagnostic score NEVER overrides or clears a `BLOCKED` gate decision. Passing the calculator produces `READY_FOR_AUTHORIZED_REVIEW`, never `ACTIVE` or an authorization to deploy.

### Consequences
- High-risk agents cannot bypass mandatory controls.
- Prevents false-confidence reporting in compliance dashboards.

---

## ADR-04: Non-Destructive Governed Policy Optimization Workflow

### Context
Policy engineering suggests improvements (e.g., splitting compound rules, removing ambiguity, adding explicit failure states). Overwriting active rules automatically would violate governance custody.

### Decision
All optimization proposals follow governed lifecycle actions:
- Supported actions: `KEEP | REWRITE | SPLIT | MERGE | REMOVE | ADD | ESCALATE`.
- Proposals generate **Draft Change Packages** using the Studio's existing intake and staging mechanisms (`server/intake.js`, `server/staging.js`).
- Every proposal preserves:
  - Original rule identity and exact source text.
  - Proposed optimized text.
  - Rationalization and identified issues (classified as Fact, Inference, Assumption, or Recommendation).
  - Exact unified diff.
  - Precondition hashes and required test cases.
  - Explicit pending owner approval status.

### Consequences
- Original policies remain immutable until authorized staging and apply.
- Full traceability and audit trail for all changes.

---

## ADR-05: Optional External Policy Engine Adapter (OPA/Rego)

### Context
AAPES v2.1 includes sample Rego v1 policies (`production_write.rego`). AGHR Studio enforces deterministic JavaScript security controls (`server/security.js`). Does adding an OPA adapter add value without compromising authority?

### Decision
Implement an **optional OPA/Rego adapter** (`server/aapes-opa.js`):
- Checks if the `opa` CLI binary is available on the host path.
- If present, executes `opa check` and `opa test` against candidate policy files in an isolated process.
- If absent, returns explicit status: `NOT_RUN: OPA binary unavailable` with exact prerequisite instructions.
- Rego policies serve as candidate policy specifications; they **do not replace or weaken** the server's native Node.js authorization guards.

### Consequences
- Truthful reporting: no fabricated OPA test passes.
- Preserves native Node.js security perimeter while supporting modern policy-as-code evaluation when OPA is installed.

---

## ADR-06: Seamless UI Integration with Bilingual RTL/LTR Support

### Context
Users require access to AAPES capabilities (domain browsing, policy review, readiness assessment, compatibility matrix) without adding cluttered, fragmented screens or breaking the bilingual Arabic/English interface.

### Decision
Extend the existing Studio view modes:
- **Reference Manager (`ReferenceManager.jsx`):** Adds package selector support for `aapes_v2_1`, domain filtering (D01–D12), importance weights, and requirement inspection.
- **Intake View (`IntakeView.jsx`):** Adds a "Policy Engineering Review" tab featuring BCP 14 analysis, completeness checks, ambiguous term detection, and one-click drafting of Change Packages.
- **Evaluation View (`EvaluationView.jsx`):** Adds an "AAPES Readiness Assessment" tab with interactive risk tiers (R0–R3), maturity scoring, hard-gate monitoring, and synthetic test execution.
- **Compatibility Matrix:** Accessible via modal or dedicated tab with CSV export.
- All new UI strings are added to `src/i18n/locales.js` in both English and Arabic with full bidirectional layout support.

### Consequences
- Consistent user experience preserving established workflows.
- Full compliance with bilingual accessibility standards.
