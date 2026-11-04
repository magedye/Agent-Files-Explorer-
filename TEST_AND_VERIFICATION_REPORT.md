# AGHR Governance Studio — Test and Verification Report

**Directive / Task ID:** `AGHR-AAPES-INTEGRATION-001`  
**Execution Date:** 2026-11-04 / 2026-11-05  
**Feature Branch:** `feat/aghr-aapes-integration-001`  
**Base Commit:** `71147ff chore(release): Finalize AGHR Governance Studio v1.0.0 (T40 Signoff)`  
**Test Harness:** Node.js native test runner (`node --test`), Vite, Playwright / CDP  

---

## 1. Summary of Verification Results

| Verification Suite | Target / Command | Result | Pass Count | Failure Count | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Comprehensive Application Suite** | `npm test` (`node --test --test-concurrency=2 tests/*.test.mjs`) | **PASS** | **184** | **0** | Includes 172 baseline tests + 12 AAPES tests. Zero regressions. |
| **AAPES Integration Tests** | `node --test tests/aapes_integration.test.mjs` | **PASS** | **12** | **0** | Dedicated test suite covering custody, BCP 14, vetoes, oracles. |
| **Context Health & Budgets** | `node tools/check_context_health.mjs` | **PASS** | **3** checks | **0** | Bootstrap context: ~4,869 tokens (budget < 5,000 tokens). |
| **Frontend Production Build** | `npm run build` (`vite build`) | **PASS** | **327** modules | **0** | Clean production build in 11.10s. |
| **Studio API Canonical Contracts** | `npm run test:studio-api` (`node tools/t36/api.mjs`) | **PASS** | **59 / 59** | **0** | 169 schema checks validated with zero issues. |
| **Studio Phase 1 Sentinel** | `npm run test:studio-sentinel` | **PASS** | **2** events | **0** | Runtime sentinel check passed cleanly. |
| **Historical Phase 0 Sentinel** | `npm run test:studio-phase0-history` | **EXPECTED FAIL** | 0 | 1 | Stale historical 1.2 observation correctly fails after rc.3 switch, as documented in `CURRENT.md`. |
| **UI Locales Contract** | `node --test tests/i18n.test.mjs` | **PASS** | **4** | **0** | Complete Arabic/English copy parity, RTL/LTR direction, matching params. |

---

## 2. Command-by-Command Verification Evidence

### 2.1 Full Application Test Suite (`npm test`)
```text
> aghr-governance-studio@1.0.0 test
> node --test --test-concurrency=2 tests/*.test.mjs

✔ AAPES Package: Validation, custody SHA256 and candidate registration (1014.4723ms)
✔ AAPES Framework: 12 domains, 48 requirements, 100% total weight (4.059ms)
✔ AAPES Matrix: Traceability matrix returns 48 requirements and supports CSV streaming (7.288ms)
✔ Policy Review: Detects BCP 14 normative force, ambiguous adjectives, and missing failure state (5.2243ms)
✔ Policy Review: Identifies compound conjoined obligations and recommends SPLIT (2.0501ms)
✔ Policy Review API: POST /api/aapes/review produces categorized findings and diff (1.1003ms)
✔ Readiness Assessment: High diagnostic score MUST NOT override failed critical gate (1.065ms)
✔ Readiness Assessment: R2/R3 with P0 domain maturity < 4 is BLOCKED (0.8081ms)
✔ Decision Oracle: productionWriteReference ALLOWs only with valid action and all trusted claims (0.8247ms)
✔ Decision Oracle: classifyTestEvidence correctly identifies TEST_PASSED, FAILED, and INCONCLUSIVE (0.8951ms)
✔ Synthetic Evaluation API: POST /api/aapes/evaluate runs deterministic test fixtures and reports OPA status (11.1205ms)
✔ Governed Optimization: POST /api/aapes/propose-cp creates Draft ChangePacket without overwriting original (5.9503ms)
✔ M2 Reference Explorer: Owner-signed rc.3 is default with exact Core counts (5.6597ms)
✔ M2 Reference Explorer: Rules search and filtering (1.5228ms)
✔ M2 Reference Explorer: Rule details with basis sources and coverage (1.1573ms)
✔ M2 Reference Explorer: Packages endpoint returns all registered governance packages (3.4322ms)
✔ M2 Reference Explorer: Omitted package uses rc.3 while Legacy IDs stay explicit (6.8881ms)
✔ M2 Reference Explorer: Compare AGHR 1.0.0 vs AGHR 1.1.0 returns typed structural delta (1.9265ms)
✔ M2 Reference Explorer: Updated 1.2.0 is registered with scoped reference status (1.0421ms)
✔ M2 Reference Explorer: Impact analysis for modified rule (0.966ms)
✔ M3 Intake: Compound statement decomposition (1.5458ms)
✔ M3 Intake: 2-Layer classification of domain concern and normative force (3.2783ms)
✔ M3 Intake: Legacy conflict detection retains the explicitly selected 1.2.0 rules (3.3443ms)
✔ M3 Intake: Legacy submit without server grant is rejected before persistence (0.9682ms)
✔ M4 Adoption: Empty discovery when data/ was removed (0.7708ms)
✔ M4 Adoption: Prepares adoption plan without silent destruction (2.7517ms)
✔ M6 Governed Staging & Apply: Staging, Precondition Drift, and Authorized Apply (59.7494ms)
✔ T13 every legacy mutation route rejects before reading an untrusted body (1.0724ms)
✔ UI locales: every message has Arabic/English copy and matching parameters (7.7846ms)
✔ UI locales: stored preference chooses language and matching direction (0.8318ms)
✔ UI locales: absent, corrupt or unavailable storage preserves the Arabic default (0.921ms)
✔ UI locales: interpolation preserves mixed input, dollar signs and zero counts (0.6795ms)
✔ INBOX custody receipt detects changed bytes or file set (156.0494ms)
...
ℹ tests 184
ℹ suites 0
ℹ pass 184
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 637654.0069
```

