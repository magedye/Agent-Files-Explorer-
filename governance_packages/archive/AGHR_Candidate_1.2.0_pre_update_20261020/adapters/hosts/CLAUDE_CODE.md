# Claude Code

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Loading behavior to verify
The current reviewed documentation describes direct `AGENTS.md` support in Claude Code v2.1.277+ under specified precedence/configuration conditions. `CLAUDE.md`/`CLAUDE.local.md` can affect that path; native AGENTS handling is not Codex override-file handling [AN-03]. Older blanket statements that Claude never loads AGENTS are not used here.
## Adoption procedure
Read the installed version and effective memory configuration. Choose the documented native AGENTS route when supported, or an explicit `CLAUDE.md` import/router when appropriate. Do not create both as competing authorities or blindly overwrite either. Verify included/ancestor/path-scoped instructions and trust checks.
Configure the host's permission rules and sandbox explicitly [AN-04/05]. Permission patterns, hooks and isolation are separate from prose memory. A bypass mode is not allowed merely because a task requested uninterrupted execution. Identify tools not covered by the configured isolation and restrict their capabilities separately.
## Qualification evidence
Test actual loading/precedence, permitted file operations, blocked paths, protected control-plane writes and network destinations. Re-test after host/memory configuration changes. Report missing support rather than substituting a similarly named file. This adapter is documented, not a live-tested Claude integration.

## Reference scope
Official sources: AN-03, AN-04, AN-05. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
