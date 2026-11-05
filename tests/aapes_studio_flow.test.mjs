import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createUnifiedStudio } from '../server/studio/unified-runtime.mjs';

test('AAPES Studio Complete 7-Step Integration & Security Qualification', async () => {
  const python = path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
  const storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aghr-aapes-studio-flow-'));
  
  const studio = await createUnifiedStudio({
    python,
    storageRoot,
    actor: 'aapes-test-operator'
  });

  const server = http.createServer(studio.handle);
  studio.attachStreams(server);
  await new Promise(r => server.listen(0, '127.0.0.1', r));

  const origin = 'http://127.0.0.1:' + server.address().port;
  const token = studio.session.token;

  const request = async (method, route, body, headers = {}, cred = token) => {
    const res = await fetch(origin + route, {
      method,
      headers: {
        ...(cred ? { 'X-Studio-Token': cred } : {}),
        'X-Studio-View': 'extended',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { status: res.status, headers: res.headers, text, data };
  };

  try {
    // -------------------------------------------------------------------------
    // Priority 2: Security & Authorization Verification
    // -------------------------------------------------------------------------
    // Unauthenticated request to /api/v1/aapes/framework must be rejected
    const unauthFramework = await request('GET', '/api/v1/aapes/framework', undefined, {}, null);
    assert.ok([401, 403].includes(unauthFramework.status), `Expected 401/403 for unauth framework, got ${unauthFramework.status}`);

    // Unauthenticated request to /api/v1/aapes/review must be rejected
    const unauthReview = await request('POST', '/api/v1/aapes/review', { policy_text: 'test' }, {}, '0'.repeat(64));
    assert.ok([401, 403].includes(unauthReview.status), `Expected 401/403 for forged token, got ${unauthReview.status}`);

    // Mutation on read-only aapes-candidate workspace must be rejected with 403
    const candidateWrite = await request('POST', '/api/v1/workspaces/aapes-candidate/instructions', { foo: 'bar' });
    assert.equal(candidateWrite.status, 403, 'Mutations on aapes-candidate must return 403');

    // -------------------------------------------------------------------------
    // Step 1: Open accepted Studio interface
    // -------------------------------------------------------------------------
    // Authenticate session and get operational context
    const sessionRes = await request('GET', '/api/v1/session');
    assert.equal(sessionRes.status, 200);
    assert.equal(sessionRes.data.data.authenticated_actor, 'aapes-test-operator');

    const opContext = await request('GET', '/api/v1/operational-context');
    assert.equal(opContext.status, 200);
    assert.equal(opContext.data.data.draft_workspace, 'rc3-local');

    // -------------------------------------------------------------------------
    // Step 2: Access the AAPES candidate
    // -------------------------------------------------------------------------
    const workspacesRes = await request('GET', '/api/v1/workspaces');
    assert.equal(workspacesRes.status, 200);
    const workspaces = workspacesRes.data.data;
    assert.ok(Array.isArray(workspaces));
    const aapesWs = workspaces.find(w => w.id === 'aapes-candidate');
    assert.ok(aapesWs, 'aapes-candidate must be listed in /api/v1/workspaces');
    assert.equal(aapesWs.read_only, true);
    assert.equal(aapesWs.package_version, '2.1.0-rc.1');

    // -------------------------------------------------------------------------
    // Step 3: Inspect its 12 domains and 48 requirements
    // -------------------------------------------------------------------------
    // Fetch framework definition
    const fwRes = await request('GET', '/api/v1/aapes/framework');
    assert.equal(fwRes.status, 200);
    const fw = fwRes.data.data.framework;
    assert.equal(fw.domains.length, 12, 'Must have exactly 12 domains');
    assert.equal(fw.gate_order.length, 8, 'Must have 8 stage gates (G0-G7)');
    const totalReqsInFw = fw.domains.reduce((acc, d) => acc + d.requirements.length, 0);
    assert.equal(totalReqsInFw, 48, 'Must have exactly 48 requirements');

    // Fetch requirements from candidate workspace
    const reqsRes = await request('GET', '/api/v1/workspaces/aapes-candidate/instructions');
    assert.equal(reqsRes.status, 200);
    const items = reqsRes.data.data;
    assert.equal(items.length, 48, 'Instructions endpoint must return 48 ItemView objects');

    // Inspect first requirement
    const req1 = items.find(i => i.item.id === 'AAPES-REQ-001');
    assert.ok(req1);
    assert.equal(req1.item.force, 'MUST');
    assert.equal(req1.item.defaultTier, 'P0');
    assert.equal(req1.item.domain, 'D01');
    assert.ok(req1.item.statement.length > 10);
    assert.equal(req1.validation_status, 'REVIEW_CANDIDATE');

    // Inspect individual requirement endpoint
    const singleReqRes = await request('GET', '/api/v1/workspaces/aapes-candidate/instructions/AAPES-REQ-001');
    assert.equal(singleReqRes.status, 200);
    assert.equal(singleReqRes.data.data.item.id, 'AAPES-REQ-001');

    // Verify filter by priority
    const p0Reqs = await request('GET', '/api/v1/workspaces/aapes-candidate/instructions?priority=P0');
    assert.equal(p0Reqs.status, 200);
    assert.ok(p0Reqs.data.data.length > 0);
    assert.ok(p0Reqs.data.data.every(r => r.priority_tier === 'P0'));

    // -------------------------------------------------------------------------
    // Step 4: Run a policy review
    // -------------------------------------------------------------------------
    const compoundPolicy = 'The agent MUST validate all tokens and also MUST log every request to external service.';
    const reviewRes = await request('POST', '/api/v1/aapes/review', {
      policy_text: compoundPolicy,
      rule_id: 'AAPES-REQ-TEST'
    });
    assert.equal(reviewRes.status, 200);
    const review = reviewRes.data.data;
    assert.equal(review.proposal.action, 'SPLIT', 'Compound rule must produce SPLIT proposal');
    assert.ok(review.findings.some(f => f.domain === 'D01' && f.classification === 'FACT'));
    assert.ok(review.proposal.diff.includes('--- a/AAPES-REQ-TEST.txt'));

    // Test ambiguous policy
    const ambigPolicy = 'The agent MUST maintain reasonably safe tools and appropriate response time.';
    const ambigRes = await request('POST', '/api/v1/aapes/review', {
      policy_text: ambigPolicy,
      rule_id: 'AAPES-AMBIG-TEST'
    });
    assert.equal(ambigRes.status, 200);
    assert.ok(ambigRes.data.data.ambiguities.length >= 2, 'Must detect ambiguous adjectives');
    assert.equal(ambigRes.data.data.proposal.action, 'REWRITE');

    // -------------------------------------------------------------------------
    // Step 5: Perform a readiness assessment
    // -------------------------------------------------------------------------
    // Test scenario: high diagnostic score but failed critical P0 gate
    // Setting all domains to 4 except D07 (Tool boundaries, P0) which is 1
    const scoresWithBlocker = {};
    fw.domains.forEach(d => {
      scoresWithBlocker[d.id] = { maturity: d.id === 'D07' ? 1 : 4, evidence_refs: [] };
    });

    const assessBlockedRes = await request('POST', '/api/v1/aapes/assess', {
      risk_level: 'R2',
      scores: scoresWithBlocker
    });
    assert.equal(assessBlockedRes.status, 200);
    const assessBlocked = assessBlockedRes.data.data.assessment;
    assert.ok(assessBlocked.diagnostic_score >= 85, 'Diagnostic score is mathematically high');
    assert.equal(assessBlocked.qualification, 'BLOCKED', 'Critical gate failure MUST block qualification despite high score');
    assert.ok(assessBlocked.blockers.some(b => b.includes('D07')));

    // Test scenario: fully qualified R2
    const scoresQualified = {};
    fw.domains.forEach(d => {
      scoresQualified[d.id] = {
        maturity: 4,
        evidence_refs: [`ev://${d.id}/passed`],
        verified_by: "Independent Qualified Assessor",
        verification_ref: `AUDIT-2026-R2-${d.id}`
      };
    });
    const assessQualRes = await request('POST', '/api/v1/aapes/assess', {
      risk_level: 'R2',
      scores: scoresQualified,
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
        G3: { status: "PASS", evidence_refs: ["G3-REF"] },
        G4: { status: "PASS", evidence_refs: ["G4-REF"] },
        G5: { status: "PASS", evidence_refs: ["G5-REF"] },
        G6: { status: "PASS", evidence_refs: ["G6-REF"] }
      },
      owner_approval: {
        status: "GRANTED",
        approval_ref: "OWNER-AUTH-R2",
        approver: "Authorized Studio Owner"
      }
    });
    assert.equal(assessQualRes.status, 200);
    const assessQual = assessQualRes.data.data.assessment;
    assert.equal(assessQual.qualification, 'READY_FOR_AUTHORIZED_REVIEW');
    assert.equal(assessQual.blockers.length, 0);

    // -------------------------------------------------------------------------
    // Step 6: View the compatibility matrix and evidence
    // -------------------------------------------------------------------------
    const matrixRes = await request('GET', '/api/v1/aapes/matrix');
    assert.equal(matrixRes.status, 200);
    const matrix = matrixRes.data.data;
    assert.equal(matrix.summary.total, 48);
    assert.equal(matrix.summary.covered, 43);
    assert.equal(matrix.summary.partial, 5);
    assert.equal(matrix.summary.missing, 0);
    assert.equal(matrix.summary.conflict, 0);
    assert.equal(matrix.requirements.length, 48);

    // Test CSV download streaming
    const matrixCsvRes = await request('GET', '/api/v1/aapes/matrix?format=csv');
    assert.equal(matrixCsvRes.status, 200);
    assert.ok(matrixCsvRes.text.includes('requirement_id,domain,title,normative_level'));
    assert.ok(matrixCsvRes.text.includes('AAPES-REQ-001'));

    // -------------------------------------------------------------------------
    // Step 7: Prepare a governed Draft Change Package
    // -------------------------------------------------------------------------
    const proposedRuleText = 'The PEP MUST verify caller write grants before tool invocation; otherwise the call MUST fail closed and return 403.';

    const proposeCpRes = await request('POST', '/api/v1/aapes/propose-change-package', {
      rule_id: 'AAPES-PROP-001',
      title: 'AAPES Governed Policy Proposal: AAPES-PROP-001',
      proposed_text: proposedRuleText,
      reason: 'Atomicity and fail-closed state optimization'
    });
    assert.equal(proposeCpRes.status, 201, `Expected 201 Created, got ${proposeCpRes.status}: ${proposeCpRes.text}`);
    const cpCreated = proposeCpRes.data.data.change_package;
    assert.ok(cpCreated.id.startsWith('CP-'));
    assert.equal(cpCreated.status, 'draft');
    assert.equal(proposeCpRes.data.data.workspace_id, 'rc3-local');

    // Verify that the created CP is retrievable in rc3-local draft queue
    const draftListRes = await request('GET', '/api/v1/workspaces/rc3-local/change-packages');
    assert.equal(draftListRes.status, 200);
    const drafts = draftListRes.data.data;
    const found = drafts.find(d => d.id === cpCreated.id);
    assert.ok(found, 'Created draft CP must appear in rc3-local draft queue');
    assert.equal(found.title, 'AAPES Governed Policy Proposal: AAPES-PROP-001');

    // -------------------------------------------------------------------------
    // Synthetic Oracles Verification
    // -------------------------------------------------------------------------
    const evalRes = await request('POST', '/api/v1/aapes/evaluate', {});
    assert.equal(evalRes.status, 200);
    assert.equal(evalRes.data.data.synthetic_tests.passed_count, 5);
    assert.equal(evalRes.data.data.synthetic_tests.failed_count, 0);
    assert.equal(evalRes.data.data.synthetic_tests.overall_status, 'PASS');

  } finally {
    server.closeAllConnections();
    await new Promise(r => server.close(r));
    await studio.close();
  }
});
