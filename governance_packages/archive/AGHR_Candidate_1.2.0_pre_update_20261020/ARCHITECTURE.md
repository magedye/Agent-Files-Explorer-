# Architecture — four contracts, two adaptation axes

## Independent design baseline
This architecture is defined from the owner requirements and current first-party documentation before opening the v4 supplementary archive. The baseline is recorded in `design/BASELINE.json`. Supplementary inputs may fill gaps only through an explicit reconciliation; they cannot become a second constitution.

## Control plane
`CHARTER.md` → canonical rules → adoption and project profile → applicable rule selection → effective execution grant. The Governance Contract owns source authority, scope, conflict and rule lifecycle. Policies expand a concern without duplicating an independent normative catalog.

## Runtime plane
The Runtime Contract gives the model a concise task, relevant constraints, tool descriptions and just-in-time context. It operates an investigate → plan as needed → act → verify → checkpoint loop. Planning is not execution permission. Runtime state is durable outside chat; maps are derived views. A single agent is the initial orchestration topology; add workers only with justified responsibilities and bounded grants.

## Enforcement plane
The Enforcement Contract is evaluated before a consequential effect. Trusted host identity and policy must not come from model-supplied fields. Outcomes are ALLOW, REVIEW or DENY; unknown or invalid authorization fails closed for that action. Real deployments require complete mediation across shell, tools, MCP, subagents, network and file writes. This repository provides a deliberately narrow local reference executor, not a universal OS sandbox.

## Evidence plane
The Evidence Contract binds claim → criterion → check → candidate → environment → result → artifact → reviewer/decision, as applicable. Test outcome, work state, adoption state and release decision are independent dimensions. A hash detects byte changes relative to a trusted value; it does not authenticate the producer or prove correctness.

## Adaptation axes
Provider adapters specify model/API behavior (OpenAI, Anthropic, Google, Mistral, DeepSeek, Qwen). Host adapters specify loading and execution surfaces (Codex, Claude Code, Gemini CLI, OpenCode, GitHub Copilot, generic API host). A provider is not a host; compatible JSON is not semantic parity. Choose one of each where relevant and qualify the combination. Documentation-only adaptation is not a tested integration.

## Minimal operating route
The agent reads the project entry file, active request/state and selected protocol. The rest is a library, not compulsory prompt context. LITE uses the same record formats with fewer required assurance activities. STANDARD adds explicit project/host and evidence review. CONTROLLED adds action-specific assurance, external boundary checks and independent review when required by risk.

## Single sources of truth
| Information | Canonical owner/location | Derived view |
|---|---|---|
| General rules | registry/RULES.json | Contracts and entry instructions |
| Project facts and grants | Project profile + trusted host policy | Selected prompt context |
| Requests, decisions and work state | Project records | PROJECT_MAP.md |
| Source code and configuration | Actual repository candidate | Architecture summary |
| Verification | Raw output + evidence record | Handoff summary |
| Permission to release/activate | Named authority's decision | Readiness report |

## Data flow and trust boundaries
User request → intake record → authorized task → context selection → model proposal → trusted policy decision → bounded executor → result/evidence → durable state → next authorized step or scoped escalation.

Retrieved documents and tool outputs enter the data side. A separate, authorized promotion process is needed to make their content governing. Skills, instruction files, plugins, dependencies and MCP server descriptions are part of the supply chain.

## Non-goals
No prescribed business architecture, line-count target, unconditional latest-version upgrade, blanket ban on lockfile inspection, mandatory multi-agent system, hidden chain-of-thought collection, universal shell allowlist, or automatic release approval. No automatic alteration of a user's global agent configuration.

## Assurance and failure
Tests in this distribution verify its own local tools. Live vendor calls, installed-host instruction loading, OS-level isolation, production rollback and independent acceptance remain separately executable qualification cases. A failing action is isolated; a failed policy boundary cannot be bypassed via a different tool.

## Additive integration in 1.1.0
The original four contracts, provider/host axes, profiles, local backend and frozen 1.0.0 primary-design evidence remain intact. New detailed procedures, optional instruction-only skills and a standards reference library are routed through existing contracts. REQUEST gains optional clarification records and STATE gains an optional delivery view; old 1.0 records remain accepted by this version. Older tools are not promised to accept new fields. There is no fifth core contract and no competing source or rule registry. See [migration](procedures/MIGRATION_1_0_TO_1_1.md).
