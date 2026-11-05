import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fork } from 'node:child_process';

test.use({
  browserName: 'chromium',
  channel: 'msedge',
  headless: true
});

let child, ready, origin;

test.beforeAll(async () => {
  const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'aghr-aapes-browser-'));
  const pythonPath = path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');

  child = fork(path.resolve('server/studio/serve-studio.mjs'), [
    '--port=0',
    '--python=' + pythonPath,
    '--storage-root=' + storage
  ], { silent: true });

  ready = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('STARTUP_TIMEOUT')), 60000);
    child.on('message', m => {
      if (m.event === 'ready') {
        clearTimeout(timer);
        resolve(m);
      }
    });
    child.on('error', reject);
    child.on('exit', code => reject(new Error('STARTUP_EXIT_' + code)));
  });

  origin = 'http://127.0.0.1:' + ready.port;
});

test.afterAll(async () => {
  if (child?.connected) {
    child.send('stop');
    await new Promise(resolve => {
      const timer = setTimeout(() => { child.kill(); resolve(); }, 10000);
      child.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
});

test('AAPES Studio UI: Complete 7-Step Navigation, Candidate Inspection, Policy Review, Assessment, and Matrix', async ({ page }) => {
  // Step 1: Open accepted Studio interface
  await page.goto(origin);
  await page.locator('#studio-token').fill(ready.token);
  await page.locator('.p0-login button').click();
  await expect(page.getByTestId('studio-project')).toBeVisible();

  // Step 2: Access AAPES screen in navigation
  await expect(page.getByTestId('screen-aapes')).toBeVisible();
  await page.getByTestId('screen-aapes').click();
  await expect(page.getByTestId('view-aapes')).toBeVisible();
  await expect(page.getByTestId('aapes-studio')).toBeVisible();

  // Step 3: Candidate Framework & 12 Domains inspection
  await expect(page.getByTestId('aapes-tab-framework')).toBeVisible();
  await expect(page.getByTestId('aapes-framework-tab')).toBeVisible();
  await expect(page.locator('text=D01')).toBeVisible();
  await expect(page.locator('text=D12')).toBeVisible();

  // Access candidate workspace from workspace selector
  await page.getByTestId('studio-project').selectOption('aapes-candidate');
  await page.getByTestId('screen-registry').click();
  await expect(page.getByTestId('registry')).toBeVisible();
  await expect(page.locator('tr[data-row-id="AAPES-REQ-001"]')).toBeVisible();
  await expect(page.locator('text=AAPES-REQ-001')).toBeVisible();

  // Inspect requirement detail
  await page.locator('tr[data-row-id="AAPES-REQ-001"] .p0-source-link').click();
  await expect(page.getByTestId('instruction-detail')).toBeVisible();
  await expect(page.getByTestId('instruction-detail')).toContainText('AAPES-REQ-001');

  // Step 4: Policy Review on AAPES tab
  await page.getByTestId('screen-aapes').click();
  await page.getByTestId('aapes-tab-review').click();
  await expect(page.getByTestId('aapes-review-tab')).toBeVisible();
  await page.getByTestId('aapes-run-review-btn').click();
  await expect(page.getByTestId('aapes-review-output')).toBeVisible();
  await expect(page.getByTestId('aapes-review-output')).toContainText('Unified Diff');
  await expect(page.getByTestId('aapes-create-draft-btn')).toBeVisible();

  // Step 5: Risk-Weighted Readiness Assessment
  await page.getByTestId('aapes-tab-assessment').click();
  await expect(page.getByTestId('aapes-assessment-tab')).toBeVisible();
  await page.getByRole('button', { name: /High Score \+ Failed Gate|درجة عالية \+ فشل بوابة/ }).click();
  await page.getByTestId('aapes-evaluate-assessment-btn').click();
  await expect(page.getByTestId('aapes-assessment-output')).toBeVisible();
  await expect(page.getByTestId('aapes-assessment-output')).toContainText('BLOCKED');

  // Step 6: Compatibility Matrix with 48 requirements
  await page.getByTestId('aapes-tab-matrix').click();
  await expect(page.getByTestId('aapes-matrix-tab')).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await expect(page.locator('text=AAPES-REQ-001').first()).toBeVisible();
  await expect(page.locator('tbody tr td:has-text("COVERED")').first()).toBeVisible();

  // Step 7: Deterministic Oracles
  await page.getByTestId('aapes-tab-oracles').click();
  await expect(page.getByTestId('aapes-oracles-tab')).toBeVisible();
  await page.getByTestId('aapes-run-oracles-btn').click();
  await expect(page.getByTestId('aapes-oracles-output')).toBeVisible();
  await expect(page.getByTestId('aapes-oracles-output')).toContainText('PASS');
});
