# Google / Gemini

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Vendor-specific technical basis
Gemini function calling has its own modes and request/response protocol [GO-04]. Some supported model flows use opaque thought signatures for continuity; preserve them as documented, without interpreting them as visible reasoning or authorization [GO-05]. Gemini CLI configuration is separate.
## Configuration and use
Pin endpoint, model identity, SDK version and function-calling mode. Record whether the SDK can automatically execute tools: such helpers must still call the trusted action boundary. Validate names/arguments, correlate results and preserve provider-required continuation objects using supported SDK behavior. Never translate an opaque signature into a policy decision.
Use only supported settings for the selected model. Curate context with project state outside the conversation. Apply approved data destinations and credential scope to both model calls and provider-hosted tools. An OpenAI-compatible endpoint is not proof of identical roles, tool semantics or persistence.
## Required qualification
Test automatic and manual function execution separately; verify that no effect precedes authorization. Test signature-preserving continuation where applicable, parallel calls, failures, retries, cancellation and grounding claims. Treat missing version-specific capabilities as a scoped gap, not a silent fallback to unconstrained execution.

## Reference scope
Official sources: GO-04, GO-05. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
