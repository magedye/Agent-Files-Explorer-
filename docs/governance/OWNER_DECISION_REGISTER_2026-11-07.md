# AGHR Studio — Sovereign Owner Decision Register
## Workstream: AFE-GOV-LEGACY-RECONCILE-002 (Final Hardening)

**Register ID:** `OWNER-DECISION-REGISTER-2026-11-07`  
**Governing Authority:** Sovereign Project Owner  
**Repository:** `D:\APP\Agent-Files-Explorer` on `main`  
**Date of Issuance:** 2026-11-07  
**Overall Status:** `PENDING_SOVEREIGN_ADJUDICATION`

---

## 1. Master Decision Register (10 Core Adjudications)

| Decision ID | Source Context | Core Obligation / Subject | Coverage Rating | Concrete Repo Evidence | Architectural Impact | Primary Risks | Practical Alternatives | Engineering Recommendation | Decision Status |
|---|---|---|---|---|---|---|---|---|---|
| **DEC-001** | AGHR-017 / AGHR 1.2.0 (registry/RULES.json) | Separate implementation, verification, review, release acceptance and activation; never self-grant independent authority (historically specified as simulated 3-role staff: developer vs reviewer). | `PARTIAL` | `GOV-009, GOV-022, tests/baseline_v1_adoption.test.mjs` | High: Transforms internal verification model from synthetic multi-persona dialogue to automated test suites and real human owner review. | Synthetic personas can hallucinate consensus or collude to pass flawed code; creates false illusion of independent third-party audit. | Option A: Maintain legacy simulated 3-role personas in prompts.<br>Option B: Formally approve SOLO_DEVELOPER_ONE_PRIMARY_AGENT model with GOV-022 anti-collusion rule.<br>Option C: Require external multi-agent framework invocation. | **Approve Option B: Officially retire simulated staff role-play and enforce GOV-022.** | `PENDING_OWNER_DECISION` |
| **DEC-002** | AGHR 1.2.0 CLI3 / SQLite Database | Capture change intake and governance decision state in a centralized 12-table SQLite relational database managed by Python cli3 subprocess daemon. | `PARTIAL` | `server/governance.js, schemas/trace.schema.json, agdl CLI` | High: Eliminates native SQLite runtime dependency and heavy subprocess overhead in favor of pure Node.js and zero-dep Python agdl. | Relational SQL queries on historical rules require custom scripts rather than standard sqlite3 CLI commands. | Option A: Re-implement SQLite database daemon and Python cli3 runner.<br>Option B: Formally deprecate CLI3; rely on Git canonical history and JSON schemas.<br>Option C: Hybrid model retaining SQLite as read-only snapshot. | **Approve Option B: Deprecate CLI3 subprocess runner; rely on zero-dependency agdl and Git canonical commit logs.** | `PENDING_OWNER_DECISION` |
| **DEC-003** | INBOX/NEW/FAST-TRACK.txt | Draft proposal to append fast-track instructions and binding authority clauses directly into root AGENTS.md. | `SUPERSEDED` | `AGENTS.md (4.2 KB / ~1,156 tokens), tools/check_context_health.mjs` | Medium: Modifying AGENTS.md directly risks breaching the strict 5,000 bootstrap context limit (currently ~4,721 tokens). | Inflating AGENTS.md violates Layer 1 progressive disclosure policy and increases token cost across every session. | Option A: Append FAST-TRACK.txt into AGENTS.md.<br>Option B: Formally retire FAST-TRACK.txt; keep AGENTS.md compact and rely on docs/status/CURRENT.md for dynamic tasks.<br>Option C: Move fast-track text into a separate skill. | **Approve Option B: Retire FAST-TRACK.txt proposal; preserve AGENTS.md under token budget.** | `PENDING_OWNER_DECISION` |
| **DEC-004** | AGHR rc.3 Core Candidate (governance_packages/candidates/AGHR_rc3_Core_Candidate) | Pinned official local release reference for AGHR Studio v1.0.0 local operations, frozen JSON schemas, and local reference-state observation. | `COVERED` | `AGHR_Studio_1.0.0_rc3_RELEASE.json, OWNER_SIGNOFF_AR.md, server/api.js` | Critical: Maintains stability of Studio v1.0.0 closed release and protects existing tests from regression. | Migrating legacy Studio v1.0.0 endpoints to v1.4.0 could break frozen contracts or invalidate accepted evidence. | Option A: Migrate all Studio v1.0.0 endpoints to v1.4.0 schemas.<br>Option B: Maintain dual-reference architecture (aghr_rc3 for closed studio endpoints; aghr_1_4_0 for new application workflows).<br>Option C: Deprecate aghr_rc3 completely. | **Approve Option B: Maintain dual-reference architecture; preserve aghr_rc3 for Studio v1.0.0 intact.** | `PENDING_OWNER_DECISION` |
| **DEC-005** | AAPES v2.1 Candidate (governance_packages/candidates/AAPES_v2.1_Candidate) | 48 atomic normative requirements across 12 domains (ISO 29148 / BCP 14) with OPA Rego policies and Python readiness evaluator. | `REFER` | `AAPES_REQUIREMENTS_MATRIX.json, requirements_trace.csv, framework.yaml` | High: Positioned as an unpromoted candidate policy engineering framework and diagnostic oracle. | Premature activation of OPA Rego policies would create non-standard PEP/PDP gates that disrupt solo development. | Option A: Promote AAPES v2.1 to active baseline and enforce Rego gates.<br>Option B: Retain AAPES v2.1 as an unpromoted Layer 5 diagnostic evaluation oracle without runtime gating.<br>Option C: Archive AAPES v2.1 completely. | **Approve Option B: Retain AAPES v2.1 as Layer 5 diagnostic oracle; keep PEP/PDP inactive.** | `PENDING_OWNER_DECISION` |
| **DEC-006** | Candidate Packet 2A (Enterprise Rule Engineer Skill v1.0.0.zip) | Bilingual Arabic/English rule authoring and text linting utility (lint_rule.py, validate_skill.py) using pure Python standard library. | `COMPLEMENTARY` | `Enterprise_Agent_Governance_Rule_Engineer_Skill_v1.0.0.zip (SHA-256: 90b7931f...)` | Low: Provides a zero-dependency offline preflight tool for rule authors; zero effect on production server. | Misinterpreting heuristic lint passes as formal regulatory compliance. | Option A: Leave skill compressed in INBOX/NEW.<br>Option B: Extract linting scripts into tools/rule_engineer/ as a verified developer utility.<br>Option C: Port Python scripts into JavaScript. | **Approve Option B: Extract to tools/rule_engineer/ and integrate with agdl rules-lint.** | `PENDING_OWNER_DECISION` |
| **DEC-007** | Candidate Packet 2B (MARSAD Executive Constitution & Guidance) | Operational Arabic directives extracted from MARSAD constitutions (bounded autonomy, clear report language, branch hygiene). | `PARTIAL` | `governance_packages/INBOX/MARSAD — الدستور التنفيذي...md, MARSAD_Agent_Language_Guide.md` | Low: Provides a localized prompt adapter for Arabic coding sessions without altering English technical baseline. | Prompt bloat if Arabic instructions are concatenated into global bootstrap prompts. | Option A: Keep MARSAD documents as unparsed intake files.<br>Option B: Formulate docs/profiles/arabic_operational_adapter.md (< 800 tokens) for on-demand use.<br>Option C: Translate entire AGHR v1.4.0 into Arabic. | **Approve Option B: Author compact, on-demand Arabic adapter profile docs/profiles/arabic_operational_adapter.md.** | `PENDING_OWNER_DECISION` |
| **DEC-008** | Candidate Packet 2C (AAPES Diagnostic Policy Benchmark) | Offline diagnostic benchmark grading a repository's governance rules against the 48 AAPES requirements (R0 through R3 readiness). | `COMPLEMENTARY` | `candidates/AAPES_v2.1_Candidate/tools/assess_readiness.py` | Low: Generates informative JSON readiness reports; zero runtime gating. | Over-focusing on formal specification metrics over working code health. | Option A: Discard benchmark script.<br>Option B: Provide optional offline benchmark in tools/aapes_benchmark/.<br>Option C: Mandate benchmark pass for every git commit. | **Approve Option B: Provide as optional offline diagnostic utility.** | `PENDING_OWNER_DECISION` |
| **DEC-009** | Runtime Policy Enforcement Points (PEP/PDP) & External Agent Runtimes | Interception mechanisms gating tool calls, file writes, and outbound network traffic based on active policy engine. | `DEFERRED` | `server/security.js, policies/production_write.rego` | Extreme: Runtime interception can block development workflows, cause deadlock, and disrupt developer velocity. | False-positive permission denials, debugging complexity, unrecoverable halts. | Option A: Activate automated PEP/PDP interceptors.<br>Option B: Keep PEP/PDP interceptors strictly inactive (NOT_ACTIVE / NOT_IMPLEMENTED) until explicit sovereign directive.<br>Option C: Enable PEP in warning-only mode. | **Approve Option B: Maintain PEP/PDP strictly dormant; rely on developer review and git isolation.** | `PENDING_OWNER_DECISION` |
| **DEC-010** | Historical Governance Reconciliation Deliverables (AFE-GOV-LEGACY-RECONCILE-002) | Formal adoption and closeout of the historical reconciliation audit, 47-rule coverage matrix, and authority hierarchy. | `RETAIN` | `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_FINAL_REPORT.md, docs/status/CURRENT.md` | High: Formalizes the historical lineage and establishes Baseline v1 (v1.4.0 + ADEQ 1.1) as the unified engineering standard. | Uncertainty regarding which governance documents are binding vs advisory if left unapproved. | Option A: Reject reconciliation report and reopen analysis.<br>Option B: Formally sign off on reconciliation report and adopt the Owner Decision Register.<br>Option C: Defer sign-off indefinitely. | **Approve Option B: Grant formal sovereign owner sign-off and close workstream.** | `PENDING_OWNER_DECISION` |

