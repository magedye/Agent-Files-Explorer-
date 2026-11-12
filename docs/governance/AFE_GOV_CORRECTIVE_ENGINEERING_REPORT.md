# AFE-GOV — Corrective Engineering & Verification Report

**Document ID:** `AFE-GOV-CORRECTIVE-ENGINEERING-REPORT`
**Status:** `READY_FOR_OWNER_REVIEW`
**Scope:** Fix proven defects in instruction classification and test-report integrity; review operational gaps. No scope expansion, no authority change, no push/merge/release.
**Verification baseline:** `Agent Governance & RCCA Kit EN v1.4.0 + ADEQ 1.1` (Baseline v1).

---

## 1. Defect Log (سجل العيوب والأسباب الجذرية والأدلة)

### D1 — Negation misclassification in `server/intake.js::classifyStatement`
- **Root cause:** Normative-force detection used ordered regex where *positive* keywords (`must`, `shall`, `required`, `يجب`, `ينبغي`) were matched before, and with incomplete, *negation* patterns. Phrases such as `لا يجب`, `لا ينبغي`, `shall not`, `should not`, `not required`, `no longer required` fell through to the positive keyword and were labeled as obligations (`MUST`/`SHOULD`).
- **Evidence (reproduced before fix):**
  | Input | Actual (buggy) | Expected |
  |---|---|---|
  | `لا يجب أن نضيف قاعدة جديدة` | `MUST` | `MUST_NOT` |
  | `Agents shall not execute` | `MUST` | `MUST_NOT` |
  | `This check should not be required` | `MUST` | `SHOULD_NOT` |
  | `This rule is no longer required` | `MUST` | `NOT_REQUIRED` |
  | `It is permitted to use read-only access` | `PROPOSED` | `MAY` |
  | `You may optionally add a note` | `INFO` | `MAY` |
  | `نص ملتبس غير واضح المعنى` | `PROPOSED` | `REVIEW_REQUIRED` |
- **Impact:** `force` propagates to `reconcileWithRules`, which derives `proposedAction` (REJECT/MERGE/STRENGTHEN). A prohibition read as an obligation inverts the disposition.

### D2 — `PROPOSED` used as the default normative force
- **Root cause:** The fallback default was `"PROPOSED"`, conflating a *review status* with a *normative force*. Ambiguous/unrecognized statements were silently labeled as proposed requirements.
- **Fix:** Default is now `REVIEW_REQUIRED`; `intent` for such statements is also `REVIEW_REQUIRED`.

### D3 (documented limitation, not changed) — conflict detection covers only MUST↔MUST_NOT
- `reconcileWithRules` flags conflict only for `MUST` vs `MUST_NOT`. A proposal weakening a `MUST` rule to `SHOULD_NOT`/`NOT_REQUIRED` is not auto-flagged. Recorded as a recommendation (Section 6), not a code change, to avoid scope creep.

---

## 2. Implemented Changes & Regression Results (التغييرات المنفذة ونتائج الانحدار)

### Files changed
1. `server/intake.js` — rewrote the normative-force block of `classifyStatement`:
   - Negation-aware, ordered from most binding to least: `MUST_NOT` → `SHOULD_NOT` → `NOT_REQUIRED` → `MAY` → `MUST` → `SHOULD` → `INFO` → (default) `REVIEW_REQUIRED`.
   - Negation patterns precede positive keywords (`لا يجب`, `لا ينبغي`, `يجب عدم`, `shall not`, `should not`, `not required`, `no longer required`, `not recommended`).
   - Added `SHOULD_NOT`, `MAY`, `NOT_REQUIRED`, `REVIEW_REQUIRED`; retained `MUST`, `MUST_NOT`, `SHOULD`, `INFO` for backward compatibility.
   - `intent` now emits `REVIEW_REQUIRED` for ambiguous statements.
2. `tests/classification.test.mjs` (new) — 29 regression tests covering: Arabic/English direct + compound negation, quoted text, conditions, recommendations, binding commands, permission, non-requirement, and ambiguity.

### Contract compatibility
- The `force` field name and the pre-existing values `MUST`, `MUST_NOT`, `SHOULD`, `INFO` are preserved. New values are additive. The legacy assertions in `tests/governance_studio.test.mjs` (`يمنع …` → `MUST_NOT`, `ينبغي …` → `SHOULD`, and `reconcileWithRules` → `REJECT`) all still pass unchanged.
- **Documented contract change:** `classifyStatement` no longer emits `PROPOSED` as a force; ambiguous input now yields `REVIEW_REQUIRED`. The `IntakeView.jsx` badge still renders new values (falls back to default styling; cosmetic only).

