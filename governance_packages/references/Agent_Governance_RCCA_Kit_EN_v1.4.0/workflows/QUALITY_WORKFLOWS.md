# Seven quality workflows

Generated from `workflows/QUALITY_WORKFLOWS.json`.
These procedures apply existing ADEQ rules; they create neither another authority nor a task database.
No direct Spec Kit installation, hooks or external tool execution is bundled.

## INT-01 — Clarification and ambiguity

**When:** Consequential unknowns or ambiguous acceptance criteria.

Apply: `ADEQ-01`, `ADEQ-03`, `ADEQ-04`, `ADEQ-05`, `ADEQ-06`.

1. Inspect repository and approved sources first.
2. Classify unknowns and their affected requirements.
3. For owner decisions, present options, trade-offs, recommendation and a focused question.
4. Record the owner decision in the existing authority record, then update affected specifications within scope.
5. Continue unrelated authorized work.

**Output:** Clarified existing requirement and decision references, or scoped blocker.

**Implemented diagnostic boundary:** quality-check PRE inspects declared ambiguity/decision metadata, not question necessity.

**Acceptance:** No affected implementation based on unresolved consequential assumptions; no needless owner questions.

## INT-02 — Requirement and acceptance traceability

**When:** Multiple obligations or material change.

Apply: `ADEQ-02`, `ADEQ-16`, `ADEQ-19`, `ADEQ-21`.

1. Preserve request text and stable requirement IDs.
2. Reuse RCCA source units, task bindings, evidence and exception references.
3. Allow many-to-many links and inspection/review as well as tests.
4. Generate a coverage view; do not edit it as a second task log.

**Output:** Derived source-to-requirement-to-task-to-evidence view.

**Implemented diagnostic boundary:** quality-check reuses validate_record; PRE checks task coverage, POST reuses G5 transitive dependency/evidence logic.

**Acceptance:** Every applicable mandatory requirement has a disposition and adequate completion evidence.

## INT-03 — Document and cross-artifact quality review

**When:** Material specification, plan, task or document updates.

Apply: `ADEQ-03`, `ADEQ-13`, `ADEQ-14`.

1. Review the seven document-quality axes in scope.
2. Compare specifications, design choices, plans, tasks and tests.
3. Identify duplicated, conflicting, missing and ungrounded assertions with source locations.
4. Resolve authority by actual scope, approval and explicit supersession; do not rank by timestamp.
5. Read-only reviews propose changes; authorized implementation may apply agreed corrections.

**Output:** Source-backed gaps and candidate conflicts.

**Implemented diagnostic boundary:** quality-check compares explicitly supplied scope/key/value claims. It does not read arbitrary prose for semantic contradictions.

**Acceptance:** No material unresolved cross-artifact conflict before the affected implementation.

## INT-04 — Verification and bounded convergence

**When:** Implementation has produced evidence or a completion claim.

Apply: `ADEQ-16`, `ADEQ-20`, `ADEQ-21`.

1. Check the original request and acceptance criteria, not only the task list.
2. Run relevant verification and classify MISSING, PARTIAL, CONTRADICTS, UNREQUESTED or UNVERIFIED.
3. Attach corrections to existing tasks; stable proposals do not create new tasks automatically.
4. Execute only already authorized corrections; ask for genuine scope or protected decisions.
5. Recheck changed evidence and stop unproductive repetition; preserve unresolved findings.

**Output:** Scoped gap report, existing task references and review-ready metadata, never automatic acceptance.

**Implemented diagnostic boundary:** converge is a read-only POST quality assessment with stable deduplicated proposals; no execution loop.

**Acceptance:** No blanket completion with unresolved applicable mandatory gaps.

## INT-05 — Alternatives, impact and confidence

**When:** A meaningful architectural or consequential solution choice.

Apply: `ADEQ-07`, `ADEQ-08`, `ADEQ-09`, `ADEQ-10`, `ADEQ-11`.

1. Compare feasible alternatives against need, reuse, complexity, maintenance, compatibility, cost and recoverability.
2. Recommend one option with evidence and important trade-offs.
3. Separate solution suitability from implementation feasibility before work.
4. Assess implementation correctness only after actual checks; percentages are optional and may be insufficiently grounded.
5. Prepare rollback, restore or forward recovery for material changes; do not execute it during review.

**Output:** Brief recommendation, impact/recovery outline and explicit owner decision only when needed.

**Implemented diagnostic boundary:** quality-check checks supplied decision, confidence and recovery records; no optimum-choice theorem.

**Acceptance:** Material choices are explained and authorized; confidence is not evidence or permission.

## INT-06 — Proportionate workflow selection

**When:** Task intake or newly discovered complexity.

Apply: `ADEQ-06`, `ADEQ-12`, `ADEQ-22`.

1. Classify declared scope, impact, complexity and reversibility.
2. Use QUICK, STANDARD or CONTROLLED; unknown material facts call for assessment first.
3. Use existing task/specification locations, not forced files.
4. Increase checking depth when justified without inventing extra approvals.

**Output:** Workflow choice and rationale.

**Implemented diagnostic boundary:** quality-route is deterministic over declared facts; it neither authenticates risk nor schedules work.

**Acceptance:** Small clear changes stay lightweight; consequential changes receive enough analysis.

## INT-07 — Root-cause bug repair

**When:** Observed failure or a bug report.

Apply: `ADEQ-15`, `ADEQ-17`, `ADEQ-19`, `ADEQ-20`, `ADEQ-24`.

1. Observe the original symptom and preserve the failure.
2. Reproduce safely where possible; record when reproduction is unavailable.
3. Separate product, environment, test-harness and dependency causes.
4. Apply a focused fix within scope.
5. Verify the original scenario and relevant regressions, not just a successful build.

**Output:** Cause evidence, focused change and before/after symptom verification.

**Implemented diagnostic boundary:** quality-check POST checks declared symptom, logs and regression references. It does not run the application.

**Acceptance:** No claim that a bug is fixed without evidence addressing the original symptom.

