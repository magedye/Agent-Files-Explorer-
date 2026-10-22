# مصفوفة استيعاب خط الأساس السابق

تعتمد المقارنة على النسخة السابقة المحفوظة في `pre-last-app-baseline/` والمدخلين المحددين في `before.json`. تمت مراجعة المتطلبات دلاليًا، وفصل ذلك عن فحوص البصمات والبنية وSQL. ليست هذه مراجعة مستقلة أو تأهيلًا للتطبيق.

## ملخص التغطية

| المجموعة | التغطية |
| --- | --- |
| مرجع AGHR | 18 قسمًا و6 ملاحق؛ الفروق تحريرية محددة فقط |
| أقسام Studio السابقة | 12/12 مع ربطها بالأقسام الجديدة |
| الالتزامات والشاشات والمقاييس | 12/12 و16/16 و10/10 |
| نموذج البيانات | جميع أعمدة الجداول الـ11 محفوظة مباشرة أو عبر 7 تحويلات موثقة؛ أضيف جدول تاريخ الموافقات |
| معايير القبول السابقة | 27 وظيفيًا و9 غير وظيفية، جميعها مرتبطة أدناه |
| الفجوات المتبقية في الاستيعاب | لا توجد؛ توجد 4 أسئلة عقود موروثة لمرحلة Phase 0 في الملحق G.4 |

## ربط أقسام Studio

| القسم السابق | الأقسام الحالية |
| --- | --- |
| 1. Identity and Mandatory Commitments | 1, 3, G.1 |
| 2. Product Model | 4, G.1 |
| 3. Data Model (SQLite — Updated for rc.3 Consolidated) | 5, 10, G.2 |
| 4. Screens (Updated — 16 Screens) | 11, 26 |
| 5. Key Interaction Details | 11, 22 |
| 6. Change and Approval Path | 4, 21, 33, 44 |
| 7. Technical Architecture | 41, 44 |
| 8. Metrics Mapping (§17 → Screens) | 25, G.3 |
| 9. Execution Plan (7 Phases — Updated) | 45 |
| 10. Acceptance Criteria (Fixed Numbering) | 47, 48 |
| 11. Risks and Mitigation (Unchanged from v3) | 49 |
| 12. Final Decision | 45, 46, G.4 |

## معايير القبول السابقة بندًا بندًا

| المعرّف | المتطلب السابق | الحالة | معيار النسخة المدمجة |
| --- | --- | --- | --- |
| F01 | Every instruction and capability traceable to source + version | COVERED | [fa-01](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F02 | `authority.level` visible + filterable on every MUST/MUST_NOT | COVERED | [fa-02](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F03 | `impact.evidence` visible with distinct colors per class | COVERED | [fa-04](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F04 | Language never hides an item; translation optional with badge | COVERED | [fa-06](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F05 | Validation consistent between editor and `aghr` (no discrepancies) | MAPPED | [fa-07](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F06 | Generation ≤ `budgetBytes`; stage (`full`/`compress`/`compact`/`fail`) visible; P0 preserved in every stage except `fail` | RESTORED | [fa-27](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F07 | `PRIN-007` present in every `AGENTS.md` at L1+ | COVERED | [fa-09](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F08 | `task_criteria` consumed in verification (not merely accepted) | RESTORED | [fa-28](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F09 | `BLOCKED`, `NO_SKILL_MATCH`, `UNKNOWN_ID`, `DISCOVERY_UNAVAILABLE` visually + semantically distinct | COVERED | [fa-12](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F10 | `DISCOVERY_UNAVAILABLE` triggers halt recommendation, not silent fallback | COVERED | [fa-13](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F11 | `NOT_OBSERVABLE` displayed as valid (gray), not error | COVERED | [fa-14](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F12 | `HOST_SIGNAL` never fabricated | COVERED | [fa-14](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F13 | Qualification invalidated on change to: `host`, `hostVersion`, `scope`, `contentHash` | RESTORED | [fa-11](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F14 | Approval tied to `version_hash`; any proposal change invalidates it | MAPPED | [fa-15](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F15 | `state.json` unwritable by Studio (regression test) | COVERED | [fa-16](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F16 | `runtime_evidence` displayed + attachable to PR, never directly merged into `state.json` | COVERED | [fa-17](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F17 | `mergeEffect: blocking` requires existing `gate.required: true` (verified via `aghr doctor`) | COVERED | [fa-18](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F18 | Declared adoption controls actually enforced (no false claims) | RESTORED | [fa-29](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F19 | UI works in Arabic and English in isolated Microsoft Edge | RESTORED | [fa-22](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F20 | Local test results separated from host qualification, independent review, and release acceptance | COVERED | [fa-23](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F21 | 100% honesty checks separated from ≥95% behavioral tolerance | RESTORED | [fa-24](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F22 | `eval`/`qualify` governed by timeout + memory limits; `resource_limit_exceeded` state exists | MAPPED | [fa-25](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F23 | **NEW:** "Review Due" badge visible for items past `nextReview` | COVERED | [fa-05](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F24 | **NEW:** Impact Calibration workflow available; requires linked passed eval run | COVERED | [fa-19](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F25 | **NEW:** Meta-Governance screen routes §16.1 and §16.2 changes correctly | RESTORED | [fa-20](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F26 | **NEW:** All 10 §17 metrics visible in Metrics screen | COVERED | [fa-21](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| F27 | **NEW:** False-success rate = 0% enforced as P0 indicator | COVERED | [fa-21](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N01 | Cold start < 3 seconds | COVERED | [nfa-01](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N02 | Indexing 500 items < 5 seconds | COVERED | [nfa-02](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N03 | In-process `validate` < 2 seconds | MAPPED | [nfa-03](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N04 | File watcher constrained (debounce + extension filter + exclude `node_modules`, `.git`, `__pycache__`) | COVERED | [nfa-04](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N05 | GPG signing optional with fallback + visible warning | COVERED | [nfa-05](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N06 | Every write preceded by diff preview | COVERED | [fa-26](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N07 | Server-side authorization on every request, bound to project + action + change | RESTORED | [nfa-09](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N08 | No command injection via job-runner (fixed allowlist) | COVERED | [nfa-08](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |
| N09 | E2E tests (Playwright) cover critical paths | RESTORED | [nfa-10](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) |

COVERED: محفوظ؛ RESTORED: أعيد التصريح به أو استُكمل؛ MAPPED: تغيّر التمثيل مع حفظ الالتزام. متطلب سرعة validate بقي أقل من ثانيتين، ويستخدم محرك Python الواحد بدل فرض محرك Node مكرر. اختبارات المضيفين والتنفيذ ومعايير القبول نفسها لم تُنفذ بهذا الاعتماد.

## توافق الحقول

راجع الملحق G.2 للتحويلات السبعة، وحقول المصدر والمخرجات الخام والمقاييس والدور المحاكى المستعادة. يتحقق `verify-documents.mjs` من كل عمود سابق، وكل جدول ومرساة، وينشئ سجلًا آليًا مستقلًا عن هذا التلخيص.

القرارات الموروثة التي تحتاج توضيح عقد Phase 0: دليل HOST_SIGNAL؛ صياغة JSONL؛ فصل سلطة النص عن هوية المصدِر؛ وتأهيل المحولات والقيود والتوزيع. لم يُغيَّر مرجع الحزمة لإخفاء هذه المسائل.
