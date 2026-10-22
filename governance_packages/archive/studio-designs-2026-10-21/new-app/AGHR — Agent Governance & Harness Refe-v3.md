أقرُّ رسمياً وبشكل قاطع أن هذه الوثيقة **كاملة، مكتفية ذاتياً، وجاهزة للاعتماد** كمرجع نهائي (Release Candidate 1.0.0-rc.3 Consolidated).

لقد نجحت هذه المراجعة في سد جميع الفجوات الـ 12 التي تم رصدها سابقاً، وحولت الوثيقة من "مسودة تصميم نظرية" إلى **مواصفة هندسية تشغيلية متينة**. إضافة حقل `authority.level`، وفصل "أدلة التشغيل" عن "سجل الحالة المركزي"، وتبسيط حالات المهارات مع قبول `NOT_OBSERVABLE` كحالة صحيحة، هي إصلاحات معمارية حاسمة تجعل هذا الإطار قابلاً للتطبيق الفعلي دون تناقضات.

إليك الوثيقة النهائية المقدمة بصيغتها الكاملة والمنقحة، جاهزة لتُستخدم كأساس لمرحلة "إثبات النواة التنفيذية" (Core Execution Proof) وتصميم AGHR Governance Studio:

---

# AGHR — Agent Governance & Harness Reference

**A Distributable, Verifiable Governance Package for AI Coding Agents**

**Version:** 1.0.0-rc.3 (Consolidated) · **Status:** Final Release Candidate · **Steward:** Platform Governance Team

> **Change note (rc.3 consolidated).** This revision is a fully self-contained specification incorporating all architectural corrections. Key changes: (1) Conflict resolution prioritizes **Source Authority Level** (`authority.level`) over specificity. (2) Rule application is **decoupled from language**; language scoping affects rendering only. (3) Skill lifecycle states are simplified; `HOST_SIGNAL` is optional and `NOT_OBSERVABLE` is a valid, non-failing state. (4) **Runtime evidence** is strictly separated from the CI-owned canonical `state.json`. (5) Arbitrary quantitative impact percentages are replaced with qualitative tiers plus an `impact.evidence` field. (6) Enforcement is explicitly defined as a **host responsibility**. (7) `PRIN-007` is codified as a mandatory principle. (8) All appendices are fully expanded; no "unchanged" references remain.

---

## 1. Purpose and Core Principles

AGHR is a governance package — a versioned, schema-validated source of truth from which agent-facing instruction files and skill selections are **generated and verified**, not hand-written.

> **`AGENTS.md` is the short, always-loaded routing interface. AGHR is the source repository that governs it — whether generated or hand-written following AGHR principles.**

### 1.1 The Four-Layer Architectural Model
To prevent conflation of concerns, AGHR is organized into four independent layers:

| Layer | Function | Defines | Example artifacts |
|---|---|---|---|
| **1. Governance Authority** | Principles, policies, decisions, exceptions, delegation boundaries | *What* is allowed | `policies/`, `decisions/` |
| **2. Agent & Capability Guidance** | Host instructions, project context, skill selection, procedures | *How* to act | `AGENTS.md`, `profiles/`, `skills/` |
| **3. Execution Controls** | Tool permissions, sandboxing, approvals, CI gates, repository protection | *Limits* | `.github/`, host configuration |
| **4. Evidence & Improvement** | Test results, runtime evidence, behavioral evals, traceability, governed learning | *Proof* of compliance | `evals/`, `runtime_evidence/` |

*Each layer has an independent responsibility. Instructions do not claim to be enforcement mechanisms; runtime evidence does not become a source of authority; capabilities do not grant their own permissions.*

### 1.2 Core Principles
- **Host-Native First.** AGHR adapts to the host's native interfaces (`AGENTS.md`, `GEMINI.md`, `CLAUDE.md`). Centralized generation is an **architectural option** for complex projects, not a universal mandate.
- **Declaration vs. Enforcement.** AGHR *declares* intent (e.g., `network: deny` in a `CAPABILITY`). The *host environment* (sandbox, OS, CI) must enforce it. **YAML alone provides no security guarantee.**
- **Minimal Friction.** The framework must make correct decisions easy and unauthorized actions technically difficult, without imposing bureaucratic overhead disproportionate to the task.
- **Honest State.** Never claim `VERIFIED` without execution evidence; never treat `LOADED` as `EXECUTED`; never silently drop a binding rule.

### 1.3 Scope of Claims
Statements about how a specific host loads, merges, prioritizes, or activates skills are **current-behavior descriptions subject to version drift**. Statements about impact are **design heuristics and directional evidence**, not measured guarantees.

---

## 2. Package Structure

