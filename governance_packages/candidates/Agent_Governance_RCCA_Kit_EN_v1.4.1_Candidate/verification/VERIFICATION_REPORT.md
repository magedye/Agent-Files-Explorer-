# Verification and readiness report — v1.4.0 / ADEQ v1.1

## Executive result

Engineering implementation and the documented offline test scope are complete.
Status: IMPLEMENTED_CANDIDATE / NOT_OWNER_ACCEPTED / NOT_ACTIVE.
The package was assembled from the supplied v1.3.1, not an imagined live repository.
All new code and operational instructions are English. One developer and one primary
agent remain the intended operating model. The Core entry contains 350 whitespace-
delimited words; this is not a model-token measurement or a guaranteed loading size.

## Executed verification

| Group | Result | What it actually establishes |
|---|---:|---|
| Current package unit/CLI tests | 251 passed | 141 inherited tests (one version-string update) plus 110 new deterministic tests |
| Unchanged legacy governance tools | 20 passed | Scoped synthetic tool fixtures |
| Unchanged legacy RCCA tests | 24 passed | Source/gates/events/fixture demo compatibility |
| **Distinct executable tests** | **295 passed** | Reruns and designed QA cases are not counted again |
| JSON Schema validation | 7 distinct schemas / 8 samples passed | jsonschema Draft202012 plus package subset checks |
| Published CLI smoke examples | 7 passed | Actual commands return expected scoped metadata outcomes |
| Generated views | Match canonical JSON | Core/ADEQ/workflows have no handwritten-view drift |
| Reused components | 18 selected files unchanged | 9 current engine/schema files plus all 9 legacy Python files |
| Original inputs | All three listed inputs unchanged | SHA-256 recheck, not publisher authentication |

Environment: Linux / Python 3.13.5. No Windows or agent runtime was launched.
See `verification/V140_RUN_LEDGER.json`, `verification/V140_TESTS.txt`,
`verification/V140_SCHEMA_CHECKS.json` and `verification/V140_CLI_SMOKE.json`.
The delivery validation file provided beside the ZIP records re-extraction and final
payload-integrity checks; archive checksums are kept outside the archive to avoid self-reference.

## Defects and corrections visible in the execution record

The first complete run had one failure: an inherited CLI test still expected version
1.3.1 while the program correctly reported 1.4.0. Only that release-string expectation
was updated, and the complete 251-test suite was rerun successfully. The failing log is
retained in `verification/V140_TESTS_INITIAL.txt`. An early combined legacy run hit a
tool time limit; it was not counted as success. The separate 20- and 24-test runs passed
and have captured logs. No functional expected outcome was relaxed to obtain a pass.

## New tests and limits

Tests cover consequential/low-impact ambiguity metadata; explicit decision alternatives;
planned omissions and task scope; reuse of G5 transitive dependencies; explicit scoped
spec/plan contradictions; untrusted source handling; missing/stale references; confidence
ranges and evidence; self versus claimed separate review; recovery procedure/rehearsal
records; document axes; original bug symptom evidence; deterministic routing; read-only
file/input preservation; repeated-gap deduplication; comparable metrics; zero denominators;
missing telemetry; confounders; critical-violation visibility; malformed CLI inputs;
canonical rule IDs, workflow references and optional skill resource links.

They do not prove a model naturally makes good choices, asks necessary questions, extracts
all prose obligations, or supplies truthful annotations. The diagnostic conflict check
compares supplied keys/values; semantic review remains a task for the actual agent/reviewer.
An evidence-file hash is not proof the test ran. A valid declared decision is not an
owner signature. A separated-review field is not independently established separation.

## Designed but not run

| Activity | Status |
|---|---|
| QA-01..QA-20 with a live coding agent | NOT_RUN |
| Before/after real project outcomes | NOT_RUN / NO_TELEMETRY |
| Independent blind holdout | NOT_SUPPLIED / NOT_RUN |
| Live Codex on Windows | NOT_RUN |
| Antigravity / OpenCode qualification | NOT_RUN |
| Direct Spec Kit CLI integration | DEFERRED / NOT_INSTALLED |
| Runtime PEP/PDP or authenticated owner service | NOT_IMPLEMENTED |
| Independent review of this release | NOT_PERFORMED |
| Owner policy adoption / project activation | NOT_GRANTED / NOT_ACTIVE |

Do not infer effectiveness percentages from 295 passing tests. Synthetic metric examples
are invented arithmetic fixtures only. Published QA scenarios are authored development
material and cannot be labeled an unseen holdout.

## Delivery decision

Ready for scoped owner review and non-sensitive project qualification, not automatic
adoption. Keep old packages immutable; assess the project before adoption, reconcile
only needed guidance, and use the PRE/POST prompts to measure real effect. A critical
unknown blocks its affected acceptance/action, not all unrelated authorized work.
