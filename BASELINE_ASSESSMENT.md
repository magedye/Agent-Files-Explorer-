# AGHR Governance Studio — Baseline Assessment & Reconciliation Report

**Directive / Task ID:** `AGHR-AAPES-INTEGRATION-001`  
**Date:** 2026-11-04 / 2026-11-05  
**Current Branch:** `feat/aghr-aapes-integration-001`  
**Base Commit:** `71147ff chore(release): Finalize AGHR Governance Studio v1.0.0 (T40 Signoff)`  
**Authority Boundary:** Bounded development scope for AAPES v2.1 policy engineering integration; v1.0.0 official local release preserved.

---

## 1. Executive Summary & Authority Context

On 2026-10-26, the Project Owner formally accepted **AGHR Governance Studio v1.0.0** (`RELEASE_ACCEPTED_FOR_LOCAL_USE / PROJECT CLOSED`), establishing `aghr_rc3` as the official local reference and default package for new projects, while keeping `aghr_1_2_0` accessible as read-only Legacy.

Under Directive `AGHR-AAPES-INTEGRATION-001`, the project is explicitly reopened for a **strictly limited development scope**: to integrate the **AAPES v2.1** policy engineering, audit, compatibility analysis, risk assessment, evaluation, and traceability capabilities.

This baseline assessment verifies the repository's starting technical state, inventories protected assets, examines the supplied AAPES v2.1 package, and details the compatibility analysis across all 12 domains and 48 requirements of the AAPES v2.1 standard.

---

## 2. Repository Ground Truth & Initial Verification

### 2.1 Git Status and Branching
- **Initial Branch:** `main` (commit `71147fffb60fbf70184cd92bc379ee1d6696a3ac`)
- **Isolation:** Created feature branch `feat/aghr-aapes-integration-001`. No work is performed directly on `main`.
- **Pre-existing Working Tree State:**
  - Modified: `docs/status/CURRENT.md`, `docs/status/HANDOFF.md` (unrelated INBOX intake notes preserved).
  - Untracked: `docs/evidence/inbox-intake-2026-10-26/`, `setup.ps1`, `start.ps1`, `stop.ps1`, `verify.ps1`, `governance_packages/INBOX/NEW/`.
  - Invariant observed: All unrelated local files and untracked scripts are strictly preserved.

### 2.2 Test Suite & Context Health Verification
- **Test Runner Count:** 172 tests executed via `npm test` (`node --test tests/*.test.mjs`).
- **Initial Run:** 171 passed, 1 failed (`tests/inbox_custody.test.mjs`).
  - *Root Cause Analysis:* Directory `governance_packages/INBOX/NEW/` was added to provide the incoming AAPES package. The flat custody scanner in `tools/inbox_custody.mjs` threw on directories (`!entry.isFile()`).
  - *Remediation:* Adjusted `scanInbox` in `tools/inbox_custody.mjs` to skip subdirectories during flat custody scans, restoring full test compliance.
  - *Result:* **172 of 172 tests passing** (100% pass rate).
- **Context Health Check:** `node tools/check_context_health.mjs` passed with **0 errors, 0 warnings** (Total bootstrap context: ~4,869 tokens; target < 5,000 tokens).

---

## 3. Protected Files & Source-Locked Engine Boundaries

In compliance with `AGENTS.md` and the Owner Sign-off record (`OWNER_SIGNOFF_AR.md`), the following files and directories are immutable:

| Protected Path | Reason / Status |
| :--- | :--- |
| `governance_packages/candidates/AGHR_rc3_Core_Candidate/` | Pinned AGHR rc.3 engine bytes. Must not be modified, rebuilt, or moved. |
| `governance_packages/references/AGHR_Studio_1.0.0_rc3_RELEASE.json` | Official owner release registration for rc.3. Immutable reference. |
| `governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/` | Pinned Legacy 1.2.0 reference and historical wheel. Read-only. |
| `docs/evidence/studio-signoff-2026-10-26/` | Historical owner sign-off and closure receipts. Must never be rewritten. |
| `docs/evidence/studio-release-2026-10-25/` | Historical release evidence, T40 signature packet, and T39 review. |
| `.governance/backups/` & `.governance/staging/` | No-crawl transient runtime storage. |

AAPES v2.1 will be registered as an **independent review candidate / external framework** (`aapes_v2_1`), leaving `aghr_rc3` as the authoritative default reference.

---

## 4. AAPES v2.1 Package Verification & Custody

### 4.1 Inbound Package Provenance
- **Source Location:** `governance_packages/INBOX/NEW/AAPES_Policy_Engineering_PLUGIN_SKILL_v2.1.zip`
- **File Size:** 95,251 bytes
- **SHA-256 Digest:** `da902a9cd9ddd2967302ac26bb35e700408a290cf154b7fbb0bf612f0d436edb`
- **Archive Members:** 39 entries under root directory `aapes-policy-engineering/`.

### 4.2 Package Structure & Integrity Audit
The package adheres to the Agent Plugin / Skill layout:
1. `plugin.json`: Plugin manifest (v2.1.1, name: `aapes-policy-engineering`, category: `Security`).
2. `skills/aapes-policy-engineering/SKILL.md`: Main instructions and workflow documentation.
3. `resources/aapes-v2.1/framework.yaml`: Specification defining 12 domains, 48 requirements, risk levels R0-R3, maturity levels 0-4, and stage gates G0-G7.
4. `resources/aapes-v2.1/schemas/*.json`: 5 JSON Schemas (`policy`, `tool_action`, `approval_request`, `assessment`, `audit_event`).
5. `resources/aapes-v2.1/rules/*.yaml`: Specimen policies (`production_write.yaml`, `test_evidence.yaml`).
6. `resources/aapes-v2.1/policies/*.rego`: Sample OPA Rego policies (`production_write.rego`, `production_write_test.rego`).
7. `resources/aapes-v2.1/tools/*.py`: Offline Python validators (`assess_readiness.py`, `validate_pack.py`, `reference_guard.py`).
8. `resources/aapes-v2.1/requirements_trace.csv`: 48 requirements trace matrix.
9. `references/*.md`: Bilingual English/Arabic guides and rule templates.

