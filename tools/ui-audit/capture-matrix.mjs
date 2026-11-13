// tools/ui-audit/capture-matrix.mjs — open the AAPES matrix modal and capture it.
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

await page.goto(`${BASE}/?mode=reference`, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForSelector(".gov-package-bar .btn-secondary", { timeout: 20000 });
await page.click(".gov-package-bar .btn-secondary");
await page.waitForSelector(".modal-overlay .matrix-table", { timeout: 20000 });
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(OUT, "desktop-reference-matrix.png") });

await browser.close();
fs.writeFileSync(path.join(OUT, "matrix-console.json"), JSON.stringify(errors, null, 2));
console.log("matrix captured; errors:", errors.length);
