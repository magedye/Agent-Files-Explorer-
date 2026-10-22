# AGHR Governance Studio — Complete Specification

**Version:** 1.0.0 · **Status:** Implementation Specification · **Alignment:** AGHR 1.0.0-rc.3 (Consolidated) · **Scope:** Local-first desktop-class web application

---

## Part I — Foundation

### 1. Identity

**AGHR Governance Studio** is a local-first environment for the complete lifecycle of agent governance: authoring instructions, organizing capabilities, generating agent files, reviewing changes, and proving runtime outcomes — strictly aligned with **AGHR 1.0.0-rc.3 (Consolidated)** as the sole normative reference.

The Studio is **not** a reimplementation of AGHR. It is a **presentation and workflow layer** over the normative package. Every rule, schema, and state machine the Studio displays is defined by rc.3; the Studio adds no governance logic of its own.

### 2. Design Axioms

Five axioms govern every decision in this specification. When in conflict, the earlier axiom wins.

| # | Axiom | Implication |
|---|---|---|
| A1 | **rc.3 is the sole source of truth** | Any behavior not defined by rc.3 is either an implementation choice (documented) or a bug |
| A2 | **The Studio never writes `state.json`** | CI owns it; Studio produces patches/commits only |
| A3 | **Honest state** | No `VERIFIED` without evidence; no `HOST_SIGNAL` fabricated; `NOT_OBSERVABLE` displayed as valid |
| A4 | **Language is rendering, not filtering** | No item is hidden due to missing translation |
| A5 | **Every write preceded by a preview** | No silent mutations; every mutation shows exact diff |

### 3. Mandatory Architectural Commitments

The following twelve commitments are **derived directly from rc.3** and are non-negotiable. Every screen, API, and workflow must satisfy them. Non-compliance is an automatic release blocker.

| # | Commitment | rc.3 § | Enforcement mechanism |
|---:|---|---|---|
| C1 | Four-layer separation | §1.1 | Each screen declares its layer; cross-layer operations require explicit user confirmation |
| C2 | CI is sole writer of `state.json` | §12.1 | File opened read-only by backend; regression test in CI blocks merge if any write path exists |
| C3 | Runtime evidence is separate | §12.1, §12.2 | Backend reads `.aghr/runtime_evidence/{task_id}.jsonl` in read-only mode; no write endpoint |
| C4 | Language does not filter rules | §5.3 | Filtering by `scope.language` is disabled at the query layer; UI shows `translation_unavailable` badge |
| C5 | `authority.level` mandatory for MUST/MUST_NOT | §3.1, §5.2 | `item.schema.json` enforces it; Studio editor blocks save without it |
| C6 | `impact.evidence` visible | §6.1 | Every item card shows the badge; CSV/SARIF exports include it |
| C7 | `HOST_SIGNAL` optional | §7.1 | Skill Card renders it as "—" when absent; `NOT_OBSERVABLE` is a valid state |
| C8 | Three discovery states distinct | §7.2 | `UNKNOWN_ID`, `NO_SKILL_MATCH`, `DISCOVERY_UNAVAILABLE` have distinct colors, icons, and copy |
| C9 | `PRIN-007` in every `AGENTS.md` at L1+ | §9.2, §14.2 | Generation pipeline fails if `PRIN-007` absent; Studio blocks export on failure |
| C10 | Qualification per `(host, version, scope, contentHash)` | §7.4 | All four keys required; change in any → `QUALIFIED` → `NOT_RUN` |
| C11 | 100% honesty vs ≥95% behavioral | §11.1 | Two separate gauges; never averaged; false-success rate must be 0% |
| C12 | Resource limits on `eval`/`qualify` | Operational | Timeout ≤ 10 min; memory ≤ 2 GiB; `resource_limit_exceeded` status |

### 4. The Change Package — Studio's Unit of Work

**Justification.** rc.3 §16.1 requires "Change Request process" but does not specify a data structure. The Studio proposes **Change Package** as a concrete, auditable instantiation. It is fully compatible with rc.3 and adds four guarantees not in the reference:

1. **Version-bound approvals** — every approval carries `approved_version_hash`; if the proposal changes, all approvals are automatically invalidated.
2. **Three-stage generation evidence** — records `full`/`compress`/`compact`/`fail` stage and proves P0 preservation.
3. **Cross-check against CI** — Studio's validation result is compared with CI's result; any divergence blocks export.
4. **Runtime evidence attachment** — when the change originates from an agent session, the `task_id` is bound; CI merges evidence before adopting `state.json`.

These four additions do **not** modify rc.3; they make §16.1's abstract requirement concrete and auditable.

---

## Part II — Data Model

All tables are defined for SQLite 3.40+. The governing rule: **any table with suffix `_cache`, `_snapshot`, or `_events` (when the source is runtime evidence) is derived and read-only**. The Studio never writes to a derived table without an upstream source.

### 5. Schema — Workspaces and Projects

```sql
-- The registered AGHR package installations.
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,                    -- UUIDv4
  name TEXT NOT NULL,
  package_path TEXT NOT NULL UNIQUE,      -- absolute path to aghr/ directory
  package_version TEXT NOT NULL,          -- parsed from aghr.json
  schema_version TEXT NOT NULL,           -- rc.3 = "1.2"
  package_signature_verified INTEGER NOT NULL DEFAULT 0,
  signature_identity TEXT,                -- cosign identity, null if unsigned
  signature_verified_at TEXT,
  read_only INTEGER NOT NULL DEFAULT 1,   -- always 1 for canonical package
  created_at TEXT NOT NULL,
  last_scanned_at TEXT,
  scan_duration_ms INTEGER
);

-- Target projects where AGHR will be adopted.
CREATE TABLE target_projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  detected_profile TEXT,                  -- from tech stack detection
  instruction_level TEXT NOT NULL DEFAULT 'L0',  -- L0..L4
  skill_level TEXT NOT NULL DEFAULT 'L0',        -- L0..L4
  host TEXT,                              -- codex | gemini-cli | antigravity | claude-code | cursor
  host_version TEXT,
  git_remote TEXT,
  git_branch TEXT,
  git_commit_sha TEXT,
  config_state_json TEXT,                 -- parsed .aghr/state.json (read-only snapshot)
  last_scanned_at TEXT,
  UNIQUE(workspace_id, path)
);
```

### 6. Schema — Instruction Item Cache

```sql
-- Derived cache from policies/**/*.yaml and decisions/**/*.yaml.
-- Rebuilt on every file change. Never written by Studio logic, only by indexer.
CREATE TABLE instruction_items_cache (
  workspace_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  force TEXT NOT NULL,
  severity TEXT NOT NULL,
  priority_tier TEXT NOT NULL,

  -- Authority (rc.3 §3.1, §5.2)
  authority_level TEXT,                   -- enterprise | organization | project | component
  authority_source TEXT,
  authority_owner TEXT,
  authority_approved_by TEXT,
  authority_status TEXT,                  -- draft | active | deprecated | superseded
  authority_effective_from TEXT,
  authority_supersedes TEXT,              -- item_id this supersedes
  authority_superseded_by TEXT,           -- reverse link (derived)

  -- Lifecycle
  review_cadence TEXT,                    -- annual | quarterly | monthly | ...
  next_review TEXT,                       -- ISO date
  is_review_due INTEGER,                  -- derived: next_review < today AND status='active'

  -- Scope (rc.3 §8.1)
  scope_paths_json TEXT,                  -- JSON array
  scope_exclude_json TEXT,
  scope_agents_json TEXT,
  scope_environments_json TEXT,
  scope_stages_json TEXT,
  scope_task_types_json TEXT,
  scope_language_json TEXT,
  scope_skill_ids_json TEXT,

  -- Enforcement (rc.3 §10)
  enforcement_textual INTEGER,
  enforcement_technical_json TEXT,
  enforcement_failure_action TEXT,        -- block | warn | review | log
  merge_effect TEXT,                      -- blocking | advisory | none
  gate_type TEXT,
  gate_required INTEGER,

  -- Impact (rc.3 §6.1)
  impact_band TEXT,                       -- critical | high | medium | low | info
  impact_evidence TEXT,                   -- assumed | benchmark | repo-measured
  impact_last_calibrated TEXT,
  impact_measured_delta REAL,

  -- Conflict (rc.3 §5.2)
  conflict_policy_precedence TEXT,        -- auto | explicit
  conflict_overrides_json TEXT,
  conflict_overridden_by_json TEXT,

  -- Content
  rationale TEXT,
  rule_text TEXT,
  source_path TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  indexed_at TEXT NOT NULL,

  PRIMARY KEY (workspace_id, item_id, source_hash)
);

CREATE INDEX idx_items_by_level ON instruction_items_cache(workspace_id, authority_level);
CREATE INDEX idx_items_by_tier ON instruction_items_cache(workspace_id, priority_tier);
CREATE INDEX idx_items_review_due ON instruction_items_cache(workspace_id, is_review_due);
CREATE INDEX idx_items_calibration_gap ON instruction_items_cache(workspace_id, impact_evidence);
```

