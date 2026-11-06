# Candidate Enhancement Packet 2C: AAPES Policy Diagnostic Benchmark
## Offline Policy Specification Readiness Evaluator

**Packet ID:** `CANDIDATE-PACKET-2C`  
**Parent Workstream:** `AFE-GOV-LEGACY-RECONCILE-002`  
**Source Origins:** `governance_packages/candidates/AAPES_v2.1_Candidate/` (48 requirements across 12 domains)  
**Target Specification:** `tools/aapes_benchmark/assess_policies.py`  
**Status:** `CANDIDATE_SPECIFICATION_PENDING_OWNER_DECISION (DEC-008)`

---

## 1. Executive Summary & Intent

AAPES v2.1 defines 48 atomic requirements across 12 domains (ISO/IEC/IEEE 29148:2018) for engineering verifiable AI agent policies.

**Problem:** In its unpromoted state, AAPES bundles an OPA Rego policy engine and PEP runtime interceptors that would deadlock solo development workflows if activated prematurely.

**Solution:** Decouple the **48-requirement evaluation framework** from runtime enforcement. Package the readiness scoring logic into an **offline diagnostic benchmark script** that grades a repository's policy files (e.g. `policies/RULES.json`) against the 12 AAPES domains, outputting an informative readiness score (R0 to R3) without blocking build or runtime execution.

---

## 2. Benchmark Architecture & Domain Coverage

The benchmark script evaluates four critical criteria per policy rule:
1. **Identifier & Lineage (Domain D01):** Unique ID, primary obligation, scope, and owner.
2. **Deterministic Preconditions (Domain D02):** Explicit triggers, conditions, and three-valued truth logic (TRUE, FALSE, UNKNOWN).
3. **Authority Bounds (Domain D03):** Verified authority layer; prohibition of prompt self-promotion.
4. **Data Isolation (Domain D04):** Untrusted input sanitized and marked as data.

Readiness Score Tiers:
- **R0 (Readiness >= 75%):** Advisory / Read-only tasks.
- **R1 (Readiness >= 80%):** State-preserving queries.
- **R2 (Readiness >= 85%):** Non-production local changes.
- **R3 (Readiness >= 90%):** Production and sensitive actions.

---

## 3. Acceptance Criteria & Test Plan

- **AC-2C-01 (Offline & Standalone):** Operates using Python standard library or pure Node.js; zero external network or database connections.
- **AC-2C-02 (Diagnostic Disclaimers):** Output reports must include `"mode": "ADVISORY_DIAGNOSTIC_ORACLE"`, `"runtime_enforcement": "DISABLED"`.
- **AC-2C-03 (Non-Gating Behavior):** A failing benchmark score must NEVER halt git commits, CI test suites, or development server startups.
