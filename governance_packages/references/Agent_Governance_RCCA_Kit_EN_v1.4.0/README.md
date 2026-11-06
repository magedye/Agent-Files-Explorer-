# Agent Governance & RCCA Kit EN v1.4.0
## ADEQ v1.1 — Decision quality, coherent specifications and evidence-based execution

**Delivery status:** `IMPLEMENTED_CANDIDATE / NOT_OWNER_ACCEPTED / NOT_ACTIVE`.
This is the complete updated kit, not a patch-only archive. It extends v1.3.1 for
one developer-owner, one primary Codex agent, and small/medium projects.
Antigravity and OpenCode remain optional secondary hosts requiring scoped qualification.

## What this release adds

ADEQ's 24 stable IDs now include the five requested enhancements: detailed requirement
traceability, risk-proportionate separated review, authority/conflict reconciliation,
rollback/restore/forward-recovery readiness, and PRE/POST effectiveness measurement.
Three confidence judgments are kept distinct: solution suitability and execution
feasibility before work, implementation correctness after actual verification.
Percentages are optional, normally subjective and uncalibrated.

Seven on-demand procedures cover clarification, traceability, cross-artifact quality,
convergence, alternatives, proportional workflow routing, and root-cause bug repair.
Spec Kit contributes design inspiration only: its CLI is neither installed nor executed.

## Use the small entry, not the whole repository as a prompt

Read [START_HERE.md](START_HERE.md) and [policies/CORE.md](policies/CORE.md).
Keep the full kit outside the target project's operational source of truth. Add a
small reconciled pointer to existing agent guidance only after scoped adoption.
The full ADEQ protocol and workflow definitions stay on demand. Existing task/request
records are reused; the optional JSON quality snapshot is derived, not a new ledger.

## What is actually executable

- All previous RCCA G1/G2/G5, task-scope, dependency, evidence, bridge and instruction-audit tools.
- `quality-route`: recommends QUICK/STANDARD/CONTROLLED, or ASSESS_FIRST for unknown routing facts.
- `quality-check`: checks declared quality metadata and references; PRE reuses G1 and POST reuses G5.
- `converge`: the read-only POST assessment plus stable remediation proposals linked to existing tasks.
- `quality-compare`: computes comparable supplied PRE/POST measurements and keeps missing telemetry visible.
- Generated policy/workflow views and an integrity checker prevent drift from the canonical registers.

No new CLI command runs an agent, writes project state, authenticates a decision,
extracts hidden instructions, or semantically understands arbitrary prose. The new
cross-artifact comparison uses explicitly supplied scoped key/value claims; a human
or agent must perform the semantic review and provide evidence. Never interpret
`QUALITY_METADATA_READY_FOR_REVIEW` as DONE, acceptance or real-world behavior proof.

## Run from this extracted directory

Python standard library only. Python 3.10+ syntax target; the actual executed interpreter
and platform are recorded in the current verification report. No API key, Docker,
network, dependency installation, global configuration or new service is required.

```powershell
python -B tools/check_package.py
python -B tools/build_quality_docs.py --check
python -B -m agdl doctor
python -B -m agdl quality-route --snapshot examples/fixture/quality.json
python -B -m agdl quality-check --root examples/fixture --snapshot examples/fixture/quality.json --stage PRE --revision fixture-revision-1
python -B -m agdl converge --root examples/fixture --snapshot examples/fixture/quality.json --revision fixture-revision-1
python -B -m agdl quality-compare --before examples/metrics-before.json --after examples/metrics-after.json
python -B -m unittest discover -s tests -v
python -B -m unittest discover -s compatibility/v1_2/tests -v
```

Examples are explicitly SYNTHETIC and are not measurements of agent improvement.
Commands print JSON to standard output. Exit 0 means scoped metadata/arithmetic checks
succeeded; 2 denotes detected gaps/critical metric findings; 3 denotes unknown,
unavailable, invalid or incomparable inputs. It is not a security authorization code.

## Navigation

| Need | File |
|---|---|
| Final scope and execution plan | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) |
| ADEQ canonical register and generated reference | `policies/ADEQ_RULES.json`, `policies/ADEQ.md` |
| Seven on-demand procedures | `workflows/QUALITY_WORKFLOWS.md` |
| Responsibility map and five enhancements | `docs/12_ADEQ_INTEGRATION.md` |
| Precise diagnostic contracts | `docs/13_QUALITY_CONTRACTS.md` |
| Measurement definitions and live test protocol | `docs/14_QUALITY_EVALUATION.md` |
| Primary-source review and compatibility limits | `docs/15_PROVIDER_SOURCE_DELTA.md` |
| Before/after assessment prompts | `prompts/07_PRE_GOVERNANCE_BASELINE.md`, `prompts/08_POST_GOVERNANCE_EFFECTIVENESS.md` |
| Authorized quality execution prompt | `prompts/09_ADEQ_EXECUTE.md` |
| Optional, not installed skill | `skills/adeq-quality/SKILL.md` |
| Current test report | `verification/VERIFICATION_REPORT.md` |
| Untouched prior-release evidence | `verification/README.md` |

## Readiness boundary

Engineering delivery and local deterministic tests are different from live Codex
behavior, Windows qualification, independent review, owner acceptance and deployment.
The latter are not inferred. No claim is made that this release prevents most mistakes
or outperforms an existing toolkit without a real comparison. See `LIMITATIONS.md`.
