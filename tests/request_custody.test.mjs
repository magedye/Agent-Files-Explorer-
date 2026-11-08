/**
 * tests/request_custody.test.mjs
 * 
 * Test suite for Governed Request Custody lifecycle transitions, standard card validation,
 * and negative failure modes.
 * Implemented under Sovereign Owner Directive: AFE-GOV-REQUEST-CUSTODY-009.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDeferredCard,
  formatMarkdownCard,
  evaluateTransition,
  VALID_STATUSES,
  VALID_REVIEW_POLICIES,
} from "../tools/request_custody.mjs";

const canonicalSampleCard = {
  request_id: "REQ-AFE-QUAL-008-LIVE",
  status: "DEFERRED",
  purpose: "Execute empirical real-agent benchmark across 8 scenarios under tri-mode comparison",
  governing_references: [
    "AFE-GOV-BEHAVIORAL-VALIDITY-008",
    "docs/governance/AFE_GOV_BEHAVIORAL_VALIDITY_008_AUDIT_REPORT.md",
  ],
  evidence: [
    "tools/behavioral_qualification/run_qualification.py (fixtures audited as SYNTHETIC_EVALUATOR_TEST_ONLY)",
    "Unit tests 3/3 passing",
  ],
  reopen_trigger: "Explicit owner budget allocation or approval of local LLM runner",
  review_policy: "EVENT_AND_TIME",
  review_owner: "Project Sovereign Owner",
  next_review_due: "2026-12-01",
  authorization_scope: "NONE_DEFERRED",
  next_permitted_action: "Isolated smoke-test run of 1 scenario in temporary worktree without API billing",
  reference_hash: "sha256-reference-initial-abc123",
};

test("Request Custody: Standard card validation succeeds on compliant card", () => {
  assert.equal(validateDeferredCard(canonicalSampleCard), true);
});

test("Request Custody: Card validation rejects missing mandatory fields or invalid ID format", () => {
  assert.throws(
    () => validateDeferredCard({ ...canonicalSampleCard, request_id: "INVALID_ID" }),
    /INVALID_CARD: Missing or invalid request_id/
  );
  assert.throws(
    () => validateDeferredCard({ ...canonicalSampleCard, purpose: "" }),
    /INVALID_CARD: Missing required purpose/
  );
  assert.throws(
    () => validateDeferredCard({ ...canonicalSampleCard, reopen_trigger: "  " }),
    /INVALID_CARD: Missing required reopen_trigger/
  );
  assert.throws(
    () => validateDeferredCard({ ...canonicalSampleCard, next_review_due: null }),
    /INVALID_CARD: next_review_due/
  );
});

test("Request Custody: Markdown card formatting produces valid GitHub Flavored Markdown table", () => {
  const md = formatMarkdownCard(canonicalSampleCard);
  assert.ok(md.includes("### REQ-AFE-QUAL-008-LIVE:"));
  assert.ok(md.includes("| **Request ID** | `REQ-AFE-QUAL-008-LIVE` |"));
  assert.ok(md.includes("| **Status** | `DEFERRED` |"));
  assert.ok(md.includes("| **Review Policy** | `EVENT_AND_TIME` |"));
  assert.ok(md.includes("| **Next Review Due** | `2026-12-01` |"));
});

// Negative Case 1: Reaching review date without execution authorization
test("Negative Case 1: Reaching review date transitions to READY_FOR_REVIEW, execution fails closed without grant", () => {
  const reviewed = evaluateTransition({
    card: canonicalSampleCard,
    event: "REVIEW_DUE_CHECK",
    currentDate: "2026-12-02", // After next_review_due
  });

  assert.equal(reviewed.status, "READY_FOR_REVIEW");
  assert.equal(reviewed.review_state, "DUE_FOR_OWNER_EVALUATION");

  // Attempting execution directly without authorization fails closed
  assert.throws(
    () => evaluateTransition({
      card: reviewed,
      event: "EXECUTE",
      currentDate: "2026-12-02",
      ownerGrant: null,
    }),
    /BLOCKED_NO_EXECUTION_GRANT/
  );
});

// Negative Case 2: Reopen trigger met with expired authorization
test("Negative Case 2: Reopen trigger met transitions to READY_FOR_REVIEW, execution with expired grant fails closed", () => {
  const triggered = evaluateTransition({
    card: canonicalSampleCard,
    event: "TRIGGER_MET",
    currentDate: "2026-11-15",
  });

  assert.equal(triggered.status, "READY_FOR_REVIEW");
  assert.equal(triggered.trigger_state, "CONDITION_SATISFIED");

  const expiredGrant = {
    id: "GRANT-2026-10-OLD",
    authority: "Sovereign Owner",
    status: "OWNER_APPROVED",
    scope: "REVIEW -> EXECUTE",
    expiresAt: "2026-11-01", // Already expired
  };

  // Attempting authorization transition with expired grant fails
  assert.throws(
    () => evaluateTransition({
      card: triggered,
      event: "AUTHORIZE",
      currentDate: "2026-11-15",
      ownerGrant: expiredGrant,
    }),
    /BLOCKED_EXPIRED_GRANT/
  );

  // Attempting execution with expired grant fails
  assert.throws(
    () => evaluateTransition({
      card: { ...triggered, status: "AUTHORIZED" },
      event: "EXECUTE",
      currentDate: "2026-11-15",
      ownerGrant: expiredGrant,
    }),
    /BLOCKED_EXPIRED_GRANT/
  );
});

// Negative Case 3: Deferred request becomes obsolete or cancelled
test("Negative Case 3: Deferred request cancelled cannot resume or execute", () => {
  const cancelled = evaluateTransition({
    card: canonicalSampleCard,
    event: "CANCEL",
    cancellationReason: "Superseded by local deterministic test suite; live LLM unneeded",
  });

  assert.equal(cancelled.status, "CANCELLED");
  assert.equal(cancelled.cancellation_reason, "Superseded by local deterministic test suite; live LLM unneeded");

  // Attempting to evaluate or execute a cancelled request fails closed
  assert.throws(
    () => evaluateTransition({
      card: cancelled,
      event: "EXECUTE",
      ownerGrant: { status: "OWNER_APPROVED", scope: "ALL" },
    }),
    /BLOCKED_CANCELLED_REQUEST/
  );
  assert.throws(
    () => evaluateTransition({
      card: cancelled,
      event: "TRIGGER_MET",
    }),
    /BLOCKED_CANCELLED_REQUEST/
  );
});

// Negative Case 4: Conflicting sources of state
test("Negative Case 4: Divergent status between card and authoritative register fails closed", () => {
  assert.throws(
    () => evaluateTransition({
      card: canonicalSampleCard, // status: DEFERRED
      event: "REVIEW_DUE_CHECK",
      externalState: { status: "AUTHORIZED" }, // Divergent status!
    }),
    /BLOCKED_STATE_CONFLICT/
  );
});

// Negative Case 5: Resuming after governing reference or scope changed
test("Negative Case 5: Governing reference drift invalidates card pending reconciliation", () => {
  assert.throws(
    () => evaluateTransition({
      card: canonicalSampleCard, // reference_hash: 'sha256-reference-initial-abc123'
      event: "REVIEW_DUE_CHECK",
      workspaceReferences: {
        "REQ-AFE-QUAL-008-LIVE": "sha256-reference-MODIFIED-def456", // Drifted!
      },
    }),
    /BLOCKED_REFERENCE_DRIFT/
  );
});

// Negative Case 6: Attempting transition from READY_FOR_REVIEW to AUTHORIZED without valid basis
test("Negative Case 6: Transition to AUTHORIZED without valid owner grant fails closed", () => {
  const readyCard = { ...canonicalSampleCard, status: "READY_FOR_REVIEW" };

  // Attempting AUTHORIZE with no grant
  assert.throws(
    () => evaluateTransition({
      card: readyCard,
      event: "AUTHORIZE",
      ownerGrant: null,
    }),
    /BLOCKED_UNAUTHORIZED_TRANSITION: Cannot transition to AUTHORIZED without an explicit owner grant/
  );

  // Attempting AUTHORIZE with unapproved grant
  assert.throws(
    () => evaluateTransition({
      card: readyCard,
      event: "AUTHORIZE",
      ownerGrant: { status: "PENDING_REVIEW", scope: "FULL" },
    }),
    /BLOCKED_UNAUTHORIZED_TRANSITION: Grant status \(PENDING_REVIEW\) is not OWNER_APPROVED/
  );

  // Attempting AUTHORIZE with empty scope
  assert.throws(
    () => evaluateTransition({
      card: readyCard,
      event: "AUTHORIZE",
      ownerGrant: { status: "OWNER_APPROVED", scope: "" },
    }),
    /BLOCKED_UNAUTHORIZED_TRANSITION: Owner grant must specify an explicit scope/
  );
});

// Positive Case: Continuous valid grant per GOV-004 allows bounded multi-step execution but stops before ungranted publication
test("Positive Case: Continuous valid grant supports bounded multi-step execution and enforces publication boundary", () => {
  const readyCard = { ...canonicalSampleCard, status: "READY_FOR_REVIEW" };
  const validGrant = {
    id: "GRANT-AFE-009-BOUNDED",
    status: "OWNER_APPROVED",
    scope: "REVIEW -> RECONCILE -> IMPLEMENT_IN_SCOPE -> VERIFY",
    expiresAt: "2026-12-31",
  };

  const authorized = evaluateTransition({
    card: readyCard,
    event: "AUTHORIZE",
    ownerGrant: validGrant,
    currentDate: "2026-11-08",
  });

  assert.equal(authorized.status, "AUTHORIZED");
  assert.equal(authorized.authorization_scope, validGrant.scope);

  // Execution of an authorized in-scope action succeeds without micro-reauthorization (GOV-004)
  const executedStep = evaluateTransition({
    card: authorized,
    event: "EXECUTE",
    ownerGrant: validGrant,
    actionAttempted: "IMPLEMENT_IN_SCOPE",
    currentDate: "2026-11-08",
  });

  assert.equal(executedStep.last_executed_action, "IMPLEMENT_IN_SCOPE");

  // Attempting publication/deployment without explicit publication grant fails closed (GOV-015/020)
  assert.throws(
    () => evaluateTransition({
      card: authorized,
      event: "EXECUTE",
      ownerGrant: validGrant,
      actionAttempted: "git push origin main",
      currentDate: "2026-11-08",
    }),
    /BLOCKED_UNAUTHORIZED_PUBLICATION/
  );
});