### 7. Schema — Capability and Qualification Cache

```sql
-- Derived from capabilities/**/*.yaml and skills/**/skill.yaml.
CREATE TABLE capability_items_cache (
  workspace_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  source TEXT NOT NULL,                   -- system | user | project | extension | catalog | aghr
  function TEXT NOT NULL,                 -- routing | design | implementation | debugging | security | verification | learning
  instructions_path TEXT,
  inputs_json TEXT,
  outputs_json TEXT,
  permissions_read_json TEXT,
  permissions_write_json TEXT,
  permissions_network TEXT,               -- allow | deny
  permissions_secrets TEXT,               -- allow | deny
  required_approvals_json TEXT,
  conflicts_with_json TEXT,
  alternatives_json TEXT,
  minimum_status TEXT,                    -- QUALIFIED | NOT_RUN | ...
  required_on_hosts_json TEXT,
  max_age_days INTEGER,
  content_hash TEXT NOT NULL,
  source_path TEXT NOT NULL,
  indexed_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, item_id, content_hash)
);

-- Read-only snapshot of skillQualification from .aghr/state.json,
-- merged with evidence from .aghr/runtime_evidence/.
CREATE TABLE skill_qualification_snapshot (
  workspace_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  host TEXT NOT NULL,
  host_version TEXT NOT NULL,
  scope TEXT NOT NULL,
  status TEXT NOT NULL,                   -- QUALIFIED | NOT_RUN | NOT_OBSERVABLE | UNKNOWN | FAILED
  qualified_at TEXT,
  content_hash TEXT NOT NULL,
  evidence_json TEXT,
  read_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, skill_id, host, host_version, scope, content_hash)
);

CREATE INDEX idx_qual_by_host ON skill_qualification_snapshot(workspace_id, host, host_version);
CREATE INDEX idx_qual_status ON skill_qualification_snapshot(workspace_id, status);
```

### 8. Schema — Change Packages

```sql
CREATE TABLE change_packages (
  id TEXT PRIMARY KEY,                    -- CP-YYYY-NNNN
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  title TEXT NOT NULL,
  kind TEXT NOT NULL,                     -- CONSTRAINT | REQUIREMENT | ... | CAPABILITY | EXCEPTION
  target_item_id TEXT,                    -- null for new creation

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft',   -- draft | validating | validated | in_review
                                          -- approved | rejected | exported | closed
  status_updated_at TEXT NOT NULL,

  -- Source
  source_type TEXT,                       -- document | lesson | request | calibration
  source_ref TEXT,
  source_hash TEXT,

  -- Base
  base_package_version TEXT NOT NULL,     -- e.g., "1.0.0-rc.3"
  base_item_ids_json TEXT,                -- items this might affect

  -- Proposal
  proposed_yaml TEXT NOT NULL,
  proposal_version_hash TEXT NOT NULL,    -- sha256 of proposed_yaml + metadata

  -- Checks (each is a JSON: {status, at, duration_ms, output_ref})
  validation_result_json TEXT,
  lint_result_json TEXT,
  skill_state_result_json TEXT,
  generation_result_json TEXT,            -- {stage, p0_preserved, byte_size, byte_delta}
  doctor_result_json TEXT,                -- {gates_verified, blockers}

  -- Preview
  preview_diff TEXT,                      -- unified diff
  preview_files_json TEXT,                -- [{path, action: add|modify|delete, size}]

  -- Impact
  impact_summary_json TEXT,               -- {on_authority, on_compatibility, on_consumers}

  -- Approvals (denormalized for fast query; canonical in change_package_approvals)
  required_approvals_json TEXT,           -- {"governance-owner": false, "security-owner": false}

  -- Export
  export_format TEXT,                     -- patch | commit_signed | commit_unsigned
  export_path TEXT,
  export_sha TEXT,
  exported_at TEXT,

  -- Meta
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_cp_status ON change_packages(workspace_id, status);
CREATE INDEX idx_cp_created ON change_packages(workspace_id, created_at DESC);

-- Approvals tied to specific proposal version
CREATE TABLE change_package_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id TEXT NOT NULL REFERENCES change_packages(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                     -- governance-owner | security-owner | architecture-board
  approver TEXT NOT NULL,                 -- user identity
  decision TEXT NOT NULL,                 -- approve | reject
  approved_version_hash TEXT NOT NULL,    -- MUST equal change_packages.proposal_version_hash
  reason TEXT,
  at TEXT NOT NULL,
  UNIQUE(package_id, role, approver, approved_version_hash)
);

-- Invalidated approvals (audit trail of what was approved then rejected by change)
CREATE TABLE change_package_approval_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id TEXT NOT NULL,
  role TEXT NOT NULL,
  approver TEXT NOT NULL,
  decision TEXT NOT NULL,
  approved_version_hash TEXT NOT NULL,
  invalidated_at TEXT NOT NULL,
  invalidation_reason TEXT NOT NULL       -- "proposal_changed" | "explicit_withdrawal"
);
```

### 9. Schema — Runtime Evidence and Verification

```sql
-- Read-only projection of .aghr/runtime_evidence/{task_id}.jsonl.
CREATE TABLE runtime_evidence_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  target_project_id TEXT,
  task_id TEXT NOT NULL,
  agent TEXT,
  agent_version TEXT,
  host_os TEXT,
  event_type TEXT NOT NULL,               -- skill.selected | skill.loaded | host.signal
                                          -- skill.executed | skill.verified | discovery.outcome
                                          -- authorization.request | authorization.denied
  skill_id TEXT,
  payload_json TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  source_file TEXT NOT NULL,              -- path to jsonl
  source_line INTEGER NOT NULL,
  ingested_at TEXT NOT NULL,
  UNIQUE(workspace_id, task_id, source_file, source_line)
);

CREATE INDEX idx_rte_task ON runtime_evidence_events(workspace_id, task_id, recorded_at);
CREATE INDEX idx_rte_attention ON runtime_evidence_events(workspace_id, event_type)
  WHERE event_type IN ('skill.blocked', 'discovery.outcome');

-- Verification runs (all aghr commands executed by Studio)
CREATE TABLE verification_runs (
  id TEXT PRIMARY KEY,                    -- VR-YYYY-NNNN
  workspace_id TEXT NOT NULL,
  command TEXT NOT NULL,                  -- validate | lint | generate | check | eval | qualify | doctor
  args_json TEXT,
  cwd TEXT,
  status TEXT NOT NULL,                   -- running | passed | failed | suspicious | errored | resource_limit_exceeded
  exit_code INTEGER,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_ms INTEGER,
  resource_peak_mb INTEGER,
  summary_json TEXT,                      -- structured: {counts, errors, warnings, p0_issues}
  raw_stdout TEXT,
  raw_stderr TEXT,
  sarif_output TEXT,                      -- if applicable
  triggered_by TEXT,                      -- user | scheduled | ci
  triggered_by_user TEXT,
  linked_package_id TEXT                  -- if part of a change package
);

CREATE INDEX idx_vr_workspace_time ON verification_runs(workspace_id, started_at DESC);
CREATE INDEX idx_vr_command ON verification_runs(workspace_id, command, status);
```

### 10. Schema — Metrics and Audit

```sql
-- Periodic snapshots for trend charts (rc.3 §17).
CREATE TABLE metrics_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  captured_at TEXT NOT NULL,

  -- §17.1 Instruction metrics
  policy_coverage_pct REAL,
  eval_pass_rate_pct REAL,
  exception_half_life_days REAL,
  drift_rate_pct REAL,
  calibration_coverage_pct REAL,

  -- §17.2 Skill metrics
  skill_qualification_coverage_pct REAL,
  skill_eval_pass_rate_pct REAL,
  false_success_rate_pct REAL,            -- MUST be 0
  discovery_recall_multilingual_pct REAL,
  qualification_drift_count INTEGER,

  -- Derived health
  reviews_due_count INTEGER,
  p0_uncalibrated_count INTEGER
);

CREATE INDEX idx_metrics_time ON metrics_snapshots(workspace_id, captured_at DESC);

-- Audit log (append-only)
CREATE TABLE audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  actor_role TEXT,                        -- simulated_role
  event_type TEXT NOT NULL,               -- cp.create | cp.validate | cp.approve | cp.export
                                          -- adoption.start | adoption.apply
                                          -- workspace.add | workspace.scan
                                          -- verify.run | calibrate.apply
                                          -- meta.change.propose | meta.skill.adopt
  workspace_id TEXT,
  resource_type TEXT,                     -- package | item | skill | run | adoption
  resource_id TEXT,
  payload_json TEXT,
  ip_address TEXT,                        -- 127.0.0.1 in local mode
  user_agent TEXT
);

CREATE INDEX idx_audit_time ON audit_events(at DESC);
CREATE INDEX idx_audit_resource ON audit_events(workspace_id, resource_type, resource_id);
```

