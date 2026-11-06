import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { handleApiRequest } from "../server/api.js";
import {
  registry,
  DEFAULT_PACKAGE_ID,
  DEFAULT_BASELINE_PACKAGE_ID,
  BASELINE_V1_PACKAGE_ID,
  AGHR_1_4_0_ROOT,
  AGHR_1_3_0_ROOT,
  AGHR_RC3_ROOT,
  AGHR_1_2_0_ROOT,
  AGHR_1_1_0_ROOT,
  AGHR_1_0_0_ROOT,
  AAPES_CANDIDATE_ROOT,
} from "../server/security.js";
import { governanceService } from "../server/governance.js";
import { comparisonService } from "../server/comparison.js";

function makeMockRequest({ url, method = "GET", body = null, headers = {} }) {
  const req = {
    url,
    method,
    headers: { host: "localhost:5180", ...headers },
    on(event, handler) {
      if (event === "data" && body) {
        const payload = typeof body === "string" ? body : JSON.stringify(body);
        handler(Buffer.from(payload));
      }
      if (event === "end") {
        handler();
      }
      return req;
    },
  };

  let statusCode = 200;
  let responseHeaders = {};
  const bodyChunks = [];

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code) {
      statusCode = code;
    },
    setHeader(key, value) {
      responseHeaders[key.toLowerCase()] = value;
    },
    getHeader(key) {
      return responseHeaders[key.toLowerCase()];
    },
    end(data) {
      if (data) bodyChunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    },
  };

  return {
    req,
    res,
    getJSON() {
      const raw = Buffer.concat(bodyChunks).toString("utf8");
      return JSON.parse(raw);
    },
    getStatusCode() {
      return statusCode;
    },
  };
}

// =============================================================================
// Baseline v1 (AGHR v1.4.0 with ADEQ 1.1) Adoption Suite
// =============================================================================

test("Baseline v1: Package root is registered in RootRegistry and points to v1.4.0 reference", () => {
  const roots = registry.listRoots();
  const root = roots.find((r) => r.id === "aghr_1_4_0");
  assert.ok(root, "aghr_1_4_0 must be in approved roots");
  assert.equal(root.type, "reference");
  assert.equal(root.readOnly, true);
  assert.equal(path.resolve(root.path), path.resolve(AGHR_1_4_0_ROOT));

  // v1.3.0 also remains registered in roots
  const root130 = roots.find((r) => r.id === "aghr_1_3_0");
  assert.ok(root130, "aghr_1_3_0 must remain in approved roots");
});

test("Baseline v1: Package file integrity matches all 166 SHA-256 sums for v1.4.0", () => {
  const shaFile = path.join(AGHR_1_4_0_ROOT, "SHA256SUMS.txt");
  assert.ok(fs.existsSync(shaFile), "SHA256SUMS.txt must exist");
  const lines = fs.readFileSync(shaFile, "utf8").split(/\r?\n/).filter(Boolean);
  assert.equal(lines.length, 166, "Expected exactly 166 tracked files in SHA256SUMS.txt for v1.4.0");

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    assert.ok(parts.length >= 2);
    const expectedHash = parts[0];
    const relPath = parts.slice(1).join(" ").replace(/^\.\//, "");
    const fullPath = path.join(AGHR_1_4_0_ROOT, relPath);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
    const actualHash = crypto.createHash("sha256").update(fs.readFileSync(fullPath)).digest("hex");
    assert.equal(actualHash, expectedHash, `Hash mismatch on ${relPath}`);
  }
});

test("Baseline v1: Archive ZIP and SHA-256 companion exist in references for v1.4.0 and v1.3.0", () => {
  const zipPath140 = path.resolve(AGHR_1_4_0_ROOT, "..", "Agent_Governance_RCCA_Kit_EN_v1.4.0.zip");
  const zipShaPath140 = path.resolve(AGHR_1_4_0_ROOT, "..", "Agent_Governance_RCCA_Kit_EN_v1.4.0.zip.sha256");
  assert.ok(fs.existsSync(zipPath140), "v1.4.0 Archive zip must exist");
  assert.ok(fs.existsSync(zipShaPath140), "v1.4.0 Archive zip.sha256 must exist");

  const actualZipHash = crypto.createHash("sha256").update(fs.readFileSync(zipPath140)).digest("hex");
  const expectedShaContent = fs.readFileSync(zipShaPath140, "utf8");
  assert.ok(expectedShaContent.includes(actualZipHash), "v1.4.0 Archive hash must match companion file");
  assert.equal(actualZipHash, "cbe3039cf6423d4cf90e1dd9664f358fe67d714f2c51f288c9ad5779637931a9");
});

