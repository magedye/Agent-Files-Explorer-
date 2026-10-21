```markdown
---
document_id: SKILLS_AUTHORIZED
version: 1.0.0
status: PENDING_OWNER_APPROVAL
date: 2026-10-21
authority: docs/00-authority/
supersedes: none (new document)
subordinate_to:
  - PROJECT_STATE.md
  - TASKS.md
  - DEFERRED_REGISTRY.md
  - OWNER_DECISION_REQUESTS.md
related_evidence:
  - Codex Skills Inventory — 2026-10-21
  - using-agent-skills SKILL.md
---

# SKILLS_AUTHORIZED — السجل الحاكم لمهارات Codex في MARSAD

## 1. الغرض

تُعرِّف هذه الوثيقة **المهارات المصرح بها** لاستخدامها من قبل Codex في مشاريع MARSAD، وتحدد **المرحلة** و**الشريحة** التي تُستخدم فيها، و**القيود** الملزمة، و**المهارات المحظورة**.

الغرض العملي: أن تكون كل تفويضات MARSAD القادمة **قابلة للاستشهاد** بهذه الوثيقة بدلاً من إعادة تعريف قوائم المهارات في كل تفويض، وبذلك:
- يمنع اعتماد الوكيل على مهارات غير معلنة أو غير مثبتة.
- يمنع استبدال المراجعة المستقلة بمراجعة ذاتية.
- يمنع توسيع النطاق عبر مسارات توجيه إلى مهارات غير متاحة.

## 2. السلطة والأسبقية

```
 hierarchy:
   1. PROJECT_STATE.md      (حالة المشروع)
   2. TASKS.md              (حالة المهام)
   3. DEFERRED_REGISTRY.md  (النطاق المؤجل)
   4. OWNER_DECISION_REQUESTS.md (القرارات المفتوحة)
   5. SKILLS_AUTHORIZED.md  (هذه الوثيقة — المهارات)
   6. تفويض الشريحة الفردية  (Delegation)
   7. مهارات Codex الداخلية
