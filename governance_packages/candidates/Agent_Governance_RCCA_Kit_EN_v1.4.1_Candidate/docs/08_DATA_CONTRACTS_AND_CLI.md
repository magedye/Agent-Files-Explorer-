# Contracts and CLI reference

## Runtime

Python 3.10+ standard library only. Run from the extracted package directory with `python -B -m agdl`.
There is no network client, dependency installation, model call or external command execution in the primary CLI.
Inputs are bounded local files; imported Markdown is never executed. Output goes to stdout only.

| Command | Inputs | Result / limits |
|---|---|---|
| `doctor` | none | Python/OS/package facts; does not inspect a user's host configuration |
| `rules-lint` | optional `--catalog` | Rule metadata consistency, not semantic conflict resolution |
| `template` | `--root --request` | Incomplete trace draft; deliberately not passing acceptance |
| `validate` | `--root --request --record --stage G1/G2/G5 --revision` | Source/ref/evidence diagnostics; G5 requires a supplied current revision |
| `bridge-import` | `--root --file --format generic/speckit/openspec` | Partial normalized envelope and raw bytes; no source writes |
| `bridge-export` | `--envelope` | Verified original raw bytes to stdout; no normalized-spec rewrite |
| `continuity` | `--record --revision` | Optional DAG/resume check; no scheduler or source re-read |
| `scope-check` | `--grant --action --request-sha256` | Declared-scope diagnostic; no authentication or execution |

Exit codes: 0 = listed metadata checks passed; 2 = detected gap/invalid contract; 3 = inconclusive or owner decision
needed. For `scope-check`, eligibility is expressly conditional on authentic authority and runtime permission.
Argparse usage errors use exit 2. A zero code never means owner acceptance.

## Trace contract

`schema_version=agdl-1.3`, `record_kind=DERIVED_NON_AUTHORITATIVE` and environment are explicit.
The nested `rcca` object retains v1.2's source segmentation and requirement contract. Additional typed records
bind specs, task references, implementation artifacts, evidence, delegation and reviews. No native source IDs
are rewritten. `references[].authority_class` describes a claim; it cannot promote the report into authority.

`bindings` connect each requirement to spec, task, implementation and evidence references. Quick-track items may
omit a separate spec/task only with a recorded proportionality reason. Mandatory implementation and verification
links still matter. Evidence belongs to exact source/revision and a stored artifact; a passed assertion is not
semantic proof. Negative requirements require suitable inspection/test evidence, not necessarily new source code.

Unknown JSON fields at declared contracts are rejected. The included validator supports the documented subset
of JSON Schema used by these owned schemas; it is not a general JSON Schema implementation. Duplicate JSON keys,
non-finite numbers, malformed structures and unsafe reference paths are rejected or classified inconclusive.
All operational template fields are in English. JSON schema URLs are identifiers; the CLI does not fetch them.

## Limited bridges

`generic`: headings and checklist candidates. `speckit`: recognized `Tnnn` checklist IDs.
`openspec`: ADDED/MODIFIED/REMOVED/RENAMED Requirements headings, named Requirement/Scenario headings and checklist candidates.
These are dialect recognizers, not full product parsers. Named headings without native IDs get **derived line IDs**,
not replacement project IDs. Checkboxes report source text only, not verified completion.

Unrecognized text, fenced code and unsupported semantics remain in the raw payload with a loss report. Duplicate
native task IDs are surfaced. **Raw-byte round trip** is the only byte-preservation claim. Semantic mapping is always
`PARTIAL_NOT_LOSSLESS`. Changing normalized records does not change raw-export bytes. Export rejects tampered raw hashes.
No Spec Kit or OpenSpec CLI was installed or exercised in this build.

```powershell
python -B -m agdl bridge-import --root examples/bridge --file speckit_tasks.md --format speckit
python -B -m agdl bridge-import --root examples/bridge --file openspec_delta.md --format openspec
```

To save output, choose an approved **new** output file. Shell redirection is a write even though the CLI is read-only;
never redirect over an input or approved source. For exact binary export on Windows, use Python's bytes API or a
binary-safe shell; PowerShell text pipelines can re-encode bytes. The tests use `export_raw()` directly.

## Security limits

Declared paths must be portable relative names. Common traversal, drive/UNC forms, Windows reserved names,
linked paths and sensitive-file names are rejected. This is defense in depth for diagnostics, not a complete
DLP classifier or a race-free filesystem security boundary. Explicit source documents may themselves contain
private data; raw envelopes preserve it. Keep outputs local unless their disclosure is authorized.

Bridge inputs are limited to 1,000,000 raw bytes; oversized derived envelopes are rejected rather than truncated. General explicit JSON/reference inputs have a bounded read limit. Unknown revision labels cannot satisfy completion or resume checks.

## v1.3.1 additions (backward-compatible)

**Trace extension:** each `tasks[]` row MAY include `completion_scope` (`REQUIRED`, `OPTIONAL`, `DEFERRED`, `OUT_OF_SCOPE`, `UNKNOWN`) and `scope_decision_ref` (a `DECISION` reference for exclusions). Existing `agdl-1.3` traces still parse. G5 emits `INCONCLUSIVE` for unbound unclassified non-DONE tasks, preventing silent readiness.

**Gate-specific input:** G1 only needs the top-level `schema_version`, `record_kind`, `rcca`; G2 additionally needs `risk_tier` and `references`; G5 requires the complete `schemas/trace.schema.json` contract. Both prior gates validate the subset they own and must not be confused with G5 approval.

**Instruction source inventory:** `python -B -m agdl instruction-audit --root . --catalog templates/INSTRUCTION_SOURCES.json` reads only caller-listed relative files under the supplied root. It emits `INCONCLUSIVE` (exit 3) even when all files are present, because neither effective host loading nor semantic priority can be proven from local files. No directory crawling, configuration mutation, hidden prompt access or host API calls occur. Use an explicit project-specific catalog. Example template paths are inert.

**Compatibility:** The CLI package version is `1.3.1`, while the document schema version remains `agdl-1.3` to avoid unnecessary migration. Historic 1.3.0 ledger results are not re-labeled as 1.3.1 execution evidence.