test("Baseline v1: Packages endpoint lists aghr_1_4_0 as Baseline v1 default for new workflows", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/packages" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(Array.isArray(data.packages));

  const pkg140 = data.packages.find((p) => p.id === "aghr_1_4_0");
  assert.ok(pkg140, "aghr_1_4_0 must be in packages list");
  assert.equal(pkg140.version, "1.4.0");
  assert.equal(pkg140.baseline, "Baseline v1");
  assert.equal(pkg140.kind, "BASELINE_V1");
  assert.equal(pkg140.isDefaultBaseline, true);
  assert.equal(pkg140.defaultForNewWorkflows, true);
  assert.equal(pkg140.counts.rules, 48); // 24 Core + 24 ADEQ
  assert.equal(pkg140.counts.sources, 19); // 14 base + 5 ADEQ
  assert.equal(pkg140.counts.adapters, 7);

  const pkg130 = data.packages.find((p) => p.id === "aghr_1_3_0");
  assert.ok(pkg130, "aghr_1_3_0 must also remain in packages list");
});

test("Baseline v1: Dedicated baseline endpoint /api/governance/baseline returns v1.4.0 metadata with ADEQ 1.1", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/baseline" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.baseline, "Baseline v1");
  assert.equal(data.packageId, "aghr_1_4_0");
  assert.equal(data.version, "1.4.0");
  assert.equal(data.adeqVersion, "1.1");
  assert.equal(data.defaultForNewWorkflows, true);
  assert.equal(data.legacyReleaseDefaultId, "aghr_rc3");
  assert.equal(data.summary.counts.rules, 48);
});

test("Baseline v1: Default summary preserves legacy release aghr_rc3 while new workflow resolves v1.4.0", async () => {
  // Default request (no params) preserves legacy studio release default (aghr_rc3)
  const defaultReq = makeMockRequest({ url: "/api/governance/summary" });
  await handleApiRequest(defaultReq.req, defaultReq.res);
  assert.equal(defaultReq.getStatusCode(), 200);
  assert.equal(defaultReq.getJSON().packageId, "aghr_rc3");

  // Explicit baseline parameter resolves Baseline v1 (v1.4.0)
  const baselineReq = makeMockRequest({ url: "/api/governance/summary?baseline=v1" });
  await handleApiRequest(baselineReq.req, baselineReq.res);
  assert.equal(baselineReq.getStatusCode(), 200);
  assert.equal(baselineReq.getJSON().packageId, "aghr_1_4_0");

  // Explicit new workflow parameter resolves Baseline v1 (v1.4.0)
  const workflowReq = makeMockRequest({ url: "/api/governance/summary?workflow=new" });
  await handleApiRequest(workflowReq.req, workflowReq.res);
  assert.equal(workflowReq.getStatusCode(), 200);
  assert.equal(workflowReq.getJSON().packageId, "aghr_1_4_0");

  // Explicit packageId resolves v1.4.0
  const directReq = makeMockRequest({ url: "/api/governance/summary?packageId=aghr_1_4_0" });
  await handleApiRequest(directReq.req, directReq.res);
  assert.equal(directReq.getStatusCode(), 200);
  assert.equal(directReq.getJSON().packageId, "aghr_1_4_0");

  // Explicit packageId resolves v1.3.0
  const directReq130 = makeMockRequest({ url: "/api/governance/summary?packageId=aghr_1_3_0" });
  await handleApiRequest(directReq130.req, directReq130.res);
  assert.equal(directReq130.getStatusCode(), 200);
  assert.equal(directReq130.getJSON().packageId, "aghr_1_3_0");
});

