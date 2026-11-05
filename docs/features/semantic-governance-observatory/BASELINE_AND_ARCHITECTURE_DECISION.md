# AGHR-QLE-GOV-OBS-001: Baseline & Architectural Decision Record

## 1. Context and Objective
Under directive **AGHR-QLE-GOV-OBS-001 v1.0.0**, the AGHR Governance Studio was extended to incorporate a general-purpose **Semantic Governance Observatory (SGO)** featuring a qualification and review profile for **LISAN / QLE**.

The primary objective was to implement an integrated, evidence-grounded governance environment inside the canonical AGHR Studio web interface without rebuilding or replacing the accepted AGHR v1.0.0 baseline or modifying locked engine components.

---

## 2. Architectural Boundaries & Core Invariants

### 2.1 Immutable Baseline Preservation
- **AGHR rc.3 Engine**: Pinned Python engine binaries, virtual environment (`temp/aghr-e1a-20261022-01/venv/Scripts/python.exe`), and SHA-256 pinned hashes remain strictly untouched.
- **Accepted Release Evidence**: All historical sign-off records (`docs/evidence/studio-signoff-2026-10-26/OWNER_SIGNOFF_AR.md`) and contract locks remain preserved.
- **AAPES v2.1 Status**: Retained as an independent review candidate (`isDefault: false`), never promoted silently to normative authority.
- **LISAN / QLE Corpus & Engine Separation**: The core Quranic linguistics corpus, root databases, and LISAN production engine are separate and unmodified.

### 2.2 Extension Architecture
Rather than creating an isolated application or alternate authority, SGO was integrated directly into the canonical AGHR Studio architecture:
1. **Unified Runtime Integration (`server/studio/unified-runtime.mjs`)**:
   - Registered `/api/v1/sgo/*` route dispatcher through `handleSgoApi`.
   - Wired `sgoWorkspace` into `GET /api/v1/workspaces` under extended view header (`X-Studio-View: extended`).
2. **Canonical Authentication & Authorization**:
   - Reuses `studio.authority.authenticate(req)` for token-based session validation.
   - Non-normative operations (draft recording, query, simulation) permitted under operator role.
   - Normative modifications require sovereign owner credentials, failing closed (`BLOCKED_UNPROVISIONED_OWNER_AUTH`) in the absence of hardware/cryptographic enrollment.
3. **Studio Web Interface (`src/features/sgo/SgoStudio.jsx`)**:
   - Seamlessly accessible as screen `sgo` (`مرصد الحوكمة الدلالي (QLE) / Semantic Governance Observatory`).
   - Provides a comprehensive bilingual (Arabic/English), RTL/LTR-compliant 6-tab interface.

---

## 3. Data Lineage: 423 vs 451 Items Reconciliation

An essential architectural invariant of this integration is the distinction between the **423 baseline items** and the **451 items** seen in certain external workbooks:
- **Compiled Baseline (423 Items)**:
  - `SOURCE_255` (255 items): Authoritative baseline rules and specifications.
  - `V4` (110 items): Proposed candidate optimizations and reformulations.
  - `V2` (58 items): Historical baseline lineage rules.
  - Total: `255 + 110 + 58 = 423`.
- **451 Review Snapshot**:
  - Contains the 423 baseline items plus 28 experimental / proposed items not part of the compiled canonical dataset.
  - The SGO strictly preserves the 423 compiled records while providing traceability and lineage back to all source worksheets.

---

## 4. Test Invariant: 2,240 Designed Tests

- **Zero Test Fabrication**: Across all 423 items, exactly 2,240 test cases were designed and recorded in technical evaluation spreadsheets.
- **Invariant**: None of these 2,240 tests have been executed in live runtimes. They carry the immutable status `DESIGNED_NOT_RUN` with 0 passes and 0 failures.
- SGO strictly prevents the fabrication of test runs, synthetic oracle passes, or premature qualification claims.
