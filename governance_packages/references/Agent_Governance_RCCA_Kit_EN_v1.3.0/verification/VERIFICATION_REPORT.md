# Verification report — English v1.3.0

**Build status:** IMPLEMENTED_CANDIDATE. **Adoption:** NOT_PERFORMED. **Owner acceptance:** NOT_GRANTED.
**Environment:** Linux, CPython 3.13.5. **Reviewer:** same package-building agent; no independent review claimed.

## Executed checks

| Check | Observed result | Evidence / precise scope |
|---|---|---|
| Original v1.2 baseline suite | 44 passed | BASELINE_V12_TESTS.txt; isolated original fixtures |
| Preserved compatibility suite rerun | 44 passed | LEGACY_TESTS_FINAL.txt; same 44 tests, not 44 additional distinct tests |
| New v1.3 suite | 116 passed | NEW_TESTS_FINAL.txt; deterministic, adversarial and unknown cases |
| Distinct unit/fixture tests | **160 passed** | 44 legacy + 116 new; no live host tests |
| JSON Schema verification | Four schemas and four sample instances passed | SCHEMA_VERIFICATION.json; preinstalled jsonschema library, not a runtime dependency |
| CLI smoke | Four commands returned expected successful diagnostic outputs | CLI_SMOKE.json; fixture only |
| Raw bridge round-trip | Two sample files preserved byte-for-byte | RAW_ROUND_TRIP.json; semantic parsing remains partial |
| Synthetic checker comparison | New wrapper agreed with 7/7 fixed labels; original G5 with 3/7 | ../evaluations/COMPARATIVE_RESULTS.json; one control and six designed mutations |
| Original user inputs | Three input digests unchanged | ORIGINAL_INPUTS_RECHECK.json |
| Original executable compatibility files | Nine files byte-identical | ../sources/LEGACY_MANIFEST.json |
| Operational language | English check passed | LANGUAGE_CHECK.json; provenance identifiers excepted |

Package AST/JSON/reference/inventory/hash checks are reproduced by `python -B tools/check_package.py` against the
final manifest. Archive integrity and extracted-copy reproduction are checked during final delivery; the external
delivery-validation receipt records those results. They are not model or runtime qualification.

## What the tests actually establish

The new checker detects selected missing/stale artifacts, broken links, invalid contracts, incomplete task states,
unknown revisions, invalid grants and declared path conflicts. The bridge preserves original bytes and does not
execute imported content. The classifier never grants real permissions. Test fixtures confirm that self-review,
synthetic labels and even internally consistent hashes do not become authenticated authority in report fields.

## Material NOT_RUN / unresolved boundaries

- Real Codex, Antigravity or OpenCode sessions, effective permissions and bypass paths.
- Actual Windows filesystem, shell, IDE, MCP and sandbox behavior.
- Live task-level baseline-versus-v1.3 evaluation and genuinely unseen independent holdout.
- Semantic extraction completeness, quality of acceptance oracles and trustworthiness of arbitrary logs.
- Authenticated owner identity, production PEP/PDP, cryptographic signing and tamper-proof storage.
- Complete full-text review of the officially announced 2026-10-29 Model Spec update; source-view discrepancy remains.
- Project adoption, global settings changes, remote Git mutations, release acceptance and deployment.

The package is suitable for source review and an explicitly scoped non-sensitive pilot. The result is not an
independent acceptance, a security certification, a guarantee against most mistakes or a complete latest-spec
conformity claim. The actual project may already have adequate capabilities and need little or no adoption.
