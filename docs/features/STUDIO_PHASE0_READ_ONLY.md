# Studio Phase 0 — read-only runtime

Status: IMPLEMENTED_AND_TESTED, 2026-10-23. [Delivery and T01 report](../evidence/studio-phase0-runtime-2026-10-23/README.md). This is a scoped demonstration, not release or native-host qualification.

## Start the demonstration

Build once, outside any sentinel observation window:

```powershell
npm run build
npm run studio:read -- --python=D:/APP/Agent-Files-Explorer/temp/aghr-e1a-20261022-01/venv/Scripts/python.exe
```

Open `http://127.0.0.1:5181/`. Enter the ephemeral credential shown only in the server terminal. It stays in page/server memory; restart rotates it. The executable must be an explicitly selected Windows Python environment with the unchanged candidate requirements installed. This existing environment is local setup, not an installed `aghr` command on PATH.

The dedicated backend imports no legacy write service. The original Vite application and six modes retain their existing launch workflow; they are outside this read-only qualification. Phase 0 uses the same React/Vite repository and shared I18nProvider, with preference persistence disabled. No new dependency or separate repository was introduced.

## Implemented surface and decisions

| Decision | Implementation / boundary |
| --- | --- |
| T01 | Owner-accepted E1/E2 source; seven receipts; actual strict/lint. CLOSED_UNBLOCKED only for local catalog/read/validate/lint, not Binding.QUALIFIED |
| T02 | Fixed SHA-256 and 46-file verification before/after invocation; executable digest within session; CLI protocol 3, shell=false; structured command/context allowlist; bounded output/time; raw stdout/stderr/exit retained in memory. Errors never become PASS |
| Python boundary | Audited launcher with `-I -B -S -X utf8`; no site/.pth before hook. Explicit trusted venv dependencies load after hook; filesystem mutation, socket and child-process operations denied. No E4 execution or T15 resource-adapter claim |
| T03 | Locked migration checksum; all twelve canonical tables, atomic transaction, user_version=1, foreign keys and temp_store=MEMORY. No persistent DB, extra table or migration change. SQLite authorizer denies ATTACH/DETACH and pragma mutation after initialization |
| Absence | No guessed authority, priority, dates or trust. API returns null/absent original values. SQL priority_tier requires non-null TEXT: literal JSON `null` is a storage-only absence marker, while API remains null. Original raw bytes and UTF-8 source snapshot stay in memory; no inferred legislative tier |
| T04 | Loopback only; startup credential, twelve-hour expiry; server-owned local-operator/developer read identity. Client role/actor claims and foreign origins rejected. This is not enterprise issuer authentication |
| Read API | Workspaces, instruction list/detail, capability list/detail/matrix; canonical envelopes. Instruction pagination binds cursor to source snapshot and filters; unknown/duplicate queries rejected; language is not a filter. Host/path applicability delegates to Python; incomplete context halts. Later routes remain unavailable |
| Session adapter | Credential-protected GET /api/v1/session returns auth.Context in standard envelope. Documented Phase 0 extension; locked canonical 59-operation contract unchanged |
| T05 | Registry/raw detail, authority.level, impact.evidence, nextReview/Review Due, Skill Card/matrix, Meta-Governance routing stub. Actual candidate has one OBSERVATION and no CAPABILITY; empty matrix and missing dates are honest. Synthetic projection tests cover populated capability, due/future records and pagination without governing acceptance claims |
| Zero write | Node permission mode and mutation guards, Python audit hook, SQLite memory/ATTACH guard, actual Edge UI/API rejection, hashes and repository watcher. Build/Edge profile/evidence collector belong to harness. Evidence covers the tested application/API profile, not kernel-wide interception of arbitrary native code or other application modes |

## Repeat the sentinel

```powershell
npm run test:studio-sentinel
```

Build must exist first. Each run saves a fresh receipt; failures remain. Observation starts before Studio startup and ends after shutdown. Positive controls deny Node write and SQLite file attachment/pragma changes. Protected markers and actual package hashes remain unchanged. Parent harness writes evidence after observation. Isolated Edge profile/cache is a named harness exclusion; owner profiles and unrelated processes are preserved.

DevTools MCP is unavailable in this session. Direct CDP drives isolated Microsoft Edge; default 9223 was occupied by another workspace, so the successful run used loopback 9224. Windows directory notifications, if any, are retained and distinguished from content mutation using unchanged last-write/birth times; unclassified or file events fail the check.

## Remaining boundaries

T06 is now CLOSED_FOR_OWNER_AUTHORIZED_MOCK_PROFILE_ONLY: [signed simulation proof and unchanged native blocking](../evidence/studio-t06-mock-2026-10-23/README.md). E3–E6, CRUD, AGENTS.md generation, persistent storage, native-host qualification, CI publishing and release acceptance are outside this delivery. Seven runtime honesty checks remain REQUIRED / NOT_RUN / NOT_WAIVED for E4. Governance source packages, reference default, INBOX inputs and provisional owner/license remain unchanged.