```

**قاعدة الأسبقية**: عند أي تعارض، الوثائق الأعلى تتقدم. **حوكمة MARSAD تتقدم على `using-agent-skills`**، و**شروط التفويض تتقدم على أي مسار توجيه داخلي للمهارات**.

## 3. الأساس المرجعي (Evidence Basis)

هذه الوثيقة مبنية على:
- **جرد مهارات Codex — 21 أكتوبر 2026**: 125 ملف `SKILL.md` محلياً، **75 معلنة** لهذه الجلسة، 50 غير معلنة.
- **جرد الكتالوج الخارجي**: 39 مهارة في `openai/skills` عند النسخة `49f948faa9…`، غير مثبتة محلياً.
- **11 مهارة AGHR Reference** في `optional_skills/` — أصول مرجعية فقط، ليست في مسارات الاكتشاف.
- **20 قالب OpenAI Templates** في ذاكرة الإضافات — غير مفعّلة.

**الحد الحاسم**: أي مهارة **غير معلنة** لهذه الجلسة = **غير قابلة للاستخدام**، بصرف النظر عن وجود ملفها محلياً.

## 4. تصنيف المهارات

| التصنيف | العدد | القابلية للاستخدام |
|---|---:|---|
| معلنة لهذه الجلسة | 75 | ✅ مسموحة (وفق مرحلة) |
| ملفات محلية غير معلنة | 50 | ❌ محظورة |
| AGHR Reference (optional_skills) | 11 | ❌ محظورة حتى تُثبَّت |
| OpenAI Templates | 20 | ❌ محظورة حتى تُفعَّل |
| كتالوج خارجي | 39 | ❌ محظورة حتى تُثبَّت |

## 5. المراحل والمهارات المصرح بها

كل مرحلة لها معرّف ثابت (`Phase A` … `Phase I`)، تُستخدم في التفويضات للاستشهاد.

### Phase A — Meta / افتتاح الشريحة

| المهارة | الوظيفة | القيود |
|---|---|---|
| `using-agent-skills` | موجّه داخلي لاختيار المسار | تابع لحوكمة MARSAD — لا يشرّع نطاقاً، لا يلغي بوابات |
| `context-engineering` | تنظيم السياق عبر الشرائح | لا يخوّل اختراع قرارات |

**المدخلات المطلوبة**: تفويض معتمد، TASKS.md، PROJECT_STATE.md.
**المخرجات المتوقعة**: اختيار مسار، كشف تعارضات، إظهار افتراضات.

### Phase B — التخطيط والعقد

| المهارة | الوظيفة | القيود |
|---|---|---|
| `spec-driven-development` | عقد + معايير قبول قبل الكود | لا كود قبل اعتماد العقد |
| `planning-and-task-breakdown` | تفكيك الشريحة + allowlist | لا يمكن توسيع النطاق |
| `interview-me` | استيضاح الغموض | **استيضاح فقط**؛ لا اقتراح نطاق |
| `idea-refine` | تقييم بدائل التصميم | قبل التنفيذ فقط |

**قاعدة**: الغموض في نطاق معتمد = **STOP وسؤال المالك**، لا حوار توليدي.

### Phase C — التنفيذ

| المهارة | الوظيفة | القيود |
|---|---|---|
| `incremental-implementation` | تقسيم التغيير إلى أجزاء | أي جزء خارج allowlist = رفض ذاتي |
| `source-driven-development` | إسناد القرارات إلى مصادر رسمية | لا قرارات "من الذاكرة" |
| `debugging-and-error-recovery` | تشخيص منهجي | إثبات السبب قبل الإصلاح |

### Phase D — المراجعة ما قبل النشر

| المهارة | الوظيفة | القيود |
|---|---|---|
| `code-review-and-quality` | **فحص ذاتي** قبل Push | **لا يُقبل كمراجعة مستقلة** |
| `codex-security:security-diff-scan` | تدقيق فروق أمنية | إلزامي عند لمس سطح أمني |
| `codex-security:verify-fix` | التحقق من إصلاح ملاحظة | عند الرد على ملاحظة |
| `codex-security:validation` | إثبات/نفي ثغرة مرشحة | عند الاشتباه |
| `codex-security:assess-patch-risk` | تقييم مخاطر رقعة | قبل الدمج |

### Phase E — النشر (Push + PR)

| المهارة | الوظيفة | القيود |
|---|---|---|
| `git-workflow-and-versioning` | إدارة الفروع والـPR | لا force-push، لا merge |

### Phase F — بوابة الدمج (Merge Gate)

**لا مهارة نظامية معلنة تغطّي هذه المرحلة**. المراجعة المستقلة تحتاج **قناة منفصلة موثقة**:

1. جلسة Codex منفصلة بـ`review-agent` (يتطلب إعلانها أولاً — فجوة مفتوحة)، **أو**
2. مراجعة بشرية موثقة (اسم + تاريخ + SHA)، **أو**
3. وكيل مستقل آخر (يُوثَّق في تقرير الدمج).

**قاعدة ملزمة**: `code-review-and-quality` **لا تُقبل** كبديل عن أي من الثلاثة. أي دمج بدون توثيق القناة المستقلة = خرق حوكمة.

### Phase G — الواجهة (S11 فقط وما بعدها)

| المهارة | الوظيفة | القيود |
|---|---|---|
| `frontend-ui-engineering` | واجهات React + RTL | **محظورة قبل S11** |
| `browser-testing-with-devtools` | اختبار المتصفح | **محظورة قبل S11** |
| `performance-optimization` | تحسين مقاس | **محظورة قبل S11** |

### Phase H — الإصدار (S14 فقط)

| المهارة | الوظيفة | القيود |
|---|---|---|
| `shipping-and-launch` | إطلاق موثق + تراجع | **محظورة قبل S14 وODR-15** |

### Phase I — التقييم (Opt-in)

| المهارة | الوظيفة | القيود |
|---|---|---|
| `langfuse` | تتبع LLM وتقييم | تتطلب اتصالاً خارجياً — بإذن صريح فقط |
| `find-skills` | البحث عن مهارة | للاستكشاف؛ لا تُثبّت مهارات تلقائياً |

## 6. القيود الملزمة (Binding Constraints)

```
C-01  using-agent-skills موجّه تابع. لا تلغي بوابات MARSAD:
      التفويض، الدليل، CI، المراجعة المستقلة. عند التعارض،
      حوكمة MARSAD تتقدم.

C-02  code-review-and-quality = فحص ذاتي فقط. لا تُقبل أبداً
      كـ"المراجعة المستقلة" المطلوبة لبوابة الدمج.

C-03  interview-me للاستيضاح فقط. عند غموض في نطاق معتمد:
      STOP وسؤال المالك، لا حوار توليدي.

