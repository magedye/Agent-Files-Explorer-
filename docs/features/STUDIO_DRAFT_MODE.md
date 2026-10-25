# Studio Draft mode — local E3/T17/T18 and patch artifacts

This is an explicitly authorized local Draft profile. The existing read-only server and reference1.2.0 remain separate. [Original storage delivery](../evidence/studio-draft-auth-cp-2026-10-23/README.md). [Accepted E5/lifecycle delivery](../evidence/studio-e5-t16-preview-2026-10-23/README.md). [Current local controls/approval/patch evidence](../evidence/studio-e3-t19-2026-10-24/README.md).

## Launch and create a draft

```powershell
npm run build
npm run studio:draft -- --python=D:/APP/Agent-Files-Explorer/temp/aghr-e1a-20261022-01/venv/Scripts/python.exe
```

1. Open `http://127.0.0.1:5182/`. Enter the ephemeral session credential shown in the local terminal. Credentials stay in memory.
2. Enter title, one of thirteen governance kinds, request reference and one YAML/JSON item. Choose **Check and prepare draft**. Preparation has no CP/business persistence and issues no grant.
3. Review the proposal and its hash. The trusted local operator uses `list`, then `approve <intent-id>` in the server terminal. `revoke <intent-id>` cancels the intent. HTTP cannot create identities, claim roles or approve/mint grants.
4. Choose **Check authorization**, then **Save draft**. The backend requires the exact server-issued grant and quoted `If-Match`. A grant expires two minutes after preparation and is consumed once.
5. Inspect the saved package or **Audit log**. `quit` stops the local server. Restart rotates all session credentials and grants while retaining saved Drafts and audit records.

Draft bootstrap and Python operations run under the existing T15 Windows Job adapter:30s/2GiB for catalog/prepare/edit/validate/generate/doctor/check/approval/preview/export/lookup. eval600s/qualify3600s remain unchanged and unrun. Structured inputs use private transient OS temp files, removed after invocation; child Python is audited read-only. Exact unchanged structural preparation can reuse its bounded result in memory; this is not a new strict/eval execution claim. Only one engine request runs per session; busy429. The legacy read-only profile retains its existing transport and memory catalog.

The local OS account identifies the operator at startup. That explicit operator bootstrap owns the governance-owner role for this local installation; it is not an enterprise identity or a package-publisher signature. A host with shared OS credentials is not separately qualified by this profile.

## Persistence and authorization

Default application storage: `.governance/studio-drafts/studio.sqlite`, ignored by Git. A trusted `--storage-root=<absolute-existing-directory>` selects a different Draft store. No HTTP parameter selects a database or source path. The owner explicitly authorized this persistence; the historical SQL draft comment did not grant it.

The unchanged pinned migration creates exactly twelve tables, with foreign keys, transactional migration, checksum and DDL fingerprint. Canonical workspace metadata remains read_only=1. No target adoption project is invented: `studio-drafts` is the grant namespace. Each CP insert and its successful audit/provenance record commit together; audit failure rolls back the CP. No application path applies policies or AGENTS.md to source, or writes state.json/runtime_evidence. Only Draft DB/audit and authorized patch artifacts persist.

Every attempted mutation in this Draft backend is audited, including unsupported/legacy paths. Known sessions retain their server-registered actor on denial; unrecognized credentials are `unauthenticated`, never a body-supplied identity. Authentication failure is not a successful actor verification. Audit bookkeeping and trusted startup/console authorization are internal security operations, not CP grants.

| HTTP behavior | Result |
| --- | --- |
| Missing/unknown/expired/revoked/replayed/wrong actor or scope grant | 403 before business mutation; unknown grants rejected before body parsing |
| Valid grant, missing `If-Match` | 428 |
| Valid grant, stale proposal hash | 412 |
| Pinned Python rejects the structure, including mandatory authority.level | 422, no CP |
| Authorized exact prepared intent | 201, status=draft |
| Audit unavailable or CP/audit transaction failure | 503, no unlogged successful CP |

## API surface

All endpoints require `X-Studio-Token`, enforce loopback/host/origin and use the contract.1 envelope. A browser role/actor header grants nothing.

