// tools/ui-audit/capture-hostcompat.mjs — visual verification of the host-compat
// preview flow (AR + EN). Uses a temp project and a mocked candidate list; the
// preview endpoint and all file access are real and read-only.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.UI_BASE || "http://127.0.0.1:5180";
const OUT = path.join("docs", "evidence", "ui-modernization", "hostcompat");
const exe = process.env.PLAYWRIGHT_CHROMIUM || undefined;
fs.mkdirSync(OUT, { recursive: true });

// Temp target project with both tool markers (read-only for the preview).
const project = fs.mkdtempSync(path.join(os.tmpdir(), "aghr-hostcompat-ui-"));
fs.mkdirSync(path.join(project, ".claude", "agents"), { recursive: true });
fs.mkdirSync(path.join(project, ".cursor", "rules"), { recursive: true });
const candidate = {
  id: "candidate-temp",
  name: "temp-hostcompat-project",
  dir: project.replace(/\\/g, "/"),
  governanceState: "NOT_ADOPTED",
  detectedStack: ["Node.js"],
  hasAgentsMd: false,
};

const browser = await chromium.launch({ executablePath: exe });
const results = [];

for (const locale of ["ar", "en"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  await ctx.addInitScript((loc) => {
    try { localStorage.setItem("aghr.locale", loc); } catch {}
  }, locale);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));

  await page.route("**/api/adoption/candidates", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ candidates: [candidate] }) })
  );

  await page.goto(`${BASE}/?mode=adoption`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(".hostcompat-panel", { timeout: 30000 });
  await page.waitForSelector(".hostcompat-tool", { timeout: 15000 });
  await page.waitForTimeout(1200);

  // First tool card (Claude Code) → first supported preview button (Agent definition).
  await page.locator(".hostcompat-tool").first().locator(".hostcompat-actions .btn").first().click();
  await page.waitForSelector(".hostcompat-preview", { timeout: 15000 });
  await page.waitForTimeout(700);

  const body = await page.locator(".hostcompat-preview").innerText();
  const dest = await page.locator(".hostcompat-preview code").first().innerText().catch(() => "");
  await page.locator(".hostcompat-preview").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `adoption-hostcompat-${locale}.png`), fullPage: true });
  await page.locator(".hostcompat-preview").screenshot({ path: path.join(OUT, `adoption-hostcompat-preview-${locale}.png`) });

  results.push({ locale, destination: dest.trim(), hasPartial: /PARTIAL/.test(body), hasPreviewNote: /Preview only|معاينة فقط/.test(body), errors });
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "hostcompat-ui.json"), JSON.stringify({ project, results }, null, 2));
console.log(JSON.stringify({ project, results }, null, 2));
