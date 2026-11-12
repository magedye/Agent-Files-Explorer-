/**
 * tests/reconcile.test.mjs
 *
 * Regression + semantic-contract tests for the D3 integrative fix to
 * `reconcileWithRules` (server/intake.js) and the polarity/conditional fields
 * added to `classifyStatement`.
 *
 * Covers: CONTRADICTION vs WEAKENING vs CONSISTENT, the anti-conflation
 * requirement (NOT_REQUIRED != MUST_NOT, SHOULD_NOT != MUST_NOT), conditional
 * conflict routing to review (never a final REJECT on a conditional), and
 * backward compatibility of `conflictDetected` / `proposedAction: "REJECT"`.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { classifyStatement, reconcileWithRules } from "../server/intake.js";
import { governanceService } from "../server/governance.js";

/** Build a classification object directly (controlled force/conditional). */
function classify(force, { conditional = false } = {}) {
  return { domain: "REQ", force, locus: "OPERATING_PROCEDURE", intent: "ADD_RULE", scope: "PROJECT", conditional };
}

/** Reconcile a statement against a single mocked rule. */
function reconcileAgainst(rule, proposalForce, opts = {}) {
  return reconcileWithRules(opts.statement || `proposal concerning ${rule.id}`, classify(proposalForce, opts));
}

function rule(id, force, title = "Mock Rule") {
  return { id, force, title, text: `${title} body for keyword overlap testing` };
}

// ---------------------------------------------------------------------------
// D3 — CONTRADICTION (positive): opposite polarity at binding/recommended rank
// ---------------------------------------------------------------------------
test("D3: MUST rule vs MUST_NOT proposal → CONTRADICTION (REJECT)", (t) => {
  const r = rule("GOV-901", "MUST");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "MUST_NOT");
  assert.equal(rec.conflictDetected, true);
  assert.equal(rec.conflictType, "CONTRADICTION");
  assert.equal(rec.proposedAction, "REJECT");
});

test("D3: MUST_NOT rule vs MUST proposal → CONTRADICTION (REJECT)", (t) => {
  const r = rule("GOV-902", "MUST_NOT");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "MUST");
  assert.equal(rec.conflictDetected, true);
  assert.equal(rec.conflictType, "CONTRADICTION");
  assert.equal(rec.proposedAction, "REJECT");
});

test("D3: MUST rule vs SHOULD_NOT proposal → CONTRADICTION", (t) => {
  const r = rule("GOV-903", "MUST");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "SHOULD_NOT");
  assert.equal(rec.conflictDetected, true);
  assert.equal(rec.conflictType, "CONTRADICTION");
});

test("D3: SHOULD rule vs SHOULD_NOT proposal → CONTRADICTION", (t) => {
  const r = rule("GOV-904", "SHOULD");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "SHOULD_NOT");
  assert.equal(rec.conflictDetected, true);
  assert.equal(rec.conflictType, "CONTRADICTION");
});

test("D3: SHOULD rule vs MUST_NOT proposal → CONTRADICTION", (t) => {
  const r = rule("GOV-905", "SHOULD");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "MUST_NOT");
  assert.equal(rec.conflictDetected, true);
  assert.equal(rec.conflictType, "CONTRADICTION");
});

// ---------------------------------------------------------------------------
// D3 — WEAKENING (positive): downgrade/removal of a positive obligation
// ---------------------------------------------------------------------------
test("D3: MUST rule vs NOT_REQUIRED proposal → WEAKENING (review, not silent)", (t) => {
  const r = rule("GOV-906", "MUST");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "NOT_REQUIRED");
  assert.equal(rec.conflictDetected, false);
  assert.equal(rec.conflictType, "WEAKENING");
  assert.equal(rec.requiresReview, true);
  assert.equal(rec.proposedAction, "WEAKENING_REVIEW");
});

test("D3: SHOULD rule vs NOT_REQUIRED proposal → WEAKENING", (t) => {
  const r = rule("GOV-907", "SHOULD");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "NOT_REQUIRED");
  assert.equal(rec.conflictType, "WEAKENING");
  assert.equal(rec.requiresReview, true);
  assert.equal(rec.proposedAction, "WEAKENING_REVIEW");
});

test("D3: MUST rule vs SHOULD proposal → WEAKENING", (t) => {
  const r = rule("GOV-908", "MUST");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "SHOULD");
  assert.equal(rec.conflictType, "WEAKENING");
  assert.equal(rec.requiresReview, true);
  assert.equal(rec.proposedAction, "WEAKENING_REVIEW");
});

test("D3: SHOULD rule vs MAY proposal → WEAKENING", (t) => {
  const r = rule("GOV-909", "SHOULD");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "MAY");
  assert.equal(rec.conflictType, "WEAKENING");
  assert.equal(rec.requiresReview, true);
  assert.equal(rec.proposedAction, "WEAKENING_REVIEW");
});

