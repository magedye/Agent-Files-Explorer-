# AGHR Studio — Sovereign Owner Decision Register
## Workstream: AFE-GOV-LEGACY-RECONCILE-002, AFE-GOV-POST-RECONCILE-004, AFE-GOV-ASSURANCE-CORRECTION-005 & AFE-GOV-OWNER-DECISIONS-006

**Register ID:** `OWNER-DECISION-REGISTER-2026-11-07`  
**Governing Authority:** Sovereign Project Owner  
**Repository:** `D:\APP\Agent-Files-Explorer` on `main`  
**Date of Ratification:** 2026-11-07  
**Overall Status:** `OWNER_APPROVED / RATIFIED`  
**Ratification Authority:** Explicit sovereign owner directive under `AFE-GOV-OWNER-DECISIONS-006`

---

## 1. Master Decision Register (10 Core Adjudications — Fully Ratified)

| Decision ID | Source Context | Core Obligation / Subject | Coverage Rating | Concrete Repo Evidence | Architectural Impact & Functional Gaps | Ratified Owner Decision | Ratification Status |
|---|---|---|---|---|---|---|---|
| **DEC-001** | AGHR-017 / AGHR 1.2.0 | Separate implementation, verification, review, release acceptance and activation; never self-grant independent authority. | `ARCHITECTURAL_SUBSTITUTION_WITH_DOCUMENTED_BOUNDARIES` | `GOV-009, GOV-022, tests/baseline_v1_adoption.test.mjs, tests/sgo_integration.test.mjs (ADV-01, AC-35)` | Eliminates simulated staff prompt role-play. Replaced by GOV-022 separation and fail-closed owner gate. Real owner auth unprovisioned. | **اعتماد الاستبدال:** إلغاء محاكاة طاقم المراجعة الوهمي داخل الوكيل الواحد، والإبقاء على فصل التنفيذ والتحقق والقبول وفق `GOV-022`، دون اعتبار الاختبارات الآلية مراجعة بشرية مستقلة. | `OWNER_APPROVED` |
| **DEC-002** | AGHR 1.2.0 CLI3 / SQLite | Capture change intake and governance decision state in a centralized 12-table SQLite relational database. | `ARCHITECTURAL_SUBSTITUTION_WITH_DOCUMENTED_GAPS` | `server/governance.js, schemas/trace.schema.json, agdl CLI, Git commit lineage` | Replaces SQLite with Git/JSON and agdl. Documented gaps: loss of dynamic SQL joins, DB-level foreign keys, daemon transaction locks. | **قبول Git/JSON مع توثيق الفجوات:** اعتماد Git/JSON و`agdl` بديلًا تشغيليًا للمسار التاريخي CLI3/SQLite، مع الاحتفاظ بسجل الفجوات الوظيفية وعدم ادعاء تكافؤ شامل أو حذف الأصول التاريخية. | `OWNER_APPROVED` |
| **DEC-003** | INBOX/NEW/FAST-TRACK.txt | Draft proposal to append fast-track instructions and binding authority clauses directly into root AGENTS.md. | `SUPERSEDED_AND_REJECTED` | `AGENTS.md (4.2 KB / ~1,156 tokens), tools/check_context_health.mjs` | Preserves AGENTS.md under token budget (<5,000 bootstrap context). Prevents instruction bloat. | **استبعاد المقترح:** إغلاق مقترح `FAST-TRACK` بوصفه غير معتمد للإدراج في `AGENTS.md`، مع حفظ أصله وسجل القرار. | `OWNER_APPROVED` |
| **DEC-004** | AGHR rc.3 Core Candidate | Pinned official local release reference for AGHR Studio v1.0.0 local operations, frozen JSON schemas. | `COVERED_AND_PINNED` | `AGHR_Studio_1.0.0_rc3_RELEASE.json, OWNER_SIGNOFF_AR.md, server/api.js, server/security.js` | Preserves Studio v1.0.0 closed release stability (`DEFAULT_PACKAGE_ID = "aghr_rc3"`), while v1.4.0 serves new workflows (`DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"`). | **الإبقاء على المرجع المزدوج:** استمرار `aghr_rc3` لعقود Studio v1.0.0 التاريخية، و`aghr_1_4_0` كخط أساس هندسي للمسارات الجديدة ضمن النطاق المحدد. | `OWNER_APPROVED` |
| **DEC-005** | AAPES v2.1 Candidate | 48 atomic normative requirements across 12 domains (ISO 29148 / BCP 14) with OPA Rego policies and Python evaluator. | `REFER_AS_DIAGNOSTIC_ORACLE` | `AAPES_REQUIREMENTS_MATRIX.json, requirements_trace.csv, framework.yaml` | Retained as Layer 5 offline diagnostic framework; no OPA PEP/PDP interceptors activated in production. | **مرجع تشخيصي اختياري:** الإبقاء على AAPES v2.1 مرجعًا لتقييم وهندسة السياسات، دون ترقيته إلى قواعد تشغيلية ملزمة أو تفعيل محركات إنفاذ. | `OWNER_APPROVED` |
| **DEC-006** | Packet 2A (Rule Engineer) | Bilingual Arabic/English rule authoring and text linting utility (`lint_rule.py`, `validate_skill.py`) using pure Python standard library. | `IMPLEMENTED_OPTIONAL_TOOL` | `tools/enterprise-agent-governance-rule-engineer/ (12/12 unit tests passing, zero external dependencies)` | Zero-dependency developer CLI tool; zero effect on production server; not included in CI or mandatory preflight. | **الإبقاء عليه أداة اختيارية:** استمرار إتاحة Rule Engineer 2A أداة فحص محلية غير إلزامية، دون تشغيل تلقائي أو إضافتها إلى بوابات CI/Git. | `OWNER_APPROVED` |
| **DEC-007** | Packet 2B (Arabic Profile) | Operational Arabic directives extracted from MARSAD constitutions (bounded autonomy, clear report language, branch hygiene). | `IMPLEMENTED_OPTIONAL_PROFILE` | `docs/profiles/arabic_operational_adapter.md (< 800 tokens, explicit MARSAD project isolation disclaimer)` | Localized prompt adapter profile; strictly isolated from other projects; never injected into default bootstrap. | **إتاحته عند الطلب:** استمرار إتاحة Arabic Operational Adapter 2B عند الحاجة، دون تحميل تلقائي أو نقل تعليمات MARSAD الخاصة إلى مشاريع أخرى. | `OWNER_APPROVED` |
| **DEC-008** | Packet 2C (AAPES Benchmark) | Offline diagnostic benchmark grading rules against 48 AAPES requirements with explicit evidence and uncertainty reporting. | `IMPLEMENTED_DIAGNOSTIC_ORACLE` | `tools/aapes_benchmark/assess_policies.py, test_benchmark.py (8/8 unit tests passing)` | Informative diagnostic oracle only; scores do not confer compliance or runtime gating. | **إتاحته تشخيصيًا:** استمرار إتاحة AAPES Benchmark 2C أداة تشخيصية اختيارية، دون اعتبار درجاتها اعتمادًا تنظيميًا أو جعلها شرطًا عامًا للتنفيذ. | `OWNER_APPROVED` |
| **DEC-009** | PEP/PDP Runtime Interceptors | Interception mechanisms gating tool calls, file writes, and outbound network traffic based on active policy engine. | `MAINTAINED_DORMANT` | `server/security.js, policies/production_write.rego` | Keeps PEP/PDP strictly inactive (`NOT_ACTIVE`) to prevent workflow deadlocks; native security barriers remain active. | **استمرار عدم التفعيل:** إبقاء PEP/PDP والاعتراض التشغيلي الإضافي غير مفعّل، دون تعطيل أي حماية أصلية موجودة في المنصة أو التطبيق. | `OWNER_APPROVED` |
| **DEC-010** | Historical Reconciliation Closeout | Formal adoption and closeout of historical reconciliation audit, 47-rule decoupled assurance matrix, authority hierarchy, and packets. | `CANONICAL_CLOSEOUT` | `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_FINAL_REPORT.md, docs/governance/AFE_GOV_47_RULES_GRANULAR_COVERAGE_MATRIX.md` | Establishes Baseline v1 (v1.4.0 + ADEQ 1.1) as engineering standard; closes workstream within disclosed evidence. | **اعتماد الإغلاق ضمن حدود الأدلة:** اعتماد إغلاق مسار التوفيق التاريخي ضمن الأدلة المثبتة، مع المحافظة على القيود والفجوات والاستثناءات المعلنة وعدم تحويل النتائج غير المثبتة إلى نجاح. | `OWNER_APPROVED` |

