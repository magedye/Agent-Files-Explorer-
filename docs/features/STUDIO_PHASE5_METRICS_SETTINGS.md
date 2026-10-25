# Phase5 — Metrics, reports and settings

Implementation profile: `phase5-local.1`, Draft only. Canonical rc.3 contracts and the twelve-table migration are unchanged. The [delivery](../evidence/studio-phase5-2026-10-24/README.md) records exact tests and custody. The [pilot plan](../plans/STUDIO_T34_T35_PILOT_STEPS_AR.md) is not execution authority.

## Project evaluator enrollment

`server/studio/phase5/project.mjs` registers Agent-Files-Explorer, its absolute runtime scope, three critical paths and two hash-pinned local-process evaluators. No HTTP caller supplies a driver, executable, project root or permission. Start the configured profile with:

```powershell
node server/studio/serve-draft.mjs --python=D:/APP/Agent-Files-Explorer/temp/aghr-e1a-20261022-01/venv/Scripts/python.exe --registered-project=agent-files-explorer
```

The default storage is Draft SQLite. Qualification tests use separate disposable roots. Existing services are not restarted by this delivery. The session token is obtained only from the trusted operator startup channel, never saved in reports.

Measurement supports only `OBS-REFERENCE-STATE-001` and checks its declared default against actual `server/security.js` bytes twice. A stable1→1 observation has delta0: this is measured conformance/stability, **not causal impact or improvement**. Other items require their own measurement plan.

The meta evaluator supports **additive JSON schemas with explicit valid/invalid examples**, and actually executes the frozen Python validator negative controls and L1 generation with PRIN-007. Closed-schema replacement, policies and proposed tools remain outside this evaluator's qualified scope. Unsupported subjects fail. Configuration does not grant approval; live3-run evidence and distinct governance/architecture reviews remain required. Codex/Antigravity qualification is separate and NOT_RUN.

## Metrics and dashboard

The ten rc.3 §17 metrics share one calculator: policy coverage, behavioral eval pass, exception half-life, PR generation drift, P0 calibration coverage, P0 capability qualification coverage, skill eval pass, false-success, multilingual discovery recall and qualification drift.

Each value retains status, numerator/denominator, unit and evidence. No observations means null/NOT_RUN. Median exception duration is in days. Project, host version, candidate and scope are retained; history cannot mix them. Snapshots persist raw and grouped inputs and ten scalar projections in `metrics_snapshots`. The default observation interval is90 days; bounded history is200 snapshots,2,000 runs and10,000 audit events. Reports declare the bounded local profile; they are not an unbounded compliance audit.

Only actual observed producer data populate operational rates. Local generation does not stand in for PR CI drift; a Draft-approved exception does not count as deployed/resolved; historical qualification cannot restore live authority. Discovery recall uses observed request language; older runs without it remain unobserved. Discovery reporting accuracy and honesty require their own oracle/check evidence and never borrow recall's denominator. P0 safety failures and false-success create explicit alerts irrespective of overall pass rate.

Historical host versions come from original execution receipts/lifecycle views, never the current process label. A VERIFIED reference outside the bounded window is excluded as unobservable, not fabricated as a violation or0%. An explicit absent reference or observed identity mismatch still counts as false success. Arabic script is positively observed; non-ASCII English punctuation does not identify a non-English task. Other undeclared languages remain unobserved. Final evidence composes the complete V2 regression with the V3 affected-scope regression and saved runtime projection; it is not a whole-suite V3 rerun.

The dashboard shows two separate L0/current target cards, six source-linked risks and latest20 audit entries. Metrics never confer L2/L3. Registered critical-path coverage currently counts exact CONSTRAINT/CONTROL scope matches only. The candidate's OBSERVATION does not cover a mandatory critical path. Paths/policies require owner review before broader pilot use.

## API and authorization

Reads: `GET /api/v1/workspaces/rc3-local/metrics/current`, `/metrics/history?days=90`, `/dashboard`, `/phase5/items`; `GET /api/v1/settings` and `/api/v1/audit/events` with actor/event/resource/date filters and individual IDs.

Mutations use `POST /workspaces/rc3-local/phase5/intents`, trusted local `approve <id>`, authenticated intent polling, then `/phase5/run` with the one-use grant and quoted If-Match hash. Direct settings PATCH and snapshot/report/signing POST routes require the same exact grant and body. Stale settings invalidate prior intents. Every attempt/outcome is audited with server-resolved identity; simulated labels have no authority.

Settings are event-sourced in append-only audit rows, preserving the frozen twelve tables. On restart they are revalidated before role bindings acquire authority. Role updates affect existing principals and revoke grants; they do not expose credential/principal minting. The installation owner must remain an owner. Tokens rotate at startup.

Git branch/title metadata and retention policy are editable under grants. Audit is never automatically deleted. Binding remains loopback. GPG enrollment is unavailable in this Draft profile: signing checks explicitly return NOT_CONFIGURED/verified=false; a key label cannot establish identity. No external key store is accessed. Native executable enrollment and generation budget changes require trusted qualification.

**Resource settings expose actual pinned T15 limits**600s/3600s/2GiB. They cannot be silently overridden by settings. A different resource profile requires a separately approved engine CP; the current owner explicitly preserves E1–E4.

## Reports and interface

Compliance exports JSON/MD/SARIF2.1.0; changes/skill qualification/audit export JSON/MD; metrics export JSON/CSV. Identifiers, source hashes, CP lifecycle and approvals, raw evidence references and limitations are retained. Downloads are browser artifacts; no canonical files/state are written. Source indexing alone reports NOT_RUN for compliance.

Four connected AR/EN/RTL screens expose dashboard, metrics with raw/grouped/history, audit/report export, and settings. Error/empty/busy states and local-operator authorization are explicit. All changes stay Draft; no pilot, merge, reference activation or hosted publication is performed.
