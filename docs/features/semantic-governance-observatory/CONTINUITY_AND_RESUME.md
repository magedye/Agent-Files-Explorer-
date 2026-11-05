# AGHR-QLE-GOV-OBS-001: Session Continuity & Resume Guide

## 1. State Checkpoint
This document provides instructions for any future AI assistant session or human engineer to resume work on the Semantic Governance Observatory on branch `feat/aghr-qle-gov-obs-001`.

- **Current Git Branch**: `feat/aghr-qle-gov-obs-001`
- **Base Commit**: `5adb2bf3ae51a38039f012094a75d75168ba5827`
- **Current Milestone**: `AGHR-QLE-GOV-OBS-001 v1.0.0 COMPLETED`
- **Stop Status**: Stopped for Sovereign Owner Review (`AGHR_SGO_IMPLEMENTED_WITH_OWNER_AUTH_BLOCKER`).

---

## 2. Invariants that MUST NOT be Violated

1. **Do NOT Merge to `main`**: This feature branch remains local. Merging requires explicit sovereign owner review and approval.
2. **Do NOT Push to Remote**: Changes must remain local on the machine.
3. **Do NOT Modify Pinned AGHR rc.3 Engine**: Pinned Python binary at `temp/aghr-e1a-20261022-01/venv/Scripts/python.exe` and release evidence must remain intact.
4. **Do NOT Promote AAPES v2.1 or SGO Candidates**: `isDefault: false` must remain across all candidate references.
5. **Do NOT Fabricate Test Passes**: All 2,240 designed tests must strictly carry status `DESIGNED_NOT_RUN` with 0 passes and 0 failures.
6. **Protected Writes Must Fail Closed**: Protected owner decisions must return `403 BLOCKED_UNPROVISIONED_OWNER_AUTH` unless authentic sovereign owner hardware credentials are provided.

---

## 3. Key Source & Test Locations

- **SGO Backend Modules**: `server/studio/sgo/`
  - `sgo-store.mjs`: Core dataset store, draft decisions, tamper-evident hash chain.
  - `sgo-analyzer.mjs`: BCP 14 obligation preservation analyzer and static impact simulator.
  - `sgo-chat.mjs`: Evidence-grounded offline lexical search with Arabic normalization.
  - `sgo-export.mjs`: Governed export generator with CSV formula neutralization.
  - `sgo-routes.mjs`: Canonical `/api/v1/sgo/*` route dispatcher.
- **SGO Frontend**: `src/features/sgo/SgoStudio.jsx` (Screen 18 in `src/features/studio/StudioApp.jsx`).
- **Integration Tests**: `tests/sgo_integration.test.mjs` (11 test suites covering AC-01 to AC-43).
- **Edge Headless UI Automation**: `tests/sgo_browser.spec.mjs`.

---

## 4. How to Verify Everything Locally

```powershell
# 1. Build frontend
npm run build

# 2. Run SGO integration test
node --test tests/sgo_integration.test.mjs

# 3. Run Edge UI headless automation
node --test tests/sgo_browser.spec.mjs

# 4. Run baseline test suite
npm test

# 5. Check context health
node tools/check_context_health.mjs
```
