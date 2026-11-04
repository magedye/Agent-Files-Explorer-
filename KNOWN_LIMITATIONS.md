# AGHR Governance Studio — Known Limitations & Risk Disclosures (AAPES v2.1)

**Directive / Task ID:** `AGHR-AAPES-INTEGRATION-001`  
**Date:** 2026-11-04 / 2026-11-05  
**Scope:** Extension candidate integrating AAPES v2.1 capabilities  
**Authority Reference:** `docs/evidence/studio-release-2026-10-25/KNOWN_LIMITATIONS_AR.md` & `OWNER_SIGNOFF_AR.md`  

---

## 1. Governance Authority & Non-Claims

1. **Candidate Framework Status (No Automatic Promotion):**
   - AAPES v2.1 is integrated as a **review candidate** (`EXTERNAL_CANDIDATE`). It is **not** promoted to active production authority.
   - The authoritative reference for all new and existing projects remains **AGHR rc.3** (`aghr_rc3`).
   - Registering AAPES does not migrate existing consumer projects, adopt new normative contracts, or grant operational permissions.

2. **Provisional Engineering Parameters (No Empirical Probability):**
   - AAPES importance weights (summing to 100%), risk multipliers (0.5 to 1.5), and maturity qualification thresholds (R0: 75, R1: 80, R2: 85, R3: 90) are **provisional engineering design targets**.
   - These parameters do not represent empirically measured risk probabilities or guarantees of system reliability.

3. **No Automatic Deployment or Activation:**
   - Achieving a passing diagnostic score or reaching `READY_FOR_AUTHORIZED_REVIEW` in the readiness calculator **NEVER** activates an agent or grants execution privileges.
   - Consequential and R2/R3 operations strictly require independent human owner authorization outside the model runtime.

---

## 2. Policy Enforcement & Schema Boundaries

1. **Schema Validation vs. Authorization:**
   - Validating tool calls against JSON Schemas (`tool_action.schema.json`) verifies syntactic shape and type constraints only.
   - A schema cannot authenticate caller identity, verify credential freshness, or enforce authorization. Authorization must reside in an authenticated upstream Policy Enforcement Point (PEP).

2. **Simulated Trusted Claims:**
   - The decision oracles (`production_write_reference`, `reference_guard.py`) use simulated `trusted` dictionaries in offline test fixtures.
   - In production, trusted claims (`gateway_authenticated`, `principal_authorized`, `approval_verified`, `nonce_not_replayed`) must be derived from trusted infrastructure, never from client requests, LLM outputs, or document payloads.

3. **Rego / OPA Runtime Dependency:**
   - Open Policy Agent (`opa`) is not installed on the local system PATH.
   - Rego policies (`production_write.rego`, `production_write_test.rego`) are validated as declarative reference specifications.
   - The Studio API truthfully reports `NOT_RUN: OPA binary unavailable` when evaluating OPA policies, refusing to fabricate synthetic passes.

4. **Python Scripts in ZIP Archive:**
   - Python is not available on the local host PATH.
   - Packaged Python tools (`assess_readiness.py`, `validate_pack.py`, `reference_guard.py`) are retained as non-executable reference artifacts. All evaluation and policy engineering algorithms are executed natively in Node.js.

---

## 3. Preserved Institutional Baseline Limitations

The following limitations from the accepted v1.0.0 baseline (`KNOWN_LIMITATIONS_AR.md`) remain active:

1. **Windows Local Scope:** Studio v1.0.0 is qualified for local and closed institutional use on Windows; no hosted CI/CD or production server qualification is asserted.
2. **Single Active ChangePackage:** The staging runtime operates on a single active workspace at a time; concurrent multi-user write operations are not supported.
3. **Unmeasured Python V8 Coverage:** Code coverage metrics cover Backend JavaScript / MJS files (83.44%); Python execution is not instrumented or measured in V8 coverage tools.
4. **Historical Phase 0 Sentinel:** The historical Phase 0 sentinel (`test_phase0_sentinel.mjs`) checks a stale 1.2 observation that fails after the owner-authorized switch to rc.3; this failure is expected and documented in `CURRENT.md`.
5. **Unsigned Publisher:** Local execution uses local process isolation without GPG signing or digital publisher certificates.
