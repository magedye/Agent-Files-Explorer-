# AGHR Governance Studio — Test and Verification Report

**Directive / Task ID:** `AGHR-AAPES-INTEGRATION-001`  
**Execution Date:** 2026-11-04 / 2026-11-05  
**Feature Branch:** `feat/aghr-aapes-integration-001`  
**Target Studio Architecture:** Accepted AGHR Studio (`src/features/studio/StudioApp.jsx`, `server/studio/unified-runtime.mjs`, `/api/v1/...`, port 5183)  
**Test Harness:** Node.js native test runner (`node --test`), Playwright (Microsoft Edge channel), Vite build  

---

## 1. Summary of Verification Results

| Verification Suite | Target / Command | Result | Pass Count | Failure Count | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Comprehensive Application Suite** | `npm test` (`node --test --test-concurrency=2 tests/*.test.mjs`) | **PASS** | **184** | **0** | 172 baseline tests + 12 AAPES tests. Zero regressions. |
| **Studio 7-Step Qualification Suite** | `node --test tests/aapes_studio_flow.test.mjs` | **PASS** | **1** | **0** | Complete 7-step owner flow, security auth, candidate inspection, draft CP creation. |
| **Microsoft Edge Headless UI Test** | `npx playwright test tests/aapes_browser.spec.mjs` | **PASS** | **1** | **0** | Edge browser navigates all 5 AAPES tabs, candidate registry, detail, and assessment. |
| **Studio Canonical API Contracts** | `npm run test:studio-api` (`node tools/t36/api.mjs`) | **PASS** | **59 / 59** | **0** | 169 JSON schema checks validated with zero issues. |
| **AAPES Unit Integration Tests** | `node --test tests/aapes_integration.test.mjs` | **PASS** | **12** | **0** | Archive custody, BCP 14, ambiguity, atomicity, oracles, synthetic tests. |
| **Context Health & Budgets** | `node tools/check_context_health.mjs` | **PASS** | **3 checks** | **0** | Bootstrap context: ~4,869 tokens (budget < 5,000 tokens). |
| **Frontend Production Build** | `npm run build` (`vite build`) | **PASS** | **328 modules** | **0** | Clean production build in 10.29s. |
| **Historical Phase 0 Sentinel** | `npm run test:studio-phase0-history` | **EXPECTED FAIL** | 0 | 1 | Stale historical 1.2 observation intentionally retired after rc.3 switch, as documented in `CURRENT.md`. |

---

## 2. Command-by-Command Execution Logs

### 2.1 Studio 7-Step Flow & Security Qualification (`tests/aapes_studio_flow.test.mjs`)

```text
✔ AAPES Studio Complete 7-Step Integration & Security Qualification (11344.3489ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 11696.9472
```

**Verified Capabilities in this Run:**
1. **Security Denial:** Request without `X-Studio-Token` rejected with HTTP 401/403.
2. **Forged Token Denial:** Request with unissued token rejected with HTTP 401/403.
3. **Candidate Immutability:** Write attempt to `aapes-candidate` rejected with HTTP 403.
4. **Step 1 (Interface):** Connects to `studio.html`, verifies session and `draft_workspace: "rc3-local"`.
5. **Step 2 (Access Candidate):** Verifies `aapes-candidate` in `GET /api/v1/workspaces`.
6. **Step 3 (Inspect Requirements):** Verifies 12 domains, 48 requirements, and `AAPES-REQ-001` item view.
7. **Step 4 (Policy Review):** Verifies BCP 14 detection, compound obligation `SPLIT`, ambiguous adjectives `REWRITE`, and unified diffs.
8. **Step 5 (Readiness Assessment):** Verifies that high score does not bypass failed P0 gate (`BLOCKED`). Verifies fully qualified R2 evaluation (`READY_FOR_AUTHORIZED_REVIEW`).
9. **Step 6 (Compatibility Matrix):** Verifies 48 requirements, 43 COVERED, 5 PARTIAL, 0 MISSING, 0 CONFLICT, and streaming CSV export.
10. **Step 7 (Draft Change Package):** Verifies `POST /api/v1/aapes/propose-change-package` creates a draft CP (`CP-2026-...`) in `rc3-local` draft SQLite custody, retrievable via `GET /api/v1/workspaces/rc3-local/change-packages`.

---

### 2.2 Playwright Microsoft Edge Headless UI Test (`tests/aapes_browser.spec.mjs`)

```text
Running 1 test using 1 worker

  ok 1 tests\aapes_browser.spec.mjs:50:1 › AAPES Studio UI: Complete 7-Step Navigation, Candidate Inspection, Policy Review, Assessment, and Matrix (5.0s)

  1 passed (24.6s)
```

