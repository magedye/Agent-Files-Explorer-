# Host Artifact Compatibility & Governed Adoption — Limited Executable Design

**Status:** `READY_FOR_OWNER_DESIGN_DECISION`
**Scope:** design only — no code, no policy/permission changes, no host activation, no file installation, no commit/push/release.
**Basis:** reconciliation of `agency-agents/tools.json` against the verified capabilities of this repository.

---

## 1. Capability reconciliation (Fit-Gap, evidence-based)

| External concept | Verified current capability | Real gap | Decision |
|---|---|---|---|
| `tools.json` per-tool install contract | `server/adoption.js` emits a fixed `AGENTS.md` + `.governance/project.json`; `host` is a free string | No per-tool destination/format/scope/detection | **Extend** adoption with a small contract (reuse Staging) |
| `format` renderers | none for agent artifacts; `aghr/contract-reader.py` validates JSON schemas only | No deterministic renderer | **Develop** two pinned renderers |
| `installKind` (per-agent / roster / plugin) | `server/staging.js` applies a `plannedFiles` list; no kind model | No kind distinction | **Add field** to the contract (no behavior change) |
| `scope` (user / project) | Staging always targets a project directory | No user-home install path | **Project-only** in this design; user scope explicitly excluded |
| `detect` (dirs/files) | `adoption.js` detects `package.json`, `pyproject`, `SKILL.md`, `AGENTS.md`, `.git` | No host-tool detection | **Extend** `inspectCandidate` with `detect` |
| `dest` templates | `safeFile()` already rejects absolute/`..`/backslash/protected and checks symlinks segment-by-segment | No `{slug}` template model | **Add** template + validate every expansion via `safeFile` |
| host version binding | `skill_qualification_snapshot(host, host_version, scope, content_hash)`; native adapters pin binary/driver hashes | No host-version binding at adoption preview | **Reuse** the tuple; record `hostVersion` in the preview |
| trust boundaries | `native-adapters.mjs` accepts trusted startup config only; `stagingScope` + `consumeAuthorization` gate writes | No per-tool trust flag | **Add** `trust` field; stays `UNVERIFIED`, no activation |
| skill/agent validation | `aghr/contract-reader.py` + E2 `SchemaChecks`; `bounded-validator.js`; `draft-validator.js` | No agent-markdown frontmatter check | **Reuse** the schema validator; add a thin frontmatter wrapper only |

**Conclusion:** the write/safety/authorization layer already exists and is strong; the missing piece is a **read-only contract + deterministic preview** that feeds the existing Staging. No new engine, no new write path.

---

## 2. Artifact taxonomy & contracts

| Artifact | Canonical form | Owner / location | Validation (specialised) | Trust |
|---|---|---|---|---|
| **Agent Definition** | Markdown + YAML frontmatter (`name`, `description`, `color`, `emoji`), sections: Identity, Core Mission, Critical Rules | project or catalog `agents/<slug>.md` | frontmatter presence/type + section presence + fence integrity; **non-executable** | Content |
| **Agent Skill** | `SKILL.md` (+ optional entry under `scripts/`) with inputs/outputs/permissions | `skills/<id>/` | **existing** `SchemaChecks` + E4 qualification; host/version/scope/content-hash tuple | Highest (may execute) |
| **Project Instructions** | `AGENTS.md` (canonical) + rendered per-tool files | project root / per-tool dest | deterministic renderer + `safeFile` + diff precondition | Project-scoped |
| **Governance Policy** | AGHR rules / AAPES requirements / contracts | `governance_packages/` (read-only) | contract lock + schema + hash | Authoritative reference |

**Rule:** the four are never conflated. Tool compatibility applies **only** to Project Instructions and Agent Definitions; Agent Skills keep the existing qualification path; Governance Policy is never a render target.

---

## 3. Small tool-compatibility contract

Proposed file: `docs/contracts/host-compat/host_compat.contract.json` (schema `aghr.host-compat/1`).

```json
{
  "toolId": "claude-code",
  "label": "Claude Code",
  "format": "identity",
  "renderer": "identity@1",
  "installKind": "per-agent",
  "scope": ["project"],
  "detect": { "dirs": [".claude"], "files": [] },
  "dest": { "project": [".claude/agents/{slug}.md"] },
  "specSource": { "url": "https://…", "version": "…", "sha256": "…" },
  "hostVersionRange": ">=1.0.0 <2",
  "trust": "UNVERIFIED",
  "maxBytes": 262144
}
```

Rules:
- `renderer` is a **pinned, hash-registered** function (`renderers.json` → `identity@1`, `cursor-mdc@1`). Same input must produce byte-identical output (snapshot-tested).
- `dest` templates expand `{slug}` only; every expansion is validated by the existing `safeFile()` (relative, no `..`, no backslash, no absolute, not protected, no symlink segment).
- `scope` is **project-only** in this design; `user` is documented but disabled.
- `trust` remains `UNVERIFIED`; a tool is never "qualified" by this contract.
- `specSource` records the upstream document + hash that justifies the format (provenance).