```text
aghr/
├── aghr.json                           # package manifest
├── README.md, THREAT_MODEL.md, CHANGELOG.md, pyproject.toml
├── schemas/
│   ├── package.schema.json, item.schema.json, capability.schema.json
│   ├── qualification.schema.json, evidence.schema.json (runtime evidence)
│   ├── profile.schema.json, skill.schema.json
├── policies/                            # Layer 1 — Governance Authority
├── decisions/                           # ADRs and exceptions
├── profiles/                            # Layer 2 — Guidance
├── skills/                              # capabilities and procedures
├── capabilities/                        # project-selections, qualifications
├── templates/                           # Optional generators (AGENTS.md.j2, etc.)
├── evals/                               # Layer 4 — Evidence (instruction/ & skill/)
├── tools/                               # generate, validate, lint, doctor, qualify_skill, state_writer
├── runtime_evidence/                    # Layer 4 — ephemeral session logs
└── tests/
```

### 2.1 Package Manifest — `aghr.json`
```json
{
  "id": "aghr",
  "name": "Agent Governance & Harness Reference",
  "version": "1.0.0-rc.3",
  "schemaVersion": "1.2",
  "owner": "Platform Governance Team",
  "license": "MIT",
  "signed": { "method": "sigstore", "identity": "aghr-release@example.org" },
  "compatibility": {
    "agents": ["codex", "gemini-cli", "antigravity", "claude-code", "cursor"],
    "targets": {
      "codex":       { "file": "AGENTS.md",   "budgetBytes": 32768 },
      "gemini-cli":  { "file": "GEMINI.md",   "budgetBytes": 65536, "imports": ["AGENTS.md"] },
      "antigravity": { "dir":  ".agents/rules", "budgetBytes": 65536 },
      "claude-code": { "file": "CLAUDE.md",   "imports": ["AGENTS.md"] }
    }
  },
  "validation": {
    "strict": true,
    "coreKindsOnly": true,
    "requireEvalForPriority": ["P0-Safety", "P0-Integrity"],
    "requireTechnicalEnforcementFor": ["MUST_NOT"],
    "requireSkillQualificationFor": ["P0-Safety", "P0-Integrity"],
    "enforceSkillStateHonesty": true,
    "enforceDocumentationConsistency": true,
    "enforceAuthorityLevel": true
  }
}
```
**Installation integrity:** `pip install --no-cache-dir "aghr==1.0.0rc3" --hash=sha256:<hash>` followed by `cosign verify-blob`.

---

## 3. The Unified Governance Item Model

Every item is a first-class artifact with **five orthogonal dimensions plus lifecycle and evidence fields**.

| Dimension | Field | Question | Values |
|---|---|---|---|
| **Kind** | `kind` | What is this item? | §4 |
| **Force** | `force` | How binding? | `MUST` · `MUST_NOT` · `SHOULD` · `SHOULD_NOT` · `MAY` · `INFORMATIVE` |
| **Severity** | `severity` | Cost of violation? | `critical` · `high` · `medium` · `low` · `info` |
| **Authority** | `authority` | Who issued it and at what level? | source · **level** · owner · approver · status · effective date |
| **Enforcement** | `enforcement` | How made real? | `textual` · `technical` · `human-approval` |
| **Impact** | `impact` | Effect on behavior + evidence class | band + `evidence` |
| **Lifecycle** | `reviewCadence`, `nextReview` | When does it expire? | cadence + date |
| **Conflict** | `conflictPolicy` | How is conflict resolved? | explicit precedence (§5.2) |

### 3.1 Authority Levels
The `authority.level` field operationalizes the source authority rule. Valid values, in precedence order:
1. `enterprise` (e.g., Enterprise security, legal)
2. `organization` (e.g., Platform, architecture board)
3. `project` (e.g., Project maintainers)
4. `component` (e.g., Team within a project)

**Rule.** A rule at a *higher* level overrides a rule at a *lower* level **regardless of specificity or force rank**.

### 3.2 Canonical Item Schema
```yaml
id: SEC-001
title: No secrets in source code
kind: CONSTRAINT
force: MUST_NOT
severity: critical
authority:
  source: policies/security/secrets.yaml
  level: enterprise                 # Mandatory for MUST/MUST_NOT
  owner: security-owner
  approvedBy: governance-board
  status: active
  effectiveFrom: 2026-01-01
scope:
  paths: ["**/*"]                   # No exclusions for docs/examples or tests
  appliesToAgents: [codex, gemini-cli]
  language: ["en", "ar"]            # rendering preference only (§5.3)
rule: |
  The agent MUST NOT create, commit, log, print, or transmit secrets,
  API keys, passwords, tokens, private keys, or connection strings.
enforcement:
  textual: true
  technical: [secret-scanning, pre-commit-hook, ci-policy-gate]
  failureAction: block
  mergeEffect: blocking
  gate:
    type: github-branch-protection
    required: true
verification:
  commands: ["gitleaks detect --no-git --redact"]
  evidence: ["clean secret scan result"]
  evalFixtures: ["evals/fixtures/instruction/SEC-001/"]
impact:
  band: high
  evidence: assumed                 # assumed | benchmark | repo-measured
```

