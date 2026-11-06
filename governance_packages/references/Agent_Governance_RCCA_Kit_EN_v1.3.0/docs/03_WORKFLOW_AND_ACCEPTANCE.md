# Minimal lifecycle, risk profiles and review

## Select the smallest adequate track

| Track | Appropriate use | Minimum record |
|---|---|---|
| QUICK | Narrow, reversible local fix with clear acceptance | Original task, cause/fix, focused verification, changed files, remaining gaps |
| STANDARD | Feature, multiple obligations or meaningful dependencies | Source-linked requirements, short plan/tasks, relevant spec refs, evidence and closeout |
| CONTROLLED | Sensitive data, security boundary, irreversible or external effects | Exact scope/decision, suitable host boundary, recovery plan, independent checks where required |

Project size does not determine risk. A tiny script may still delete production data.
No universal PRD, ADR, task engine or matrix is required for every fix. Use an ADR when a meaningful decision
has alternatives and long-term consequences, not for every line of code.

## Shared flow

Understand source and grant -> identify relevant rules/skills -> plan only what helps -> execute within scope
-> verify affected behavior -> repair known in-scope gaps -> report evidence and remaining owner decisions.

The agent continues through this flow under the existing grant. A plan is not an additional permission source.
For a long request, preserve each source unit and reconcile it to requirements; do not merely check off the
shortened task list. For a spec change, preserve the previous baseline and record the authorized delta.
The read-only bridge can represent OpenSpec/Spec Kit files but cannot approve their contents.

## Review with one human

The developer may be owner, maintainer and final accepting reviewer. The agent may implement and self-test,
but must label that `SELF_REVIEW`, not independent review. A fresh session can provide another pass without
claiming independence. A second model is optional, and correlated mistakes still remain possible.

For ordinary local R0/R1 work, do not require L2/L3 as a default. Use focused reproducible checks and developer
review proportionate to the change. For R2/R3, require the additional boundary and evidence appropriate to the
risk; the CLI deliberately returns an unresolved qualification requirement at G5. If a genuinely independent
review is necessary but unavailable, block that sensitive decision, not unrelated local development.

## Status axes

- Implementation: NOT_IMPLEMENTED / IMPLEMENTED / BLOCKED / UNKNOWN.
- Verification: NOT_RUN / PASSED / FAILED / INCONCLUSIVE, with scope and revision.
- Review provenance: SELF / OWNER_REVIEW / SEPARATE_SESSION / EXTERNAL.
- Owner acceptance: NOT_REQUESTED / PENDING / ACCEPTED / REJECTED, from the real decision source.
- Activation: NOT_ACTIVE / separately authorized and qualified activation.

These are not an automatic linear ladder. `METADATA_READY_FOR_REVIEW` is a CLI finding, never a release state.
A developer may accept scoped deviations where authorized; provider constraints are not waivable by a project.

## Completion closeout

State the source/task, delivered behavior, changed files, tests actually run and their outcome, unresolved
requirements, known pre-existing defects, Git state, and exact next owner decision if any. Avoid percentages
without a denominator and evidence. Do not claim background monitoring or future work that is not running.
