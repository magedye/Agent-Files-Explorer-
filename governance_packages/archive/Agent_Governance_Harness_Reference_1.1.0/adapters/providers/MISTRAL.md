# Mistral AI

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Vendor-specific technical basis
The reviewed official function-calling guide distinguishes tool selection modes and parallel calls; execution responsibility depends on client tools versus hosted facilities [MI-01]. The page is product-scoped, not a guarantee for every Mistral deployment.
## Configuration and use
Record model, endpoint, tool-choice mode, parallel-call setting, SDK and execution owner. Prefer explicit tool contracts over a universal shell tool. Mediate every proposed effect even when the SDK offers automatic execution. Preserve call/result correlation and reject malformed or unsupported argument schemas. Check local self-hosted variants against their serving implementation rather than assuming hosted behavior.
Maintain the same governance invariants as the default path, but use native message structures. Choosing another model does not create a new permission grant. Protect secrets, context and service destinations independently of model compliance.
## Required qualification
Exercise tool-choice modes used by the application, multiple simultaneous calls, partial results, error recovery, context limits, prompt injection and evidence accuracy. Record DOCUMENTED_ONLY until the exact endpoint/host combination has passed the consumer's tests. Do not claim quality equivalence to GPT without workload evidence.

## Reference scope
Official sources: MI-01. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
