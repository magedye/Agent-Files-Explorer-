# UI_AS_IS_AUDIT — AGHR Governance Studio

**Scope:** the React interface (`index.html` → `src/App.jsx`) and the separate StudioApp surface (`studio.html` → `src/features/studio/StudioApp.jsx`).
**Method:** source review + real Chromium rendering (Playwright) at 1440/1024/768/390 px, light and dark, plus an English/LTR pass.
**Evidence:** `docs/evidence/ui-modernization/before/` (24 screenshots), `after/`, `after-dark/`, `after-ltr/`.

## 1. Page & mode inventory

| Surface | Route | Status |
|---|---|---|
| Explorer (file preview) | `?mode=explorer` | implemented |
| Explorer (relationship graph) | `?mode=explorer&tab=graph` | implemented (vis-network) |
| Explorer (flow diagram) | `?mode=explorer&tab=flow` | implemented |
| Reference manager | `?mode=reference` | implemented (rules/sources/adapters/compare + AAPES matrix modal) |
| Intake / ChangePackets | `?mode=intake` | implemented |
| Project Adoption | `?mode=adoption` | implemented |
| Evaluation & Evidence | `?mode=evaluation` | implemented (standard + AAPES readiness tabs) |
| Staging & Apply | `?mode=staging` | implemented |
| StudioApp screens | `studio.html` | separate app (SGO/AAPES/instructions/verification/draft) |

## 2. Component inventory

`App.jsx` shell, `FileTree`, `FileView`, `GraphView`, `FlowView`, `ReferenceManager`, `IntakeView`, `AdoptionView`, `EvaluationView`, `StagingView`, `i18n/I18nProvider`, `i18n/messages`.

## 3. Issues found (severity)

### Critical — broken in light mode
1. **Reference manager hardcoded dark palette.** `ReferenceManager.jsx` used **101 inline styles and 102 hardcoded hex colours** (`#0f172a`, `#94a3b8`, `#f8fafc`, …), producing white text on a light grey background and ignoring the theme entirely. (Seen in `before/desktop-reference.png`.)
2. **Evaluation manager partial dark palette.** 52 inline styles / 52 hardcoded hex colours; layout classes (`.eval-card`, `.eval-header`, `.eval-meta-grid`, …) were absent from the stylesheet, so the detail block collapsed and the `PASS` badge overlapped the run id.

### High — missing translations (raw keys rendered)
3. **20 i18n keys missing** from `messages.js`, so raw keys appeared in the UI:
   `intake.emptyText`, `intake.toolBoundary`, `intake.authorLabel`, `intake.sourceLabel`, `intake.itemsHeading`, `intake.conflictDetected`, `intake.proposedAction`, `intake.stageButton`, `intake.submitting`, `reference.searchRules`, `reference.ruleStatement`, `reference.enforcementCoverage`, `reference.compareHeading`, `reference.default`, `reference.adapters`, `reference.rulesAdded`, `reference.rulesModified`, `reference.rulesRemoved`, `evaluation.targetPackage`, `evaluation.testRunner`.

### Medium — design & navigation
4. **Horizontal mode navigation** crowded into the top bar (RTL wrap), no persistent sidebar; icons were emoji mixed into label strings.
5. **Inconsistent styling systems:** class-based (Explorer) vs hardcoded inline dark (Reference/Intake/Evaluation) → the two halves of the app looked like different products.
6. **Duplicate `.btn` definition** in the old stylesheet; ad-hoc pixel values and raw colours throughout.
7. **Emoji-as-icons** (`🏛️`, etc.) and an oversized header without a clear page hierarchy.
8. **No favicon** → a `/favicon.ico` 404 in the console.
9. **Intake** had 30 inline styles / 44 hex colours and empty-state raw keys.
10. **Narrow content columns** on Reference (grid stayed 2-up even with no selection).

### Low — deferred surfaces
11. **StudioApp** (`studio.html`): `SgoStudio` 213 inline styles / 194 hex colours; `AapesStudio` 58 / 30. These are a separate sub-studio and were only partially tokenised in this pass.

## 4. Baseline evidence
- 24 "before" screenshots across 6 modes × 4 viewports.
- Console baseline: one benign 404 (`/favicon.ico`).