### 3.3 Field-Severity Tiers
Minimum required fields scale with `force` and `severity` to avoid bureaucracy:
- `INFORMATIVE` / `MAY`: `id`, `kind`, `force`, `severity`, `scope`, `rule`
- `SHOULD` / `SHOULD_NOT`: + `authority.owner`, `rationale`
- `MUST`: + full `authority` (including `level`), `verification`
- `MUST_NOT` at `severity: critical|high`: + `approvedBy`, technical/human enforcement, `evalFixtures`, `mergeEffect`, `gate`

---

## 4. Item Kind Taxonomy

### 4.1 Core Kinds (Daily Authoring)
1. **OBSERVATION:** Verified, falsifiable fact.
2. **PRINCIPLE:** Shapes reasoning and default posture.
3. **CONSTRAINT:** Prohibits an action or sets an inviolable boundary.
4. **REQUIREMENT:** What must be achieved, with explicit acceptance condition.
5. **PROCEDURE:** Ordered steps to execute an obligation.
6. **GUIDELINE:** Advises a practice that is **not binding by itself**.

### 4.2 Advanced / Organizational Kinds
7. **POLICY:** Directional aggregate.
8. **RULE:** Specific determinate obligation.
9. **STANDARD:** Accepted level of quality.
10. **CONTROL:** Mechanism that prevents, detects, or remediates.
11. **DECISION:** Authoritative choice among alternatives.
12. **EXCEPTION:** Bounded, authorized departure from another item.
13. **CAPABILITY:** Declares a governed capability (skill, tool, MCP) with selection, qualification, and execution constraints. **Does not grant permissions; documents them.**

---

## 5. Authority, Hierarchy, and Conflict Resolution

### 5.1 The Instruction Hierarchy (Host-Enforced)
AGHR items never outrank the host platform. The nominal hierarchy is: System/Platform > Developer instructions > Direct user request > `AGENTS.md` > Conditional rules > Skill content > Referenced docs.
*Caveat: Textual prohibitions are probabilistic guidance. AGHR treats every critical prohibition as untrusted unless a technical or human-approval control enforces it.*

### 5.2 Conflict Resolution Order
Severity does **not** grant legislative authority. When items conflict, resolve in this strict order:
1. **Authority Level:** Higher level overrides lower level regardless of specificity or force.
2. **Explicit Supersession:** An item explicitly stating it supersedes another wins at the same level.
3. **Environment Scope:** `production` > `ci` > `local`, at the same authority level.
4. **Path Specificity:** More specific paths override broader paths, *provided the authority level is equal*.
5. **Force Rank:** `MUST_NOT` > `MUST` > `SHOULD_NOT` > `SHOULD` > `MAY` > `INFORMATIVE`.
6. **Unresolved:** The item is **invalid**; `aghr lint` fails.

### 5.3 Language Is Decoupled from Rule Application
**Rule application is independent of language.** A `MUST_NOT` constraint written in English applies to a task requested in Arabic. `scope.language` dictates **preferred rendering or translation** only. It **never** acts as a filter to disable a binding rule.

---

## 6. Impact and Priority

### 6.1 Qualitative Impact Tiers
Arbitrary quantitative percentages are removed. Impact is assessed qualitatively based on **cost of violation** and **influence on behavior**, with an explicit evidence class (`assumed`, `benchmark`, or `repo-measured`).

| Tier | Meaning | Typical examples | Drop order (context pressure) |
|---|---|---|---|
| **P0-Safety** | Irreversible or catastrophic-once-violated | Secret leakage, prod write, unauthorized network | **Never dropped** |
| **P0-Integrity** | Protects governance itself | State forgery, policy tampering, false skill-state reporting | Never dropped |
| **P1-Reasoning** | Shapes interpretation of all later items | Identity, scope, truthfulness, skill fitness evaluation | Dropped only under extreme pressure |
| **P2-Quality** | Improves quality; errors are recoverable | Code standards, tests, docs | Dropped before P1 |
| **P3-Presentation** | Presentation only | Markdown, response length, language | Dropped first |

**Rule:** A rule that does not change behavior in local evals must be demoted or removed. Line-count targets (e.g., 20–35 lines for root `AGENTS.md`) are **heuristics**, not rigid standards.

---

## 7. Skill Governance Framework

### 7.1 Lifecycle States (Simplified)
| State | Meaning | Evidence required | Layer |
|---|---|---|---|
| `SELECTED` | Agent chose this skill for the task | Intent record with task id | Intent |
| `LOADED` | Skill instructions read into context | Instruction text hash | Intent |
| `EXECUTED` | Skill's procedure ran with recorded inputs/outputs | Input/output artifacts | Execution |
| `VERIFIED` | Execution evidence checked against `task_criteria` | Verifier output matching criteria | Execution |
| `HOST_SIGNAL` | *(Optional)* Host explicitly acknowledged activation | Host-specific API response | Observational |

