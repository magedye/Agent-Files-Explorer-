# Evaluation, value decisions and maintenance

## What was tested versus what remains

The bundled suite exercises deterministic contracts and synthetic fixtures. The legacy v1.2 suite establishes
compatibility within its original fixture scope. The comparison runner contrasts old G5 metadata checks with
new reference/evidence checks on author-defined mutations. It is **not** a live comparison of v1.2 + Spec Kit
against v1.3 on genuine development tasks.

No model tokens, developer review time, actual task-duration savings, semantic extraction recall or operational
false-block rate were measured. Their state is `NO_TELEMETRY` or `NOT_RUN`. The bundled cases were visible to the
implementer and must never be called an independent or blind holdout set.

## Six paired live task families

Use a narrow bug fix, a new feature, an approved-spec change, a long multi-condition request, an authority conflict,
and a resume after interruption. Include both legitimate actions and prohibited/uncertain actions. Keep source,
permissions, acceptance and relevant environment comparable; record deviations and order effects.

The developer writes the expected outcomes before execution. For claims requiring independence, use an actually
separated reviewer/runner and document why it is independent. With one owner, ordinary acceptance may remain an
owner review, honestly labeled. Do not hire an extra reviewer merely to fill a chart for low-risk work.

## Metrics with honest denominators

| Metric | Numerator / denominator | Required evidence |
|---|---|---|
| Extraction recall | Correctly extracted source obligations / adjudicated obligations | Independent or owner-labeled source set; not punctuation count |
| Traceability completeness | Applicable mandatory items with valid links / applicable mandatory items | Source/IDs/artifact validation; not semantic truth |
| Verification coverage | Mandatory items with accepted scoped evidence / mandatory applicable items | Actual results and review of oracle relevance |
| Completion claim accuracy | Claims matching adjudicated result / reviewed claims | Separate result labels and explicit false-DONE count |
| Unauthorized mutations | Observed out-of-scope mutations | Before/after snapshots and actual runtime traces |
| False blocks | Legitimate attempts incorrectly blocked / tested legitimate attempts | Fixed intended allowance and run outcomes |
| Operational cost | Time, tokens, owner effort and maintenance | Real telemetry; otherwise NO_TELEMETRY |

Do not compute ratios with zero/unknown denominators. Report critical incidents separately. Six cases are a
pilot for a scoped decision, not statistical proof about all models or projects.

## Decision

GO for a particular adoption only when evidence supports useful benefit at acceptable owner-defined cost and
no unresolved critical boundary failure. ADJUST for a bounded repair. DEFER when evidence is insufficient.
STOP expanding the framework when existing tools already meet the need or upkeep outweighs value.
Engineering fixture success can justify review of the candidate; it cannot establish the live-value GO.

## Maintenance

Keep one maintainer: the developer-owner, assisted by the primary agent. Preserve source/compatibility manifests.
On each relevant update, review affected contracts and host sources, rerun relevant regressions, and record
remaining unknowns. A newly inferred lesson becomes a candidate improvement, not an immediate governing rule.
Keep a small action backlog; do not convert every recommendation into a mandatory control.