| Route | Operation |
| --- | --- |
| GET `/api/v1/session` | Server-owned identity/context |
| GET `/api/v1/draft-status` | Draft storage and capability limits |
| POST `/api/v1/draft-intents` | Authenticated read-only structural preview; 64KiB preparation budget; bounded Python parser; no grant |
| GET `/api/v1/draft-intents/{id}` | Same-principal intent status and operator-issued grant, if any |
| POST `/api/v1/workspaces/rc3-local/change-packages` | Locked Create body (`title`, `kind`, `proposed_yaml`, optional source/target), `X-Write-Grant`, quoted `If-Match`; persist exact prepared content |
| GET `/api/v1/workspaces/rc3-local/change-packages` | Latest100 drafts |
| GET `/api/v1/workspaces/rc3-local/change-packages/{id}` | Durable CP detail |
| GET `/api/v1/audit-events` | Latest200 attempts/decisions, no credentials |

Draft intent/status/audit routes are documented local profile extensions, not amendments to the locked59-operation public inventory. Other/legacy mutations remain403; the new patch-only paths do not grant legacy source apply or commit.

## T15 resources and T16 limits

`job-runner.js` uses the Windows adapter with eval600000ms / qualify3600000ms / memory2147483648bytes. Atomic JOB_LIST assignment precedes execution; no breakaway, hard aggregate committed-memory limit, independent watchdog and whole-job termination. Partial stdout/stderr remain separate. Timeout/memory/output excess is `resource_limit_exceeded`; cancellation is `errored / user_cancelled`. Missing controls fail closed.

Only controlled fixture processes exercised this adapter. Native E2 still implements catalog/validate/lint; no real eval/qualify or seven E4 honesty checks ran; the separately pinned E3 local profile now executes real controls. Linux/macOS adapters are unavailable. Raw Windows peak memory is retained, including its observed value above the configured small test cap; actual allocation rejection and hard-limit readback are separately recorded.

## E5 proposal core and T16 lifecycle

The separately pinned Python E5 extension owns RFC8785/JCS, exactly seven metadata fields, original YAML including CRLF, proposal schema and wrapper matching. Its unmodified rfc8785 0.1.4 source carries Apache-2.0; this does not change the package's provisional MIT license. The E2 source and locked schemas stay unchanged. E5 uses E2 lint's complete strict pipeline on a lossless in-memory base overlay; advisory findings are separated without rerunning the pipeline. Mandatory authority, source, conflict and evidence failures remain failures/BLOCKED. Operational calibration/selection/generated-file proposals hash but remain blocked for full validation without their downstream implementation/evidence.

Select a Draft and choose an action: prepare edit, strict validate/lint, submit for review, or generation preview. Each prepares a separate exact-hash intent requiring the same local operator authorization channel. A console `approve <intent>` grants a single action; it does **not** approve the CP as governance.

| Route | Requirement and outcome |
| --- | --- |
| GET `/api/v1/workspaces/rc3-local/cps/{id}` | Canonical detail, current checks, previews, approval history |
| POST `/api/v1/workspaces/rc3-local/cps/{id}/intents` | Local profile extension: `{operation: edit/validate/submit/generate, payload?: ...}`, quoted current If-Match; no business mutation or grant |
| PATCH `/api/v1/workspaces/rc3-local/cps/{id}` | Locked Edit body `{proposed_yaml}`, grant bound to new hash and If-Match old hash; atomic edit/invalidation/audit |
| POST `/api/v1/workspaces/rc3-local/cps/{id}/validate` | No body; exact grant/hash; 202 after actual Python strict+lint; raw report in verification_runs |
| POST `/api/v1/workspaces/rc3-local/cps/{id}/submit` | No body; only validated current proposal -> in_review; no approval |
| POST `/api/v1/workspaces/rc3-local/generate/preview` | Locked `{agent: codex, profile: draft-l1, dry_run: true}`, exact CP grant/hash; Generation response only |