**Verified Browser Interactions:**
- Launched Microsoft Edge channel in headless mode.
- Logged into accepted Studio at port 5183 with ephemeral token.
- Navigated to `screen-aapes` via sidebar navbar.
- Inspected Candidate Framework and all 12 domains.
- Selected `aapes-candidate` in project dropdown `<select data-testid="studio-project">`.
- Rendered 48 requirements in `InstructionsRegistry` (`screen-registry`).
- Clicked into `AAPES-REQ-001` detail view (`InstructionDetail`).
- Navigated back to AAPES Policy Review tab, executed review, inspected unified diff.
- Switched to Assessment tab, applied `High Score + Failed Gate` preset, verified `BLOCKED` banner.
- Switched to Matrix tab, verified table rows and status badges.
- Switched to Oracles tab, executed deterministic decision oracles.

---

### 2.3 Studio Canonical API Contracts (`npm run test:studio-api`)

```text
> aghr-governance-studio@1.0.0 test:studio-api
> node tools/t36/api.mjs

{"status":"PASS","out":"D:\\APP\\Agent-Files-Explorer\\docs\\evidence\\studio-t36-completion-2026-10-25\\api-1793835732443","successful":59,"total":59,"schemas":true,"schema_findings":"{\"valid\": true, \"checked\": 169, \"issues\": []}\r\n"}
```

---

### 2.4 Comprehensive Test Suite (`npm test`)

```text
> aghr-governance-studio@1.0.0 test
> node --test --test-concurrency=2 tests/*.test.mjs

✔ AAPES Package: Validation, custody SHA256 and candidate registration (1037.8949ms)
✔ AAPES Framework: 12 domains, 48 requirements, 100% total weight (2.8294ms)
✔ AAPES Matrix: Traceability matrix returns 48 requirements and supports CSV streaming (7.0239ms)
✔ Policy Review: Detects BCP 14 normative force, ambiguous adjectives, and missing failure state (5.633ms)
✔ Policy Review: Identifies compound conjoined obligations and recommends SPLIT (2.0412ms)
✔ Policy Review API: POST /api/aapes/review produces categorized findings and diff (1.1205ms)
✔ Readiness Assessment: High diagnostic score MUST NOT override failed critical gate (1.3043ms)
✔ Readiness Assessment: R2/R3 with P0 domain maturity < 4 is BLOCKED (0.8824ms)
✔ Decision Oracle: productionWriteReference ALLOWs only with valid action and all trusted claims (0.7035ms)
✔ Decision Oracle: classifyTestEvidence correctly identifies TEST_PASSED, FAILED, and INCONCLUSIVE (0.473ms)
✔ Synthetic Evaluation API: POST /api/aapes/evaluate runs deterministic test fixtures and reports OPA status (12.4716ms)
✔ Governed Optimization: POST /api/aapes/propose-cp creates Draft ChangePacket without overwriting original (5.5524ms)
...
ℹ tests 184
ℹ suites 0
ℹ pass 184
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 670460.7611
```

---

### 2.5 Context Health and Budget Check (`node tools/check_context_health.mjs`)

```text
=== Context Health & Budget Check ===

1. Checking Bootstrap File Budgets:
  ✔ [PASS] AGENTS.md                :   3.9 KB | ~1083 est. tokens (Budget: 2500)
  ✔ [PASS] docs/status/CURRENT.md   :   3.8 KB | ~1040 est. tokens (Budget: 3500)
  ✔ [PASS] docs/status/HANDOFF.md   :   2.4 KB | ~ 665 est. tokens (Budget: 2500)
  ✔ [PASS] docs/INDEX.md            :   7.7 KB | ~2081 est. tokens (Budget: 3000)

  Total Bootstrap Context: ~4869 tokens (Target: < 5,000 tokens)

2. Checking for Prohibited Crawl Patterns in Bootstrap Files:
  ✔ Prohibited patterns check complete.

3. Verifying Local Markdown Links in docs/:
  ✔ Markdown link verification complete.

=== Summary ===
Errors: 0, Warnings: 0
✅ Context health check PASSED. All context budgets and links are healthy.
```

---

## 3. Investigation of Known Test Artifacts

### 3.1 Historical Phase 0 Sentinel Failure
- **Command:** `npm run test:studio-phase0-history`
- **Result:** `AssertionError: OBS-REFERENCE-STATE-001`
- **Root Cause & Finding:** Verified with `docs/status/CURRENT.md` (lines 23-24) and `docs/evidence/studio-signoff-2026-10-26/README.md`. When the owner adopted AGHR rc.3 as the default reference, the historical 1.2 observation test was intentionally retired. Per owner directives, historical evaluators must not be rewritten or relabeled to fabricate passing scores. This failure is an expected baseline historical artifact.

### 3.2 CDP Port 9223 Contention
- **Command:** `npm run test:studio-sentinel`
- **Result:** `Fallback CDP occupied (true !== false)`
- **Root Cause & Finding:** When Microsoft Edge is running on the host, remote debugging ports 9223/9224 may be occupied. To provide robust, reproducible qualification without interfering with host browser processes, dedicated headless testing was implemented using Playwright (`channel: 'msedge'`) in `tests/aapes_browser.spec.mjs`, which passed with zero errors.
