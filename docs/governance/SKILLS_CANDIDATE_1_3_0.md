# تسليم مرشح حوكمة المهارات — AGHR 1.3.0

**التفويض والحالة:** تنفيذ تعليمات المالك بتاريخ 2026-10-21 على مرشح مستقل. الحالة `CANDIDATE_FOR_REVIEW`؛ لم يُرقَّ المرجع أو يُنشر أو يُفعّل في مشروع مستفيد. يبقى المرجع وافتراضي التطبيق 1.2.0.

## الناتج القابل للمراجعة

- [مجلد المرشح](../../governance_packages/candidates/AGHR_Candidate_1.3.0/README.md).
- [ZIP](../../governance_packages/candidates/AGHR_Candidate_1.3.0.zip) و[بصمته](../../governance_packages/candidates/AGHR_Candidate_1.3.0.zip.sha256).
- [الخطة ومصفوفة العيب/الدالة/الاختبار/القبول/التوافق](../plans/SKILLS_GOVERNANCE_CANDIDATE_1_3_0.md).
- [الفرق النصي الكامل](../evidence/skills-candidate-1.3.0/reference-to-candidate.diff)، [قائمة تغييرات الحزمة](../evidence/skills-candidate-1.3.0/payload-changes.json)، [إيصال ما قبل العمل](../evidence/skills-candidate-1.3.0/before.json)، و[إيصال الناتج](../evidence/skills-candidate-1.3.0/after.json).
- [مصالحة مصادر INBOX](../../governance_packages/candidates/AGHR_Candidate_1.3.0/design/SKILLS_INPUT_RECONCILIATION.json): الرأي RECONCILE في المرشح؛ وصف المهارة وجردا المضيفين REFERENCE_ONLY. لا سلطة تنفيذ من النص المستورد.

## ما تغير

| المسألة | 1.2.0 المحفوظة | المرشح 1.3.0 |
|---|---|---|
| تحميل التعليمات | SKILL_ACTIVATED وverified=true | LOADED / HOST_HANDOFF / PREPARED؛ التنفيذ والتحقق NOT_RUN |
| حالة UNKNOWN أو غياب دليل تنفيذ | قد تقبل PASS | FAIL دون SUCCESS صريح وسجل تشغيل وأدلة مرتبطة |
| معرّف مجهول أو مخرجات فارغة | قد تقبل PASS | رفض صريح |
| task_criteria | لا تستخدم | فحص nonempty / equals / contains، وتغطية المعايير المطلوبة بدليل صحيح |
| نقص الصلاحيات أو الأدوات | توصية بالتنفيذ المباشر | BLOCKED مع السبب؛ عدم الحاجة وعدم التطابق حالتان منفصلتان |
| الاكتشاف | سجل الحزمة ومطابقة محدودة | بيانات مضيف صريحة دون مسح أو تثبيت؛ aliases عربية وإنجليزية وهوية مؤهلة لكل مهارة |
| الاختيار | افتراضي واحد ووصف حد عام اثنين | مجموعة كافية لكل مرحلة، وتفضيلات مشروع وميزانية اختيارية وحذف الاختيار الزائد |
| التعلم | الإجراء القائم متاح | ربط تقييم الاستخدام به؛ سيناريو درس CANDIDATE / NOT_APPLIED دون ترقية أو تعديل سياسة |

[فحص السلوك السابق](../evidence/skills-candidate-1.3.0/before-behavior.json) و[اللاحق](../evidence/skills-candidate-1.3.0/after-behavior.json) يحفظان الفرق المرصود. المطابقة محدودة وليست فهمًا دلاليًا شاملًا؛ فحص الأدلة محلي، ولا يصادق على هوية المنتج أو يمنح صلاحية أو قبول إصدار.

التغيير يشمل 17 ملفًا مضافًا و23 معدلًا في payload، دون حذف. أعيد استعمال سجل EVIDENCE والتعلم القائم؛ لا مهارة skill-router جديدة ولا خدمة مستقلة. [دليل الترحيل](../../governance_packages/candidates/AGHR_Candidate_1.3.0/SKILLS_MIGRATION_1_2_TO_1_3.md) يشرح تغير الحالات والمدخلات المطلوبة للمستهلكين.

## التحقق والحفظ

| الفحص | الدليل والنطاق |
|---|---|
| الحزمة النهائية | [320/320، دون فشل أو تخطٍّ](../evidence/skills-candidate-1.3.0/full-suite-final/unittest-summary.json)، ومنها السيناريوهات الثمانية المحلية عبر CLI ومشروع مؤقت |
| Studio | [30/30](../evidence/skills-candidate-1.3.0/studio-tests-final.json)، والسجل الأول 29/30 محفوظ |
| البنية وmanifest | [PASS](../evidence/skills-candidate-1.3.0/package-final-check.json) للمرشح المجمد |
| السياق والروابط | [سجل الفحص النهائي](../evidence/skills-candidate-1.3.0/context-final.json) |
| الحفظ | [278 ملفًا من المرجع وملفات توزيعه و21 أصل INBOX محفوظة](../evidence/skills-candidate-1.3.0/preservation.json) |
| ZIP | 314 عضوًا تطابق بايتات المرشح؛ البصمة المنفصلة تشمل النتائج المستبعدة من payload manifest |

القواعد الـ47 وملفات SKILL.md الإحدى عشرة بقيت ببايتاتها؛ AGHR-038 لم تتغير. لم تتغير مهارات المستخدم أو الإضافات أو إعدادات المضيف.

اختبار Studio الخاص بالحفظ كان يستخدم إيصال 20 أكتوبر ذي ثمانية ملفات، بينما أضيف 13 أصلًا. صُنّف الفشل TEST_DEFECT / STALE_CONTEXT، وربط الاختبار بالإيصال الحالي مع فحص الأصول الثمانية السابقة ورفض تغير البصمة أو حذف بند؛ لم يتغير منطق أداة الحفظ. [الفرق المحدود](../evidence/skills-candidate-1.3.0/studio-inbox-test.diff) و[حدود إيصال هذا الاختبار](../evidence/skills-candidate-1.3.0/studio-inbox-test-custody.json) يوضحان أن نص ما قبل التعديل أعيد بناؤه من القراءة السابقة، دون ادعاء بصمة أصلية لم تُلتقط. حفظ المرجع والمرشح منفصل وبايتاته مثبتة.

Manifest النهائي: `974a29e5f2950d2aeab1bb8cd03caf9f961a1da04c3205309b70601343c6433e`.

ZIP النهائي: `41dbd6df9de1e17b69d1aece08aadce104a338f7ed1450c1166263de2ca46829`.

## الفجوات وحد القرار

تأهيل Codex وAntigravity الحقيقي NOT_RUN، وبعض إسناد التفعيل NOT_OBSERVABLE. الاختبارات المحلية لا تستبدلهما. تقييم النموذج الحي NOT_RUN؛ المراجعة المنفذة ذاتية وليست مستقلة، والمراجعة المستقلة NOT_PERFORMED؛ قبول الإصدار NOT_GRANTED والتبني NOT_ADOPTED. لا قياسات سببية لمنفعة المهارة أو وفورات أداء لم تُجرَ.

الفرع main عند `4b9b877d835450f119b09d28bdc70faaaf791f4b` مع العمل السابق غير الملتزم محفوظ. الخطوة التالية الاختيارية مراجعة مستقلة للمرشح المجمد، ثم تأهيل المسارات المطلوبة على كل مضيف قبل قرار الترقية أو التبني.
