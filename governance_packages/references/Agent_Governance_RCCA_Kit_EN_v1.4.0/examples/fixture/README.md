# Synthetic fixture — not an actual project or acceptance record

Every log, grant and review in this directory was authored for testing. The toy implementation is not evidence of
real agent behavior. Its source hash and artifact links exercise the CLI, not semantic correctness or authorization.
Never import these logs as real project evidence. Run from the package root:

```sh
python -B -m agdl validate --root examples/fixture --request request.txt --record examples/fixture/trace.json --stage G5 --revision fixture-revision-1
```

Expected: METADATA_READY_FOR_REVIEW, with explicit false values for authenticated authorization, runtime enforcement,
independent review and semantic completeness. There is no DONE, owner approval or deployment authorization.