---

## 2. Granular Adjudication Dossiers

### DEC-001 — Adjudication Dossier: AGHR-017 / AGHR 1.2.0 (registry/RULES.json)
- **Original Obligation / Proposal:** Separate implementation, verification, review, release acceptance and activation; never self-grant independent authority (historically specified as simulated 3-role staff: developer vs reviewer).
- **Coverage Status:** `PARTIAL`
- **Repository Evidence:** `GOV-009, GOV-022, tests/baseline_v1_adoption.test.mjs`
- **Architectural Impact:** High: Transforms internal verification model from synthetic multi-persona dialogue to automated test suites and real human owner review.
- **Risk Analysis:** Synthetic personas can hallucinate consensus or collude to pass flawed code; creates false illusion of independent third-party audit.
- **Alternatives Evaluated:**
  - Option A: Maintain legacy simulated 3-role personas in prompts.
  - Option B: Formally approve SOLO_DEVELOPER_ONE_PRIMARY_AGENT model with GOV-022 anti-collusion rule.
  - Option C: Require external multi-agent framework invocation.
- **Technical Recommendation:** Approve Option B: Officially retire simulated staff role-play and enforce GOV-022.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-002 — Adjudication Dossier: AGHR 1.2.0 CLI3 / SQLite Database
- **Original Obligation / Proposal:** Capture change intake and governance decision state in a centralized 12-table SQLite relational database managed by Python cli3 subprocess daemon.
- **Coverage Status:** `PARTIAL`
- **Repository Evidence:** `server/governance.js, schemas/trace.schema.json, agdl CLI`
- **Architectural Impact:** High: Eliminates native SQLite runtime dependency and heavy subprocess overhead in favor of pure Node.js and zero-dep Python agdl.
- **Risk Analysis:** Relational SQL queries on historical rules require custom scripts rather than standard sqlite3 CLI commands.
- **Alternatives Evaluated:**
  - Option A: Re-implement SQLite database daemon and Python cli3 runner.
  - Option B: Formally deprecate CLI3; rely on Git canonical history and JSON schemas.
  - Option C: Hybrid model retaining SQLite as read-only snapshot.
