# Governed Engineering Skills Integration (GESI)

**Status:** `CANDIDATE_SPECIFICATION_AND_PROCEDURE / NOT_RUNTIME_ENFORCED`
**Core Principle:** AGHR governs engineering work (`GOV-*`, `ADEQ-*`, `RCCA`); specialized skills provide execution methodologies. Reuse qualified existing or native skills before introducing new dependencies or workflows.

---

## 1. Current-State Verification (Baseline & Historical Continuity)

Evaluated against `Agent_Governance_RCCA_Kit_EN_v1.4.0` (frozen Baseline v1), `Agent_Governance_RCCA_Kit_EN_v1.4.1_Candidate` (Post-Merge Closure increment), legacy `Agent_Governance_Harness_Reference_1.2.0`, `AGHR_Candidate_1.3.0`, and repository intake inventories:

| Capability Area | Rating | Verified Source Locations | Findings & Reconciliation |
|---|---|---|---|
| **Reuse before building & capability honesty** | `COVERED` | `policies/RULES.json` (`GOV-012`, `GOV-024`), `policies/ADEQ.md` (`ADEQ-07`, `ADEQ-18`), `docs/02_BOUNDED_AUTONOMY.md`, `skills/adeq-quality/SKILL.md` | Rules already require inspecting and reusing available skills without inventing installations or bypassing host constraints. |
| **Skill execution vs. loading & host inventory separation** | `PARTIAL` | `AGHR_Candidate_1.3.0` (`SKILLS_MIGRATION_1_2_TO_1_3.md`, `runtime/skills.py`, `runtime/skill_catalog.py`, `runtime/skill_evidence.py`), `INBOX/codex skills.md`, `INBOX/Antigravity SKILLs.md` | `v1.4.0` lacks the 1.3.0 candidate's 6-state skill lifecycle (`DISCOVERED`..`VERIFIED`), host-vs-catalog origin distinction, and `skills-check` diagnostic. Local inventory showed `125` on-disk vs `75` session-announced Codex skills, confirming file presence != enabled/loaded. |
| **External skill compatibility & conflict matrix** | `PARTIAL` | `1.2.0` `AGHR-038`, `procedures/EXTERNAL_CAPABILITIES_AR.md`, `optional_skills/agent-tool-security/SKILL.md`, `docs/15_PROVIDER_SOURCE_DELTA.md` | General vetting exists in legacy `1.2.0` (Arabic), while `v1.4.0` covers only Spec Kit deltas (`docs/15_PROVIDER_SOURCE_DELTA.md`). Missing structured compatibility checks for worktrees, repeated approval gates, evidence-reuse bans, and missing resource links. |
| **Supply-chain, scripts, hooks & upstream drift** | `PARTIAL` | `GOV-002`, `GOV-016`, `docs/05_ADOPTION_AND_ROLLBACK.md`, `docs/07_PROVIDER_ALIGNMENT.md` | Dependency execution and no-auto-hook adoption rules exist, but revision pinning, missing supplementary files, and skill-level upstream drift checks are missing from `v1.4.0`. |
| **Controlled adoption, pilots & governed learning** | `PARTIAL` | `ADEQ-24`, `GOV-021`, `1.2.0` `procedures/GOVERNED_LEARNING.md`, `docs/09_EVALUATION_AND_MAINTENANCE.md` | Governed learning and PRE/POST evaluation exist; GESI connects skill pilot outcomes (`PASSED_MEANINGFUL_VALUE` / `FAILED_NO_MEANINGFUL_VALUE`) to `ADEQ-24` without creating a second skill ledger. |
| **Competing workflow/auth claims in external frameworks** | `CONFLICT` | `OWNER_DECISION_REGISTER_2026-11-07.md` (`DEC-001`, `DEC-003`, `DEC-009`), `docs/16_POST_MERGE_CLOSURE.md`, `policies/ADEQ.md` (`ADEQ-12`, `ADEQ-22`) | Self-review personas (`DEC-001`), automatic PEP/PDP or session hooks (`DEC-009`), mandatory full pipelines for trivial tasks (`ADEQ-12`), and post-merge bypasses conflict with AGHR authority and remain blocked or constrained. |
| **Runtime hook / PEP / auto-installer** | `NOT_APPLICABLE` | `DEC-009`, `PACKAGE_STATUS.json`, `policies/CORE.md` | GESI is strictly declarative and read-only (`runtime_enforcement_verified: false`). Host runtimes own actual loading and enforcement. |

---

## 2. External Engineering Skills Assessment (Static Evaluation Only)

