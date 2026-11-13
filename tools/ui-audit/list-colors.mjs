import fs from "node:fs";
import path from "node:path";

const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx|js)$/.test(e.name)) files.push(p);
  }
}
walk("src");

const hex = new Map();
const rgba = new Map();
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  for (const m of txt.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
    hex.set(m[0].toLowerCase(), (hex.get(m[0].toLowerCase()) || 0) + 1);
  }
  for (const m of txt.matchAll(/rgba?\(\s*[0-9.,\s]+\)/g)) {
    rgba.set(m[0].replace(/\s+/g, ""), (rgba.get(m[0].replace(/\s+/g, "")) || 0) + 1);
  }
}

console.log("=== HEX COLORS (value, count) ===");
for (const [k, v] of [...hex.entries()].sort((a, b) => b[1] - a[1])) console.log(`${k}\t${v}`);
console.log("\n=== RGBA COLORS ===");
for (const [k, v] of [...rgba.entries()].sort((a, b) => b[1] - a[1])) console.log(`${k}\t${v}`);