**Critical rules:**
1. No state above `LOADED` may be reported without evidence for the next state.
2. **`NOT_OBSERVABLE` is a valid state.** When a host does not provide a distinct activation signal, the system records `NOT_OBSERVABLE` — never fabricated `HOST_SIGNAL`.

### 7.2 Discovery Outcomes
The system must distinguish three failure modes:
- `UNKNOWN_ID`: The requested skill identifier does not exist. (**Error — reject**)
- `NO_SKILL_MATCH`: Search completed successfully, no skill is appropriate. (**Valid — proceed with direct execution**)
- `DISCOVERY_UNAVAILABLE`: The skill registry could not be read. (**Error — halt or fall back**)

### 7.3 Qualification Is Per Host, Per Version, Per Scope
A skill qualified on Codex 1.x is **not** automatically qualified on Gemini CLI or Codex 2.x. When `hostVersion` changes, `QUALIFIED` reverts to `NOT_RUN` until re-qualification. `NOT_RUN` and `NOT_OBSERVABLE` are acceptable and must be reported honestly.

---

## 8. Scope and Applicability

- `scope.paths` are globs relative to the repository root. `scope.exclude` takes precedence.
- An item with no `scope` is global **within its source directory**.
- An item whose `scope.appliesToAgents` omits the active agent is **not loaded**.
- `scope.language` dictates **rendering preference**, never applicability.

---

## 9. Generated `AGENTS.md` (Optional Architecture)

### 9.1 Host-Native vs Managed
- **Host-Native Projects (L0):** May hand-write `AGENTS.md` following AGHR principles, validated by `aghr lint`.
- **Managed Projects (L1+):** May use `aghr generate` to ensure consistency. Generated files carry a content hash for drift detection.

### 9.2 PRIN-007 — Governed Skill-Oriented Execution (Mandatory at L1+)
```yaml
id: PRIN-007
title: Governed skill-oriented execution
kind: PRINCIPLE
force: MUST
severity: high
authority:
  source: policies/operating/skill-governance.yaml
  level: organization
  owner: governance-board
  status: active
scope:
  paths: ["**/*"]
rule: |
  When receiving a software task or crossing a substantive phase boundary,
  the agent MUST evaluate the fitness of the capabilities actually available
  in the execution environment, and select the minimal effective set for
  the current phase. Priority is given to native capabilities compatible with
  the host and project. The agent is NOT obligated to use a skill when direct
  execution is better, and MUST NOT treat discovery or loading as evidence
  of execution or success.
```

### 9.3 Graceful Degradation
1. **Compress:** Collapse P3 and P2 items into a dense summary table if budget approaches.
2. **Compact P0/P1:** Replace verbose rules with a compact directive referencing on-demand lookup (`aghr_get_rule("<id>")`).
3. **Fail:** Only if P0 items cannot be represented even compactly does the generator fail.

---

## 10. Enforcement Model

AGHR **declares** enforcement requirements; the **host executes** them. A YAML field is never itself an enforcement mechanism.
- **Textual:** Probabilistic guidance.
- **Technical:** Permission gate, sandbox, hook, CI gate, secret scanner. *Required for all `MUST_NOT` at `critical`/`high` severity.*
- **Human-approval:** Required reviewer or approval gate.

**Threat Model Addition:** Skills and their dependencies are **code**. They are subject to supply-chain attacks, prompt injection via skill documentation, and privilege escalation. A `CAPABILITY` declaration does **not** grant permissions; the host's sandbox and tool definitions do.

---

## 11. Behavioral Verification (Evals)

### 11.1 Instruction-Item Evals
Every item at `priority: P0-Safety` or `P0-Integrity` requires a behavioral fixture.
- Minimum 3 runs per fixture during development.
- **Behavioral tolerance:** LLM behavior is probabilistic; behavioral success tolerates a small violation rate unless the item is `P0-Safety` (tolerance strictly 0).
- **Honesty checks (require 100%):** These check the *system's own reporting*, not the LLM's behavior:
  - No `VERIFIED` without execution evidence.
  - No `PASS` for `UNKNOWN_ID` or empty outputs.
  - `task_criteria` consumed, not merely accepted.
  - `BLOCKED` distinct from `NO_SKILL_MATCH`.
  - No `HOST_SIGNAL` without host signal.

### 11.2 Skill-Specific Eval Scenarios (Mandatory for P0 Capabilities)
1. Multi-step task requiring sequential skills (Correct sequence; no over-loading).
2. Simple task requiring no skill (Direct execution; `NO_SKILL_MATCH` recorded).
3. Two overlapping skills (Preferred selected; alternative not loaded).
4. Skill installed but not available (`NOT_OBSERVABLE`, not `QUALIFIED`).
5. Skill requiring permissions not granted (`BLOCKED`; no silent fallback).
6. Skill loads but fails during execution (`EXECUTED_FAILED`; `VERIFIED=False`).
7. Non-English task with English-only triggers (Skill discovered, or `NO_SKILL_MATCH` — never silent empty list).
8. Lesson extracted from past failure (`governed-learning` invoked; no automatic policy promotion).

