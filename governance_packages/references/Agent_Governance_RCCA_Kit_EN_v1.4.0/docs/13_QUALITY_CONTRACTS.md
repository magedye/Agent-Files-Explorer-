# Quality CLI and data contracts

## No new project ledger

A quality snapshot (`adeq-1.1`) is an optional derived inspection input. Export it from
existing records only when deterministic checks add value. Ordinary QUICK tasks do not
need it. Its `trace_ref.path` and SHA-256 point to the existing `agdl-1.3` RCCA trace;
requirement and task status are read there. A changed source invalidates the snapshot.

All embedded paths are portable relative paths beneath `--root`. The snapshot filename
itself is explicitly selected by the caller. Existing bounded read helpers reject path
traversal, links and selected sensitive paths. They are diagnostic defenses, not an OS sandbox.
No remote URL fetching, imported script evaluation, subprocess execution or project write
is performed by the new diagnostics. They print results to stdout only.

## Quality snapshot fields

| Field | Purpose |
|---|---|
| subject_revision | Exact caller-declared current candidate; must match trace and --revision |
| trace_ref / request_path | Existing RCCA source and original request, not copies of task state |
| context | Task ID, work type, complexity, impact, reversibility, decision/document triggers |
| sources | Explicit source IDs, paths, hashes, roles, declared trust and authority reference |
| ambiguities | Scoped unknowns, inspection note, options, recommendation/question, resolution reference |
| decisions | Meaningful choices, impact, evidence, chosen option and existing decision reference |
| claims | Explicit scope/key/value/source/location annotations; CURRENT vs HISTORICAL with disposition |
| observations | Review findings in the five gap classes, using existing requirement/task IDs |
| confidence | Optional solution/feasibility/correctness judgments; material stages require their relevant kinds |
| review | Reviewer record, SELF/separated claim/owner; actual independence not authenticated |
| rollback | Strategy, procedure, rehearsal result and residual risk; no recovery execution |
| document_checks | Seven review axes, with evidence or explicit not-applicable reason |
| bug | Original symptom, cause status, before/after evidence and relevant regressions |

The exact closed contract is `schemas/quality.schema.json`. Unknown fields are rejected
rather than silently promoted. Empty template values are not a passing assessment.
An exclusion, trusted label or declared decision is not a cryptographic identity proof.

## Commands

```powershell
python -B -m agdl quality-route --snapshot examples/fixture/quality.json
python -B -m agdl quality-check --root examples/fixture --snapshot examples/fixture/quality.json --stage PRE --revision fixture-revision-1
python -B -m agdl quality-check --root examples/fixture --snapshot examples/fixture/quality.json --stage POST --revision fixture-revision-1
python -B -m agdl converge --root examples/fixture --snapshot examples/fixture/quality.json --revision fixture-revision-1
```

PRE means **pre-implementation quality inspection of this task**, not automatically the
PRE-governance baseline study. POST means this task's post-implementation evidence check.
The separate PRE/POST governance prompts study actual policy effectiveness across tasks.

PRE does not demand future test evidence. It uses G1 and planning links, with a documented
no-separate-task reason when proportional. G2 remains the existing authorization-metadata
check before execution; passing quality PRE neither calls nor replaces runtime permission.
POST/converge use G5 and add the quality review. They never launch implementation loops.

Reports return QUALITY_GAPS_FOUND (exit 2), INCONCLUSIVE (exit 3), or
QUALITY_METADATA_READY_FOR_REVIEW (exit 0). A warning-only report can still be ready
for review; it never means semantic correctness, trusted approval or production readiness.

## Gap identity and bounded retries

Findings use stable content-derived IDs across repeated identical observations. Equivalent
structured observations with different row IDs do not duplicate proposals. The existing
task links are reused. Semantically similar differently worded findings still require
review; no claim of perfect natural-language deduplication is made. The primary agent
may perform authorized corrections, then regenerate a snapshot. Stop when no new evidence
or progress is obtained; state blockers rather than looping or rewriting the acceptance oracle.

## Confidence and recovery

Numbers are optional. A range must satisfy 0 <= lower <= upper <= 100 and explicitly
state SUBJECTIVE_UNCALIBRATED or reference an empirical calibration record. The checker
cannot validate that calibration's scientific applicability. HIGH post-execution confidence
conflicting with G5 failures is flagged. NOT_RUN evidence never becomes success.

High-impact/difficult-to-reverse work needs a recovery strategy and procedure reference;
unperformed rehearsal remains unverified. Forward recovery is allowed where rollback is
impossible. Whether rehearsal is a hard authorization gate is determined by the existing
project policy, not a self-issued tool permission.
