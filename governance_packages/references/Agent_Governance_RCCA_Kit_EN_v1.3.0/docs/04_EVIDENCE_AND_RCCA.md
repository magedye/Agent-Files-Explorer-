# RCCA gates and evidence integrity

## Gate ownership

| Gate | v1.3 behavior | What it does not establish |
|---|---|---|
| G1 | Reuses v1.2 span/requirement metadata checks; validates the v1.3 wrapper and reference graph | Complete semantic extraction or correctness of the oracle |
| G2 | Reuses v1.2 authorization/conflict metadata checks and binds a delegation artifact reference | Authentic owner identity, valid permission or a non-bypassable tool boundary |
| G5 | Uses the new scoped artifact/revision/evidence checks; applies the single-owner risk profile | Truth of arbitrary log contents, independent approval, production safety or deployment readiness |

For a v1.3 record, do not also apply legacy G5 as a competing approval rule. The unchanged legacy suite remains
available for historical compatibility, including its old risk-to-independence floors. The new wrapper imports
only its G1/G2 validation and segmentation functions. See `../compatibility/MIGRATION_MAP.md`.

## Evidence chain

Original request bytes/hash -> exact source units -> atomic requirement + acceptance oracle -> spec/task refs
(or justified quick-track omission) -> current implementation artifact hash -> scoped test/inspection artifact
-> documented review -> separate owner decision.

Reference existence, correct hashes and reciprocal IDs are useful checks. They do not authenticate the author
or prove that a command ran, a log is truthful, a test is meaningful, or a reviewer is independent. The CLI is
intentionally unable to grant an authenticated acceptance verdict from agent-editable JSON.

For real execution, capture commands/method, scope, candidate commit plus dirty-file snapshot when relevant,
runner/environment, actual exit/result, and artifact location. Bind evidence to the current request and candidate.
After a material change invalidate affected evidence, not every unrelated successful check.

`subject_revision` is a supplied label and is not independently read from Git by the CLI. Reference hashes check
only the explicitly enumerated artifacts, not the entire working tree. The operator must reconcile the supplied
revision with the real worktree. Omitting a relevant file or forging a consistent log remains a human/runtime
assurance gap, not a property this tool proves away.

## Unknown versus failure

`NOT_IMPLEMENTED` is an explicit implementation gap. `UNKNOWN` is insufficient evidence, not proof of absence.
A missing file or inaccessible log prevents readiness but is not proof a test failed. A changed known hash is
a concrete mismatch. A recorded FAILED/NOT_RUN mandatory check is not a PASS.

`NOT_APPLICABLE` for a mandatory item requires an inspectable decision reference and still needs authority
confirmation outside the model. A high-impact control cannot be waived by adding `approved=true` to a record.

## Test integrity

Establish acceptance before examining implementation outcomes. Fix broken tests when evidence shows the test is
wrong, with a reason and approved acceptance unchanged; never remove checks simply to obtain green. Record skipped,
quarantined and environment-blocked tests separately. Keep the baseline and failing evidence when diagnosing.

## Tool boundaries

All primary CLI commands are read-only and offline, with stdout output. They do not install hooks or intercept
calls. Path checks reject common aliases and linked inputs, but are not race-free production filesystem enforcement.
MCP protocol support, Markdown instructions, local hashes and optional Git hooks are not substitutes for a protected
runtime authorization boundary. Legacy ledger/demo tools can write only when explicitly invoked; see their scope
and `../compatibility/README.md` before use.
