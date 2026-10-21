# Qwen / self-hosted and compatible serving

**Status:** DOCUMENTED_ONLY. **Reference review:** 2026-10-11. **Live qualification:** NOT_RUN.


## Vendor-specific technical basis
The official Qwen function-calling documentation emphasizes matching model, chat template and parser [QW-01]. A parser or stop-sequence mismatch can break tool use. A particular Qwen3 example is not a universal protocol for every Qwen model or serving engine.
## Configuration and use
Record model weights/revision, quantization when relevant, tokenizer/chat template, inference server, tool parser and endpoint. Pin these together as the serving candidate. Do not copy a generic ReAct prompt or stop words without compatibility evidence. Validate parsed calls and ensure the server cannot directly execute arbitrary generated commands.
A local model can reduce external inference exposure but does not secure plugins, package installation or outbound tools. Apply the same protected control plane and data policy. Keep model prompts minimal and evaluate task performance before adding reasoning scaffolds or multiple agents.
## Required qualification
Round-trip actual native tool requests/results, malformed calls, streaming/partial parsing, multiple calls, truncation and cancellation. Test the intended serving configuration rather than only a hosted model of a similar name. Model replacement, quantization or template/parser change invalidates relevant prior evidence.

## Reference scope
Official sources: QW-01. See [source register](../../sources/REGISTER.json). Local adoption steps are AGHR synthesis, not verbatim vendor requirements. Recheck mutable documentation at adoption and after relevant updates.
