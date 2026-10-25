# Unified Studio — Draft / local Sandbox

Start the general interface after `npm run build`:

```powershell
$env:AGHR_STUDIO_PYTHON = 'D:\APP\Agent-Files-Explorer\temp\aghr-e1a-20261022-01\venv\Scripts\python.exe'
npm run studio
```

Open `http://127.0.0.1:5183`. Enter the ephemeral credential printed by the local server. It stays in page memory. A restart creates a different credential. Never save the credential in screenshots, logs or configuration files. The previous `studio:read`, `studio:draft` and legacy explorer entries remain available.

## Three sources, one navigation

The16 screen entries open working read, Draft, generation, verification, governance, audit and settings components. Select `pilot-app-l2` or `pilot-app-l3` to inspect the accepted sandbox source and historical CI adoption. The selected source does not grant a live skill qualification. Historical L3 and current `NOT_RUN` may legitimately appear together.

Operational tools display their separate context: writes belong to the Draft workspace; the default registered local SQL procedure and runtime evidence source belong to `pilot-app-l3`. Switching the inspected source does not silently change a grant or execution target. Codex and Antigravity remain `NOT_RUN`.

Canonical HTTP responses use the frozen `contract.1` schemas. Existing UI components request the supplemental `X-Studio-View: extended` presentation profile for Phase5 data. This header grants no identity, role or write permission. Both profiles use the same store, authorization authority and Python engine. No governance validator is reimplemented in Node.

## Authorization

Each mutation requires a valid session, an exact one-use write grant and its matching version hash. The browser prepares an intent; the operator reviews and approves it through the local server terminal:

```text
list
approve <intent-id>
```

`attest` remains limited to the existing explicitly supported project/component source workflow. It cannot grant enterprise authority. There is no HTTP principal or grant minting endpoint. Authentication failures, refused grants and successful mutations are audited in the Draft database.

Registration adds or removes database metadata only. This deployment permits the two authorized local sandboxes; arbitrary foreign paths are rejected. Removing a registration never deletes source files. The12-table SQL contract remains unchanged.

## Verification and evidence

Verification runs use the actual bounded Python process and CLI protocol3. WebSocket reads use a30-second, one-use ticket obtained through an authenticated request and carried in the subprotocol; credentials never enter the URL. The server verifies loopback, origin, session, run and ticket binding. A closed/expired session, ticket replay, incoming socket messages and slow consumers are rejected. Polling remains visible as the separate durable run view.

SARIF is a projection of actual engine diagnostics and execution status. A SARIF document never converts an unsuccessful or unobserved run into success. Preparing runtime evidence for CI creates a Draft bundle only: `ci_status=NOT_RUN`, no PR submission, no source/state/runtime writes.

## Project adoption and CP closure

The project-adoption API creates `GENERATED_FILE` Draft CPs containing the exact accepted sandbox package, proposed files, hashes, level and profile. E5 computes the proposal hash. The project adapter runs unchanged E2/E3 Python validation, doctor, rendering, approval eligibility and export guards under T15. Project authority is inherited only for the exact policy bytes authenticated by the accepted signed CI receipt. Changed policy bytes require a separate source attestation. Higher authority and unsupported adoption levels are rejected.

An unchanged L2 re-adoption has an empty diff and a clearly marked no-change patch; it does not create a new adoption level. L3 with only historical qualification is blocked by actual E2 evidence checks. Loading that history never requalifies a procedure.

CP closure requires an exact signed post-merge CI receipt. The current deployment can close the two historical sandbox CPs from their anchored receipts. Closure is recorded in the Draft audit log and projected on the historical CP; the published source, original sandbox database and `state.json` are preserved. A CP without matching merge proof is refused. This does not claim hosted CI qualification.

## Checks

```text
npm test
npm run test:studio-api
npm run test:studio-e2e
node tools/check_context_health.mjs
```

Playwright uses isolated Microsoft Edge (`channel: msedge`), with no normal browser profile, credential traces or HAR files. API and browser evidence remain scoped to their exact candidate. Native-host qualification, independent review and public release are separate gates.
