# تسليم E1.c — حزمة مصدر فعلية ببيانات مالك وترخيص مؤقتة

**التاريخ:** 2026-10-22. **النتيجة:** `DELIVERED_PROVISIONAL / VERIFIED_FOR_E1C_PROVISIONAL_READ_AND_STRUCTURE`.

أُعدت الحزمة في `governance_packages/candidates/AGHR_rc3_Core_Candidate/` بتوجيه المالك بعد E1.b. تحتوي على بند وصفي فعلي واحد، وmanifest وبيان مصدر وترخيص مقترح، ضمن 13 ملفًا. بيانات المالك والترخيص **PROVISIONAL_OWNER_LICENSE** حتى التوقيع الصريح؛ قبول الترخيص النهائي والترقية إلى مرجع ما زالا معلقين. تبقى T01 محجوبة وT02 غير مبدوءة.

## الملفات والمصدر

| الملف | الوظيفة والحالة |
| --- | --- |
| [aghr.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/aghr.json) | هوية المرشح وschemaVersion 1.2؛ owner = Platform Governance Team وlicense = MIT بتوجيه المستخدم المؤقت. Codex وAntigravity هدفان معلنان، وتأهيلهما NOT_RUN |
| [PACKAGE_STATUS.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/PACKAGE_STATUS.json) | CANDIDATE_FOR_REVIEW؛ المصدر حقيقي، وبيانات المالك والترخيص مؤقتة، والتوقيع غير مقدم |
| [LICENSE](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/LICENSE) | مقترح نص MIT مع إشعار مؤقت ونسبة ملكية مقترحة غير موثقة؛ المسار المحدد في توجيه المستخدم بدل LICENSE.md المخطط |
| [SOURCE_MAP.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/SOURCE_MAP.json) | خريطة حقول manifest والبند، وبصمات المصادر ومقطع الاستخراج وبصمة سجل E1.c(4) |
| [reference-state.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json) | OBS-REFERENCE-STATE-001، من نوع OBSERVATION / INFORMATIVE؛ يرصد إعلان المرجع الافتراضي في server/security.js |
| [PROVENANCE.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/PROVENANCE.json) | أصل التنفيذ المحلي وحدود الثقة وبيانات الترخيص المؤقت وجرد الملفات الـ13 |

مصدر البند هو [server/security.js](../../../server/security.js)، السطران 31–32: إعلان DEFAULT_PACKAGE_ID وAGHR_ROOT وقت الرصد. تحفظ [نسخة المصدر الخام](sources/security.js.snapshot) وبصمتها ومقطعها بمواقع البايتات. الاسم والتصنيف والوصف مؤلفة صراحةً وفق نطاق E1.c؛ لا سلطة مصطنعة أو قياس معايرة. `impact.evidence = assumed`، والـauthority محذوف من هذا البند الوصفي.

تعتمد إعدادات manifest البنيوية على [contract.1](../../contracts/aghr-rc3/README.md) والمرجع rc.3. هوية الحزمة محلية، ولا يوجد توقيع أو نسبة إلى توزيع خارجي. هذا رصد للمصدر بتاريخ محدد؛ حالة عملية تطبيق جارية أو تبني مشروع مستهلك تحتاج دليلها المستقل.

## E1.c(4) — المالك والترخيص

يحفظ [السجل](E1C_4_OWNER_LICENSE.json) نص التوجيه الحالي وبصمته، والحالة السابقة واللاحقة، وبصمتي `aghr.json` و`LICENSE` الفعليين. لم يكن هذان الملفان موجودين في المرشح عند بدء المهمة؛ أنشئا من هذا التوجيه. الاسم وMIT الموجودان في مثال rc.3 لم يكونا إثباتًا سابقًا لهوية المالك أو لترخيص التنفيذ.