test("Baseline v1: All 48 rules (24 Core GOV-001..GOV-024 + 24 ADEQ-01..ADEQ-24) are queryable with details", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/rules?packageId=aghr_1_4_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.total, 48);
  assert.equal(data.rules.length, 48);

  // Check Core rules
  const gov001 = data.rules.find((r) => r.id === "GOV-001");
  assert.ok(gov001);
  assert.equal(gov001.name, "Respect native authority");
  assert.equal(gov001.force, "MUST");

  // Check ADEQ quality rules
  const adeq01 = data.rules.find((r) => r.id === "ADEQ-01");
  assert.ok(adeq01);
  assert.equal(adeq01.id, "ADEQ-01");

  // Single rule detail endpoint
  const singleReq = makeMockRequest({ url: "/api/governance/rule?id=ADEQ-01&packageId=aghr_1_4_0" });
  await handleApiRequest(singleReq.req, singleReq.res);
  assert.equal(singleReq.getStatusCode(), 200);
  const ruleData = singleReq.getJSON();
  assert.equal(ruleData.rule.id, "ADEQ-01");
});

test("Baseline v1: Schemas endpoint returns the 7 pinned JSON Schemas for v1.4.0", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/schemas?packageId=aghr_1_4_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(Array.isArray(data.schemas));
  assert.equal(data.schemas.length, 7);

  const schemaNames = data.schemas.map((s) => s.name).sort();
  assert.deepEqual(schemaNames, [
    "action.schema.json",
    "adeq-rules.schema.json",
    "delegation.schema.json",
    "measurement.schema.json",
    "quality.schema.json",
    "rules.schema.json",
    "trace.schema.json",
  ]);
});

test("Baseline v1: Structural package comparison v1.3.0 vs v1.4.0 identifies added ADEQ quality rules", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/compare?base=aghr_1_3_0&target=aghr_1_4_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(data.comparison);
  assert.equal(data.comparison.base.packageId, "aghr_1_3_0");
  assert.equal(data.comparison.target.packageId, "aghr_1_4_0");
  assert.equal(data.comparison.base.version, "1.3.0");
  assert.equal(data.comparison.target.version, "1.4.0");
  assert.equal(data.comparison.rulesDelta.addedCount, 24); // 24 ADEQ rules added
});

test("Baseline v1: Legacy packages remain fully accessible and unmodified", () => {
  assert.ok(fs.existsSync(AGHR_RC3_ROOT), "AGHR rc.3 must remain present");
  assert.ok(fs.existsSync(AGHR_1_2_0_ROOT), "AGHR 1.2.0 must remain present");
  assert.ok(fs.existsSync(AGHR_1_1_0_ROOT), "AGHR 1.1.0 must remain present");
  assert.ok(fs.existsSync(AGHR_1_0_0_ROOT), "AGHR 1.0.0 must remain present");
  assert.ok(fs.existsSync(AAPES_CANDIDATE_ROOT), "AAPES v2.1 candidate must remain present");

  const packages = governanceService.listPackages();
  const packageIds = packages.map((p) => p.id);
  assert.ok(packageIds.includes("aghr_rc3"));
  assert.ok(packageIds.includes("aghr_1_2_0"));
  assert.ok(packageIds.includes("aghr_1_1_0"));
  assert.ok(packageIds.includes("aghr"));
  assert.ok(packageIds.includes("aapes_v2_1"));
  assert.ok(packageIds.includes("aghr_1_3_0"));
  assert.ok(packageIds.includes("aghr_1_4_0"));
});

test("Baseline v1: Non-activation invariants remain strictly preserved for v1.4.0", () => {
  const statusPath = path.join(AGHR_1_4_0_ROOT, "PACKAGE_STATUS.json");
  const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
  assert.equal(status.project_activation, "NOT_ACTIVE");
  assert.equal(status.runtime_enforcement, "NOT_IMPLEMENTED");
  assert.equal(status.owner_acceptance, "NOT_GRANTED");
  assert.equal(status.live_qualification, "NOT_RUN");
  assert.equal(status.distinct_tests_passed, 295);
});
