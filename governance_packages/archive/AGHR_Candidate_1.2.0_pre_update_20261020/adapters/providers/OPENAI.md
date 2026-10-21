# OpenAI / GPT (default)

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Vendor-specific technical basis
OpenAI defines host-channel instruction authority in the Model Spec. This is a desired behavior specification, not a proof of compliance for a particular deployed model [OA-01]. Function calls are proposals followed by correlated tool results [OA-08]. The selected API determines conversation-state behavior [OA-12]. Model-specific guidance favors clear goals and reviewing excess scaffolding; it does not remove security boundaries [OA-03/13].
## Configuration and use
Select an available supported GPT model for the workload; record its returned identity, endpoint, pinned snapshot where available, tool protocol and actual supported reasoning/configuration options. No model identifier is hard-coded in this package. Confirm options against that model's documentation, not a generic compatibility table. Keep permanent instructions concise; retrieve relevant rules and task evidence. Give a measurable outcome and permitted tools, not a request for private chain of thought.
Preserve call/result identifiers, endpoint-required continuation items and relevant context. Use structured argument validation before authorization. Return explicit tool errors; do not relabel a rejected call as success. Do not assume structured output proves semantic validity. For a long task, use durable checkpoints rather than assuming chat history is an authoritative state database.
## Required qualification
Test authority conflicts, malicious retrieved content, supported tool schemas, tool errors, context compaction, cancellation and candidate-bound evidence. Compare outcome quality, harmful actions, latency and cost on representative tasks when model/settings change. Input/output guardrail coverage does not automatically cover every tool route. Record hosted/server-side actions separately from locally mediated calls. No API subscription or live model call is required for the local package tests.

## Reference scope
Official sources: OA-01, OA-03, OA-08, OA-09, OA-10, OA-12, OA-13. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