Every changed proposal returns to draft and clears checks, generation and active approvals atomically. Prior verification_runs stay immutable; approval history retains original identity, decision, reason, hash and timestamp, plus invalidation reason/time. No-op edits do not manufacture a new version. Stale/ungranted requests and transaction failures leave the current proposal intact; consumed grants stay consumed even after transaction rollback. A changed base requires explicit rebase, not silent reassignment.

## E3/T17/T18 and patch boundary

The separately pinned E3 extension reuses immutable E2/E5. Doctor exercises an implemented local patch secret detector and records control hash/positive and negative controls/actual proposal inspection. It makes no complete-secret-detection or remote GitHub protection claim. A declared unknown gate remains BLOCKED/NOT_OBSERVABLE. Only the exact E2 unavailable-enforcement finding discharged by real E3 evidence is resolved. Mandatory source/E4/qualification findings stay intact; omitting priority cannot evade a canonical P0 obligation.

Initial preview: Codex/draft-l1,L1,32768 UTF-8 bytes. All four stages work. Genuine PRIN-007 text is supplied from the pinned normative contract without granting CP authority. Compact independently reads the current proposal from SQLite, recomputes JCS, fetches the actual rules and records matching content hashes. Generated instructions name the real read-only CLI; the source and proposal are bound. Availability is qualified only for this local Codex shell/SQLite profile, not other hosts or deployments.

```powershell
node tools/aghr_get_rule.mjs --cp-id=<CP-ID> --hash=<proposal-hash> --id=<item-id>
node tools/aghr_studio_cli.mjs validate --strict --input=<request-json>
node tools/aghr_studio_cli.mjs doctor --input=<request-json>
```

CLI input contains payload/base and optional preview/context, never trusted source grants. All Python operations use T15. Local operator `attest <validate-intent-id>` can attest an exact project/component source only when its owner/approvedBy match the authenticated local operator. This records a hash-bound audit attestation, not an enterprise identity or publisher signature. HTTP cannot call that channel or mint identities. A changed proposal invalidates the attestation by hash.

Additional routes, all with session authentication and scoped grants for effects:

| Route | Outcome |
| --- | --- |
| POST `/api/v1/workspaces/rc3-local/cps/{id}/doctor` | Actual bounded doctor; unavailable gates remain failing checks |
| POST `/api/v1/workspaces/rc3-local/cps/{id}/preview` | Source-preserving patch diff, no source apply |
| POST `/api/v1/workspaces/rc3-local/cps/{id}/approve` | Locked ApprovalRequest; server actor/role, current hash/checks/acknowledgements; actual DB decision |
| POST `/api/v1/workspaces/rc3-local/cps/{id}/export` | `{format: patch}` only; all required checks and distinct reviewers, exclusive patch file in Draft artifacts, audit rollback |
| POST `/api/v1/workspaces/rc3-local/cps/{id}/draft-patch` | Explicit local review-only extension; labelled NOT_APPROVED, CP status unchanged; cannot close T19 |
| GET `/api/v1/workspaces/rc3-local/cps/{id}/artifact` | Exact current-hash saved patch only, hash/regular-file/path checks, no URL credential |

The intent operation set adds doctor/preview/approve/export/draft-patch. Approval/export requests carry their locked bodies; read/doctor/submit have none. A console execution grant is never the CP review decision itself. Policies changes require governance-owner and a distinct security-owner reviewer in this local profile. Trusted identity integration registers the actual reviewer; tests using isolated registered identities do not establish independent human review. The default local UI is the governance-owner session and cannot manufacture a second role through a body.

Approvals and generation acknowledgements bind proposal/content hashes. Editing resets checks/preview/approvals, retains original history and resets the UI decision/acknowledgement form. Approval/export compares the full current CP view after asynchronous Python checks, so concurrent review/check changes cannot silently pass. Approved export is a patch artifact only; never apply, commit, merge, state publication or final package. A failed audit rolls back DB and the newly created artifact. No-op edits do not revive stale evidence.

Canonical SEC-001 remains unapproved: enterprise source and GitHub gate lack actual evidence, while its P0 eval is required and E4 is expressly NOT_RUN. A review-only patch is available without pretending those obligations passed. No E4 or T01 re-evaluation was performed. Production identity/remote controls/CI/release qualification remain outside the local proof.