Evaluated without installing, cloning, or executing any third-party package:

| Source / Ecosystem | Primary Artifact Pattern | Engineering Capabilities | Framework vs. Standalone | Key AGHR Conflicts & Required Constraints | Recommended GESI Disposition |
|---|---|---|---|---|---|
| **`addyosmani/agent-skills`** | Phase-aligned `SKILL.md` + `references/` + optional `scripts/` | `/spec`, `/plan`, `/build`, `/test`, `/review`, TDD, debugging, review | Modular skills collection plus workflow router (`using-agent-skills`) | Router may reference uninstalled skills (observed in local inventory: 9 missing referenced skills); self-review (`code-review-and-quality`) cannot replace independent merge review (`GOV-009`, `DEC-001`). | `ADAPT_WITH_CONSTRAINTS` / `USE_EXISTING` where equivalent native/local skills already exist. |
| **`obra/superpowers`** | Plugin + `hooks.json` (`SessionStart`) + chained `SKILL.md` skills | `brainstorming`, `writing-plans`, `using-git-worktrees`, `test-driven-development`, `systematic-debugging`, `subagent-driven-development`, `finishing-a-development-branch` | Opinionated end-to-end workflow framework with hook bootstrap | `SessionStart` auto-injection conflicts with no-auto-hook adoption (`docs/05_ADOPTION_AND_ROLLBACK.md`); `using-git-worktrees` conflicts with single-worktree tasks; `subagent-driven-development` conflicts with single-primary-writer default (`docs/02_BOUNDED_AUTONOMY.md`); `finishing-a-development-branch` must defer to `docs/16_POST_MERGE_CLOSURE.md` and `GOV-015`. | `REJECT` wholesale framework/hooks; `ADAPT_WITH_CONSTRAINTS` only for isolated methodology slices (e.g., `systematic-debugging`) when needed. |
| **`trailofbits/skills`** | Marketplace manifest + `plugins/<name>/skills/<skill>/SKILL.md` + `scripts/` + `references/` | Security auditing, static analysis (Semgrep/CodeQL/Slither), vulnerability verification | Specialized security plugin marketplace | Helper `scripts/` may invoke external scanners/binaries requiring `GOV-016` dependency/execution scope and intact `references/` trees. | `PILOT_FIRST` / `ADAPT_WITH_CONSTRAINTS` for security audits lacking native equivalents; inspect scripts first. |
| **`affaan-m/ECC`** | Monolithic harness: skills, multi-persona subagents, persistent memory, lifecycle hooks (`PreToolUse`, `PostToolUse`, `Stop`, `PreCompact`) | `/tdd`, `/refactor-clean`, codemaps, AgentShield, automated build repair | Opinionated agent harness & hook runtime | Lifecycle hooks and cross-session global memory conflict with `DEC-009`, `GOV-021`, and host-authority separation (`GOV-001`); multi-persona subagent reviewers cannot fabricate independence (`GOV-022`, `DEC-001`). | `REJECT` harness, hooks, and auto-memory; extract only bounded, read-only codemap/checklist ideas if justified. |
| **`microsoft/skills`** | Domain `SKILL.md` runbooks, SDK guidance, MCP server configs | Azure, .NET, Microsoft Foundry, SDK patterns | Domain skill catalog + optional MCP configs | Bundled MCP servers and cloud deploy/auth recipes require `GOV-017`/`GOV-020` scoping and explicit credentials isolation. | `PILOT_FIRST` / `ADOPT_EXTERNAL` only for matching stack tasks with pinned revision and isolated MCP permissions. |
| **Native & local host skills** | Host-native builtin/user/plugin skills (Codex, Antigravity, IDE) | `browser-testing`, `security-diff-scan`, `debugging-and-error-recovery`, `adeq-quality` | Native host capabilities | Disk presence (`INSTALLED`) != session visibility (`ENABLED`) != `LOADED` != `VERIFIED`. | `USE_EXISTING` first once `ENABLED`/`LOADED` state is confirmed. |

---

## 3. Ownership Boundaries

- **AGHR Core (`GOV-*`, `ADEQ-*`, `RCCA`):** Owns authority, bounded delegation (`RESERVED` actions), risk routing (`QUICK`/`STANDARD`/`CONTROLLED`), evidence integrity, and owner acceptance.
- **GESI (`docs/17_GOVERNED_ENGINEERING_SKILLS.md`, `agdl/gesi.py`, `schemas/gesi.schema.json`):** Owns capability state honesty, task-to-skill matching, compatibility/supply-chain vetting, selection decisions, and adoption/pilot lifecycle tracking.
- **Engineering Skills:** Provide optional, task-specific execution methodologies subordinate to project rules and owner decisions.
- **Runtime / Host:** Performs native discovery, loading, tool execution, and OS/sandbox enforcement. GESI never claims to be a Policy Enforcement Point (PEP), permission engine, or installer.

