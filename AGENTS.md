# AGHR Governance Studio — Operational Agent Router

> **Layer 1: Agent Instructions (< 1,000 Tokens)**  
> **Authority**: Operational directives for AI coding agents (Antigravity, Codex, Gemini, Claude).  
> **Progressive Disclosure Policy**: Strictly enforced.

---

## 1. Prime Directives for AI Agents

1. **Never Load the Repository or Governance Packages Entirely**:
   - `governance_packages/` contains extensive historical records (> 600k tokens).
   - **DO NOT** perform broad searches or directory-wide reads across `governance_packages/`.
   - Access specific rules or schemas **on-demand only** by direct path.

2. **Session Resumption & State Recovery**:
   - At the beginning of ANY session, read [docs/status/CURRENT.md](docs/status/CURRENT.md) as a derived point-in-time snapshot to understand:
     - The active objective and current task.
     - Known invariants, completed modules, and blockages.
     - The exact next step.
   - Ground truth is determined by actual Git HEAD, working tree, and passing test verification, not prose alone.

3. **Deterministic Local Verification**:
   - Run `npm test` to verify changes against the current local test suite; report the runner's actual count.
   - Run `node tools/check_context_health.mjs` to ensure context budgets are preserved.
   - Never weaken or bypass tests to manufacture passing statuses.
   - Portable Path Normalization: Use POSIX normalization (`as_posix()`) specifically for portable relative paths, manifest dictionary keys, and archive member comparisons. Native OS file operations should retain standard Path objects.
   - Package Text Encoding: Enforce explicit UTF-8 encoding for package-owned text records and documentation, with resilient decoding (`errors='replace'` / standard binary streams) for arbitrary foreign project inputs.

4. **Preservation & Non-Destructive Operation**:
   - Preserve existing working code, tests, and configurations without unsolicited refactorings.
   - Do not modify files in `governance_packages/` unless explicitly instructed to update the governance baseline.

---

## 2. Navigational Directory (Progressive Disclosure)

When a task requires deeper context, navigate directly to the relevant document:

| Need | Primary Source | Context Budget |
| :--- | :--- | :--- |
| **Current Project State** | [docs/status/CURRENT.md](docs/status/CURRENT.md) | ~1,200 tokens |
| **Session Handoff & Transfer** | [docs/status/HANDOFF.md](docs/status/HANDOFF.md) | ~800 tokens |
| **Full Documentation Index** | [docs/INDEX.md](docs/INDEX.md) | ~1,000 tokens |
| **Project Architecture Map** | [PROJECT_MAP.md](PROJECT_MAP.md) | ~2,500 tokens |
| **Specific Governance Rules** | [AGHR 1.2.0 RULES.json](governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/registry/RULES.json) | On-demand query; consumer adoption remains scoped |
| **Learning & Classified Instructions** | [Governed learning](governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/procedures/GOVERNED_LEARNING.md) | Relevant evidence and owner references only |
| **Package Layout & INBOX** | [governance_packages/README.md](governance_packages/README.md) | Directory roles and incoming-document boundary |
| **Server Security & Roots** | [server/security.js](server/security.js) | Component level |

---

## 3. Strict Prohibitions (No-Crawl Zones)
- **NEVER crawl or ingest**:
  - `governance_packages/**/compatibility/` (Contains legacy mappings, ~355k tokens).
  - `governance_packages/**/verification/` (Historical evaluation logs).
  - `.governance/backups/` and `.governance/staging/` (Transient runtime state).