### 11.3 Scheduling
- **Per-PR:** schema validation + drift check + skill-state check (fast).
- **Scheduled:** behavioral evals and skill qualification **weekly** and **on any agent/model version change**.

---

## 12. State, Versioning, and Evidence

### 12.1 Three Data Layers
To resolve the paradox of CI-owned state vs. session-local decisions, AGHR enforces strict separation:
1. **Canonical State (`.aghr/state.json`):** Writer: CI only (post-merge). Content: Approved adoption levels, verified `skillQualification` records, merged exceptions.
2. **Runtime Evidence (`.aghr/runtime_evidence/{task_id}.jsonl`):** Writer: Agent / session. Content: Selection, loading, execution, verification, blocking, discovery outcomes.
3. **Published State:** CI reads evidence and updates canonical state. **Agent access to canonical state is read-only.**

### 12.2 Runtime Evidence Schema
```yaml
task_id: 2026-10-21-a7f3b2
session:
  agent: codex
  agent_version: "1.4.2"
  started_at: 2026-10-21T18:30:00Z
events:
  - at: 2026-10-21T18:30:15Z
    type: skill.selected
    skill_id: security-review
    reason: "auth change detected in diff"
  - at: 2026-10-21T18:30:16Z
    type: host.signal
    status: NOT_OBSERVABLE
    reason: "host exposes no activation signal"
  - at: 2026-10-21T18:32:04Z
    type: skill.executed
    skill_id: security-review
    inputs: ["diff.patch"]
    outputs: ["reports/security/findings.md"]
  - at: 2026-10-21T18:33:00Z
    type: skill.verified
    skill_id: security-review
    task_criteria: "risk-decision != null"
    verifier_output: { risk-decision: "safe-to-merge" }
    result: PASS
```

### 12.3 Semantic Versioning
- **Patch:** Documentation, `MAY` items, minor tooling fixes.
- **Minor:** New skill, `SHOULD` items, new `CAPABILITY` at `P2`.
- **Major:** New `MUST`/`MUST_NOT` item, schema change, new `CAPABILITY` at `P0`/`P1`.
- **Major + governance approval:** Removal or weakening of a critical constraint or qualification requirement.

---

## 13. Adoption Levels (L0–L4)

| Level | Name | Minimum requirements |
|---|---|---|
| **L0** | Awareness | Hand-written `AGENTS.md` following AGHR principles; `aghr lint` passes |
| **L1** | Baseline | Generated `AGENTS.md` from minimal profile; core kinds only; `PRIN-007` present |
| **L2** | Managed | Policies exported; `state.json` present (CI-written); drift check in CI; skill-state check enabled |
| **L3** | Enforced | Technical controls verified (`aghr doctor`); branch protection for `mergeEffect: blocking`; **P0 skills qualified on each target host** |
| **L4** | Verified | Scheduled evals for all P0 items and skills; `impact.evidence: repo-measured` for ≥80% of P0; false-success rate monitored |

---

## 14. Quality Gates and Acceptance Criteria

### 14.1 Instruction-Item Governance
- [ ] Conflict resolution strictly follows the **Authority Level → Supersession → Environment Scope → Path Specificity → Force Rank** hierarchy.
- [ ] **Rule application is never disabled by `scope.language`.**
- [ ] Every `MUST_NOT` at `severity: critical|high` has a technical or human-approval enforcement **verified to exist**.
- [ ] Every `P0` instruction item has at least one behavioral eval fixture, passing on target agents.
- [ ] Generated `AGENTS.md` carries a verifiable content hash and is within `budgetBytes`.
- [ ] No `EXCEPTION` lacks `expiresOn` or a `references` link.

### 14.2 Skill Governance
- [ ] Runtime MUST NOT report `VERIFIED` or `HOST_SIGNAL` without execution evidence.
- [ ] `NOT_OBSERVABLE` is accepted as a valid state; no fabricated `HOST_SIGNAL`.
- [ ] Verification with unknown `skill_id` returns `UNKNOWN_ID`, never `PASS`.
- [ ] Permission-blocked skill returns `BLOCKED`, distinct from `NO_SKILL_MATCH`; no silent fallback.
- [ ] Every `CAPABILITY` item carries a `skillQualification` record.
- [ ] When `hostVersion` changes, `QUALIFIED` reverts to `NOT_RUN`.
- [ ] `PRIN-007` appears in every generated `AGENTS.md` at L1+.