### Regression results
| Verification | Result |
|---|---|
| `tests/classification.test.mjs` | 29/29 passing |
| `tests/governance_studio.test.mjs` (legacy contract) | 16/16 passing |
| Combined | 45/45 passing, 0 failures |
| Full `npm test` (re-run, authoritative count) | **330/330 passing, 0 failures** (verified, exit 0, ~830s) |

---

## 3. Test Reconciliation Report (تقرير مصالحة الاختبارات)

### What the "48/48" and "20/20" figures actually are
The numbers cited in `docs/status/CURRENT.md` and the 011 closure report are a **specific, documented subset**, not the full suite:

| Claim | Actual meaning | Source |
|---|---|---|
| **48/48 Node** | 5 suites: Baseline v1 (13) + INBOX custody (1) + Intake lifecycle (14) + Operational closure (9) + Request custody (11) = 48 | `AFE_GOV_INTAKE_OPERATIONAL_CLOSURE_011_REPORT.md` §6 |
| **20/20 Python** | Packet 2A Enterprise Rule Engineer (12) + Packet 2C AAPES Diagnostic Benchmark (8) = 20 | same report §6 |

### Full suite actuals (Node)
| Metric | Value |
|---|---|
| Full `tests/*.test.mjs` count (before this change) | 301 passing |
| Full count (after adding `classification.test.mjs`, 29 tests) | **330** (confirmed: 330/330 passing, 0 failures, 0 skipped, exit 0) |
| Scope | 51 `tests/*.test.mjs` files (+ 2 Playwright `.spec.mjs` excluded from `npm test`), incl. Studio integration suites that spawn real Python/pwsh subprocesses |
| Node runtime | `node --test --test-concurrency=2` (per `package.json`) |
| Wall-clock | ~830s (~14 min) measured; a prior foreground run exceeded 900s (non-deterministic, subprocess-bound) |
| Python offline diagnostics | 20 (Packet 2A + Packet 2C), as documented in the 011 report |

### PASSED / FAILED / NOT_RUN states
- **PASSED:** Node classification + governance_studio (45/45 verified locally). Full Node suite green per the re-run (Section 2 / full-suite log).
- **FAILED:** none reproduced after the fix (the pre-fix AAPES package failure was separately corrected by re-pointing the archived source ZIP).
- **NOT_RUN:** live LLM qualification (`REQ-AFE-QUAL-008-LIVE`, deferred), PEP/PDP runtime interception (`DEC-009`, dormant), hosted CI/remote publication.

---

## 4. Architectural Recommendations (المسارات والملفات غير المتتبعة)

### 4a. `/api/intake/submit` and blocked mutation routes
`server/api.js` applies a blanket guard: any non-`GET` request whose path is not in the `previews` allow-list is rejected `403` before its handler runs.

| Route (POST) | Reachable | Purpose |
|---|---|---|
| `/api/intake/submit` | ❌ blocked | Legacy intake → ChangePacket (dead handler) |
| `/api/evaluation/run-suite` | ❌ blocked | Run unit-test suite (dead handler) |
| `/api/evaluation/check-package` | ❌ blocked | Run package check (dead handler) |
| `/api/staging/create` | ❌ blocked | Create staging workspace (dead handler) |
| `/api/governed-apply` | ❌ blocked | Apply staged changes (dead handler) |
| `/api/governed-apply/rollback` | ❌ blocked | Rollback backup (dead handler) |
| `/api/adoption/inspect` | ✅ preview | Read-only inspection |
| `/api/adoption/prepare` | ✅ preview | Read-only adoption plan |
| `/api/aapes/review` | ✅ preview | Read-only policy review |
| `/api/aapes/assess` | ✅ preview | Read-only assessment |
| `/api/aapes/evaluate` | ✅ preview | Read-only synthetic evaluation |
| `/api/aapes/propose-cp` | ✅ preview | Draft ChangePacket (draft-only write; owner authorization required before apply) |

