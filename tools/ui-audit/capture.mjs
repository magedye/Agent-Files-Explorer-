// tools/ui-audit/capture.mjs
// Captures the Studio UI at multiple viewports/modes for the UI modernization
// audit. Usage: node tools/ui-audit/capture.mjs --label before|after
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.UI_BASE || "http://127.0.0.1:5180";
const labelArg = process.argv.indexOf("--label");
const LABEL = labelArg > -1 ? process.argv[labelArg + 1] : "before";
const SCHEME = process.env.UI_SCHEME || "light";
const OUT = path.join("docs", "evidence", "ui-modernization", LABEL + (SCHEME === "dark" ? "-dark" : ""));

const MODES = ["explorer", "reference", "intake", "adoption", "evaluation", "staging"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

fs.mkdirSync(OUT, { recursive: true });
// Playwright's bundled-browser cache may be slightly older than the package's
// expected build; allow an explicit executable override.
const exe = process.env.PLAYWRIGHT_CHROMIUM || undefined;
const browser = await chromium.launch({ executablePath: exe });
const results = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: SCHEME });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message.slice(0, 300)));

  for (const mode of MODES) {
    const errsBefore = consoleErrors.length;
    try {
      await page.goto(`${BASE}/?mode=${mode}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForSelector(".app", { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2500);
    } catch (e) {
      consoleErrors.push(`nav ${mode}: ${String(e).slice(0, 200)}`);
    }
    const file = path.join(OUT, `${vp.name}-${mode}.png`);
    await page.screenshot({ path: file, fullPage: false }).catch(() => {});
    results.push({ viewport: vp.name, mode, file, errors: consoleErrors.slice(errsBefore) });
  }
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "capture.json"), JSON.stringify(results, null, 2));
console.log(`captured ${results.length} screenshots -> ${OUT}`);
