# AGHR-QLE-GOV-OBS-001: Microsoft Edge Headless UI Validation Evidence

## 1. Test Harness & Environment
- **Browser Binary**: Microsoft Edge (Channel: `msedge`, Version: `156.0.4314.58`)
- **Automation Driver**: Playwright `@playwright/test` v1.64.1
- **Platform**: Windows 11 (64-bit native)
- **Studio Runtime**: Port 5183 (local unified runtime)
- **Test File**: `tests/sgo_browser.spec.mjs`
- **Execution Date**: 2026-11-05
- **Execution Status**: `PASS` (Duration: ~24.98s)

---

## 2. Automated Journey & Verified Elements

The automated Playwright test executed the complete user journey across all 6 tabs of the SGO interface:

1. **Authentication Flow**:
   - Loaded `http://127.0.0.1:<port>/studio.html`.
   - Filled the server-minted ephemeral session token into `#studio-token`.
   - Clicked "اتصال" (Connect) and waited for the authenticated `.studio-layout`.

2. **Navigation to SGO Screen**:
   - Located and clicked `[data-testid="screen-sgo"]`.
   - Verified that `[data-testid="view-sgo"]` rendered with title `مرصد الحوكمة الدلالي (QLE)`.
   - Verified KPI summary card displays:
     - Total Items: `423`
     - Priority Decision Groups: `11`
     - Designed Tests: `2,240 (DESIGNED_NOT_RUN)`
     - Active Approvals: `0 (Preserved)`

3. **Tab 1 — Owner Review Workbench**:
   - Clicked `[data-testid="sgo-tab-workbench"]`.
   - Verified that exactly 11 priority decision group cards rendered (`[data-testid^="decision-group-"]`).
   - Verified items table renders rows with origin badges (`V4`, `SOURCE_255`, `V2`).

4. **Tab 2 — Semantic Cluster Map**:
   - Clicked `[data-testid="sgo-tab-clusters"]`.
   - Verified that the Vis.js interactive graph container (`[data-testid="vis-network-container"]`) mounted successfully.
   - Tested relation filter and switched between Graph and Accessible Tabular view.

5. **Tab 3 — Co-Merge Lab**:
   - Clicked `[data-testid="sgo-tab-merge"]`.
   - Verified atomic obligation preservation matrix.
   - Confirmed automated gate alerts for dropped P0 obligations and force downgrades.

6. **Tab 4 — Impact Simulator**:
   - Clicked `[data-testid="sgo-tab-impact"]`.
   - Triggered `[data-testid="run-impact-btn"]`.
   - Verified reachability paths and confirmed invariant: zero fabricated test failures (`DESIGNED_NOT_RUN`).

7. **Tab 5 — Grounded Policy Chat**:
   - Clicked `[data-testid="sgo-tab-chat"]`.
   - Filled `QL4-A01` into `[data-testid="sgo-chat-input"]` and clicked `[data-testid="sgo-chat-submit-btn"]`.
   - Verified that response bubble returned `حالة الاستقصاء: EVIDENCE_FOUND` with verified source citations.

8. **Tab 6 — Decision Ledger & Governed Exports**:
   - Clicked `[data-testid="sgo-tab-ledger"]`.
   - Clicked `[data-testid="verify-chain-btn"]`.
   - Verified that the hash chain verification badge showed `السلسلة متصلة وسليمة`.
   - Captured full-page visual screenshot.

---

## 3. Visual Screenshot Evidence
- **Path**: `docs/evidence/sgo-edge-ui-2026-11-05/sgo_studio_verified.png`
- **File Size**: 44,964 bytes
- **Integrity**: Full-page rendered screenshot captured in Microsoft Edge headless mode verifying UI layout, Arabic typography, and tab components.