// ---------------------------------------------------------------------------
// D3 — CONSISTENT (negative): the anti-conflation requirement
// ---------------------------------------------------------------------------
test("D3: MUST_NOT rule vs NOT_REQUIRED proposal → CONSISTENT (NOT_REQUIRED != MUST_NOT)", (t) => {
  const r = rule("GOV-910", "MUST_NOT");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "NOT_REQUIRED");
  assert.equal(rec.conflictDetected, false);
  assert.equal(rec.conflictType, null);
  assert.equal(rec.requiresReview, false);
});

test("D3: MUST_NOT rule vs SHOULD_NOT proposal → CONSISTENT (SHOULD_NOT != MUST_NOT)", (t) => {
  const r = rule("GOV-911", "MUST_NOT");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "SHOULD_NOT");
  assert.equal(rec.conflictDetected, false);
  assert.equal(rec.conflictType, null);
  assert.equal(rec.requiresReview, false);
});

test("D3: MUST rule vs MUST proposal → CONSISTENT (no conflict)", (t) => {
  const r = rule("GOV-912", "MUST");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "MUST");
  assert.equal(rec.conflictDetected, false);
  assert.equal(rec.requiresReview, false);
});

test("D3: MUST_NOT rule vs MUST_NOT proposal → CONSISTENT", (t) => {
  const r = rule("GOV-913", "MUST_NOT");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "MUST_NOT");
  assert.equal(rec.conflictDetected, false);
  assert.equal(rec.requiresReview, false);
});

test("D3: SHOULD rule vs SHOULD proposal → CONSISTENT", (t) => {
  const r = rule("GOV-914", "SHOULD");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "SHOULD");
  assert.equal(rec.conflictDetected, false);
  assert.equal(rec.requiresReview, false);
});

// ---------------------------------------------------------------------------
// D3 — conditional conflict: never a final REJECT on a conditional
// ---------------------------------------------------------------------------
test("D3: MUST rule vs conditional MUST_NOT → REVIEW_REQUIRED (not REJECT)", (t) => {
  const r = rule("GOV-915", "MUST");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "MUST_NOT", { conditional: true });
  assert.equal(rec.conflictDetected, true);
  assert.equal(rec.conflictType, "CONTRADICTION");
  assert.equal(rec.proposedAction, "REVIEW_REQUIRED");
  assert.equal(rec.requiresReview, true);
});

test("D3: ambiguous (REVIEW_REQUIRED) statement with related rules → REVIEW_REQUIRED (not auto-conflict)", (t) => {
  const r = rule("GOV-916", "MUST");
  t.mock.method(governanceService, "getRules", () => [r]);
  const rec = reconcileAgainst(r, "REVIEW_REQUIRED");
  assert.equal(rec.conflictDetected, false);
  assert.equal(rec.conflictType, null);
  assert.equal(rec.proposedAction, "REVIEW_REQUIRED");
  assert.equal(rec.requiresReview, true);
});

// ---------------------------------------------------------------------------
// D3 — backward compatibility: legacy REJECT path still works end-to-end
// ---------------------------------------------------------------------------
test("D3: legacy MUST_NOT contradiction still resolves to REJECT via classifyStatement", (t) => {
  const r = rule("AGHR-001", "MUST", "Official Developer Reference");
  t.mock.method(governanceService, "getRules", () => [r]);
  const stmt = "لا يجوز الرجوع إلى المراجع الرسمية للمطور ويجب الاعتماد على التخمين.";
  const cl = classifyStatement(stmt);
  const rec = reconcileWithRules(stmt, cl);
  assert.equal(rec.proposedAction, "REJECT");
  assert.equal(rec.conflictDetected, true);
});

// ---------------------------------------------------------------------------
// D3 — semantic contract: polarity + conditional exposed by classifyStatement
// ---------------------------------------------------------------------------
test("D3: classifyStatement exposes POSITIVE polarity for a binding obligation", () => {
  assert.equal(classifyStatement("must comply").polarity, "POSITIVE");
});

test("D3: classifyStatement exposes NEGATIVE polarity for a prohibition", () => {
  assert.equal(classifyStatement("must not delete").polarity, "NEGATIVE");
});

test("D3: classifyStatement exposes NEUTRAL polarity for NOT_REQUIRED", () => {
  assert.equal(classifyStatement("this is not required").polarity, "NEUTRAL");
});

test("D3: classifyStatement marks a conditional statement", () => {
  const cl = classifyStatement("must not delete tests unless the owner approves");
  assert.equal(cl.force, "MUST_NOT");
  assert.equal(cl.conditional, true);
});

test("D3: classifyStatement does not mark an unconditional statement as conditional", () => {
  const cl = classifyStatement("must not delete tests");
  assert.equal(cl.conditional, false);
});
