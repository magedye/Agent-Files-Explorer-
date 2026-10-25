import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from 'node:os';
import { handleApiRequest } from "../server/api.js";
import { decomposeIntoAtomicStatements, classifyStatement, reconcileWithRules, intakeService } from "../server/intake.js";
import { adoptionService } from "../server/adoption.js";
import { StagingService,stagingScope } from "../server/staging.js";
import {createWriteAuthority} from '../server/studio/write-authorization.js';
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
test("M2 Reference Explorer: Owner-signed rc.3 is default with exact Core counts", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/summary" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.packageId, "aghr_rc3");
  assert.equal(data.version, "1.0.0-rc.3");
  assert.equal(data.default_provider, "OPENAI");
  assert.equal(data.counts.rules, 1);
  assert.equal(data.counts.sources, 0);
  assert.equal(data.counts.adapters, 0);
  assert.equal(data.independent_review, "APPROVE_FOR_FROZEN_LOCAL_DRAFT");
  assert.equal(data.release_acceptance, "ACCEPTED_BY_OWNER_FOR_LOCAL_USE");
  assert.equal(data.reference_state, "OFFICIAL_LOCAL_RELEASE");
});

test("M2 Reference Explorer: Rules search and filtering", async () => {
  // Search for developer reference
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/rules?search=developer&packageId=aghr_1_2_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(data.rules.length >= 1);
  assert.ok(data.rules.some((r) => r.id === "AGHR-001"));
});

test("M2 Reference Explorer: Rule details with basis sources and coverage", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/rule?id=AGHR-001&packageId=aghr_1_2_0",
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

test("M2 Reference Explorer: Packages endpoint returns all registered governance packages", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/packages" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(Array.isArray(data.packages));
  assert.ok(data.packages.length >= 3);
  assert.ok(data.packages.some((p) => p.id === "aghr"));
  assert.ok(data.packages.some((p) => p.id === "aghr_1_1_0"));
  assert.ok(data.packages.some((p) => p.id === "aghr_minimal_1_1_0"));
  assert.deepEqual(data.packages.filter((p) => p.isDefault).map((p) => p.id), ["aghr_rc3"]);
});

test("M2 Reference Explorer: Omitted package uses rc.3 while Legacy IDs stay explicit", async () => {
  for (const [url, verify] of [
    ["/api/governance/rules", (data) => {assert.equal(data.rules.length, 1);assert.equal(data.rules[0].id,'OBS-REFERENCE-STATE-001');}],
    ["/api/governance/sources", (data) => assert.equal(data.sources.length, 0)],
    ["/api/governance/compare", (data) => {
      assert.equal(data.comparison.base.version, "1.0.0");
      assert.equal(data.comparison.target.version, "1.0.0-rc.3");
    }],
    ["/api/governance/impact?ruleId=OBS-REFERENCE-STATE-001", (data) => assert.equal(data.impact.packageId, "aghr_rc3")],
    ["/api/governance/summary?packageId=aghr", (data) => assert.equal(data.version, "1.0.0")],
    ["/api/governance/summary?packageId=aghr_1_0_0", (data) => assert.equal(data.version, "1.0.0")],
    ["/api/governance/summary?packageId=aghr_1_1_0", (data) => assert.equal(data.version, "1.1.0")],
  ]) {
    const { req, res, getJSON, getStatusCode } = makeMockRequest({ url });
    await handleApiRequest(req, res);
    assert.equal(getStatusCode(), 200, url);
    verify(getJSON());
  }
});

test("M2 Reference Explorer: Compare AGHR 1.0.0 vs AGHR 1.1.0 returns typed structural delta", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/compare?base=aghr&target=aghr_1_1_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(data.comparison);
  assert.equal(data.comparison.base.version, "1.0.0");
  assert.equal(data.comparison.target.version, "1.1.0");
  assert.equal(data.comparison.rulesDelta.addedCount, 7); // 40 rules -> 47 rules
  assert.ok(data.comparison.impactNotice.includes("NEWER != SUPERSEDES"));
});

test("M2 Reference Explorer: Updated 1.2.0 is registered with scoped reference status", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/governance/summary?packageId=aghr_1_2_0" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const summary = getJSON();
  assert.equal(summary.packageId, "aghr_1_2_0");
  assert.equal(summary.version, "1.2.0");
  assert.equal(summary.reference_state, "FINAL_REFERENCE");
  assert.equal(summary.counts.rules, 47);
  assert.equal(summary.release_acceptance, "NOT_GRANTED");
  assert.ok(governanceService.listPackages().some((pkg) => pkg.id === "aghr_1_2_0"));
});

test("M2 Reference Explorer: Impact analysis for modified rule", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/governance/impact?ruleId=AGHR-001&packageId=aghr_1_1_0",
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(data.impact);
  assert.equal(data.impact.ruleId, "AGHR-001");
  assert.equal(data.impact.currentForce, "MUST");
  assert.ok(data.impact.downstreamImpact.count >= 1);
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

test("M3 Intake: Legacy conflict detection retains the explicitly selected 1.2.0 rules", t => {
  const legacyRules = governanceService.getRules({packageId:'aghr_1_2_0'});
  t.mock.method(governanceService,'getRules',()=>legacyRules);
  // Try to propose overriding developer reference with arbitrary advice
  const conflictStmt = "لا يجوز الرجوع إلى المراجع الرسمية للمطور ويجب الاعتماد على التخمين.";
  const cl = classifyStatement(conflictStmt);
  const rec = reconcileWithRules(conflictStmt, cl);
  assert.equal(rec.proposedAction, "REJECT");
  assert.ok(rec.conflictDetected);
});

test("M3 Intake: Legacy submit without server grant is rejected before persistence", async () => {
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
  assert.equal(getStatusCode(), 403);
  const data = getJSON();
  assert.match(data.error,/Legacy writes disabled/);
});

// =============================================================================
// Milestone 4 Tests: Project Adoption Center
// =============================================================================
test("M4 Adoption: Empty discovery when data/ was removed", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/adoption/candidates" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.ok(Array.isArray(data.candidates));
  assert.deepEqual(data.candidates, []);
});

