# AGHR — Agent Governance & Harness Reference

**A Distributable, Verifiable Governance Package for AI Coding Agents**

**Version:** 1.0.0-rc.2 · **Status:** Release Candidate / Design Specification · **Steward:** Platform Governance Team

> **Change note (rc.2).** This revision adds a complete **Skill Governance Framework** as a first-class domain alongside instruction-item governance. It closes the gap between "governing what the agent is told" and "governing what the agent actually executes." Additions: §7 (Skill Governance Framework), `CAPABILITY` kind (§4.2), PRIN-007 principle (§9.2), skill-specific evals (§12.3), `skillQualification` state block (§13.1), eight new acceptance criteria (§15), six new threat-model rows (§16), skill adoption procedure (§17.2), five skill metrics (§18.3), Appendix E (Skill State Reference Card), Appendix F (Skill Source and Function Taxonomy). All rc.1 content remains in force with section renumbering only.

> **Change note (rc.1).** Provider-behavior claims softened to probabilistic language; impact estimates reclassified as design heuristics with an `impact.evidence` field; benchmark figures corrected and re-sourced as directional; the 12-kind taxonomy split into 6 core and 6 advanced kinds; adoption levels L0–L4 added; `rationale`, `reviewCadence`, `conflictPolicy`, `mergeEffect`, and `gate` fields added; state-writer concurrency resolved (CI as sole writer); graceful degradation and meta-governance added; package signing and generator hardening specified.

---

## 1. Purpose and Architectural Principle

AGHR is not a collection of Markdown files. It is a **governance package** — a versioned, schema-validated source of truth from which agent-facing instruction files and skill selections are **generated and verified**, not hand-written.

> **`AGENTS.md` is the short, always-loaded routing interface. AGHR is the source repository that generates, validates, and enforces it.**

This distinction matters because `AGENTS.md` is now a cross-vendor open format stewarded by the **Agentic AI Foundation at the Linux Foundation**, and **reported** to be adopted across tens of thousands of repositories (adoption figures are self-reported by the project and sponsors, not independently enumerated; AGHR treats them as directional). The format is deliberately thin — plain Markdown, no required fields — which makes it portable but **ungoverned by itself**. AGHR supplies the governance layer the format intentionally omits.

**Scope of claims in this document.** Statements about how a specific host (Codex, Gemini CLI, Antigravity, Claude Code) loads, merges, prioritizes, or activates skills are **current-behavior descriptions subject to version drift**. Statements about impact, instruction capacity, or benchmark results are **design heuristics and directional evidence**, not measured guarantees. AGHR's governing principle is that every claim of enforcement must be **verified locally**, not assumed from a vendor document.

**Two governed domains.** AGHR governs two distinct but complementary domains: (1) **instruction items** — what the agent is told; and (2) **capability items** — what the agent is permitted and able to execute. The first is addressed by §§3–6 and §§8–19; the second by §7 and its integration across the rest of the specification.

```text
AGHR Source Package                          Project Repository
─────────────────────                        ───────────────────
policies/     binding instruction items      AGENTS.md          generated, always loaded
profiles/     project & role archetypes      .agents/rules/     conditional rules
skills/       detailed procedures + CAPABILITY items
decisions/    ADRs and exceptions            skills/            invocable skills
templates/    Jinja2 generators              docs/agents/       reference documents
schemas/      JSON Schema validation
tools/        generate / validate / lint / doctor
evals/        behavioral fixtures (instruction + skill)
state/        adoption, compliance, and qualification state
        │
        ▼  generate / validate / enforce
```

---

## 2. Package Structure

```text
aghr/
├── aghr.json
├── README.md
├── THREAT_MODEL.md
├── CHANGELOG.md
├── pyproject.toml
├── schemas/
│   ├── package.schema.json
│   ├── item.schema.json
│   ├── capability.schema.json        # NEW (rc.2)
│   ├── qualification.schema.json     # NEW (rc.2)
│   ├── profile.schema.json
│   └── skill.schema.json
├── policies/
│   ├── security/
│   ├── code/
│   └── operations/
├── decisions/
│   ├── ADR-*.yaml
│   └── exceptions/
├── profiles/
│   ├── laravel-react-mssql.yaml
│   └── python-fastapi.yaml
├── skills/
│   ├── security-review/
│   ├── release-readiness/
│   └── aghr-self-management/         # §17.2 skill adoption procedure
├── capabilities/                     # NEW (rc.2)
│   ├── project-selections/
│   └── qualifications/
├── templates/
│   ├── AGENTS.md.j2
│   ├── AGENTS.compact.md.j2
│   └── SKILL.md.j2
├── evals/
│   ├── fixtures/
│   │   ├── instruction/              # instruction-item fixtures
│   │   └── skill/                    # skill-specific fixtures (§12.3)
│   └── runner.py
├── tools/
│   ├── generate.py
│   ├── validate.py
│   ├── lint.py
│   ├── doctor.py
│   ├── check_compliance.py
│   ├── qualify_skill.py              # NEW (rc.2)
│   └── state_writer.py
└── tests/
```

### `aghr.json` — Package Manifest

```json
{
  "id": "aghr",
  "name": "Agent Governance & Harness Reference",
  "version": "1.0.0-rc.2",
  "schemaVersion": "1.1",
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
    "enforceDocumentationConsistency": true
  }
}
```

**Pin and verify the package.** Install with a locked version and integrity hash (`aghr==1.0.0-rc.2 --hash=sha256:...`); verify the sigstore/cosign signature before generation. The generator must not run with broad write privileges.

---

## 3. The Unified Governance Item Model

Every item is a first-class artifact with **five orthogonal dimensions plus three lifecycle fields**. Collapsing governance into a single `Rules` category is the most common design failure.

| Dimension | Field | Question | Values |
|---|---|---|---|
| **Kind** | `kind` | What is this item? | See §4 |
| **Force** | `force` | How binding? | `MUST` · `MUST_NOT` · `SHOULD` · `SHOULD_NOT` · `MAY` · `INFORMATIVE` |
| **Severity** | `severity` | Cost of violation? | `critical` · `high` · `medium` · `low` · `info` |
| **Authority** | `authority` | Who issued it, and is it in force? | Source · owner · approver · status · effective date |
| **Enforcement** | `enforcement` | How made real? | `textual` · `technical` · `human-approval` |
| **Impact** | `impact` | How much does it change behavior? | Band + **evidence class** (§6.1) |
| **Lifecycle** | `reviewCadence` | When does it expire? | Cadence + `nextReview` |
| **Conflict** | `conflictPolicy` | How is conflict resolved? | Explicit precedence (§5.4) |

Canonical schema:

```yaml
id: SEC-001
title: No secrets in source code
kind: CONSTRAINT
force: MUST_NOT
severity: critical
rationale: |
  Secrets committed to source control are difficult to revoke reliably and
  may be exposed through logs, package artifacts, or forked repositories.
authority:
  source: policies/security/secrets.yaml
  owner: security-owner
  approvedBy: governance-board
  status: active
  effectiveFrom: 2026-01-01
reviewCadence: annual
nextReview: 2027-01-01
scope:
  paths: ["**/*"]
  exclude: ["docs/examples/**", "**/*.test.*"]
  appliesToAgents: [codex, gemini-cli, antigravity, claude-code]
  language: ["en", "ar"]
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
  evidence: assumed
  lastCalibrated: null
conflictPolicy:
  precedence: high
  overrides: []
  overriddenBy: []
exceptions:
  allowed: false
  approval: security-owner
references:
  - docs/security/secrets-management.md
```

### 3.1 Why the dimensions must be separate

A `POLICY` may contain `CONSTRAINT`s. A `CONSTRAINT` may be enforced by a `PROCEDURE`. A `GUIDELINE` becomes binding only when a `DECISION` adopts it. Flattening these into one "rule" record loses the information needed to audit, version, and enforce them independently. The five dimensions plus lifecycle fields are what make AGHR **auditable** rather than merely descriptive.

### 3.2 Field-severity tiers (avoid governance bureaucracy)

Not every field is required for every item. **Minimum required fields scale with `force` and `severity`** — this prevents the cost of adding a simple guideline from equaling the cost of adding a critical constraint.

| Item level | Minimum required fields |
|---|---|
| `INFORMATIVE` / `MAY` | `id`, `kind`, `force`, `severity`, `scope`, `rule` |
| `SHOULD` / `SHOULD_NOT` | + `authority.owner`, `rationale` |
| `MUST` | + `authority` (full), `verification` |
| `MUST_NOT` at `severity: critical|high` | + `approvedBy`, technical or human enforcement, `evalFixtures`, `mergeEffect`, `gate` |
| Any item referencing a `CAPABILITY` | + `skillQualification` record (§7.4) |

`aghr validate --strict` enforces these tiers; `aghr lint` warns on missing optional fields.

---

## 4. Item Kind Taxonomy with Synonyms

### 4.1 Core kinds (v1 — use these in daily authoring)

| # | Kind | Synonyms | Function | Typical Location |
|---:|---|---|---|---|
| 1 | **OBSERVATION** | Fact, State Anchor, Context Note | A verified, falsifiable fact about the environment | `AGENTS.md` §Context |
| 2 | **PRINCIPLE** | Tenet, Value, Operating Principle | Shapes reasoning and default posture; not falsifiable | `AGENTS.md` §Identity |
| 3 | **CONSTRAINT** | Hard Limit, Red Line, Prohibition, Guardrail | Prohibits an action or sets an inviolable boundary | `AGENTS.md` §Hard Constraints; `policies/security/` |
| 4 | **REQUIREMENT** | Acceptance Criterion, Mandate, Spec Requirement | What must be achieved, with an explicit acceptance condition | `policies/` |
| 5 | **PROCEDURE** | Process, Step-by-Step, Playbook, Runbook | Ordered steps to execute an obligation | `skills/`, `procedures/` |
| 6 | **GUIDELINE** | Recommendation, Suggestion, Best Practice, Advisory | Advises a practice that is **not binding by itself** | `AGENTS.md` §Guidelines |

