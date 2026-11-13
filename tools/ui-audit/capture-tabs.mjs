// tools/ui-audit/capture-tabs.mjs — graph + flow tabs.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.UI_BASE || "http://127.0.0.1:5180";
const OUT = path.join("docs", "evidence", "ui-modernization", "refinement-002");
const exe = process.env.PLAYWRIGHT_CHROMIUM || undefined;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));

for (const tab of ["graph", "flow"]) {
  await page.goto(`${BASE}/?mode=explorer&tab=${tab}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(4500);
  await page.screenshot({ path: path.join(OUT, `desktop-explorer-${tab}.png`) });
}

await browser.close();
fs.writeFileSync(path.join(OUT, "tabs-console.json"), JSON.stringify(errors, null, 2));
console.log("tabs captured; errors:", errors.length);
