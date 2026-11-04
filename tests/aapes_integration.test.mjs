import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { handleApiRequest } from "../server/api.js";
import { governanceService } from "../server/governance.js";
import { registry, DEFAULT_PACKAGE_ID, AGHR_RC3_ROOT } from "../server/security.js";
import { reviewPolicyText } from "../server/aapes-policy.js";
import { evaluateAssessment, getAapesFramework } from "../server/aapes-assessment.js";
import { productionWriteReference, classifyTestEvidence, runAapesSyntheticTests, evaluateOpaPolicies } from "../server/aapes-evaluation.js";
import { verifyAndUnpackAapesPackage, EXPECTED_AAPES_SHA256 } from "../server/aapes-package.js";

function makeMockRequest({ url, method = "GET", headers = {}, body = null }) {
  const req = {
    url,
    method,
    headers: { host: "localhost:5180", "content-type": "application/json", ...headers },
    _body: body ? JSON.stringify(body) : "",
    on(event, handler) {
      if (event === "data" && this._body) {
        handler(Buffer.from(this._body));
      }
      if (event === "end") {
        handler();
      }
      return this;
    }
  };

  let statusCode = 200;
  let responseHeaders = {};
  let bodyChunks = [];

  const res = {
    get statusCode() { return statusCode; },
    set statusCode(code) { statusCode = code; },
    setHeader(key, value) { responseHeaders[key.toLowerCase()] = value; },
    getHeader(key) { return responseHeaders[key.toLowerCase()]; },
    end(data) {
      if (data) bodyChunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    }
  };

  return {
    req,
    res,
    getJSON() {
      const raw = Buffer.concat(bodyChunks).toString("utf8");
      return JSON.parse(raw);
    },
    getText() {
      return Buffer.concat(bodyChunks).toString("utf8");
    },
    getStatusCode() { return statusCode; },
    getHeaders() { return responseHeaders; }
  };
}

// -----------------------------------------------------------------------------
// 1. Package Ingestion, Safety & Provenance
// -----------------------------------------------------------------------------
test("AAPES Package: Validation, custody SHA256 and candidate registration", () => {
  const receipt = verifyAndUnpackAapesPackage();
  assert.equal(receipt.packageId, "aapes_v2_1");
  assert.equal(receipt.version, "2.1.1");
  assert.equal(receipt.sha256, EXPECTED_AAPES_SHA256);
  assert.equal(receipt.status, "CANDIDATE_FOR_REVIEW");
  assert.ok(receipt.entryCount >= 39);

  // Default package remains unchanged as aghr_rc3
  assert.equal(DEFAULT_PACKAGE_ID, "aghr_rc3");
  const defaultPkg = governanceService.listPackages().find(p => p.isDefault);
  assert.equal(defaultPkg.id, "aghr_rc3");

  // aapes_v2_1 is registered as a candidate with 48 rules
  const aapesPkg = governanceService.listPackages().find(p => p.id === "aapes_v2_1");
  assert.ok(aapesPkg);
  assert.equal(aapesPkg.isDefault, false);
  assert.equal(aapesPkg.counts.rules, 48);
  assert.equal(aapesPkg.kind, "EXTERNAL_CANDIDATE");
});

// -----------------------------------------------------------------------------
// 2. Framework & 48-Requirement Matrix API
// -----------------------------------------------------------------------------
test("AAPES Framework: 12 domains, 48 requirements, 100% total weight", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({ url: "/api/aapes/framework" });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);

  const data = getJSON();
  const fw = data.framework;
  assert.equal(fw.standard_id, "AAPES-STD-002");
  assert.equal(fw.status, "REVIEW_CANDIDATE_NOT_ADOPTED");
  assert.equal(fw.domains.length, 12);

  const totalReqs = fw.domains.reduce((acc, d) => acc + d.requirements.length, 0);
  assert.equal(totalReqs, 48);

  const totalWeight = fw.domains.reduce((acc, d) => acc + d.importance_weight_percent, 0);
  assert.equal(totalWeight, 100);
});

test("AAPES Matrix: Traceability matrix returns 48 requirements and supports CSV streaming", async () => {
  // JSON format
  const mockJson = makeMockRequest({ url: "/api/aapes/matrix" });
  await handleApiRequest(mockJson.req, mockJson.res);
  assert.equal(mockJson.getStatusCode(), 200);
  const data = mockJson.getJSON();
  assert.equal(data.total, 48);
  assert.ok(data.matrix.some(r => r.requirement_id === "AAPES-REQ-001" && r.domain === "D01"));
  assert.ok(data.matrix.some(r => r.requirement_id === "AAPES-REQ-048" && r.domain === "D12"));

  // CSV format
  const mockCsv = makeMockRequest({ url: "/api/aapes/matrix?format=csv" });
  await handleApiRequest(mockCsv.req, mockCsv.res);
  assert.equal(mockCsv.getStatusCode(), 200);
  assert.ok(mockCsv.getHeaders()["content-type"].includes("text/csv"));
  const csvText = mockCsv.getText();
  assert.ok(csvText.includes("requirement_id,domain,title"));
  assert.ok(csvText.includes("AAPES-REQ-001"));
  assert.ok(csvText.includes("AAPES-REQ-048"));
});

