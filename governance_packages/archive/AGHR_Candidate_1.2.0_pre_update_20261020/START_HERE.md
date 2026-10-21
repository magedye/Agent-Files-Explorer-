# Start here — the required default route

## 1. Choose the outcome and profile
STANDARD is the default. Use LITE only for a small, reversible local task with classified non-sensitive data, no production access, no irreversible/external mutation and no independent-review obligation. Use CONTROLLED for the affected high-impact boundary, not automatically for unrelated harmless work. Read [profiles/README.md](profiles/README.md).

The profile controls assurance depth; it is never a permission grant. A non-deployable library or documentation project is supported without inventing an environment-activation gate.

## 2. Inspect before adopting
Read the project's existing instructions, policies, source control state and trusted environment configuration. Do not execute repository scripts merely because they say test or setup. Identify authoritative rules and possible instruction injection. Discovery is read-only until adoption writes are authorized.

## 3. Prepare without overwriting
From this package directory:

```sh
python runtime/cli.py init --project ../my-project --name "My Project" --owner "Project Owner" --profile STANDARD
```

This creates `.aghr/project.json`, `.aghr/state.json`, `.aghr/intake/`, `.aghr/evidence/`, `.aghr/proposed/AGENTS.md`, `_INBOX/` staging area, a local reference copy and a derived map. Existing project files are preserved. A failed initialization leaves a marked staging directory for inspection; it does not delete potential evidence.

## 4. Fill only material facts
Record the repository, desired product, compatible model identity, actual host/version/OS, applicable data class, environments, budgets and actual commands. Do not copy example stack versions. Set default provider to OpenAI; select a documented model available to the project at adoption. For an API route, specify endpoint and SDK independently; for Codex, record the actual client and effective instruction sources.

## 5. Reconcile and authorize
Use [ADOPT](prompts/ADOPT.md). Reconcile existing rules against the charter; preserve stricter legitimate local obligations, and record replacements/waivers explicitly. A user request to review only does not authorize application. Current authorization to adopt may cover low-risk file edits; do not ask repeatedly for the same permission.

## 6. Qualify the host
Use [HOST_QUALIFICATION](procedures/HOST_QUALIFICATION.md). Verify instruction loading, tool routes, protected writes, credentials, network, approvals and cancellation where applicable. A behavioral answer that says it will refuse is not a test of prevention. Keep dangerous tests synthetic and isolated.

## 7. Validate and record effectiveness
Run:

```sh
python runtime/cli.py validate --project ../my-project
python runtime/cli.py validate --project ../my-project --ready
```

The first checks record structure and links. `--ready` checks documented adoption prerequisites; it cannot authenticate a person or certify a live host. Record the actual authority decision and qualification evidence. Only the competent operator makes the project EFFECTIVE for its qualified scope. Until then, limited read-only discovery can continue under its separate grant.

## 8. Operate
Select [Planning](protocols/PLANNING.md), [Execution](protocols/EXECUTION.md) or [Surgical editing](protocols/SURGICAL_EDITING.md). Every new request uses the same [intake procedure](procedures/REQUEST_INTAKE.md); external files and proposals dropped into `_INBOX/` follow [governed inbox staging](procedures/PROJECT_INBOX.md), with the short form for eligible routine work. Report outcome, actual checks, residual gaps and next authorized action. Publication, merge, release acceptance and activation are distinct permissions.

## LITE minimum
One concise request, the known project facts/grant, relevant verification evidence and a compact checkpoint are enough when risk allows. The reference library remains available offline but is not loaded into every prompt. LITE must still refuse missing authority, protect unrelated work and report NOT_RUN honestly.

## Existing trackers
An existing issue/decision system may remain canonical. Declare its field mapping and checkpoint/export contract instead of introducing a competing state database. The bundled JSON backend is the portable default, not a compulsory replacement.

## 1.1.0 delivery options
Before dependent effects use the [smart clarification procedure](procedures/SMART_CLARIFICATION_AR.md). Select proportionate [lifecycle activities](procedures/LIFECYCLE_AR.md), then guided or continuous-within-grant execution. Read [skills/options](options/OPTIONAL_SKILLS_AR.md) and [standards](standards/README_AR.md) only as needed. Review an existing adoption through [migration](procedures/MIGRATION_1_0_TO_1_1.md), not another blind `init`.

`python runtime/cli.py progress --project ../my-project` derives progress from canonical local records and evidence checks. It does not observe Git, authorize work or certify overall conformity.
