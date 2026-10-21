# Local reference runtime

Skill preparation and recorded-result checking: [SKILLS.md](SKILLS.md). Native discovery/loading/tool execution stay with the host; this runtime does not install skills or attest native activation.

**Dependency:** Python standard library. **Target:** Python 3.10+; actual tested interpreter/OS are in the report. **Default network:** no network calls exist in these tools.

## Commands
Run from the reference root (replace the launcher for your platform):

```sh
python tools/check_package.py --root .
python tools/run_tests.py
python runtime/cli.py init --project ../project --name "Project" --owner "Owner" --profile STANDARD
python runtime/cli.py validate --project ../project
python runtime/cli.py validate --project ../project --ready
python runtime/cli.py intake --project ../project --request ../request.json
python runtime/cli.py map --project ../project
python runtime/cli.py audit-instructions --project ../project
python runtime/cli.py demo --output ../new-demo
python evaluations/grade.py --run ../new-demo
```

`--ready` checks recorded **adoption prerequisites**, not product completion. The separate `check_state(..., ready=True)` Python function checks required goal/check consistency, not independent approval. No command executes arbitrary project build/test commands automatically. Review those commands/effects through the project contract first.

## Safe initialization and intake
Initialization requires a new `.aghr` location. It preserves root AGENTS/CLAUDE/GEMINI/PROJECT_MAP and unrelated files, copies a complete local reference, writes proposed guidance under `.aghr/proposed/`, and marks PREPARED. Unknown data/model/host facts stay unknown. No global config or Git operation occurs. A failure preserves partial output for inspection; do not infer activation. Existing adoption requires reviewed migration rather than overwrite.

Intake validates the request schema and timestamp, captures a new immutable-by-workflow record, and refuses duplicate IDs. A captured claim of approval is still a claim, not authentication or execution. Protect the record storage in the real host. The optional external canonical backend must be implemented by the project; the toolkit refuses to overwrite it as though local JSON were authoritative.

## File executor interface
`FileExecutor` accepts only `read_file`, `create_file` and `replace_file` under configured literal directory prefixes. Paths use portable forward slashes. No traversal, symlink, hard-linked file, hidden/control-plane path, unknown operation or extra authority field is accepted. Parents must exist; create never overwrites. Reads/payloads, elapsed time and attempts are bounded. These are reference choices, not universal bans for all legitimate projects.

The **trusted caller**, not the model, provides root, context callback, actor/task/environment/policy/candidate, audit sink and budgets. Replacement requires a short-lived HMAC-bound approval for exact arguments, target digest, actor, task, root, candidate, environment and policy. `issue_approval` is an operator-only demo helper and MUST NOT be exposed as a model tool. A process-generated key never appears in evidence. Nonces are one-shot in process. Recheck context before effect and after the intent-audit boundary; cancellation/revocation stops the action.

## Audit, uncertainty and residual limits
The executor records intent before effects and result after, without contents/approval material. Missing mandatory intent audit prevents effects. A completed effect followed by result-audit failure returns INDETERMINATE; inspect before retrying. Production audit storage needs durable authenticated custody beyond the default in-memory test sink.

This is **not** an OS sandbox, authentication service, authorization server, arbitrary shell mediator, network firewall, native CLI integration, distributed transaction or hostile-process TOCTOU defense. Another process that can alter the root/ancestors/target between checks remains outside the proven boundary. Keys, policy and context are ordinary Python objects here; deployment must isolate them from the governed agent. Approval replay state resets with the process, so production reuse needs a protected durable store. Atomic file replacement does not guarantee crash durability of directory metadata on every OS. Multi-process writers require real locking/transaction support.

`update_state` uses one in-process lock and expected revision, not cross-process concurrency control. File digests detect changes relative to a trusted value; they do not prove honesty. The instruction audit inventories workspace metadata, not global/imported/context loading or authority. Qualification of those boundaries follows the selected host adapter.

## Exit and status semantics
Exit 0 means the invoked local operation/check succeeded within its stated scope; exit 1 means a completed validation/test failed; exit 2 means CLI input/precondition error. ALLOW/REVIEW/DENY describe permission; EXECUTED/NOT_EXECUTED/INDETERMINATE describe observed execution. Neither is release acceptance.

## 1.1.0 optional delivery records
See [DELIVERY.md](DELIVERY.md) for smart-clarification record validation and the read-only progress command. These helpers do not widen the local executor or host permissions.

## Governed lesson records (1.2.0)
Use the local lesson command through [governed learning](../procedures/GOVERNED_LEARNING.md). The review action is read-only; capture exclusively creates a canonical intake record for LOCAL_JSON projects. Neither action edits active instructions. Explicit comparison paths bound exact overlap checks. Template values are not real evidence.
