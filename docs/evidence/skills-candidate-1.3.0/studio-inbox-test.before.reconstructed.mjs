import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { scanInbox, verifyReceipt, receiptPath } from "../tools/inbox_custody.mjs";

test("INBOX custody receipt detects changed bytes or file set", () => {
  const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
  assert.equal(verifyReceipt(receipt), 8);
  const altered = structuredClone(receipt);
  altered.files[0].sha256 = "0".repeat(64);
  assert.throws(() => verifyReceipt(altered), /custody mismatch/);
  assert.deepEqual(scanInbox(), receipt.files);
});
