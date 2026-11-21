# Start here — v1.4.0 with ADEQ v1.1

## 1. Before adoption

Keep the archive and its extracted kit separate from the target project. Verify the
manifest with `python -B tools/check_package.py`. The result checks content consistency,
not publisher identity. Read `LIMITATIONS.md` and `verification/VERIFICATION_REPORT.md`.
Preserve v1.3.1 and current project policies; the new version does not supersede them by age alone.

## 2. Assess the project as it is

Give the primary agent `prompts/07_PRE_GOVERNANCE_BASELINE.md`. It must examine existing
instructions, actual host configuration, records, skills, failures and telemetry without
changing the project. Freeze the report externally or in an already authorized evidence
location; do not silently mutate the repository during a read-only assessment.

## 3. Reconcile only needed guidance

Use `prompts/02_ADOPT_SCOPED.md`, then `policies/CORE.md` as the short operational entry.
Resolve its location from the existing project registry. Do not overwrite `AGENTS.md` or
create a second request/task/decision store. The names in the attached design plan such as
REQUEST_REGISTER, TASK_STATE or write-set were examples, not proof those files exist.
The kit's own `AGENTS.md` governs maintenance of this kit, not the user's whole repository.

## 4. Work with proportionate quality

Use `prompts/09_ADEQ_EXECUTE.md`. For QUICK work, the existing request, focused test and
short closeout may suffice. For meaningful decisions, present the recommendation,
important alternatives, effect and uncertainty. Ask only unresolved consequential
questions. Continue authorized work without routine reapproval.
Read applicable INT-01..INT-07 procedures on demand; do not load all references into every task.

## 5. Optional deterministic inspection

The CLI can validate a derived snapshot referencing the existing RCCA record, with
source paths and hashes. It is not mandatory paperwork for daily tasks. Use
`examples/fixture/quality.json` to learn the format; it is a synthetic example, not
real project evidence. All paths inside a snapshot are relative to the explicit root.
The three confidence judgments remain separate and do not replace actual test results.

## 6. Verify effect, not installation

After scoped adoption, use `prompts/08_POST_GOVERNANCE_EFFECTIVENESS.md` with the frozen
baseline, unchanged metric definitions and equivalent tasks. Report improved, unchanged,
regressed, unknown and incomparable results. Record overhead and unnecessary interruptions
as well as error reduction. No telemetry means NO_TELEMETRY, not assumed improvement.

## 7. Preserve version and approval distinctions

Register the package release as 1.4.0 and the behavioral protocol as ADEQ 1.1.
Any application-specific baseline identifier is separate. Registration, default UI
selection, owner policy adoption and external runtime activation are distinct operations.
This delivery performs none of those operations in Agent-Files-Explorer or any live project.
