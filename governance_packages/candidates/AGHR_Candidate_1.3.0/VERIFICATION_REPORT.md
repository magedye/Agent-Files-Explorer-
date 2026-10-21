# Verification — AGHR 1.3.0 candidate

## Actual checks

Read the current [test summary](verification/results/skills-1.3.0/unittest-summary.json), [raw runner log](verification/results/skills-1.3.0/unittest-raw.txt) and [frozen package check](verification/results/skills-1.3.0/package-check.json). These files record actual status and counts; this document does not manufacture PASS before execution.

The suite includes original local tests, P0 evidence/state regressions, P1 host/project/phase checks, and [eight scripted CLI/project scenarios](tests/test_skill_scenarios.py). CLI subprocesses use isolated temporary projects. A small local feature is executed and checked; an actual failing scripted process remains a failure after instruction loading. Scope: LOCAL_REFERENCE_TOOLS_ONLY and LOCAL_SCRIPTED_CLI_AND_PROJECT_SCENARIOS.

## Qualification and custody

- Native Codex/Antigravity skill qualification and live model evaluation: NOT_RUN. Host-internal attribution can be NOT_OBSERVABLE; see [the qualification record](evaluations/SKILL_HOST_QUALIFICATION.json).
- Independent review: NOT_PERFORMED; implementer self-review is not independent review.
- Release acceptance: NOT_GRANTED. Consumer adoption: NOT_ADOPTED.
- Reference 1.2.0 and its distribution remain preserved; this candidate is not the application default.
- The payload manifest excludes post-freeze results under `verification/results/`. The detached complete ZIP digest covers the delivered result bytes. Workspace custody contains before/after hashes and diff. Historical verification and the prior update report retain their original scope.
