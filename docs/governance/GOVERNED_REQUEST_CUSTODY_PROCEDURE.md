# إجراء العهدة المحكومة للطلبات المؤجلة والمستبعدة
## Governed Request Custody Procedure & Operational Gap Closure

**Document ID:** `AFE-GOV-REQUEST-CUSTODY-009-PROCEDURE`  
**Parent Directive:** `AFE-GOV-REQUEST-CUSTODY-009`  
**Governing Authority:** Sovereign Project Owner  
**Repository Baseline:** `Agent Governance & RCCA Kit EN v1.4.0 + ADEQ 1.1` (`Baseline v1`)  
**Status:** `OWNER_ACCEPTED / PROCEDURE_IMPLEMENTED / VALIDATOR_BEHAVIOR_VERIFIED / RUNTIME_ENFORCEMENT_NOT_VERIFIED`  
**Automated Verification:** `tests/request_custody.test.mjs` (11/11 Passing)  
**Tool Support:** `tools/request_custody.mjs`

---

## 1. الخلفية وسلطة المالك (Executive Authority & Decisions)

أقر المالك السيادي للمشروع بموجب التوجيه **`AFE-GOV-REQUEST-CUSTODY-009`** ما يلي:
1. **كفاية القواعد الأساسية:** المبادئ الأساسية للعهدة المحكومة للطلبات (`GOVERNED_REQUEST_CUSTODY`) مغطاة موضوعياً ضمن قواعد الحوكمة الحالية في خط الأساس `v1.4.0` و`AGHR 1.2.0`.
2. **حظر تضخيم القواعد:** لا تضاف أي قاعدة `GOV` أو `ADEQ` جديدة لمجرد إعادة صياغة الموجود، ولا يُنشأ نظام مستقل أو موازٍ لإدارة المهام.
3. **سد الفجوة التشغيلية فقط:** استكمال التغطية التشغيلية عبر توحيد تمثيل الطلبات المؤجلة (`Deferred Requests`) ببطاقة قياسية موحدة، وتحديد محددات انتقال الحالة لمنع التنفيذ التلقائي أو غسيل الصلاحيات.
4. **حماية ميزانية السياق (`DEC-003`):** عدم توسيع ملف `AGENTS.md` والالتزام بحدود السياق الإجمالي (< 5,000 رمز).
5. **التمييز الدقيق في تصنيفات الإثبات:** التمييز الصارم بين ما هو محدد في السياسة (`POLICY_DEFINED`)، ومطبق إجرائياً (`PROCEDURE_IMPLEMENTED`)، ومثبت بسلوك محرك التحقق (`VALIDATOR_BEHAVIOR_VERIFIED`)، وما هو غير مثبت كإنفاذ تشغيلي بيئي عام (`RUNTIME_ENFORCEMENT_NOT_VERIFIED`)، وقرارات قبول المالك (`OWNER_ACCEPTANCE`).

---

## 2. مصفوفة التغطية والفجوات (Coverage & Gap Matrix)

تقيّم هذه المصفوفة عناصر المقترح مقارنة بنصوص قواعد الحوكمة الأصلية المعتمدة، وفق التصنيف الخماسي الدقيق:

| عنصر البطاقة / الالتزام | المرجع والقاعدة الحاكمة | حالة التغطية في خط الأساس | الدليل والمسار في المستودع | الفجوة المحددة وكيف سُدّت | تصنيف الإثبات الدقيق |
|---|---|---|---|---|:---:|
| **معرّف الطلب (`Request ID`)** | `GOV-006`, `AGHR-029` | مغطى دلالياً | `templates/SHORT_REQUEST.md`, `schemas/trace.schema.json` | غياب بادئة قياسية موحدة للطلبات المؤجلة؛ اعتُمدت صيغة `REQ-<ID>` في `tools/request_custody.mjs`. | `PROCEDURE_IMPLEMENTED` |
| **الحالة المحددة (`Status`)** | `GOV-009` | مغطى دلالياً | `templates/INBOX_DISPOSITION.md`, `server/governance.js` | غياب حصر الحالات الخمس الدقيقة للمؤجلات؛ ثُبتت الحالات الخمس: `DEFERRED`, `READY_FOR_REVIEW`, `AUTHORIZED`, `DONE`, `CANCELLED`. | `PROCEDURE_IMPLEMENTED` |
| **الهدف والقيمة (`Purpose`)** | `GOV-006`, `ADEQ-01` | مغطى دلالياً | `templates/TASK_RECORD.md`, `docs/INDEX.md` | حقل إلزامي صريح يمنع تجميد أو إرجاء عناصر مبهمة دون قيمة واضحة. | `POLICY_DEFINED` |
| **المراجع الحاكمة (`Governing References`)** | `GOV-001`, `GOV-003`, `AGHR-019` | مغطى ومنفذ | `server/security.js`, `tests/baseline_v1_adoption.test.mjs` | كشف انحراف بصمة المرجع ومنع استئناف العمل إذا حدث انحراف للمرجع (`BLOCKED_REFERENCE_DRIFT`). | `VALIDATOR_BEHAVIOR_VERIFIED / RUNTIME_ENFORCEMENT_NOT_VERIFIED` |
| **الأدلة السابقة (`Evidence`)** | `GOV-007`, `GOV-018`, `AGHR-032` | مغطى ومنفذ | `docs/evidence/`, `tests/inbox_custody.test.mjs` | ربط الطلب المؤجل بالأدلة السابقة المتاحة لمنع إعادة الاختبارات أو تكرار الجهد. | `VALIDATOR_BEHAVIOR_VERIFIED / RUNTIME_ENFORCEMENT_NOT_VERIFIED` |
| **شرط إعادة الفتح (`Reopen Trigger`)** | `GOV-013`, `GOV-019`, `ADEQ-17` | مغطى دلالياً | `templates/HANDOFF.md`, `INBOX_DISPOSITION.md` | **فجوة رئيسية سُدّت:** كان شرط الاستئناف مدمجاً في نصوص نثرية؛ تم فصله برمجياً بحيث ينقل الطلب إلى `READY_FOR_REVIEW` فقط وليس للتنفيذ. | `VALIDATOR_BEHAVIOR_VERIFIED` |
| **سياسة وتاريخ المراجعة (`Review Policy / Date`)** | `AGHR-045`, `GOV-009` | غير مغطى تفصيلياً | `procedures/REQUEST_INTAKE.md` | **فجوة تشغيلية سُدّت:** التمييز بين المراجعة المبنية على الأحداث (`EVENT_TRIGGER_ONLY`) والمبنية على الزمن (`TIME_BASED` / `EVENT_AND_TIME`)، مع التأكيد أن حلول التاريخ لا يمنح أي تفويض تنفيذ. | `VALIDATOR_BEHAVIOR_VERIFIED` |
| **نطاق التفويض (`Authorization Scope`)** | `GOV-004`, `GOV-020`, `DEC-001` | مغطى ومنفذ | `tests/sgo_integration.test.mjs`, `server/security.js` | منع الانتقال إلى `AUTHORIZED` إلا بتفويض مالك صريح ومحدد النطاق؛ وحظر التنفيذ مطلقاً عند كون النطاق `NONE_DEFERRED`. | `VALIDATOR_BEHAVIOR_VERIFIED / RUNTIME_ENFORCEMENT_NOT_VERIFIED` |
| **أصغر إجراء مسموح (`Next Permitted Action`)** | `GOV-011`, `GOV-014`, `ADEQ-08`, `ADEQ-12` | مغطى دلالياً | `templates/SHORT_REQUEST.md`, `AGENTS.md` | التمييز الصريح بين الإجراء المصرح به حالياً (`NONE`) والإجراء المقترح بعد تفويض المالك المستقبلي، وحظر القفز للتنفيذ. | `POLICY_DEFINED / PROCEDURE_IMPLEMENTED` |
| **حظر التنفيذ التلقائي (`No Auto-Execution`)** | `GOV-004`, `GOV-020`, `AGHR-019` | مغطى ومنفذ | `tests/request_custody.test.mjs` (الحالات السلبية 1 و2 و7) | منع قطعي في محرك التحقق لأي تنفيذ بمجرد تحقق الشرط أو حلول التاريخ دون تفويض سارٍ. | `VALIDATOR_BEHAVIOR_VERIFIED / RUNTIME_ENFORCEMENT_NOT_VERIFIED` |
| **الاستمرار ضمن التفويض القائم (`GOV-004`)** | `GOV-004` | مغطى ومنفذ | `tests/request_custody.test.mjs` (Positive Case) | عدم إلزام إعادة التفويض لكل خطوة ميكروية إذا كانت مشمولة بتفويض سارٍ، مع بقاء حدود النشر والتفعيل محمية. | `VALIDATOR_BEHAVIOR_VERIFIED / RUNTIME_ENFORCEMENT_NOT_VERIFIED` |

---