---

## 2. Granular Adjudication Dossiers & Ratification Records

### DEC-001 — Adjudication Dossier: AGHR-017 / AGHR 1.2.0 (registry/RULES.json)
- **Original Obligation / Proposal:** Separate implementation, verification, review, release acceptance and activation; never self-grant independent authority (historically specified as simulated 3-role staff: developer vs reviewer).
- **Coverage Status:** `ARCHITECTURAL_SUBSTITUTION_WITH_DOCUMENTED_BOUNDARIES`
- **Repository Evidence:** `GOV-009, GOV-022, tests/baseline_v1_adoption.test.mjs, tests/sgo_integration.test.mjs (ADV-01, AC-35)`
- **Architectural Impact:** High: Transforms internal verification model from synthetic prompt persona simulation to automated local tests + authentic owner sign-off.
- **Documented Assurance Boundary:** Test `ADV-01` proves fail-closed defense against unprovisioned synthetic client calls over HTTP (returning 403 `BLOCKED_UNPROVISIONED_OWNER_AUTH`). It does **NOT** prove that real owner identity, cryptographic authentication (e.g. mTLS, WebAuthn, FIDO2, or asymmetric PGP/SSH keys), or live human consent are provisioned. Production owner authentication is intentionally dormant and unprovisioned.
- **Ratified Option:** Option B (Solo Developer model with GOV-022 system boundary).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: اعتماد إلغاء محاكاة طاقم المراجعة الوهمي داخل الوكيل الواحد، والإبقاء على فصل التنفيذ والتحقق والقبول وفق GOV-022، دون اعتبار الاختبارات الآلية مراجعة بشرية مستقلة.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-002 — Adjudication Dossier: AGHR 1.2.0 CLI3 / SQLite Database
- **Original Obligation / Proposal:** Capture change intake and governance decision state in a centralized 12-table SQLite relational database managed by Python cli3 subprocess daemon.
- **Coverage Status:** `ARCHITECTURAL_SUBSTITUTION_WITH_DOCUMENTED_GAPS`
- **Repository Evidence:** `server/governance.js, schemas/trace.schema.json, agdl CLI, Git commit lineage`
- **Architectural Impact:** Eliminates native SQLite runtime dependency and heavy subprocess overhead in favor of pure Node.js, zero-dep Python agdl, and Git tree hashing.
- **Identified Functional Gaps:**
  1. *Dynamic SQL Joins:* Loss of multi-table relational queries from CLI; filtering requires custom scripts or application iteration.
  2. *Database-Engine Foreign Keys:* Relies on schema validation and application-level checks across JSON files rather than SQLite engine foreign key enforcement.
  3. *Daemon Transaction Locks:* Replaces SQLite file-level locking (`BEGIN IMMEDIATE`) with Git index locks and atomic file overwrites.