**Security guarantees:** the guard is defense-in-depth; it fails closed so no mutation route can be reached over HTTP, and the read-only `resolveSafePath` path traversal / symlink / null-byte protections (reviewed earlier) apply to all tree/file routes. The six unreachable handlers are **dead code** that remains as documentation of the intended API surface.

**Recommendation (owner decision, no code change made):** either (a) remove the six dead POST handlers, or (b) leave them explicitly labeled "intended but gated" — both require an architectural decision. The guard itself should stay.

### 4b. Untracked `.ps1` files
| File | Purpose | Sensitive data |
|---|---|---|
| `setup.ps1` | Windows env setup (venv, pinned pip/npm install, build, optional repo checks) | none |
| `start.ps1` | Launch Studio via supervisor + CurrentUserOnly named pipe; ephemeral token kept in memory, redacted from logs | none (token is memory-only) |
| `stop.ps1` | Graceful stop (PID+start-time+path identity match; no forced kill) | none |
| `verify.ps1` | Operational HTTP checks; report writes no credentials | none |

All four are legitimate, well-hardened operational scripts with **no hardcoded secrets or credentials**. They are currently **untracked** in Git, which is an operational risk (loss/drift of the install/run automation referenced by `STUDIO_INSTALLATION.md` and `README.md`).

**Recommendation (owner decision):** commit these four scripts (safe — no secrets). Not done automatically per directive.

---

## 5. Test Performance Report (أداء الاختبارات قبل/بعد)

### Baseline (measured)
- Full suite wall-clock: **~830s (~14 min)** in one measured run; a prior foreground run exceeded 900s (variance is subprocess-bound).
- Bottleneck: six Studio integration test files that spawn real Python/pwsh subprocesses:

| File | Slowest test | Duration |
|---|---|---|
| `studio_e3_approval.test.mjs` | E3/T18 real bounded runs | ~158s |
| `studio_canonical.test.mjs` | T36 registrations/grants/settings | ~60s |
| `studio_e4_honesty.test.mjs` | E4.e honesty guards | ~58s |
| `studio_draft_runtime.test.mjs` | T13/T14/T16 HTTP draft grants | ~40s |
| `studio_ci_parity.test.mjs` | T24 seeded CLI3 judgments | ~36s |
| `studio_bridge.test.mjs` | T06 candidate selection | ~13s |

### After
The corrective change adds only 29 fast in-memory tests (`classification.test.mjs`, ~1.4s total), so it does not meaningfully change the runtime; the bottleneck is unchanged.

### Proposed improvements (preserving coverage — owner decision, not implemented)
1. **Tag & split suites:** move the six slow subprocess-spawning files into a `tests-slow/` directory with a separate `test:slow` script, leaving `npm test` fast (< ~1 min) for the pure in-memory suites. No test is removed; coverage is preserved by running both in CI.
2. **Raise concurrency selectively:** the slow tests are dominated by subprocess wall-clock, not CPU; increasing `--test-concurrency` would yield limited gains and risks flakiness on shared SQLite/table fixtures (T36). Not recommended without isolation.
3. **Reuse pinned subprocess fixtures** where tests repeatedly re-run the same Python CLI validation.

A low-risk local optimization was **not** implemented: any change to `--test-concurrency` or suite layout touches shared test infrastructure and risks regression, which exceeds the "low-risk local" authorization.

---

## 6. Remaining Owner Decisions (قرارات المالك المتبقية)

Separated from the fixes already authorized and applied:

1. **Dead mutation routes** (`/api/intake/submit` + 5 others): remove, or keep as explicitly-gated documentation?
2. **Untracked `.ps1` scripts**: commit to Git (safe, no secrets), or keep untracked?
3. **Slow test-suite split**: authorize moving the six slow subprocess suites into a `test:slow` job to bring `npm test` under a sane window?
4. **Conflict-detection extension (D3)**: authorize flagging `SHOULD_NOT`/`NOT_REQUIRED` weakening of a `MUST` rule as a conflict in `reconcileWithRules`?
5. **`CURRENT.md` reconciliation wording**: approve the corrected full-suite figure (330) and the subset clarification in `docs/status/CURRENT.md`.

---

### Honesty notes
- The `CURRENT.md` "48/48 / 20/20" figures were a **point-in-time subset**, not the full suite; this report corrects that distinction.
- Execution, verification, and acceptance are kept separate: this report is verification only, and final adjudication remains with the Sovereign Project Owner.
