# Contents and reading routes

## Minimal live route
`START_HERE.md` → selected profile → project facts/current request → short project instruction router → relevant Planning / Execution / Surgical Editing protocol. Load additional policy only when it affects the work. The entire distribution is a reference library, not a system prompt.

## Five-Layer Knowledge Organization (Compatible with Core Contracts)
The reference elements map cleanly into an operational 5-layer retrieval model:
- **Layer 1 (Agent Router):** `AGENTS.md`, `START_HERE.md` — minimal always-loaded instruction boundaries (< 1,000 tokens).
- **Layer 2 (Canonical Knowledge):** `contracts/`, `registry/RULES.json`, `sources/`, `profiles/`, `CHARTER.md` — consulted on-demand per task.
- **Layer 3 (Execution State):** Project state (`.aghr/state.json`) and derived summaries (`CURRENT.md`, `HANDOFF.md`) — single source of truth.
- **Layer 4 (Evidence & Verification):** `evaluations/`, `tests/`, `tools/` — consulted when validating compliance claims.
- **Layer 5 (History & Audit Archive):** `compatibility/`, `verification/`, `design/frozen/` — preserved for audit, excluded from routine prompts (`ON_DEMAND_ONLY`).

## Reference responsibilities
| Directory/file | Responsibility | Retrieval Classification | Normal audience |
|---|---|---|---|
| CHARTER.md / ARCHITECTURE.md | Founding obligation and architecture | CANONICAL_CORE | Adopter, architect, reviewer |
| contracts/ | Governance, Runtime, Enforcement, Evidence contracts | CANONICAL_CORE | Relevant implementer/operator |
| registry/ | Canonical 47 rules (40 IDs preserved) and explicit enforcement coverage | CANONICAL_CORE | Rules resolver, reviewer |
| sources/ | 56 canonical primary-source records and applicability policy | CANONICAL_CORE | Architect, adapter maintainer |
| profiles/ | LITE / STANDARD / CONTROLLED | CANONICAL_CORE | Adopter and task planner |
| policies/ | Security, instructions, engineering, state, verification and change | ON_DEMAND_TASK | Task-specific reader |
| procedures/ | Adoption, intake, qualification, maintenance and incident response | ON_DEMAND_TASK | Operator and agent |
| protocols/ / prompts/ | Three engineering loops plus copyable entry requests | TASK_EXECUTION | Executing agent |
| adapters/ | Six provider and six host routes, documentation-only status | ON_DEMAND_TASK | Integration engineer |
| templates/ / schemas/ | Structured records and bounded validation rules | ON_DEMAND_TASK | Adopter and tooling |
| runtime/ / tools/ | Local initialization, validation, bounded effects and test runner | LOCAL_TOOLING | Local operator |
| evaluations/ / tests/ | Native scenarios, local grader and executable tests | VERIFICATION | Evaluator |
| guide/ | Arabic academic guide and embedded-diagram HTML | HUMAN_LEARNING | Human learning/reference |
| compatibility/ | Original 1.0/additions integration and preserved v4 historical dispositions | ON_DEMAND_AUDIT | Audit and migration only |
| design/frozen/ | Immutable copies of the primary design before v4 review | ON_DEMAND_AUDIT | Audit only, not active guidance |
| verification/ | Actual local results and explicit residual limits | ON_DEMAND_AUDIT | Reviewer |

## New project versus existing project
Both use the same adoption procedure. Existing rules/state are reconciled and preserved; no stronger authority is inferred from this package being newer. `init` prepares a new `.aghr` without replacing existing entry files. Existing `.aghr` content requires reviewed migration.

## Integrated 1.1 additions
| Entry | Responsibility |
|---|---|
| START_HERE_AR.md | Arabic adoption/reading entry |
| procedures/SMART_CLARIFICATION_AR.md | Focused material clarification and safe independent progress |
| procedures/LIFECYCLE_AR.md | Proportionate development and operational stages |
| procedures/EXECUTION_AND_GIT_AR.md | Guided/continuous choice, branch awareness and authorized closeout |
| procedures/COMMUNICATION_AND_HANDOFF_AR.md | Clear Arabic reporting, actionable handoff and supported model/effort |
| procedures/PROGRESS_AND_DRIFT_AR.md | Evidence-linked progress, deviations and unknowns |
| optional_skills/ | Ten original instruction-only skills, not installed or host-qualified |
| options/ | Nonmandatory external capability choices |
| standards/ | Sixteen reference cards and eighty original engineering recommendations, not official clause extraction |
| runtime/delivery.py | Read-only derived progress against canonical records |
| compatibility/MERGE_REQUEST_COVERAGE.json | Fourteen requested requirement groups and their integrated targets |
| guide/GUIDE_AR.md and GUIDE_AR.html | One academic guide, thirty-eight chapters plus offline reading appendices |

## Candidate 1.2.0 Additions
| Entry | Responsibility |
|---|---|
| procedures/PROJECT_INBOX.md | Governed drop-in staging lifecycle (_INBOX/) |
| runtime/inbox.py | Safe inbox discovery, classification, and registration |
| templates/INBOX_DISPOSITION.md | Structured review and disposition template for dropped assets |
| tests/test_inbox.py | Comprehensive test suite covering inbox safety, conflicts, and concurrency |

