import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { handleApiRequest } from "../server/api.js";
import { decomposeIntoAtomicStatements, classifyStatement, reconcileWithRules, intakeService } from "../server/intake.js";
import { adoptionService } from "../server/adoption.js";
import { stagingService } from "../server/staging.js";
import { governanceService } from "../server/governance.js";
import { PROJECT_ROOT } from "../server/security.js";

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
  let bodyChunks = [];

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
// Milestone 2 Tests: Governance Reference Explorer
// =============================================================================
test("M2 Reference Explorer: Summary contains exact AGHR counts", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/summary" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.version, "1.0.0");
  assert.equal(data.default_provider, "OPENAI");
  assert.equal(data.counts.rules, 40);
  assert.equal(data.counts.sources, 30);
  assert.equal(data.counts.adapters, 12);
  assert.equal(data.independent_review, "NOT_PERFORMED");
  assert.equal(data.release_acceptance, "NOT_GRANTED");
});

test("M2 Reference Explorer: Rules search and filtering", async () => {
  // Search for developer reference
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/rules?search=developer",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(data.rules.length >= 1);
  assert.ok(data.rules.some((r) => r.id === "AGHR-001"));
});

test("M2 Reference Explorer: Rule details with basis sources and coverage", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/rule?id=AGHR-001",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.rule.id, "AGHR-001");
  assert.equal(data.rule.force, "MUST");
  assert.ok(Array.isArray(data.rule.basis_sources));
  assert.ok(data.rule.basis_sources.length >= 1);
  assert.equal(data.rule.basis_sources[0].id, "OA-01");
});

test("M2 Reference Explorer: Relationship graph has typed authoritative edges", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/graph" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(data.nodes.length >= 70); // 40 rules + 30 sources + 4 contracts
  assert.ok(data.edges.some((e) => e.type === "AUTHORITATIVE_BASIS"));
  assert.ok(data.edges.some((e) => e.type === "NORMATIVE_CONTRACT"));
});

// =============================================================================
// Milestone 3 Tests: Intake and ChangePackets
// =============================================================================
test("M3 Intake: Compound statement decomposition", () => {
  const compound = "يجب حفظ النص القرآني دون تعديل. بالإضافة إلى ذلك يمنع حذف أي أثر أو دليل؛ كذلك يجب توثيق الشواهد.";
  const atomic = decomposeIntoAtomicStatements(compound);
  assert.ok(atomic.length >= 3, `Expected at least 3 statements, got ${atomic.length}`);
});

test("M3 Intake: 2-Layer classification of domain concern and normative force", () => {
  const stmt1 = "يمنع حذف أي دليل أو شاهد تحليلي.";
  const cl1 = classifyStatement(stmt1);
  assert.equal(cl1.domain, "EVD");
  assert.equal(cl1.force, "MUST_NOT");

  const stmt2 = "ينبغي إضافة اختبار تراجعي للتحقق من المخرجات.";
  const cl2 = classifyStatement(stmt2);
  assert.equal(cl2.domain, "TEST");
  assert.equal(cl2.force, "SHOULD");
});

test("M3 Intake: Conflict detection against existing rules triggers REJECT proposal", () => {
  // Try to propose overriding developer reference with arbitrary advice
  const conflictStmt = "لا يجوز الرجوع إلى المراجع الرسمية للمطور ويجب الاعتماد على التخمين.";
  const cl = classifyStatement(conflictStmt);
  const rec = reconcileWithRules(conflictStmt, cl);
  assert.equal(rec.proposedAction, "REJECT");
  assert.ok(rec.conflictDetected);
});

test("M3 Intake: Submit intake request generates persistent ChangePacket", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/intake/submit",
    method: "POST",
    body: {
      rawText: "يجب توثيق الأدلة المنهجية بدقة. كذلك ينبغي فحص مخرجات كل نموذج قبل الاعتماد.",
      author: "Quality Engineer",
      source: "TEST_RUNNER",
    },
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 201);
  const data = getJSON();
  assert.ok(data.packet.packetId.startsWith("CP-"));
  assert.equal(data.packet.status, "PROPOSED_READY_FOR_REVIEW");
  assert.ok(data.packet.changeItems.length >= 2);
  assert.ok(data.packet.changeItems.every((it) => it.status === "PROPOSED"));
});

