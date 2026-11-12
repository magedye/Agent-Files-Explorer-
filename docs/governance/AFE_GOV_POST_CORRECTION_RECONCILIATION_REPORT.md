# AFE — Post-Correction Reconciliation & Owner Review

**Document ID:** `AFE-GOV-POST-CORRECTION-RECONCILIATION`
**Status:** `READY_FOR_OWNER_REVIEW` (not approval, not adoption)
**Basis:** `AFE_GOV_CORRECTIVE_ENGINEERING_REPORT.md` (adopted as review basis)
**Constraints honored:** no push/merge/release, no new route/policy/privilege activation, no automatic adoption.

---

## 1. Semantic Integration Review (مراجعة التكامل الدلالي)

### Consumer map of `classifyStatement` output
| Consumer | Path | How `force` is used | Affected by new values |
|---|---|---|---|
| `submitIntake` | `server/intake.js` | stores `normativeForce` per change item | additive (stored, no switch on it) |
| `reconcileWithRules` | `server/intake.js` | conflict detection via `force === "MUST"` / `"MUST_NOT"` | **ignores new values (gap D3)** |
| `propose-cp` route | `server/api.js` | `submitIntake` → ChangePacket | additive |
| `IntakeView` | `src/components/IntakeView.jsx` | renders `normativeForce` + `proposedAction` | cosmetic only |
| `studio_legacy_services.test.mjs` | `tests/` | round-trips packet; no force assertion | unaffected |

### Findings
- **F1 (beneficial, verified):** the negation fix has a positive downstream effect. Statements previously misclassified as `MUST` (e.g. `لا يجب …`) now yield `MUST_NOT`, and the existing `MUST ↔ MUST_NOT` check in `reconcileWithRules` now correctly flags them as conflict. No consumer regressed (330/330 green).
- **F2 (gap = D3):** `reconcileWithRules` is unaware of `SHOULD_NOT`, `NOT_REQUIRED`, `MAY`. These forces are stored in change items but never feed conflict detection.
- **F3 (minor inconsistency):** `reconcileWithRules` line 148 keeps a legacy fallback regex `/لا يجوز|يمنع|يحظر/` that is now *narrower* than the classifier (which also detects `لا يجب`, `لا ينبغي`, `shall not`, `never`, …). The classifier is the source of truth; the fallback is redundant and should eventually be removed in favor of the typed `force`.
- **F4 (display, non-breaking):** `IntakeView.jsx` builds a CSS class `force-${normativeForce.toLowerCase()}`. New values (`SHOULD_NOT`, `NOT_REQUIRED`, `MAY`, `REVIEW_REQUIRED`) have no dedicated style rule, so they render with default badge styling. No functional break.

### Backward compatibility
- `force` field name and the pre-existing values `MUST`, `MUST_NOT`, `SHOULD`, `INFO` are preserved; new values are additive.
- Contract change (already documented): `classifyStatement` no longer emits `PROPOSED`; ambiguous input → `REVIEW_REQUIRED`.

---

## 2. D3 Fix Design & Test Matrix (تصميم إصلاح D3 — قبل التنفيذ)

### 2.1 Precise force semantics (the anti-conflation requirement)
| Force | Meaning | Polarity | Rank |
|---|---|---|---|
| `MUST` | binding obligation | POS | 3 |
| `MUST_NOT` | binding prohibition (منع ملزم) | NEG | 3 |
| `SHOULD` | recommendation | POS | 2 |
| `SHOULD_NOT` | discouragement (غير مستحسن، *ليس* منعًا) | NEG | 2 |
| `MAY` | permission/optional | POS | 1 |
| `NOT_REQUIRED` | absence of a positive obligation (عدم الوجوب، *ليس* منعًا) | NEUTRAL | 0 |
| `INFO` | non-normative | NEUTRAL | — |
| `REVIEW_REQUIRED` | ambiguous | UNKNOWN | — |

**Two non-negotiables (per directive):**
1. `NOT_REQUIRED` ≠ `MUST_NOT` — "not required" removes a positive obligation; it does *not* forbid the action. It is compatible with `MUST_NOT` (forbidden ⇒ not required).
2. `SHOULD_NOT` ≠ `MUST_NOT` — "discouraged" is a soft negative; conflating it with "forbidden" would escalate severity and produce false `REJECT`s.

### 2.2 Conflict/weakening classification (proposal force `Fp` vs existing rule force `Fr`)
```
OPPOSES = polarity(Fr) ≠ polarity(Fp), both ∈ {POS, NEG}

CONTRADICTION (→ REJECT):
  OPPOSES(Fr,Fp) and rank(Fr) ≥ 2
  e.g. MUST↔MUST_NOT, MUST↔SHOULD_NOT, MUST_NOT↔SHOULD, SHOULD↔SHOULD_NOT, SHOULD↔MUST_NOT

WEAKENING (→ flag for owner review, not silent accept):
  not OPPOSES, but Fp lowers a positive obligation:
    Fr=MUST   → Fp ∈ {SHOULD, MAY, NOT_REQUIRED}
    Fr=SHOULD → Fp ∈ {MAY, NOT_REQUIRED}

CONSISTENT (no flag):
  everything else, including MUST_NOT↔NOT_REQUIRED, MUST_NOT↔SHOULD_NOT
```