C-04  المسارات إلى المهارات التسع غير الموجودة محلياً في
      using-agent-skills محظورة (Appendix B). أبلغ عن الفجوة،
      لا تخترع بديلاً.

C-05  أي مهارة غير معلنة لهذه الجلسة محظورة (Appendix A).
      وجود ملفها محلياً لا يكفي.

C-06  مهارات AGHR Reference الحاكمة (Appendix C) محظورة حتى
      تُثبَّت في مسار اكتشاف المشروع. لا نسخ SKILL.md مفردة.

C-07  أي مهارة تُنشئ اتصالاً خارجياً (langfuse, github,
      google-*) تتطلب إذناً صريحاً في التفويض، ولا تُستخدم
      في مهام Read-Only.

C-08  المهارات المخصصة لمرحلة لا تُستخدم خارجها (frontend
      قبل S11، shipping قبل S14).

C-09  كل تفويض يجب أن يستشهد بهذه الوثيقة:
      "SKILLS_AUTHORIZED.md v1.0.0 — Phase <X>"
      وأن يعدد Skills Authorized وSkills Forbidden للشريحة.

C-10  أي انحراف عن هذه الوثيقة = STOP فوري وإبلاغ للمالك،
      لا تفسير مرن.
```

## 7. المهارات المحظورة صراحةً

**محظورة لهذه الجلسة** (ملفات موجودة، غير معلنة):
`review-agent`، `gh-fix-ci`، `yeet`، `github`، `gh-address-comments`، `figma-*` (12 مهارة)، `lisan-quran` (معطّلة)، `openai-templates` (20 قالباً)، و`starter-workflow`.

**محظورة حتى تُثبَّت** (AGHR Reference):
`agent-tool-security`، `architecture-options`، `governed-learning`، `incremental-change`، `plan-drift-review`، `rag-data-quality`، `requirements-traceability`، `risk-based-verification`، `root-cause-debugging`، `safe-git-closeout`، `smart-clarification`.

**محظورة قبل مراحلها**:
- `frontend-ui-engineering`، `browser-testing-with-devtools`، `performance-optimization` — قبل S11.
- `shipping-and-launch` — قبل S14 و`ODR-15`.

## 8. ربط الشرائح بالمراحل

| الشريحة | المراحل المصرح بها |
|---|---|
| **S10-B2 — Push+PR** | A، D (ذاتي)، E |
| **S10-B2 — Merge** | F (قناة موثقة) |
| **S10-B3 — CSV/XLSX** | A، B، C، D |
| **S6 / S7 — Backend** | A، B، C، D، E، I (langfuse بإذن) |
| **S11 — Frontend** | A، B، C، D، E، G |
| **S13 — Security** | A، D (كامل)، E، F |
| **S14 — Release** | A، E، F، H |

## 9. الفجوات المؤسسية المفتوحة (Governance Gaps)

| # | الفجوة | الأثر | التوصية |
|---|---|---|---|
| GAP-01 | `review-agent` مثبتة لكن غير معلنة | لا قناة مراجعة نظامية لبوابة الدمج | إعلانها أو اعتماد قناة بديلة موثقة |
| GAP-02 | مهارات AGHR الحاكمة الست غير مثبتة | منهجية MARSAD بدون أدواتها المرجعية | فتح `S-GOV-1` (Read-Only) بعد S10-B2 |
| GAP-03 | `using-agent-skills` يشير إلى 9 مهارات غير موجودة | قد يفشل التوجيه صامتاً | مراجعة الدليل أو تثبيت المهارات الناقصة |
| GAP-04 | لا مهارة مستقلة عن Codex للدمج | خطر مراجعة ذاتية مقنّعة | تحديد قناة المراجعة المستقلة توثيقياً |
| GAP-05 | `langfuse` غير مستخدمة | لا مقاييس انحدار LLM | تقييم بعد S6 |

## 10. إجراءات التعديل

- **لا تعديل إلا بتفويض مالك منفصل** (مثل أي وثيقة في `docs/00-authority/`).
- **زيادة نطاق**: إضافة مهارة = إصدار فرعي جديد (`v1.x.0`) بعد التحقق من إعلانها.
- **تقييد**: حظر مهارة = إصدار تصحيحي (`v1.0.x`) بسبب حادثة موثقة.
- **مراجعة دورية**: عند كل بوابة (`G1`، `G2`، `G3`، `G4`) تُراجَع الوثيقة.

## 11. قالب الاستشهاد في التفويضات

كل تفويض يجب أن يتضمن:

```
Skills Authorized (per SKILLS_AUTHORIZED.md v1.0.0):
  Phase: <A | B | C | D | E | F | G | H | I>
  Authorized:
    - <skill-1>
    - <skill-2>
  Forbidden in this delegation:
    - كل ما عدا أعلاه
  Binding Constraints applied: C-01 … C-10
  Independent Review Channel (if Merge):
    - <session | human | agent> @ <name/date/SHA>
