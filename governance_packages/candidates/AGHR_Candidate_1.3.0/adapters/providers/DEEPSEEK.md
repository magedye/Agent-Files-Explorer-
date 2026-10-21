# DeepSeek

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Vendor-specific technical basis
The reviewed DeepSeek tool-call documentation describes strict mode as a beta path with schema restrictions [DS-01]. An OpenAI-like request shape does not establish complete behavioral or security parity.
## Configuration and use
Record actual endpoint, model, SDK and whether strict mode is supported on that endpoint. Verify the applicable schema subset before generating tools. Do not send unsupported OpenAI-specific fields or silently discard them. Validate arguments locally regardless of provider-side schema checks. Route calls to the same trusted policy interface and correlate results precisely.
Apply data egress rules to the actual deployment. A locally served model and a remotely hosted API have different exposure boundaries even when they share a name. Maintain durable task state, timeouts and bounded retries outside generated text.
## Required qualification
Test malformed arguments, strict-mode error responses, unsupported features, multiple calls, timeouts and recovered side effects. Confirm instruction/trust behavior experimentally without promoting tests into a guarantee. Any fallback endpoint or non-strict mode change requires an impact review and explicit disclosure of the weakened structural check.

## Reference scope
Official sources: DS-01. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
