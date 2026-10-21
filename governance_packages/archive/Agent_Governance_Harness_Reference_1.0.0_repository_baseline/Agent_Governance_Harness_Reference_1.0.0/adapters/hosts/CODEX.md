# Codex (default)

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Loading behavior to verify
The reviewed Codex guide describes global instructions and root-to-working-directory discovery. `AGENTS.override.md` is preferred in its directory, and a configured combined byte limit (32 KiB by default in the reviewed guide) can truncate guidance [OA-04]. Working directory and fallback configuration matter. File presence is not a loading receipt.
## Adoption procedure
Inventory current global/project/ancestor/nested instruction files, explicit overrides, host version and working directory before editing. Preserve existing instructions. Prepare a short project `AGENTS.md` router to this reference and the active project state. Do not install a global policy or increase context limits automatically. Review repository-origin instructions as executable influence before trusting them.
Configure filesystem/process/network sandbox and approval policy independently [OA-05/11]. Credentials and trusted policy must not be writable by the agent they govern. Identify browser, shell, MCP, built-in, delegated and server-side routes; the package Python file executor covers none automatically.
## Qualification evidence
Capture the configured loading chain, byte-limit/override behavior and non-sensitive fixture behavior in the real host. Test allowed work plus denied write, network and escalation cases at actual boundaries. Host self-report alone is not authoritative proof. On unsupported hosted surfaces, document the narrower supported configuration rather than promising control the operator lacks.

## Reference scope
Official sources: OA-04, OA-05, OA-11. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