- **Technical Recommendation:** Approve Option B: Deprecate CLI3 subprocess runner; rely on zero-dependency agdl and Git canonical commit logs.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-003 — Adjudication Dossier: INBOX/NEW/FAST-TRACK.txt
- **Original Obligation / Proposal:** Draft proposal to append fast-track instructions and binding authority clauses directly into root AGENTS.md.
- **Coverage Status:** `SUPERSEDED`
- **Repository Evidence:** `AGENTS.md (4.2 KB / ~1,156 tokens), tools/check_context_health.mjs`
- **Architectural Impact:** Medium: Modifying AGENTS.md directly risks breaching the strict 5,000 bootstrap context limit (currently ~4,721 tokens).
- **Risk Analysis:** Inflating AGENTS.md violates Layer 1 progressive disclosure policy and increases token cost across every session.
- **Alternatives Evaluated:**
  - Option A: Append FAST-TRACK.txt into AGENTS.md.
  - Option B: Formally retire FAST-TRACK.txt; keep AGENTS.md compact and rely on docs/status/CURRENT.md for dynamic tasks.
  - Option C: Move fast-track text into a separate skill.
- **Technical Recommendation:** Approve Option B: Retire FAST-TRACK.txt proposal; preserve AGENTS.md under token budget.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-004 — Adjudication Dossier: AGHR rc.3 Core Candidate (governance_packages/candidates/AGHR_rc3_Core_Candidate)
- **Original Obligation / Proposal:** Pinned official local release reference for AGHR Studio v1.0.0 local operations, frozen JSON schemas, and local reference-state observation.
- **Coverage Status:** `COVERED`
- **Repository Evidence:** `AGHR_Studio_1.0.0_rc3_RELEASE.json, OWNER_SIGNOFF_AR.md, server/api.js`
- **Architectural Impact:** Critical: Maintains stability of Studio v1.0.0 closed release and protects existing tests from regression.
- **Risk Analysis:** Migrating legacy Studio v1.0.0 endpoints to v1.4.0 could break frozen contracts or invalidate accepted evidence.
- **Alternatives Evaluated:**
  - Option A: Migrate all Studio v1.0.0 endpoints to v1.4.0 schemas.
  - Option B: Maintain dual-reference architecture (aghr_rc3 for closed studio endpoints; aghr_1_4_0 for new application workflows).
  - Option C: Deprecate aghr_rc3 completely.
