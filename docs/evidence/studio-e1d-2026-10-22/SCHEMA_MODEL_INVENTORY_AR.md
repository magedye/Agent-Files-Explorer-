# جرد مخططات وحقول وأنواع rc.3 — E1.d

**المرجع:** contract.1؛ إغلاق النسخ rc3-contract.1-schemas.1؛ فهرس النموذج rc3-contract.1-model.1.

هذا جرد ونسخ ثابتة وإسقاط للقراءة؛ التحقق الحاكم وحالات التأهيل التشغيلية NOT_RUN. الحقول الشرطية تبقى في مخطط item الأصلي، ولا تستبدل بالمثال أو بقيم افتراضية.

## المخططات الـ16

تطابق النسخ بايتات قفل العقود، وتحفظ أسماء الملفات و$id و$ref الأصلية. حُلّت 564 إحالة محلية إلى مخططات ضمن الإغلاق؛ لا استرجاع شبكي.

| المخطط | البايتات | الإحالات المحلية | SHA-256 |
| --- | ---: | ---: | --- |
| `aghr.schema.json` | 2996 | 14 | `2ebbc02ff25cbb659a37351e7c155f8e66e8cd1890dfe50af6e738b8b40f5a4f` |
| `api.change.schema.json` | 9107 | 70 | `b5cd5af00a5654de9c543d49c6777dcd52f7391a60d0a24bec27e59e1085e273` |
| `api.execution.schema.json` | 8900 | 46 | `3b7e36b0c0b5b0671be901b2a9f69c61bdcc9fa0010777848b22a9aeb883c764` |
| `api.read.schema.json` | 18187 | 121 | `3c9c364594343f9e5e0ea5f89cfd8065cb526b5a70e37a48845ecc66f12c155f` |
| `api.responses.schema.json` | 27133 | 118 | `aa6fb7f09d95e78479bd5b7a9cc5f12e682dc11dea2e310e65b594d4659acc5f` |
| `auth.schema.json` | 1775 | 9 | `a93e0d378b1df206f35d296674e070c505009c04d9128aa57f46a5d937b50a83` |
| `capability.schema.json` | 2360 | 16 | `15091b9ebb9e03fd5567d01e135bedc58cce5e76267c537642e8f47f1641a6c2` |
| `common.schema.json` | 3197 | 12 | `6015014ffaeb1bb42905b6d6ea426b36ad031091e804f6287d89622891646206` |
| `engine.schema.json` | 4112 | 19 | `e529dd10e3bd9cb68827b0a078047d4ef7b631b83d8009300e8f56fa39a72f21` |
| `evidence.schema.json` | 7250 | 17 | `958b99185490868ceb06cc9e2b8f6ea4f7d5a7ba40e5b24dc4334d78026d7722` |
| `item.schema.json` | 9343 | 48 | `e101feba90172939f007db9a41b456ce3297473477cb094c24549cc6d712d122` |
| `proposal.schema.json` | 2273 | 15 | `9bb4ec6b9f61a7f5af89ba410eefbf02ae6504695dce993fb93003bf59e34bcf` |
| `qualification.schema.json` | 1335 | 9 | `942184c6c5f9a21d8ea80345198929fbe0e7a2f77a89d178896a7133dfca5c24` |
| `settings.schema.json` | 7087 | 26 | `d12da8fe4c16dce87ed01eff98c51401d4229b37a4056c8fa6b9445367f5380a` |
| `state.schema.json` | 2519 | 12 | `11cb691cf0408fd723973809430affa8eacf34e79c36f212eba2e2a4d1f75449` |
| `transport.schema.json` | 2889 | 12 | `aec06b746298c92048d10d89f1763557aad7a781a5f6460743daa52092f0fc2b` |

قفل النسخ: `56748ef28ef23b011f5aa4134ee3c2975a3c668e8cb0b32512b83f6f7c2e0ce8`.
بصمة فهرس النموذج: `613ae2a7ddf5e64b5e6d1e0d39f899e9909088d99b2739f91a55c9afdab50b2f`.

لا يعاد إنشاء الإغلاق تلقائيًا. أداة التثبيت ترفض الكتابة فوق المجلد الموجود؛ تغيير المصدر يحتاج مراجعة ونسخة إغلاق جديدة وبصمة وفرق وتحديثًا صريحًا لمرساة المحرك.

## الحقول الرئيسية الـ17

المصدر: AGHR_REFERENCE §3.2، وتفاصيلها الأصلية في item.schema.json. عمود الإلزام أدناه يصف required غير المشروط فقط؛ شروط force/kind وغيرها باقية في allOf الأصلية وتنتظر E2.

| الحقل | تعريفه في المخطط | required غير مشروط | الحقول الفرعية | سطر المرجع |
| --- | --- | --- | --- | ---: |
| `id` | `#/$defs/text` | نعم | — | 167 |
| `title` | `#/$defs/text` | لا؛ قد يكون شرطيًا | — | 168 |
| `kind` | `enum: OBSERVATION, PRINCIPLE, CONSTRAINT, REQUIREMENT, PROCEDURE, GUIDELINE, POLICY, RULE, STANDARD, CONTROL, DECISION, EXCEPTION, CAPABILITY` | نعم | — | 169 |
| `force` | `enum: MUST, MUST_NOT, SHOULD, SHOULD_NOT, MAY, INFORMATIVE` | نعم | — | 170 |
| `severity` | `enum: critical, high, medium, low, info` | نعم | — | 171 |
| `rationale` | `#/$defs/text` | لا؛ قد يكون شرطيًا | — | 172 |
| `authority` | `object` | لا؛ قد يكون شرطيًا | source, level, owner, approvedBy, status, effectiveFrom, supersedes | 175 |
| `reviewCadence` | `#/$defs/text` | لا؛ قد يكون شرطيًا | — | 183 |
| `nextReview` | `string` | لا؛ قد يكون شرطيًا | — | 184 |
| `scope` | `object` | نعم | paths, exclude, appliesToAgents, environments, stages, taskTypes, language, skillIds | 185 |
| `rule` | `#/$defs/text` | نعم | — | 192 |
| `enforcement` | `object` | لا؛ قد يكون شرطيًا | textual, technical, failureAction, mergeEffect, gate | 195 |
| `verification` | `object` | لا؛ قد يكون شرطيًا | commands, evidence, evalFixtures | 203 |
| `impact` | `object` | نعم | band, evidence, lastCalibrated, measuredDelta | 207 |
| `conflictPolicy` | `object` | لا؛ قد يكون شرطيًا | precedence, overrides, overriddenBy | 211 |
| `exceptions` | `object` | لا؛ قد يكون شرطيًا | allowed, approval | 215 |
| `references` | `#/$defs/texts` | لا؛ قد يكون شرطيًا | — | 218 |

