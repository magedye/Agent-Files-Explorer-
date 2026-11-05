# AGHR Governance Studio — AAPES v2.1 Implementation & Integration Report

**Directive / Task ID:** `AGHR-AAPES-INTEGRATION-001`  
**Execution Window:** 2026-11-04 / 2026-11-05  
**Feature Branch:** `feat/aghr-aapes-integration-001`  
**Target Studio Architecture:** Accepted AGHR Studio (`src/features/studio/StudioApp.jsx`, `server/studio/unified-runtime.mjs`, `/api/v1/...`, port 5183)  
**Status:** COMPLETE / QUALIFIED FOR OWNER REVIEW  

---

## 1. Executive Summary

In accordance with Directive `AGHR-AAPES-INTEGRATION-001` and the Owner Integration Qualification requirements, AGHR Governance Studio has been successfully extended with **AAPES v2.1** policy engineering, audit, compatibility analysis, risk assessment, evaluation, and traceability capabilities.

Critically, the integration is verified and accessible through the **canonical, accepted Studio architecture**:
- **Interface:** `src/features/studio/StudioApp.jsx` and `src/features/aapes/AapesStudio.jsx`.
- **Runtime:** `server/studio/unified-runtime.mjs` and `server/studio/aapes-candidate.mjs`.
- **API Contracts:** `/api/v1/workspaces/aapes-candidate/...` and `/api/v1/aapes/...` endpoints under ephemeral `X-Studio-Token` authentication.
- **Port:** Local approved Studio runtime on port 5183.
- **Governed Change Package Drafting:** Direct integration from reviewed policy proposals into `rc3-local` draft custody (`sqlite`) without altering production baselines or activating unauthorized policies.

---

## 2. Complete 7-Step Owner Demonstration Flow

The end-to-end qualification was executed and verified through both API test harness (`tests/aapes_studio_flow.test.mjs`) and Microsoft Edge headless UI automation (`tests/aapes_browser.spec.mjs`):

| Step | Action & Endpoint | Implementation & Verification Evidence |
| :--- | :--- | :--- |
| **Step 1** | **Open Accepted Studio**<br>`GET /studio.html`, `GET /api/v1/session` | Authenticated via ephemeral `X-Studio-Token`. Operational context returns `draft_workspace: "rc3-local"`. `StudioApp.jsx` mounts with full bilingual AR/EN support. |
| **Step 2** | **Access AAPES Candidate**<br>`GET /api/v1/workspaces` | Candidate workspace `aapes-candidate` is listed alongside `rc3-local` and pilot projects. Read-only, unpromoted status (`REVIEW_CANDIDATE_NOT_ADOPTED`, version `2.1.0-rc.1`). |
| **Step 3** | **Inspect 12 Domains & 48 Reqs**<br>`GET /api/v1/workspaces/aapes-candidate/instructions` | Returns 48 `ItemView` objects with full metadata (ID, kind: `REQUIREMENT`, force: `MUST`/`SHOULD`/`MAY`, priority: `P0`/`P1`, statement, acceptance tests). Rendered in `InstructionsRegistry.jsx` and `InstructionDetail.jsx`. |
| **Step 4** | **Run Policy Review**<br>`POST /api/v1/aapes/review` | Static analysis parses BCP 14 normative force, flags ambiguous adjectives (`appropriate`, `fast`, `safe`), decomposes compound obligations (`SPLIT`), verifies triggers and fail-closed state, surfaces prompt-injection risks, and generates unified diffs. |
| **Step 5** | **Perform Readiness Assessment**<br>`POST /api/v1/aapes/assess` | Evaluates risk tiers R0–R3 against 12 domain scores (0–4), Stage Gates G0–G7, and safety veto signals. Strictly separates diagnostic maturity score from governing qualification; critical P0 gate failure results in `BLOCKED` regardless of high mathematical score. |
| **Step 6** | **View Compatibility Matrix**<br>`GET /api/v1/aapes/matrix` | Full 48-requirement matrix with traceability to AGHR rules, contracts, and tests. Summary: **43 COVERED, 5 PARTIAL, 0 MISSING, 0 CONFLICT**. Supports interactive filtering and streaming CSV export via `?format=csv`. |
| **Step 7** | **Prepare Governed Draft CP**<br>`POST /api/v1/aapes/propose-change-package` | Reviewed proposal is validated against pinned Python E3 schemas, assigned a unique ID (`CP-2026-...`), authorized via operator intent approval, and persisted into `rc3-local` draft SQLite custody. Immediately inspectable under screen `packages` (`DraftStudio.jsx`). |