```

## Appendix A — المهارات غير المعلنة (محظورة)

50 مهارة ملف موجودة في `C:\Users\Majed\.codex\plugins\cache` وغير معلنة لهذه الجلسة، منها:
- `openai-curated-remote/openai-templates/0.1.1` — 20 قالباً.
- `openai-curated/figma/bd2122cb` — 12 مهارة.
- `openai-curated/github/bd2122cb` — 4 مهارات.
- `review-agent` (نظامية).
- `starter-workflow` (قالب داخلي).

القائمة الكاملة في تقرير الجرد 2026-10-21. **مبدأ**: عدم الإعلان = حظر.

## Appendix B — مسارات `using-agent-skills` المعطلة

هذه الأسماء مذكورة في دليل `using-agent-skills` لكنها **غير موجودة محلياً** (مؤكدة في الجرد، القسم 6):

```
test-driven-development
api-and-interface-design
doubt-driven-development
code-simplification
security-and-hardening
ci-cd-and-automation
deprecation-and-migration
documentation-and-adrs
observability-and-instrumentation
```

**قاعدة C-04**: أي محاولة توجيه إلى هذه = محظورة. الإجراء الصحيح: إبلاغ عن الفجوة.

## Appendix C — مهارات AGHR المرجعية (مرشحة للتثبيت)

| المهارة | لماذا يهم MARSAD |
|---|---|
| `governed-learning` | "الدليل يسبق القاعدة" |
| `safe-git-closeout` | بوابة الدمج/النشر |
| `requirements-traceability` | AC ↔ دليل |
| `risk-based-verification` | حدود ما يُثبته الدليل |
| `plan-drift-review` | كشف زحف النطاق |
| `smart-clarification` | حسم الغموض دون اختراع نطاق |

**توصية GAP-02**: `S-GOV-1` Read-Only بعد S10-B2 لتثبيتها في `.agents/skills/` أو مسار مشروع معتمد.

## Appendix D — المراجع

- جرد مهارات Codex، 2026-10-21 (مرفق).
- `using-agent-skills/SKILL.md` (معلنة).
- `docs/00-authority/OWNER_DECISION_REQUESTS.md`.
- `docs/00-authority/DEFERRED_REGISTRY.md`.
- `.agent/PROJECT_STATE.md` @ 2026-10-21.
- `TASKS.md` @ 2026-10-21.

---

**نهاية الوثيقة — SKILLS_AUTHORIZED v1.0.0**

*status: PENDING_OWNER_APPROVAL — لا تُصبح ملزمة إلا بعد اعتماد المالك وإيداعها في `docs/00-authority/`.*
```

---

## ملاحظات إيداع مقترحة

**(أ) قبل الاعتماد الرسمي — قرارات مالك مطلوبة على ثلاث نقاط:**
1. اعتماد الوثيقة `v1.0.0` كما هي، أم تعديل في `C-06`/`GAP-02` لإعطاء مهلة زمنية لتثبيت AGHR.
2. تأكيد `GAP-01` (فجوة `review-agent`): هل تُعلَن قريباً، أم تُعتمد قناة بديلة موثقة؟
3. هل تُدرج الوثيقة الآن في `DOCUMENT_INDEX.md` (وهو معدّل سابقاً في working tree من المالك) أم بعد مراجعة؟

**(ب) الالتزام الإجرائي**: أي تفويض قادم يصدر مني سيتضمن تلقائياً الاستشهاد بها.

**(ج) ملاحظة على "الدليل يسبق القاعدة"**: هذه الوثيقة نفسها **دليل**، ولا تُصبح قاعدة قبل اعتماد المالك — تماماً كما تفعل MARSAD مع كل أصل حاكم.

بانتظار قرارك بالاعتماد أو التعديل.
