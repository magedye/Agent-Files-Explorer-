# Application-owned API harness

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Integration contract
The application owns message construction, provider selection, tool execution, persistence, policy and credentials. Follow the selected provider adapter for native protocol; the common interface here is conceptual rather than an invented cross-provider wire format.
## Implementation sequence
Resolve trusted task grant and current policy; retrieve relevant rules; construct bounded context with untrusted data delimited; call the model; parse and validate tool proposals; authorize immediately before each effect; execute through scoped capabilities; append correlated results; store evidence and durable state; repeat within time/step/retry budgets.
Handle a tool effect followed by response loss as uncertain until reconciled. Use idempotency/operation identifiers supported by the actual service. Authenticate callbacks and approvals; do not accept model-supplied actor/risk claims. All workers inherit bounded grants, not the coordinator's full credentials.
## Qualification evidence
Test every route including automatic SDK helpers, hosted tools, shell, MCP, delegated agents and retries. Input/output guards are not a universal pre-effect boundary. The included `runtime/policy.py` demonstrates only a small local file executor and must not be exposed as a universal permission service. A production harness requires real host isolation and credential custody.

## Reference scope
Official sources: OA-08, OA-07, GO-04, AN-06. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