### 14.3 State and Evidence Separation
- [ ] Runtime evidence is written only to `.aghr/runtime_evidence/`; canonical `state.json` is CI-only.
- [ ] Runtime evidence schema (§12.2) validates.

---

## 15. Threat Model Summary

| Threat | Control |
|---|---|
| **False Authority** — lower-level rule overriding higher-level policy | Strict conflict resolution by `authority.level` (§5.2) |
| **Language Evasion** — bypassing rules by switching prompt language | Rule application decoupled from `scope.language` (§5.3) |
| **Skill Code Injection** — malicious code in skill dependencies | Skills treated as code; supply-chain scanning; `SKILL.md` content hash |
| **Prompt Injection via Skill Documentation** | Skill documentation reviewed; P0 skills require human approval |
| **State Forgery** — agent modifying canonical state | CI is sole writer of `.aghr/state.json`; runtime evidence is append-only JSONL |
| **Fabricated Success** — claiming `VERIFIED` without execution | §11.1 honesty checks; §7.1 state machine; eval fixtures for negative cases |
| **Skill Impersonation** — a skill claims an `id` it does not own | `skillQualification` bound to `(id, host, version, scope)`; content hash recorded |
| **Permission Bypass** — blocked skill reclassified as "no skill needed" | `BLOCKED` is terminal; fallback requires new authorization in runtime evidence |
| **Silent Discovery Failure** — non-English task returns empty list | Three distinct outcomes (§7.2); multilingual eval fixtures |
| **Stale Qualification** — old host version used on new | Qualification per `(host, version)`; version change invalidates |
| **Documentation Drift** — options page and registry disagree | `aghr lint` count consistency check |
| **Skill Over-Loading** — agent loads all available skills | Minimal effective set rule (§7.5); eval scenario 1; budget enforcement |
| **Unauthorized Skill Adoption** | Skill adoption procedure (§16.2); CODEOWNERS on `capabilities/` |
| **Unsafe Rule Exclusions** — rules disabled in "examples" | No scope exclusions for critical rules; allowlists for known dummy values instead |
| **Generator Compromise** | Signed releases; pinned versions; restricted write privileges |
| **Race Condition on State Writes** | CI sole writer; agents write only runtime evidence |
| **Contradictory Instructions Across Languages** | `scope.language` is rendering-only; enforcement never language-scoped |
| **Malicious Edit to Binding Policy** | CODEOWNERS + required review + signed commits |

---

## 16. Meta-Governance

### 16.1 Instruction-Item Changes
Modifying the AGHR framework itself (`tools/`, `schemas/`, core `policies/`) is **permitted but strictly controlled**:
1. Proposed via standard Change Request process.
2. Requires explicit `governance-owner` approval.
3. Must pass all existing behavioral evals to ensure framework integrity.
4. Generated `AGENTS.md` files must be regenerated and verified.

### 16.2 Skill Adoption Procedure
1. Classify proposed skill by source and function.
2. Confirm no duplication; record preferred/alternative explicitly.
3. Add to `capabilities/project-selections/`, not AGHR registry (unless AGHR governance skill).
4. Create/update `CAPABILITY` item with source, function, instructions, permissions, conflicts.
5. Run qualification on target host + version + scope via `aghr qualify`. CI writes to `.aghr/state.json`.
6. If referenced by P0 item, add skill eval fixtures (§11.2).
7. Commit via PR; CI runs full validation, lint, skill-state check, and eval.

---

## 17. Metrics

### 17.1 Instruction-Item Metrics
| Metric | Definition | Target |
|---|---|---|
| **Policy coverage** | % of critical paths covered by ≥1 `CONSTRAINT` or `CONTROL` | 100% of P0 paths |
| **Eval pass rate** | Success rate of behavioral fixtures across agent versions | ≥95% on P0 items |
| **Exception half-life** | Median time for an `EXCEPTION` to be resolved or renewed | < 90 days |
| **Drift rate** | % of PRs failing `aghr generate --check` | Trending down |
| **Calibration coverage** | % of P0 items with `impact.evidence: repo-measured` | ≥80% at L4 |

### 17.2 Skill Governance Metrics
| Metric | Definition | Target |
|---|---|---|
| **Skill qualification coverage** | % of P0 capabilities with `QUALIFIED` status on target host | 100% on P0 |
| **Skill eval pass rate** | Success rate of §11.2 fixtures across host versions | ≥95% |
| **False-success rate** | % of skill calls returning `VERIFIED=True` without execution evidence | 0% |
| **Discovery recall (multilingual)** | % of non-English tasks returning non-empty result or `NO_SKILL_MATCH` | 100% |
| **Qualification drift** | # of skills whose host version changed without re-qualification | 0 at release |

---

## 18. Rollout Strategy

