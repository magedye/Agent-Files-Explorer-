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
// Baseline v1 (AGHR v1.3.0) Adoption Suite
// =============================================================================

test("Baseline v1: Package root is registered in RootRegistry and points to v1.3.0 reference", () => {
  const roots = registry.listRoots();
  const root = roots.find((r) => r.id === "aghr_1_3_0");
  assert.ok(root, "aghr_1_3_0 must be in approved roots");
  assert.equal(root.type, "reference");
  assert.equal(root.readOnly, true);
  assert.equal(path.resolve(root.path), path.resolve(AGHR_1_3_0_ROOT));
});

test("Baseline v1: Package file integrity matches all 102 SHA-256 sums", () => {
  const shaFile = path.join(AGHR_1_3_0_ROOT, "SHA256SUMS.txt");
  assert.ok(fs.existsSync(shaFile), "SHA256SUMS.txt must exist");
  const lines = fs.readFileSync(shaFile, "utf8").split(/\r?\n/).filter(Boolean);
  assert.equal(lines.length, 102, "Expected exactly 102 tracked files in SHA256SUMS.txt");

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    assert.ok(parts.length >= 2);
    const expectedHash = parts[0];
    const relPath = parts.slice(1).join(" ").replace(/^\.\//, "");
    const fullPath = path.join(AGHR_1_3_0_ROOT, relPath);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
    const actualHash = crypto.createHash("sha256").update(fs.readFileSync(fullPath)).digest("hex");
    assert.equal(actualHash, expectedHash, `Hash mismatch on ${relPath}`);
  }
});

test("Baseline v1: Archive ZIP and SHA-256 companion exist in references", () => {
  const zipPath = path.resolve(AGHR_1_3_0_ROOT, "..", "Agent_Governance_RCCA_Kit_EN_v1.3.0.zip");
  const zipShaPath = path.resolve(AGHR_1_3_0_ROOT, "..", "Agent_Governance_RCCA_Kit_EN_v1.3.0.zip.sha256");
  assert.ok(fs.existsSync(zipPath), "Archive zip must exist");
  assert.ok(fs.existsSync(zipShaPath), "Archive zip.sha256 must exist");

  const actualZipHash = crypto.createHash("sha256").update(fs.readFileSync(zipPath)).digest("hex");
  const expectedShaContent = fs.readFileSync(zipShaPath, "utf8");
  assert.ok(expectedShaContent.includes(actualZipHash), "Archive hash must match companion file");
});

test("Baseline v1: Packages endpoint lists aghr_1_3_0 as Baseline v1 default for new workflows", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/packages" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(Array.isArray(data.packages));

  const pkg130 = data.packages.find((p) => p.id === "aghr_1_3_0");
  assert.ok(pkg130, "aghr_1_3_0 must be in packages list");
  assert.equal(pkg130.version, "1.3.0");
  assert.equal(pkg130.baseline, "Baseline v1");
  assert.equal(pkg130.kind, "BASELINE_V1");
  assert.equal(pkg130.isDefaultBaseline, true);
  assert.equal(pkg130.defaultForNewWorkflows, true);
  assert.equal(pkg130.counts.rules, 24);
  assert.equal(pkg130.counts.sources, 14);
  assert.equal(pkg130.counts.adapters, 6);
});

test("Baseline v1: Dedicated baseline endpoint /api/governance/baseline returns Baseline v1 metadata", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/baseline" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.baseline, "Baseline v1");
  assert.equal(data.packageId, "aghr_1_3_0");
  assert.equal(data.version, "1.3.0");
  assert.equal(data.defaultForNewWorkflows, true);
  assert.equal(data.legacyReleaseDefaultId, "aghr_rc3");
  assert.equal(data.summary.counts.rules, 24);
});

