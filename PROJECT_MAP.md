# AGHR Governance Studio — Project Map

- **Product:** Local-first governance management studio
- **Updated:** 2026-10-20
- **Scope:** Navigation and implemented component map; release authority is recorded separately.

## Repository layout

```text
Agent-Files-Explorer/
├── AGENTS.md                  Agent routing and safe reading boundaries
├── README.md                  Product entry point and local commands
├── src/                       React interface and document/graph views
│   └── i18n/                  Arabic/English messages, locale helpers and shared context
├── server/                    Local Node.js API and governed services
├── tests/                     Application tests
├── tools/                     Context health and INBOX custody checkers
├── .governance/               Local runtime intake, evidence, staging, backups, audit
├── governance_packages/
│   ├── references/            Latest completed reference only: AGHR 1.2.0 + ZIP/digest
│   ├── candidates/            Isolated future update work
│   ├── archive/               Previous 1.0.0/1.1.0 editions and the original 1.2.0 candidate
│   └── INBOX/                 Incoming documents and ideas for review
└── docs/
    ├── status/                Derived current state and handoff
    ├── governance/            Version inventory and boundary reports
    ├── evidence/inbox/        INBOX custody receipt
    ├── specs/                 Supplementary proposed product specifications
    ├── plans/                 Project and governance proposals
    └── archive/               Historical proposals and baseline records
```

The archive is a storage classification. By the owner's explicit decision, the Studio defaults to `aghr_1_2_0` (1.2.0) for browsing, governance queries, comparison targets, evaluation and newly prepared adoption headers. The historical `aghr`/`aghr_1_0_0` IDs still resolve to 1.0.0; consumer adoption remains a separate action. See [package layout](governance_packages/README.md) and [version inventory](docs/governance/VERSION_INVENTORY.md).

The owner removed `data/`. Automatic local candidate discovery is empty while it is absent; explicit adoption planning still accepts an existing project path. The INBOX custody process is documented in [INBOX procedure](docs/governance/INBOX_PROCEDURE.md).

## Implemented components

| Component | Primary files | Responsibility |
| --- | --- | --- |
| Explorer and relation views | `src/App.jsx`, `src/components/`, `src/parse.js` | Browse approved roots and inspect files, links, graphs and flows |
| Local API | `vite.config.mjs`, `server/api.js`, `src/api.js` | Route requests between UI and services on localhost |
| Security and roots | `server/security.js` | Register approved roots, constrain paths and protect sensitive files |
| Reference and comparison | `server/governance.js`, `server/comparison.js` | Query AGHR versions, rules and sources; compare packages and rule impact |
| Intake | `server/intake.js` | Decompose and classify requests into proposed ChangePackets |
| INBOX custody | `tools/inbox_custody.mjs`, `docs/evidence/inbox/` | Fingerprint direct incoming files and verify a saved receipt without adopting their instructions |
| Updated learning reference | `governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/` | Governed lessons, classified instructions, scoped local tooling and migration guidance; registered read-only as `aghr_1_2_0` |
| Adoption | `server/adoption.js` | Inspect a project and prepare adoption files and diffs |
| Evaluation | `server/evaluation.js` | Run controlled package checks and save bounded local evidence |
| Staging and apply | `server/staging.js` | Stage changes, compare preconditions, apply and record recovery data |

The UI has six main modes: Explorer, Reference, Intake, Adoption, Evaluation and Staging. `server/api.js` exposes the matching `/api/` routes, plus root, tree and file retrieval. Runtime evidence and release acceptance are distinct from implementation and local tests.

## Navigation and verification

- [Documentation index](docs/INDEX.md): authoritative navigation.
- [Current state](docs/status/CURRENT.md): derived execution snapshot; verify against Git and tests.
- [Skill Steward SACP proposal](docs/specs/SKILL_STEWARD_SACP_PROPOSAL_AR.md): a separate proposed product and a supplementary design source.
- `npm test`: application tests.
- `node tools/check_context_health.mjs`: bootstrap budgets and documentation links.
- `npm run build`: frontend build.

Do not preload the package trees. Read the exact package rule, schema or procedure required by the task.
