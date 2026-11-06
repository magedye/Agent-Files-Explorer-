# Adopt without replacing existing governance

## Read-only baseline first

Identify the project root, actual instruction sources, existing owner grants, current task/spec records, changed
tracked and untracked files, available skills, host version and evidence access. Do not read secrets merely to
complete an inventory. Record gaps as ACCESS_DENIED, TOOL_UNAVAILABLE, NOT_RECORDED, OUT_OF_SCOPE or
INSUFFICIENT_EVIDENCE; denied access may be a correct control, not a defect.

Keep the AS-IS observations distinct from the later FIT-GAP comparison. Existing adopted AGHR material remains
part of reality; a new candidate package does not supersede it because its version number is newer.

## Smallest installation footprint

There is no installer. Normally keep this kit outside the project and reference the selected guidance.
Use existing equivalents for: (1) a short instruction router, (2) an owner grant, and (3) a task/handoff/evidence record.
Copy only necessary reconciled fragments under explicit integration authorization. Do not create a second
`agent_requests`, task database, acceptance ledger or skills registry.

Before an authorized edit, preserve the exact prior bytes and a scoped diff/revert plan. If the relevant file contains
unrelated pending changes, do not overwrite or silently absorb them. Do not use `git reset --hard`, `git clean`,
force-push, bulk staging or repository-wide formatting as an adoption shortcut.

## Host qualification before active use

For the selected actual host/version, show where instructions are discovered, what instructions are visible,
what OS/host boundaries actually apply, and which tools can write or access the network. With a separately
approved harmless fixture, demonstrate an allowed operation and a prohibited operation on each relevant path
(Shell, file tools and MCP). Do not probe production or unrelated personal files.

The first low-risk project trial can proceed without building a PEP service, using the host's existing suitable
sandbox and permissions. Actions needing stronger guarantees remain out of scope until that boundary is qualified.
No "allow all" defaults are supplied. A shell command may access more than its declared targets.

## Rollback

Remove only the integration changes attributable to this adoption, restoring the saved baseline and reconciling
subsequent legitimate edits. Retain the decision and evidence history. Revoke the affected grant through the existing
owner mechanism. Do not remove another skill, shared dependency or configuration merely because it overlaps.
The original supplied archives are never overwritten by producing this kit.