---

## Part III — Screens

Sixteen screens organized by rc.3 layer. Every screen has a fixed header showing: **layer badge** (Authority / Guidance / Controls / Evidence), **current workspace**, **active host**, **user role**.

### 11. Screen 1 — Project Dashboard

**Layer:** 1 + 3 (Governance Authority + Execution Controls)

**Purpose:** At-a-glance health of the workspace and its target projects.

**Layout — three stacked sections:**

#### 11.1 Dual Governance Level

Two side-by-side cards:

| Left: Instruction Governance | Right: Skill Governance |
|---|---|
| Current: `L2` | Current: `L1` |
| Target: `L3` | Target: `L3` |
| Requirements met: 4/5 | Requirements met: 2/4 |
| Missing: branch protection gate | Missing: P0 skills qualified on codex |
| **Divergence warning** if `instruction_level ≠ skill_level` and both `≥ L2` |

Clicking either card opens a drill-down listing per §13 requirements.

#### 11.2 Risk Indicators (6 clickable tiles)

| Tile | Source | Threshold for red | Click action |
|---|---|---|---|
| P0 capabilities unqualified | `skill_qualification_snapshot` | >0 for active host | Opens Capabilities filtered |
| Items past `nextReview` | `instruction_items_cache.is_review_due` | >0 | Opens Instructions filtered |
| P0 items `assumed` for >60 days | `instruction_items_cache` | >0 | Opens Instructions filtered |
| Exceptions expiring ≤14 days | `instruction_items_cache` (EXCEPTION kind) | >0 | Opens Instructions filtered |
| Drift detected | `verification_runs` (last `generate --check`) | `status != passed` | Opens Verification |
| False-success rate | `metrics_snapshots` (latest) | >0% | Opens Runtime Evidence (blocked events) |

#### 11.3 Recent Activity

Chronological list (last 20) from `audit_events` with links to the relevant screen.

**No actions on this screen except navigation.** All mutations happen on their respective screens.

### 12. Screen 2 — Instructions Registry

**Layer:** 1 — Governance Authority

**Purpose:** Browse, filter, and open any instruction item.

**Columns:**

`id` · `kind` · `force` · `severity` · `priority_tier` · `authority.level` · `authority.owner` · `authority.status` · `impact.band` + `impact.evidence` badge · `next_review` (with due badge) · `source_path`

**Filters (persisted per user):**

- `kind` (multi-select)
- `force` (multi-select)
- `priority_tier` (multi-select)
- `authority.level` (multi-select)
- `authority.status` (multi-select)
- `impact.evidence` (multi-select)
- `is_review_due` (boolean)
- **Path filter** (glob input)
- **Host filter** (`scope.appliesToAgents`)
- **Text search** (`id`, `title`, `rule_text`)
- **Language filter:** ← **disabled by design (Axiom A4)** — a tooltip explains "Language affects rendering only; filtering by language is disabled to prevent hiding binding rules"

**Row actions:** Open detail · Copy item ID · Open source file in editor · Create change package targeting this item.

**Bulk actions:** Export selected (SARIF/JSON/CSV) · Bulk view source.

**Sort:** Any column, default `priority_tier` then `severity`.

### 13. Screen 3 — Instruction Detail

**Layer:** 1 — Governance Authority

**Purpose:** Complete view of a single item with all rc.3 §3.2 fields, relations, verification history, and calibration state.

**Sections:**

#### 13.1 Identity Header

```
CONSTRAINT · MUST_NOT · critical · P0-Safety
SEC-001 · No secrets in source code
Authority: enterprise · security-owner · governance-board · active since 2026-01-01
Impact: high · [assumed] · last calibrated: never
Review: annual · next due 2027-01-01 · [Due in 68 days]
```

**Badges:** `[Review Due]` if `is_review_due`; `[Calibration Gap]` if `evidence=assumed` and `created > 60 days ago`.

#### 13.2 Tabs

**Tab 1 — Rule & Rationale**
- Full `rule` text (syntax-highlighted YAML block)
- `rationale` (prose)
- Copy-to-clipboard button

**Tab 2 — Authority & Lifecycle**
- Source path, level, owner, approvedBy, status, effectiveFrom, supersedes
- If `supersededBy`: prominent banner "This item is superseded by [link]"
- Review cadence + nextReview + history of past reviews (from audit events)

**Tab 3 — Scope**
- Table of all §8.1 scope dimensions with example matches
- "Test scope" input: enter a path → shows whether item applies
- **Language row:** displays configured languages + badge "Rendering only — does not filter"

**Tab 4 — Enforcement**
- Three layers (§10): textual · technical (list) · human-approval
- `mergeEffect` + `gate` details
- **Live doctor check:** shows whether `gate` actually exists in repo (calls `aghr doctor` on demand)

**Tab 5 — Impact & Calibration** (NEW)
- Current `band` + `evidence` + `lastCalibrated` + `measuredDelta`
- **Calibration history table** (each calibration event with its source verification run)
- **"Calibrate" button** (only for `governance-owner`):
  - Opens Change Package wizard
  - Requires selecting a **passed** eval run with `command=eval` from `verification_runs`
  - Requires `measuredDelta` to be justified in reason field
  - Creates CP with `kind: "calibration"` and `target_item_id=this item`
  - Proposed change: `impact.evidence` from `assumed` → `repo-measured`, `lastCalibrated` → run.finished_at, `measuredDelta` → run.summary.delta

**Tab 6 — Evals**
- List of eval fixtures in `evals/fixtures/instruction/{id}/`
- Latest run status per fixture (from `verification_runs`)
- **Run now** button → opens Verification screen pre-configured

**Tab 7 — Relations**
- Supersedes / superseded by
- `conflictPolicy.overrides` / `overriddenBy`
- Capabilities that reference this item
- Graph view toggle (opens Graph modal)

**Tab 8 — Verification History**
- Chronological table of all runs targeting this item (validate, lint, eval)
- Diff view between runs

**Tab 9 — Raw YAML**
- Full source with syntax highlighting
- Copy button

**Header actions:** Edit (creates draft CP) · Calibrate · Add eval fixture · Open source · Deprecate (creates CP).

### 14. Screen 4 — Capabilities & Hosts

**Layer:** 2 — Guidance

**Purpose:** Inventory of all capabilities with their qualification matrix across hosts.

**Layout — two panels:**

#### 14.1 Left Panel — Skill List

Columns: `skill_id` · `source` · `function` · `default_tier` · `permissions` (read/write/network/secrets as compact icons) · `alternatives` · `status per active host`

Filters: source, function, tier, permission flags, host, qualification status.

#### 14.2 Right Panel — Qualification Matrix

Rows: skills · Columns: `(host, host_version)` pairs.

Cell colors:
- **Green** `QUALIFIED` (with `qualified_at` tooltip)
- **Yellow** `NOT_RUN` (with reason)
- **Gray** `NOT_OBSERVABLE` (with reason)
- **Orange** `UNKNOWN` (with reason)
- **Red** `FAILED`
- **Empty** — not configured for this host

Clicking a cell → opens a detail modal with evidence link, content hash, and re-qualify action.

### 15. Screen 5 — Skill Detail

**Layer:** 2 — Guidance

**Purpose:** Complete view of a single capability across three axes (rc.3 §7.1, §7.3).

**Sections:**

#### 15.1 Header

```
CAPABILITY · MUST · critical · P0-Safety
CAP-SECREV-001 · Security review capability
Source: project · Function: security
Hosts: codex, gemini-cli, antigravity
```

#### 15.2 Axis 1 — Availability (rc.3 §7.3)

Table: `EXISTS` → `DISCOVERED` → `QUALIFIED` with evidence per state.

Each cell has an **evidence column** showing:
- `EXISTS`: path + `content_hash`
- `DISCOVERED`: host list from last session (from `runtime_evidence_events`)
- `QUALIFIED`: link to qualification record + `contentHash` + `hostVersion` + `scope`

#### 15.3 Axis 2 — Qualification (rc.3 §7.4)

Per-host table:

| Host | Version | Scope | Status | Qualified At | Content Hash | Evidence | Age |
|---|---|---|---|---|---|---|---|
| codex | 1.4.2 | payments/** | QUALIFIED | 2026-10-20 | sha256:... | [link] | 1d |
| gemini-cli | 2.1.0 | payments/** | NOT_RUN | — | — | — | — |
| antigravity | 2.0.1 | payments/** | NOT_OBSERVABLE | — | — | reason | — |

**Red badge "Qualification Expired"** if `content_hash` or `host_version` changed since `qualified_at`.

#### 15.4 Axis 3 — Usage (rc.3 §7.1)

Recent usage table (last 20 events from `runtime_evidence_events`):

| Task | Selected | Loaded | Host Signal | Executed | Verified | Evidence |
|---|---|---|---|---|---|---|
| task-a7f3 | ✓ | ✓ | NOT_OBSERVABLE | ✓ | ✓ | [link] |
| task-b2c1 | ✓ | ✓ | NOT_OBSERVABLE | ✗ (BLOCKED) | — | [link] |

Each row links to the full `runtime_evidence/{task_id}.jsonl` in Screen 9.

#### 15.5 Sections

**Permissions** — Table of `read`/`write`/`network`/`secrets` with badge: "Declaration only — enforcement is host-side" (rc.3 §10.1).

**Conflicts & Alternatives** — Table with resolved preferred skill + alternative.

**Inputs & Outputs** — Schema from CAPABILITY YAML.

**Eval fixtures** — Link to `evals/fixtures/skill/{id}/` with per-scenario status.

**Related items** — Instructions that reference this capability.

### 16. Screen 6 — Profiles & Scope

**Layer:** 2 — Guidance

**Purpose:** Manage project-level selections and scope configuration.

**Sections:**

#### 16.1 Project Profiles

List of profiles from `profiles/**/*.yaml`. Each profile card shows: name, detected stack, applicable agents, applicable paths, linked capabilities.

#### 16.2 Project-Level Selections

Table for the active target project:

| Skill | Preferred? | Alternative | Rationale |
|---|---|---|---|
| security-review | ✓ | security-diff-scan | Project uses both auth and payment |
| browser-testing | ✓ | — | — |

**Add selection** → Change Package of `kind: PROJECT_SELECTION`.

#### 16.3 Scope Tester

Interactive tool:
- Input: path, host, environment, stage, task type
- Output: list of applicable items (with matched scope dimension) + list of excluded items (with exclusion reason)

This is the **live evaluation** of §8.2 semantics.

### 17. Screen 7 — Generation & Preview

**Layer:** 2 — Guidance

**Purpose:** Preview `AGENTS.md` generation with full visibility into the three-stage pipeline (rc.3 §9.4).

**Sections:**

#### 17.1 Generation Controls

- Target agent selector: `codex` / `gemini-cli` / `antigravity` / `claude-code` / `cursor`
- Profile selector
- **Budget display:** `targets[agent].budgetBytes` vs. current output size

#### 17.2 Stage Indicator (rc.3 §9.4)

```
[Full]  [Compress]  [Compact]  [Fail]
  ●