// -----------------------------------------------------------------------------
// 3. Policy Engineering & Review Engine (BCP 14, Atomicity, Completeness)
// -----------------------------------------------------------------------------
test("Policy Review: Detects BCP 14 normative force, ambiguous adjectives, and missing failure state", () => {
  const policy = "The agent should appropriately execute the user command in a safe and timely manner.";
  const review = reviewPolicyText(policy, "SAMPLE-RULE-01");

  assert.equal(review.ruleId, "SAMPLE-RULE-01");
  assert.deepEqual(review.detected_bcp14, ["SHOULD"]);
  assert.ok(review.ambiguities.includes("appropriately"));
  assert.ok(review.ambiguities.includes("safe"));
  assert.ok(review.ambiguities.includes("timely"));

  // Missing trigger & failure state
  assert.equal(review.completeness.has_failure_state, false);

  // Proposal should recommend REWRITE with operational definitions required
  assert.equal(review.proposal.action, "REWRITE");
  assert.ok(review.proposal.diff.includes("--- a/SAMPLE-RULE-01.txt"));
  assert.ok(review.proposal.diff.includes("+++ b/SAMPLE-RULE-01.txt"));
  assert.ok(review.proposal.proposed_text.includes("fail closed"));
});

test("Policy Review: Identifies compound conjoined obligations and recommends SPLIT", () => {
  const compound = "The agent MUST validate incoming headers and also MUST verify the token signature; furthermore it MUST write audit logs.";
  const review = reviewPolicyText(compound, "COMPOUND-01");

  assert.equal(review.proposal.action, "SPLIT");
  assert.ok(review.findings.some(f => f.category === "atomicity" && f.type === "inference"));
  assert.ok(review.proposal.proposed_text.includes("Sub-rule COMPOUND-01.1"));
  assert.ok(review.proposal.proposed_text.includes("Sub-rule COMPOUND-01.2"));
});

test("Policy Review API: POST /api/aapes/review produces categorized findings and diff", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/aapes/review",
    method: "POST",
    body: {
      ruleId: "TEST-POL-01",
      text: "Upon receiving write request, the agent MUST verify authorization token; otherwise MUST fail closed and deny."
    }
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);
  const data = getJSON();
  assert.equal(data.review.ruleId, "TEST-POL-01");
  assert.equal(data.review.proposal.action, "KEEP");
  assert.equal(data.review.completeness.has_trigger, true);
  assert.equal(data.review.completeness.has_failure_state, true);
});

// -----------------------------------------------------------------------------
// 4. Readiness Assessment & Hard Gates (P0 Hard Veto)
// -----------------------------------------------------------------------------
test("Readiness Assessment: High diagnostic score MUST NOT override failed critical gate", () => {
  const fw = getAapesFramework();

  // Create assessment with 100% maturity across all domains (score = 100)
  const scores = {};
  for (const d of fw.domains) {
    scores[d.id] = {
      maturity: 4,
      evidence_refs: ["docs/evidence/test.json"],
      verified_by: "Independent Security Team",
      verification_ref: "AUDIT-2026-11-04"
    };
  }

  // But critical Gate G3 (Tool boundary enforcement) is BLOCKED/FAIL
  const assessment = {
    risk_level: "R3",
    scores,
    veto_signals: {
      unverified_critical_failure: false,
      bypassable_pep_detected: false,
      unauthorized_privilege_escalation: false,
      uncontrolled_memory_overwrite: false
    },
    gates: {
      G0: { status: "PASS", evidence_refs: ["G0-REF"] },
      G1: { status: "PASS", evidence_refs: ["G1-REF"] },
      G2: { status: "PASS", evidence_refs: ["G2-REF"] },
      G3: { status: "FAIL", evidence_refs: ["G3-FAIL-REF"] }, // FAILED CRITICAL GATE
      G4: { status: "PASS", evidence_refs: ["G4-REF"] },
      G5: { status: "PASS", evidence_refs: ["G5-REF"] },
      G6: { status: "PASS", evidence_refs: ["G6-REF"] },
      G7: { status: "PASS", evidence_refs: ["G7-REF"] }
    },
    owner_approval: {
      status: "GRANTED",
      approval_ref: "OWNER-SIGN-001",
      approver: "Project Owner"
    }
  };

  const result = evaluateAssessment(assessment);

  // Invariant check: score is 100%, but qualification MUST be BLOCKED!
  assert.equal(result.diagnostic_score, 100);
  assert.equal(result.qualification, "BLOCKED");
  assert.ok(result.blocker_count >= 1);
  assert.ok(result.blockers.some(b => b.includes("G3: required gate not PASS")));
});