- **Technical Recommendation:** Approve Option B: Maintain dual-reference architecture; preserve aghr_rc3 for Studio v1.0.0 intact.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-005 — Adjudication Dossier: AAPES v2.1 Candidate (governance_packages/candidates/AAPES_v2.1_Candidate)
- **Original Obligation / Proposal:** 48 atomic normative requirements across 12 domains (ISO 29148 / BCP 14) with OPA Rego policies and Python readiness evaluator.
- **Coverage Status:** `REFER`
- **Repository Evidence:** `AAPES_REQUIREMENTS_MATRIX.json, requirements_trace.csv, framework.yaml`
- **Architectural Impact:** High: Positioned as an unpromoted candidate policy engineering framework and diagnostic oracle.
- **Risk Analysis:** Premature activation of OPA Rego policies would create non-standard PEP/PDP gates that disrupt solo development.
- **Alternatives Evaluated:**
  - Option A: Promote AAPES v2.1 to active baseline and enforce Rego gates.
  - Option B: Retain AAPES v2.1 as an unpromoted Layer 5 diagnostic evaluation oracle without runtime gating.
  - Option C: Archive AAPES v2.1 completely.
- **Technical Recommendation:** Approve Option B: Retain AAPES v2.1 as Layer 5 diagnostic oracle; keep PEP/PDP inactive.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-006 — Adjudication Dossier: Candidate Packet 2A (Enterprise Rule Engineer Skill v1.0.0.zip)
- **Original Obligation / Proposal:** Bilingual Arabic/English rule authoring and text linting utility (lint_rule.py, validate_skill.py) using pure Python standard library.
- **Coverage Status:** `COMPLEMENTARY`
- **Repository Evidence:** `Enterprise_Agent_Governance_Rule_Engineer_Skill_v1.0.0.zip (SHA-256: 90b7931f...)`
- **Architectural Impact:** Low: Provides a zero-dependency offline preflight tool for rule authors; zero effect on production server.
- **Risk Analysis:** Misinterpreting heuristic lint passes as formal regulatory compliance.
- **Alternatives Evaluated:**
  - Option A: Leave skill compressed in INBOX/NEW.
  - Option B: Extract linting scripts into tools/rule_engineer/ as a verified developer utility.
  - Option C: Port Python scripts into JavaScript.
