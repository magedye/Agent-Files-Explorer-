# خطة الاختبارات ومقاييس التحقق — Evaluation & Measurement

## 1. قبل الاختبار

أصدر `Test Oracle` واضحًا لكل حالة قبل تعديل القاعدة. افصل مجموعة التطوير عن التحقق وعن مجموعة `holdout` محجوبة لا تدخل في تحسين Prompt. ضع نسخ النموذج والبيئة والسياسات والأدوات والزمن وحجم العينة ضمن السجل. لا تستخدم بيانات اختبار كتبها النموذج نفسه كدليل موثوق دون تدقيق.

## 2. مصفوفة الحد الأدنى

| النوع | الحالة | النتيجة المتوقعة |
|---|---|---|
| Positive | شرط السماح مستوفى وواضح | السلوك المسموح فقط |
| Negative | شرط مطلوب غير متحقق | رفض أو بديل آمن وفق طبيعة القاعدة |
| Unknown | سلطة/بيان غير مؤكد | لا تختلق إذنًا أو بيانات؛ للعمليات الحساسة DENY |
| Malformed | مدخل مخالف للمخطط | فشل تحقق مضبوط |
| Boundary | قيمة عند الحد الأدنى/الأقصى | نتيجة ثابتة حسب التعريف |
| Override | تعليمات مستخدم تعارض مصدرًا أعلى موثوقًا | تطبيق سلطة المصدر الصحيح |
| Injection | نص مسترجع يتضمن أوامر خفية | لا يرفع إلى مصدر تعليمات |
| Tool Failure | الأداة أو خدمة المصادقة غير متاحة | لا يسمح بإجراء حساس دون تفويض |
| Expired | تفويض منتهي الصلاحية | DENY |
| Replay | نفس العملية تتكرر أو تتزامن | لا تنفيذ مكرر خارج سياسة idempotency |
| Regression | تحديث نموذج أو قاعدة | لا تراجع غير مقبول في حالات حرجة |

لا تلزم كل الأنواع لكل بند R0؛ اختر الاختبارات التي تميز نجاح المطلوب عن إخفاقه.

## 3. أنواع المراجع

- `DETERMINISTIC`: برنامج/محرك سياسة يطابق ناتجًا محددًا؛ تحقق من صحة الـoracle نفسه.
- `SEMANTIC`: قاضٍ آلي أو Rubric متخصص يقارن النص بالمرجع؛ يحتاج معايرة.
- `HUMAN`: مراجعة بشرية ذات معايير معلنة، وقد تتطلب عينة معماة.
- `INTEGRATION`: اختبار التنفيذ الحقيقي عند نقطة التحكم، خاصةً تفويض الأدوات.
- `ADVERSARIAL`: اختبارات تجاوز/حقن/تكرار/سلاسل ثقة متعددة.

## 4. المؤشرات والمقامات

**Unauthorized Attempt Block Rate** = attempts known to be unauthorized and blocked / all **known unauthorized attempts**.

**Unauthorized Execution Rate** = unauthorized actions actually executed / all **known unauthorized attempts**. لا يعني الصفر أن الاستكشاف كامل.

**False Denial Rate** = authorized actions incorrectly denied / all known-authorized attempted actions.

**Policy Denial Rate** = rejected attempted actions / all attempted actions. زيادة معدل الرفض قد تعني تشددًا أو هجومًا أو إعدادًا سيئًا، وليست برهان نجاح.

**Instruction Adherence** = conforming applicable cases / all evaluated applicable cases. عرّف قابلية الانطباق والحالات غير الحاسمة.

**Evidence Completeness** = cases with required trustworthy evidence / all eligible cases. اكتمال الأدلة لا يضمن صحتها إلا مع تحقق مستقل مناسب.

**End-to-end Latency** و**Inference Cost** و**Quality** مؤشرات حراسة تشغيلية مستقلة عن الامتثال.

لا تزعم نسب مئوية أو فروق أداء أو دلالة إحصائية دون بيانات تشغيل فعلية. النتيجة `99/100` لا تعني ضمان 99% لكل الحالات المستقبلية. يجب إعلان حجم العينة وطريقة جمعها والتاريخ والفترة.

## 5. مقارنة البدائل

ثبت نفس الحالات والـoracle لكلا النسختين، ودوّن:
- `baseline_id`, `candidate_id`, `model_version`, `seed if supported`, `run_id`, `case_id`, `oracle`, `result`, `failure_class`, `evidence_ref`.
- لا تخلط تغييرات النموذج مع تغييرات صياغة البنود؛ عند الحاجة استخدم تصميم تجارب يفصل العوامل.
- لا تقارن جودة بالاتساق اللفظي فقط؛ يمكن الاستجابة لصيغتين مختلفتين سليمتي المعنى.
- لا تختبر وتدرّب على مجموعة holdout ثم تظل تصفها بأنها محجوبة.
- تُفصل إخفاقات `P0` عن المتوسط؛ لا يسمح معدل نجاح عالٍ بتمرير فشل حرج.

## 6. الحُكم النهائي

`NOT_RUN` مخطط فقط، `PASSED_IN_SCOPE` مثبت ضمن الحالات، `FAILED` إخفاق موثق، `INCONCLUSIVE` حكم غير محسوم، `BLOCKED` مانع حرج. لا تستخدم `APPROVED` أو `ACTIVE` دون مصدر اعتماد/تفعيل مستقل.
