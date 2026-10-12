# GitHub Copilot surfaces

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Loading behavior to verify
The official guide describes repository-wide and path-specific custom instructions, with support dependent on the Copilot surface [GH-01]. A coding agent, IDE chat and code review are not interchangeable hosts.
## Adoption procedure
Identify the exact surface/version and supported instruction files. Reconcile `.github/copilot-instructions.md`, path-specific `.github/instructions/*.instructions.md` and any agent instruction support for that surface. Keep files as scoped routers to canonical policy rather than full duplicate rule catalogs. Do not silently commit or enable workflows during adoption.
Constrain repository tokens, workflow permissions, secrets, branches and external access independently. A pull-request write grant is not a release/deployment grant. Test the surface's network/tool execution limits rather than assuming local IDE restrictions apply remotely.
## Qualification evidence
Prove scoped instruction behavior in the selected surface. Exercise untrusted issue/PR text, branch protection, failed checks, sensitive files and workflow changes. Repository-wide setting visibility does not establish enforcement of every execution route. Live GitHub actions are not included in package tests.

## Reference scope
Official sources: GH-01. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