### 4.2 Advanced / organizational kinds (available in schema; not day-to-day items)

| # | Kind | Synonyms | Function | Typical Location |
|---:|---|---|---|---|
| 7 | **POLICY** | Directive, Mandate, Governance Policy | Directional aggregate that may contain lower-level items | `policies/` |
| 8 | **RULE** | Norm, Regulation, Binding Instruction | A specific determinate obligation (use only when `REQUIREMENT`/`CONSTRAINT` don't fit) | `policies/` |
| 9 | **STANDARD** | Convention, Code Standard, Normative Reference | Accepted level of quality within a declared scope | `docs/agents/`, profiles |
| 10 | **CONTROL** | Safeguard, Enforcement Mechanism, Gate | A mechanism that prevents, detects, or remediates | `enforcement.technical`, CI |
| 11 | **DECISION** | ADR, Ruling, Approved Choice | Records an authoritative choice among alternatives | `decisions/` |
| 12 | **EXCEPTION** | Waiver, Deviation, Exemption | A bounded, authorized departure from another item | `decisions/exceptions/` |
| 13 | **CAPABILITY** | Skill Reference, Tool Grant, MCP Capability | Declares a governed capability (skill, tool, MCP server) with its selection, qualification, and execution constraints | `skills/`, `capabilities/` |

**Adoption rule.** `validation.coreKindsOnly: true` restricts the daily authoring vocabulary to the **six core kinds**. Advanced kinds — including `CAPABILITY` — are permitted only in `decisions/`, `policies/`, and `capabilities/`, and are subject to governance-owner review. This prevents the common failure where a team debates "is this a `STANDARD` or a `GUIDELINE`?" instead of writing the rule.

**Note on `CAPABILITY`.** A `CAPABILITY` item is not an instruction to the agent; it is an **organizational entity** that binds a skill (or tool, or MCP server) to its governance record: source, function, qualification status, permissions, and conflict relationships. It is the bridge between instruction governance (§§3–6, 8–19) and the skill governance framework (§7).

### 4.3 What distinguishes each core kind

- **OBSERVATION vs PRINCIPLE.** An observation is falsifiable against the repository ("the package manager is `pnpm`"). A principle is not ("prefer the smallest safe change").
- **CONSTRAINT vs REQUIREMENT.** A constraint says *do not*; a requirement says *must produce or satisfy*. Both can be `MUST`-level, but only requirements carry an `acceptance` block.
- **REQUIREMENT vs GUIDELINE.** A requirement is testable and failing it blocks or routes to review. A guideline is advisory and its default `failureAction` is `log`.
- **PROCEDURE vs CONSTRAINT.** A procedure tells the agent *how to act*; a constraint tells it *what not to do*. A procedure is the natural place to link a `CONTROL`.
- **CAPABILITY vs PROCEDURE.** A procedure is a sequence of steps the agent follows; a capability is a **governed facility** the agent may invoke. A `CAPABILITY` item references one or more `PROCEDURE` items (typically the skill's own `SKILL.md`) and adds qualification, permission, and conflict metadata.

---

## 5. Authority, Hierarchy, and Priority

### 5.1 The instruction hierarchy (host-enforced, version-dependent)

AGHR items never outrank the host platform. The **nominal** hierarchy is:

```text
1. System / Platform instructions          (host)
2. Developer instructions                  (application layer)
3. Direct user request in the task         (current conversation)
4. AGENTS.md / GEMINI.md / CLAUDE.md        (project instructions)
5. Conditional rules (.agents/rules/)       (Antigravity: always_on | glob | model_decision | manual)
6. Skill content (SKILL.md)                 (loaded on demand)
7. Referenced docs, READMEs, retrieved data (untrusted context)
```

**Important caveat.** This ordering describes *intent*, not a guaranteed security boundary. **Textual prohibitions are probabilistic guidance.** Their override behavior varies by host, model, configuration, and prompt context. The OpenAI instruction-hierarchy work reports that hierarchy training reduces — but does not eliminate — prompt-injection success. Google documents that `AGENTS.md` is loaded as system instructions in *Managed Agents* environments, but this does not establish that every Gemini surface behaves identically or that text becomes an absolute barrier. **AGHR therefore treats every critical prohibition as untrusted unless a technical or human-approval control enforces it.**

### 5.2 `AGENTS.md` discovery and merge (current behavior, subject to change)

- **Codex (reported):** builds an instruction chain once per run. Project scope walks from Git root **down to the working directory**, concatenating `AGENTS.override.md` → `AGENTS.md` → configured fallbacks, at most one file per directory. Files closer to the working file appear later and therefore override earlier guidance. Combined size is capped at `project_doc_max_bytes` (32 KiB by default); content past the cap is dropped.
- **Gemini CLI / Antigravity (reported):** walks up from the working directory, collects all `AGENTS.md` files, processes root → leaf; closer files take precedence on conflict. Rules are **cumulative**. Antigravity additionally supports `.agents/rules/` with a required `trigger` frontmatter key: `always_on`, `glob`, `model_decision`, or `manual`.
- **Claude Code (recommended pattern):** reads `CLAUDE.md`; cross-vendor pattern is a thin `CLAUDE.md` whose first line is `@AGENTS.md`, preserving a single source of truth.

**AGHR does not rely on these behaviors for enforcement.** `aghr doctor` verifies the effective load order in a target repository and reports discrepancies; `aghr eval` measures actual compliance.

### 5.3 Authority fields

| Field | Required | Purpose |
|---|---|---|
| `authority.source` | yes | File or decision record that originated the item |
| `authority.owner` | yes (≥`SHOULD`) | Accountable role |
| `authority.approvedBy` | `MUST`/`MUST_NOT` | Approving body |
| `authority.status` | yes | `draft` · `active` · `deprecated` · `superseded` |
| `authority.effectiveFrom` | yes | Date the item becomes binding |
| `authority.supersedes` | conditional | Prior `id` this item replaces |

### 5.4 Conflict resolution (explicit)

Every item carries an explicit `conflictPolicy`. Resolution order:

1. `conflictPolicy.precedence` (numeric or named tier) — explicit beats implicit.
2. `force` rank: `MUST_NOT` > `MUST` > `SHOULD_NOT` > `SHOULD` > `MAY` > `INFORMATIVE`.
3. `severity` rank at equal `force`.
4. More specific `scope.paths` wins over broader.
5. Closer `AGENTS.md` in the directory hierarchy (host behavior).
6. Unresolved → item is **invalid**; `aghr lint` fails.

`conflictPolicy.overrides` and `.overriddenBy` make cross-item relationships auditable rather than implicit. Skill conflicts (§7.5) follow the same precedence rules applied to `CAPABILITY` items.

---

## 6. Impact, Authority Weight, and Priority

### 6.1 Impact is a **design heuristic**, not a measurement

The bands below are **engineering estimates** derived from prompt-engineering literature and agent-configuration practice. Neither OpenAI nor Google publishes per-item impact weights. The ETH Zurich “Evaluating AGENTS.md” study (February 2026, 138 benchmark instances) provides **directional evidence** that *large, LLM-generated context files can reduce task success and materially increase inference cost, while concise developer-written context may provide a small improvement*. Reported magnitudes: developer-written files ≈ **+2.4%** average (not statistically strong); LLM-generated files ≈ **−0.5%** on SWE-bench and ≈ **−2%** on CTXBENCH; inference cost ≈ **+20–23%** for generated files. These are treated as **directional**, not universal, and must be recalibrated per repository via `evals/`.

Regarding instruction capacity: **instruction adherence degrades as instruction count, conflict density, and context length increase.** AGHR does **not** assume a universal instruction budget (e.g., “150–200 instructions”); it measures adherence with agent- and repository-specific evals.

Each item’s `impact` block records its evidence class:

```yaml
impact:
  band: high
  evidence: assumed | benchmark | repo-measured
  lastCalibrated: null | 2026-11-01
  measuredDelta: null | 0.18
```

- `assumed` — heuristic default; not measured.
- `benchmark` — drawn from published research; not local.
- `repo-measured` — calibrated by local evals; only this class may inform priority demotion.

**A rule that does not change behavior in local evals must be demoted or removed.** This is the operational implication of the minimalism evidence.

### 6.2 Impact bands by item category

| # | Category | Representative Kinds | Impact Band | Authority Weight | Priority Tier |
|---:|---|---|---|---|---|
| 1 | **Hard Constraints & Safety** | `CONSTRAINT`, `POLICY` | 20–25% | Highest (host-backed) | **P0-Safety** |
| 2 | **Identity & Role** | `PRINCIPLE`, `OBSERVATION` | 15–20% | High | P1-Reasoning |
| 3 | **Goals & Scope** | `POLICY`, `REQUIREMENT` | 10–15% | High | P1-Reasoning |
| 4 | **Truth & Uncertainty** | `PRINCIPLE`, `STANDARD` | 10–15% | High | P1-Reasoning |
| 5 | **Project Context & Architecture** | `OBSERVATION`, `STANDARD` | 10–15% | Medium | P2-Quality |
| 6 | **Workflow & Planning** | `PROCEDURE` | 8–12% | Medium | P2-Quality |
| 7 | **Tools, MCP & Permissions** | `PROCEDURE`, `CONTROL`, `CAPABILITY` | 8–12% | Medium–High | **P0-Safety** if tools are powerful; else P2 |
| 8 | **Code & Testing Standards** | `STANDARD`, `REQUIREMENT` | 5–10% | Medium | P2-Quality |
| 9 | **Security & Operations** | `CONSTRAINT`, `CONTROL` | 5–10% | Highest in production | **P0-Safety** (production) |
| 10 | **Skill Selection & Qualification** | `CAPABILITY`, `PRINCIPLE` | 5–10% | High (host-bound) | P1-Reasoning (P0 if unqualified skill grants writes) |
| 11 | **Formatting & Communication** | `GUIDELINE` | 2–5% | Low | P3-Presentation |

**Reading the bands.** Impact is *marginal influence on correct behavior*, not *topical importance*. Security is P0-Safety because a single violation is catastrophic, even though its marginal influence on routine tasks is lower than identity and hard constraints.

### 6.3 Priority tiers (P0 split into Safety and Integrity)

| Tier | Meaning | Examples | Drop order |
|---|---|---|---|
| **P0-Safety** | Irreversible or catastrophic-once-violated | secret leakage, data deletion, production write, unauthorized network, **unqualified skill granting write access** | **Never dropped** |
| **P0-Integrity** | Protects the integrity of governance itself | state forgery, policy tampering, approval bypass, generator compromise, **false skill-state reporting** | Never dropped |
| **P1-Reasoning** | Shapes interpretation of all later items | identity, scope, truthfulness, no invention, **skill fitness evaluation** | Dropped only under extreme pressure |
| **P2-Quality** | Improves quality; errors are recoverable | code standards, tests, docs | Dropped before P1 |
| **P3-Presentation** | Presentation only | Markdown, response length, language | Dropped first |

When the context budget is exceeded, the generator **must** drop P3, then P2. It **must fail** rather than silently drop any P0. See §10.2 for graceful-degradation policy that avoids hard failure where possible.

---

## 7. Skill Governance Framework

Governance of instruction items is necessary but not sufficient. Agents also execute **capabilities** (skills, tools, MCP servers, procedures) whose selection, loading, and execution are themselves governed. AGHR treats skill governance as a first-class domain, not an implementation detail.

### 7.1 Three levels of capability (must not be conflated)

| Level | Function | Examples | Governance owner |
|---|---|---|---|
| **Native agent skills** | Improve *how* work is done | `using-agent-skills`, `spec-driven-development`, `debugging-and-error-recovery` | Host / user installation |
| **Specialized skills** | Solve a specific technical domain or problem | `security-diff-scan`, `browser-testing-with-devtools`, `langfuse` | Project or user installation |
| **AGHR governance skills** | Ensure capability use is appropriate and governed | `agent-tool-security`, `risk-based-verification`, `governed-learning` | AGHR package |

These levels are **complementary, not competing**. An agent may use `debugging-and-error-recovery` while complying with an AGHR procedure that requires proof of root cause — without loading both skills in full if a single skill plus a short governing procedure achieves the goal.

**Source vs function are separate axes.** A skill's *source* (system / user / project / extension / external catalog / AGHR) does not determine its *function* (routing / design / implementation / security / verification / learning). A user-installed skill may serve a design function; a system-bundled skill may serve routing. AGHR records both axes independently (Appendix F).

### 7.2 Four states of skill presence (must be tracked separately)

| State | Meaning | Evidence required |
|---|---|---|
| `EXISTS` | Skill files are present on disk | File path + content hash |
| `DISCOVERED` | Host has enumerated the skill for this session | Host-reported skill list |
| `QUALIFIED` | Skill has passed host-specific qualification for the current host + version + scope | Qualification record (§7.4) |
| `USED` | Skill was actually invoked with a verified outcome | Execution evidence (§7.3) |

**Existence on disk proves nothing beyond `EXISTS`.** Discovery, qualification, and use must each be independently evidenced. A skill that is `DISCOVERED` but not `QUALIFIED` MUST NOT be selected for any task whose priority is `P0-Safety` or `P0-Integrity`.

### 7.3 Five lifecycle states (honesty is mandatory)

The AGHR 1.2.0 runtime conflates these states. AGHR 1.0.0-rc.2 mandates their strict separation:

| State | Meaning | What it proves | Required evidence |
|---|---|---|---|
| `SELECTED` | The agent has chosen this skill for the current task | Intent only | Selection record with task id |
| `LOADED` | The skill's instructions have been read into context | Instructions available | Instruction text hash |
| `HOST_ACTIVATED` | The host has confirmed the skill is active for this session | Host acknowledgment | Host-reported activation signal |
| `EXECUTED` | The skill's procedure has run with recorded inputs and outputs | Action occurred | Input/output record |
| `VERIFIED` | Execution evidence has been checked against `task_criteria` | Outcome is real | Criteria match + environment evidence |

**Critical rule.** Returning `SKILL_ACTIVATED` or `verified=True` upon `LOADED` is a **governance defect**, not a shortcut. The runtime MUST NOT report any state above `LOADED` without the corresponding evidence for the next state. `aghr validate --strict` and the eval suite enforce this. The full state machine — including terminal states `BLOCKED`, `UNKNOWN_SKILL`, `NOT_OBSERVABLE`, `EXECUTED_FAILED`, and `ABANDONED` — is defined in Appendix E.

**Distinction between "not needed" and "blocked".** A skill that is not needed for the task returns `NO_SKILL_NEEDED`. A skill that is needed but cannot be used because permissions are insufficient returns `BLOCKED` with a recorded reason. `BLOCKED` is a terminal state: the agent MUST NOT fall back to direct execution without a new authorization check recorded in `.aghr/state.json`.

### 7.4 Qualification is per host, per version, per scope

A skill qualified on Codex 1.x is **not** automatically qualified on Gemini CLI, nor on Codex 2.x, nor for a different project scope. The qualification record must carry:

```yaml
skillQualification:
  skillId: security-review
  host: codex
  hostVersion: "1.4.2"
  scope: "services/payments/**"
  status: QUALIFIED | NOT_RUN | NOT_OBSERVABLE | UNKNOWN | FAILED
  qualifiedAt: 2026-10-20
  contentHash: "sha256:..."
  evidence: ["evals/results/security-review-codex-1.4.2.json"]
```

`NOT_RUN` and `NOT_OBSERVABLE` are **acceptable** and must be reported honestly. `UNKNOWN` is acceptable only when the host provides no sufficient signal; it MUST NOT be treated as `QUALIFIED`. When `hostVersion` changes, `QUALIFIED` automatically reverts to `NOT_RUN` until re-qualification is performed.

### 7.5 Project-level and task-level selection

Skill selection operates at two distinct granularities:

- **Project-level selection** (lightweight config, not a competing registry): the skills appropriate to the project's technologies, data, and risks, plus preferred alternatives and known conflicts. This is a *view* over existing governance, not a new source of truth.
- **Task-level selection** (per phase): the **minimal effective set** for the current phase, with re-evaluation when the task crosses a substantive phase boundary (design → implementation → verification).

**Rule.** The agent is obligated to *evaluate* skill fitness at task start and at substantive phase transitions. It is **not** obligated to *use* a skill. Direct execution is preferred when it is clearly better, provided the action remains authorized and its controls are satisfied.

**Conflict rule.** When two skills serve the same function, the project-level selection records the preferred skill and the alternative. At task time, only the preferred skill is loaded. If the alternative is required (e.g., preferred skill unavailable), the selection change is recorded, not silently substituted.

**No fixed per-task skill limit.** The selection is bounded by the **minimal effective set for the current phase**, not by a fixed count for the whole task. A multi-phase task may use different skills per phase; a single-phase task may use none.

### 7.6 Role distribution (host, AGHR, project, agent)

| Role | Responsibility |
|---|---|
| **Host** (Codex, Gemini CLI, Antigravity, Claude Code) | Discover available skills, load them, execute their tools per its actual capabilities |
| **AGHR** | Govern relevance, authorization, conflict, trust, traceability, and verification |
| **Project** | Declare requirements, technologies, risks, preferred capabilities |
| **Agent** | Make the operational decision and select skills per phase |

AGHR **must not** build a parallel discovery engine that duplicates host capabilities. The runtime calls host adapters where available and records their reports. Where a host exposes no skill-activation signal, the runtime records `NOT_OBSERVABLE` rather than guessing.

### 7.7 Multilingual and intent-based discovery

Discovery based solely on English keyword triggers is insufficient. The runtime must support:

- Task text in any language declared in `scope.language`.
- **Intent classification** (design / implement / debug / review / verify / learn) as a first-class selector, not only keyword match.
- **Explicit `UNKNOWN_SKILL` rejection** rather than silent omission. A non-English task that yields no match MUST return `UNKNOWN_SKILL` with the task language recorded, never an empty list.

Multilingual coverage is a **P1 requirement** for any project whose `scope.language` includes non-English languages, because silent discovery failure is indistinguishable from "no skill needed" and defeats the governance model.

### 7.8 The governing principle: PRIN-007

The skill governance framework is anchored by a mandatory principle that must appear in every generated `AGENTS.md`:

> **Governed skill-oriented execution.** When receiving a software task or crossing a substantive phase boundary, the agent MUST evaluate the fitness of the capabilities actually available in the execution environment, and select the minimal effective set for the current phase. Priority is given to native capabilities compatible with the host and project. Repetition, conflict, and authorization bypass MUST be prevented. The agent is NOT obligated to use a skill when direct execution is better, and MUST NOT treat discovery or loading as evidence of execution or success. Adoption of new skills, modification of governing instructions, and promotion of lessons into persistent memory remain subject to the approved authority and procedure.

The full item definition appears in §9.2.

---

## 8. Scope and Applicability

### 8.1 Scope dimensions

| Dimension | Field | Example |
|---|---|---|
| **Path** | `scope.paths` / `scope.exclude` | `services/payments/**`, excluding `**/*.test.*` |
| **Agent** | `scope.appliesToAgents` | `[codex, gemini-cli]` |
| **Environment** | `scope.environments` | `[local, ci]`, never `production` |
| **Lifecycle stage** | `scope.stages` | `[implementation, review]` |
| **Task type** | `scope.taskTypes` | `[migration, security-review]` |
| **Language** | `scope.language` | `["en", "ar", "es"]` |
| **Skill** | `scope.skillIds` | `[security-review, release-readiness]` (for `CAPABILITY` items) |

### 8.2 Applicability semantics

- `scope.paths` are **globs relative to the repository root**; the matcher must document symlink, nested-repository, and monorepo behavior explicitly.
- An item with no `scope` is **global within its source directory**, inheriting directory hierarchy — not the whole repository.
- `scope.exclude` takes precedence over `scope.paths`.
- An item whose `scope.appliesToAgents` omits the active agent is **not loaded at all** — not merely de-prioritized.
- An item whose `scope.language` omits the active agent language is **not loaded**, preventing contradictory instructions across languages in multilingual repositories.
- A `CAPABILITY` item whose `scope.skillIds` omits the currently requested skill is **not loaded**, and the skill is reported as `UNKNOWN_SKILL` if invoked.

### 8.3 Progressive disclosure as the scope strategy

The root `AGENTS.md` targets **20–35 lines** (≈ **2–4 KiB**); subdirectory files target **5–15 lines**; domain documents stay under **200 lines**; skills under **500 lines**. No more than **five P0 items** appear in the root file unless justified by a documented exception. Every line moved out of the root saves attention budget on every task.

Skill instructions follow the same rule: only the `SKILL.md` of a **selected** skill is loaded; unselected skills contribute only their name and one-line description to the discovery index.

---

## 9. Writing Examples

### 9.1 A `CONSTRAINT` (P0-Safety, host-enforced)

```yaml
id: SEC-001
title: No secrets in source code
kind: CONSTRAINT
force: MUST_NOT
severity: critical
rationale: |
  Secrets committed to source control are difficult to revoke reliably and
  may be exposed through logs, package artifacts, or forked repositories.
authority:
  source: policies/security/secrets.yaml
  owner: security-owner
  approvedBy: governance-board
  status: active
  effectiveFrom: 2026-01-01
reviewCadence: annual
nextReview: 2027-01-01
scope:
  paths: ["**/*"]
  exclude: ["docs/examples/**"]
rule: |
  The agent MUST NOT create, commit, log, print, or transmit secrets,
  API keys, passwords, tokens, private keys, or connection strings.
enforcement:
  textual: true
  technical: [gitleaks, pre-commit-hook, ci-policy-gate]
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
  evidence: assumed
  lastCalibrated: null
exceptions:
  allowed: false
```

**Why this phrasing works.** The `rule` uses `MUST NOT` with an exhaustive verb list; `enforcement.technical` names three independent controls so the textual prohibition is never the only barrier; `mergeEffect: blocking` + `gate` make the merge-prevention explicit rather than implied; `verification.commands` makes compliance executable.

### 9.2 PRIN-007 — Governed skill-oriented execution (P1-Reasoning, mandatory)

```yaml
id: PRIN-007
title: Governed skill-oriented execution
kind: PRINCIPLE
force: MUST
severity: high
rationale: |
  Loading a skill is not executing it, and executing it is not proving it
  helped. Governance must distinguish these states or it reports false success.
authority:
  source: policies/operating/skill-governance.yaml
  owner: governance-board
  approvedBy: governance-board
  status: active
  effectiveFrom: 2026-10-01
scope:
  paths: ["**/*"]
  appliesToAgents: [codex, gemini-cli, antigravity, claude-code]
rule: |
  When receiving a software task or crossing a substantive phase boundary,
  the agent MUST evaluate the fitness of the capabilities actually available
  in the execution environment, and select the minimal effective set for the
  current phase. Priority is given to native capabilities compatible with
  the host and project. Repetition, conflict, and authorization bypass MUST
  be prevented. The agent is NOT obligated to use a skill when direct
  execution is better, and MUST NOT treat discovery or loading as evidence
  of execution or success. Adoption of new skills, modification of governing
  instructions, and promotion of lessons into persistent memory remain
  subject to the approved authority and procedure.
enforcement:
  textual: true
  technical: [aghr-check-skill-states]
  failureAction: warn
verification:
  evalFixtures: ["evals/fixtures/instruction/PRIN-007/"]
impact:
  band: high
  evidence: assumed
  lastCalibrated: null
```

**Why this is a `PRINCIPLE` and not a `CONSTRAINT`.** The rule does not prohibit a specific action; it shapes how the agent reasons about skill selection across every task. Its failure action is `warn` because a single missed evaluation is recoverable; repeated misses are caught by the eval suite, not by a hard block.

### 9.3 A `REQUIREMENT` with an acceptance criterion

```yaml
id: REQ-TEST-002
title: Behavior changes require test updates
kind: REQUIREMENT
force: MUST
severity: high
rationale: |
  Undetected regressions in changed behavior are the most common source of
  post-merge incidents in this repository.
scope:
  paths: ["src/**", "services/**"]
  exclude: ["**/*.md"]
rule: |
  Any change that alters observable behavior MUST include a corresponding
  test update or a documented justification for why no test is applicable.
acceptance:
  - "new or modified test exists for the changed behavior"
  - "test fails before the change and passes after"
enforcement:
  textual: true
  technical: [ci-test-gate]
  failureAction: review
  mergeEffect: blocking
  gate:
    type: required-check
    name: tests
verification:
  commands: ["pnpm test -- --coverage"]
  evidence: ["coverage delta report"]
impact:
  band: medium
  evidence: assumed
  lastCalibrated: null
```

The `acceptance` block is what distinguishes a requirement from a constraint. It is testable; `failureAction: review` routes the decision to a human rather than silently blocking.

### 9.4 A `PROCEDURE` (skill-scoped, P0-Safety)

```yaml
id: PROC-SECREV-001
title: Security review before merge
kind: PROCEDURE
force: MUST
severity: critical
rationale: |
  Authentication, payment, and configuration changes carry the highest
  risk of privilege escalation and data exposure.
scope:
  paths: ["**/auth/**", "**/payments/**", "**/*.env*"]
  stages: [review]
rule: |
  For changes touching authentication, authorization, payment handling, or
  environment configuration, execute the security-review skill before merge.
enforcement:
  textual: true
  technical: [required-skill-gate]
  failureAction: block
  mergeEffect: blocking
  gate:
    type: github-branch-protection
    required: true
verification:
  commands: ["aghr check --skill security-review --changed-files"]
  evidence: ["security-findings.md"]
impact:
  band: high
  evidence: assumed
  lastCalibrated: null
```

The `scope.paths` binding is a direct application of progressive disclosure at the procedure level: the skill is loaded only when the change touches the declared paths.

### 9.5 A `CAPABILITY` item binding a skill to its governance record

```yaml
id: CAP-SECREV-001
title: Security review capability
kind: CAPABILITY
force: MUST
severity: critical
rationale: |
  The security-review skill is P0 because its failure mode is undetected
  privilege escalation. It must be qualified on each host before use.
authority:
  source: capabilities/project-selections/security-review.yaml
  owner: security-owner
  approvedBy: governance-board
  status: active
  effectiveFrom: 2026-10-01
scope:
  paths: ["**/auth/**", "**/payments/**", "**/*.env*"]
  appliesToAgents: [codex, gemini-cli, antigravity]
  skillIds: [security-review]
capability:
  skillId: security-review
  source: project
  function: security
  instructions: skills/security-review/SKILL.md
  inputs: [changed_files, diff]
  outputs: [security-findings.md, risk-decision]
  requiredApprovals: [security-owner]
  permissions:
    read: ["**/*"]
    write: ["reports/security/**"]
    network: deny
    secrets: deny
  conflictsWith: []
  alternatives: [security-diff-scan]
qualification:
  requiredOn: [codex, gemini-cli, antigravity]
  minimumStatus: QUALIFIED
  maxAgeDays: 90
enforcement:
  textual: true
  technical: [required-skill-gate, aghr-check-skill-states]
  failureAction: block
verification:
  commands: ["aghr check --skill security-review --changed-files"]
  evalFixtures: ["evals/fixtures/skill/CAP-SECREV-001/"]
impact:
  band: high
  evidence: assumed
  lastCalibrated: null
```

**Why this is a `CAPABILITY` and not a `PROCEDURE`.** The `PROCEDURE` (§9.4) tells the agent *when* to run the security review. The `CAPABILITY` tells the governance system *what the skill is*, *what it may touch*, *what qualifies it*, and *what happens when it is unavailable*. The two items reference each other; neither duplicates the other.

### 9.6 A `DECISION` and an `EXCEPTION`

```yaml
# decisions/ADR-007-postgres-over-mysql.yaml
id: ADR-007
title: Adopt PostgreSQL for new services
kind: DECISION
force: MUST
severity: medium
authority:
  owner: architecture-board
  approvedBy: cto
  status: active
  effectiveFrom: 2026-03-01
scope:
  paths: ["services/**"]
rule: |
  New services MUST use PostgreSQL. Existing MySQL services are out of scope
  until a scheduled migration decision supersedes this one.
reviewCadence: annual
nextReview: 2027-03-01
```

```yaml
# decisions/exceptions/EXC-012.yaml
id: EXC-012
title: Temporary exception to ADR-007 for legacy billing
kind: EXCEPTION
force: MAY
severity: low
authority:
  owner: architecture-board
  approvedBy: cto
  status: active
  effectiveFrom: 2026-04-01
  expiresOn: 2026-10-01
scope:
  paths: ["services/billing/**"]
rule: |
  The billing service MAY continue using MySQL until 2026-10-01. This
  exception supersedes ADR-007 for this path only and MUST NOT be extended
  without a new decision record.
exceptions:
  allowed: false
references: ["decisions/ADR-007-postgres-over-mysql.yaml"]
```

**An exception must reference the item it departs from and must carry an `expiresOn` date.** `aghr lint` fails any exception without both. Exception half-life is tracked as a governance metric (§18.3).

### 9.7 A `GUIDELINE` (P3-Presentation, non-binding)

```yaml
id: GUIDE-004
title: Prefer existing utilities over new dependencies
kind: GUIDELINE
force: SHOULD
severity: low
rationale: |
  Every added dependency increases supply-chain surface and maintenance load.
scope:
  paths: ["src/**"]
rule: |
  When a suitable utility already exists in the repository or in an already
  declared dependency, prefer it over adding a new dependency. This is
  advisory; it does not override a requirement or constraint.
enforcement:
  textual: true
  failureAction: log
impact:
  band: low
  evidence: assumed
  lastCalibrated: null
```

The explicit self-description as advisory is deliberate: a guideline silently treated as binding inflates effective instruction budget without adding authority.

---

## 10. Generated `AGENTS.md` Template and Graceful Degradation

### 10.1 Full template

```markdown
# AGENTS.md

<!-- Generated by AGHR {{ version }} | sha256: {{ content_hash }} -->
<!-- Do not edit manually. Run `aghr generate` instead. -->

## Identity
You are a senior software engineering agent working in this repository.
Be direct, evidence-based, and minimal in change scope.

## Source of Truth
- Package state: .aghr/state.json
- Governance charter: docs/agents/CHARTER.md
- Security rules: docs/agents/security.md

## Hard Constraints
{% for item in items if item.priority in ["P0-Safety","P0-Integrity"] %}
- {{ item.force }}: {{ item.title }}
  {{ item.rule | indent(2) }}
{% endfor %}

## Operating Principles
- Read only the files required for the task.
- Prefer the smallest safe change.
- Separate verified facts from assumptions; do not invent identifiers.
- Ask for approval before ambiguous or irreversible actions.
- Evaluate available capabilities before acting; select the minimal
  effective set for the current phase. Do not treat loading a skill as
  evidence of executing it.

## Skill Governance
- Select skills only after confirming their qualification on this host
  and version. Unqualified skills MUST NOT be used for P0 tasks.
- Direct execution is preferred when it is clearly better; record the
  reason in the task log.
- Never report a skill as executed or verified without execution evidence.

## Routing Table
| Need | Reference |
|---|---|
| Security change | docs/agents/security.md |
| Architecture change | docs/agents/architecture.md |
| Release or deployment | docs/agents/release.md |
| Incident response | skills/incident-response/SKILL.md |
| Governance change | skills/aghr-self-management/SKILL.md |

## Verification
```bash
aghr validate --profile {{ profile }}
aghr check --skill-states
{{ test_command }}
{{ lint_command }}
```

## Assurance Limits
A passing local test does not imply production readiness, security approval,
or deployment authorization. A loaded skill is not an executed skill.
```

### 10.2 Graceful degradation (context budget fallback)

A hard fail on budget overflow disrupts the workflow. The generator implements a **staged fallback**:

1. **Compress.** If output approaches `targets[agent].budgetBytes`, collapse P3 and P2 items into a dense summary table.
2. **Compact P0/P1.** If still over budget, replace verbose P0/P1 rules with a compact directive referencing an on-demand lookup:

   ```markdown
   ## Hard Constraints (compact)
   - For any change touching secrets, auth, payments, or production,
     invoke `aghr_get_rule("<id>")` before acting.
   - Do not proceed if the lookup fails.
   - For skill selection, invoke `aghr_get_skill("<id>")` and verify
     qualification on this host before use.
   ```

3. **Fail.** Only if P0 items cannot be represented even compactly does the generator fail — and the failure message names the specific P0 items that overflowed.

The compact template is `templates/AGENTS.compact.md.j2`. Both templates are subject to the hash-based drift check (§13.3).

**Meta-governance pointer.** The root file must direct the agent to the `aghr-self-management` skill for any change to AGHR policies, schemas, or tooling. See §17.

---

## 11. Enforcement Model

Textual instruction alone is insufficient. AGHR requires three enforcement layers per item, and makes merge impact explicit.

| Layer | Mechanism | Guarantee |
|---|---|---|
| **Textual** | Item present in `AGENTS.md` or a loaded rule | Probabilistic guidance |
| **Technical** | Permission gate, sandbox, hook, CI gate, secret scanner, skill-state check | Deterministic prevention or detection |
| **Human approval** | Required reviewer or approval gate | Blocks until an accountable human acts |

**Rules:**

1. Every item with `force: MUST_NOT` and `severity: critical|high` **must** declare at least one technical or human-approval enforcement. `aghr validate --strict` fails otherwise.
2. `failureAction: block` means **the command exits non-zero**. It does not prevent a merge.
3. `mergeEffect` and `gate` make merge-prevention explicit:
   - `mergeEffect: blocking` + `gate.type: github-branch-protection` + `gate.required: true` → merge is blocked when the check fails.
   - `mergeEffect: advisory` → the check runs and reports, but merge proceeds.
   - `mergeEffect: none` → the item has no CI hook at all.
4. `aghr doctor` verifies that each declared `gate` actually exists in the repository’s branch protection or required-check configuration.
5. Any `CAPABILITY` item at `P0-Safety` or `P0-Integrity` must declare `aghr-check-skill-states` in `enforcement.technical`; a skill that has not been qualified on the target host cannot be used.

### 11.1 CI governance gate

```yaml
name: AGHR Governance Gate
on: [pull_request]
jobs:
  governance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -e ./aghr==1.0.0-rc.2 --require-hashes
      - run: cosign verify-blob --signature dist/aghr.sig dist/aghr-1.0.0-rc.2.tar.gz
      - run: aghr validate --strict
      - run: aghr generate --check          # drift detection
      - run: aghr check --changed-files "$(git diff --name-only origin/main...HEAD)"
      - run: aghr check --skill-states       # NEW (rc.2): verify qualification and state honesty
      - run: gitleaks detect --no-git --redact
  # scheduled separately (see §12.2):
  #   aghr eval --priority P0-Safety,P0-Integrity
  #   aghr qualify --all-p0-skills
```

Schema validation, drift detection, and skill-state checks run on every PR (fast). Behavioral evals and skill qualification run on a schedule or on agent/model version changes (see §12.2), not on every PR.

---

## 12. Behavioral Verification (Evals)

Schema validation confirms that an item is well-formed; it does **not** confirm the agent complies. AGHR requires a behavioral fixture for every item at `priority: P0-Safety` or `P0-Integrity`.

```text
evals/
├── fixtures/
│   ├── instruction/                    # instruction-item fixtures
│   │   └── SEC-001/
│   │       ├── task.md
│   │       ├── repo/
│   │       └── expected.json
│   └── skill/                          # skill-specific fixtures (§12.3)
│       └── CAP-SECREV-001/
│           ├── scenarios/
│           │   ├── 01-sequential-skills/
│           │   ├── 02-no-skill-needed/
│           │   └── ...
│           └── expected.json
└── runner.py
```

Instruction fixture schema:

```json
{
  "itemId": "SEC-001",
  "priority": "P0-Safety",
  "runs": 3,
  "expected": { "violationDetected": true, "failureAction": "block" },
  "tolerance": { "maxViolationRate": 0.0 }
}
```

### 12.1 Running rules

- **Minimum 3 runs per fixture during development** (5+ for release acceptance).
- **Pass means:** the fixture detects the violation on every run at the declared tolerance.
- **Calibration:** after a fixture stabilizes, its `impact.evidence` may be set to `repo-measured` with `lastCalibrated` and `measuredDelta`.

### 12.2 Scheduling

- **Per-PR:** schema validation + drift check + skill-state check only (fast, deterministic).
- **Scheduled:** behavioral evals and skill qualification run **weekly** and **on any agent/model version change**. A failed scheduled eval files an issue and, for P0 items, blocks further deploys until resolved.
- **Explicit run:** `aghr eval --priority P0-Safety,P0-Integrity` on demand.

The distinction between "fast schema check on every PR" and "slower behavioral eval on a schedule" is what makes evals sustainable rather than a bottleneck.

### 12.3 Skill-specific eval scenarios (mandatory)

The general eval requirement is necessary but insufficient for skill governance. The following scenarios are **mandatory** for any skill declared in `skills/` or referenced in a `CAPABILITY` item at `P0-Safety` or `P0-Integrity`:

| # | Scenario | Expected behavior |
|---:|---|---|
| 1 | Multi-step task requiring sequential skills | Correct skill sequence; no over-loading; each phase uses the minimal effective set |
| 2 | Simple task requiring no skill | Direct execution; no skill loaded; reason recorded in task log |
| 3 | Two overlapping skills with the same function | Preferred skill selected; alternative not loaded; conflict recorded |
| 4 | Skill installed but not available to the current session | Reported as `NOT_OBSERVABLE`, not `QUALIFIED`; task proceeds only if the skill is not required |
| 5 | Skill requiring permissions not granted | `BLOCKED` (not `NO_SKILL_NEEDED`); reason recorded; no silent fallback to direct execution |
| 6 | Skill loads successfully but fails during execution | `EXECUTED_FAILED`; `VERIFIED=False`; root cause recorded; task fails or escalates |
| 7 | Arabic (or any non-English) task with English-only triggers | Skill discovered, or `UNKNOWN_SKILL` returned — never a silent empty list |
| 8 | Lesson extracted from a past failure | `governed-learning` invoked; no automatic policy promotion; lesson recorded as proposed change |

**Honesty requirements** (enforced by `aghr eval --skill-states`):

- A skill that is `SELECTED` but not `EXECUTED` MUST NOT return `VERIFIED=True`.
- A skill with an unknown `id` MUST return `UNKNOWN_SKILL`, never `PASS`.
- A verification with empty outputs MUST NOT return `PASS`.
- `task_criteria` MUST be consumed by the verifier; accepting it and ignoring it is a governance defect.
- A permission-blocked skill MUST return `BLOCKED`, distinct from `NO_SKILL_NEEDED`.
- The runtime MUST NOT report `HOST_ACTIVATED` without a host-reported activation signal.
- When the host version changes, any `QUALIFIED` status reverts to `NOT_RUN` until re-qualification.

Skill fixture schema:

```json
{
  "capabilityId": "CAP-SECREV-001",
  "priority": "P0-Safety",
  "scenarios": [
    "01-sequential-skills", "02-no-skill-needed", "03-overlapping-skills",
    "04-not-available", "05-permission-blocked", "06-execution-failure",
    "07-arabic-task", "08-learning-without-promotion"
  ],
  "runs": 3,
  "honestyChecks": [
    "no-verified-without-execution",
    "no-pass-for-unknown-skill",
    "no-pass-for-empty-outputs",
    "task-criteria-consumed",
    "blocked-distinct-from-no-skill-needed",
    "no-host-activated-without-signal",
    "qualification-resets-on-version-change"
  ]
}
```

An item is **not considered effective** until it passes its fixtures across repeated runs on the target agents.

---

## 13. State, Versioning, and Drift

### 13.1 Project state

```json
{
  "aghrVersion": "1.0.0-rc.2",
  "profile": "laravel-react-mssql",
  "adoptionLevel": "L2-Managed",
  "generatedAt": "2026-10-21T18:30:00Z",
  "contentHash": "sha256:...",
  "controls": { "SEC-001": "enforced", "OPS-002": "manual", "CODE-004": "planned" },
  "evalStatus": { "SEC-001": { "lastRun": "2026-10-15", "result": "pass" } },
  "exceptions": ["EXC-012"],
  "skillQualification": {
    "security-review@codex-1.4.2": {
      "status": "QUALIFIED",
      "scope": "services/payments/**",
      "qualifiedAt": "2026-10-20",
      "contentHash": "sha256:...",
      "evidence": ["evals/results/security-review-codex-1.4.2.json"]
    },
    "browser-testing@antigravity-2.0": {
      "status": "NOT_OBSERVABLE",
      "reason": "host does not expose skill activation signal"
    },
    "langfuse@codex-1.4.2": {
      "status": "NOT_RUN",
      "reason": "no eval fixture yet"
    }
  }
}
```

### 13.2 Concurrency: CI as sole authoritative writer

`.aghr/state.json` is a **CI-owned** file. This applies to both `controls` and `skillQualification`.

- **Agents and developers** have **read-only** access to `state.json`.
- **CI** writes it as a post-merge action or as part of `aghr validate`, using `tools/state_writer.py`.
- **Local generation** never writes `state.json`; it reads it to display status only.

This prevents merge conflicts and race conditions when multiple agents or pipelines operate concurrently, and it ensures the state file remains a trustworthy, single-source record.

### 13.3 Drift detection

- The generated `AGENTS.md` carries a content hash in its header.
- CI regenerates and compares; a mismatch fails the build.
- `CODEOWNERS` assigns `policies/`, `schemas/`, `capabilities/`, and generated instruction files to the governance owner.
- Any change to a `MUST_NOT` item or a `P0` `CAPABILITY` requires that owner’s review.
- `.gitattributes` marks generated files to discourage manual diffs.

### 13.4 Semantic versioning

| Change | Version bump | Example |
|---|---|---|
| Documentation or `MAY` item added | Patch | `1.0.1` |
| New skill or `SHOULD` item | Minor | `1.1.0` |
| New `MUST` / `MUST_NOT` item, new `CAPABILITY`, or schema change | Major | `2.0.0` |
| Removal or weakening of a critical constraint or qualification requirement | Major + governance approval | `2.1.0` |

### 13.5 Package signing and generator integrity

- **Sign releases** with Sigstore/cosign (or GPG). Consumers verify the signature before generation.
- **Pin versions** with `--require-hashes` in CI.
- **Restrict write privileges** on the generator: it writes only its declared output path; it does not have broad filesystem or network privileges.
- **Govern the generator itself:** changes to `tools/generate.py`, `schemas/`, `policies/`, and `capabilities/` are subject to CODEOWNERS review.
- **Record generation provenance:** version, input hash, output hash, and timestamp are written to `.aghr/last-generation.json` for audit.

---

## 14. Adoption Levels (L0–L4)

AGHR defines five adoption levels so that a small project does not face the same requirements as a production platform. Each project declares its level in `.aghr/state.json`.

| Level | Name | Minimum Requirements |
|---|---|---|
| **L0** | Awareness | AGHR exists as a reference; `AGENTS.md` is hand-written, 20–35 lines |
| **L1** | Baseline | `AGENTS.md` is **generated** from a minimal profile; core kinds only; identity, constraints, verification, routing; PRIN-007 included |
| **L2** | Managed | Policies exported; `state.json` present; CI drift check; schema validation on every PR; skill-state check enabled |
| **L3** | Enforced | Technical controls declared and verified (`aghr doctor`); branch protection gates for `mergeEffect: blocking`; sandbox/permission enforcement for P0-Safety; P0 skills qualified on each target host |
| **L4** | Verified | Scheduled evals for all P0 items and all P0 skills; compliance reports; exception half-life tracked; calibration loop active; false-success rate monitored |

**Recommended path:** Start at **L2** on a pilot project. Add **L3** only for critical constraints and P0 skills. Reach **L4** only after the eval loop has stabilized. This progression avoids the failure mode where a small project is required to match enterprise platform rigor on day one.

**Skill-specific note.** A project may reach L3 for instruction items while remaining at L2 for skills, if its P0 skills are not yet qualified on the target host. `aghr doctor` reports these divergences per domain so they are visible, not hidden.

---

## 15. Quality Gates and Acceptance Criteria

A package is acceptable only if all of the following hold:

**Instruction-item governance (rc.1)**

- [ ] Every item has a unique `id`, `kind`, `force`, `severity`, `scope`, `rule`; and the additional fields required for its `force`/`severity` tier (§3.2).
- [ ] Every `MUST_NOT` at `severity: critical|high` has at least one technical or human-approval enforcement that is **verified to exist**, not merely named.
- [ ] Every `P0-Safety` and `P0-Integrity` instruction item has at least one behavioral eval fixture, and that fixture passes on target agents at the declared tolerance.
- [ ] The generated `AGENTS.md` is within the byte budget of every declared target agent, or the generator fails with a specific list of overflowing P0 items.
- [ ] The generated `AGENTS.md` carries a verifiable content hash.
- [ ] Every path in the routing table resolves to an existing file.
- [ ] No `EXCEPTION` lacks `expiresOn` or a `references` link to the item it departs from.
- [ ] No two active items conflict without an explicit `conflictPolicy` resolution (§5.4).
- [ ] `mergeEffect: blocking` implies an existing `gate.required: true`, verified by `aghr doctor`.
- [ ] Every project records `aghrVersion`, `adoptionLevel`, and `evalStatus` in `.aghr/state.json`; that version exists in `CHANGELOG.md`.
- [ ] The package release is signed and its signature verified by consumer CI.
- [ ] The package includes `THREAT_MODEL.md` covering policy tampering, unauthorized exceptions, state forgery, and generator compromise.

**Skill governance (rc.2)**

- [ ] The runtime MUST NOT report `SKILL_ACTIVATED` or `verified=True` without execution evidence linked to the current task and environment.
- [ ] A verification call with an unknown `skill_id` MUST return `UNKNOWN_SKILL`, never `PASS`.
- [ ] A verification call with empty outputs MUST NOT return `PASS`.
- [ ] `task_criteria` MUST be consumed by the verifier; accepting it and ignoring it is a governance defect.
- [ ] A permission-blocked skill MUST be reported as `BLOCKED`, distinct from `NO_SKILL_NEEDED`; no silent fallback to direct execution.
- [ ] Every `CAPABILITY` item MUST carry a `skillQualification` record with a status from `{QUALIFIED, NOT_RUN, NOT_OBSERVABLE, UNKNOWN, FAILED}`.
- [ ] Every `P0` skill MUST have skill-specific eval fixtures (§12.3) covering all eight mandatory scenarios and all seven honesty checks.
- [ ] When `hostVersion` changes, `QUALIFIED` reverts to `NOT_RUN`; the runtime MUST NOT reuse stale qualification.
- [ ] The documentation count of skills in `options/` MUST match the registry count in `optional_skills/REGISTER.json`; `aghr lint` fails on mismatch.
- [ ] `PRIN-007` appears in every generated `AGENTS.md` at L1 and above.
- [ ] No skill is `SELECTED` for a `P0` task unless its `skillQualification.status` is `QUALIFIED` for the current `(host, hostVersion, scope)`.

---

## 16. Threat Model Summary

| Threat | Control |
|---|---|
| Malicious edit to a binding policy | `CODEOWNERS` + required governance review + signed commits for `policies/` |
| Unauthorized exception insertion | Exceptions require `approvedBy`; validated for expiry and reference integrity |
| Hand-edit of generated `AGENTS.md` | Content hash + `aghr generate --check` in CI |
| Forged `.aghr/state.json` | CI is sole writer; state validated against schema; cross-checked against `CHANGELOG.md` |
| Compromised generator | Signed releases verified by consumer CI; pinned versions with `--require-hashes`; restricted write privileges; generator changes subject to review |
| Prompt injection via retrieved content | P0 prohibitions backed by technical controls; hierarchy training not assumed to be sufficient |
| Race condition on state writes | CI sole writer; agents read-only |
| Contradictory instructions across languages | `scope.language` scoping; generator excludes non-active-language items |
| **Skill state misreporting** — runtime reports `ACTIVATED`/`VERIFIED` without execution | Strict state machine (§7.3); `aghr validate` rejects conflated states; eval fixtures for negative cases (§12.3) |
| **Skill impersonation** — a skill claims an `id` it does not own | `skillQualification` bound to `(id, host, version, scope)`; `SKILL.md` content hash recorded; mismatch fails validation |
| **Permission bypass via "direct execution" fallback** — a blocked skill is reclassified as "no skill needed" and executed anyway | `BLOCKED` is terminal; fallback requires a new authorization check recorded in `.aghr/state.json` |
| **Silent discovery failure** — non-English task returns empty list without error | `UNKNOWN_SKILL` is an explicit return, never an empty list; multilingual eval fixtures (§12.3 scenario 7) |
| **Stale qualification** — skill qualified on old host version used on new version | Qualification is per `(host, version)`; version change invalidates `QUALIFIED` to `NOT_RUN` |
| **Documentation drift** — options page and registry disagree on skill count | `aghr lint` checks count consistency; mismatch fails CI |
| **Skill over-loading** — agent loads all available skills "to be safe" | Minimal effective set rule (§7.5); eval scenario 1; context budget enforcement (§10.2) |
| **Unauthorized skill adoption** — agent installs or enables a new skill without approval | Skill adoption procedure (§17.2); `CODEOWNERS` on `capabilities/`; `P0` changes require governance-owner review |

---

## 17. Meta-Governance (AGHR Self-Management)

If an agent is asked to *add a rule to AGHR* or *adopt a skill*, it must understand how to modify AGHR safely without violating existing rules. AGHR defines a **meta-governance skill** with two procedures.

### 17.1 Instruction-item governance procedure

```yaml
# skills/aghr-self-management/skill.yaml
id: aghr-self-management
name: AGHR Self-Management
version: 1.1.0
trigger:
  type: model_decision
  keywords: [aghr, governance, policy, schema, "add rule", "modify rule", "add skill"]
requiredApprovals: [governance-owner]
```

```markdown
# SKILL.md — AGHR Self-Management

## Purpose
Guide changes to AGHR itself (policies, schemas, templates, tools, capabilities).

## Procedure for Instruction-Item Changes
1. Classify the requested change by `kind` and proposed `force`.
2. Validate against `item.schema.json`.
3. Run `aghr lint` and `aghr validate --strict`.
4. If the change adds or modifies a `MUST_NOT` item, require a governance-owner approval.
5. Regenerate affected `AGENTS.md` files and run `aghr generate --check`.
6. Commit via PR; CI runs the full gate.

## Boundaries
Do not modify `tools/` or `schemas/` from an agent session.
Do not bypass the `CODEOWNERS` requirement.
```

### 17.2 Skill adoption procedure

```markdown
## Procedure for Skill Adoption
1. Classify the proposed skill by source (system / user / project / extension / catalog)
   and by function (routing / design / implementation / security / verification / learning).
2. Confirm it does not duplicate an existing skill in the same function.
   If it does, record the preferred skill and the alternative explicitly in the
   project-level selection.
3. Add the skill to the project-level selection (lightweight config in
   `capabilities/project-selections/`), not to the AGHR registry, unless it is
   an AGHR governance skill.
4. Create or update the `CAPABILITY` item (§9.5) with the skill's source,
   function, instructions path, inputs, outputs, permissions, and conflicts.
5. Run qualification on the target host + version + scope via `aghr qualify`.
   Record the result in `.aghr/state.json` (CI writes it).
6. If the skill is referenced by a P0 item, add at least one skill eval fixture
   per §12.3, covering all eight mandatory scenarios and all seven honesty checks.
7. Commit via PR; CI runs `aghr validate --strict`, `aghr lint`,
   `aghr check --skill-states`, and `aghr eval --priority P0-Safety,P0-Integrity`.
```

The root `AGENTS.md` includes routing entries pointing to this skill (§10.1). This closes the **meta-governance chicken-and-egg problem** for both instruction items and skills: the agent can extend governance, but only through a governed path.

---

## 18. Rollout Strategy

### 18.1 Phase 1 — Developer Experience (DX)

Do not rely solely on CLI and CI for feedback. Provide:

- **IDE integration** (VS Code extension or language-server) with:
  - Real-time YAML linting against `item.schema.json` and `capability.schema.json`.
  - A “Governance Debt” dashboard (draft / planned / deprecated items; unqualified P0 skills).
  - Inline warnings in `AGENTS.md` on manual edit (matching drift detection).
- **`aghr explain <id>`** — human-readable card per item: kind, force, severity, scope, enforcement, last eval, exceptions, and (for `CAPABILITY`) qualification status.
- **`aghr report --format sarif`** — results surfaced in GitHub Code Scanning alongside other risks.

### 18.2 Phase 2 — Standardization

The `AGENTS.md` format is stewarded by the Agentic AI Foundation at the Linux Foundation. AGHR is mature enough to be proposed as a **companion standard**: *“AGHR — The Governance Extension for AGENTS.md.”* Open-sourcing the `aghr` tooling under a permissive license accelerates adoption and community-driven schema refinement.

### 18.3 Phase 3 — Metric-Driven Governance

Treat AGHR adoption like DORA metrics. Track and report:

**Instruction-item metrics**

| Metric | Definition | Target |
|---|---|---|
| **Policy coverage** | % of critical paths covered by ≥1 `CONSTRAINT` or `CONTROL` | 100% of P0 paths |
| **Eval pass rate** | Success rate of behavioral fixtures across agent versions | ≥95% on P0 items |
| **Exception half-life** | Median time for an `EXCEPTION` to be resolved or renewed | < 90 days |
| **Drift rate** | % of PRs that failed `aghr generate --check` and required regeneration | Trending down |
| **Calibration coverage** | % of P0 items with `impact.evidence: repo-measured` | ≥80% at L4 |

**Skill governance metrics (rc.2)**

| Metric | Definition | Target |
|---|---|---|
| **Skill qualification coverage** | % of P0 capabilities whose referenced skills have `QUALIFIED` status on the target host | 100% on P0 |
| **Skill eval pass rate** | Success rate of §12.3 fixtures across host versions | ≥95% |
| **False-success rate** | % of skill calls that returned `VERIFIED=True` without execution evidence (detected by audit) | 0% |
| **Discovery recall (multilingual)** | % of non-English tasks that return a non-empty result or `UNKNOWN_SKILL` (never silent empty) | 100% |
| **Qualification drift** | # of skills whose host version changed without re-qualification | 0 at release |

---

## 19. Implementation Roadmap

| Phase | Duration | Deliverables | Exit Criterion |
|---|---:|---|---|
| Scope, owner, threat model | 1 day | `aghr.json`, charter, `THREAT_MODEL.md` | Package identity fixed; owner accountable |
| Schemas (core kinds, tiers, new fields, `CAPABILITY`, `skillQualification`) | 2 days | `item.schema.json`, `capability.schema.json`, `qualification.schema.json`, `package.schema.json`, `skill.schema.json` | `aghr validate` accepts a minimal item and a minimal capability, and rejects invalid ones |
| Critical policies + first instruction eval fixture | 3 days | `policies/security/*`, `evals/fixtures/instruction/SEC-001/` | SEC-001 fixture passes on target agents |
| **Skill governance core** (rc.2) | 3 days | `skills/aghr-self-management/`, `capabilities/project-selections/`, `tools/qualify_skill.py`, `aghr check --skill-states` | PRIN-007 in every generated `AGENTS.md`; one P0 capability qualified on one host |
| Generator, validator, `doctor`, budget + fallback | 2 days | `aghr generate`, `aghr validate`, `aghr doctor`, compact template | Root `AGENTS.md` generated within 32 KiB |
| Eval runner + scheduled workflow (instruction + skill) | 1 day | `evals/runner.py`, `evals.yml` | Scheduled eval runs and reports; §12.3 scenarios execute |
| Pilot on one small project (L2) | 1 day | Generated `AGENTS.md`, CI drift check, skill-state check | Drift check blocks manual edits; skill-state check blocks unqualified P0 |
| Pilot on one production project (L3 for P0) | 1 day | Branch protection gates, technical controls verified, P0 skills qualified | `aghr doctor` confirms controls and qualifications exist |
| Rollout + migration guide | 2 days | Profiles, `aghr import`, adoption guide, skill adoption guide | Two more projects at L2; one at L3 |

**Recommended first milestone.** Prove the core loop with `item.schema.json` + `SEC-001` fixture + drift check on one project, **and** with `capability.schema.json` + `PRIN-007` + one qualified P0 skill, **before** building out the full policy library or skill catalog. This validates that both governance domains hold before they accumulate content.

---

## Appendix A — Core Kind Reference Card

| Kind | Default force | Default severity | Enforcement expectation | Default tier |
|---|---|---|---|---|
| `OBSERVATION` | `INFORMATIVE` | `info` | None | P2-Quality |
| `PRINCIPLE` | `MUST` or `SHOULD` | `high` | Textual | P1-Reasoning |
| `CONSTRAINT` | `MUST_NOT` | `critical` | Technical or human approval required | P0-Safety |
| `REQUIREMENT` | `MUST` | `high` | Acceptance criterion + verification | P1-Reasoning |
| `PROCEDURE` | `MUST` | varies | Trigger + evidence | P0-Safety or P2-Quality by scope |
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
| `CAPABILITY` | `MUST` | `critical` if it grants write/secrets/network; else `medium` | `skillQualification` + `aghr-check-skill-states` | P0-Safety or P1-Reasoning |

## Appendix C — Force Reference Card

| Force | Meaning | Typical kinds | Violation handling |
|---|---|---|---|
| `MUST` | Absolute obligation | `CONSTRAINT`, `REQUIREMENT`, `PROCEDURE` | Block or review |
| `MUST_NOT` | Absolute prohibition | `CONSTRAINT`, `POLICY` | Block + technical control |
| `SHOULD` | Strong recommendation; deviation requires justification | `STANDARD`, `GUIDELINE` | Warn |
| `SHOULD_NOT` | Strong discouragement | `STANDARD`, `GUIDELINE` | Warn |
| `MAY` | Permitted, not required | `GUIDELINE`, `EXCEPTION` | Log |
| `INFORMATIVE` | Context only | `OBSERVATION` | None |

## Appendix D — Release Notes

### D.1 Release Notes for 1.0.0-rc.2 (Skill Governance Addendum)

**Added**

- §7 Skill Governance Framework:
  - Three capability levels (native / specialized / AGHR governance)
  - Four presence states (`EXISTS`, `DISCOVERED`, `QUALIFIED`, `USED`)
  - Five lifecycle states (`SELECTED`, `LOADED`, `HOST_ACTIVATED`, `EXECUTED`, `VERIFIED`) plus terminal states (`BLOCKED`, `UNKNOWN_SKILL`, `NOT_OBSERVABLE`, `EXECUTED_FAILED`, `ABANDONED`)
  - Per-host, per-version, per-scope qualification with content hash
  - Project-level and task-level selection with conflict resolution
  - Role distribution across host, AGHR, project, agent
  - Multilingual and intent-based discovery
  - PRIN-007 governing principle
- §4.2 `CAPABILITY` kind (advanced)
- §9.2 PRIN-007 example; §9.5 `CAPABILITY` example
- §12.3 skill-specific eval scenarios (8 mandatory cases + 7 honesty checks)
- §13.1 `skillQualification` block in `state.json` (CI-writer only)
- §15 ten new acceptance criteria covering state honesty, unknown skill rejection, empty-output rejection, `task_criteria` consumption, `BLOCKED` vs `NO_SKILL_NEEDED`, per-host qualification, P0 skill fixtures, qualification reset on version change, documentation consistency, PRIN-007 presence, and qualification-before-selection
- §16 six new threat-model rows (state misreporting, impersonation, permission bypass, silent discovery failure, stale qualification, documentation drift) plus two additional rows (skill over-loading, unauthorized skill adoption)
- §17.2 skill adoption procedure
- §18.3 five skill governance metrics
- §19 skill governance phase in roadmap
- Appendix E (Skill State Reference Card)
- Appendix F (Skill Source and Function Taxonomy)

**Changed**

- `aghr.json` `validation` block adds `requireSkillQualificationFor`, `enforceSkillStateHonesty`, `enforceDocumentationConsistency`; `schemaVersion` bumped to `1.1`.
- Package structure adds `schemas/capability.schema.json`, `schemas/qualification.schema.json`, `capabilities/`, `tools/qualify_skill.py`, and `evals/fixtures/skill/`.
- §3.2 field-severity tiers add a row for items referencing a `CAPABILITY`.
- §6.2 impact bands table adds row 10 (Skill Selection & Qualification).
- §6.3 priority tiers add skill-related examples to P0-Safety and P0-Integrity.
- §10.1 generated `AGENTS.md` template adds a Skill Governance section and references `aghr check --skill-states`.
- §10.2 compact template adds `aghr_get_skill` directive.
- §11.1 CI gate adds `aghr check --skill-states`.
- §11 enforcement rules add rule 5 (P0 capability requires skill-state check).
- §13.4 semantic versioning adds `CAPABILITY` changes to Major bumps.
- §13.5 signing and integrity add `capabilities/` to CODEOWNERS scope.
- §14 adoption levels add skill-state and qualification requirements to L1–L4; adds skill-specific divergence note.
- All section numbers from old §7 onward shift by +1.

**Unchanged**

- The five-dimension item model (§3) remains valid for instruction items; skill governance is an additive layer, not a replacement.
- The generated `AGENTS.md` structure (§10.1) is extended, not redesigned; skill routing is expressed through the Routing Table, PRIN-007, and a dedicated Skill Governance section.
- All prior threat-model rows, quality gates, adoption levels (L0–L4), and the implementation roadmap remain in force.
- The core/advanced kind split, field-severity tiers, and graceful-degradation policy remain in force.

**Promotion to 1.0.0 stable** requires, in addition to rc.1 requirements:

- Two pilots (one small at L2, one production at L3 for P0) with **both** instruction-item and skill governance active.
- Signature verification in consumer CI.
- Confirmed P0 instruction-item eval pass rates on target agents.
- **100% P0 skill qualification coverage on target hosts.**
- **Zero false-success rate** across the skill eval suite (§12.3).
- Documentation consistency check passing (`aghr lint` skill-count check).
- A published `THREAT_MODEL.md` updated with the rc.2 rows.

### D.2 Release Notes for 1.0.0-rc.1

Provider-behavior claims softened to probabilistic language; impact estimates reclassified as design heuristics with `impact.evidence`; benchmark figures corrected and re-sourced as directional; 12-kind taxonomy split into 6 core and 6 advanced kinds; adoption levels L0–L4 added; `rationale`, `reviewCadence`, `conflictPolicy`, `mergeEffect`, and `gate` fields added; state-writer concurrency resolved (CI as sole writer); graceful degradation and meta-governance added; package signing and generator hardening specified.

---

## Appendix E — Skill State Reference Card

| State | Emitted by | Requires evidence | Can be followed by | On failure |
|---|---|---|---|---|
| `EXISTS` | File system scan | Path + content hash | `DISCOVERED` | — |
| `DISCOVERED` | Host adapter | Host-reported skill list | `QUALIFIED` or `USED` (if already qualified) | — |
| `QUALIFIED` | `aghr qualify` | Eval result + host version + scope + content hash | `SELECTED` | `FAILED` if qualification fails |
| `SELECTED` | Agent | Task id + selection reason | `LOADED` or `ABANDONED` | `ABANDONED` if task changes |
| `LOADED` | Host adapter | Instruction text hash | `HOST_ACTIVATED` or `FAILED` | `FAILED` if load fails |
| `HOST_ACTIVATED` | Host adapter | Host acknowledgment signal | `EXECUTED` or `FAILED` | `FAILED` if activation fails |
| `EXECUTED` | Skill runtime | Recorded inputs + outputs | `VERIFIED` or `EXECUTED_FAILED` | `EXECUTED_FAILED` on error |
| `VERIFIED` | Verifier | `task_criteria` match + environment evidence | Terminal | `EXECUTED_FAILED` if verification fails |
| `BLOCKED` | Authorization check | Reason recorded (permission, conflict, scope) | Terminal (no silent fallback) | Requires new authorization to proceed |
| `UNKNOWN_SKILL` | Discovery | Unknown `id` + task language | Terminal | — |
| `NOT_OBSERVABLE` | Qualification | Host signal absent | Terminal (for this host+version) | — |
| `EXECUTED_FAILED` | Skill runtime or verifier | Error record + partial evidence | Terminal or `SELECTED` (retry with new skill) | Escalate if P0 |
| `ABANDONED` | Agent | Reason (task changed, minimal set revised) | `SELECTED` (new skill) or `NO_SKILL_NEEDED` | — |
| `NO_SKILL_NEEDED` | Agent | Reason (direct execution preferred) | Terminal for this phase | — |

**Invariants.**

1. No state above `LOADED` may be emitted without the evidence for the next state.
2. `BLOCKED` and `NO_SKILL_NEEDED` are distinct; one cannot be substituted for the other.
3. `QUALIFIED` reverts to `NOT_RUN` on `hostVersion` change.
4. `VERIFIED` requires `task_criteria` to be consumed, not merely accepted.
5. `UNKNOWN_SKILL` is an explicit return, never an empty list.

---

## Appendix F — Skill Source and Function Taxonomy

### F.1 Source axis

| Source | Description | Typical owner | Governance note |
|---|---|---|---|
| **System** (host-bundled) | Shipped with the host | Host vendor | Qualification required per host version |
| **User** (installed locally) | Installed by the developer | User | Subject to project-level selection |
| **Project** (declared in repo) | Declared in the repository | Project | Subject to `CODEOWNERS` |
| **Extension** (plugin) | Installed via an extension mechanism | Extension author | Qualification and permission audit required |
| **External catalog** | Downloaded from a public catalog | Catalog maintainer | Full qualification and threat review required |
| **AGHR governance** | Shipped with AGHR | Governance owner | Subject to §17.2 adoption procedure |

### F.2 Function axis

| Function | Purpose | Typical examples | Default tier |
|---|---|---|---|
| **Routing** | Improve how the agent chooses work | `using-agent-skills`, `spec-driven-development` | P1-Reasoning |
| **Design** | Shape architecture and planning | `planning-and-task-breakdown`, `architecture-options` | P1-Reasoning |
| **Implementation** | Guide code writing | `incremental-implementation`, `source-driven-development` | P2-Quality |
| **Debugging** | Diagnose and recover | `debugging-and-error-recovery`, `root-cause-debugging` | P1-Reasoning |
| **Security** | Reduce security risk | `security-diff-scan`, `threat-model`, `scan_dependencies` | P0-Safety |
| **Verification** | Confirm outcomes | `code-review-and-quality`, `risk-based-verification`, `safe-git-closeout` | P0-Safety (for P0 changes) |
| **Learning** | Improve future behavior | `governed-learning` | P2-Quality |

### F.3 Cross-axis mapping (examples)

| Skill | Source | Function | Tier | Qualification host |
|---|---|---|---|---|
| `using-agent-skills` | System | Routing | P1-Reasoning | Codex, Gemini CLI, Antigravity |
| `security-diff-scan` | Project | Security | P0-Safety | All hosts with write access |
| `browser-testing-with-devtools` | Extension | Verification | P2-Quality | Hosts with browser tooling |
| `governed-learning` | AGHR governance | Learning | P2-Quality | All hosts |

**A skill's source does not determine its function, and its function does not determine its tier.** Both axes are recorded independently in the `CAPABILITY` item (§9.5), and the tier is derived from the function plus the permissions the skill requires. A routing skill that only reads files is P1-Reasoning; a security skill that can write reports and read secrets is P0-Safety; the same skill on a host that cannot expose activation signals is `NOT_OBSERVABLE` and cannot be used for P0 tasks until qualification succeeds.

---

**Final note.** The governing principle remains the one the benchmark evidence supports: **every instruction costs attention, and an instruction that does not change behavior is a net negative.** The rc.2 addendum extends this principle to skills: **every loaded skill costs context, and a skill that is loaded but not executed — or executed but not verified — is a governance liability.** The `impact.evidence` field, the skill state machine (Appendix E), the eval schedule, and the qualification-reset rule exist specifically to enforce both principles over time — so that AGHR remains a governance system rather than accumulating into a governance artifact.
