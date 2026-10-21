# Anthropic / Claude

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Vendor-specific technical basis
Anthropic recommends curating useful context and starting with simple agent compositions [AN-01/02]. Its API uses tool-use/tool-result content and distinguishes client execution from server tools [AN-06]. Claude Code host instructions are a separate adapter; do not infer API behavior from a CLI filename.
## Configuration and use
Record exact model/API version, supported thinking/tool modes and server/client tool ownership. Use the provider's system/message conventions; do not transplant OpenAI roles or continuation objects by name. Match each tool result to the correct request and preserve protocol ordering. Keep tool descriptions narrow, arguments validated and untrusted results delimited. Context compaction must retain authorization constraints and pending side-effect status through application-owned state.
Keep runtime instructions short and role-specific. Add workers only for materially distinct responsibilities, tool boundaries or measurable capacity needs. Send only approved data to the configured endpoint; local Claude Code use does not by itself imply local-only model processing.
## Required qualification
Test actual model identity, tool correlation, failed tools, compacted sessions, cancellation and injection. Exercise the chosen SDK's blocking behavior before protected effects. Evaluate changes rather than assuming parity with the OpenAI baseline. Extended reasoning or internal thinking is not an approval record and need not be exposed in governance reports.

## Reference scope
Official sources: AN-01, AN-02, AN-06. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
