# Gemini CLI

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Loading behavior to verify
The reviewed CLI documentation describes `GEMINI.md`, global/workspace and just-in-time context, configurable filenames/imports, and `/memory show` plus `/memory reload` for inspection and reload [GO-01]. Use commands from the installed version; do not assume historical names are current.
## Adoption procedure
Preserve existing GEMINI files and settings. Add a short host-specific router or use the supported context-filename configuration; do not assume AGENTS is auto-loaded. Record workspace trust, import chain and instruction observations. Review new memory content before promoting it to trusted guidance.
Configure the CLI policy engine and sandbox separately [GO-02/03]. Confirm tool decision coverage and any environment/process routes outside it. Ensure automated function execution still passes the relevant grant check. Thought-signature handling belongs to the provider adapter, not to GEMINI.md.
## Qualification evidence
Capture actual memory state without secret content. Test load/reload and path-scoped additions, policy refusal, sandbox boundaries, cancellation and error recovery. A successful normal command does not prove forbidden commands are contained.

## Reference scope
Official sources: GO-01, GO-02, GO-03. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
