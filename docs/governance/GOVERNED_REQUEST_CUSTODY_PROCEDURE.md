# إجراء العهدة المحكومة للطلبات المؤجلة والمستبعدة
## Governed Request Custody Procedure & Operational Gap Closure

**Document ID:** `AFE-GOV-REQUEST-CUSTODY-009-PROCEDURE`  
**Parent Directive:** `AFE-GOV-REQUEST-CUSTODY-009`  
**Governing Authority:** Sovereign Project Owner  
**Repository Baseline:** `Agent Governance & RCCA Kit EN v1.4.0 + ADEQ 1.1` (`Baseline v1`)  
**Status:** `APPROVED / PROCEDURE_IMPLEMENTED / ENFORCEMENT_VERIFIED`  
**Automated Verification:** `tests/request_custody.test.mjs` (10/10 Passing)  
**Tool Support:** `tools/request_custody.mjs`

---

## 1. الخلفية وسلطة المالك (Executive Authority & Decisions)

أقر المالك السيادي للمشروع بموجب التوجيه **`AFE-GOV-REQUEST-CUSTODY-009`** ما يلي:
1. **كفاية القواعد الأساسية:** المبادئ الأساسية للعهدة المحكومة للطلبات (`GOVERNED_REQUEST_CUSTODY`) مغطاة موضوعياً ضمن قواعد الحوكمة الحالية في خط الأساس `v1.4.0` و`AGHR 1.2.0`.
2. **حظر تضخيم القواعد:** لا تضاف أي قاعدة `GOV` أو `ADEQ` جديدة لمجرد إعادة صياغة الموجود، ولا يُنشأ نظام مستقل أو موازٍ لإدارة المهام.
3. **سد الفجوة التشغيلية فقط:** استكمال التغطية التشغيلية عبر توحيد تمثيل الطلبات المؤجلة (`Deferred Requests`) ببطاقة قياسية موحدة، وتحديد محددات انتقال الحالة لمنع التنفيذ التلقائي أو غسيل الصلاحيات.
4. **حماية ميزانية السياق (`DEC-003`):** عدم توسيع ملف `AGENTS.md` والالتزام بحدود السياق الإجمالي (< 5,000 رمز).

---

## 2. مصفوفة التغطية والفجوات (Coverage & Gap Matrix)

تقيّم هذه المصفوفة عناصر المقترح مقارنة بنصوص قواعد الحوكمة الأصلية المعتمدة، مع التمييز الدقيق بين مستويات الإثبات:

| عنصر البطاقة / الالتزام | المرجع والقاعدة الحاكمة | حالة التغطية في خط الأساس | الدليل والمسار في المستودع | الفجوة المحددة وكيف سُدّت | تصنيف الإثبات (Assurance Classification) |
|---|---|---|---|---|:---:|
| **معرّف الطلب (`Request ID`)** | `GOV-006`, `AGHR-029` | مغطى دلالياً | `templates/SHORT_REQUEST.md`, `schemas/trace.schema.json` | غياب بادئة قياسية موحدة للطلبات المؤجلة؛ اعتُمدت صيغة `REQ-<ID>` في `tools/request_custody.mjs`. | `PROCEDURE_IMPLEMENTED` |
| **الحالة المحددة (`Status`)** | `GOV-009` | مغطى دلالياً | `templates/INBOX_DISPOSITION.md`, `server/governance.js` | غياب توثيق الحالات الخمس الدقيقة للمؤجلات؛ ثُبتت الحالات الخمس: `DEFERRED`, `READY_FOR_REVIEW`, `AUTHORIZED`, `DONE`, `CANCELLED`. | `PROCEDURE_IMPLEMENTED` |
| **الهدف والقيمة (`Purpose`)** | `GOV-006`, `ADEQ-01` | مغطى دلالياً | `templates/TASK_RECORD.md`, `docs/INDEX.md` | حقل إلزامي صريح يمنع حفظ عناصر مبهمة دون قيمة واضحة. | `POLICY_DEFINED` |
| **المراجع الحاكمة (`Governing References`)** | `GOV-001`, `GOV-003`, `AGHR-019` | مغطى ومنفذ | `server/security.js`, `tests/baseline_v1_adoption.test.mjs` | التحقق من تطابق بصمة المرجع ومنع استئناف العمل إذا حدث انحراف للمرجع (`BLOCKED_REFERENCE_DRIFT`). | `ENFORCEMENT_VERIFIED` |
| **الأدلة السابقة (`Evidence`)** | `GOV-007`, `GOV-018`, `AGHR-032` | مغطى ومنفذ | `docs/evidence/`, `tests/inbox_custody.test.mjs` | ربط الطلب المؤجل بالأدلة السابقة المتاحة لمنع إعادة الاختبارات أو تكرار الجهد. | `ENFORCEMENT_VERIFIED` |
| **شرط إعادة الفتح (`Reopen Trigger`)** | `GOV-013`, `GOV-019`, `ADEQ-17` | مغطى دلالياً | `templates/HANDOFF.md`, `INBOX_DISPOSITION.md` | **فجوة رئيسية سُدّت:** كان شرط الاستئناف مدمجاً في نصوص نثرية؛ تم فصله برمجياً بحيث ينقل الطلب إلى `READY_FOR_REVIEW` فقط وليس للتنفيذ. | `BEHAVIOR_TESTED` |
| **سياسة وتاريخ المراجعة (`Review Policy / Date`)** | `AGHR-045`, `GOV-009` | غير مغطى تفصيلياً | `procedures/REQUEST_INTAKE.md` | **فجوة تشغيلية سُدّت:** التمييز بين المراجعة المبنية على الأحداث (`EVENT_TRIGGER_ONLY`) والمبنية على الزمن (`TIME_BASED` / `EVENT_AND_TIME`)، مع التأكيد أن حلول التاريخ لا يمنح أي تفويض تنفيذ. | `BEHAVIOR_TESTED` |
| **نطاق التفويض (`Authorization Scope`)** | `GOV-004`, `GOV-020`, `DEC-001` | مغطى ومنفذ | `tests/sgo_integration.test.mjs`, `server/security.js` | منع الانتقال إلى `AUTHORIZED` إلا بتفويض مالك صريح ومحدد النطاق؛ وإلزام البقاء ضمن النطاق الممنوح. | `ENFORCEMENT_VERIFIED` |
| **أصغر إجراء مسموح (`Next Permitted Action`)** | `GOV-011`, `GOV-014`, `ADEQ-08`, `ADEQ-12` | مغطى دلالياً | `templates/SHORT_REQUEST.md`, `AGENTS.md` | إلزام أن تكون أول خطوة بعد الاستئناف هي أصغر خطوة ذرية للقراءة أو الفحص (Read-Only)، وحظر القفز للنشر أو الكتابة. | `BEHAVIOR_TESTED` |
| **حظر التنفيذ التلقائي (`No Auto-Execution`)** | `GOV-004`, `GOV-020`, `AGHR-019` | مغطى ومنفذ | `tests/request_custody.test.mjs` (Negative Case 1 & 2) | إنفاذ حتمي يمنع تشغيل أي خطوة بمجرد تحقق الشرط أو حلول التاريخ دون تفويض ساري المفعول. | `ENFORCEMENT_VERIFIED` |
| **الاستمرار ضمن التفويض القائم (`GOV-004`)** | `GOV-004` | مغطى ومنفذ | `tests/request_custody.test.mjs` (Positive Case) | عدم إلزام إعادة التفويض لكل خطوة ميكروية إذا كانت مشمولة بتفويض سارٍ، مع بقاء حدود النشر والتفعيل محمية. | `ENFORCEMENT_VERIFIED` |

---

## 3. بنية المصدر الموحد للحقيقة (Single Source of Truth Architecture)

