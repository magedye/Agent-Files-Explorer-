# Authorized Draft implementation

1. T13/T14: trusted local operator bootstrap, exact short-lived one-use grants, durable SQLite12, atomic CP/audit, denial audit. Independent draft server; read-only entry preserved.
2. T15: Windows Job Object adapter before eval/qualify; hard aggregate memory cap, timeout and tree termination, partial output, explicit cancellation. Missing adapter blocks execution. Probe synthetic processes only; E4 remains NOT_RUN.
3. T16 initial slice: schema-checked proposal preview, operator grant approval, create/list/detail Draft CP over HTTP and bilingual RTL UI. No full validation/submit/approval/export success without engine capabilities.

## Acceptance before edits

- Missing/expired/revoked/wrong actor/scope/hash/replayed grant yields403 before business mutation, with durable server identity audit; raw credentials never logged.
- Authorized CP and success audit commit atomically; rejection has no CP side effect. Fresh runtime reopens disk and sees the same CP; exact12tables.
- Pinned Python E2 parser/schema alone decides draft structure, including MUST/MUST_NOT authority.level; node does not duplicate governance validation. Structural save is not native strict PASS.
- T15 controlled timeout, memory and child-tree probes; no real eval/qualify or honesty checks claimed.
- Isolated Edge creates authorized Draft, shows refusals/status, ar/en+RTL and no canonical source change. npmtest, build, contexthealth, raw outputs and parent custody retained.

## Boundaries

Only draft DB, audit, tests and operator evidence may write. Canonical1.2.0, T12mock/original drafts, engine and contracts stay immutable. T17/T18/T19, source application, final packages, E3/E4 and release acceptance are outside this task.