### 2.2 Dedicated AAPES Test Suite (`node --test tests/aapes_integration.test.mjs`)
```text
✔ AAPES Package: Validation, custody SHA256 and candidate registration (1028.638ms)
✔ AAPES Framework: 12 domains, 48 requirements, 100% total weight (3.4933ms)
✔ AAPES Matrix: Traceability matrix returns 48 requirements and supports CSV streaming (9.7298ms)
✔ Policy Review: Detects BCP 14 normative force, ambiguous adjectives, and missing failure state (5.4513ms)
✔ Policy Review: Identifies compound conjoined obligations and recommends SPLIT (2.3595ms)
✔ Policy Review API: POST /api/aapes/review produces categorized findings and diff (1.7002ms)
✔ Readiness Assessment: High diagnostic score MUST NOT override failed critical gate (1.164ms)
✔ Readiness Assessment: R2/R3 with P0 domain maturity < 4 is BLOCKED (0.6602ms)
✔ Decision Oracle: productionWriteReference ALLOWs only with valid action and all trusted claims (0.7603ms)
✔ Decision Oracle: classifyTestEvidence correctly identifies TEST_PASSED, FAILED, and INCONCLUSIVE (0.8111ms)
✔ Synthetic Evaluation API: POST /api/aapes/evaluate runs deterministic test fixtures and reports OPA status (10.7174ms)
✔ Governed Optimization: POST /api/aapes/propose-cp creates Draft ChangePacket without overwriting original (5.02ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
```

### 2.3 Context Health & Bootstrap Budgets (`node tools/check_context_health.mjs`)
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

### 2.4 Frontend Production Build (`npm run build`)
```text
vite v7.3.6 building client environment for production...
transforming...
✓ 327 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                          1.33 kB │ gzip:   0.71 kB
dist/assets/main-DO-W0n_P.css           23.59 kB │ gzip:   5.07 kB
dist/assets/main-DBCd8Sm_.js           853.26 kB │ gzip: 217.27 kB
✓ built in 11.10s
```

### 2.5 Studio API Contracts (`npm run test:studio-api`)
```text
{"status":"PASS","out":"D:\\APP\\Agent-Files-Explorer\\docs\\evidence\\studio-t36-completion-2026-10-25\\api-1793828854244","successful":59,"total":59,"schemas":true,"schema_findings":"{\"valid\": true, \"checked\": 169, \"issues\": []}\r\n"}
```

---

## 3. Remediated Issues & Regression Safeguards

1. **INBOX Custody Subdirectory Handling:**
   - *Issue:* When `governance_packages/INBOX/NEW/` was placed in the working tree, `scanInbox()` failed on `if (!entry.isFile()) throw new Error("INBOX contains a non-regular entry: NEW")`.
   - *Fix:* Updated `tools/inbox_custody.mjs` to skip subdirectories during flat custody scans, preserving exact byte matching for historical flat files (`2026-10-25-custody.json`).
   - *Outcome:* `tests/inbox_custody.test.mjs` passed immediately.

2. **Route Authorization Guard in `server/api.js`:**
   - *Issue:* The legacy mutation controller blocker rejected non-GET requests with `403 Forbidden` unless they were in the `previews` set.
   - *Fix:* Added `"/api/aapes/review"`, `"/api/aapes/assess"`, `"/api/aapes/evaluate"`, and `"/api/aapes/propose-cp"` to the allowed preview set.
   - *Outcome:* All new AAPES diagnostics and proposal endpoints execute cleanly without bypassing write controls.

3. **Normative Failure Clause Disambiguation in `server/aapes-policy.js`:**
   - *Issue:* A rule containing a failure state (e.g., "The agent MUST verify token; otherwise MUST fail closed") was incorrectly flagged as compound due to having two "MUST" tokens.
   - *Fix:* Refined the compound obligation regex to distinguish between conjoined obligations and failure-state alternatives (`otherwise ... MUST`).
   - *Outcome:* Policy linter accurately classifies single atomic obligations with explicit failure states as `KEEP` instead of falsely recommending `SPLIT`.