// =============================================================================
// Milestone 4 Tests: Project Adoption Center
// =============================================================================
test("M4 Adoption: Discovers candidates in data/", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/adoption/candidates" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(Array.isArray(data.candidates));
  assert.ok(data.candidates.some((c) => c.name === "lisan-blind-lab"));
});

test("M4 Adoption: Prepares adoption plan without silent destruction", async () => {
  const targetCandidate = path.join(PROJECT_ROOT, "data", "lisan-blind-lab");
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/adoption/prepare",
    method: "POST",
    body: {
      projectDir: targetCandidate,
      profile: "STANDARD",
      provider: "OPENAI",
      host: "CODEX",
    },
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.plan.status, "ADOPTION_PREPARED");
  assert.equal(data.plan.profile, "STANDARD");
  assert.ok(data.plan.plannedFiles.some((f) => f.path === "AGENTS.md"));
  assert.ok(data.plan.plannedFiles.some((f) => f.path === ".governance/project.json"));
});

// =============================================================================
// Milestone 6 Tests: Governed Staging and Apply
// =============================================================================
test("M6 Governed Staging & Apply: Staging, Precondition Drift, and Authorized Apply", () => {
  const fixtureDir = path.join(PROJECT_ROOT, ".governance", "test-fixtures-project");
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });

  const initialFile = path.join(fixtureDir, "README.md");
  fs.writeFileSync(initialFile, "# Initial Project\nVersion 1.0\n", "utf8");

  // 1. Stage changes
  const staged = stagingService.createStagingWorkspace({
    packetId: "TEST-CP-01",
    targetProjectDir: fixtureDir,
    plannedFiles: [
      {
        path: "README.md",
        proposedContent: "# Initial Project\nVersion 1.0\n## Governed with AGHR\n",
      },
    ],
  });
  assert.equal(staged.status, "STAGED_READY_FOR_AUTHORIZATION");
  assert.equal(staged.files.length, 1);

  // 2. Unauthorized apply must fail
  assert.throws(
    () =>
      stagingService.applyStagedChanges({
        stagingId: staged.stagingId,
        authorizationToken: "INVALID_TOKEN",
      }),
    /Authorization denied/
  );

  // 3. Stale precondition detection: mutate live target before apply
  fs.writeFileSync(initialFile, "# Altered live content while reviewing\n", "utf8");
  assert.throws(
    () =>
      stagingService.applyStagedChanges({
        stagingId: staged.stagingId,
        authorizationToken: "AUTHORIZED_BY_PROJECT_OWNER",
      }),
    /STALE_PRECONDITION/
  );

  // Restore precondition
  fs.writeFileSync(initialFile, "# Initial Project\nVersion 1.0\n", "utf8");

  // 4. Authorized apply succeeds
  const applyRes = stagingService.applyStagedChanges({
    stagingId: staged.stagingId,
    authorizationToken: "AUTHORIZED_BY_PROJECT_OWNER",
  });
  assert.equal(applyRes.status, "APPLY_SUCCESS");

  // Verify file on disk has updated content
  const appliedContent = fs.readFileSync(initialFile, "utf8");
  assert.ok(appliedContent.includes("Governed with AGHR"));

  // 5. Rollback restores original state
  const rollbackRes = stagingService.rollbackBackup({ backupId: applyRes.backupId });
  assert.equal(rollbackRes.status, "ROLLBACK_SUCCESS");
  const rolledBackContent = fs.readFileSync(initialFile, "utf8");
  assert.equal(rolledBackContent, "# Initial Project\nVersion 1.0\n");

  // Clean fixture
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});