تضاف 16 خاصية متخصصة إلى النموذج: `expiresOn`، `skillId`، `source`، `function`، `instructionsPath`، `permissions`، `inputs`، `outputs`، `defaultTier`، `requiredApprovals`، `conflictsWith`، `alternatives`، `minimumStatus`، `requiredOnHosts`، `maxAgeDays`، `skillQualification`. تحفظ كلها دون تغيير شكل سجلات التأهيل المفردة أو المتعددة.

وجود الحقل null يسجل PRESENT مع value=null. الغياب يسجل ABSENT دون إضافة value إلى المصدر. الخصائص والأنواع غير المعروفة تبقى في القيمة الأصلية والإسقاط وتوسم للقراءة؛ لا تتحول إلى قيم معتمدة أو نجاح تحقق.

## الأنواع الـ13

| النوع | المجموعة | الوظيفة الأصلية | الموضع النموذجي | سطر المرجع |
| --- | --- | --- | --- | ---: |
| `OBSERVATION` | أساسي | A verified, falsifiable fact about the environment | `AGENTS.md` §Context | 244 |
| `PRINCIPLE` | أساسي | Shapes reasoning and default posture; not falsifiable | `AGENTS.md` §Identity | 245 |
| `CONSTRAINT` | أساسي | Prohibits an action or sets an inviolable boundary | `AGENTS.md` §Hard Constraints; `policies/security/` | 246 |
| `REQUIREMENT` | أساسي | What must be achieved, with explicit acceptance condition | `policies/` | 247 |
| `PROCEDURE` | أساسي | Ordered steps to execute an obligation | `skills/`, `procedures/` | 248 |
| `GUIDELINE` | أساسي | Advises a practice that is **not binding by itself** | `AGENTS.md` §Guidelines | 249 |
| `POLICY` | متقدم | Directional aggregate that may contain lower-level items | `policies/` | 255 |
| `RULE` | متقدم | Specific determinate obligation (use only when `REQUIREMENT`/`CONSTRAINT` don't fit) | `policies/` | 256 |
| `STANDARD` | متقدم | Accepted level of quality within a declared scope | `docs/agents/`, profiles | 257 |
| `CONTROL` | متقدم | Mechanism that prevents, detects, or remediates | `enforcement.technical`, CI | 258 |
| `DECISION` | متقدم | Records an authoritative choice among alternatives | `decisions/` | 259 |
| `EXCEPTION` | متقدم | Bounded, authorized departure from another item | `decisions/exceptions/` | 260 |
| `CAPABILITY` | متقدم | Declares a governed capability with its selection, qualification, and execution constraints. **Does not grant permissions; documents them.** | `skills/`, `capabilities/` | 261 |

تمثل الاختبارات الأنواع والحقول كبيانات غير متحققة. القراءة لا تفعّل نوعًا متقدمًا ولا تغيّر coreKindsOnly، ولا تؤهل CAPABILITY.

## النقل وحدود الحكم

البروتوكول الداخلي انتقل من 1 إلى 2 لإضافة catalog ونتيجة READ وشكل البيانات. النسخة السابقة محفوظة في snapshots والفروق. لم تتغير عقود Studio/HTTP contract.1. يتطلب الجسر المستقبلي T02 استهلاك البروتوكول الصريح؛ لا محول ضمني الآن.

`catalog` يقرأ cwd فقط من الجذور الأصلية المحددة في القارئ، ويعيد JSON واحدًا بترميز UTF-8 وسطر أخير. يحفظ المصادر الخام بصيغة Base64 مع النص والبصمة والموقع والمستندات ذات التجميع الأصلي. text ملخص؛ JSON هو النقل الكامل.

read_set_hash بصمة بايتات الملفات المقروءة فقط؛ مرشحات القراءة ظاهرة. تبقى candidate_hash وconfig_hash وinputs_hash والفهرس الحاكم في غلاف inputs بقيم null إلى تنفيذ E2؛ لا تنسب إلى بصمة مجموعة القراءة دلالة تحقق أو CP/JCS.

فحوص الصدق التشغيلية السبعة محفوظة في [مصفوفة الصدق](HONESTY_MATRIX.json) بحالة REQUIRED / NOT_RUN / NOT_WAIVED. اختبارات حدود القراءة تحافظ على هذه الحالة حتى عند وجود ادعاءات PASS/VERIFIED/HOST_SIGNAL في البيانات الخام.

التفاصيل الآلية: [SCHEMA_CLOSURE.json](SCHEMA_CLOSURE.json)، [قفل المخططات](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/schemas/SCHEMAS.lock.json)، [MODEL_INDEX.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/schemas/MODEL_INDEX.json).