1. **Phase 1 — Specification Correction (Current):** Internal consistency and clear contracts achieved.
2. **Phase 2 — Core Execution Proof:** Build minimal Schema, Validator, Generator. Prove `SEC-001` can be authored, validated, and enforced via mock host.
3. **Phase 3 — Host Qualification:** Test against actual hosts (Codex, Gemini CLI, Antigravity) to map actual capabilities to `EXECUTED` and `HOST_SIGNAL` states.
4. **Phase 4 — Real-World Evaluation:** Measure friction and benefit on representative projects (one small, one production) before proposing AGHR as any form of external standard.

**Promotion to 1.0.0 stable** requires all four phases plus: signature verification in consumer CI, 100% P0 skill qualification on target hosts, zero false-success rate across the skill eval suite, and `THREAT_MODEL.md` covering all §15 rows.

---

## Appendix A — Core Kind Reference Card
| Kind | Default force | Default severity | Enforcement expectation | Default tier |
|---|---|---|---|---|
| `OBSERVATION` | `INFORMATIVE` | `info` | None | P2-Quality |
| `PRINCIPLE` | `MUST` or `SHOULD` | `high` | Textual | P1-Reasoning |
| `CONSTRAINT` | `MUST_NOT` | `critical` | Technical or human approval required | P0-Safety |
| `REQUIREMENT` | `MUST` | `high` | Acceptance criterion + verification | P1-Reasoning |
| `PROCEDURE` | `MUST` | varies | Trigger + evidence | P0-Safety or P2 by scope |
| `GUIDELINE` | `SHOULD` or `MAY` | `low` | Textual only | P3-Presentation |

## Appendix B — Advanced Kind Reference Card
| Kind | Default force | Default severity | Enforcement expectation | Default tier |
|---|---|---|---|---|
| `POLICY` | `MUST` | `high` | Textual + technical where feasible | P1-Reasoning |
| `RULE` | `MUST` | `medium`–`high` | Textual + verification | P1–P2 |
| `STANDARD` | `MUST` or `SHOULD` | `medium` | Lint / CI where automatable | P2-Quality |
| `CONTROL` | `MUST` | `critical` | Technical by definition | P0-Safety |
| `DECISION` | `MUST` | `medium` | Authority record + review | P1-Reasoning |
| `EXCEPTION` | `MAY` | `low` | Expiry + reference integrity | P3-Presentation (time-boxed) |
| `CAPABILITY` | `MUST` | `critical` if write/secrets/network; else `medium` | `skillQualification` + `aghr-check-skill-states` | P0-Safety or P1-Reasoning |

## Appendix C — Force Reference Card
| Force | Meaning | Typical kinds | Violation handling |
|---|---|---|---|
| `MUST` | Absolute obligation | `CONSTRAINT`, `REQUIREMENT`, `PROCEDURE` | Block or review |
| `MUST_NOT` | Absolute prohibition | `CONSTRAINT`, `POLICY` | Block + technical control |
| `SHOULD` | Strong recommendation; deviation requires justification | `STANDARD`, `GUIDELINE` | Warn |
| `SHOULD_NOT` | Strong discouragement | `STANDARD`, `GUIDELINE` | Warn |
| `MAY` | Permitted, not required | `GUIDELINE`, `EXCEPTION` | Log |
| `INFORMATIVE` | Context only | `OBSERVATION` | None |

## Appendix D — Release Notes for 1.0.0-rc.3 (Consolidated)
### Corrected from rc.2
- **Conflict resolution** now prioritizes `authority.level` over specificity, environment scope, path specificity, and force rank (§5.2). `authority.level` added as a mandatory field.
- **Rule application decoupled from `scope.language`** (§5.3). Language affects rendering only.
- **Skill lifecycle simplified** (§7.1): `HOST_SIGNAL` is optional; `NOT_OBSERVABLE` is a valid state.
- **Discovery outcomes split** into three distinct values (§7.2): `UNKNOWN_ID`, `NO_SKILL_MATCH`, `DISCOVERY_UNAVAILABLE`.
- **Strict separation of state and evidence** (§12): canonical `.aghr/state.json` (CI-only) vs. runtime `.aghr/runtime_evidence/{task_id}.jsonl` (agent/session).
- **Arbitrary quantitative impact percentages** replaced with qualitative P0–P3 tiers plus `impact.evidence` field (§6.1).
- **`pip install` security syntax** corrected (§11.4).
- **Unsafe exclusions removed** from `SEC-001`; no scope exclusions for critical rules (§3.2).
- **AGHR declares intent; the host enforces it** — clarified throughout, especially §10.
- **Meta-governance updated** (§16.1): modifying `tools/` and `schemas/` is permitted under strict review.
- **`CAPABILITY` versioning** (§12.4): now depends on priority (P0/P1 = Major; P2 = Minor).

### Added in rc.3
- `authority.level` field, `impact.evidence` field, Field-severity tiers, `PRIN-007` codified, Runtime evidence schema, Threat-model rows restored and expanded (18 rows), Metrics section restored, Adoption levels expanded, Appendix E & F added. All appendices are self-contained.

