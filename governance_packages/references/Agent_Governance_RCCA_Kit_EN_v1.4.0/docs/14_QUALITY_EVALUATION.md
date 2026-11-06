# Quality effectiveness: two distinct experiments

## Experiment A — deterministic implementation verification

Run the local unit, CLI and integrity suites. They validate contract checks, explicit
conflict handling, stable gap proposals, routing over declared inputs, file preservation
and arithmetic. They do not establish that an LLM chose a good alternative or actually
asked a necessary question. QA-01..QA-20 in `evaluations/ADEQ_BEHAVIORAL_CASES.json`
are authored behavioral evaluation designs; live status remains NOT_RUN.

## Experiment B — actual agent behavior and net value

Use `prompts/07_PRE_GOVERNANCE_BASELINE.md` before adoption and
`prompts/08_POST_GOVERNANCE_EFFECTIVENESS.md` afterward. Freeze original tasks, expected
outcomes, model/host/version, environment, permissions, rubric and telemetry definitions.
Use equivalent safe tasks and a bounded grant. Record model/tool/version changes as
confounders. Do not edit prior findings silently; corrections are append-only explanations.

Use the same development cases across arms for paired comparisons. Add genuinely unseen
holdout cases controlled by someone other than the prompt author when feasible. The
published QA catalog is not a blind holdout. Repeated observations may be needed because
model behavior varies; no universal success probability follows from a small sample.

## Metric definitions — ADEQ-METRICS-1

| ID | Numerator / denominator, or measured value | Better |
|---|---|---|
| requirements_coverage | Applicable mandatory obligations with adequate reviewed coverage / applicable mandatory obligations | Higher |
| omission_rate | Omitted applicable mandatory obligations / applicable mandatory obligations | Lower |
| rework_rate | Completed tasks requiring corrective rework due to analysis/implementation mistakes / completed tasks | Lower |
| clarification_precision | Questions adjudicated necessary and consequential / questions asked | Higher |
| recommendation_quality | Awarded points under a predeclared suitability/trade-off rubric / possible points | Higher |
| defect_recurrence | Fixes whose original defect recurred in a fixed follow-up window / fixes eligible for that window | Lower |
| false_completion_rate | Unsupported full-completion claims / evaluated full-completion claims | Lower |
| authorized_task_success | Correctly completed authorized tasks / attempted authorized tasks | Higher |
| false_block_rate | Legitimate attempted actions incorrectly blocked / legitimate attempted actions | Lower |
| execution_seconds | End-to-end duration over the same matched task set, using the same aggregation | Lower |
| token_count | Recorded token use, not inferred from characters | Lower |
| owner_review_minutes | Recorded owner decision/review time, same collection method | Lower |
| approval_interruptions | Recorded unnecessary approval interruptions under the fixed rubric | Lower |
| critical_violations | Confirmed critical violations in the stated task set | Lower; never average away |

The operator must establish the denominator, rubric and evidence quality; the tool only
checks supplied arithmetic. Zero denominator is NOT_APPLICABLE, not 0% or 100%. Missing
values/evidence refs yield NO_TELEMETRY. Rates use percentage-point deltas, not misleading
relative percentages. Missing/unrun metrics are not converted to zero. Improvement and
regression are reported per metric; no composite quality score or automatic GO is produced.

The recommendation rubric should predefine criteria, scoring anchors, reviewer identity
and material disqualifiers. Example dimensions: requirement fit, feasibility, alternatives,
side-effect disclosure and proportionality. Set weights before seeing results; a model's
self-confidence is not the recommendation-quality score.

## Measurement command

```powershell
python -B -m agdl quality-compare --before examples/metrics-before.json --after examples/metrics-after.json
```

These examples are invented SYNTHETIC arithmetic fixtures. They are not observed changes
in productivity or defect rates. See `schemas/measurement.schema.json` for the input.
In addition to the governance version (the intended varying factor), the tool compares
model, host, task set, oracle, environment, sample size, definition and evidence class.
Incompatible conditions yield NOT_COMPARABLE and no improvement delta. Equal declared
metadata still does not establish randomization, independent labels or causality.

## Acceptance and decision

Do not accept a critical unauthorized operation or unsupported completion because average
metrics improved. Review every serious failure separately. A low-risk solo project may
use labeled self-review initially; sensitive acceptance follows its actual independence
policy. The owner chooses KEEP, ADJUST, SIMPLIFY, controlled rollback proposal or
INCONCLUSIVE based on evidence and cost. Do not execute that policy change during review.
