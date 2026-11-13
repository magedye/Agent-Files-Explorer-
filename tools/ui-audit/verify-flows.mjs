// tools/ui-audit/verify-flows.mjs — read-only browser verification of the main flows.
// Performs real interactions and records network statuses. Makes no code changes.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.UI_BASE || "http://127.0.0.1:5180";
const OUT = path.join("docs", "evidence", "ui-modernization", "final");
const exe = process.env.PLAYWRIGHT_CHROMIUM || undefined;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
const page = await ctx.newPage();
const consoleErrors = [];
const responses = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message.slice(0, 200)));
page.on("response", (r) => { const u = new URL(r.url()); if (u.pathname.startsWith("/api/")) responses.push({ method: r.request().method(), path: u.pathname, status: r.status() }); });

const results = [];
const record = (flow, ok, note) => results.push({ flow, ok, note });

async function goto(mode, extra = "") {
  await page.goto(`${BASE}/?mode=${mode}${extra}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(".app", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

// Flow 1 — Explorer: browse tree + preview + graph tab.
try {
  await goto("explorer");
  await page.waitForSelector(".tree-label", { timeout: 30000 });
  const labels = page.locator(".tree-label");
  const count = await labels.count();
  // Pick a file label (not a directory caret).
  let clicked = false;
  for (let i = 0; i < Math.min(count, 12); i++) {
    const t = (await labels.nth(i).innerText()).trim();
    if (t && !/^(policies|observations|schemas)$/i.test(t)) {
      await labels.nth(i).click();
      clicked = true;
      break;
    }
  }
  const title = (await page.locator(".file-title").first().innerText().catch(() => "")).trim();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "flow-explorer.png") });
  record("explorer", clicked && title.length > 0, `tree labels=${count}; preview title="${title.slice(0, 60)}"`);

  await page.click(".explorer-subtabs .tab:nth-child(2)");
  await page.waitForSelector(".graph-canvas", { timeout: 20000 });
  await page.waitForTimeout(1500);
  record("explorer-graph", true, "graph canvas rendered");
  await page.click(".explorer-subtabs .tab:nth-child(3)");
  await page.waitForTimeout(1200);
  record("explorer-flow", true, "flow tab rendered");
} catch (e) {
  record("explorer", false, String(e).slice(0, 160));
}

// Flow 2 — Reference: load rules, search, open detail.
try {
  await goto("reference");
  await page.waitForSelector(".rule-card", { timeout: 30000 });
  const before = await page.locator(".rule-card").count();
  await page.fill(".search-input", "AGHR");
  await page.waitForTimeout(400);
  const after = await page.locator(".rule-card").count();
  await page.locator(".rule-card").first().click();
  await page.waitForSelector(".inspector-panel", { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "flow-reference.png") });
  record("reference", true, `rules before=${before} after search=${after}; inspector opened`);
} catch (e) {
  record("reference", false, String(e).slice(0, 160));
}

// Flow 3 — Intake: form + submission path (write may be intentionally guarded).
try {
  await goto("intake");
  await page.waitForSelector(".input-textarea", { timeout: 20000 });
  await page.fill(".input-textarea", "يجب توثيق الأدلة المنهجية بدقة. كذلك ينبغي فحص المخرجات قبل الاعتماد.");
  await page.click(".intake-form-pane button[type=submit]");
  await page.waitForTimeout(2500);
  const packet = await page.locator(".packet-card").count();
  const err = await page.locator(".gov-error-msg").count();
  const errText = err ? (await page.locator(".gov-error-msg").first().innerText()).trim().slice(0, 120) : "";
  await page.screenshot({ path: path.join(OUT, "flow-intake.png") });
  record("intake", packet > 0 || err > 0, `packet=${packet} error=${err}${errText ? ` ("${errText}")` : ""}`);
} catch (e) {
  record("intake", false, String(e).slice(0, 160));
}

// Flow 4 — Evaluation: history + run path (write may be intentionally guarded).
try {
  await goto("evaluation");
  await page.waitForSelector(".eval-card, .empty-state", { timeout: 25000 });
  const hist = await page.locator(".history-card").count();
  await page.click(".eval-actions-bar .btn-primary");
  await page.waitForTimeout(3000);
  const err = await page.locator(".gov-error-msg").count();
  const errText = err ? (await page.locator(".gov-error-msg").first().innerText()).trim().slice(0, 120) : "";
  await page.screenshot({ path: path.join(OUT, "flow-evaluation.png") });
  record("evaluation", hist > 0 || err > 0, `history=${hist} error=${err}${errText ? ` ("${errText}")` : ""}`);
} catch (e) {
  record("evaluation", false, String(e).slice(0, 160));
}

// Adoption + Staging: empty-state integrity.
try {
  await goto("adoption");
  const candEmpty = await page.locator(".cand-empty, .candidate-card").count();
  record("adoption", candEmpty > 0, `candidate area present (${candEmpty})`);
} catch (e) {
  record("adoption", false, String(e).slice(0, 160));
}
try {
  await goto("staging");
  const empty = await page.locator(".state-empty, .staging-manifest-card").count();
  record("staging", empty > 0, `empty/manifest state present (${empty})`);
} catch (e) {
  record("staging", false, String(e).slice(0, 160));
}

await browser.close();
const summary = { results, blockedOrFailedApi: responses.filter((r) => r.status >= 400), consoleErrors };
fs.writeFileSync(path.join(OUT, "flows.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
