# Evaluation boundaries

The runnable diagnostic comparison evaluates a metadata checker on author-created mutations. It compares the
unchanged v1.2 G5 diagnostic with the v1.3 wrapper, which adds artifact/current-revision checks and an explicit solo
profile. Labels are predeclared in DIAGNOSTIC_ORACLES.json but authored by the same builder, not independently judged.
One control and six negative mutations are not an estimate of performance on real development tasks.

BEHAVIORAL_CASES.json defines the six requested live task families plus four targeted variants. All are NOT_RUN.
They include behavior that deterministic file checks cannot verify. No real model/API/session runs, owner acceptance,
Windows permissions, runtime bypass tests, token savings or genuinely unseen holdout were performed here.

Use the exact current project baseline and authentic owner-labeled outcomes for a later scoped pilot. Record model,
host, permissions, request/worktree state, run order, errors, false blocks and available telemetry. Compare versions
without changing the oracle to fit the answer. Critical violations cannot be averaged away. Use NO_TELEMETRY for
missing cost observations and NOT_RUN for a comparison that did not happen. Live value decision remains NOT_RUN.

Reproduce the included synthetic comparison from the package root:

```sh
python -B tools/run_diagnostic_comparison.py
```

It writes JSON to stdout and temporary disposable fixtures only, never to a target project.
