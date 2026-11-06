# Final implementation plan and delivery record — v1.4.0

## Authority, goal and boundaries

The current user request authorizes reviewing the supplied plan and building a complete
updated delivery. Earlier proposal labels are historical input status, not a reason to
ask again before building. Authority does not extend to modifying a Windows repository,
installing Spec Kit, changing global agent settings, provisioning owner credentials,
publishing, or activating policy in another project.

Goal: improve the agent's advice, requirements clarity, document coherence, accurate
execution and honest closeout while preserving broad bounded autonomy for one developer.
Code, comments, prompts, schemas and active instructions are English.

## Baseline and decisions

Actual baseline: the supplied v1.3.1 ZIP. Hash and inventory are recorded in
`sources/V140_INPUT_MANIFEST.json` and the current change inventory. Existing modules
for RCCA, evidence, dependency closure, delegation and source audit are reused. No source
file paths from an imagined Windows project are assumed to exist here.

| Component | Decision | Implementation |
|---|---|---|
| G1/G2/G5 and patched task closure | KEEP | Preserve `agdl/assurance.py` and its trace contract |
| Legacy v1.2 scripts/tests | KEEP | Byte-for-byte compatibility subtree |
| Original request/task/decision store | REUSE | Existing project IDs; no new editable database |
| ADEQ-01..24 | EXTEND | One canonical quality register, five requested enrichments |
| Core and detailed policy texts | GENERATED VIEWS | Single-source generation and drift checks |
| Seven quality procedures | IMPLEMENT | Workflow register and on-demand reference |
| Quality snapshot/analysis | BUILD SMALL | Optional derived metadata checker; not an NLP engine |
| Convergence actions | DERIVE | Stable proposals and existing task IDs, no executor |
| PRE/POST measurement | BUILD SMALL | Supplied metric arithmetic; no automatic telemetry |
| Spec Kit CLI and hooks | DEFER | Method-only adaptation; no external dependency |
| Runtime PEP/PDP, owner signing, orchestrator | OUT OF SCOPE | Use separately qualified host/project controls |

## Phases and gates

| Phase | Delivered work | Gate / actual limit |
|---|---|---|
| 00 Baseline and authority | Inspect archive; map reused mechanisms and inputs | Original archive remains unchanged; new release isolated |
| 01 Requirements and decisions | INT-01/02/05, linked derived snapshot, confidence separation | Metadata tests; question quality still needs live assessment |
| 02 Document quality | INT-03, seven review axes, scoped explicit claim comparison | Detect explicit inconsistencies; no arbitrary-prose semantic guarantee |
| 03 Verification/convergence | INT-04 reuses G5; stable gap proposals | Mandatory gaps stay visible; no automatic task writes or acceptance |
| 04 Proportionate procedures | INT-06/07, routing and bug evidence checks | Three workflows tested on declared metadata, not a live model |
| 05 Testing and effectiveness | Regression tests, QA-01..20 designs, PRE/POST prompts and arithmetic | Local tests executed; live agent comparison and blind holdout NOT_RUN |

## Contract and rollout decisions

Keep `agdl-1.3` trace records backward-compatible. Add optional `adeq-1.1` snapshots
that reference the trace by path/hash and reuse its requirement/task/evidence IDs.
Do not call the snapshot an authoritative request record. Quality and convergence
reports are derived and may be discarded/rebuilt. A changed trace hash invalidates
that snapshot; no automatic rewrite repairs it.

The original 24 ADEQ IDs remain stable. Requirement tracing extends 02/16/19/21;
independent review extends 20/21; authority resolution extends 03/13; recovery extends
09/15; effectiveness extends 24. Rules 10/11 now distinguish suitability, feasibility
and post-execution correctness. Other procedures refer to these rules rather than
recreating competing policies.

## Release acceptance of this delivery

Required engineering checks: all executable suites pass in the stated environment;
new negative cases expose missing requirements, stale references, unknown scope,
contradictory supplied claims, unverified outcomes and repeated-gap duplication;
legacy bytes remain unchanged; generated views match canonical registers; source
hashes, manifest and ZIP checks pass after re-extraction.

Not included in that engineering claim: actual Codex/Windows behavior, semantic
completeness of user requests, trustworthy owner signatures, runtime enforcement,
measured productivity improvement, independent release review or owner activation.
Those remain explicit later qualification decisions, not silently waived gates.
