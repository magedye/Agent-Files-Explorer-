# UI_IMPLEMENTATION_MATRIX — AGHR Governance Studio

Legend: **REDESIGNED** = rebuilt on the design system; **RESTYLED** = existing markup styled by the new system; **TOKENISED** = hardcoded colours replaced with theme tokens; **DEFERRED** = documented, not changed in this pass.

| # | Surface / component | File(s) | Status | Notes |
|---|---|---|---|---|
| 1 | App shell — top bar + nav rail | `src/App.jsx` | REDESIGNED | Vertical nav rail (6 modes), language/back/theme controls, brand mark, `aria-current`, responsive rail |
| 2 | Design system | `src/index.css` | REDESIGNED | Tokens, light/dark, components, responsive, reduced-motion |
| 3 | i18n catalog | `src/i18n/messages.js` | REDESIGNED | Added 20 missing keys + 7 nav labels; ar/en verified |
| 4 | Reference manager | `src/components/ReferenceManager.jsx` | REDESIGNED | Inline dark styles removed; class-based cards/inspector/compare/modal; empty + skeleton states |
| 5 | Intake | `src/components/IntakeView.jsx` | TOKENISED | Dark inline colours → theme tokens; raw keys now translated |
| 6 | Evaluation | `src/components/EvaluationView.jsx` | TOKENISED + CSS | Theme tokens applied; missing `.eval-*`/`.history-*`/`.empty-*` classes added |
| 7 | Adoption | `src/components/AdoptionView.jsx` | RESTYLED | Already class-based; styled by the new system |
| 8 | Staging & Apply | `src/components/StagingView.jsx` | RESTYLED | Already class-based; styled by the new system |
| 9 | File tree | `src/components/FileTree.jsx` | RESTYLED | `.tree-*` classes |
| 10 | File preview | `src/components/FileView.jsx` | RESTYLED | `.file-*`, `.md-body`, `.code-body` |
| 11 | Relationship graph | `src/components/GraphView.jsx` | RESTYLED | `.graph-*`; vis-network colours are computed values (not token-bound) |
| 12 | Flow diagram | `src/components/FlowView.jsx` | RESTYLED | `.flow-*` |
| 13 | Favicon | `index.html` | FIXED | Inline SVG favicon added (removes `/favicon.ico` 404) |
| 14 | StudioApp shell | `src/features/studio/StudioApp.jsx` | PARTIAL | Separate `studio.html` app; own stylesheet; not fully re-themed |
| 15 | SGO studio | `src/features/sgo/SgoStudio.jsx` | DEFERRED | 213 inline styles / 194 hex; needs a dedicated tokenisation pass |
| 16 | AAPES studio | `src/features/aapes/AapesStudio.jsx` | TOKENISED | Slate palette mapped to tokens |

## Refinement 002 (Linear-inspired pass)

| Surface | Change | Status |
|---|---|---|
| Global | Denser rhythm, compact banners, status colours | REFINED |
| Intake | Form dominant when empty | REFINED |
| Adoption | Candidates empty state; options gated on selection | REFINED |
| Evaluation | Collapsible raw output; verification-boundary highlight | REFINED |
| Staging | Clear empty state | REFINED |
| Flow | No-`SKILL.md` explanation + jump to graph | REFINED |
| Graph | Focus-selected mode + relation counts | REFINED |
| AAPES matrix | Search + data-derived summary + collapsible evidence | REFINED |
| SgoStudio | — | DEFERRED (unchanged) |

## Functional preservation
- All six modes, the explorer tree/preview/graph/flow tabs, file loading, history/back, theme and language switching are unchanged in behaviour.
- No server logic, routes, policies, references, or permissions were modified. Only `src/` UI files, `src/index.css`, `src/i18n/messages.js`, `index.html`, and the audit scripts under `tools/ui-audit/`.

## Test coverage impact
- `tests/i18n.test.mjs` — 4/4 (catalog integrity, direction, storage, interpolation).
- Full `npm test` — see `UI_VERIFICATION_REPORT.md`.
