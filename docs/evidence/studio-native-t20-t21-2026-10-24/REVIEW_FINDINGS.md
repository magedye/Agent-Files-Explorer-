# Adversarial self-review and retained failures

This is implementer self-review, not independent approval.

| Classification | Finding | Resolution / evidence |
| --- | --- | --- |
| TEST_DEFECT | Initial HTTP test expected UNKNOWN_ID exit3. E4 deliberately returns INVALID/1. | Corrected expectation, retained initial failing log; final105/105. No governing semantics changed. |
| PRODUCT_DEFECT | Rapid task switching could display an older asynchronous evidence detail. | Request-version guard; actual rapid-switch Edge regression retained in final browser proof. |
| PRODUCT_DEFECT, existing accessibility | Draft locale select had neither id nor name. | Added id; final DevTools console has no error/warning/issue. |
| REQUIRED_FOR_CURRENT_ACCEPTANCE | Native receipt/projection references must not share mutable public objects. | Clone into private WeakMap and on projection; arbitrary supplied receipt rejected. No native turn completion grants VERIFIED. |
| REQUIRED_FOR_CURRENT_ACCEPTANCE | Engine exit0 must not mask failed durable completion audit. | Atomic rollback and errored/PERSISTENCE_FAILED projection; real SQLite-trigger regression in the105-test run. |
| TEST_TOOL_DEFECT | Raw Markdown snapshots were interpreted as relocated active documents. | Preserve bytes and before manifest; rename copies `.raw`, without changing the context/link checker. Final check0 errors/warnings. |
| TEST_TOOL_DEFECT | First browser harness awaited input on a closed tool stdin. | Recorded successful interactions separately, disposed only its exact isolated context and two verified harness-owned processes; final harness uses an explicit completion marker and exits normally. Existing browser/services preserved. |
| STALE_CONTEXT in preservation boundary | Initial E3 aggregate comparison treated four app integration files as immutable engine modules. | Four changes are explicitly authorized T20/T21 edits. Their before snapshots exactly match the old seal;1916 other files and engine pins unchanged. Original comparison retained. |
| ENVIRONMENT_BLOCKED, root cause UNPROVEN | Actual Codex app-server did not respond to initialize within25s. | Job reaped all descendants; raw receipt retained. No discovery/turn/skill/qualification claimed. Native H1–H7 NOT_RUN. |
| EXTERNAL_DEPENDENCY | Antigravity desktop exists; supported agy headless runtime absent. | Adapter code targets documented public channel; no IDE/private-server substitution or installation. Native H1–H7 NOT_RUN. |

## Deliberate limits

Authenticated GET polling is the frozen protocol fallback. No browser WebSocket credentials in URLs. Selected engine emits JSON, so SARIF endpoint returns NOT_SUPPORTED rather than a fabricated report. Runtime timeline explicitly limits the rendered view to500 events, with full original source bytes. No standalone local eval is copied into CP acceptance or native host qualification. E3 generation/check/doctor use unchanged bounded adapters; their output is available when the bounded invocation returns.

Global `git diff --check` sees older unrelated dirty files with CRLF/trailing-space differences. No unrelated formatting was changed. The before/after check for this delivery is recorded separately. Build retains the pre-existing large legacy-bundle advisory. Neither condition is native runtime proof or a release decision.

The first sealing helper also treated Git's `LF will be replaced by CRLF` advisories as whitespace findings. Its complete output and snapshots are retained. The final helper records these exact advisories separately, without changing Git configuration, source bytes or whitespace rules; every other message remains a blocking finding. Final raw snapshots use `after-final/`; the earlier `after/` is preserved.