### 2.3 Proposed output shape (backward-compatible)
- Keep `conflictDetected: boolean` (true iff CONTRADICTION).
- Add `conflictType: "CONTRADICTION" | "WEAKENING" | null`.
- Add `requiresReview: boolean` (true iff WEAKENING).
- `proposedAction`: `REJECT` for CONTRADICTION; `WEAKENING_REVIEW` for WEAKENING (new value).

### 2.4 Positive test matrix (MUST flag)
| # | Rule force | Proposal force | Expected |
|---|---|---|---|
| P1 | MUST | MUST_NOT | CONTRADICTION / REJECT |
| P2 | MUST_NOT | MUST | CONTRADICTION / REJECT |
| P3 | MUST | SHOULD_NOT | CONTRADICTION / REJECT |
| P4 | SHOULD | SHOULD_NOT | CONTRADICTION / REJECT |
| P5 | SHOULD | MUST_NOT | CONTRADICTION / REJECT |
| P6 | MUST | NOT_REQUIRED | WEAKENING / flag |
| P7 | SHOULD | NOT_REQUIRED | WEAKENING / flag |
| P8 | MUST | SHOULD | WEAKENING / flag |
| P9 | SHOULD | MAY | WEAKENING / flag |

### 2.5 Negative test matrix (MUST NOT flag — proves the anti-conflation)
| # | Rule force | Proposal force | Expected |
|---|---|---|---|
| N1 | MUST_NOT | NOT_REQUIRED | CONSISTENT (NOT_REQUIRED ≠ MUST_NOT) |
| N2 | MUST_NOT | SHOULD_NOT | CONSISTENT (SHOULD_NOT ≠ MUST_NOT) |
| N3 | MUST | MUST | CONSISTENT (handled as duplicate elsewhere) |
| N4 | MUST_NOT | MUST_NOT | CONSISTENT |
| N5 | SHOULD | SHOULD | CONSISTENT |

> **Status:** design + tests are **proposed only**; implementation of `reconcileWithRules` is deferred pending owner approval (Section 5, Decision D3).

---

## 3. Verification of the `330/330` Evidence (تحقق أدلة النتائج)

| Check | Result |
|---|---|
| Full `npm test` exit code | 0 |
| Totals | `tests 330, pass 330, fail 0, cancelled 0, skipped 0, todo 0` |
| New classification suite present in run | 29 `Classification:` tests |
| Failure lines in run log | none |
| Wall clock | ~830s (~14 min); a prior foreground run exceeded 900s (subprocess-bound variance) |
| Scope | 51 `tests/*.test.mjs` files; 2 Playwright `.spec.mjs` excluded from `npm test` |
| Baseline match | only `server/intake.js` modified (additive, backward-compatible); `server/governance.js`, `server/security.js`, `server/api.js` untouched; no reference/package bytes changed |

The `330` is arithmetically exact: 301 prior + 29 new classification tests, all green.

---

## 4. Context Budget Review (مراجعة حدود السياق)

| Bootstrap file | Tokens | Budget | Margin |
|---|---|---|---|
| AGENTS.md | ~1156 | 2500 | +1344 |
| CURRENT.md | ~862 | 3500 | +2638 |
| HANDOFF.md | ~808 | 2500 | +1692 |
| INDEX.md | ~2170 | 3000 | +830 |
| **Total** | **~4996** | <5000 | **+4** |

- The 5000-token total is a **soft target** (the checker warns, not fails, on breach); it is currently within budget with a 4-token margin.
- Per-file budgets carry ample headroom; the binding constraint is the collective total, dominated by `INDEX.md` (~2170) and `AGENTS.md` (~1156).
- **Treatment proposal (no reduction of governing obligations):** keep the governing content intact and direct detail into *reports* rather than bootstrap files — which is exactly what the corrective report did (reconciliation detail lives in `docs/governance/…`, not in `CURRENT.md`). Continue relying on `check_context_health.mjs` as the enforced guard. If more headroom is ever required, the lever is `INDEX.md` consolidation (navigation-equivalent links), decided by the owner — not a unilateral reduction of commitments.

---

## 5. Owner Decision Matrix (مصفوفة القرارات الخمسة)

