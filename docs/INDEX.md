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
- [Owner sign-off / PROJECT CLOSED](evidence/studio-signoff-2026-10-26/OWNER_SIGNOFF_AR.md) — Studio v1.0.0 official local Windows release;rc.3 default with1.2.0Legacy; no public release or further development.
- [Accepted T40 packet](evidence/studio-release-2026-10-25/T40_REPORT_AR.md) — immutable pre-sign-off report and ZIP; later owner sign-off supersedes its pending fields.
- [Draft mode](features/STUDIO_DRAFT_MODE.md) — Authorized CP storage, grants, audit and resource boundaries.
- [T19 MOCK delivery](evidence/studio-t19-mock-2026-10-24/README.md) — Owner-authorized SEC-001 cycle; native gates remain blocked.
- [E4 accepted plan](plans/STUDIO_E4_EXECUTION_PROPOSAL_AR.md) — Evaluation/skills scope; [E4 evidence](evidence/studio-e4-2026-10-24/README.md) separates real local core checks from native agent qualification.

### Architecture & Specification
- [Full upgrade plan](plans/STUDIO_FULL_PROJECT_UPGRADE_AR.md) — phases, tasks and gates; [contracts](contracts/aghr-rc3/README.md); [C1–C12](plans/STUDIO_PRODUCT_AND_CONTRACTS_AR.md).
- [Governance item review](reviews/aghr-items-2026-10-22/README.md) — complete extraction, editable tables, source custody and proposed migration fields.
- [Owner-accepted AGHR rc.3 and Studio designs](specs/aghr-rc3/README.md) — last-app baseline with full prior-requirement coverage; [adoption and archive receipt](governance/LAST_APP_ADOPTION_2026_10_22.md).
- [Arabic and English interface](features/INTERFACE_LANGUAGES.md) — language selector, saved preference, translation catalog and verification.
- [Phase 1 read-only Studio](features/STUDIO_PHASE1_READ_ONLY.md) — five bilingual screens, 16 routes, actual Python scope, frozen sample and zero-write evidence.
- [T12 mock / T13–T14 core](evidence/studio-t12-mock-write-core-2026-10-23/README.md) — signed 47-rule mock, real scoped authorization and isolated SQLite; [original drafts](evidence/studio-t12-2026-10-23/README.md) and accepted T11 preserved; no live writes.
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

- [E5 proposal core, T16 lifecycle and T17 dry-run evidence](evidence/studio-e5-t16-preview-2026-10-23/README.md) — current authorized Draft delivery; no source export or release acceptance.

- [E3/T17/T18 local execution and T19 canonical blockers](evidence/studio-e3-t19-2026-10-24/README.md) — actual bounded controls/approvals/patches; no E4 waiver or release acceptance.

- [Native adapters and T20/T21 Draft delivery](evidence/studio-native-t20-t21-2026-10-24/README.md):105 tests, authenticated run polling, runtime evidence, native NOT_RUN boundaries.

- [T22–T24 local delivery](evidence/studio-phase3-2026-10-24/README.md) — real skill lifecycle, native environmental blocker, PR-byte bundles and signed post-merge CI publisher; hosted publication NOT_RUN.

- [Phase4 Draft governance and learning](evidence/studio-phase4-2026-10-24/README.md) — T25–T29, same-CP adoption, safe intake, lesson proposals and live-eval calibration; no canonical promotion.

- [Phase5 metrics/settings](features/STUDIO_PHASE5_METRICS_SETTINGS.md) — actual project evaluator profile, ten honest metrics, reports and granted Draft settings; [delivery](evidence/studio-phase5-2026-10-24/README.md), [T34/T35 scope and steps](plans/STUDIO_T34_T35_PILOT_STEPS_AR.md).

- [T34/T35 sandbox delivery](evidence/studio-pilots-2026-10-25/README.md) — actual L2/L3 local-process pilots, protected local Git/CI,7+8 checks,151/151 regression and Edge/Sentinel; no native, production or release qualification.

- [Initial T36 acceptance aggregation](evidence/studio-t36-2026-10-25/README.md) — historical STARTED snapshot; use the completed T36 and current T40 receipts below.

## Unified Studio acceptance

- [تشغيل Studio العامة وحدود Draft](features/STUDIO_UNIFIED_ACCEPTANCE.md).
- [استكمال T36 وأدلة العقود والمتصفح](evidence/studio-t36-completion-2026-10-25/README.md) — دليل تقني محلي؛ اعتمده المالك لاحقًا وفق [قراره الحالي](governance/STUDIO_T37_T40_OWNER_DECISION_2026_10_25.md).

- [Windows installation](features/STUDIO_INSTALLATION.md) — internal wheel/pipx, prerequisites, local Draft storage and rollback; [owner Windows-only scope](governance/STUDIO_WINDOWS_SCOPE_2026_10_25.md).
- [Original T37 measurements](evidence/studio-t37-2026-10-25/README.md) — retained failed timing/load and72.35%coverage; superseded for current task disposition by [T37 closure](evidence/studio-release-2026-10-25/T37_CLOSURE.json),83.44%JS/MJS with owner-accepted limitations.

- [T38 Windows evidence](evidence/studio-t38-2026-10-25/README.md) — actual fresh-app pipx install/startup/403/token rotation; no release acceptance.