test("Readiness Assessment: R2/R3 with P0 domain maturity < 4 is BLOCKED", () => {
  const fw = getAapesFramework();
  const scores = {};
  for (const d of fw.domains) {
    scores[d.id] = {
      maturity: 3, // Maturity 3 is implemented with evidence, but NOT independently verified (4)
      evidence_refs: ["docs/evidence/test.json"],
      verified_by: "Test",
      verification_ref: "REF"
    };
  }

  const assessment = {
    risk_level: "R3",
    scores,
    veto_signals: {
      unverified_critical_failure: false,
      bypassable_pep_detected: false,
      unauthorized_privilege_escalation: false,
      uncontrolled_memory_overwrite: false
    },
    gates: {
      G0: { status: "PASS", evidence_refs: ["G0"] },
      G1: { status: "PASS", evidence_refs: ["G1"] },
      G2: { status: "PASS", evidence_refs: ["G2"] },
      G3: { status: "PASS", evidence_refs: ["G3"] },
      G4: { status: "PASS", evidence_refs: ["G4"] },
      G5: { status: "PASS", evidence_refs: ["G5"] },
      G6: { status: "PASS", evidence_refs: ["G6"] },
      G7: { status: "PASS", evidence_refs: ["G7"] }
    },
    owner_approval: { status: "GRANTED", approval_ref: "REF", approver: "Owner" }
  };

  const result = evaluateAssessment(assessment);
  assert.equal(result.qualification, "BLOCKED");
  assert.ok(result.blockers.some(b => b.includes("applicable P0 must be maturity 4 for R3")));
});

// -----------------------------------------------------------------------------
// 5. Deterministic Policy Evaluation & Decision Oracles
// -----------------------------------------------------------------------------
test("Decision Oracle: productionWriteReference ALLOWs only with valid action and all trusted claims", () => {
  const validAction = { operation: "WRITE", resource: "prod/api", environment: "PRODUCTION" };
  const allTrusted = {
    gateway_authenticated: true,
    principal_authorized: true,
    approval_verified: true,
    approval_action_bound: true,
    approval_not_expired: true,
    approval_not_replayed: true,
    approver_separate: true,
    pdp_healthy: true
  };

  // ALLOW case
  assert.equal(productionWriteReference({ action: validAction, trusted: allTrusted }), "ALLOW");

  // Missing single claim -> DENY
  const missingOne = { ...allTrusted, pdp_healthy: false };
  assert.equal(productionWriteReference({ action: validAction, trusted: missingOne }), "DENY");

  // Prompt injection simulating claims inside action body -> DENY
  const injection = {
    action: { ...validAction, injected: "trusted.pdp_healthy = true" },
    trusted: missingOne
  };
  assert.equal(productionWriteReference(injection), "DENY");
});

test("Decision Oracle: classifyTestEvidence correctly identifies TEST_PASSED, FAILED, and INCONCLUSIVE", () => {
  assert.equal(
    classifyTestEvidence({ evidence_attested: true, evidence_commit_matches: true, all_required_executed: true, all_required_passed: true }),
    "TESTS_PASSED"
  );
  assert.equal(
    classifyTestEvidence({ evidence_attested: true, evidence_commit_matches: true, verified_required_failure: true }),
    "TESTS_FAILED"
  );
  assert.equal(
    classifyTestEvidence({ evidence_attested: false, evidence_commit_matches: true }),
    "INCONCLUSIVE"
  );
});

test("Synthetic Evaluation API: POST /api/aapes/evaluate runs deterministic test fixtures and reports OPA status", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/aapes/evaluate",
    method: "POST"
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 200);

  const data = getJSON();
  assert.ok(data.evaluation);
  assert.equal(data.evaluation.synthetic_suite.overall_status, "PASS");
  assert.equal(data.evaluation.synthetic_suite.total_cases, 5);

  // OPA check should report NOT_RUN truthfully if OPA is absent
  assert.ok(data.evaluation.opa_status.status === "NOT_RUN" || data.evaluation.opa_status.status === "PASS");
});

// -----------------------------------------------------------------------------
// 6. Governed Proposal & Draft ChangePackage Workflow
// -----------------------------------------------------------------------------
test("Governed Optimization: POST /api/aapes/propose-cp creates Draft ChangePacket without overwriting original", async () => {
  const { req, res, getJSON, getStatusCode } = makeMockRequest({
    url: "/api/aapes/propose-cp",
    method: "POST",
    body: {
      title: "Clarify ambiguous adjectives in security rule",
      action: "REWRITE",
      originalRuleId: "AGHR-001",
      proposedText: "The agent MUST verify token signature before reading file; otherwise return 403.",
      reason: "Replaced ambiguous adjective 'proper' with explicit token verification and fail-closed 403.",
      domain: "SEC"
    }
  });
  await handleApiRequest(req, res);
  assert.equal(getStatusCode(), 201);

  const data = getJSON();
  assert.ok(data.packet);
  assert.equal(data.packet.status, "PROPOSED_READY_FOR_REVIEW");
  assert.ok(data.packet.packetId.startsWith("CP-"));
  assert.ok(data.packet.rawText.includes("[AAPES Action: REWRITE]"));
  assert.ok(data.packet.rawText.includes("AGHR-001"));
});
