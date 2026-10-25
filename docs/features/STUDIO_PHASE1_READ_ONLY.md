# Studio Phase 1 — read-only screens

The existing `phase0.html` entry now hosts the T07–T10 reading workspace. It uses the dedicated read server, the unchanged rc.3 candidate and CLI protocol 3. [Delivery, images and exact verification](../evidence/studio-phase1-2026-10-23/README.md).

## Launch

```powershell
npm run build
npm run studio:read -- --python=D:/APP/Agent-Files-Explorer/temp/aghr-e1a-20261022-01/venv/Scripts/python.exe
```

Open `http://127.0.0.1:5181/` and enter the temporary credential from the server terminal. Language, filters, token and index remain in memory. Refresh/restart does not restore a saved session. The server never receives an evidence output directory.

## Screens and data

| Task | Read surface | Source / limits |
| --- | --- | --- |
| T07a | Registry, text/field filters, source collection, any-column sorting, pagination, due filter, host/path applicability | Original rc.3 ItemViews; the Python engine decides applicability. No language filter. Missing values remain missing; no inferred authority, severity, priority or dates |
| T07b | Detail, raw unit/file, source digest, authority, impact, scope, enforcement declarations, relations and comparison | Relations preserve unresolved targets. Empty verification history is explicit; comparison with an earlier record is not a verification event. No editor, calibration, doctor or export action |
| T07c | Real Edge navigation, sources, ar/en, RTL/LTR, keyboard, due filter and responsive inspection | Actual source lacks nextReview, so actual overdue results are empty. A separately labelled synthetic catalog test covers the positive due case |
| T08 | Capabilities/hosts and skill detail, independent Availability/Qualification/Usage axes, declaration permissions, source evidence and four-key lookup | Five real instruction files in the sample exist and match their recorded digests. Discovery is unavailable, qualification and usage are not run. Lookup only projects recorded evidence; it never authorizes selection or qualifies a host |
| T09 | Source assurance profiles, absent project configuration/selections, temporary five-dimension scope tester | Three 1.3.0 profiles are review material, not adopted rc.3 profiles. No target project is registered or state loaded. Python computes applies/excludes/errors from the actual rc.3 source |
| T10 | Sixteen bilingual routes, five working read screens, explicit deferred surfaces, loading/empty/error states and keyboard navigation | Detail routes require selecting an item/skill. Existing six application modes remain in the unchanged original entry point and backend; their write services are not imported here |

The source selector distinguishes **one engine-validated rc.3 observation** from **50 unadopted review units in 15 categories**, including five skills. Review drafts are never serialized as valid canonical ItemViews. `scope.language` affects rendering only; untranslated source remains visible with `translation_unavailable`.

## Local read-profile API extensions

The locked `contract.1` schemas, SQL migration and 59-operation inventory are unchanged. The local profile documents the following additional authenticated GETs, using the existing envelope. These endpoints do not grant public contract completeness or implement later write operations.

| Route | Response / constraints |
| --- | --- |
| `/api/v1/review-sample` | Frozen manifest, 50 identities, register hash, PENDING_REVIEW, T11a NOT_RUN, adopted=false |
| `/api/v1/review-sample/{items,skills,profiles,hosts}` | Source projections; no query or arbitrary path input |
| `/api/v1/review-sample/items/{id}/source` | Known sample ID only; verified bytes, digest and source status. Missing/changed source remains unavailable |
| `/api/v1/review-sample/skills/{id}/qualification` | Optional host, host_version, scope, content_hash queries; exact four-key record lookup. Historical/ambiguous/missing evidence cannot be inherited. selection_authorized=false |
| `/api/v1/read-profile` | project/state/adopted_profile=null, selections=[], skill_decision=NOT_ASSESSED. Absence is neither NO_SKILL_NEEDED nor authorization |
| `/api/v1/read-scope` | path, agent, host_version, environment, stage, task_type, language; actual strict CLI result, items/findings, raw stdout/stderr, exit, engine hash and source_written=false. Engine rejection is HTTP 422, never a successful scope result |

Canonical instruction relations/history and the empty projects list are available as GETs. Actual history and projects are empty, rather than manufactured. The Python bridge now passes the already supported bounded context flags; it also preserves the protocol's diagnostic ERROR/2 with null data. Its success checks remain strict.

## Verification and preservation

```powershell
npm test
npm run test:studio-sentinel
node tools/check_context_health.mjs
```

Build before Sentinel. The harness uses isolated Microsoft Edge through direct CDP because DevTools MCP/Playwright are not installed in this project. Port 9223 belongs to another workspace; its process/profile is preserved, with isolated loopback 9224 used when free. Screenshots, attempts, protected hashes and raw receipts are retained per run.

The application has no CRUD, persistent DB, file generation, filesystem export, browser-storage persistence or installation route. Node/Python guards and memory-only SQLite remain active. Parent test tools alone write evidence, outside the observation window. This proves the tested application/API boundary, not kernel-wide interception or other application modes.

The 50-unit manifest is a presentation sample, not completed T11a review: all five review metrics remain null, all original 1,608 decisions remain pending. Native discovery/qualification, E3 enforcement, E4 seven honesty checks, release acceptance and reference promotion remain outside this delivery. Reference 1.2.0, T06 mock/native separation and provisional licensing are preserved.