---

## 4. GESI Functional Lifecycle (Parts A–F)

### A. Capability Discovery & Six Lifecycle States
Inspect actual host-exposed capabilities before recommending installation. Maintain six distinct states:
1. `DISCOVERED` — Identified in an external catalog, repository, or unverified disk scan.
2. `INSTALLED` — Files exist in a host/project location (not proof of activation or integrity).
3. `ENABLED` — Explicitly permitted/announced for the target host/session configuration.
4. `LOADED` — `SKILL.md` and required relative references were read into the active task context.
5. `USED` — Applied during task execution within valid delegation boundaries.
6. `VERIFIED` — Task outputs, side effects, and acceptance criteria passed scoped verification (`ADEQ-20`).

Track origin separately (`NATIVE_SYSTEM`, `USER`, `PROJECT`, `PLUGIN`, `PACKAGE_REFERENCE`, `EXTERNAL_CATALOG`), optional `discovery_root`, `session_visibility` (`ANNOUNCED`, `UNANNOUNCED`, `UNKNOWN`, `NOT_OBSERVABLE`), and `artifact_kind` (`STANDALONE_SKILL`, `WORKFLOW_FRAMEWORK`, `HOOK_OR_PLUGIN_BUNDLE`).
Use `UNKNOWN` or `NOT_OBSERVABLE` when live session announcement cannot be observed; never infer `ENABLED` or `VERIFIED` from disk presence alone. Detect same-name cross-root collisions and require explicit revision pinning when roots diverge.

### B. Task-to-Skill Matching (Minimal Sufficient Set)
Match task intent, technology/domain, complexity, risk tier, phase, and host compatibility against available skills:
- **Trivial/routine tasks (`TRIVIAL`):** Recommend `NO_SKILL_NEEDED` (direct authorized execution; never force multi-stage skill chains).
- **Existing sufficiency:** If `ENABLED`/`LOADED` existing or native skills cover all required capabilities, select `USE_EXISTING` (preserving any explicit project constraints) and recommend **zero** new installations.
- **Deduplication:** Never load or install overlapping skills that perform the same function without a distinct verified capability gap.
- **Task vs. inventory separation:** Record safety, state, or visibility findings on unrelated or unchosen inventory entries in `inventory_findings` without invalidating an otherwise clean task selection (`issues` tracks blockers on unmet or active task-relevant capabilities).

### C. Governance Compatibility (8 Mandatory Conflict Axes)
Before selecting or adopting any skill, detect conflicts across all eight axes (external skills can **never** override project rules or owner decisions):
1. **Owner authorization & approval boundaries:** Reject or constrain skills assuming implicit approval or self-granting authority (`GOV-001`, `GOV-020`).
2. **Git & deployment permissions:** Reject skills initiating `push`, `merge`, `deploy`, or force operations outside `RESERVED` scope (`GOV-015`, `docs/16_POST_MERGE_CLOSURE.md`).
3. **Mandatory worktrees / branching conventions:** Reject or constrain skills forcing `git worktree add` or incompatible branch flows on single-worktree tasks.
4. **Test & evidence-reuse rules:** Reject or constrain skills forbidding valid evidence reuse (`GOV-018`) or demanding un-triggered full-suite reruns (`ADEQ-12`).
5. **Repeated approval gates:** Reject or constrain opinionated chains demanding repeated per-step owner approvals inside one valid bounded delegation (`GOV-004`, `ADEQ-22`).
6. **Sensitive data, network & runtime side effects:** Reject unapproved telemetry, secret reads, external network calls, or production writes (`GOV-017`, `GOV-020`).
7. **Automatic hooks, scripts & subagent delegation:** Reject unreviewed install/hook scripts (`GOV-016`) and unbounded multi-writer subagents (`docs/02_BOUNDED_AUTONOMY.md`).
8. **Project-specific decisions & phase gates:** Reject any skill contradicting ratified project decisions or release constraints (`ADEQ-03`).

