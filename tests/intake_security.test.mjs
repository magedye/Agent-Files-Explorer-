/**
 * tests/intake_security.test.mjs
 *
 * Targeted security + data-integrity tests for the intake service:
 *  - SEC-02: getPacket(packetId) must not traverse outside the intake storage.
 *  - DATA-01: submitIntake must preserve sourceId/domain/targetPackageId and the
 *    per-item semantic contract fields (polarity/conditional/conflictType/
 *    requiresReview).
 *
 * FULL isolation: the entire `.governance` directory is redirected to a
 * per-test temp directory via fs mocking. No file is created outside temp
 * space; no existing file is overwritten or deleted. The canary is synthetic
 * and lives only in the temp `.governance`.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { intakeService } from "../server/intake.js";
import { governanceService } from "../server/governance.js";
import { PROJECT_ROOT } from "../server/security.js";

/**
 * Redirect the whole `.governance` directory to a per-test temp dir. All fs
 * operations touching PROJECT_ROOT/.governance (intake storage AND the
 * traversal canary) are mapped into temp; `t.after` restores mocks and removes
 * the temp tree.
 */
function isolateGovernance(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aghr-intake-sec-"));
  const target = path.join(PROJECT_ROOT, ".governance");
  const storage = path.join(root, ".governance");
  const mocks = [];
  const map = (p) =>
    typeof p === "string" && (p === target || p.startsWith(target + path.sep))
      ? storage + p.slice(target.length)
      : p;
  for (const name of ["existsSync", "mkdirSync", "writeFileSync", "readFileSync", "readdirSync"]) {
    const original = fs[name];
    mocks.push(t.mock.method(fs, name, function (p, ...args) { return original.call(this, map(p), ...args); }));
  }
  t.after(() => { for (const fn of mocks) fn.mock.restore(); fs.rmSync(root, { recursive: true, force: true }); });
  return storage;
}

test("SEC-02: getPacket blocks path traversal (fully isolated, no real files)", (t) => {
  const gov = isolateGovernance(t);
  // Canary placed in the temp .governance, OUTSIDE temp .governance/intake.
  const canary = path.join(gov, "intake-traversal-canary.json");
  fs.mkdirSync(gov, { recursive: true });
  fs.writeFileSync(canary, JSON.stringify({ leaked: true, marker: "SEC-02-CANARY" }));

  // A vulnerable getPacket would resolve ../<id>.json and read the canary.
  // The hardened getPacket rejects every traversal-shaped ID before any fs read.
  for (const bad of [
    "../intake-traversal-canary",
    "..\\intake-traversal-canary",
    "CP-X/../intake-traversal-canary",
    "CP-X/..",
    "a/b",
    "..",
    ".",
  ]) {
    assert.equal(intakeService.getPacket(bad), null, `traversal id '${bad}' must return null`);
  }
  // No canary or other file may leak into the real .governance.
  assert.equal(fs.existsSync(canary), true, "canary must live only in temp");
});

test("SEC-02: getPacket round-trips a valid packet (positive)", (t) => {
  isolateGovernance(t);
  t.mock.method(governanceService, "getRules", () => []);
  const packet = intakeService.submitIntake({ rawText: "must verify token signature" });
  const fetched = intakeService.getPacket(packet.packetId);
  assert.equal(fetched.packetId, packet.packetId);
  assert.equal(fetched.changeItems.length, 1);
});

test("DATA-01: submitIntake preserves sourceId, domain, targetPackageId", (t) => {
  isolateGovernance(t);
  t.mock.method(governanceService, "getRules", () => []);
  const packet = intakeService.submitIntake({
    rawText: "The agent must verify token signature before reading",
    sourceId: "rule://AGHR-001",
    domain: "SEC",
    targetPackageId: "aghr_rc3",
  });
  assert.equal(packet.sourceId, "rule://AGHR-001");
  assert.equal(packet.domain, "SEC");
  assert.equal(packet.targetPackageId, "aghr_rc3");
});

test("DATA-01: submitIntake persists the semantic contract fields per item", (t) => {
  isolateGovernance(t);
  t.mock.method(governanceService, "getRules", () => []);
  const packet = intakeService.submitIntake({ rawText: "The agent must verify token signature" });
  const item = packet.changeItems[0];
  assert.equal(item.normativeForce, "MUST");
  assert.equal(item.polarity, "POSITIVE");
  assert.equal(item.conditional, false);
  assert.equal(item.conflictType, null);
  assert.equal(item.requiresReview, false);
});
