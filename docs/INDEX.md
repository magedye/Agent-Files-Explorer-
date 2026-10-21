# Documentation Index (Layer 2 & 3 Index)

> **Authority**: Canonical Navigation Index  
> **Status**: APPROVED  
> **Version**: 1.2.0

This index directs AI agents and engineers to authoritative project documents without loading unnecessary data into context.

---

## 1. Five-Layer Documentation Hierarchy

```
Layer 1: Agent Instructions  -->  /AGENTS.md (Root Router)
Layer 2: Canonical Knowledge -->  /docs/INDEX.md, /PROJECT_MAP.md, /docs/contracts/, /governance_packages/references/
Layer 3: Execution State    -->  /docs/status/CURRENT.md, /docs/status/HANDOFF.md
Layer 4: Evidence & Verif   -->  /tests/*.test.mjs, /docs/evidence/
Layer 5: History & Archive  -->  /docs/archive/, /governance_packages/archive/
```

---

## 2. Fast Navigation Links

### Operational State & Progress
- [CURRENT.md](status/CURRENT.md) — Active objectives, blockers, and next steps.
- [HANDOFF.md](status/HANDOFF.md) — Multi-agent and cross-session handoff checkpoint.

### Architecture & Specification
- [Arabic and English interface](features/INTERFACE_LANGUAGES.md) — language selector, saved preference, translation catalog and verification.
- [PROJECT_MAP.md](../PROJECT_MAP.md) — Current file tree and service responsibilities.
- [Skill Steward SACP proposal](specs/SKILL_STEWARD_SACP_PROPOSAL_AR.md) — separate proposed product and supplementary design source.
- [Governance package layout](../governance_packages/README.md) — references, candidates, historical copies, and incoming proposals.
- [Version inventory](governance/VERSION_INVENTORY.md) — registered package identities and storage paths.
- [INBOX procedure](governance/INBOX_PROCEDURE.md) — custody, review, dispositions, and reference-change comparison gate.
- [INBOX review, 2026-10-20](governance/INBOX_REVIEW_2026-10-20.md) — eight registered inputs and their proposed dispositions.
- [Updated 1.2.0 reference delivery](governance/REFERENCE_UPDATE_1_2_0.md) — source reconciliation, before/after state, exact diff, local checks and preserved candidate.
- [Skill governance 1.3.0 candidate plan](plans/SKILLS_GOVERNANCE_CANDIDATE_1_3_0.md) — authorized P0/P1/P2, defect/acceptance/compatibility matrix and isolated verification; reference 1.2.0 remains current.
- [Skill governance 1.3.0 candidate delivery](governance/SKILLS_CANDIDATE_1_3_0.md) — frozen ZIP, before/after diff, 320 package tests, 30 Studio tests, preservation and explicit native qualification gaps.

### Governance References (On-Demand Only)
- [AGHR 1.2.0 updated reference](../governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/README.md) — owner-directed reference with governed learning and classified instruction records.
- [AGHR 1.2.0 Rules Registry](../governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/registry/RULES.json) — 47 registered governance rules.
- [AGHR 1.2.0 Sources](../governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/sources/REGISTER.json) — 56 registered foundation sources.
- [AGHR Minimal 1.1.0 CORE](../governance_packages/archive/AGHR_Minimal_1.1.0/CORE.md) — Archived distilled specification for historical comparison.

---

## 3. Context Health & Maintenance
Run the health verifier before and after modifying documentation:
```sh
node tools/check_context_health.mjs
```