- **Documented Gains:** Zero native C-extension dependencies, human-readable Git diffs, and content-addressable commit history. Historical SQLite schemas preserved in `governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/`.
- **Ratified Option:** Option B (Git/JSON canonical history + agdl with disclosed functional gaps).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: اعتماد Git/JSON وagdl بديلًا تشغيليًا للمسار التاريخي CLI3/SQLite، مع الاحتفاظ بسجل الفجوات الوظيفية وعدم ادعاء تكافؤ شامل أو حذف الأصول التاريخية.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-003 — Adjudication Dossier: INBOX/NEW/FAST-TRACK.txt
- **Original Obligation / Proposal:** Draft proposal to append fast-track instructions and binding authority clauses directly into root AGENTS.md.
- **Coverage Status:** `SUPERSEDED_AND_REJECTED`
- **Repository Evidence:** `AGENTS.md (4.2 KB / ~1,156 tokens), tools/check_context_health.mjs`
- **Architectural Impact:** Modifying AGENTS.md directly risks breaching the strict 5,000 bootstrap context limit (currently ~4,598 tokens).
- **Preservation Note:** The proposal file remains archived in `governance_packages/INBOX/NEW/FAST-TRACK.txt` with zero deletion.
- **Ratified Option:** Option B (Retire FAST-TRACK.txt proposal; preserve AGENTS.md bounded).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: إغلاق مقترح FAST-TRACK بوصفه غير معتمد للإدراج في AGENTS.md، مع حفظ أصله وسجل القرار.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-004 — Adjudication Dossier: AGHR rc.3 Core Candidate (governance_packages/candidates/AGHR_rc3_Core_Candidate)
- **Original Obligation / Proposal:** Pinned official local release reference for AGHR Studio v1.0.0 local operations, frozen JSON schemas, and local reference-state observation.
- **Coverage Status:** `COVERED_AND_PINNED`
- **Repository Evidence:** `AGHR_Studio_1.0.0_rc3_RELEASE.json, OWNER_SIGNOFF_AR.md, server/api.js, server/security.js`
- **Architectural Impact:** Maintains stability of Studio v1.0.0 closed release (`DEFAULT_PACKAGE_ID = "aghr_rc3"`) while v1.4.0 serves new application workflows (`DEFAULT_BASELINE_PACKAGE_ID = "aghr_1_4_0"`).
- **Ratified Option:** Option B (Maintain dual-reference architecture).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: استمرار aghr_rc3 لعقود Studio v1.0.0 التاريخية، وaghr_1_4_0 كخط أساس هندسي للمسارات الجديدة ضمن النطاق المحدد.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-005 — Adjudication Dossier: AAPES v2.1 Candidate (governance_packages/candidates/AAPES_v2.1_Candidate)
- **Original Obligation / Proposal:** 48 atomic normative requirements across 12 domains (ISO 29148 / BCP 14) with OPA Rego policies and Python readiness evaluator.
- **Coverage Status:** `REFER_AS_DIAGNOSTIC_ORACLE`
- **Repository Evidence:** `AAPES_REQUIREMENTS_MATRIX.json, requirements_trace.csv, framework.yaml`
- **Architectural Impact:** Positioned as an unpromoted candidate policy engineering framework and diagnostic oracle (Layer 5). No runtime PEP/PDP interceptors activated.
- **Ratified Option:** Option B (Retain AAPES v2.1 as Layer 5 diagnostic oracle; keep PEP/PDP inactive).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: الإبقاء على AAPES v2.1 مرجعًا لتقييم وهندسة السياسات، دون ترقيته إلى قواعد تشغيلية ملزمة أو تفعيل محركات إنفاذ.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-006 — Adjudication Dossier: Candidate Packet 2A (tools/enterprise-agent-governance-rule-engineer/)
- **Original Obligation / Proposal:** Bilingual Arabic/English rule authoring and text linting utility (lint_rule.py, validate_skill.py) using pure Python standard library.
- **Coverage Status:** `IMPLEMENTED_OPTIONAL_TOOL`
- **Repository Evidence:** `tools/enterprise-agent-governance-rule-engineer/ (12/12 unit tests passing, zero external dependencies)`
- **Architectural Impact:** Zero-dependency offline preflight tool for rule authors; zero effect on production server; not included in CI or mandatory preflight.
- **Ratified Option:** Option B (Keep as optional developer utility).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: استمرار إتاحة Rule Engineer 2A أداة فحص محلية غير إلزامية، دون تشغيل تلقائي أو إضافتها إلى بوابات CI/Git.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-007 — Adjudication Dossier: Candidate Packet 2B (docs/profiles/arabic_operational_adapter.md)
- **Original Obligation / Proposal:** Operational Arabic directives extracted from MARSAD constitutions (bounded autonomy, clear report language, branch hygiene) with project isolation.
- **Coverage Status:** `IMPLEMENTED_OPTIONAL_PROFILE`
- **Repository Evidence:** `docs/profiles/arabic_operational_adapter.md (< 800 tokens, explicit MARSAD project isolation disclaimer)`
- **Architectural Impact:** Localized prompt adapter for Arabic coding sessions without altering English technical baseline. Explicitly isolated from general authority.
- **Ratified Option:** Option B (Adopt on-demand Arabic adapter profile).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: استمرار إتاحة Arabic Operational Adapter 2B عند الحاجة، دون تحميل تلقائي أو نقل تعليمات MARSAD الخاصة إلى مشاريع أخرى.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-008 — Adjudication Dossier: Candidate Packet 2C (tools/aapes_benchmark/assess_policies.py)
- **Original Obligation / Proposal:** Offline diagnostic benchmark grading a repository's governance rules against the 48 AAPES requirements with explicit evidence and uncertainty reporting.
- **Coverage Status:** `IMPLEMENTED_DIAGNOSTIC_ORACLE`
- **Repository Evidence:** `tools/aapes_benchmark/assess_policies.py, test_benchmark.py (8/8 unit tests passing, robust handling of malformed inputs)`
- **Architectural Impact:** Informative diagnostic oracle only; scores do not confer compliance or runtime gating.
- **Ratified Option:** Option B (Provide as optional offline diagnostic utility).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: استمرار إتاحة AAPES Benchmark 2C أداة تشخيصية اختيارية، دون اعتبار درجاتها اعتمادًا تنظيميًا أو جعلها شرطًا عامًا للتنفيذ.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-009 — Adjudication Dossier: Runtime Policy Enforcement Points (PEP/PDP) & External Agent Runtimes
- **Original Obligation / Proposal:** Interception mechanisms gating tool calls, file writes, and outbound network traffic based on active policy engine.
- **Coverage Status:** `MAINTAINED_DORMANT`
- **Repository Evidence:** `server/security.js, policies/production_write.rego`
- **Architectural Impact:** Maintains PEP/PDP interceptors strictly inactive (`NOT_ACTIVE` / `NOT_IMPLEMENTED`). Native server security controls (path traversal checks, approved roots) remain intact.
- **Ratified Option:** Option B (Maintain PEP/PDP strictly dormant).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: إبقاء PEP/PDP والاعتراض التشغيلي الإضافي غير مفعّل، دون تعطيل أي حماية أصلية موجودة في المنصة أو التطبيق.
Verification Status: VERIFIED_WITHOUT_UNPROVISIONED_CLAIMS
```

---
### DEC-010 — Adjudication Dossier: Historical Governance Reconciliation Deliverables
- **Original Obligation / Proposal:** Formal adoption and closeout of the historical reconciliation audit, 47-rule decoupled assurance matrix, authority hierarchy, and candidate enhancement packets.
- **Coverage Status:** `CANONICAL_CLOSEOUT_RATIFIED`
- **Repository Evidence:** `docs/governance/AFE_GOV_LEGACY_RECONCILE_002_FINAL_REPORT.md, docs/governance/AFE_GOV_47_RULES_GRANULAR_COVERAGE_MATRIX.md`
- **Architectural Impact:** Establishes Baseline v1 (v1.4.0 + ADEQ 1.1) as the unified engineering standard; closes workstream within disclosed evidence and documented gaps.
- **Ratified Option:** Option B (Grant formal sovereign owner sign-off and close workstream within disclosed limitations).

```markdown
SOVEREIGN OWNER ADJUDICATION RECORD:
[X] RATIFIED & APPROVED (Option B)
Ratification Authority: Explicit Sovereign Owner Directive (AFE-GOV-OWNER-DECISIONS-006)
Ratification Date: 2026-11-07
Binding Operational Terms: اعتماد إغلاق مسار التوفيق التاريخي ضمن الأدلة المثبتة، مع المحافظة على القيود والفجوات والاستثناءات المعلنة وعدم تحويل النتائج غير المثبتة إلى نجاح.
Verification Status: OWNER_ACCEPTED_WITH_DISCLOSED_LIMITATIONS
```

---
