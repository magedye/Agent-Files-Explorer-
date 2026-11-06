# Agent Governance & RCCA Kit — English v1.3.0
## AG-DLF: a lightweight Governed Development Assurance Layer

**Status:** `IMPLEMENTED_CANDIDATE / NOT_OWNER_ACCEPTED / NOT_ACTIVE`

For **one developer-owner + one primary Codex agent** working on **small or medium projects**.
Antigravity and OpenCode are optional, version-qualified secondary hosts; they are not required services.

This is a complete, standalone English candidate kit: operating instructions, a bounded-autonomy
contract, an executable read-only diagnostic CLI, source/requirement/evidence contracts, limited
Markdown bridges, synthetic tests, a migration map, and a verification ledger. It is not a new IDE,
a multi-agent orchestrator, a replacement for Spec Kit/OpenSpec, or a production PEP/PDP.

## Start without importing the entire kit into a project

Read [START_HERE.md](START_HERE.md), then [policies/CORE.md](policies/CORE.md).
Keep this kit in a separate directory. Use the read-only assessment prompt first.
A typical adopter needs only an existing `AGENTS.md` entry/fragment, a scoped owner grant,
and one existing task record. Reuse equivalents already present. The rest stays on demand.

## Run diagnostics from the extracted kit root

Python 3.10+ syntax target (only 3.13.5 executed here), standard library; no package installation, API key, network or Docker required.
The delivered run was on Linux/Python 3.13; Windows execution remains unqualified.

```powershell
python -B -m agdl doctor
python -B -m agdl rules-lint
python -B -m unittest discover -s tests -v
python -B -m unittest discover -s compatibility/v1_2/tests -v
python -B -m agdl validate --root examples/fixture --request request.txt --record examples/fixture/trace.json --stage G5 --revision fixture-revision-1
```

The final command is a **synthetic fixture**. Success means `METADATA_READY_FOR_REVIEW`,
not genuine project completion, independent review, runtime enforcement or owner acceptance.
Use `verification/VERIFICATION_REPORT.md` for actual executed scope and remaining gaps.

## Package navigation

| Need | Read |
|---|---|
| Final implementation plan and its changes | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) |
| Highest-authority versus highest-impact instructions | [docs/01_AUTHORITY_AND_IMPACT.md](docs/01_AUTHORITY_AND_IMPACT.md) |
| Broad delegation without repeated approvals | [docs/02_BOUNDED_AUTONOMY.md](docs/02_BOUNDED_AUTONOMY.md) |
| Minimal workflows and single-owner review | [docs/03_WORKFLOW_AND_ACCEPTANCE.md](docs/03_WORKFLOW_AND_ACCEPTANCE.md) |
| Evidence, G1/G2/G5 and completion limits | [docs/04_EVIDENCE_AND_RCCA.md](docs/04_EVIDENCE_AND_RCCA.md) |
| Adoption, preservation and rollback | [docs/05_ADOPTION_AND_ROLLBACK.md](docs/05_ADOPTION_AND_ROLLBACK.md) |
| Repeated failure patterns | [docs/06_FAILURE_PREVENTION.md](docs/06_FAILURE_PREVENTION.md) |
| Provider alignment and version caveats | [docs/07_PROVIDER_ALIGNMENT.md](docs/07_PROVIDER_ALIGNMENT.md) |
| CLI/data contracts and import/export limits | [docs/08_DATA_CONTRACTS_AND_CLI.md](docs/08_DATA_CONTRACTS_AND_CLI.md) |
| Real-project evaluation still to perform | [docs/09_EVALUATION_AND_MAINTENANCE.md](docs/09_EVALUATION_AND_MAINTENANCE.md) |
| Prior-plan reconciliation | [docs/10_SOURCE_RECONCILIATION.md](docs/10_SOURCE_RECONCILIATION.md) |

## What is deliberately not claimed

No measured reduction of most developer mistakes; no statistical superiority over existing tools;
no independently labeled holdout; no live Codex/Antigravity/OpenCode run; no actual project adoption;
no complete certification against a provider's latest Model Spec. Official-source freshness discrepancies
are recorded rather than hidden. New code and active instructions are English. Legacy Python is retained
unchanged for compatibility; international punctuation in its parser is data, not Arabic instructions.
