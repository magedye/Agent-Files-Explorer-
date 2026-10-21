# OpenCode (multi-provider host)

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Loading behavior to verify
The reviewed rules guide documents AGENTS instructions, compatibility behavior and configured instruction sources. Remote instruction URLs introduce a separate supply-chain/data boundary [OC-01]. Pin the selected host version and configuration.
## Adoption procedure
Inspect existing AGENTS/CLAUDE/configuration before adding a router. Do not activate remote instructions by default. Record source origin, loading order and provider combination. A host-compatible provider still needs its own adapter qualification.
The reviewed permission guide uses allow/ask/deny and ordered matching; agent-level configuration can affect permissions and permissive defaults may apply [OC-02]. Specify the intended boundary explicitly and test effective matching order. Do not infer that an automatic mode bypasses explicit deny, or that a broad earlier rule cannot be overridden. Never distribute blanket allow configuration as a safe default.
## Qualification evidence
Test exact/path-specific versus wildcard rules, ordered conflicts, agent overrides, external directories, automatic approvals and denied effects. Record the effective runtime decision, not only the config text. Require OS/service controls for routes beyond host policy coverage.

## Reference scope
Official sources: OC-01, OC-02. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