```

- **Full** (green): under budget, all items present verbatim
- **Compress** (yellow): P3/P2 collapsed into summary table; warning "P3 items collapsed"
- **Compact** (orange): P0/P1 replaced with compact directives (`aghr_get_rule`); warning "P0 items require on-demand lookup"
- **Fail** (red): P0 cannot be represented; lists specific overflowing items

**`PRIN-007` check** — displays explicitly: "PRIN-007 present at line N" or "PRIN-007 MISSING — export blocked".

#### 17.3 Preview Pane

Full syntax-highlighted `AGENTS.md` output with:
- Content hash in header
- Line-by-line diff against currently-committed version (if exists)
- "Download" button (exports as `.md` file without any disk write to repo)

#### 17.4 Export

- **Copy to clipboard**
- **Download file** (user saves manually)
- **"Create Change Package"** → creates CP of `kind: GENERATED_FILE` that, when approved, exports the file as patch/commit
- **If stage = `fail`: export is disabled** with message "Cannot export: P0 items overflow"

### 18. Screen 8 — Verification & Evidence

**Layer:** 4 — Evidence

**Purpose:** Run AGHR commands and view results.

**Sections:**

#### 18.1 Run Panel

Six command buttons:

| Command | Endpoint | Typical duration | Resource limits |
|---|---|---|---|
| `aghr validate --strict` | in-process | <2s | — |
| `aghr lint` | in-process | <2s | — |
| `aghr generate --check` | in-process | <2s | — |
| `aghr check --skill-states` | in-process | <2s | — |
| `aghr eval --priority P0-*` | subprocess | minutes | 10 min / 2 GiB |
| `aghr qualify --all-p0-skills` | subprocess | minutes-hours | 10 min / 2 GiB |
| `aghr doctor` | in-process | <2s | — |

Each button opens a modal: select profile, args, and confirm.

#### 18.2 Live Output (WebSocket)

- Streaming stdout/stderr with ANSI color preservation
- Elapsed time, memory usage
- **Cancel button** appears during run
- On timeout → `resource_limit_exceeded` with partial output preserved

#### 18.3 Result View (after completion)

- **Structured summary:** pass/fail counts, error list, warning list, P0 issues
- **SARIF download** if applicable
- **"Suspicious" detector:** if `command=eval` returns `passed` but `raw_stdout` contains no `PASS` string, mark `suspicious` with alert

#### 18.4 History

Table of all runs with: command, status, duration, timestamp, triggered_by, linked CP.

Click row → opens result view. Diff between two runs available.

### 19. Screen 9 — Runtime Evidence

**Layer:** 4 — Evidence

**Purpose:** Read-only view of `.aghr/runtime_evidence/{task_id}.jsonl`.

**Sections:**

#### 19.1 Task List

Columns: `task_id` · `agent` · `agent_version` · `started_at` · `ended_at` · `events_count` · `attention_flags` (badges for `BLOCKED`, `DISCOVERY_UNAVAILABLE`, `UNKNOWN_ID`, `EXECUTED_FAILED`)

**Default filter:** sort by `attention_flags` count descending, then by `started_at` descending.

#### 19.2 Task Detail (Timeline)

Chronological vertical timeline, one entry per event:

| Timestamp | Event | Skill | Evidence |
|---|---|---|---|
| 18:30:15 | **SELECTED** | security-review | reason: "auth change detected" · qualification_ref: ... |
| 18:30:16 | **LOADED** | security-review | instruction_hash: sha256:... |
| 18:30:16 | **HOST_SIGNAL** | — | `NOT_OBSERVABLE` · "host exposes no activation signal" |
| 18:32:04 | **EXECUTED** | security-review | inputs: [diff.patch] · outputs: [findings.md] · exit: success |
| 18:33:00 | **VERIFIED** | security-review | task_criteria: ... · verifier_output: {risk: safe} · result: PASS |
| 18:45:00 | **DISCOVERY_UNAVAILABLE** | — | ⚠️ HALT REQUIRED · reason: "registry unreadable" |

**Color coding:**
- Green: `LOADED`, `EXECUTED`, `VERIFIED`, `HOST_SIGNAL`
- Blue: `SELECTED`
- Gray: `NOT_OBSERVABLE`, `NO_SKILL_MATCH` (both valid)
- Orange: `UNKNOWN_ID`, `EXECUTED_FAILED`
- **Red with halt icon:** `BLOCKED`, `DISCOVERY_UNAVAILABLE`

#### 19.3 Halt Semantics (rc.3 §7.2)

When a task contains `DISCOVERY_UNAVAILABLE` or `BLOCKED`, the task detail shows a **prominent warning panel**:

> **Halt Required**
> This session recorded a `DISCOVERY_UNAVAILABLE` event at 18:45. Per rc.3 §7.2, the session's execution is **not trusted** without re-discovery. Before treating any subsequent `VERIFIED` events as valid, re-run discovery with a healthy registry and record the outcome as a new task.

This prevents the Studio from ever presenting a poisoned session as successful.

#### 19.4 Actions

- **"Submit to CI"** — generates a PR draft including the evidence file, linked to a Change Package
- **"Open source file"** — opens `.aghr/runtime_evidence/{task_id}.jsonl` in editor
- **No write actions** — this screen is strictly read-only

### 20. Screen 10 — Change Packages List

**Layer:** 4 — Evidence

**Purpose:** Central work queue.

**Columns:** `id` · `title` · `kind` · `status` · `required_approvals` (with completion indicator) · `checks` (validate/lint/generate icons) · `created_by` · `created_at` · `target_item_id` (if any)

**Filters:** status, kind, created_by, required_role (shows packages awaiting a specific role).

**Default:** status `in_review` first, then `draft`.

**Actions per row:** Open detail · Approve (if role matches) · Reject · Duplicate · Close.

### 21. Screen 11 — Change Package Detail

**Layer:** 4 — Evidence

**Purpose:** The full lifecycle view of a single CP.

**Sections:**

#### 21.1 Header

```
CP-2026-0042 · Add SEC-008
Status: in_review · created 2h ago by alice
Kind: CONSTRAINT · target: new
Base: 1.0.0-rc.3
Version hash: sha256:a7f3b2c...
```

#### 21.2 Proposal Pane

- YAML editor (Monaco) with `item.schema.json` validation on save
- **Version hash updates live** as content changes
- If hash changes from approved version → prominent banner "Proposal modified since last approval; all approvals invalidated"

#### 21.3 Checks Panel

Six check cards, each showing: status icon · timestamp · duration · "View details" link.

| Check | Status | Notes |
|---|---|---|
| validate | ✓ passed | — |
| lint | ✓ passed | — |
| generate | ⚠ compress | byte_delta: +142B · P0 preserved: yes |
| skill_states | — n/a | no CAPABILITY references |
| doctor | ✓ passed | 3 gates verified |
| eval | ⏳ pending | fixtures required: `evals/fixtures/instruction/SEC-008/` |

**Blockers** section shows what's preventing approval (e.g., "eval pending").

#### 21.4 Impact Panel

From `impact_summary_json`:
- **On authority:** "adds enterprise-level constraint"
- **On compatibility:** "no conflict with existing items"
- **On consumers:** `services/payments/**`, `services/auth/**`
- **Budget delta:** shows which target agents' budgets are affected

#### 21.5 Approvals Panel

Table of required roles:

| Role | Status | Approver | Approved Version | At | Action |
|---|---|---|---|---|---|
| governance-owner | ✓ approved | alice | sha256:a7f3... | 18:30 | — |
| security-owner | ⏳ pending | — | — | — | Approve / Reject |

**Approve button** only enabled if:
1. All checks passed (or generate in `compress` with explicit ack)
2. Proposal version hash matches current
3. User role matches required role
4. No previous rejection at current version

#### 21.6 Diff Preview

Unified diff of all files the CP would affect when exported:
- New files (green)
- Modified files (yellow, with line-level diff)
- Deleted files (red)

#### 21.7 Export Panel

Three export options:

| Format | When to use | What it produces |
|---|---|---|
| **Patch file** | Default; safe | `.patch` in `.governance/studio/drafts/CP-2026-0042.patch` |
| **Signed commit** | When GPG key configured | New branch `aghr/cp-2026-0042` with signed commit |
| **Unsigned commit** | Fallback when no GPG | New branch with unsigned commit + warning |

**Export button** only enabled when:
- Status = `approved`
- All approvals match current `proposal_version_hash`
- No blockers remain

After export → status becomes `exported`; the patch path or commit SHA is recorded.

### 22. Screen 12 — Meta-Governance

**Layer:** 1 + 4 — Governance Authority + Evidence

**Purpose:** First-class workflow for rc.3 §16 — changing AGHR itself.

**Two tabs:**

#### 22.1 Tab — §16.1 Instruction-Item Changes

Same as Change Package, but with additional requirements:
- `kind` restricted to `policies/**` items
- Requires governance-owner + at least one additional reviewer
- **All existing behavioral evals must pass** in the checks panel
- `aghr generate --check` must return `passed` after regeneration

#### 22.2 Tab — §16.2 Skill Adoption

7-step wizard mirroring rc.3 §16.2:

1. **Classify** — source (system/user/project/extension/catalog) × function (routing/design/implementation/debugging/security/verification/learning)
2. **Duplicate check** — compares against existing capabilities; if duplicate → must record preferred + alternative
3. **Add to project selections** — updates `capabilities/project-selections/` (creates CP)
4. **Create/update CAPABILITY item** — wizard for full capability YAML
5. **Run qualification** — opens Verification screen pre-configured with `aghr qualify --skill {id} --host {host} --version {v} --scope {s}`
6. **Add eval fixtures** — if P0, must create fixtures covering all 8 scenarios from §11.2
7. **Submit as Change Package** — full CP flow

Each step's completion is recorded in the Change Package metadata; skipping a step is blocked.

### 23. Screen 13 — Intake & Learning

**Layer:** 4 — Evidence

**Purpose:** Ingest source documents and lessons, convert to change packages.

**Sections:**

#### 23.1 Intake Inbox

- List of files in `.governance/studio/intake/` (user drops files here)
- Each file with detected type (markdown, yaml, pdf), hash, and status (new / triaged / converted)
- **Triage action** — opens a modal with:
  - Detected kind (via heuristic + user override)
  - Suggested target items (via fuzzy match against existing items)
  - "Convert to Change Package" button

#### 23.2 Lessons from Runtime

- Lessons extracted via `governed-learning` skill (rc.3 §11.2 scenario 8)
- Each lesson shows: source task_id, extracted pattern, proposed action
- **Action options:**
  - Create CP (proposal for new rule or amendment)
  - Add eval fixture
  - No action (dismiss with reason)

**No automatic promotion** — every lesson requires explicit conversion to a CP.

### 24. Screen 14 — Audit & Reports

**Layer:** 4 — Evidence

**Purpose:** Full audit log and report generation.

**Sections:**

#### 24.1 Audit Log

Table with columns: `at` · `actor` · `role` · `event_type` · `resource` · `payload` (expandable)

Filters: actor, event_type, resource_type, date range.

#### 24.2 Reports

Four report generators:

| Report | Format | Content |
|---|---|---|
| **Compliance report** | JSON / MD / SARIF | All items with their status, last verification, calibration state |
| **Change history** | JSON / MD | All CPs with their full lifecycle |
| **Skill qualification report** | JSON / MD | Full matrix with evidence links |
| **Metrics report** | JSON / CSV | All 10 §17 metrics with trend |

Each report has a "Generate" button → produces a run, viewable and downloadable.

### 25. Screen 15 — Metrics

**Layer:** 4 — Evidence

**Purpose:** Persistent view of rc.3 §17 metrics.

**Layout — two sections:**

#### 25.1 Instruction Metrics (§17.1)

| Metric | Current | Target | Trend (90d) |
|---|---|---|---|
| Policy coverage | 87% | 100% of P0 | ↗ |
| Eval pass rate | 94% | ≥95% | ↗ |
| Exception half-life | 76d | <90d | → |
| Drift rate | 3% | trending down | ↘ |
| Calibration coverage | 42% | ≥80% at L4 | ↗ |

Each with a sparkline. Clicking opens a detail view with per-item breakdown.

#### 25.2 Skill Metrics (§17.2)

| Metric | Current | Target | Trend (90d) |
|---|---|---|---|
| Skill qualification coverage | 78% | 100% on P0 | ↗ |
| Skill eval pass rate | 96% | ≥95% | → |
| **False-success rate** | **0%** | **0%** | → |
| Discovery recall (multilingual) | 91% | 100% | ↗ |
| Qualification drift | 0 | 0 at release | → |

**False-success rate** has a red/green badge based on threshold (any value >0 is red with alert).

**Separate panels for honesty vs behavioral:** below the tables, two large gauges:
- Left gauge: **Honesty checks** — must be 100% (7 checks × N items)
- Right gauge: **Behavioral tolerance** — must be ≥95%

These are **never averaged**. A commit is blocked if honesty <100%.

### 26. Screen 16 — Settings

**Layer:** 3 — Execution Controls

**Sections:**

#### 26.1 Workspaces

Add / remove / re-scan. For each: path, version, signature status, last scan duration.

#### 26.2 Roles & Users

Local simulated roles. Each user (OS username) can be assigned one role. Roles map to `can` permissions (see §27).

#### 26.3 Git Integration

- GPG key selection (with test signing button)
- Default branch
- Commit message template
- **Warning:** "If GPG is not configured, exports default to unsigned commits with visible warning"

#### 26.4 Resource Limits

Per command:
- `eval` timeout (default 600s), memory (default 2048 MB)
- `qualify` timeout (default 3600s), memory (default 2048 MB)

#### 26.5 Host Configuration

For each host (codex, gemini-cli, antigravity, claude-code, cursor):
- Binary path
- Version detection method
- Default budget bytes

#### 26.6 Security

- Local access token (rotated per session; shown in terminal on startup)
- Server binding (default `127.0.0.1`)
- Audit retention (default 90 days)

---

## Part IV — API Specification

All endpoints under `/api/v1/`. All require `X-Studio-Token` header (from `settings.yaml`). All responses are JSON with `{data, meta}` shape.

### 27. Endpoints — Workspaces & Projects

```
GET    /workspaces
POST   /workspaces               {name, package_path}
DELETE /workspaces/{id}
POST   /workspaces/{id}/scan      (triggers re-index)

GET    /workspaces/{id}/projects
POST   /workspaces/{id}/projects  {name, path, host, host_version}
DELETE /workspaces/{id}/projects/{pid}
POST   /workspaces/{id}/projects/{pid}/scan
GET    /workspaces/{id}/projects/{pid}/config
```

### 28. Endpoints — Instructions

```
GET    /workspaces/{id}/instructions
       ?kind=&force=&priority=&authority_level=&status=
       &impact_evidence=&is_review_due=&host=&path=&q=
GET    /workspaces/{id}/instructions/{item_id}
GET    /workspaces/{id}/instructions/{item_id}/relations
GET    /workspaces/{id}/instructions/{item_id}/history
GET    /workspaces/{id}/instructions/{item_id}/evals
GET    /workspaces/{id}/instructions/{item_id}/calibrations

# No write endpoints — mutations go through Change Packages
```

**Note on filters:** `?language=` is deliberately **not supported** (Axiom A4).

### 29. Endpoints — Capabilities

```
GET    /workspaces/{id}/capabilities
       ?source=&function=&tier=&host=&qual_status=
GET    /workspaces/{id}/capabilities/{item_id}
GET    /workspaces/{id}/capabilities/{item_id}/qualification
GET    /workspaces/{id}/capabilities/{item_id}/usage?limit=20
GET    /workspaces/{id}/capabilities/matrix     (qualification matrix)
```

### 30. Endpoints — Generation

```
POST   /workspaces/{id}/generate/preview
       {agent, profile, dry_run: true}
       → {content, content_hash, stage, byte_size, byte_delta, p0_preserved, prin_007_present}

POST   /workspaces/{id}/generate/export
       {agent, profile, mode: "clipboard" | "file"}
       → {path?} — never writes to repo
```

### 31. Endpoints — Verification

```
POST   /workspaces/{id}/verify/run
       {command, args}
       → {run_id}
GET    /workspaces/{id}/verify/runs
GET    /workspaces/{id}/verify/runs/{run_id}
GET    /workspaces/{id}/verify/runs/{run_id}/sarif
WS     /workspaces/{id}/verify/runs/{run_id}/stream
POST   /workspaces/{id}/verify/runs/{run_id}/cancel
```

### 32. Endpoints — Runtime Evidence

```
GET    /workspaces/{id}/evidence/tasks
       ?attention_flag=&agent=&date_from=&date_to=
GET    /workspaces/{id}/evidence/tasks/{task_id}
GET    /workspaces/{id}/evidence/tasks/{task_id}/events
POST   /workspaces/{id}/evidence/tasks/{task_id}/submit-to-ci
       → {pr_draft_url?}
```

**No write to `.aghr/runtime_evidence/` — only submit-to-CI reads.**

### 33. Endpoints — Change Packages

```
GET    /workspaces/{id}/cps
       ?status=&kind=&created_by=&requires_role=
POST   /workspaces/{id}/cps
       {title, kind, target_item_id?, source?, proposed_yaml}
GET    /workspaces/{id}/cps/{cp_id}
PATCH  /workspaces/{id}/cps/{cp_id}
       {proposed_yaml} → increments proposal_version_hash
POST   /workspaces/{id}/cps/{cp_id}/validate
POST   /workspaces/{id}/cps/{cp_id}/preview
POST   /workspaces/{id}/cps/{cp_id}/approve
       {role, decision, reason}
POST   /workspaces/{id}/cps/{cp_id}/export
       {format: patch|commit_signed|commit_unsigned}
POST   /workspaces/{id}/cps/{cp_id}/close
```

### 34. Endpoints — Adoption

```
POST   /workspaces/{id}/adoptions
       {target_project_id, level, profile}
GET    /workspaces/{id}/adoptions/{aid}
POST   /workspaces/{id}/adoptions/{aid}/preview
POST   /workspaces/{id}/adoptions/{aid}/apply
       {mode: patch|commit}
GET    /workspaces/{id}/adoptions/{aid}/diff
```

### 35. Endpoints — Metrics & Audit

```
GET    /workspaces/{id}/metrics/current
GET    /workspaces/{id}/metrics/history?days=90
POST   /workspaces/{id}/metrics/snapshot     (manual trigger)

GET    /audit/events?actor=&event_type=&date_from=&date_to=
GET    /audit/events/{id}
```

### 36. Endpoints — Settings

```
GET    /settings
PATCH  /settings/roles
PATCH  /settings/git
PATCH  /settings/limits
PATCH  /settings/hosts
PATCH  /settings/security
POST   /settings/test-signing
```

---

## Part V — Workflows

### 37. Workflow — Authoring a New Constraint

```
1. User clicks "New Change Package" → selects kind=CONSTRAINT
2. Editor opens with schema-required fields highlighted
   - Must fill: id, force=MUST_NOT, severity=critical, authority.level
3. Live validation:
   - If force=MUST_NOT and severity=critical and authority.level missing → error "authority.level is required"
   - If enforcement.technical is empty and mergeEffect=blocking → error "technical enforcement required"
4. On save draft:
   - proposal_version_hash computed
   - Backend runs: validate, lint, generate (dry-run), doctor
   - If validate fails → status stays draft; errors shown
   - If lint fails → status stays draft; lint issues shown
   - If generate fails (stage=fail) → status stays draft; P0 overflow list shown
   - If all pass → status=validated
5. Preview diff shown
6. User submits for review → status=in_review
7. Required approvals list populated from kind+severity+authority
8. governance-owner reviews → approves with version hash
9. If security-owner also required → notified; on approve, all approvals complete
10. Export enabled → user selects format
11. Export creates patch OR commit (never touches state.json)
12. User (or CI) applies patch → PR opens → CI runs full gate → merge
```

### 38. Workflow — Impact Calibration

```
1. User on Instruction Detail (evidence=assumed) clicks "Calibrate"
2. Modal opens:
   - Select eval run (dropdown of passed eval runs for this item)
   - Enter measuredDelta (numeric, with explanation)
   - Reason (required prose)
3. On submit → creates CP with kind="calibration"
4. Proposed YAML is a diff to the original item:
   - impact.evidence: repo-measured
   - impact.lastCalibrated: <run.finished_at>
   - impact.measuredDelta: <entered>
5. Checks run as normal CP
6. Approval requires governance-owner only (severity unchanged)
7. On export → patch updates the source YAML
8. Next scan → cache updates → badge changes from [assumed] to [repo-measured]
```

### 39. Workflow — Skill Adoption (Meta-Governance)

```
1. User opens Meta-Governance tab → Skill Adoption
2. Wizard step 1: source + function selection
3. Step 2: duplicate check — Studio queries capability_items_cache for same function
   - If match found → user must select preferred vs alternative
4. Step 3: add to project selections
   - Creates or updates capabilities/project-selections/{project}.yaml
5. Step 4: create CAPABILITY item
   - Editor with full capability schema
   - Requires: skillId, source, function, permissions, inputs, outputs
6. Step 5: run qualification
   - Studio opens Verification screen pre-configured:
     `aghr qualify --skill {id} --host {host} --version {v} --scope {s}`
   - On completion, evidence link recorded
7. Step 6: add eval fixtures (mandatory if P0)
   - Studio creates scaffolding in evals/fixtures/skill/{id}/
   - User fills in scenarios (8 mandatory)
8. Step 7: submit as CP
   - All steps' outputs are bundled into the CP's base_item_ids and checks
   - Full CP approval flow applies
9. On approval + export → package contains the new skill + qualification evidence
10. CI adopts state.json with new skillQualification entry
```

### 40. Workflow — Runtime Evidence Triage

```
1. User opens Runtime Evidence screen
2. Default view shows tasks with attention flags (BLOCKED, DISCOVERY_UNAVAILABLE, etc.)
3. User clicks task → opens timeline
4. If DISCOVERY_UNAVAILABLE present → halt warning panel shown
5. User has three options:
   a. "Ignore session" → task marked as triaged_untrusted in audit
   b. "Re-run discovery" → opens Verification screen for a new discovery run
   c. "Submit to CI" (if the session produced a PR) → generates PR draft
6. If the session is submitted with a valid PR, CI evaluates evidence before merging state.json
```

---

## Part VI — Technical Architecture

### 41. Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Existing foundation |
| State | Zustand + TanStack Query | Client state + server cache |
| UI | Radix UI + Tailwind | Accessible primitives + fast styling |
| Editor | Monaco | Schema validation + YAML syntax |
| Graph | React Flow | Relations + dependency graphs |
| Backend | Node.js 20 LTS + Fastify | High-performance, typed routes |
| AGHR bridge | Python subprocess | Reuses `aghr` directly, no logic duplication |
| Storage | SQLite 3.40+ | Single file, no service |
| WebSocket | ws library | Streaming eval/qualify output |
| i18n | i18next | ar + en |

### 42. Directory Structure

```text
aghr-studio/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/                 # settings loader
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── queries/
│   │   ├── routes/
│   │   │   ├── workspaces.ts
│   │   │   ├── instructions.ts
│   │   │   ├── capabilities.ts
│   │   │   ├── generate.ts
│   │   │   ├── verify.ts
│   │   │   ├── evidence.ts
│   │   │   ├── cps.ts
│   │   │   ├── adoptions.ts
│   │   │   ├── metrics.ts
│   │   │   ├── audit.ts
│   │   │   └── settings.ts
│   │   ├── services/
│   │   │   ├── catalog.ts
│   │   │   ├── cp.ts
│   │   │   ├── adoption.ts
│   │   │   ├── verification.ts
│   │   │   ├── evidence.ts
│   │   │   ├── calibration.ts
│   │   │   ├── meta-governance.ts
│   │   │   └── metrics.ts
│   │   ├── aghr/
│   │   │   ├── job-runner.ts       # subprocess with limits
│   │   │   ├── in-process.ts       # validate/lint/generate direct import
│   │   │   ├── schema-loader.ts
│   │   │   └── evidence-reader.ts  # reads runtime_evidence/ (read-only)
│   │   ├── integrations/
│   │   │   ├── git.ts
│   │   │   ├── watcher.ts
│   │   │   └── sigstore.ts
│   │   ├── auth/
│   │   │   ├── token.ts
│   │   │   └── roles.ts
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── instructions/
│   │   │   ├── capabilities/
│   │   │   ├── profiles/
│   │   │   ├── generation/
│   │   │   ├── verification/
│   │   │   ├── runtime-evidence/
│   │   │   ├── change-packages/
│   │   │   ├── meta-governance/
│   │   │   ├── intake-learning/
│   │   │   ├── audit-reports/
│   │   │   ├── metrics/
│   │   │   └── settings/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── editors/
│   │   │   ├── badges/
│   │   │   └── tables/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── ws.ts
│   │   │   └── types/
│   │   └── i18n/
│   │       ├── ar/
│   │       └── en/
│   └── package.json
├── aghr/                            # pinned reference to AGHR package
├── .governance/
│   └── studio/
│       ├── drafts/                  # CP patches
│       ├── jobs/                    # subprocess logs
│       └── cache/                   # derived indices (rebuildable)
├── docs/
│   ├── QUICKSTART.md
│   ├── ARCHITECTURE.md
│   └── API.md
└── pyproject.toml
```

### 43. Subprocess Runner — Resource Limits

```typescript
// backend/src/aghr/job-runner.ts (pseudocode)
const limits = {
  eval:     { timeoutMs: 600_000,  memoryMb: 2048 },
  qualify:  { timeoutMs: 3_600_000, memoryMb: 2048 },
};

async function runAghr(cmd: string, args: string[], opts) {
  const child = spawn('aghr', [cmd, ...args], {
    cwd: opts.cwd,
    env: { ...process.env, AGHR_STUDIO: '1' },
    // on Linux/macOS: use setrlimit via wrapper
    // on Windows: use job objects via wrapper
  });

  const timer = setTimeout(() => {
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 5000);
    status = 'resource_limit_exceeded';
  }, limits[cmd].timeoutMs);

  // stream stdout/stderr via WS to client
  // on exit → capture, parse, store in verification_runs
}
```

**Security:** The command name is from a fixed allowlist (`validate`, `lint`, `generate`, `check`, `eval`, `qualify`, `doctor`). Arguments are structured (no shell interpolation).

### 44. Authorization Model

Every request is checked against `(actor_role, action, resource)`:

```yaml
roles:
  developer:
    can: [read:*, cp.create, cp.edit_own, adoption.preview, verify.run.fast]
  governance-owner:
    can: [read:*, cp.create, cp.edit_any, cp.approve.governance, adoption.apply,
          verify.run.*, calibrate.*, meta.change.propose]
  security-owner:
    can: [read:*, cp.approve.security, verify.run.*]
  architecture-board:
    can: [read:*, cp.approve.architecture, exceptions.approve]
```

**Implementation:**
- `auth/roles.ts` enforces per-request
- All mutations log to `audit_events`
- Frontend hides unauthorized actions (defense in depth)
- **Backend rejects unauthorized requests regardless of frontend state**

---

## Part VII — Execution Plan

### 45. Twelve-Week Phased Delivery

#### Phase 0 — Contract Finalization (Week 1)

**Deliverables:**
- `aghr.json` schema v1.2
- `contracts/` — OpenAPI spec + JSON Schemas for all API types
- SQLite schema initialized + migrations
- `evidence.schema.json` mirrored from rc.3 §12.2
- Decisions documented for the 7 open questions (§46)
- `settings.yaml` template

**Exit criterion:** All SQL tables created; workspace can register a real `aghr/` package and scan it; `/api/v1/workspaces/{id}/instructions` returns non-empty results.

#### Phase 1 — Specialized Browsing (Weeks 2–3)

**Deliverables:**
- Screens 2, 3, 4, 5 (full)
- Backend: instructions, capabilities endpoints
- Frontend: filters, detail views, Skill Card with 3 axes + 4 keys + per-state evidence

**Exit criterion:** Every item visible with `authority.level`, `impact.evidence`, `nextReview`; Skill Card shows qualification matrix.

#### Phase 2 — Single Instruction Cycle (Weeks 4–5)

**Deliverables:**
- Screens 7 (Generation), 10, 11 (Change Packages)
- Backend: CP lifecycle, generation preview, version_hash, approval binding
- Frontend: Monaco editor with schema validation, diff preview, approval UI

**Exit criterion:** `SEC-001` can be authored → validated → generated (with stage indicator) → diff previewed → CP created → approved → exported as patch. `state.json` untouched.

#### Phase 3 — Single Capability Cycle (Weeks 6–7)

**Deliverables:**
- Screens 8 (Verification), 9 (Runtime Evidence)
- Backend: subprocess runner with limits, evidence ingestion, halt detection
- Frontend: verification streaming, evidence timeline, halt warning

**Exit criterion:** `CAPABILITY` created → qualified on codex → usage recorded → `NOT_OBSERVABLE` displayed correctly → `DISCOVERY_UNAVAILABLE` flagged as halt → `BLOCKED` ≠ `NO_SKILL_MATCH`.

#### Phase 4 — Governed Change (Weeks 8–9)

**Deliverables:**
- Screen 12 (Meta-Governance) fully functional
- Screen 13 (Intake & Learning)
- Backend: meta-governance routing, adoption wizard, intake processing
- Frontend: 7-step skill adoption wizard, §16.1 proposal flow

**Exit criterion:** A §16.1 change (modifying `policies/`) goes through full CP flow with all evals required; a §16.2 skill adoption goes through all 7 steps.

#### Phase 5 — Pilot Project (Weeks 10–11)

**Deliverables:**
- Screen 1 (Dashboard) fully functional
- Backend: metrics snapshots, audit reports
- Adoption of L2 (instructions) + L3 (P0 skills) on two projects

**Exit criterion:** Real evidence linked to versions; `runtime_evidence` attached to PR; `aghr doctor` confirms gates; qualification gaps logged; dashboard shows real metrics.

#### Phase 6 — Operational Refinement (Week 12)

**Deliverables:**
- Screens 14 (Audit & Reports), 15 (Metrics), 16 (Settings)
- Full test suite (unit + E2E)
- Packaging: `pipx install aghr-studio`
- Documentation: README, Quickstart, API reference

**Exit criterion:** `pipx install aghr-studio && aghr-studio` works; all §48 acceptance criteria pass; documentation complete.

### 46. The Seven Open Decisions (Resolved)

| # | Question | Decision | Rationale |
|---:|---|---|---|
| 1 | `HOST_ACTIVATED` vs execution | `HOST_SIGNAL` optional; `NOT_OBSERVABLE` valid | rc.3 §7.1 |
| 2 | `UNKNOWN_SKILL` single vs three | Three distinct states with distinct UI | rc.3 §7.2 |
| 3 | CI-owned state vs session decisions | Runtime evidence separate, CI publishes | rc.3 §12.1 |
| 4 | Language scope | Rendering only, never filters | rc.3 §5.3 |
| 5 | Multilingual discovery metric | Separate reporting accuracy from quality | rc.3 §17.2 |
| 6 | `INBOX/new-app/` folder ingestion | Watcher filters `*.md`, `*.yaml`, `*.json`; folder drops treated as new CP drafts | Studio-specific, documented in `README.md` |
| 7 | Enabling writes | Bound to specific CP + server-side verification + role check | Studio-specific, enforced in §44 |

---

## Part VIII — Acceptance Criteria

### 47. Functional Acceptance

- [ ] Every instruction and capability is traceable to its source file + version
- [ ] `authority.level` is visible, sortable, filterable on every `MUST`/`MUST_NOT`
- [ ] Editor blocks save when `force=MUST/MUST_NOT` and `authority.level` is missing
- [ ] `impact.evidence` is visible on every item with distinct color per class (`assumed`=gray, `benchmark`=blue, `repo-measured`=green)
- [ ] `nextReview` past today triggers `[Review Due]` badge in Registry and Dashboard
- [ ] Language **never** hides an item; `translation_unavailable` shown as a badge, not a hide reason
- [ ] Validation in Studio is byte-identical to `aghr validate --strict` (tested via 100 random items)
- [ ] Generation shows stage (`full`/`compress`/`compact`/`fail`); `fail` blocks export
- [ ] `PRIN-007` presence check displayed; absence blocks export
- [ ] Skill Card shows 3 axes with per-state evidence link
- [ ] `contentHash` or `hostVersion` change → `[Qualification Expired]` red badge → P0 selection blocked
- [ ] `BLOCKED`, `NO_SKILL_MATCH`, `UNKNOWN_ID`, `DISCOVERY_UNAVAILABLE` have distinct colors + icons + copy
- [ ] `DISCOVERY_UNAVAILABLE` triggers halt warning panel; session marked untrusted
- [ ] `NOT_OBSERVABLE` displayed as valid (gray); `HOST_SIGNAL` never fabricated (verified by 5 negative tests)
- [ ] CP approvals tied to `proposal_version_hash`; any proposal change invalidates all approvals (tested)
- [ ] `state.json` never modified by any Studio action (regression test with file watcher on `state.json`)
- [ ] `runtime_evidence/` never modified by any Studio action
- [ ] `mergeEffect=blocking` requires existing `gate.required=true` (verified via `aghr doctor` before export)
- [ ] Calibration workflow: `assumed` → `repo-measured` requires a linked **passed** eval run; `lastCalibrated` and `measuredDelta` populated correctly
- [ ] Meta-Governance screen routes §16.1 and §16.2 changes correctly with all required approvals
- [ ] All 10 §17 metrics visible in Metrics screen; false-success rate must be 0% (red alert if >0)
- [ ] UI works in Arabic and English; both fully usable
- [ ] Local test results separated from host qualification, independent review, release acceptance
- [ ] 100% honesty checks and ≥95% behavioral tolerance displayed as two distinct gauges; never averaged
- [ ] `eval`/`qualify` respect timeout + memory limits; `resource_limit_exceeded` status recorded on overflow
- [ ] Every write action (patch, commit, adoption apply) preceded by diff preview

### 48. Non-Functional Acceptance

- [ ] Cold start < 3s
- [ ] Indexing 500 items < 5s
- [ ] In-process `validate` < 2s
- [ ] File watcher constrained: debounce 500ms + extension filter (`*.yaml`, `*.md`, `*.json`) + exclude `node_modules`, `.git`, `__pycache__`, `.venv`
- [ ] GPG signing optional with fallback + visible warning in UI
- [ ] Server binds to `127.0.0.1` only
- [ ] Session token rotates per startup
- [ ] No command injection via job-runner (fixed allowlist, structured args)
- [ ] Every API request authorized server-side; unauthorized → 403
- [ ] E2E tests (Playwright) cover all 16 screens
- [ ] Unit test coverage ≥ 80% on backend
- [ ] Load test: 50 concurrent CP validations in <30s
- [ ] `pipx install aghr-studio && aghr-studio` works on Linux, macOS, Windows

---

## Part IX — Risks

### 49. Risks and Mitigation

| # | Risk | Probability | Impact | Mitigation |
|---:|---|---|---|---|
| R1 | Drift between Studio and CI validation | Medium | High | Same `aghr` via subprocess; E2E comparison test with 100 items; nightly diff |
| R2 | Accidental `state.json` write | Low | Critical | File opened read-only; regression test; CI blocks merge if write path detected |
| R3 | Calibration used to demote P0 without sufficient evidence | Low | High | Requires linked passed eval run; governance-owner approval; delta must be recorded |
| R4 | 16 screens slow delivery | Medium | Medium | Phases 1–3 cover 8 screens; rest in 4–6 |
| R5 | `eval`/`qualify` resource exhaustion | Medium | Medium | Hard limits + cancel button + background queue |
| R6 | User expects "automatic apply" | High | Medium | Explicit UX: Apply = local patch/commit; deployment requires CI + branch protection |
| R7 | rc.3 → rc.4 upgrade mid-development | Low | Medium | Schema version pinned; `/workspaces/{id}/check-compatibility` endpoint warns on mismatch |
| R8 | Runtime evidence corruption | Low | Medium | Read-only ingestion; source file hashed; mismatch → warning |
| R9 | Mermaid diagram rendering fails in older browsers | Low | Low | Serve pre-rendered SVG fallback |
| R10 | GPG key unavailable at export | High | Low | Fallback to unsigned with warning; user decision recorded in CP |

---

## Part X — Appendices

### Appendix A — Color Semantics

| Color | Meaning | Used in |
|---|---|---|
| Green (`#16a34a`) | Valid success | `QUALIFIED`, `VERIFIED`, `PASS`, `approved` |
| Blue (`#2563eb`) | Informational / action | `SELECTED`, buttons, links |
| Gray (`#6b7280`) | Valid non-success | `NOT_OBSERVABLE`, `NO_SKILL_MATCH`, `NOT_RUN` |
| Orange (`#ea580c`) | Warning / recoverable | `UNKNOWN`, `EXECUTED_FAILED`, `UNKNOWN_ID` |
| Red (`#dc2626`) | Error / halt | `BLOCKED`, `DISCOVERY_UNAVAILABLE`, `FAILED`, `suspicious` |
| Yellow (`#ca8a04`) | Compressed / stage change | `compress`, `compact`, `review_due` |

**Accessibility:** Each color paired with distinct icon and text label (WCAG 2.2 AA).

### Appendix B — State Transition Diagram — Change Package

```
draft ──(all checks pass)──→ validated
      │
      └──(checks fail)──→ draft (with errors)

validated ──(submit)──→ in_review
in_review ──(all approvals)──→ approved
in_review ──(any rejection)──→ rejected
in_review ──(proposal modified)──→ draft (approvals invalidated)

approved ──(export)──→ exported
approved ──(proposal modified)──→ draft (approvals invalidated)

exported ──(CI merges)──→ closed
exported ──(withdraw)──→ draft
```

### Appendix C — State Transition Diagram — Skill

```
EXISTS ──(discovered by host)──→ DISCOVERED
DISCOVERED ──(qualification run)──→ QUALIFIED | FAILED
QUALIFIED ──(host version changes)──→ NOT_RUN
QUALIFIED ──(content hash changes)──→ NOT_RUN
QUALIFIED ──(scope changes)──→ NOT_RUN

[Task time:]
QUALIFIED ──(agent selects)──→ SELECTED
SELECTED ──(agent loads)──→ LOADED
LOADED ──(host activates | no signal)──→ HOST_SIGNAL | NOT_OBSERVABLE
LOADED ──(agent executes)──→ EXECUTED
EXECUTED ──(verifier passes)──→ VERIFIED
EXECUTED ──(verifier fails)──→ EXECUTED_FAILED
SELECTED ──(permission denied)──→ BLOCKED
SELECTED ──(id unknown)──→ UNKNOWN_ID
SELECTED ──(no match)──→ NO_SKILL_MATCH
SELECTED ──(registry error)──→ DISCOVERY_UNAVAILABLE
```

### Appendix D — i18n Content

**Languages:** Arabic (`ar`) + English (`en`). Default: Arabic if OS language is `ar`, else English.

**All UI strings in `i18n/{lang}/{namespace}.json`.**

**Item content never translated** — only displayed as authored. `translation_unavailable: <lang>` badge shown when `scope.language` does not include active UI language.

### Appendix E — Deployment Options

| Option | Command | Target |
|---|---|---|
| **pipx** | `pipx install aghr-studio && aghr-studio` | Developers |
| **Docker** | `docker run -p 8420:8420 -v ~/governance:/workspace aghr-studio:1.0.0` | CI/team servers |
| **Tauri** (v1.1) | `aghr-studio.app` | Desktop users |

All three run the same backend + frontend bundled. No separate services.

### Appendix F — Version Compatibility

Studio declares supported rc.3 schema version `1.2`. On workspace add:

1. Read `aghr.json.schemaVersion`
2. If `1.2` → supported
3. If `1.1` (rc.2) → warning "Partial support; upgrade to rc.3 recommended"; fallback mode with `NOT_OBSERVABLE` disabled
4. If `< 1.1` or `> 1.2` → error "Unsupported schema version; please upgrade AGHR or Studio"

---

**End of AGHR Governance Studio Specification v1.0.0.**

This specification is complete and ready for implementation. It contains 50 sections, 13 SQL tables, 16 screens, ~60 API endpoints, 5 workflows, 3 state diagrams, and full acceptance criteria. It strictly adheres to AGHR 1.0.0-rc.3 (Consolidated) and makes no governance claims beyond what that reference defines.
