-- DRAFT projection; extracted verbatim (LF normalized) from STUDIO_SPECIFICATION.md sections 5-10.
-- Do not initialize a persistent database from this draft. Local checks use :memory: only.

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

-- Derived cache from policies/**/*.yaml and decisions/**/*.yaml.
-- Rebuilt on every file change. Never written by Studio logic, only by indexer.
CREATE TABLE instruction_items_cache (
  workspace_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  title TEXT,
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
  verification_json TEXT,                 -- lossless projection of verification
  exceptions_json TEXT,
  references_json TEXT,
  source_yaml TEXT NOT NULL,              -- immutable source snapshot for this source_hash
  source_path TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  indexed_at TEXT NOT NULL,

  PRIMARY KEY (workspace_id, item_id, source_hash)
);

CREATE INDEX idx_items_by_level ON instruction_items_cache(workspace_id, authority_level);
CREATE INDEX idx_items_by_tier ON instruction_items_cache(workspace_id, priority_tier);
CREATE INDEX idx_items_review_due ON instruction_items_cache(workspace_id, is_review_due);
CREATE INDEX idx_items_calibration_gap ON instruction_items_cache(workspace_id, impact_evidence);

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
  reason TEXT,                          -- original approval/rejection rationale
  at TEXT NOT NULL,                     -- original decision timestamp
  invalidated_at TEXT NOT NULL,
  invalidation_reason TEXT NOT NULL       -- "proposal_changed" | "explicit_withdrawal"
);

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
  source TEXT,                           -- declared producer: agent | host | ci; not proof of trust
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
  raw_output TEXT,                       -- chronological combined capture retained for baseline compatibility
  sarif_output TEXT,                      -- if applicable
  triggered_by TEXT,                      -- user | scheduled | ci
  triggered_by_user TEXT,
  linked_package_id TEXT                  -- if part of a change package
);

CREATE INDEX idx_vr_workspace_time ON verification_runs(workspace_id, started_at DESC);
CREATE INDEX idx_vr_command ON verification_runs(workspace_id, command, status);

-- Periodic snapshots for trend charts (rc.3 §17).
CREATE TABLE metrics_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  instruction_metrics_json TEXT,          -- original grouped payload; scalars below are projections of this capture
  skill_metrics_json TEXT,

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
  actor_role TEXT,                        -- server-resolved authorization role
  simulated_role TEXT,                    -- optional preview context; never grants permissions
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
