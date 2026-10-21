import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const inboxPath = path.join(projectRoot, "governance_packages", "INBOX");
export const receiptPath = path.join(projectRoot, "docs", "evidence", "inbox", "2026-10-20-custody.json");

function receiptForLabel(label) {
  if (!/^\d{4}-\d{2}-\d{2}(?:-\d{2})?$/.test(label)) throw new Error("Receipt label must be YYYY-MM-DD or YYYY-MM-DD-NN");
  return path.join(projectRoot, "docs", "evidence", "inbox", `${label}-custody.json`);
}

export function scanInbox(directory = inboxPath) {
  const root = fs.realpathSync(directory);
  if (!fs.statSync(root).isDirectory()) throw new Error("INBOX is not a directory");
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    if (!entry.isFile()) throw new Error(`INBOX contains a non-regular entry: ${entry.name}`);
    const absolute = path.join(root, entry.name);
    const before = fs.lstatSync(absolute);
    if (!before.isFile() || fs.realpathSync(absolute) !== absolute) {
      throw new Error(`INBOX entry changed or resolves elsewhere: ${entry.name}`);
    }
    const bytes = fs.readFileSync(absolute);
    const after = fs.lstatSync(absolute);
    if (!after.isFile() || before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes.length !== after.size) {
      throw new Error(`INBOX entry changed during scan: ${entry.name}`);
    }
    files.push({ name: entry.name, bytes: bytes.length, sha256: crypto.createHash("sha256").update(bytes).digest("hex") });
  }
  return files;
}

export function verifyReceipt(receipt, directory = inboxPath) {
  if (!receipt || !Array.isArray(receipt.files)) throw new Error("Invalid custody receipt");
  const actual = scanInbox(directory);
  if (JSON.stringify(actual) !== JSON.stringify(receipt.files)) throw new Error("INBOX custody mismatch: file set, size, or hash changed");
  return actual.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  const targetReceipt = receiptForLabel(process.argv[3] || new Date().toISOString().slice(0, 10));
  if (mode === "--scan") {
    process.stdout.write(`${JSON.stringify(scanInbox(), null, 2)}\n`);
  } else if (mode === "--write") {
    const receipt = {
      schema: "aghr-studio-inbox-custody-v1",
      capturedAtUtc: new Date().toISOString(),
      sourceIdentity: "UNKNOWN",
      sourceApproval: "NOT_ESTABLISHED",
      relativeDirectory: "governance_packages/INBOX",
      files: scanInbox(),
    };
    fs.mkdirSync(path.dirname(targetReceipt), { recursive: true });
    fs.writeFileSync(targetReceipt, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    process.stdout.write(`Wrote ${receipt.files.length} entries to ${targetReceipt}\n`);
  } else if (mode === "--verify") {
    const receipt = JSON.parse(fs.readFileSync(targetReceipt, "utf8"));
    process.stdout.write(`Verified ${verifyReceipt(receipt)} INBOX entries\n`);
  } else {
    process.stderr.write("Usage: node tools/inbox_custody.mjs --scan|--write|--verify [YYYY-MM-DD[-NN]]\n");
    process.exitCode = 2;
  }
}
