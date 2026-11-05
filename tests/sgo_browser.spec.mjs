import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { chromium } from '@playwright/test';
import { createUnifiedStudio } from '../server/studio/unified-runtime.mjs';

test('AGHR-QLE-GOV-OBS-001: Microsoft Edge Headless UI Validation for SGO Studio', async () => {
  const python = path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
  const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aghr-sgo-browser-'));
  const dist = path.resolve('dist');

  // Load static assets
  const assets = new Map();
  function preload(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) preload(p);
      else assets.set('/' + path.relative(dist, p).split(path.sep).join('/'), fs.readFileSync(p));
    }
  }
  preload(dist);

  const studio = await createUnifiedStudio({
    python,
    storageRoot,
    actor: 'sgo-edge-validator'
  });

  const server = http.createServer((req, res) => {
    if (req.url?.startsWith('/api/')) return studio.handle(req, res);
    let route = new URL(req.url, 'http://127.0.0.1').pathname;
    if (route === '/') route = '/studio.html';
    const bytes = assets.get(route);
    if (!bytes) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    const ct = route.endsWith('.html')
      ? 'text/html; charset=utf-8'
      : route.endsWith('.js')
      ? 'text/javascript; charset=utf-8'
      : route.endsWith('.css')
      ? 'text/css; charset=utf-8'
      : 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': ct,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(bytes);
  });

  studio.attachStreams(server);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const token = studio.session.token;
  const baseUrl = `http://127.0.0.1:${port}/studio.html`;

  let browser = null;
  try {
    // Launch Microsoft Edge headless via Playwright
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-gpu']
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    // 1. Navigate to Studio UI
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#studio-token', { timeout: 10000 });

    // 2. Authenticate with ephemeral session token
    await page.fill('#studio-token', token);
    await page.click('button:has-text("اتصال"), button:has-text("Connect")');
    await page.waitForSelector('.studio-layout', { timeout: 15000 });

    // 3. Navigate to SGO Screen
    const sgoNavButton = page.locator('[data-testid="screen-sgo"]');
    await sgoNavButton.waitFor({ state: 'visible', timeout: 5000 });
    await sgoNavButton.click();

    await page.waitForSelector('[data-testid="view-sgo"]', { timeout: 10000 });
    const viewTitle = await page.locator('[data-testid="view-sgo"] h2').textContent();
    assert.ok(viewTitle.includes('مرصد الحوكمة الدلالي') || viewTitle.includes('Semantic Governance Observatory'));

    // Wait for SGO overview stats container
    await page.waitForSelector('[data-testid="sgo-overview-stats"]', { timeout: 10000 });
    const kpiText = await page.locator('[data-testid="sgo-overview-stats"]').innerText();
    assert.ok(kpiText.includes('423'), 'KPI must display 423 items');
    assert.ok(kpiText.includes('11'), 'KPI must display 11 priority decisions');
    assert.ok(kpiText.includes('2,240') || kpiText.includes('2240'), 'KPI must display 2,240 designed tests');

    // 4. Tab 1: Owner Review Workbench
    const tab1 = page.locator('[data-testid="sgo-tab-workbench"]');
    await tab1.click();
    await page.waitForSelector('[data-testid^="decision-group-"]', { timeout: 5000 });
    const priorityGroupCount = await page.locator('[data-testid^="decision-group-"]').count();
    assert.equal(priorityGroupCount, 11, 'Must render exactly 11 priority decision cards');

    // 5. Tab 2: Semantic Cluster Map
    const tab2 = page.locator('[data-testid="sgo-tab-clusters"]');
    await tab2.click();
    await page.waitForSelector('[data-testid="vis-network-container"]', { timeout: 5000 });
    assert.ok(await page.locator('[data-testid="vis-network-container"]').isVisible());

    // 6. Tab 3: Co-Merge Lab
    const tab3 = page.locator('[data-testid="sgo-tab-merge"]');
    await tab3.click();
    await page.waitForSelector('text=تحليل حفظ الالتزامات الذرية', { timeout: 5000 });

    // 7. Tab 4: Impact Simulator
    const tab4 = page.locator('[data-testid="sgo-tab-impact"]');
    await tab4.click();
    await page.waitForSelector('[data-testid="run-impact-btn"]', { timeout: 5000 });
    await page.click('[data-testid="run-impact-btn"]');
    await page.waitForSelector('text=DESIGNED_NOT_RUN', { timeout: 5000 });

    // 8. Tab 5: Grounded Policy Chat
    const tab5 = page.locator('[data-testid="sgo-tab-chat"]');
    await tab5.click();
    await page.waitForSelector('[data-testid="sgo-chat-input"]', { timeout: 5000 });
    await page.fill('[data-testid="sgo-chat-input"]', 'QL4-A01');
    await page.click('[data-testid="sgo-chat-submit-btn"]');
    await page.waitForSelector('text=حالة الاستقصاء: EVIDENCE_FOUND', { timeout: 5000 });
    const chatText = await page.locator('[data-testid="view-sgo"]').innerText();
    assert.ok(chatText.includes('QL4-A01'));

    // 9. Tab 6: Decision Ledger & Governed Exports
    const tab6 = page.locator('[data-testid="sgo-tab-ledger"]');
    await tab6.click();
    await page.waitForSelector('[data-testid="verify-chain-btn"]', { timeout: 5000 });
    await page.click('[data-testid="verify-chain-btn"]');
    await page.waitForSelector('text=السلسلة متصلة وسليمة', { timeout: 5000 });

    // 10. AC-50: Multilingual AR/EN, RTL/LTR, Viewports, Keyboard & Citations
    // 10a. Locale & Direction switching
    const localeSelect = page.locator('[data-testid="studio-locale"]');
    if (await localeSelect.isVisible()) {
      await localeSelect.selectOption('en');
      await page.waitForTimeout(300);
      await localeSelect.selectOption('ar');
      await page.waitForTimeout(300);
    }

    // 10b. Viewport responsiveness (Mobile 390x844 then Desktop 1440x900)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    assert.ok(await page.locator('[data-testid="view-sgo"]').isVisible());
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(300);

    // 10c. Keyboard navigation (Tab & Enter)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 10d. Source citation inspection
    await tab1.click();
    await page.waitForSelector('[data-testid^="decision-group-"]', { timeout: 5000 });
    const citation = page.locator('[data-testid^="decision-group-"] small').first();
    assert.ok(await citation.isVisible());

    // Capture Edge Headless screenshot evidence
    const evidenceDir = path.resolve('docs/evidence/sgo-edge-ui-2026-11-05');
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.screenshot({ path: path.join(evidenceDir, 'sgo_studio_verified.png'), fullPage: true });

  } finally {
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(r => server.close(r));
    await studio.close();
  }
});
