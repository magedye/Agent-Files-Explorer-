# E4 native core — separate extension, protocol 3

## Trust and scope

`e4-bridge.js` is the trusted backend entry. Task tokens, selected state and
live process proofs are process-owned; returned JSON and telemetry cannot
reconstruct them. `entry.py` is private host RPC, **not** a public producer
authentication boundary. Never expose it to HTTP with user-supplied `host`.
The public `tools/aghr_e4_cli.mjs` rejects receipt/host claims in request JSON.
`--host-config` is explicit OS operator configuration for registered read-only
Python drivers; no HTTP endpoint accepts it. No new HTTP routes are enabled.

The built-in host is **aghr-local-process**, with the running Node version.
It is an actual controlled process host, not an impersonation of Codex or
Antigravity. Its qualification applies only to the registered procedure,
content, driver, version and declared scope. It proves no LLM behavior or
native agent activation. Native agent qualification remains separate.

## Evidence and verification

- Imported JSONL is schema-checked and retains hashes/line locations. Declared
  source fields never authenticate a producer or grant execution/verification.
- Only actual bounded process completions can populate private proofs. Input
  bytes and both original streams have hashes/base64 custody. UTF-8 decoding
  is strict; empty output and failed execution cannot become VERIFIED.
- `task_criteria` is a required JSON string containing nonempty `all` clauses:
  JSON Pointer + `equals`, `contains` or `nonempty`. JSON is the default output
  format; `format: text` is explicit. No eval, dynamic code or arbitrary regex.
- A local HOST_SIGNAL means the local host controller acknowledged the actual
  Windows Job invocation. It is bound to task, phase, run id and actual PID.
  It never means Codex/Antigravity acknowledged activation. Missing observation
  remains NOT_OBSERVABLE and cannot be promoted by a JSON claim.
- Qualification requires >=3 distinct actual executions (>=5 for release
  assessment), host/version/scope/content/driver/engine binding and declared
  criteria/tolerance. P0-Safety tolerance is exactly zero. A restart cannot
  import a stored JSON record as trusted qualification: E6 durable trust and
  T21/T24 ingestion are separate work.

## Resources and immutable parents

E1/E2/E3 and accepted E5 are unchanged. E4 verifies the E3 parent pin, which
verifies its immutable parents, and its own SOURCE lock before/after calls.
The lock hashes the bridge after replacing **only** its self-referential
`sourceHash` literal. Delivery custody additionally hashes raw bridge bytes.

Every Python validation is read-only under T15; general checks use30s/2GiB,
actual eval600s/2GiB and qualify3600s/2GiB. Driver source is snapshotted into
process-owned temporary storage, not executed from mutable request text.
No source apply, package promotion, canonical state or default Draft DB write
is implemented here. Temporary transport files are removed by exact path.

The real local regression suite tests seven honesty guards and eight workflow
scenarios with actual executables and adversarial inputs. There are no mocked
engine/provider/verifier returns. Unit/core evidence is not host/release
acceptance; see the delivery for separate Codex/Antigravity NOT_RUN statuses.