- **Technical Recommendation:** Approve Option B: Extract to tools/rule_engineer/ and integrate with agdl rules-lint.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-007 — Adjudication Dossier: Candidate Packet 2B (MARSAD Executive Constitution & Guidance)
- **Original Obligation / Proposal:** Operational Arabic directives extracted from MARSAD constitutions (bounded autonomy, clear report language, branch hygiene).
- **Coverage Status:** `PARTIAL`
- **Repository Evidence:** `governance_packages/INBOX/MARSAD — الدستور التنفيذي...md, MARSAD_Agent_Language_Guide.md`
- **Architectural Impact:** Low: Provides a localized prompt adapter for Arabic coding sessions without altering English technical baseline.
- **Risk Analysis:** Prompt bloat if Arabic instructions are concatenated into global bootstrap prompts.
- **Alternatives Evaluated:**
  - Option A: Keep MARSAD documents as unparsed intake files.
  - Option B: Formulate docs/profiles/arabic_operational_adapter.md (< 800 tokens) for on-demand use.
  - Option C: Translate entire AGHR v1.4.0 into Arabic.
- **Technical Recommendation:** Approve Option B: Author compact, on-demand Arabic adapter profile docs/profiles/arabic_operational_adapter.md.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-008 — Adjudication Dossier: Candidate Packet 2C (AAPES Diagnostic Policy Benchmark)
- **Original Obligation / Proposal:** Offline diagnostic benchmark grading a repository's governance rules against the 48 AAPES requirements (R0 through R3 readiness).
- **Coverage Status:** `COMPLEMENTARY`
- **Repository Evidence:** `candidates/AAPES_v2.1_Candidate/tools/assess_readiness.py`
- **Architectural Impact:** Low: Generates informative JSON readiness reports; zero runtime gating.
- **Risk Analysis:** Over-focusing on formal specification metrics over working code health.
- **Alternatives Evaluated:**
  - Option A: Discard benchmark script.
  - Option B: Provide optional offline benchmark in tools/aapes_benchmark/.
  - Option C: Mandate benchmark pass for every git commit.
- **Technical Recommendation:** Approve Option B: Provide as optional offline diagnostic utility.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-009 — Adjudication Dossier: Runtime Policy Enforcement Points (PEP/PDP) & External Agent Runtimes
- **Original Obligation / Proposal:** Interception mechanisms gating tool calls, file writes, and outbound network traffic based on active policy engine.
- **Coverage Status:** `DEFERRED`
- **Repository Evidence:** `server/security.js, policies/production_write.rego`
- **Architectural Impact:** Extreme: Runtime interception can block development workflows, cause deadlock, and disrupt developer velocity.
- **Risk Analysis:** False-positive permission denials, debugging complexity, unrecoverable halts.
- **Alternatives Evaluated:**
  - Option A: Activate automated PEP/PDP interceptors.
  - Option B: Keep PEP/PDP interceptors strictly inactive (NOT_ACTIVE / NOT_IMPLEMENTED) until explicit sovereign directive.
  - Option C: Enable PEP in warning-only mode.
- **Technical Recommendation:** Approve Option B: Maintain PEP/PDP strictly dormant; rely on developer review and git isolation.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
### DEC-010 — Adjudication Dossier: Historical Governance Reconciliation Deliverables (AFE-GOV-LEGACY-RECONCILE-002)
- **Original Obligation / Proposal:** Formal adoption and closeout of the historical reconciliation audit, 47-rule coverage matrix, and authority hierarchy.
- **Coverage Status:** `RETAIN`
- **Repository Evidence:** `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_FINAL_REPORT.md, docs/status/CURRENT.md`
- **Architectural Impact:** High: Formalizes the historical lineage and establishes Baseline v1 (v1.4.0 + ADEQ 1.1) as the unified engineering standard.
- **Risk Analysis:** Uncertainty regarding which governance documents are binding vs advisory if left unapproved.
- **Alternatives Evaluated:**
  - Option A: Reject reconciliation report and reopen analysis.
  - Option B: Formally sign off on reconciliation report and adopt the Owner Decision Register.
  - Option C: Defer sign-off indefinitely.
- **Technical Recommendation:** Approve Option B: Grant formal sovereign owner sign-off and close workstream.

```markdown
SOVEREIGN OWNER ADJUDICATION BLOCK:
[ ] OPTION A ACCEPTED
[ ] OPTION B ACCEPTED (RECOMMENDED)
[ ] OPTION C ACCEPTED
[ ] REJECTED / MODIFIED: _____________________________________________
Owner Signature: _______________________ Date: _______________________
```

---