## 3. بنية المصدر الموحد للحقيقة (Single Source of Truth Architecture)

وفقاً للتوجيه الصريح للمالك السيادي، **يُحظر إنشاء ملف موازٍ أو قاعدة بيانات منفصلة للطلبات**:
1. **الواقع الأرضي للحالة (Ground Truth):** هو شجرة Git الحالية، وSHA الالتزام، ونواتج الاختبارات المؤكدة.
2. **سجل الحالة التشغيلية النشط (Point-in-Time Snapshot):** يُسجل في [`docs/status/CURRENT.md`](file:///d:/APP/Agent-Files-Explorer/docs/status/CURRENT.md) كنقطة الحقيقة اللحظية المشتقة لموقف المشروع.
3. **سجل تسليم الجلسات (Handoff Pointers):** يمثل [`docs/status/HANDOFF.md`](file:///d:/APP/Agent-Files-Explorer/docs/status/HANDOFF.md) مؤشرات نقل سياق للمراجعة والانتقال بين الوكلاء؛ وهو **ليس مصدراً ثانياً للحقيقة** ولا يحتفظ بحالة موازية.
4. **قرارات المالك السيادية:** مسجلة بصفة قطعية في [`docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md`](file:///d:/APP/Agent-Files-Explorer/docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md).
5. **تمثيل الطلبات المؤجلة:** البطاقة القياسية المعتمدة مسجلة كمرجع قانوني في هذا الإجراء، وتُحال إليها الإشارات في `CURRENT.md` و`HANDOFF.md` دون تكرار أو مضاهاة للحقول منعاً للانجراف والتناقض.

---

## 4. مواصفة بطاقة الطلب المؤجل القياسية (Standard Card Specification)

يجب أن تتضمن كل بطاقة طلب مؤجل الحقول الإلزامية التالية:

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
| **`Next Review Due`** | تاريخ بصيغة `YYYY-MM-DD` مع بيان حالة الاعتماد | الموعد المقترح للمراجعة (لا يمنح أي تفويض تنفيذ). |
| **`Authorization Scope`** | نص يحدد حدود التفويض | نطاق التفويض الممنوح حالياً (`NONE_DEFERRED` عند التجميد). |
| **`Currently Authorized Action`** | نص محدد صريح | الإجراء المصرح به حالياً فقط (وهو `NONE` في وضع التجميد). |
| **`Proposed Next Action`** | إجراء ذري وحيد ومقترح | أصغر خطوة مقترحة عند استئناف الطلب في حال صدور تفويض مالك مستقبلي. |

---

## 5. نموذج عملي معتمد: بطاقة تأهيل النماذج اللغوية الحية

تجسد هذه البطاقة التطبيق الفعلي المصحح للعهدة المحكومة على المهمة المؤجلة من التوجيه `AFE-GOV-BEHAVIORAL-VALIDITY-008`:

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
| **Next Review Due** | `2026-12-01 (PROPOSED_TARGET_DATE / NOT_OWNER_RATIFIED)` *(موعد مراجعة مقترح مستمد من الأمثلة الاسترشادية؛ لا يوجد قرار مالك معتمد يثبته كموعد ملزم).* |
| **Authorization Scope** | `NONE_DEFERRED` *(التنفيذ محظور تماماً؛ استهلاك API واختبارات البيئة غير مصرح بها).* |
| **Currently Authorized Action** | **`NONE (Custody & Tracking Only)`** *(لا يوجد أي إجراء تنفيذي مأذون به حالياً).* |
| **Proposed Next Action Upon Future Authorization** | `تشغيل تجريبي معزول (Smoke Test) لمهمة واحدة فقط في فرع git worktree مؤقت للتحقق من الاتصال دون تسجيل نتائج معتمدة (إجراء مقترح حصراً — يتطلب تفويض مالك مستقبلي مستقل ولا يجوز تنفيذه الآن).` |
| **Next Permitted Action** | `NONE (Scope is NONE_DEFERRED). Proposed upon future owner authorization: Isolated smoke-test in temporary worktree without API billing.` |

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
3. **حظر التنفيذ عندما يكون النطاق `NONE_DEFERRED`:**  
   حتى في حال تلاعب أي كود بالحالة إلى `AUTHORIZED`، فإن وجود `authorization_scope === "NONE_DEFERRED"` يوقف التنفيذ حتمياً بخطأ `BLOCKED_NO_EXECUTION_GRANT`.
4. **الاستمرار ضمن التفويض القائم (`GOV-004`):**  
   إذا مُنح تفويض يشمل مراحل متعددة (مثل: `REVIEW -> RECONCILE -> IMPLEMENT_IN_SCOPE -> VERIFY`)، يجوز للوكيل إكمال تلك المراحل تباعاً دون طلب إعادة تفويض عند كل خطوة، مع بقاء عمليات النشر الخارجي (`git push`) والتفعيل الإنتاجي خاضعة لمنع حتمي يتطلب إذناً صريحاً منفصلاً (`GOV-015`, `GOV-020`).
5. **الإلغاء والاستبعاد:**  
   إذا أصبح الطلب غير ضروري، يُنقل إلى `CANCELLED` مع توثيق السبب الإلزامي، ويُحظر بعد ذلك محاولة استئنافه أو تنفيذه.
6. **انحراف المرجع (`Reference Drift`):**  
   إذا تغيرت بصمة الوثيقة الحاكمة للطلب المؤجل أثناء فترة التجميد، تُعلّق البطاقة تلقائياً بإنفاذ `BLOCKED_REFERENCE_DRIFT` حتى يعاد توفيقها.
7. **تعارض مصادر الحالة (`State Conflict`):**  
   إذا وُجد اختلاف بين حالة البطاقة وسجل القرارات المعتمد، يفشل النظام مغلقاً بحالة `BLOCKED_STATE_CONFLICT`.

---

## 7. نتائج التحقق والاختبارات الآلية (Automated Verification)

تم التحقق من هذه الآلية آلياً عبر جناح الاختبارات المستقل [`tests/request_custody.test.mjs`](file:///d:/APP/Agent-Files-Explorer/tests/request_custody.test.mjs)؛ حيث أثبتت **11 من أصل 11 اختباراً** الحالات التالية بنجاح كامل:

```
✔ Request Custody: Standard card validation succeeds on compliant card (37.0ms)
✔ Request Custody: Card validation rejects missing mandatory fields or invalid ID format (3.4ms)
✔ Request Custody: Markdown card formatting produces valid GitHub Flavored Markdown table (1.1ms)
✔ Negative Case 1: Reaching review date transitions to READY_FOR_REVIEW, execution fails closed without grant (1.7ms)
✔ Negative Case 2: Reopen trigger met transitions to READY_FOR_REVIEW, execution with expired grant fails closed (1.0ms)
✔ Negative Case 3: Deferred request cancelled cannot resume or execute (4.2ms)
✔ Negative Case 4: Divergent status between card and authoritative register fails closed (3.5ms)
✔ Negative Case 5: Governing reference drift invalidates card pending reconciliation (0.6ms)
✔ Negative Case 6: Transition to AUTHORIZED without valid owner grant fails closed (1.4ms)
✔ Positive Case: Continuous valid grant supports bounded multi-step execution and enforces publication boundary (35.6ms)
✔ Negative Case 7: Authorization scope NONE_DEFERRED blocks execution unconditionally (1.6ms)
ℹ tests 11 | pass 11 | fail 0
```

---

## 8. القيود المتبقية وإخلاء المسؤولية عن الإنفاذ البيئي (Remaining Limitations & Disclaimer)

1. **تصنيف الإثبات (`VALIDATOR_BEHAVIOR_VERIFIED` مقابل `RUNTIME_ENFORCEMENT_NOT_VERIFIED`):**  
   تثبت الاختبارات الآلية المنفذة سلوك ومنطق محرك التحقق البرمجي (`tools/request_custody.mjs`) وقدرته على كشف المخالفات ومنع التحولات غير المصرح بها داخل حدود الشيفرة. **ولا يُدّعى وجود إنفاذ تقني فعلي أو اعتراض شبكي/بيئي (PEP/PDP) على جميع أدوات ومسارات تشغيل الوكلاء الخارجية**، حيث تظل وحدات الاعتراض التشغيلي المتقدمة في حالة خاملة عمداً (`PEP/PDP = NOT_ACTIVE`) التزاماً بالقرار `DEC-009`.
2. **حدود هوية المالك:** يعتمد التحقق من صحة التفويض على مطابقة البنية وحالة المنحة (`status: OWNER_APPROVED`) ونطاقها، ولا يمثل ذلك توثيقاً بمفاتيح تشفير غير متماثلة أو قياساً حيوياً.
3. **حظر النشر الخارجي:** يظل المستودع في وضع العزل المحلي؛ ولا يجوز دفع الالتزامات إلى `origin/main` دون أمر سيادي مستقل.
