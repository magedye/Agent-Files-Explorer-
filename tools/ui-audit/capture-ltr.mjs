// tools/ui-audit/capture-ltr.mjs — verify English/LTR rendering.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.UI_BASE || "http://127.0.0.1:5180";
const OUT = process.env.UI_OUT || path.join("docs", "evidence", "ui-modernization", "after-ltr");
const exe = process.env.PLAYWRIGHT_CHROMIUM || undefined;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
await ctx.addInitScript(() => { try { localStorage.setItem("aghr.locale", "en"); } catch {} });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));

for (const mode of ["explorer", "reference", "intake", "evaluation"]) {
  await page.goto(`${BASE}/?mode=${mode}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(OUT, `desktop-${mode}-en.png`) });
}
await browser.close();
fs.writeFileSync(path.join(OUT, "console.json"), JSON.stringify(errors, null, 2));
console.log("ltr captured; console errors:", errors.length);
