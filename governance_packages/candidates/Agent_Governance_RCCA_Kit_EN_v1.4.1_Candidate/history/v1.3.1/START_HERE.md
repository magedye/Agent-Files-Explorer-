# Start here

## 1. Know what is authorized

The owner's current request authorizes building and testing this isolated kit. It does **not** authorize
installing it into another project, replacing existing policy, changing global agent configuration,
starting cloud services, pushing, merging or publishing. The original planning document's old
`NOT_APPROVED_FOR_IMPLEMENTATION` state is superseded only for this isolated deliverable.

## 2. Keep the adoption small

Start with `prompts/01_ASSESS_AS_IS.md` in the actual project. Do not send every policy file into the agent
context. The initial report must describe current reality before an AG-DLF comparison.

After reviewing that report, the developer-owner can authorize a scoped integration using
`prompts/02_ADOPT_SCOPED.md`. Reconcile `templates/AGENTS.fragment.md` with existing instructions;
never overwrite the original `AGENTS.md`. Record one valid task/project grant using the existing
owner-decision mechanism. `templates/DELEGATION.json` is an inert example, not that mechanism.

Use `prompts/03_EXECUTE_AUTHORIZED.md` for eligible work. The agent should proceed without repeated
approval requests, while preserving host permission checks and owner-reserved actions.

## 3. Verify the delivered artifact

```powershell
python -B tools/check_package.py
python -B -m unittest discover -s tests -v
python -B -m unittest discover -s compatibility/v1_2/tests -v
```

Package checksums detect accidental changes against the delivered manifest. Someone who can replace
both files and manifest can forge them; this is not signature verification. Review unfamiliar code
before executing it. Tests mutate temporary fixture directories only.

## 4. Separate engineering results from adoption

The developer can be owner, maintainer and accepting reviewer: this kit does not invent three extra
people. The primary agent's self-review remains self-review. A separate session or optional secondary
model is additional scrutiny, not automatically independent approval. Higher-risk actions need
proportionate independent evidence and actual runtime protection; absent that, block only those actions.

No automated installer or live enforcement service is included. See `adapters/CODEX.md` before any
explicitly authorized host configuration change.

## 5. Apply the v1.3.1 correction without importing a new hierarchy

Use this kit as a separate reference until project adoption is authorized. For a trace created under 1.3.0, optionally add `completion_scope` to unfinished unbound tasks; otherwise G5 reports them `INCONCLUSIVE`. Re-run G1, G2, G5 against appropriate source and revision rather than assuming an old `METADATA_READY_FOR_REVIEW` remains valid. For instruction-source inventory, provide an explicit file list; discovered does not mean loaded. Read `docs/11_V131_CORRECTIVE_SCOPE.md` before any integration.