---

## 3. Security and Authorization Guardrails (Priority 2)

All endpoints under `/api/v1/aapes/...` and `/api/v1/workspaces/aapes-candidate/...` strictly enforce the accepted Studio security model:

1. **Authentication Enforcement:** Missing or invalid `X-Studio-Token` headers return HTTP 401/403 and record an audited denial in `studio.store.recordAttempt`.
2. **Read-Only Candidate Isolation:** Mutations (`POST`, `PATCH`, `DELETE`) targeting `/api/v1/workspaces/aapes-candidate/...` are unconditionally rejected with HTTP 403 (`FORBIDDEN`).
3. **Safe Archive Intake:** `verifyAndUnpackAapesPackage()` in `server/aapes-package.js` enforces SHA-256 integrity verification (`da902a9cd9ddd2967302ac26bb35e700408a290cf154b7fbb0bf612f0d436edb`) and rejects directory traversal (`..`), absolute paths, and null bytes.
4. **Draft-Only Mutation Custody:** Proposals created from AAPES candidate reviews are stored strictly in `rc3-local` draft custody (`studio.sqlite`); they never overwrite canonical rules or alter the default `aghr_rc3` governance baseline.

---

## 4. Inventory of Changed and Created Files

### 4.1 Backend Engine & Runtime Modules
- `server/studio/aapes-candidate.mjs`: Candidate workspace handler and canonical API routes under `/api/v1/aapes/...`.
- `server/studio/unified-runtime.mjs`: Wires `aapes-candidate` workspace into `GET /api/v1/workspaces` and routes `/api/v1/aapes/...` requests under canonical authentication.
- `server/aapes-framework.json`: Full 12-domain and 48-requirement normative specification with complete bilingual titles, statements, and acceptance test references.
- `server/aapes-policy.js`: Policy engineering engine (BCP 14, ambiguous adjectives, atomicity, completeness, unified diffs, finding classification).
- `server/aapes-assessment.js`: Risk-weighted readiness assessment engine enforcing hard-gate separation and veto signals.
- `server/aapes-evaluation.js`: Deterministic decision oracles (`productionWriteReference`, `classifyTestEvidence`) and OPA adapter.
- `server/aapes-package.js`: Archive verification and safe extraction service.
- `server/security.js`: Registration of `AAPES_CANDIDATE_ROOT`.
- `server/governance.js`: Registration of `aapes_v2_1` package metadata.

### 4.2 Frontend Studio Components
- `src/features/aapes/AapesStudio.jsx`: Comprehensive bilingual Studio component providing Candidate Framework, Policy Reviewer, Readiness Assessor, Compatibility Matrix, and Decision Oracles tabs.
- `src/features/studio/StudioApp.jsx`: Registered screen `aapes` (`هندسة سياسات AAPES / AAPES Policy Engineering`) in navigation and router.

### 4.3 Test & Verification Suites
- `tests/aapes_studio_flow.test.mjs`: Full 7-step API integration, security boundary, and draft creation test suite.
- `tests/aapes_browser.spec.mjs`: Playwright Microsoft Edge headless UI automation verifying the 7-step flow in the browser.
- `tests/aapes_integration.test.mjs`: 12 unit tests for package verification, framework validation, linter, assessment, and oracles.

---

## 5. Verification Evidence Summary

| Verification Suite | Result | Details |
| :--- | :--- | :--- |
| `npm run test:studio-api` | **PASS (59/59)** | 59 endpoints exercised successfully, 169 schema checks valid, zero regressions. |
| `node --test tests/aapes_studio_flow.test.mjs` | **PASS (1/1)** | Full 7-step workflow passed in 11.3s with complete security denial verification. |
| `npx playwright test tests/aapes_browser.spec.mjs` | **PASS (1/1)** | Headless Microsoft Edge browser navigated all screens, candidate registry, and AAPES tabs. |
| `node --test tests/aapes_integration.test.mjs` | **PASS (12/12)** | All 12 AAPES backend unit tests passed in 2.3s. |
| `npm test` | **PASS (184/184)** | 172 baseline tests + 12 AAPES tests passed with 0 failures and 0 skips. |
| `npm run build` | **PASS** | Vite production build succeeded; 328 modules transformed in 10.29s. |
| `node tools/check_context_health.mjs` | **PASS** | 0 errors, 0 warnings; bootstrap context at ~4,869 tokens (budget < 5,000). |
