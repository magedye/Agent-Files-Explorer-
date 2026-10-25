# Native adapters + T20/T21 — Draft delivery

Owner authority: E4 local core accepted; native adapters and T20/T21 explicitly authorized. No reference adoption or publication is authorized. Local implementation/testing complete:105/105 tests passed, no failures/skips; final Edge/Sentinel and context checks are recorded below. Owner acceptance and native qualification are not self-granted.

## Implemented

- Codex App Server transport: initialize/initialized, native skills/list, ephemeral read-only thread, explicit skill input and turn notifications. Antigravity adapter targets the documented agy NDJSON headless channel, never the Electron IDE or private language server. Every process runs inside the unchanged T15 Windows Job. Opaque receipts retain private copies; caller JSON cannot manufacture an observation. Neither adapter grants VERIFIED or native qualification from a completed turn.
- T20: authenticated, one-use exact-request grants for start/cancel; FIFO queue; pinned CLI3 strict validation/lint; E3 Draft-only check/generation/doctor; registered E4 local eval/qualify. Persistent history/raw stdout/stderr/combined output, hash-bound receipt envelopes and completion audit in the existing 12-table Draft SQLite. Actual process output is observable through authenticated GET polling, as allowed by the frozen protocol. Browser WebSocket and SARIF are explicitly unsupported for this selected JSON-output profile; no URL tokens or manufactured SARIF.
- T21: trusted startup project registration, original `.aghr/runtime_evidence/` bytes/hash/line custody, canonical JSONL framing and Python E2 schema evaluation, halt indicators and separate selected/loaded/executed/verified source claims. Malformed input exposes no successful prefix. Studio never writes evidence or state.json. Timeline displays the first500 events explicitly; full raw bytes remain inspectable.
- Full Arabic/English UI and RTL/LTR in the Draft application. Existing read-only Phase0 entry remains read-only.

## Native runtime result

Codex CLI0.162.0-alpha.2 version/help passed under T15. An actual app-server attempt in a new temporary project with separate SQLite/log directories did not return initialize within25seconds; the Job reaped all descendants. Discovery and native skill execution therefore did not occur. Cause beyond the observed timeout is UNPROVEN. Antigravity desktop2.25 is installed; the documented agy CLI was not found. No installation, credential extraction or existing conversation access was performed.

Both native profiles remain **REQUIRED / NOT_RUN / NOT_WAIVED** for the seven honesty checks and eight end-to-end scenarios. The accepted seven local-process honesty checks are separate evidence. There is no Codex/Antigravity qualification, publisher trust, SEC-001 P0 acceptance, CI publication or release claim.

Raw native artifacts: `codex-version.json`, `codex-help.json`, `codex-live-discover.json`, `CODEX_LIVE_RESULTS.json`; `NATIVE_HOST_RESULTS.json` preserves the earlier pre-connection observation, superseded by the actual initialize attempt.

## Verification and preserved attempts

- `FOCUSED_ATTEMPT_1.log`: retained test expectation defect; UNKNOWN_ID correctly exits1, not3. Product semantics were preserved.
- Root `BROWSER_ACCEPTANCE.json`: retained failed first UI attempt. A rapid source switch exposed stale detail; latest-request custody fixed it. `browser-final/` preserves the next successful UI interactions and DevTools observation, plus a pre-existing locale-field accessibility issue; final browser proof is recorded separately after its minimal fix.
- `CONTEXT_HEALTH.log`: retained failure from Markdown custody copies interpreted as relocated active docs. Original bytes were preserved and copies renamed `.raw`; see `SNAPSHOT_PATH_CORRECTION.json` and the preserved original preflight paths. No validator requirement was bypassed.
- `NPM_TEST.log`, `HTTP_ACCEPTANCE.json`, `browser-verified/BROWSER_ACCEPTANCE.json`, `CONTEXT_HEALTH_FINAL.log`, `PRESERVATION.json` and final `CUSTODY.lock.json` record final outcomes. Build retains the known large legacy-bundle advisory.

## Operation

Build with `npm run build`. Start Draft with `npm run studio:draft -- --python=<absolute-python> --storage-root=<existing-isolated-draft-directory> --evidence-project=<absolute-project>`; the evidence project is optional and registered only by the operator. Use the ephemeral session credential in memory, prepare a run, approve its exact intent through the trusted server terminal, then execute. eval/qualify require server-registered skills; no HTTP argument can choose an executable or driver.

The global run deadline is600s for eval,3600s for qualify and30s for fast operations, with2GiB hard Job memory/process-tree controls. Queue waiting is not execution. User cancellation, resource exhaustion and engine rejection have separate outcomes. Standalone verification history does not modify CP approvals or grant its eval acceptance.

## Source basis

Adapter protocol follows the fetched [OpenAI App Server documentation](https://learn.chatgpt.com/docs/app-server), [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) and [Antigravity headless documentation](https://www.antigravity.google/docs/cli/headless/). Installed-version compatibility is bounded by the recorded local probes, not inferred from online documentation.

## Remaining action

Diagnose the observed Codex initialize timeout within T15 and provide an isolated authenticated agy runtime before native T23 trials. No automatic T24/CI publisher, state update, source apply or release. This implementation is a local Draft delivery, not independent review or owner release acceptance.

## Final local results

- Full suite:105/105,0 failures/skips; `HTTP_ACCEPTANCE.json` retains exact loaded-source hashes, raw runs/receipts and byte sentinel. Includes actual local eval success, unknown-ID rejection, scoped cancellation, stale/replay denial and failed completion-audit rollback.
- Edge final:9 automated checks plus DevTools inspection, Arabic/English, four widths, no horizontal overflow; final console has no error/warning/issue. `browser-verified/` is final; earlier attempts are retained.
- `PRESERVATION.json`:1916 unchanged files from the accepted E3 custody, four explicitly authorized app integration changes with matching original raw snapshots, four derived-document exceptions; E1-E3/E4 pins preserved.
- No native honesty check is marked PASS. Codex initialize failure is observed; skill execution NOT_RUN. Antigravity headless runtime NOT_RUN.