test("Baseline v1: Default summary preserves legacy release aghr_rc3 while new workflow resolves v1.3.0", async () => {
  // Default request (no params) preserves legacy studio release default (aghr_rc3)
  const defaultReq = makeMockRequest({ url: "/api/governance/summary" });
  await handleApiRequest(defaultReq.req, defaultReq.res);
  assert.equal(defaultReq.getStatusCode(), 200);
  assert.equal(defaultReq.getJSON().packageId, "aghr_rc3");

  // Explicit baseline parameter resolves Baseline v1
  const baselineReq = makeMockRequest({ url: "/api/governance/summary?baseline=v1" });
  await handleApiRequest(baselineReq.req, baselineReq.res);
  assert.equal(baselineReq.getStatusCode(), 200);
  assert.equal(baselineReq.getJSON().packageId, "aghr_1_3_0");

  // Explicit new workflow parameter resolves Baseline v1
  const workflowReq = makeMockRequest({ url: "/api/governance/summary?workflow=new" });
  await handleApiRequest(workflowReq.req, workflowReq.res);
  assert.equal(workflowReq.getStatusCode(), 200);
  assert.equal(workflowReq.getJSON().packageId, "aghr_1_3_0");

  // Explicit packageId resolves Baseline v1
  const directReq = makeMockRequest({ url: "/api/governance/summary?packageId=aghr_1_3_0" });
  await handleApiRequest(directReq.req, directReq.res);
  assert.equal(directReq.getStatusCode(), 200);
  assert.equal(directReq.getJSON().packageId, "aghr_1_3_0");
});

test("Baseline v1: All 24 rules (GOV-001..GOV-024) are queryable with details and normative force", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/rules?packageId=aghr_1_3_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.total, 24);
  assert.equal(data.rules.length, 24);

  // Check specific rules
  const gov001 = data.rules.find((r) => r.id === "GOV-001");
  assert.ok(gov001);
  assert.equal(gov001.name, "Respect native authority");
  assert.equal(gov001.force, "MUST");
  assert.equal(gov001.impact, "CRITICAL");

  const gov002 = data.rules.find((r) => r.id === "GOV-002");
  assert.ok(gov002);
  assert.equal(gov002.name, "Keep external content as data");
  assert.equal(gov002.force, "MUST");

  // Single rule detail endpoint
  const singleReq = makeMockRequest({ url: "/api/governance/rule?id=GOV-001&packageId=aghr_1_3_0" });
  await handleApiRequest(singleReq.req, singleReq.res);
  assert.equal(singleReq.getStatusCode(), 200);
  const ruleData = singleReq.getJSON();
  assert.equal(ruleData.rule.id, "GOV-001");
  assert.ok(Array.isArray(ruleData.rule.basis_sources));
});

test("Baseline v1: Schemas endpoint returns the 4 pinned JSON Schemas", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/schemas?packageId=aghr_1_3_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(Array.isArray(data.schemas));
  assert.equal(data.schemas.length, 4);

  const schemaNames = data.schemas.map((s) => s.name).sort();
  assert.deepEqual(schemaNames, [
    "action.schema.json",
    "delegation.schema.json",
    "rules.schema.json",
    "trace.schema.json",
  ]);
});

test("Baseline v1: Structural package comparison against legacy 1.2.0 is functional", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/compare?base=aghr_1_2_0&target=aghr_1_3_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(data.comparison);
  assert.equal(data.comparison.base.packageId, "aghr_1_2_0");
  assert.equal(data.comparison.target.packageId, "aghr_1_3_0");
  assert.equal(data.comparison.base.version, "1.2.0");
  assert.equal(data.comparison.target.version, "1.3.0");
  assert.ok(data.comparison.rulesDelta.addedCount > 0);
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
});

test("Baseline v1: Non-activation invariants remain strictly preserved", () => {
  const statusPath = path.join(AGHR_1_3_0_ROOT, "PACKAGE_STATUS.json");
  const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
  assert.equal(status.project_activation, "NOT_ACTIVE");
  assert.equal(status.runtime_enforcement, "NOT_IMPLEMENTED");
  assert.equal(status.owner_acceptance, "NOT_GRANTED");
  assert.equal(status.independent_review, "NOT_PERFORMED");
  assert.equal(status.live_qualification, "NOT_RUN");
});