أُخذ [النص الأصلي المثبت](sources/MIT.spdx.txt) من [SPDX MIT](https://spdx.org/licenses/MIT.html). يسجل الإيصال عنوان التنزيل وتاريخه وبصمته. أضيف إشعار PROVISIONAL، واستبدل قالب سنة/صاحب الحقوق بنسبة مقترحة إلى الاسم المؤقت وسنة الإنشاء 2026؛ هوية صاحب الحقوق غير مصادق عليها. النص المقترح لا يمنح قبولًا نهائيًا للترخيص أو الإصدار. تبقى تراخيص التبعيات منفصلة، ولم تثبت مكتبات جديدة.

أي تغيير لاحق في المالك أو الترخيص أو نصه يحتاج سجل فرق مستقل قبل/بعد وأثره على المرشح، وتحديث حالة القرار في الدفعة المصرح بها. التوجيه لا يسمح بإعادة بناء أو ترقية تلقائية. تتطلب نهاية الحالة المؤقتة توقيع المالك الصريح.

## التحقق المنفذ

| الفحص | النتيجة والدليل |
| --- | --- |
| قراءة أولية للحزمة الفعلية | READ، بند واحد، مصدران خامان، وثبات الملفات؛ [إيصال القراءة](READ_CHECKPOINT.json) |
| قراءة الحزمة المثبتة وتتبع المصدر | بند واحد، حفظ الخام والبصمات والمواقع ومقطع المصدر وسجل E1.c(4)؛ [الناتج الخام](package-verification.stdout.txt)، [برنامج الفحص](verify_package.py) |
| البنية عبر مخططات contract.1 المحلية | قبول manifest والبند؛ رفض حذف owner أو license، وتحويل البند إلى MUST دون authority، وادعاء repo-measured دون حقول المعايرة؛ خمس مخططات محلية بلا استرجاع شبكي |
| تراجع CLI بعد تحديث الجرد والمرحلة | **18/18**، صفر فشل أو تخط؛ [السجل](cli-tests.stderr.txt) |
| اختبارات التطبيق npm test | **41/41**، صفر فشل أو تخط؛ [السجل](npm-test-retry.stdout.txt) |
| CLI فعلي | version = INFO/0 ببصمة الملفات الـ13؛ validate --strict = BLOCKED/3 وNOT_RUN؛ [التشغيلات الخام](RAW_TRANSCRIPT.json) |
| السياق والروابط والحفظ | النتيجة النهائية في [VALIDATION.json](VALIDATION.json) و[EVIDENCE_CHECKS.json](EVIDENCE_CHECKS.json) و[AFTER.json](AFTER.json) |

يحفظ [سجل الاستدعاءات](RAW_TRANSCRIPT.json) executable وargv وcwd والأوقات والخروج وبصمات stdout/stderr. أخفق استدعاء npm الأول في أداة الأدلة قبل بدء الاختبارات. نجح الاستدعاء المنظم عبر Node وnpm-cli.js؛ ثم صُحح قارئ ملخص الأداة ليتعرف على تقرير spec الفعلي. تحفظ [تفاصيل الاستعادة](NPM_EVIDENCE_RECOVERY.json) والمحاولات الأصلية؛ لم تتغير اختبارات المنتج ولم تعد الاختبارات الناجحة.

تظل اختبارات قارئ E1.b الـ28 [دليلًا تاريخيًا محفوظًا](../studio-e1b-2026-10-22/README.md)؛ loader.py وdiagnostics.py وtest_loader.py لم تتغير في E1.c. الفحص الحالي ليس إعادة تأهيل شاملة للقارئ أو المضيف.

## البصمة والفرق وحدود القبول

يثبت [SOURCE_PIN.json](SOURCE_PIN.json) شجرة الملفات الـ13 بخوارزمية sha256-path-map-v1: SHA-256 لبايتات JSON مضغوط مرتب يربط مسارات POSIX النسبية ببصمات بايتاتها، دون BOM أو سطر أخير. هذه بصمة محتوى محلية، لا توقيع ناشر أو بصمة CP/JCS.

- بصمة E1.b السابقة: `7adb0e1aaa3a71bd1ed4814cd7d5b428a6a7895bed401c7953f00cc4f0fc5481`.
- بصمة E1.c الحالية: `3c8c536b0c02c80173cb5e3758a90123f4c3bec5f32e44b2de822c2c26932955`.
- الحالة السابقة و238 مدخلًا محميًا موثقة في [PREFLIGHT.json](PREFLIGHT.json). تحفظ snapshots والفروق في هذا الإيصال؛ يربط EVIDENCE_CHECKS أسماءها وملفاتها.
- مرجع التطبيق وافتراضيه 1.2.0، والمرشح 1.3.0، والعقود والمواصفات وأدلة E1.a/E1.b محفوظة. لم ينفذ commit أو push أو نشر أو تبنٍّ.

G3 أصبحت ذات حزمة مصدر فعلية، ويظل قبولها الجامع في T01 مفتوحًا إلى strict والتحقق من شروطه. **التحقق الحاكم، تأهيل المضيف، التوقيع، المراجعة المستقلة وقبول الإصدار لم تنفذ.** الحالة المؤقتة لا تتجاوز تلك البوابات.

الخطوة التالية عند توجيهها: **E1.d** لإخراج الفهرس وإغلاق نسخ schemas. ثم E2 للتحقق الحاكم وإعادة بوابة T01 وفق [نطاق النواة](../../plans/STUDIO_E1_E2_CORE_SCOPE_AR.md). يبقى التوقيع النهائي للمالك والترخيص إجراءً مطلوبًا في مساره، دون تأليف SEC-001 أو تعديل مرجع أو تشغيل مرحلة تالية تلقائيًا.
