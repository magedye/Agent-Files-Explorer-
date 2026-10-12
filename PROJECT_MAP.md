# AGHR Governance Studio — Authoritative Project Map

**Product**: AGHR Governance Studio  
**Version**: 1.0.0 (Local-First Governed Management Platform)  
**Governance Standard**: Agent Governance and Harness Reference (AGHR 1.0.0)  
**Updated**: 2026-10-11  

---

## 1. Directory Structure

```
D:\APP\Skill-manager\Agent-Files-Explorer/
├── Agent_Governance_Harness_Reference_1.0.0/   # Authoritative Governance Package (FROZEN REFERENCE)
│   └── Agent_Governance_Harness_Reference_1.0.0/
│       ├── adapters/                            # Provider and Host adapters (12 records)
│       ├── compatibility/                       # V4 control mappings and inventories (48 controls)
│       ├── contracts/                           # Normative contracts: GOVERNANCE, RUNTIME, ENFORCEMENT, EVIDENCE
│       ├── design/                              # Frozen baseline digests
│       ├── evaluations/                         # Scenarios and grading logic (8 demo cases)
│       ├── guide/                               # Operational and Arabic guides
│       ├── policies/                            # Operating policies
│       ├── procedures/                          # Adoption and request intake procedures
│       ├── profiles/                            # LITE, STANDARD, CONTROLLED
│       ├── prompts/                             # Governed prompts
│       ├── protocols/                           # Execution, Surgical Editing protocols
│       ├── registry/                            # RULES.json (40 rules) & ENFORCEMENT_COVERAGE.json
│       ├── runtime/                             # Python runtime (common, policy, cli)
│       ├── schemas/                             # JSON schemas (PROJECT, STATE, REQUEST, EVIDENCE, RULE)
│       ├── sources/                             # REGISTER.json (30 authoritative sources)
│       ├── templates/                           # Governance record templates
│       ├── tests/                               # 127 validation tests
│       └── tools/                               # check_package.py, run_tests.py
├── data/                                       # Candidate Projects & Skills
│   ├── lisan-blind-lab/                         # Candidate: Lisan Blind Lab
│   └── sealed-text-decipherment/                # Candidate: Sealed Text Decipherment
├── server/                                     # Local Governed Backend Services
│   ├── security.js                              # Canonical roots, containment, traversal prevention, sensitive file masking
│   ├── governance.js                            # AGHR reference queries, rule inspector, typed relationship graph
│   ├── intake.js                                # Raw capture, atomic decomposition, 2-layer classification, ChangePackets
│   ├── adoption.js                              # Candidate discovery, profile validation, AGENTS.md diffs, PROJECT.json
│   ├── evaluation.js                            # Subprocess runner for AGHR tools, evidence logging, honest status stamps
│   ├── staging.js                               # Isolated staging, precondition check, authorized apply, backup & rollback
│   └── api.js                                   # Modular API router & request dispatcher
├── src/                                        # Frontend React Application
│   ├── components/
│   │   ├── FileTree.jsx                         # Hierarchical file tree navigation
│   │   ├── FileView.jsx                         # Markdown, text, and media renderer
│   │   ├── FlowView.jsx                         # Dependency flow visualization
│   │   ├── GraphView.jsx                        # Relational graph visualization
│   │   ├── ReferenceManager.jsx                 # AGHR 40 rules, 30 sources, 12 adapters, inspector
│   │   ├── IntakeView.jsx                       # Intake decomposition, 2-layer classification, ChangePackets
│   │   ├── AdoptionView.jsx                     # Candidate inspection, profile selector, diff preview, staging
│   │   ├── EvaluationView.jsx                   # Test runner, check_package, honest evidence view
│   │   └── StagingView.jsx                      # Isolated staging, precondition check, authorized apply & rollback
│   ├── App.jsx                                  # Studio shell & top-level view orchestration
│   ├── api.js                                   # Secure client API communication
│   ├── index.css                                # Design system & typography (Light / Dark mode)
│   ├── main.jsx                                 # React bootstrap entry
│   └── parse.js                                 # Structural relation extraction
├── tests/                                      # Automated Test Suites
│   ├── security.test.mjs                        # 10 tests: traversal, null-byte, protected files, safe errors
│   └── governance_studio.test.mjs               # 11 tests: M2 reference, M3 intake, M4 adoption, M6 staging & apply
├── .governance/                                # Local Governance Persistence (Audit & Evidence)
│   ├── intake/                                  # Stored ChangePackets
│   ├── evaluations/                             # Stored test run evidence logs
│   ├── staging/                                 # Isolated staging workspaces
│   ├── backups/                                 # Recovery backup snapshots
│   └── audit.jsonl                              # Append-only governed apply & rollback audit ledger
├── BASELINE_QUALIFICATION_REPORT.md            # Milestone 0 Qualification Record
├── PROJECT_MAP.md                              # This authoritative project map
├── Skill_Steward_SACP_Executive_Implementation_Spec_v1.0_AR.md # Supplementary Architecture Spec
├── index.html                                  # Vite entry HTML
├── package.json                                # Project config with npm test runner
├── plan.md                                     # Transformation plan & requirements
└── vite.config.mjs                             # Secured local dev server configuration
```