test("M4 Adoption: Prepares adoption plan without silent destruction", async () => {
  const targetCandidate = path.join(PROJECT_ROOT, "docs");
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
  assert.match(data.plan.plannedFiles.find((f) => f.path === "AGENTS.md").proposedContent, /AGHR 1\.0\.0-rc\.3/);
});

// =============================================================================
// Milestone 6 Tests: Governed Staging and Apply
// =============================================================================
test("M6 Governed Staging & Apply: Staging, Precondition Drift, and Authorized Apply", () => {
  const testRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-staging-'));
  const stagingService=new StagingService({storageRoot:path.join(testRoot,'storage')});
  const authority=createWriteAuthority(),owner=authority.createPrincipal({actor:'fixture-owner',role:'governance-owner',installationOwnerVerified:true});
  const permit=scope=>authority.authorize(owner.principal,scope,authority.issueGrant({issuer:owner.principal,principal:owner.principal,scope,expiresAt:Date.now()+60000}));
  const fixtureDir = path.join(testRoot,'project');
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });

  const initialFile = path.join(fixtureDir, "README.md");
  fs.writeFileSync(initialFile, "# Initial Project\nVersion 1.0\n", "utf8");

  // 1. Stage changes
  const stageRequest={
    packetId: "TEST-CP-01",
    targetProjectDir: fixtureDir,
    plannedFiles: [
      {
        path: "README.md",
        proposedContent: "# Initial Project\nVersion 1.0\n## Governed with AGHR\n",
      },
    ],
  };
  const staged = stagingService.createStagingWorkspace(stageRequest,permit(stagingScope('staging.create','TEST-CP-01',fixtureDir,stageRequest.plannedFiles)));
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
  assert.throws(()=>stagingService.applyStagedChanges({stagingId:staged.stagingId,authorizationToken:'AUTHORIZED_BY_PROJECT_OWNER'}),/Authorization denied/);
  const dynamicToken=stagingService.issueAuthorizationToken(staged.stagingId,permit(stagingScope('staging.authorize',staged.stagingId,fixtureDir,staged.files)));
  assert.throws(()=>stagingService.applyStagedChanges({stagingId:staged.stagingId,authorizationToken:dynamicToken}),/grant/);

  // 3. Stale precondition detection: mutate live target before apply
  fs.writeFileSync(initialFile, "# Altered live content while reviewing\n", "utf8");
  assert.throws(
    () =>
      stagingService.applyStagedChanges({
        stagingId: staged.stagingId,
        authorizationToken: dynamicToken,
      }),
    /STALE_PRECONDITION/
  );

  // Restore precondition
  fs.writeFileSync(initialFile, "# Initial Project\nVersion 1.0\n", "utf8");

  // 4. Authorized apply succeeds
  const applyRes = stagingService.applyStagedChanges({
    stagingId: staged.stagingId,
    authorizationToken: dynamicToken,
  },permit(stagingScope('adoption.apply',staged.stagingId,fixtureDir,staged.files)));
  assert.equal(applyRes.status, "APPLY_SUCCESS");

  // Verify file on disk has updated content
  const appliedContent = fs.readFileSync(initialFile, "utf8");
  assert.ok(appliedContent.includes("Governed with AGHR"));

  // 5. Rollback restores original state
  const rollbackRes = stagingService.rollbackBackup({ backupId: applyRes.backupId },permit(stagingScope('adoption.rollback',applyRes.backupId,fixtureDir,stagingService.backupProposal(applyRes.backupId))));
  assert.equal(rollbackRes.status, "ROLLBACK_SUCCESS");
  const rolledBackContent = fs.readFileSync(initialFile, "utf8");
  assert.equal(rolledBackContent, "# Initial Project\nVersion 1.0\n");

  // Clean fixture
  assert.ok(path.resolve(testRoot).startsWith(path.resolve(os.tmpdir())+path.sep+'aghr-staging-'));
  fs.rmSync(testRoot, { recursive: true, force: true });
});

test('T13 every legacy mutation route rejects before reading an untrusted body',async()=>{
  for(const url of ['/api/intake/submit','/api/staging/create','/api/governed-apply','/api/governed-apply/rollback','/api/evaluation/run-suite','/api/evaluation/check-package']){
    const f=makeMockRequest({url,method:'POST',body:{role:'governance-owner',authorizationToken:'AUTHORIZED_BY_PROJECT_OWNER',profile:'T12_OWNER_APPROVED_MOCK'}});
    f.req.on=()=>{throw Error('Forbidden body must not be read');};await handleApiRequest(f.req,f.res);assert.equal(f.getStatusCode(),403,url);
  }
});
