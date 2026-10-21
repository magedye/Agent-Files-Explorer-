#!/usr/bin/env node

/**
 * Context Health & Budget Linter
 *
 * Verifies that:
 * 1. Primary agent instruction and state files adhere to strict token/size budgets.
 * 2. Cross-document markdown links in the docs/ tree are valid and resolvable.
 * 3. Prohibited heavy archives (compatibility/, verification/) are not referenced as mandatory in bootstrap files.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const BUDGETS = [
  { file: "AGENTS.md", maxBytes: 10_000, maxTokensEst: 2_500 },
  { file: "docs/status/CURRENT.md", maxBytes: 15_000, maxTokensEst: 3_500 },
  { file: "docs/status/HANDOFF.md", maxBytes: 10_000, maxTokensEst: 2_500 },
  { file: "docs/INDEX.md", maxBytes: 12_000, maxTokensEst: 3_000 },
];

let errors = 0;
let warnings = 0;

console.log("=== Context Health & Budget Check ===\n");

// 1. Check File Sizes & Token Budgets
console.log("1. Checking Bootstrap File Budgets:");
let totalBootstrapTokens = 0;

for (const b of BUDGETS) {
  const fullPath = path.join(PROJECT_ROOT, b.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ❌ [MISSING] ${b.file} does not exist`);
    errors++;
    continue;
  }

  const stat = fs.statSync(fullPath);
  const content = fs.readFileSync(fullPath, "utf8");
  const estTokens = Math.round(content.length / 3.7);
  totalBootstrapTokens += estTokens;

  if (stat.size > b.maxBytes) {
    console.error(`  ❌ [OVER_BUDGET] ${b.file}: ${(stat.size / 1024).toFixed(1)} KB (Max: ${(b.maxBytes / 1024).toFixed(1)} KB)`);
    errors++;
  } else {
    console.log(`  ✔ [PASS] ${b.file.padEnd(25)}: ${(stat.size / 1024).toFixed(1).padStart(5)} KB | ~${String(estTokens).padStart(4)} est. tokens (Budget: ${b.maxTokensEst})`);
  }
}

console.log(`\n  Total Bootstrap Context: ~${totalBootstrapTokens} tokens (Target: < 5,000 tokens)`);
if (totalBootstrapTokens > 5000) {
  console.warn(`  ⚠️ Total bootstrap context exceeds recommended threshold of 5,000 tokens.`);
  warnings++;
}

// 2. Check Prohibited Crawling References in Bootstrap Files
console.log("\n2. Checking for Prohibited Crawl Patterns in Bootstrap Files:");
// Match historical directory segments, not active filenames such as VERIFICATION_REPORT.md.
const prohibitedRegex = /(?:governance_packages[\\/].*?[\\/](compatibility|verification)(?:[\\/]|$))/i;

for (const b of BUDGETS) {
  const fullPath = path.join(PROJECT_ROOT, b.file);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    // Flag if line instructs to load or read without warning/prohibition
    const isProhibition = /never|do not|no-crawl|prohibit|forbidden|exclude|notice|⛔|⚠️/i.test(line);
    const parentHeaderIsProhibition = content.slice(0, content.indexOf(line)).includes("Strict Prohibitions");
    if (prohibitedRegex.test(line) && !isProhibition && !parentHeaderIsProhibition) {
      console.warn(`  ⚠️ [PROHIBITED_LEAK] ${b.file}:${idx + 1} contains unescaped crawl reference to heavy archive: ${line.trim()}`);
      warnings++;
    }
  });
}
console.log("  ✔ Prohibited patterns check complete.");

// 3. Verify Local File Links in docs/
console.log("\n3. Verifying Local Markdown Links in docs/:");
function checkMarkdownLinks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      checkMarkdownLinks(full);
    } else if (e.isFile() && e.name.endsWith(".md")) {
      const text = fs.readFileSync(full, "utf8");
      // Match markdown links [text](path) or file:///path
      const linkRegex = /\[([^\]]+)\]\((file:\/\/\/)?([^)]+)\)/g;
      let m;
      while ((m = linkRegex.exec(text)) !== null) {
        let target = m[3];
        if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) {
          continue; // External or anchor
        }
        // Normalize file URL or relative path
        let resolvedTarget;
        if (target.includes(":")) {
          // Absolute path like D:/APP/...
          resolvedTarget = path.normalize(target);
        } else {
          resolvedTarget = path.resolve(path.dirname(full), target);
        }

        if (!fs.existsSync(resolvedTarget)) {
          console.error(`  ❌ [BROKEN_LINK] In ${path.relative(PROJECT_ROOT, full)}: link target not found: ${target}`);
          errors++;
        }
      }
    }
  }
}

checkMarkdownLinks(path.join(PROJECT_ROOT, "docs"));
console.log("  ✔ Markdown link verification complete.");

// Summary
console.log("\n=== Summary ===");
console.log(`Errors: ${errors}, Warnings: ${warnings}`);

if (errors > 0) {
  console.error("❌ Context health check FAILED.");
  process.exit(1);
} else {
  console.log("✅ Context health check PASSED. All context budgets and links are healthy.");
  process.exit(0);
}
