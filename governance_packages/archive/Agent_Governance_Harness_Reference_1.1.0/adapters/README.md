# Provider and Host Adapters

Select **one provider** and **one host** for each execution route. OPENAI is the default provider and CODEX the default coding-host example; an application-owned API uses GENERIC_API. These selections do not assert a model name, subscription, endpoint availability or authorization.

| Axis | Adapters | Governs |
|---|---|---|
| Provider | OPENAI, ANTHROPIC, GOOGLE, MISTRAL, DEEPSEEK, QWEN | Model/API protocol, continuation, supported options |
| Host | CODEX, CLAUDE_CODE, GEMINI_CLI, OPENCODE, GITHUB_COPILOT, GENERIC_API | Loading, tools, permission surfaces and isolation |

Each adapter names official sources, configuration checks, differences and required tests. All are DOCUMENTED_ONLY; none was live-qualified while building this package. These are documented independent adaptation routes, not executable universal integrations. An unsupported provider/host combination must not be advertised as tested.

## Common adaptation record
Record actual provider/model/endpoint, host/version/OS, instruction sources and precedence, tool routes, SDK/server versions, trust/storage locations, credential/egress boundaries, grant/approval decisions, context/continuation behavior, budget support, observed limitations, test fixture IDs and evidence. Use `templates/HOST_QUALIFICATION.md` and the project profile.

## Common minimum tests
Verify protocol round-trip, instruction loading, scoped conflicts, untrusted content, allowed and forbidden actions, protected control plane, denial before effect, cancellation, retry after a partial effect, representative outcomes and evidence truthfulness. Include actual out-of-boundary attempts; asking the model what it would do is not an enforcement test.

## Changing a provider is a change request
Do not translate roles, tool schemas, thought signatures or permission settings by name alone. Identify unsupported fields, inspect official current behavior, adapt explicitly and run affected tests. Benchmark results cannot silently lower an invariant. Documentation claims are not reliability guarantees.
