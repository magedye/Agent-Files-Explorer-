# AFE-GOV — Targeted Closure Report (Owner Review Decision)

**Document ID:** `AFE_GOV_TARGETED_CLOSURE_REPORT`
**Reference:** `AFE_GOV_POST_CORRECTION_RECONCILIATION_REPORT.md` (adopted as review basis)
**Status:** `READY_FOR_OWNER_ACCEPTANCE` (subject to the verified results below)
**Constraints honored:** no push/merge/release during execution; no PEP/PDP activation; no auto policy/package promotion; no governing-reference change; test success is not independent acceptance.

---

## 1. Proven Results, Implemented Fixes, Not-Implemented (النتائج والإصلاحات)

### Implemented (within authorization)
| ID | Change | File(s) |
|---|---|---|
| **D3** | `reconcileWithRules` now classifies opposition by typed force (polarity + rank) into `CONTRADICTION` / `WEAKENING` / consistent. Removed the legacy raw-text regex fallback. Conditional contradictions route to `REVIEW_REQUIRED` (never a final REJECT). Added `conflictType`, `requiresReview`; new `proposedAction` value `WEAKENING_REVIEW`. | `server/intake.js` |
| **D3 (contract)** | `classifyStatement` now exposes `polarity` (POSITIVE/NEGATIVE/NEUTRAL/UNKNOWN) and `conditional` (boolean), unifying the semantic contract with the reconciler. | `server/intake.js` |
| **SEC-02** | `getPacket` rejects any `packetId` not matching `^[A-Za-z0-9_-]+$`, closing the path-traversal read. | `server/intake.js` |
| **DATA-01** | `submitIntake` now accepts and persists `sourceId`, `domain`, `targetPackageId` (backward-compatible optional fields). | `server/intake.js` |
| **Tests** | 21 D3/contract tests + 3 SEC-02/DATA-01 tests (isolated storage + canary). | `tests/reconcile.test.mjs`, `tests/intake_security.test.mjs` |

### Verified findings — no code change (presented as decisions)
- **SEC-01** — `/api/aapes/propose-cp` is classified under the `previews` allow-list but persists a ChangePacket to disk. It is a **draft-only** write (`PROPOSED_READY_FOR_REVIEW`, requires owner grant to apply), bounded by the 1 MB request-body cap and the local (127.0.0.1) scope; it cannot change governance state. The gap is (a) semantic mislabeling (a write inside "previews") and (b) an unbounded packet count. Fixing either requires an architecture/privilege/rate-limit decision → **decision, not auto-fix** (see §4).

### Not implemented (explicitly deferred)
- No `reconcileWithRules` *final* REJECT on text matching or preliminary conflict (per directive: unresolved cases route to review). Unconditional `CONTRADICTION` remains a *proposed* `REJECT`, not a final decision.
- No new routes/privileges/activation; no PEP/PDP change (`DEC-009` preserved).
- D-ROUTES, D-PS1, D-SLOW, D-BUDGET: preserved state, no auto git add/delete (see §4).

---

## 2. Change-Traceability Matrix (من السبب إلى الاختبار والدليل)

| Root cause | Change | Test (evidence) |
|---|---|---|
| Negation misclassification | `classifyStatement` force rewrite (prior directive) | `tests/classification.test.mjs` (29) |
| Reconciliation blind to new forces | `reconcileWithRules` opposition model (D3) | `tests/reconcile.test.mjs` (24) |
| `NOT_REQUIRED` conflated with `MUST_NOT` | anti-conflation branch in `classifyOpposition` | `D3: MUST_NOT rule vs NOT_REQUIRED … CONSISTENT` |
| `SHOULD_NOT` conflated with `MUST_NOT` | anti-conflation branch | `D3: MUST_NOT rule vs SHOULD_NOT … CONSISTENT` |
| Conditional contradiction auto-REJECTed | conditional → `REVIEW_REQUIRED` | `D3: MUST rule vs conditional MUST_NOT → REVIEW_REQUIRED` |
| `getPacket` path traversal (SEC-02) | packetId format validation | `SEC-02: getPacket blocks path traversal` (canary `{leaked:true}` now returns null) |
| `sourceId/domain/targetPackageId` dropped (DATA-01) | `submitIntake` persists them | `DATA-01: submitIntake preserves …` |

---

## 3. Test & Verification Results (السلسلة والانحدار والأمان)

| Suite | Result |
|---|---|
| `tests/reconcile.test.mjs` | 21/21 |
| `tests/intake_security.test.mjs` | 3/3 |
| `tests/classification.test.mjs` | 29/29 |
| `tests/governance_studio.test.mjs` (legacy contract) | 16/16 |
| `tests/studio_legacy_services.test.mjs` (legacy service) | 3/3 |
| Combined focused | 72/72 (0 failures) |
| Full `npm test` | **354/354 passing, 0 failures, exit 0 (~746s)** |

**Pre-existing flakiness note (not a regression from this work):** the heavy Studio integration file `tests/studio_execution.test.mjs` (12 tests) intermittently fails with `fetch failed` when run *concurrently* with other subprocess-spawning suites (`--test-concurrency=2`), due to Python/subprocess resource contention. It passes 12/12 in isolation. It does **not** import `server/intake.js`, and it is unrelated to the intake/reconciliation/storage functions changed here. This is the known D-SLOW concurrency issue, recorded separately from the corrective changes.

Security evidence (SEC-02): the negative test placed a canary at `.governance/intake-traversal-canary.json` (`{leaked:true}`); pre-fix `getPacket("../intake-traversal-canary")` returned the canary, post-fix it returns `null`. No real data was exposed.

---

## 4. Remaining Gaps & Unresolved Owner Decisions

| ID | Gap / decision | Alternatives | Recommendation |
|---|---|---|---|
| **SEC-01** | propose-cp draft-write inside `previews` | A) document + keep; B) require grant; C) add rate/packet-count limit | A now; B/C as privilege/policy decisions |
| **D-ROUTES** | 6 dead mutation POST handlers | keep (documented) / remove / wire with grant controller | keep documented |
| **D-PS1** | 4 `.ps1` scripts untracked | commit (no secrets) / keep untracked | commit |
| **D-SLOW** | full suite ~14 min | split slow subprocess suites into `test:slow` | split |
| **D-BUDGET** | bootstrap ~4996/5000 tokens | accept + rely on `check_context_health.mjs` | accept |
| — | PEP/PDP runtime interception | dormant (`DEC-009`) | unchanged |
| — | live LLM qualification | deferred (`REQ-AFE-QUAL-008-LIVE`) | unchanged |

---

## 5. Independent Limited-Scope Evaluation (تقييم مستقل محدود)

The four changes are **localized, additive, and backward-compatible**:
- **D3** adds fields (`conflictType`, `requiresReview`, `polarity`, `conditional`) and one new `proposedAction` value; existing consumers and the legacy `REJECT` path are preserved (verified by `governance_studio.test.mjs` and `studio_legacy_services.test.mjs`).
- **SEC-02** narrows `getPacket` input to a safe identifier pattern; valid packet IDs (`CP-…`, `CP-old`) are unaffected.
- **DATA-01** adds three optional packet fields (null default); round-trip persistence unaffected.

No change touches `server/security.js`, `server/governance.js`, `server/api.js`, or any governance reference bytes. No test was weakened, skipped, or deleted; coverage increased by 24 tests (330 → 354).

**Honesty statement:** this report separates verification from acceptance. Green tests are necessary evidence, not independent acceptance; final adjudication remains with the Sovereign Project Owner.