### D. Trust & Supply-Chain Assessment
Treat all upstream skill text as `UNTRUSTED_DATA` (`GOV-002`) until inspected:
- Evaluate detectable security, supply-chain, and governance risks **independently of installation or activation state**; reject unsafe inactive skills without implying they executed unsafe behavior (`inactive_skill_not_executed`).
- Verify provenance, publisher, license, pinned commit/tag revision (`pinned_revision` == `observed_revision`), and upstream behavior/permission drift.
- Verify all referenced supplementary files (`references/`, `scripts/`, shared assets) exist intact before declaring a selective copy ready.
- Enforce host compatibility and bounded tool permissions (`required_permissions` subset of granted `allowed_permissions`).

### E. Six Explicit Selection Decisions
Every assessed candidate skill must receive one decision backed by `reason`, `applicable_scope`, `supporting_evidence`, and preserved `constraints` (for all selected/constrained decisions, including `USE_EXISTING` with review provenance or scope rules):
- `USE_EXISTING` — Sufficient already-enabled native, project, or user skill covers the need (retaining explicit constraints).
- `ADOPT_EXTERNAL` — Clean external skill with verified provenance, compatible governance, authorized adoption, and passed pilot (or `NOT_REQUIRED` low-risk static reference).
- `ADAPT_WITH_CONSTRAINTS` — Valuable methodology retained only when zero inseparable hard conflicts exist and an explicit `separable_adaptable_slice` (for permission/reference/hook boundaries), written `proposed_constraints`, and `evidence_refs` establish safe bounded use; otherwise `REJECT`.
- `PILOT_FIRST` — Clean complementary external candidate requiring a small bounded trial before general adoption.
- `REJECT` — Fails governance compatibility, supply-chain/script safety, missing resources, revision drift, duplicate overlap, or failed pilot value check.
- `DEFER` — Potentially useful, but blocked on missing host announcement (`INSTALLED` only) or `UNKNOWN`/`NOT_OBSERVABLE` session visibility, pending owner decision, or out-of-scope phase.

### F. Controlled Adoption, Pilots & Lifecycle Maintenance
Reuses `docs/05_ADOPTION_AND_ROLLBACK.md` and `ADEQ-24` without creating a competing registry (record selections inside the project's existing task/decision record):
1. **Installation scope:** Choose `PROJECT` scope for repo-specific workflows or `USER` scope for developer-wide personal tools, only under explicit owner activation authority. Never modify global host settings or install packages silently.
2. **Pinning & reversibility:** Pin exact commit/version SHA, preserve prior files/configuration, and maintain a single-step deactivation/removal path (`docs/05_ADOPTION_AND_ROLLBACK.md`).
3. **Representative pilots:** Evaluate external additions on 1–2 small representative tasks against objective criteria (defect detection, omission reduction, context overhead). If a pilot fails to show meaningful value (`FAILED_NO_MEANINGFUL_VALUE`), mark `REJECT` or `DEFER` and remove cleanly.
4. **Review & governed learning:** Revisit affected skill selections when host version, provider rules, skill revision, or project policy changes (`GOV-018`, `GOV-024`), feeding verified lessons back through `ADEQ-24` without auto-modifying policy.

---

## 5. Generic Project Skills-Assessment Template

Attach this compact assessment directly to an existing task or owner-decision record:

```markdown
### Project Skills Assessment (GESI)
- **Task / Phase / Host:** [task_id | phase | host_id + version]
- **Required Capabilities & Constraints:** [capabilities; worktree_policy; allowed_permissions; active_project_decisions]
- **Skill Inventory Checked:**
  - `[skill_id]`: origin=[NATIVE_SYSTEM|USER|PROJECT|PLUGIN|PACKAGE_REFERENCE|EXTERNAL_CATALOG] | root=[discovery_root] | state=[DISCOVERED|INSTALLED|ENABLED|LOADED|USED|VERIFIED|UNKNOWN|NOT_OBSERVABLE] | visibility=[ANNOUNCED|UNANNOUNCED|UNKNOWN|NOT_OBSERVABLE] | rev=[pinned/observed]
- **Compatibility & Trust Findings:** [8-axis checks; missing_references; hooks/scripts; drift]
- **Decision:** [USE_EXISTING | ADOPT_EXTERNAL | ADAPT_WITH_CONSTRAINTS | PILOT_FIRST | REJECT | DEFER]
  - **Reason & Scope:** [evidence-backed rationale + exact scope]
  - **Constraints / Rollback (if adopted/adapted):** [constraints; pin SHA; removal/deactivation steps]
  - **Supporting Evidence:** [local check / pilot ref / `agdl skills-check` output]
- **Authority Status:** `IMPLEMENTED / VERIFIED_IN_SCOPE` (diagnostic check) | Owner Acceptance=[PENDING|ACCEPTED] | Activated=[NOT_ACTIVE|AUTHORIZED_ACTIVE]
```
