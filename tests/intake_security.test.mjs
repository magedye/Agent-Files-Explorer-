/**
 * tests/intake_security.test.mjs
 *
 * Targeted security + data-integrity tests for the intake service:
 *  - SEC-02: getPacket(packetId) must not traverse outside the intake storage.
 *  - DATA-01: submitIntake must preserve sourceId / domain / targetPackageId.
 *
 * Storage is isolated to a temp dir via fs mocking (same pattern as
 * studio_legacy_services.test.mjs); no real intake history is touched.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { intakeService } from "../server/intake.js";
import { governanceService } from "../server/governance.js";
import { PROJECT_ROOT } from "../server/security.js";

/** Redirect .governance/<kind> to a per-test temp directory. */
function isolatedStorage(t, kind) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aghr-intake-sec-"));
  const target = path.join(PROJECT_ROOT, ".governance", kind);
  const storage = path.join(root, kind);
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

test("SEC-02: getPacket blocks path traversal (negative, isolated canary)", (t) => {
  // Canary placed OUTSIDE the intake dir: .governance/intake-traversal-canary.json
  const canary = path.join(PROJECT_ROOT, ".governance", "intake-traversal-canary.json");
  fs.mkdirSync(path.dirname(canary), { recursive: true });
  fs.writeFileSync(canary, JSON.stringify({ leaked: true, marker: "SEC-02-CANARY" }));
  t.after(() => { try { fs.rmSync(canary, { force: true }); } catch {} });

  // A vulnerable getPacket would resolve ../<id>.json and read the canary.
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
});

test("SEC-02: getPacket round-trips a valid packet (positive)", (t) => {
  isolatedStorage(t, "intake");
  t.mock.method(governanceService, "getRules", () => []);
  const packet = intakeService.submitIntake({ rawText: "must verify token signature" });
  const fetched = intakeService.getPacket(packet.packetId);
  assert.equal(fetched.packetId, packet.packetId);
  assert.equal(fetched.changeItems.length, 1);
});

test("DATA-01: submitIntake preserves sourceId, domain, targetPackageId", (t) => {
  isolatedStorage(t, "intake");
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
