# Executed diagnostic comparison — limited synthetic evidence

Status: EXECUTED_SYNTHETIC / SELF_AUTHORED_ORACLES / NOT_A_LIVE_PILOT.

Seven predeclared metadata cases were run: one control and six mutations. The original v1.2 G5 checks agreed with
3 of 7 labels; the v1.3 wrapper agreed with 7 of 7. Four negative metadata cases were not surfaced by the original
G5 but were surfaced by the new wrapper. Both recognized missing source units and denied authorization metadata.
These counts describe only this designed comparison, not measured rates of developer errors or model compliance.

| Case | Expected diagnostic | Original v1.2 G5 | v1.3 wrapper |
|---|---|---|---|
| CONTROL | READY | READY | READY |
| LOG_MISSING | NOT_READY | READY | NOT_READY |
| IMPLEMENTATION_CHANGED | NOT_READY | READY | NOT_READY |
| CURRENT_REVISION_CHANGED | NOT_READY | READY | NOT_READY |
| SOURCE_UNIT_OMITTED | NOT_READY | NOT_READY | NOT_READY |
| AUTHORIZATION_DENIED | NOT_READY | NOT_READY | NOT_READY |
| TASK_INCOMPLETE | NOT_READY | READY | NOT_READY |

The missing-log outcome is INCONCLUSIVE in the detailed new report, not proof that a test failed. The table collapses
all non-ready diagnostics only to compare the fixed ready/not-ready oracle. The raw distinctions remain in JSON.
The original diagnostic was not designed to validate all external artifact bytes; this is an explicit capability
extension, not evidence of a general failure of v1.2. Both checkers consume model-editable metadata and cannot
authenticate owner intent or establish semantic correctness from a hash.

No model was prompted, no task execution was compared, no external SDD tool was run and no independent reviewer
labeled these cases. The six live development families and four variants are DESIGNED_NOT_RUN. No fixture is blind
holdout. Time, token and owner-effort comparison: NO_TELEMETRY. Real-project GO/ADJUST/STOP decision: NOT_RUN.

Reproduce with `python -B tools/run_diagnostic_comparison.py`. Full outcomes are in `COMPARATIVE_RESULTS.json`;
labels are in `DIAGNOSTIC_ORACLES.json`.
