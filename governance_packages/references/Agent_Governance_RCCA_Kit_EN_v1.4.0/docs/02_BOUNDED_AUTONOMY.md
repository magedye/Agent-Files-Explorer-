# Broad autonomy for one developer and one primary agent

## Recommended model: AUTO_LOCAL within a valid task grant

The owner delegates an outcome and a bounded work area once. The primary agent then chooses implementation
steps, plans proportionately, uses relevant skills, fixes ordinary failures, runs authorized verification,
maintains the task record and produces a reviewable closeout. No approval is needed merely because a task
has several files, several subtasks, a new session, or an ordinary failed test.

The owner retains product intent, acceptable material risk, protected references and external/irreversible
commitments. Host/provider constraints remain effective even when the owner prefers speed.

## Decision table

| Action | Within an existing explicit grant | Outside or materially ambiguous |
|---|---|---|
| Read project files needed for the task | Continue; avoid unrelated secrets | Ask for the affected access only |
| Edit relevant source, tests, working docs | Continue and preserve unrelated changes | Propose a scoped extension |
| Build, lint, focused tests, local fixtures | Continue after checking side effects | Do not label an unsafe command "just a test" |
| Ordinary local defect repair | Continue within acceptance and scope | Clarify only product-changing choices |
| Local branch/commit of task-owned changes | Continue when that Git scope was delegated | Do not stage all files indiscriminately |
| Project dependency changes | Continue only under granted package/network/install-script scope | Ask about material new package execution or architectural changes |
| Remove artifacts created by this task | Continue when their provenance and disposal scope are known | Never infer authority to delete caches, untracked files or older work |
| Push/merge/deploy, paid service, production migration | Only a separate sufficiently specific current grant may cover it | Stop that action; show exact target, revision and consequences |
| Modify approved policy/acceptance criteria or host permissions | Use the distinct owner decision and qualified change procedure | Do not self-approve or silently weaken controls |

"Broad delegation" is not `full access`, disabling the sandbox, wildcard approval for arbitrary Shell/MCP,
or giving the model an admin credential. The host permission mechanism and source of the owner's grant
must remain outside the model's power to fabricate. [S03, S12]

## Grant fields and validity

Capture project/task, intended outcome, readable/writable areas, protected areas, allowed operations,
network/data destinations, budget constraints if provided, expiration or task lifetime, revocation conditions,
acceptance criteria and evidence/reference to the owner decision. Use the existing decision ledger.

The JSON template is diagnostic metadata. `status=OWNER_RECORDED` is not authenticated approval;
changing a Boolean or a JSON string cannot authorize a real action. `scope-check` never executes tools.
A changed request hash requires reconciliation; it is not a reason to ask the owner again when the existing
grant clearly covers the authorized update and a trusted record can be reconciled.

## Failures, uncertainty and recovery

Classify failure as product, test, environment, dependency or authority/scope before choosing a response.
An ordinary failing test within delegated local work means investigate and repair, not stop the whole task.
An uncertain permission or high-impact external effect means fail closed **for that action**.

Avoid retry quotas detached from context. After a repeated failure with no new evidence, state the blocker,
next discriminating check and resume condition; do other eligible work. Do not repeatedly announce that
there is nothing to do while new evidence or independent authorized tasks remain.

## Single-agent default and optional assistance

Use one primary agent as the mutation owner. A temporary helper may review or inspect a bounded area if
allowed by the current grant and data policy. It cannot expand authority. Do not require multiple accounts,
models or reviewers for every task. Coordinate any writer handoff explicitly; do not allow concurrent writers
on the same branch/worktree by default. Separate-model output is advice, not owner approval.

Prefer terminal/API and headless browser workflows that do not seize the developer's desktop. Use the
project's actual browser and platform constraints; do not install a new automation stack just for this policy.
