# AGHR-QLE-GOV-OBS-001: Windows Native Runbook

## 1. Prerequisites & Environment Setup
This runbook provides native Windows (PowerShell / `pwsh`) instructions for running and verifying the Semantic Governance Observatory within the AGHR Governance Studio:

- **Operating System**: Windows 10 / 11 (64-bit)
- **Node.js**: v20+ / v22+ / v24+
- **Python**: Pinned virtual environment at `temp\aghr-e1a-20261022-01\venv\Scripts\python.exe`
- **Shell**: PowerShell (`pwsh`)

---

## 2. Frontend Build
Before launching the Studio web interface, compile the Vite production bundle:

```powershell
# In the repository root: D:\APP\Agent-Files-Explorer
npm run build
```

Verify that `dist/studio.html` and assets under `dist/assets/` are generated.

---

## 3. Launching the Canonical Studio Runtime

Launch the unified Studio runtime on the approved port `5183`:

```powershell
node server/studio/serve-studio.mjs --python=temp/aghr-e1a-20261022-01/venv/Scripts/python.exe --port=5183
```

**Expected Console Output**:
```text
AGHR Governance Studio: http://127.0.0.1:5183
X-Studio-Token (ephemeral; do not save): <64-character-token>
Operator commands: list | attest <validate-intent-id> | approve <intent-id> | revoke <intent-id> | quit
```

---

## 4. Accessing the SGO Interface

1. Open your browser (Microsoft Edge or Chrome) and navigate to:
   ```text
   http://127.0.0.1:5183/studio.html
   ```
2. Enter the ephemeral session token printed in the console into the **رمز الجلسة (Session credential)** input.
3. Click **اتصال (Connect)**.
4. In the left navigation menu, click screen **18: مرصد الحوكمة الدلالي (QLE) / Semantic Governance Observatory**.
5. Explore the 6 tabs:
   - **طاولة استعراض المالك**: Review the 11 Priority Groups and 423 items.
   - **خريطة التجميع الدلالي**: View the Vis.js interactive graph of 606 relations.
   - **مختبر الدمج المشترك**: Inspect atomic obligation matrices and safe merge gates.
   - **محاكي الأثر**: Test reachability paths with zero fabricated test failures.
   - **المحادثة المرجعية**: Inquire about rules with cited offline evidence.
   - **سجل القرارات والتصدير**: Verify the SHA-256 hash chain and download governed export files.

---

## 5. Automated Local Verification Suites

### 5.1 Run SGO Integration Tests (AC-01 to AC-43)
```powershell
node --test tests/sgo_integration.test.mjs
```

### 5.2 Run Microsoft Edge Headless UI Validation
```powershell
node --test tests/sgo_browser.spec.mjs
```

### 5.3 Run Full AGHR Baseline Regression Suite
```powershell
npm test
```

### 5.4 Run Studio Canonical API & Schema Tests
```powershell
npm run test:studio-api
```

### 5.5 Verify Context Health & Token Budgets
```powershell
node tools/check_context_health.mjs
```
