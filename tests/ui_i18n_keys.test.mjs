// Regression guard: every t("…") key referenced in src/ must exist in the
// messages catalog, so raw keys can never render in the UI again.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("UI i18n: every t() key used in src exists in the messages catalog", () => {
  const msg = fs.readFileSync("src/i18n/messages.js", "utf8");
  const defined = new Set([...msg.matchAll(/^\s*"([A-Za-z0-9_.]+)":\s*\{/gm)].map((m) => m[1]));

  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(jsx|js)$/.test(e.name)) files.push(p);
    }
  };
  walk("src");

  const missing = [];
  for (const f of files) {
    const txt = fs.readFileSync(f, "utf8");
    for (const m of txt.matchAll(/\bt\(\s*["']([A-Za-z0-9_.]+)["']/g)) {
      if (!defined.has(m[1])) missing.push(`${m[1]} (${f})`);
    }
  }

  assert.deepEqual([...new Set(missing)].sort(), [], `missing i18n keys: ${missing.join(", ")}`);
});