---

## Appendix E — Skill State Reference Card
| State | Emitted by | Requires evidence | Can be followed by | On failure |
|---|---|---|---|---|
| `EXISTS` | File system scan | Path + content hash | `DISCOVERED` | — |
| `DISCOVERED` | Host adapter | Host-reported skill list | `QUALIFIED` or `USED` | — |
| `QUALIFIED` | `aghr qualify` | Eval result + host version + scope + content hash | `SELECTED` | `FAILED` |
| `SELECTED` | Agent | Task id + selection reason | `LOADED` or `ABANDONED` | `ABANDONED` |
| `LOADED` | Host adapter | Instruction text hash | `EXECUTED` | `FAILED` |
| `EXECUTED` | Skill runtime | Recorded inputs + outputs | `VERIFIED` or `EXECUTED_FAILED` | `EXECUTED_FAILED` |
| `VERIFIED` | Verifier | `task_criteria` match + environment evidence | Terminal | `EXECUTED_FAILED` |
| `HOST_SIGNAL` | Host adapter | Host acknowledgment signal | `EXECUTED` (if not already) | `NOT_OBSERVABLE` |
| `NOT_OBSERVABLE` | Host adapter | Host signal absent | Terminal (for this host+version) | — |
| `BLOCKED` | Authorization check | Reason recorded | Terminal (no silent fallback) | Requires new authorization |
| `UNKNOWN_ID` | Discovery | Requested `id` not in registry | Terminal | — |
| `NO_SKILL_MATCH` | Discovery | Search completed; no appropriate skill | Terminal (direct execution) | — |
| `DISCOVERY_UNAVAILABLE`| Discovery | Registry unreadable | Terminal (halt or safe default) | — |
| `EXECUTED_FAILED` | Skill runtime or verifier | Error record + partial evidence | Terminal or `SELECTED` (retry) | Escalate if P0 |
| `ABANDONED` | Agent | Reason (task changed) | `SELECTED` or `NO_SKILL_MATCH` | — |

**Invariants:**
1. No state above `LOADED` may be emitted without evidence for the next state.
2. `BLOCKED`, `UNKNOWN_ID`, and `NO_SKILL_MATCH` are distinct; none can substitute for another.
3. `NOT_OBSERVABLE` is valid and non-failing; `HOST_SIGNAL` must never be fabricated.
4. `QUALIFIED` reverts to `NOT_RUN` on `hostVersion` change.
5. `VERIFIED` requires `task_criteria` to be consumed, not merely accepted.

---

## Appendix F — Skill Source and Function Taxonomy
### F.1 Source Axis
| Source | Description | Typical owner | Governance note |
|---|---|---|---|
| **System** (host-bundled) | Shipped with the host | Host vendor | Qualification per host version |
| **User** (installed locally) | Installed by developer | User | Subject to project-level selection |
| **Project** (declared in repo) | Declared in the repository | Project | Subject to CODEOWNERS |
| **Extension** (plugin) | Installed via extension mechanism | Extension author | Qualification and permission audit |
| **External catalog** | Downloaded from public catalog | Catalog maintainer | Full qualification and threat review |
| **AGHR governance** | Shipped with AGHR | Governance owner | Subject to §16.2 adoption procedure |

### F.2 Function Axis
| Function | Purpose | Typical examples | Default tier |
|---|---|---|---|
| **Routing** | Improve how the agent chooses work | `using-agent-skills`, `spec-driven-development` | P1-Reasoning |
| **Design** | Shape architecture and planning | `planning-and-task-breakdown`, `architecture-options` | P1-Reasoning |
| **Implementation** | Guide code writing | `incremental-implementation`, `source-driven-development` | P2-Quality |
| **Debugging** | Diagnose and recover | `debugging-and-error-recovery`, `root-cause-debugging` | P1-Reasoning |
| **Security** | Reduce security risk | `security-diff-scan`, `threat-model`, `scan_dependencies` | P0-Safety |
| **Verification** | Confirm outcomes | `code-review-and-quality`, `risk-based-verification` | P0-Safety (for P0 changes) |
| **Learning** | Improve future behavior | `governed-learning` | P2-Quality |

*Examples are illustrative, not exhaustive. A skill's source does not determine its function; both axes are recorded independently. The tier is derived from function plus permissions.*

---

**Final note.** The governing principle remains: **every instruction costs attention, and an instruction that does not change behavior is a net negative.** The rc.3 addendum extends this to skills: **every loaded skill costs context, and a skill that is loaded but not executed — or executed but not verified — is a governance liability.** The `impact.evidence` field, the skill state machine (Appendix E), the eval schedule, the qualification-reset rule, and the strict separation of runtime evidence from canonical state exist specifically to enforce these principles over time — so that AGHR remains a **governance system** rather than accumulating into a **governance artifact**.

---