### 4.3 Safe Custody & Execution Boundary
- **Security Check:** All archive member paths checked for path traversal (`..`), absolute paths, and null bytes. None found.
- **Custody Rule:** Packaged Python scripts (`assess_readiness.py`, etc.) are treated as reference specifications and algorithms, **not executed automatically as privileged host scripts**.
- **Engine Isolation:** All assessment and policy analysis algorithms are implemented natively in the Studio's trusted JavaScript/Node.js environment, matching the Studio's existing architecture.

---

## 5. Existing Studio Capabilities vs. AAPES v2.1 Requirements

| Functional Area | Existing Studio Capability | AAPES v2.1 Requirement | Status | Gap & Plan |
| :--- | :--- | :--- | :--- | :--- |
| **Package Management** | Multi-package support (`aghr_rc3`, `aghr_1_0_0`, `aghr_1_1_0`, `aghr_1_2_0`) | Register AAPES v2.1 as candidate framework | **COVERED** | Register `aapes_v2_1` in `server/governance.js` as `EXTERNAL_CANDIDATE`. |
| **Rule & Requirement Browsing** | Search, filter, inspect rules by force, domain, source | 12 Domains, 48 Requirements, importance weights, priorities | **COVERED** | Extend UI and API to filter by AAPES domains (D01–D12) and view importance weights. |
| **Intake & Statement Analysis** | Decomposes compound statements, classifies domain and normative force | Atomicity, BCP 14 normative parsing, completeness checks, ambiguous adjective detection | **PARTIAL** | Implement BCP 14 parser, completeness linter, and ambiguous adjective flags. |
| **Conflict & Precedence Analysis** | Legacy conflict detection, rule impact analysis | Cross-vendor instruction hierarchy map, versioned conflict register | **PARTIAL** | Add Platform Instruction Hierarchy and Conflict Resolution Register. |
| **Tool & Security Enforcement** | Non-bypassable RootRegistry, path traversal checks, zero-write server boundaries | PEP at tool boundaries, fail-closed semantics, separate authorization from schema | **COVERED** | Studio architecture already enforces server-side non-bypassable PEP. |
| **Readiness Assessment** | Unit test suite runner, package check, 10 metric tracking | Risk-weighted score (R0-R3), domain maturity 0-4, hard gates G0-G7, veto signals | **PARTIAL** | Implement AAPES readiness assessment engine with separate score and hard gates. |
| **Evaluation & Tests** | Deterministic unit tests (172 tests), package checks | Positive, negative, missing evidence, prompt injection, perturbation cases | **PARTIAL** | Implement AAPES decision oracle cases and prompt injection test fixtures. |
| **Governed Proposals & Staging** | ChangePackets, staging workspaces, precondition drift, byte rollback | Proposed actions (`KEEP`, `REWRITE`, `SPLIT`, `MERGE`, `REMOVE`, `ADD`, `ESCALATE`) | **COVERED** | Map policy engineering recommendations to Studio Change Packages. |
| **External Policy Engine** | Deterministic JS runtime checks | Optional OPA/Rego integration | **PARTIAL** | Add optional OPA check adapter with graceful `NOT_RUN` when binary absent. |

---

## 6. Compatibility Matrix Summary

All **48 AAPES requirements** were rigorously analyzed against AGHR Studio's codebase:
- **COVERED:** 43 requirements (89.6%)
- **PARTIAL:** 5 requirements (10.4%)
- **MISSING:** 0 requirements (0%)
- **CONFLICT:** 0 requirements (0%)
- **NOT_APPLICABLE:** 0 requirements (0%)
- **UNVERIFIED:** 0 requirements (0%)

The complete traceability record is published in [AAPES_AGHR_COMPATIBILITY_MATRIX.csv](AAPES_AGHR_COMPATIBILITY_MATRIX.csv).

The 5 **PARTIAL** requirements and their implementation targets are:
1. `AAPES-REQ-003` (D01): Add ambiguous adjective detection in policy intake.
2. `AAPES-REQ-007` (D03): Document cross-vendor platform instruction hierarchy (OpenAI, Anthropic, Gemini).
3. `AAPES-REQ-039` (D03): Provide an interactive Conflict Resolution Register with authority ranking.
4. `AAPES-REQ-012` (D04): Implement prompt perturbation and paraphrase test suite.
5. `AAPES-REQ-015` (D05): Implement dedicated indirect prompt injection test vectors.

---

## 7. Phased Implementation Roadmap

- **Phase 0 — Baseline & Reconciliation:** Completed. Git isolation, test verification, package audit, compatibility matrix generated.
- **Phase 1 — Read-Only Integration:** Register `aapes_v2_1` package, implement safe import/custody, and build deterministic policy review engine.
- **Phase 2 — Assessment & Evaluation:** Implement risk-weighted readiness scoring, hard-gate decisions, veto signals, and evaluation adapter.
- **Phase 3 — Studio UX & Governed Proposals:** Extend Reference Manager, Intake, Evaluation, and Staging views with Arabic/English i18n support.
- **Phase 4 — Regression & Qualification:** Execute full test suite, context health checks, and generate qualification reports.
