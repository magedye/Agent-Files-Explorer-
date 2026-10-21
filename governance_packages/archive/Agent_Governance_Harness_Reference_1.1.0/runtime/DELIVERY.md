# Delivery helpers in 1.1.0

`python runtime/cli.py progress --project PATH` reads existing PROJECT/STATE records, runs their local structural/semantic/artifact checks and derives counts. It writes nothing, does not run Git, does not refresh an external tracker and cannot authorize or certify work. Zero criteria produce null, not 100%. Contradictory PASS/FAIL evidence is reported with nonzero exit status rather than silently picking a preferred record.

The REQUEST extension validates question options, material-versus-assumption constraints and decision-reference presence. Capture is not approval, and the bounded file executor does not consult this field as an authorization mechanism. An actual host must integrate unresolved decisions with its execution gate.

The STATE extension records selected mode, grant reference, plan baseline, lifecycle phase, Git observations and evidence-linked findings. Unknown observations remain null. Closed findings need PASS retest references. High/critical open findings block `check_state(..., ready=True)`; reference presence is not authenticated risk acceptance.

`tools/decision_support.py` classifies caller-declared booleans only. `tools/metrics.py` performs counts only. Neither understands natural-language ambiguity nor reads private reasoning. Local tests therefore do not demonstrate behavioral improvement of a model.

Compatibility: optional fields add capabilities to the existing schema_version 1.0 record family. Version 1.1 readers accept original records; unmodified 1.0 readers reject unknown extensions. Migration/rollback must account for reader version. See [migration](../procedures/MIGRATION_1_0_TO_1_1.md).

A declaration of complete measurement scope requires a plan baseline reference. Default-branch-only observations also require timestamp and evidence reference. Conflicting success/failure for one criterion blocks `check_state(..., ready=True)` until explicit reconciliation; prior failures must remain in appropriate historical custody.