### D-ROUTES — dead mutation routes
| | |
|---|---|
| **Alternatives** | A) remove the 6 dead POST handlers; B) keep them labeled "intended but gated"; C) wire a server-authorized mutation controller |
| **Impact** | A reduces code surface; B preserves API documentation; C re-enables writes (scope change) |
| **Risk** | A: low (handlers unreachable today); B: none; C: high (new write surface, needs grants) |
| **Recommendation** | B now; revisit C only with an explicit grant-controller design |
| **Expected outcome** | unambiguous API intent without changing reachability |

### D-PS1 — untracked PowerShell scripts
| | |
|---|---|
| **Alternatives** | A) commit to Git; B) keep untracked |
| **Impact** | A restores version control of install/run automation; B preserves status quo |
| **Risk** | A: none (no secrets in the 4 scripts, verified); B: loss/drift risk remains |
| **Recommendation** | A — commit `setup/start/stop/verify.ps1` |
| **Expected outcome** | reproducible Windows automation under version control |

### D-SLOW — slow test-suite split
| | |
|---|---|
| **Alternatives** | A) move 6 subprocess-heavy files to `tests-slow/` + `test:slow` script; B) leave as-is; C) raise `--test-concurrency` |
| **Impact** | A makes `npm test` fast (<~1 min) with `test:slow` run in CI; B keeps ~14 min; C limited gain + flakiness risk |
| **Risk** | A: low (no tests removed, coverage preserved by running both); C: medium (shared SQLite/table fixtures) |
| **Recommendation** | A |
| **Expected outcome** | fast inner loop; full coverage retained across both jobs |

### D3 — reconcileWithRules conflict extension
| | |
|---|---|
| **Alternatives** | A) implement §2 design (CONTRADICTION/REJECT + WEAKENING/review); B) leave as-is |
| **Impact** | A flags `SHOULD_NOT`/`NOT_REQUIRED`/`MAY` weakening of binding/recommended rules; B keeps the current MUST↔MUST_NOT-only detection |
| **Risk** | A: low (additive fields + one new `proposedAction` value), but changes disposition semantics → needs owner sign-off; B: silent weakening of binding rules goes unflagged |
| **Recommendation** | A, after owner approval of the §2 semantics |
| **Expected outcome** | precise conflict typing without conflating the three negative forces |

### D-BUDGET — context-budget margin
| | |
|---|---|
| **Alternatives** | A) accept the 4996/5000 margin and rely on `check_context_health.mjs`; B) consolidate `INDEX.md` links for headroom |
| **Impact** | A keeps all governing content; B frees tokens but reduces navigation density |
| **Risk** | A: future bootstrap additions may trip the warning (not a failure); B: could reduce discoverability |
| **Recommendation** | A now; B only if the guard starts failing |
| **Expected outcome** | commitments preserved; margin monitored |

---

## 6. Preserved State (المحافظة على الحالة)

- **POST routes:** all 6 dead mutation handlers left untouched; all 6 preview handlers left as-is. No route activated.
- **PowerShell files:** `setup/start/stop/verify.ps1` not added to Git, not deleted, not modified.
- **Git:** nothing committed, nothing pushed; working tree left in the same uncommitted state. No merge/release.

---

## 7. Separation of AAPES vs Corrective Changes (فصل التغييرات)

| Change | Directive | File(s) | Nature |
|---|---|---|---|
| AAPES archive source re-point | prior corrective task (intake-closure regression) | `server/aapes-package.js` | points `AAPES_ZIP_PATH` to `docs/archive/governed_intake/…_da902a9c.zip` (identical SHA-256) |
| Classification fix + regression suite | current corrective directive | `server/intake.js`, `tests/classification.test.mjs` | negation-aware `classifyStatement` |
| Reconciliation | current directive | `docs/status/CURRENT.md`, `docs/governance/AFE_GOV_CORRECTIVE_ENGINEERING_REPORT.md` | test-count reconciliation |

The AAPES change is a **separate, prior** fix and is recorded distinctly; it is not part of the classification corrective scope.

---

## 8. Remaining Gaps (الفجوات المتبقية)

1. **D3 unimplemented** — `reconcileWithRules` still detects only `MUST ↔ MUST_NOT`; `SHOULD_NOT`/`NOT_REQUIRED`/`MAY` weakening is unflagged until owner approves §2.
2. **Runtime enforcement** — `request_custody.mjs` and `classifyStatement` remain *validator-level*; no PEP/PDP runtime interception (`DEC-009`), no live LLM qualification (`REQ-AFE-QUAL-008-LIVE`).
3. **Test suite runtime** — ~14 min full suite; split proposal (D-SLOW) pending owner decision.
4. **Untracked files** — 4 `.ps1` scripts + AAPES candidate dir + evidence sentinels remain untracked (D-PS1).
5. **Display styling** — `IntakeView` has no dedicated badge styles for the new force values (cosmetic).

---

### Honesty statement
This report separates *verification* from *acceptance*: nothing here constitutes owner approval, adoption, or activation. All decisions in Section 5 await the Sovereign Project Owner.
