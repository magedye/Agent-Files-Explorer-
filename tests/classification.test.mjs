/**
 * tests/classification.test.mjs
 *
 * Regression suite for server/intake.js `classifyStatement` normative-force
 * classification. Authored under the Corrective Engineering directive to fix
 * proven misclassifications (negation, permission, non-requirement, ambiguity).
 *
 * Focus: SEMANTIC correctness of the `force` output, not mere pattern presence.
 * Categories covered: direct negation, compound negation, quoted text,
 * conditions, recommendations (SHOULD), binding commands (MUST), permission
 * (MAY), non-requirement (NOT_REQUIRED), prohibition (MUST_NOT), and
 * ambiguous/unrecognized statements (REVIEW_REQUIRED).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { classifyStatement } from "../server/intake.js";

function forceOf(text) {
  return classifyStatement(text).force;
}

// ---------------------------------------------------------------------------
// MUST_NOT — binding prohibition (direct + compound negation)
// ---------------------------------------------------------------------------
test("Classification: Arabic direct negation 'لا يجب' resolves to MUST_NOT (not MUST)", () => {
  assert.equal(forceOf("لا يجب أن نضيف قاعدة جديدة"), "MUST_NOT");
});

test("Classification: Arabic prohibition 'يمنع' resolves to MUST_NOT", () => {
  assert.equal(forceOf("يمنع حذف أي دليل أو شاهد تحليلي."), "MUST_NOT");
});

test("Classification: Arabic prohibition 'لا يجوز' resolves to MUST_NOT", () => {
  assert.equal(forceOf("لا يجوز الرجوع إلى المراجع الرسمية للمطور."), "MUST_NOT");
});

test("Classification: English 'shall not' resolves to MUST_NOT (not MUST)", () => {
  assert.equal(forceOf("Agents shall not execute the pipeline"), "MUST_NOT");
});

test("Classification: English 'must not' resolves to MUST_NOT", () => {
  assert.equal(forceOf("Developers must not delete existing tests"), "MUST_NOT");
});

test("Classification: English 'never' resolves to MUST_NOT", () => {
  assert.equal(forceOf("The system never writes to production without approval"), "MUST_NOT");
});

test("Classification: Arabic compound negation 'يجب عدم' resolves to MUST_NOT", () => {
  assert.equal(forceOf("يجب عدم حذف الأدلة بعد الاعتماد"), "MUST_NOT");
});

// ---------------------------------------------------------------------------
// SHOULD_NOT — discouraged
// ---------------------------------------------------------------------------
test("Classification: English compound 'should not be required' resolves to SHOULD_NOT (not MUST)", () => {
  assert.equal(forceOf("This check should not be required for read-only access"), "SHOULD_NOT");
});

test("Classification: English 'should not' resolves to SHOULD_NOT", () => {
  assert.equal(forceOf("You should not skip the baseline check"), "SHOULD_NOT");
});

test("Classification: Arabic 'لا ينبغي' resolves to SHOULD_NOT (not SHOULD)", () => {
  assert.equal(forceOf("لا ينبغي تعديل الملفات دون مراجعة"), "SHOULD_NOT");
});

// ---------------------------------------------------------------------------
// NOT_REQUIRED — explicitly not a requirement
// ---------------------------------------------------------------------------
test("Classification: English 'no longer required' resolves to NOT_REQUIRED (not MUST)", () => {
  assert.equal(forceOf("This rule is no longer required"), "NOT_REQUIRED");
});

test("Classification: English 'not required' resolves to NOT_REQUIRED", () => {
  assert.equal(forceOf("Full replication is not required for this workload"), "NOT_REQUIRED");
});

test("Classification: Arabic 'غير مطلوب' resolves to NOT_REQUIRED", () => {
  assert.equal(forceOf("غير مطلوب توثيق هذه الخطوة"), "NOT_REQUIRED");
});

// ---------------------------------------------------------------------------
// MAY — permission / optional
// ---------------------------------------------------------------------------
test("Classification: English 'permitted' resolves to MAY (not PROPOSED)", () => {
  assert.equal(forceOf("It is permitted to use read-only access"), "MAY");
});

test("Classification: English 'may optionally' resolves to MAY (not INFO)", () => {
  assert.equal(forceOf("You may optionally add a note"), "MAY");
});

test("Classification: English 'optional' resolves to MAY", () => {
  assert.equal(forceOf("Extra logging is optional"), "MAY");
});

test("Classification: Arabic 'يجوز' (positive) resolves to MAY", () => {
  assert.equal(forceOf("يجوز استخدام الوصول للقراءة فقط"), "MAY");
});

// ---------------------------------------------------------------------------
// SHOULD — recommendation (positive)
// ---------------------------------------------------------------------------
test("Classification: Arabic 'ينبغي' resolves to SHOULD", () => {
  assert.equal(forceOf("ينبغي إضافة اختبار تراجعي للتحقق من المخرجات."), "SHOULD");
});

test("Classification: English 'should' resolves to SHOULD", () => {
  assert.equal(forceOf("Developers should run linters before submitting"), "SHOULD");
});

// ---------------------------------------------------------------------------
// MUST — binding obligation (positive)
// ---------------------------------------------------------------------------
test("Classification: Arabic 'يجب' resolves to MUST", () => {
  assert.equal(forceOf("يجب توثيق الأدلة المنهجية بدقة"), "MUST");
});

test("Classification: English 'must' resolves to MUST", () => {
  assert.equal(forceOf("This build must comply with the baseline"), "MUST");
});

// ---------------------------------------------------------------------------
// REVIEW_REQUIRED — ambiguous / unrecognized
// ---------------------------------------------------------------------------
test("Classification: ambiguous Arabic text resolves to REVIEW_REQUIRED (not PROPOSED)", () => {
  assert.equal(forceOf("نص ملتبس غير واضح المعنى"), "REVIEW_REQUIRED");
});

test("Classification: non-normative text resolves to REVIEW_REQUIRED", () => {
  assert.equal(forceOf("Hello world"), "REVIEW_REQUIRED");
});

// ---------------------------------------------------------------------------
// Quoted text — quotes must not break semantic classification
// ---------------------------------------------------------------------------
test("Classification: quoted prohibition still resolves to MUST_NOT", () => {
  assert.equal(forceOf('The standard states "must not delete evidence"'), "MUST_NOT");
});

test("Classification: quoted obligation still resolves to MUST", () => {
  assert.equal(forceOf('The spec says "must record the source hash"'), "MUST");
});

// ---------------------------------------------------------------------------
// Conditions — a conditional clause must not flip the normative force
// ---------------------------------------------------------------------------
test("Classification: conditional prohibition resolves to MUST_NOT", () => {
  assert.equal(forceOf("must not delete tests unless the owner approves"), "MUST_NOT");
});

test("Classification: conditional recommendation resolves to SHOULD", () => {
  assert.equal(forceOf("should run the check when the file changes"), "SHOULD");
});

// ---------------------------------------------------------------------------
// Contract preservation — legacy consumers still receive the values they expect
// ---------------------------------------------------------------------------
test("Classification: legacy MUST_NOT case still resolves to MUST_NOT", () => {
  assert.equal(forceOf("يمنع حذف أي دليل أو شاهد تحليلي."), "MUST_NOT");
});

test("Classification: legacy SHOULD case still resolves to SHOULD", () => {
  assert.equal(forceOf("ينبغي إضافة اختبار تراجعي للتحقق من المخرجات."), "SHOULD");
});
