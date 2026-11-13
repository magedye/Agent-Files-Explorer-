# UI_REFINEMENT_002 — Linear-Inspired UX Refinement (Brief Report)

**Status:** `READY_FOR_OWNER_REVIEW` · **Basis:** `AFE-UI-MODERNIZATION` (don't rebuild; refine).
**Method:** CSS/tokens first, then the smallest JSX change where a functional/visual gap required it. No new UI library, no router, no main-nav rebuild, no new page components.

## 1. Improvements implemented (with rationale)

| # | Improvement | Why | Change type |
|---|---|---|---|
| 1 | Denser page rhythm: `.studio-full-pane` padding 24→16/24, `.md-body` line-height 1.85→1.75, max-width 860→900 | wasted whitespace / choppy reading | CSS |
| 2 | Compact governance banners (padding, 12.5px, tighter leading) | the same long constraint banner repeated on 4 pages dominated the fold | CSS |
| 3 | Intake: form becomes dominant (single centred column) when no result exists | the empty result pane stole half the width from the primary action | CSS + 2 class conditions |
| 4 | Adoption: explicit empty state for candidates; options hidden until a project is selected | the form asked for choices with nothing to adopt | JSX |
| 5 | Evaluation: raw output is now a collapsible `<details>`; `NOT_PERFORMED`/`NOT_GRANTED` highlighted (warning) | long technical output dominated; verification boundaries were visually flat | JSX + CSS |
| 6 | Staging: clearer empty state with icon + guidance | the empty page gave no next step | JSX + CSS |
| 7 | Flow: when no `SKILL.md`, show an explicit explanation + "Relationship graph" button | the old empty pane was a dead end | JSX + prop from App |
| 8 | Graph: "Focus selected file" mode (selected node + direct neighbours) + outgoing/incoming counts line | dense node/label overlap; no way to isolate a file's relations | library config + small JSX |
| 9 | AAPES matrix: search box, derived summary badges (covered/partial/total from data), collapsible evidence per row | fixed summary text and long evidence rows hurt usability | JSX + CSS |
| 10 | 7 new i18n keys (graph.focus, graph.selected, matrix.*) | new UI copy | data |

## 2. Files changed (this refinement)

| File | Nature |
|---|---|
| `src/index.css` | density, compact banner, status colours, new refinement classes |
| `src/components/IntakeView.jsx` | `form-dominant` class (2 tabs) |
| `src/components/AdoptionView.jsx` | candidates empty state; options conditional |
| `src/components/EvaluationView.jsx` | `<details>` output; `statusClass` + 4 spans |
| `src/components/StagingView.jsx` | empty state |
| `src/components/FlowView.jsx` | no-skill state + `onOpenGraph` |
| `src/components/GraphView.jsx` | focus mode + selected relation counts |
| `src/components/ReferenceManager.jsx` | matrix search + derived summary + row details |
| `src/App.jsx` | pass `onOpenGraph` to FlowView |
| `src/i18n/messages.js` | 7 keys |

## 3. Before → after (same data, same viewport)

| Intake (form dominance) | Evaluation (collapsible output + status) |
|---|---|
| ![before](../evidence/ui-modernization/after/desktop-intake.png) → ![after](../evidence/ui-modernization/refinement-002/desktop-intake.png) | ![before](../evidence/ui-modernization/after/desktop-evaluation.png) → ![after](../evidence/ui-modernization/refinement-002/desktop-evaluation.png) |

| Adoption (empty guidance) | AAPES matrix (search + derived + details) |
|---|---|
| ![before](../evidence/ui-modernization/after/desktop-adoption.png) → ![after](../evidence/ui-modernization/refinement-002/desktop-adoption.png) | ![after](../evidence/ui-modernization/refinement-002/desktop-reference-matrix.png) |

Graph focus + selected info: `refinement-002/desktop-explorer-graph.png` · Flow no-skill: `refinement-002/desktop-explorer-flow.png`.

## 4. Verification

| Check | Result |
|---|---|
| `npm run build` | ✅ success |
| `tests/i18n.test.mjs` + `tests/ui_i18n_keys.test.mjs` | ✅ 5/5 |
| Full `npm test` | ✅ 358/358, 0 failures, exit 0 (~1320s; see `%TEMP%\afe_ui_refine_tests.txt`) |
| Browser console | ✅ 0 errors (light; graph/flow/matrix captures) |
| Horizontal overflow / unnamed controls | ✅ 0/24 (6 modes × 4 viewports, `tools/ui-audit/audit-a11y.mjs`) |
| Light / Dark / RTL / LTR | verified |

## 5. Remaining gaps (need a larger effort)
1. **SgoStudio** (`studio.html`) still has ~213 inline styles — out of scope, documented.
2. **Graph label overlap** at high density is mitigated by focus mode, not eliminated; a label-LOD or clustering pass would need a dedicated change.
3. **vis-network palette** remains computed JS colours (theme-aware only through the `theme` prop).
4. **`npm test` runtime** remains subprocess-bound (~15–24 min); the D-SLOW split is still a separate owner decision.

## 6. Measured usability deltas (observable)
- Primary action on Intake now occupies the full content width when empty (was ~50%).
- Governance banner height reduced (smaller padding/leading) with no text removed.
- Evaluation technical output is one click away (collapsible) instead of always expanded.
- AAPES summary is now data-derived (43 covered / 5 partial / 48 total) and searchable.
- Graph can be reduced from the full network to a file's direct relations in one toggle.