---

## 2. Implemented API Endpoints

| Endpoint | Method | Module | Description |
|---|---|---|---|
| `/api/health` | GET | Core | Service health and security isolation posture |
| `/api/roots` | GET | Security | Approved roots directory listing |
| `/api/tree` | GET | Explorer | Bounded directory tree for approved roots |
| `/api/file` | GET | Explorer | Bounded text/metadata reader (2MB capped) |
| `/api/raw` | GET | Explorer | Bounded media streaming (8MB capped) |
| `/api/governance/summary` | GET | M2 Reference | Metrics: 40 rules, 30 sources, 12 adapters |
| `/api/governance/rules` | GET | M2 Reference | Filterable rules registry (search, force, source) |
| `/api/governance/rule` | GET | M2 Reference | Enriched rule details with basis and coverage |
| `/api/governance/sources` | GET | M2 Reference | 30 official developer sources |
| `/api/governance/source` | GET | M2 Reference | Source details with derived rules |
| `/api/governance/adapters` | GET | M2 Reference | 12 provider & host adapters |
| `/api/governance/graph` | GET | M2 Reference | Typed relationship graph (basis, contracts) |
| `/api/intake/submit` | POST | M3 Intake | Raw input capture, atomic decomposition, ChangePacket |
| `/api/intake/packets` | GET | M3 Intake | List stored ChangePackets |
| `/api/intake/packet` | GET | M3 Intake | Retrieve ChangePacket with ChangeItems |
| `/api/adoption/candidates` | GET | M4 Adoption | Discover candidate projects in `data/` |
| `/api/adoption/inspect` | POST | M4 Adoption | Inspect stack, git, and governance state |
| `/api/adoption/prepare` | POST | M4 Adoption | Generate adoption plan, diffs, PROJECT.json |
| `/api/evaluation/run-suite` | POST | M5 Evidence | Execute AGHR test runner (`run_tests.py`) |
| `/api/evaluation/check-package` | POST | M5 Evidence | Execute AGHR package checker (`check_package.py`) |
| `/api/evaluation/history` | GET | M5 Evidence | List evaluation evidence records |
| `/api/staging/create` | POST | M6 Staging | Create isolated staging workspace |
| `/api/staging/manifest` | GET | M6 Staging | Retrieve staged files and unified diffs |
| `/api/governed-apply` | POST | M6 Apply | Check precondition SHA + authorize apply |
| `/api/governed-apply/rollback` | POST | M6 Rollback | Restore files from backup snapshot |

---

## 3. Verification Commands

- **Security & Studio Tests**: `npm test` (Runs `node --test tests/*.test.mjs` — 21 tests pass)
- **Frontend Production Build**: `npm run build` (Vite v7.3.6 builds in ~15s)
- **AGHR Unit Tests**: `python Agent_Governance_Harness_Reference_1.0.0/Agent_Governance_Harness_Reference_1.0.0/tools/run_tests.py`
