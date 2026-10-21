# Record schemas and validation boundary

[LESSON.schema.json](LESSON.schema.json) adds proposed-instruction classification and separate knowledge/execution states. `runtime/learning.py` checks evidence identity, coverage references, effect references and review preconditions. It neither authenticates source/decision claims nor edits active instructions. Existing record schema versions are preserved.

These schemas describe this package's portable records using a bounded subset of JSON Schema. `runtime/common.py` implements exactly the keywords present: type, properties, required, additionalProperties, items, minItems, minLength, enum, minimum, pattern and anyOf, plus metadata. Unsupported keywords are rejected by the schema audit rather than silently ignored. It is not a general-purpose JSON Schema implementation.

Validators add semantic cross-record checks: unique IDs, references, cyclic dependencies, verified-work evidence, pending resolution, LITE eligibility and readiness facts. Shape-valid templates intentionally contain unknowns and are not ready for adoption. Duplicate JSON keys and non-finite numbers are rejected. No parser authenticates a claimed authority or proves that a test producer was honest.

Budgets in templates are adjustable illustrative local defaults, not vendor limits. Template timestamps, zero digests and identities must be replaced with actual observations before evidence or effectiveness claims.
