# دليل تشغيل مختبر لسان الأعمى — v2.0

## 1. الحزمة

للاختبار الأعمى الحقيقي استخدم حزمة `lisan-blind-lab` المنفصلة، لا Skill الـProject Hub التي تحتوي Priors.

## 2. قبل التشغيل

- ثبت النسخ والمصادر.
- تحقق من Artifact النص القانوني أو صرح بعدم توفره.
- شغل Validator لبيان التشغيل.
- استخدم Runtime Kernel + Stage Pack فقط.

## 3. المرحلة الأولى

استخدم `BLIND_LAB_MASTER_PROMPT_v3.0_CANONICAL_AR.md`.

## 4. المرحلة الثانية

يفضل فصلها دائمًا، وتصبح المراجعة المستقلة شرطًا للادعاء عالي الأثر أو `REGRESSION_BACKED`. استخدم:

`methodology/quran/stages/STAGE_2_ADVERSARIAL_FALSIFICATION_PROMPT.md`

## 5. المرحلة الثالثة

استخدم:

`methodology/quran/stages/STAGE_3_SEMANTIC_BOUNDARY_PROMPT.md`

## 6. التغطية

- محدود: فهرس وتحليل عميق كاملان.
- واسع: فهرس كامل + عينة عميقة لا تقل عن 10 وتغطي كل العناقيد الموثقة، ثم توسعة عند ظهور معلومات جديدة.

## 7. القفل

املأ Lock Eligibility Report وشغل `scripts/validate_run_artifacts.py`. لا يكفي تصريح النموذج.

## 8. التشغيلات المحجوبة

تخضع لتدقيق منهجي باستخدام `templates/quran/19-methodology-audit-blocked-run.md`، مع بقاء Priors مغلقة.

## 9. بعد القفل

المقارنة مع Priors المشروع تحدث في Project Hub فقط. لا تعدل اللقطة الصامتة.

## 10. النجاح

قد يكون النجاح:

- نواة قوية؛
- استبعادًا حاسمًا؛
- اكتشاف غموض بنيوي؛
- `UNKNOWN` صحيحًا؛
- Rule/Regression جديدًا.
