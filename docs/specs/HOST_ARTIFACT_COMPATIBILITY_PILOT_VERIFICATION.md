# Host Artifact Compatibility — Pilot Verification (Brief)

**Status:** `READY_FOR_OWNER_REVIEW`
**Scope:** local implementation + tests only. No file installation, no host activation, no policy/permission change, no `commit/push/merge/release/deploy`.

## 1. What was implemented

| File | Role |
|---|---|
| `server/host-compat/host-compat.contract.json` | Source of truth: artifact kinds, tools, compatibility status, destinations, detection, spec provenance |
| `server/host-compat/contract.mjs` | Strict contract validation (schema, tools, safe relative destinations, `{slug}`, maxBytes, trust) |
| `server/host-compat/renderers.mjs` | Pinned deterministic renderers `claude-agent-md@1`, `cursor-mdc@1` + module hash |
| `server/host-compat/samples.mjs` | Type-appropriate sample inputs (agent definition / project rule) |
| `server/host-compat/preview.mjs` | Read-only detect + in-memory render + destination validation + diff |
| `server/api.js` | Three **GET-only** routes: `/api/host-compat/{tools,detect,preview}` |
| `server/staging.js` | `safeFile` exported for reuse (path + symlink guard) |
| `src/components/AdoptionView.jsx` | Host-compat panel inside the existing Adoption screen |
| `src/i18n/messages.js` | AR/EN copy for the new panel |
| `src/index.css` | Panel styles on the existing design system |
| `tests/host_compat.test.mjs` | 13 contract/renderer/safety/no-write/API tests |

## 2. Artifact kinds and honest compatibility

| Tool | `AGENT_DEFINITION` | `PROJECT_RULE` | `PROJECT_INSTRUCTIONS` | `AGENT_SKILL` |
|---|---|---|---|---|
| Claude Code | **PARTIAL** | UNSUPPORTED | UNSUPPORTED (out of pilot) | UNSUPPORTED (E4 path) |
| Cursor | UNSUPPORTED | **SUPPORTED** | UNSUPPORTED (out of pilot) | UNSUPPORTED (E4 path) |

- **PARTIAL is explicit:** Claude Code sub-agents support `name`/`description`; the presentation fields `color`/`emoji`/`vibe` are not part of the host schema and are reported as dropped.
- **Unsupported conversions are rejected**, never rendered misleadingly (`HostCompatError` codes: `UNSUPPORTED_ARTIFACT`, `ARTIFACT_KIND_NOT_IN_PILOT`).

## 3. Determinism and safety evidence

| Check | Evidence |
|---|---|
| Determinism | Same input → identical bytes and SHA-256; renderer hash pinned from module source |
| Path safety | `safeFile` rejects absolute paths, `..`, backslash, protected paths, and symlinked segments (reused, not reimplemented) |
| Unsafe destination templates | Rejected by contract validation (`/etc/...`, missing `{slug}`, traversal) |
| Symlink destination | Rejected (`UNSAFE_DESTINATION`) |
| Source safety | Relative-only, realpath containment, no protected paths, byte cap (`SOURCE_TOO_LARGE`) |
| Collisions | Existing destination → `UPDATE` + diff; absent → `CREATE` |
| No-write | Directory snapshot unchanged before/after preview and detection; `source_written=false`, `state_written=false`, `apply_available=false` |

## 4. API (read-only GET)

- `GET /api/host-compat/tools` → contract summary (artifact kinds, tools, statuses, trust).
- `GET /api/host-compat/detect?project=…` → project-scoped markers only; never scans user folders; never claims availability/qualification.
- `GET /api/host-compat/preview?tool=…&artifactKind=…&project=…&source=sample` → in-memory render + destination + diff.

The existing write-block guard was **not** modified; no POST route was added.

## 5. Adoption UI

- Extends the existing Adoption screen; **no new navigation route, no new UI library**.
- Shows: tool, artifact kind, destination, install scope, trust, compatibility (`PARTIAL`/`UNSUPPORTED`), dropped fields, renderer, byte size, SHA, host spec version, and the diff.
- Persistent “Preview only — no files were written” and “Apply is not available in this pilot”.
- Detection shows `Detected`/`Not detected` with the evidence dir.

## 6. Visual verification

- `docs/evidence/ui-modernization/hostcompat/adoption-hostcompat-ar.png` (full page, Arabic RTL)
- `docs/evidence/ui-modernization/hostcompat/adoption-hostcompat-en.png` (full page, English LTR)
- `docs/evidence/ui-modernization/hostcompat/adoption-hostcompat-preview-ar.png` (preview element)
- `docs/evidence/ui-modernization/hostcompat/adoption-hostcompat-preview-en.png` (preview element)
- Console: 0 errors in both locales; rendered destination `.claude/agents/code-reviewer.md`, 399 bytes.

## 7. Tests

| Suite | Result |
|---|---|
| `tests/host_compat.test.mjs` | 13/13 |
| `tests/i18n.test.mjs` + `tests/ui_i18n_keys.test.mjs` | 5/5 |
| `npm run build` | success |
| Full `npm test` | ✅ **371/371 passing, 0 failures, exit 0** (~940s) |

## 8. Honest limitations

1. **Frontmatter parser is scalar-only** (no nested YAML/flow maps); sufficient for the pilot samples, documented as a follow-up if richer inputs are required.
2. **`spec.sha256` is `UNVERIFIED`** — host documentation hashes are not pinned yet; the version is recorded.
3. **No qualification claim**: `trust` stays `UNVERIFIED`; detection is evidence of a marker directory, not host availability.
4. **Preview only**: Staging/Apply integration is intentionally not wired.
5. **Cursor `.mdc` semantics** (`globs`, `alwaysApply`) are rendered deterministically but not executed or validated against a live Cursor host.

## 9. Deferred
Runbooks/rosters, extended catalogs, operational host integration, SgoStudio, Graph LOD, D-SLOW.

## 10. UX-DISABLED-ACTIONS-001 (completed)

The logged deferred item is now implemented: Intake (submit) and Evaluation (run/check) show a persistent inline note explaining that write actions are blocked by local governance boundaries (403) and require an authorized mutation controller. Server behaviour is unchanged; no privilege was expanded. Verified by `i18n` tests (5/5) and the production build after the change.
