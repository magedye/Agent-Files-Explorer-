import fs from "node:fs";
import path from "node:path";

const msg = fs.readFileSync("src/i18n/messages.js", "utf8");
const defined = new Set([...msg.matchAll(/^\s*"([A-Za-z0-9_.]+)":\s*\{/gm)].map((m) => m[1]));

const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") walk(p);
    } else if (/\.(jsx|js)$/.test(e.name)) {
      files.push(p);
    }
  }
}
walk("src");

const used = new Map();
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  for (const m of txt.matchAll(/\bt\(\s*["']([A-Za-z0-9_.]+)["']/g)) {
    if (!used.has(m[1])) used.set(m[1], new Set());
    used.get(m[1]).add(f);
  }
}

const missing = [...used.keys()].filter((k) => !defined.has(k)).sort();
console.log("defined keys:", defined.size);
console.log("used keys:", used.size);
console.log("MISSING (" + missing.length + "):");
for (const k of missing) console.log("  " + k + "  <- " + [...used.get(k)].join(", "));
