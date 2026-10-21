import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { scanInbox, verifyReceipt, receiptPath } from "../tools/inbox_custody.mjs";

test("INBOX custody receipt detects changed bytes or file set", () => {
  const baseline = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  // Preserve the eight originals and the prior 21-file intake through the Git checkpoint.
  const priorPath = new URL("../docs/evidence/inbox/2026-10-21-01-custody.json", import.meta.url);
  const prior = JSON.parse(fs.readFileSync(priorPath, "utf8"));
  const currentPath = new URL("../docs/evidence/inbox/2026-10-21-02-custody.json", import.meta.url);
  const receipt = JSON.parse(fs.readFileSync(currentPath, "utf8"));
  assert.equal(verifyReceipt(receipt), 23);
  const actual = scanInbox();
  for (const original of [...baseline.files, ...prior.files]) {
    assert.deepEqual(actual.find((file) => file.name === original.name), original);
  }
  const altered = structuredClone(receipt);
  altered.files[0].sha256 = "0".repeat(64);
  assert.throws(() => verifyReceipt(altered), /custody mismatch/);
  const missing = structuredClone(receipt);
  missing.files.pop();
  assert.throws(() => verifyReceipt(missing), /custody mismatch/);
  assert.deepEqual(actual, receipt.files);
});