---

## 4. Pilot: one or two tools, deterministic conversion + preview only

**Chosen:** `claude-code` (`identity` → `.claude/agents/<slug>.md`) and `cursor` (`cursor-mdc` → `.cursor/rules/<slug>.mdc`).
Rationale: one identity renderer + one real format conversion, both project-scoped, no user-home writes, small deterministic outputs.

Flow (read-only):
1. `inspect` target project → detect candidate tools from `detect`.
2. Select a tool → render **in memory** → validate destination via `safeFile` → compute diff against the current file (if any).
3. Return `{ tool, dest, scope, trust, format, specSource, diff, bytes, sha256 }`.
4. **No write**: `source_written=false`, `state_written=false`; no target file, no staging directory.
5. The existing Staging/Apply remains the only write path, and only in a later authorized phase.

Safety invariants:
- No path outside the adopted project root; governance root rejected.
- Symlink/reparse point on any segment → reject.
- Byte cap per artifact (`maxBytes`); markdown-only output (no shebang/executable).
- Renderer pinned by hash; drift → `RENDERER_DRIFT` fail-closed.
- Optional: this preview never blocks the existing adoption flow (not a mandatory gate).

---

## 5. Adoption UX (Linear-inspired, no new nav)

Extend the existing **Adoption** screen (`AdoptionView.jsx`); no new main navigation section.

```
┌ Target ────────────────────────┐  ┌ Preview ───────────────────────────────┐
│ Project: acme-app    [detected]│  │ (Claude Code) (Cursor)   [Preview only] │
│ Tools: ● Claude Code ● Cursor  │  │ Format: identity@1 · Scope: project    │
│        ○ Codex (not detected)  │  │ Trust: UNVERIFIED · Spec: vX (sha…)    │
│                                │  │ ─ .claude/agents/reviewer.md  [+ new]  │
│ [Prepare plan]                 │  │ ─ .cursor/rules/reviewer.mdc  [~ diff] │
└────────────────────────────────┘  └────────────────────────────────────────┘
```

- Steps: **1) Project → 2) Tool(s) → 3) Destinations & diffs → 4) Stage (existing) → 5) Apply (owner-authorized, existing)**.
- States: empty (no project), detecting, tool-unavailable (disabled + reason), preview-ready, error.
- Badges: `format`, `scope`, `trust`, `specSource/version`; a persistent **“Preview only — no files written”** note.
- Reuse: design-system cards/tabs/badges/diff view; existing Adoption grid; no new component family.

---

## 6. Effort, risk, tests, acceptance

| Work item | Reuse / Develop | Effort | Risk |
|---|---|---|---|
| Contract + schema + registry | Develop (new, small) | 0.5–1 d | Low |
| `identity@1` + `cursor-mdc@1` renderers | Develop | 1–2 d | Low–Med (format drift) |
| Tool detection in `inspectCandidate` | Extend | 0.5 d | Low |
| Read-only preview API | Extend (reuse `safeFile`, `stagingScope`) | 1 d | Low |
| Frontmatter validator wrapper | Reuse `SchemaChecks` | 0.5 d | Low |
| Adoption preview UI | Extend `AdoptionView` | 1–2 d | Low |
| **Total pilot** | | **~5–7 dev-days** | **Low** |

Tests:
- Renderer determinism: same input → identical bytes (snapshot).
- Destination negatives: `..`, absolute, backslash, protected, symlink segment, outside root → rejected.
- No-write assertions: preview creates no target/staging files.
- Byte-cap and executable-scan rejections.
- UI states + keyboard/focus + RTL/LTR.
- Existing suite must stay green; no change to Staging/Apply behavior.

Acceptance criteria:
1. Contract validates against `aghr.host-compat/1`; renderer hash pinned; drift fails closed.
2. Two tools render deterministically and preview shows dest/scope/diff without writing.
3. All traversal/symlink/protected negatives rejected by the existing `safeFile`.
4. Adoption UI shows tool/destination/scope/proposed changes with clear states; no new nav section.
5. Existing tests pass; no policy/permission/activation change.
6. The compatibility layer is **optional**, never a mandatory gate.

---

## 7. Reuse vs. develop (summary)

- **Reuse:** `safeFile()`, `stagingScope()`, `consumeAuthorization()`, `skill_qualification_snapshot` tuple, `aghr/contract-reader.py` + `SchemaChecks`, `adoption.js` inspection, `tools/check_studio_contracts.mjs` patterns, design system, Adoption/Staging UI.
- **Develop:** contract schema + renderer registry, 2 renderers, tool detection, read-only preview endpoint, frontmatter wrapper, preview panel.

## 8. Deferred (not in this design)
Runbooks/rosters, extended catalogs, operational host integration, SgoStudio, Graph LOD, D-SLOW.

## 9. Governance boundaries
No code, no install, no user-home writes, no host activation, no policy/permission change, no mandatory gate, no `commit/push/merge/release`.
