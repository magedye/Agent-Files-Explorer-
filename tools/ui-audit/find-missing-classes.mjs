import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync("src/index.css", "utf8");
const defined = new Set([...css.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((m) => m[1]));

const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx|js)$/.test(e.name)) files.push(p);
  }
}
walk("src");

const used = new Map();
for (const f of files) {
  const txt = fs.readFileSync(f, "utf8");
  // className="a b c"
  for (const m of txt.matchAll(/className\s*=\s*["']([^"']+)["']/g)) {
    for (const c of m[1].split(/\s+/)) if (c && !c.includes("{")) add(c, f);
  }
  // className={"a " + (cond ? "b" : "")} and className={`a ${x}`}
  for (const m of txt.matchAll(/className\s*=\s*\{([^}]+)\}/g)) {
    for (const s of m[1].matchAll(/["'`]([^"'`]+)["'`]/g)) {
      for (const c of s[1].split(/\s+/)) if (c && !c.includes("$") && !c.includes("+")) add(c, f);
    }
  }
}
function add(c, f) {
  if (!used.has(c)) used.set(c, new Set());
  used.get(c).add(f);
}

const missing = [...used.keys()].filter((c) => !defined.has(c) && !/^(on|off|active|selected|single|backref|empty|dir|open)$/.test(c)).sort();
console.log("defined classes:", defined.size);
console.log("used classes:", used.size);
console.log("MISSING (" + missing.length + "):");
for (const c of missing) console.log("  ." + c + "  <- " + [...used.get(c)].map((f) => path.basename(f)).join(", "));
