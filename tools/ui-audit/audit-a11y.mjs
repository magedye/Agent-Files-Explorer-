// tools/ui-audit/audit-a11y.mjs — horizontal-overflow + accessible-name checks.
import { chromium } from "@playwright/test";

const BASE = process.env.UI_BASE || "http://127.0.0.1:5180";
const exe = process.env.PLAYWRIGHT_CHROMIUM || undefined;
const MODES = ["explorer", "reference", "intake", "adoption", "evaluation", "staging"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch({ executablePath: exe });
const report = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: "light" });
  const page = await ctx.newPage();
  for (const mode of MODES) {
    await page.goto(`${BASE}/?mode=${mode}`, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const overflowX = de.scrollWidth - de.clientWidth;
      const els = [...document.querySelectorAll("button, a[href], input, select, textarea")];
      const unnamed = els.filter((el) => {
        const name = (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.getAttribute("placeholder") || "").trim();
        return name.length === 0;
      }).map((el) => el.tagName + "." + (el.className || "").toString().split(" ")[0]).slice(0, 8);
      return { overflowX, interactive: els.length, unnamed };
    });
    report.push({ viewport: vp.name, mode, ...r });
  }
  await ctx.close();
}
await browser.close();

const overflow = report.filter((r) => r.overflowX > 1);
const unnamed = report.filter((r) => r.unnamed.length > 0);
console.log(JSON.stringify({ checked: report.length, overflow, unnamed }, null, 2));