وفقاً للتوجيه الصريح للمالك السيادي، **يُحظر إنشاء ملف موازٍ أو قاعدة بيانات منفصلة للطلبات**:
1. **الواقع الأرضي للحالة (Ground Truth):** هو شجرة Git الحالية، وSHA الالتزام، ونواتج الاختبارات المؤكدة.
2. **سجل الحالة التشغيلية النشط (Point-in-Time Snapshot):** يُسجل في [`docs/status/CURRENT.md`](file:///d:/APP/Agent-Files-Explorer/docs/status/CURRENT.md) كنقطة الحقيقة اللحظية لموقف المشروع، وتُنقل الجلسات عبر [`docs/status/HANDOFF.md`](file:///d:/APP/Agent-Files-Explorer/docs/status/HANDOFF.md).
3. **قرارات المالك السيادية:** مسجلة بصفة قطعية في [`docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md`](file:///d:/APP/Agent-Files-Explorer/docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md).
4. **تمثيل الطلبات المؤجلة:** تُدرج بطاقة الطلب المؤجل الموحدة مباشرة داخل بند الموقف الموقوف (`Stop position` أو `Deferred Workstream`) في `CURRENT.md` و`HANDOFF.md`، أو تودع في تقرير التحكيم الجنائي ذي الصلة، دون إنشاء ملفات وسيطة غير معتمدة.

---

## 4. مواصفة بطاقة الطلب المؤجل القياسية (Standard Card Specification)

يجب أن تتضمن كل بطاقة طلب مؤجل الحقول التسعة الإلزامية التالية:

| الحقل (Field) | النوع والقيود (Type & Constraints) | الوصف والدور الحاكم (Governance Purpose) |
|---|---|---|
| **`Request ID`** | نصي ثابت بصيغة `REQ-[A-Z0-9_.-]+` | معرّف فريد غير قابل للتغيير للطلب. |
| **`Status`** | قيمة من: `DEFERRED`, `READY_FOR_REVIEW`, `AUTHORIZED`, `DONE`, `CANCELLED` | حالة الطلب الحالية في دورة الحياة. |
| **`Purpose`** | نص وصفي واضح | الهدف المحدد والقيمة التشغيلية المرجوة من الطلب. |
| **`Governing References`** | مسارات أو معرفات وثائق حوكمة | المرجعية القانونية أو المعمارية أو القرار الحاكم للطلب. |
| **`Evidence`** | روابط ملفات أو بصمات اختبار | الأدلة السابقة القابلة لإعادة الاستخدام لتجنب تكرار الجهد. |
| **`Reopen Trigger`** | شرط موضوعي وقابل للتحقق | الحدث أو الدليل الموضوعي الذي يسوّغ إعادة تقييم الطلب. |
| **`Review Policy`** | `EVENT_TRIGGER_ONLY`, `TIME_BASED`, `EVENT_AND_TIME` | السياسة المحددة للمراجعة: بالحدث فقط، أو بالتاريخ فقط، أو بكليهما. |
| **`Review Owner`** | اسم أو دور السلطة المسؤولة | الجهة المخولة بمراجعة الطلب (المالك السيادي). |
| **`Next Review Due`** | تاريخ بصيغة `YYYY-MM-DD` (أو N/A) | الموعد القادم للمراجعة (لا يمنح أي تفويض تنفيذ). |
| **`Authorization Scope`** | نص يحدد حدود التفويض | نطاق التفويض الممنوح حالياً (مثل `NONE_DEFERRED` أو `READ_ONLY`). |
| **`Next Permitted Action`** | إجراء ذري وحيد ومحدد | أصغر خطوة مسموحة عند استئناف الطلب بعد التفويض. |

---

## 5. نموذج عملي معتمد: بطاقة تأهيل النماذج اللغوية الحية

تجسد هذه البطاقة التطبيق الفعلي للعهدة المحكومة على المهمة المؤجلة من التوجيه `AFE-GOV-BEHAVIORAL-VALIDITY-008`:

### REQ-AFE-QUAL-008-LIVE: Real-Agent Empirical Qualification Benchmark

| Field | Value |
| :--- | :--- |
| **Request ID** | `REQ-AFE-QUAL-008-LIVE` |
| **Status** | `DEFERRED` |
| **Purpose** | تنفيذ قياس أداء تجريبي فعلي لوكلاء الذكاء الاصطناعي عبر 8 سيناريوهات مقارنة (A, B, C) لتأهيل خط الأساس v1.4.0 دون محاكاة اصطناعية. |
| **Governing References** | `AFE-GOV-BEHAVIORAL-VALIDITY-008`, `docs/governance/AFE_GOV_BEHAVIORAL_VALIDITY_008_AUDIT_REPORT.md`, `GOV-007` |
| **Evidence** | أدلة QUAL-007 المصنفة `SYNTHETIC_EVALUATOR_TEST_ONLY` في `BEHAVIORAL_QUALIFICATION_DATA.json`، وجناح اختبارات المحرك 3/3 ناجح. |
| **Reopen Trigger** | صدور تفويض مالي صريح من المالك بميزانية استهلاك API محددة، أو اعتماد مشغل محلي (Local LLM Engine) لا يتطلب تكلفة سحابية. |
| **Review Policy** | `EVENT_AND_TIME` |
| **Review Owner** | Sovereign Project Owner |
| **Next Review Due** | `2026-12-01` |
| **Authorization Scope** | `NONE_DEFERRED` (التنفيذ محظور تماماً؛ استهلاك API غير مصرح به). |
| **Next Permitted Action** | تشغيل تجريبي معزول (Smoke Test) لمهمة واحدة فقط في فرع git worktree مؤقت للتحقق من الاتصال دون تسجيل نتائج معتمدة. |

---

## 6. قواعد الانتقال وآلة الحالات (State Machine & Transition Semantics)

```
       +-----------------------------------------------------------+
       |                                                           |
       v                                                           |
[ DEFERRED ] --(Trigger Met or Review Date)--> [ READY_FOR_REVIEW ] |
       |                                              |            |
       |                                    (Owner Grant Approved) |
 (Cancelled/Obsolete)                                 |            |
       |                                              v            |
       v                                       [ AUTHORIZED ]      |
 [ CANCELLED ]                                        |            |
                                               (Execute Steps)     |
                                                      |            |
                                                      v            |
                                                  [ DONE ] --------+
```

### القواعد الحاكمة الصارمة:
1. **الفصل بين المراجعة والتنفيذ:**  
   تحقق `Reopen Trigger` أو حلول `Next Review Due` ينقل الطلب حصراً من `DEFERRED` إلى `READY_FOR_REVIEW`. لا يجوز إطلاقاً الانتقال المباشر إلى `AUTHORIZED`.
2. **منع التفويض الذاتي (`No Self-Grants`):**  
   لا ينتقل الطلب من `READY_FOR_REVIEW` إلى `AUTHORIZED` إلا بوجود كائن منحة مالك صالح (`ownerGrant.status === "OWNER_APPROVED"`) وغير منتهٍ الصلاحية ومحدد النطاق بدقة.
3. **الاستمرار ضمن التفويض القائم (`GOV-004`):**  
   إذا مُنح تفويض يشمل مراحل متعددة (مثل: `REVIEW -> RECONCILE -> IMPLEMENT_IN_SCOPE -> VERIFY`)، يجوز للوكيل إكمال تلك المراحل تباعاً دون طلب إعادة تفويض عند كل خطوة، مع بقاء عمليات النشر الخارجي (`git push`) والتفعيل الإنتاجي خاضعة لمنع حتمي يتطلب إذناً صريحاً منفصلاً (`GOV-015`, `GOV-020`).
4. **الإلغاء والاستبعاد:**  
   إذا أصبح الطلب غير ضروري، يُنقل إلى `CANCELLED` مع توثيق السبب الإلزامي، ويُحظر بعد ذلك محاولة استئنافه أو تنفيذه.
5. **انحراف المرجع (`Reference Drift`):**  
   إذا تغيرت بصمة الوثيقة الحاكمة للطلب المؤجل أثناء فترة التجميد، تُعلّق البطاقة تلقائياً بإنفاذ `BLOCKED_REFERENCE_DRIFT` حتى يعاد توفيقها.
6. **تعارض مصادر الحالة (`State Conflict`):**  
   إذا وُجد اختلاف بين حالة البطاقة وسجل القرارات المعتمد، يفشل النظام مغلقاً بحالة `BLOCKED_STATE_CONFLICT`.

---

## 7. نتائج التحقق والاختبارات الآلية (Automated Verification)

تم التحقق من هذه الآلية آلياً عبر جناح الاختبارات المستقل [`tests/request_custody.test.mjs`](file:///d:/APP/Agent-Files-Explorer/tests/request_custody.test.mjs)؛ حيث أثبتت **10 من أصل 10 اختبارات** الحالات التالية بنجاح كامل:

```
✔ Request Custody: Standard card validation succeeds on compliant card (3.5ms)
✔ Request Custody: Card validation rejects missing mandatory fields or invalid ID format (0.9ms)
✔ Request Custody: Markdown card formatting produces valid GitHub Flavored Markdown table (0.4ms)
✔ Negative Case 1: Reaching review date transitions to READY_FOR_REVIEW, execution fails closed without grant (0.6ms)
✔ Negative Case 2: Reopen trigger met transitions to READY_FOR_REVIEW, execution with expired grant fails closed (0.4ms)
✔ Negative Case 3: Deferred request cancelled cannot resume or execute (1.6ms)
✔ Negative Case 4: Divergent status between card and authoritative register fails closed (0.3ms)
✔ Negative Case 5: Governing reference drift invalidates card pending reconciliation (0.2ms)
✔ Negative Case 6: Transition to AUTHORIZED without valid owner grant fails closed (0.5ms)
✔ Positive Case: Continuous valid grant supports bounded multi-step execution and enforces publication boundary (0.7ms)
```

---

## 8. القيود المتبقية (Remaining Limitations)

1. **التحقق المحلي مقابل الإنفاذ الخارجي:** تضمن أداة `tools/request_custody.mjs` والاختبارات البرمجية سلامة التحولات المنطقية محلياً، لكنها لا تدعي وجود خادم إنفاذ خارجي أو اعتراض شبكي بيئي (PEP/PDP)، التزاماً بكونها غير مفعّلة (`NOT_ACTIVE`).
2. **حدود هوية المالك:** يعتمد التحقق من صحة التفويض على مطابقة البنية وحالة المنحة (`status: OWNER_APPROVED`) ونطاقها، ولا يمثل ذلك توثيقاً بمفاتيح تشفير غير متماثلة أو قياساً حيوياً.
3. **حظر النشر الخارجي:** يظل المستودع في وضع العزل المحلي؛ ولا يجوز دفع الالتزامات إلى `origin/main` دون أمر سيادي مستقل.
