# تسليم E1.b — قارئ manifest والبنود

**الحالة:** `IMPLEMENTED_AND_TESTED_FOR_E1B_READER`، 2026-10-22. تنفيذ الشريحة بتوجيه المالك بعد [E1.a](../studio-e1a-2026-10-22/README.md)، داخل المرشح نفسه وبالتبعيات المقفلة نفسها. [النطاق والحالة والتقدير المحدث](../../plans/STUDIO_E1_E2_CORE_SCOPE_AR.md).

## الملفات والسلوك

| الملف | التغيير |
| --- | --- |
| [tools/loader.py](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/tools/loader.py) | قارئ محدود للملفات وتحليل JSON/YAML وفهرس في الذاكرة مع المصدر الخام والبصمات والمواقع |
| [tools/diagnostics.py](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/tools/diagnostics.py) | ReadFailure وتشخيص منظم مع المصادر الملتقطة؛ لا فهرس ناجح جزئي عند الفشل |
| [tests/test_loader.py](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/tests/test_loader.py) | 28 اختبارًا للقراءة والحدود والحفظ والرفض، منها junction فعلي على Windows |
| [PROVENANCE.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/PROVENANCE.json)، [CLI_CONTRACT.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/CLI_CONTRACT.json) | جرد المصدر أصبح ثمانية ملفات؛ توثيق ملف القراءة وحدوده دون تغيير contract.1 |
| [tools/cli.py](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/tools/cli.py)، [اختباره](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/tests/test_cli.py) | تحديث هوية المصدر لتشمل القارئ وتشخيصاته واختباره؛ واجهة CLI ما زالت help/version مع حجب التنفيذ الحاكم |

واجهة Python هي `read_package(root, source_paths=None, limits=ReaderLimits())`. تعيد `READ` و`validation_status=NOT_RUN`؛ يختلف حفظ البيانات عن قبولها حوكميًا. تحفظ اختيار المصادر DEFAULT_ROOTS/EXPLICIT_PATHS نفسه كيلا تختلط قراءة جزء من الحزمة بفحصها كاملة.

| المصدر | التصنيف |
| --- | --- |
| `aghr.json` | JSON واحد بإصدار schemaVersion 1.2؛ تحقق المخطط الكامل مؤجل إلى E2 |
| `policies/` و`decisions/` و`capabilities/` | بنود، مع استثناء المسارين المساعدين أدناه |
| `capabilities/qualifications/` | سجلات تأهيل خام؛ لا تفعّل مهارة أو تمنح QUALIFIED |
| `capabilities/project-selections/` | اختيارات مشروع؛ لا تعامل كبنود حاكمة |
| `profiles/` | ملفات تهيئة محفوظة مع تجميعها الأصلي |

تقرأ امتدادات JSON/YAML/YML فقط داخل المسارات المعروفة، دون قراءة المراجع أو الشيفرة أو INBOX أو تاريخ compatibility/verification. لا يتبع القارئ المستودعات/الحزم المتداخلة أو الروابط أو junction/reparse points، حتى داخل الجذر. لا تستورد ملفات المشروع المدخل ولا تنفذها.

## الحفظ والحدود

- تحفظ البايتات الأصلية وUTF-8 وSHA-256 والمسار النسبي POSIX، مع مستندات YAML المتعددة وقوائم البنود. موقع البند: رقم مستند يبدأ من صفر، وJSON pointer، وسطر/عمود يبدأان من واحد، ونطاق بايتات UTF-8 نهايته غير مشمولة.
- لا تملأ authority أو القياسات أو التأهيل أو أي حقل مفقود. تبقى التواريخ وyes/no/on/off نصوصًا، وتقرأ أرقام JSON العشرية وtrue/false بأنواعها. لا يدعي الملف دعم كل تراكيب YAML.
- رفض المفاتيح والمعرفات المكررة، والوسوم الصريحة والمراجع/الدورات والدمج، والمفاتيح غير النصية، وأخطاء JSON/UTF-8 والأعداد غير المحدودة والمدخلات الخارجة عن حدود القارئ. استند التحليل إلى [PyYAML المقفل](https://github.com/yaml/pyyaml/blob/6.0.3/lib/yaml/composer.py)، وليس تنفيذ parser مستقلًا.
- القيم الافتراضية في ReaderLimits: 1 MiB للملف و16 MiB إجمالًا، 256 ملفًا، 4,096 مدخل مجلد، عمق مجلدات 16، عمق تركيب 48، 20,000 عقدة للملف، 128 مستندًا للملف، 10,000 بند؛ وحد الأعداد الصحيحة 256 رقمًا. يملك المستدعي الحدود، ولا يستوردها من manifest غير موثوق.
- عند الفشل تحفظ المصادر الملتقطة في الاستثناء. النص ذو UTF-8 المعيب يعرض باستبدال معلّم ولا يصبح بندًا صالحًا؛ الالتقاط الناقص لا يحمل بصمة ملف كامل. فشل القراءة أو غياب البنود لا يصبح فهرسًا فارغًا ناجحًا.
- تقارن هوية مقبض الملف وبيانات الملفات والمجلدات للكشف عن تغيّر المصدر أثناء القراءة. يبقى ثبات المصدر شرطًا؛ لا يدعي ذلك لقطة ذرية من نظام التشغيل أو تأهيل حدود الذاكرة/الزمن في T15.

## الأدلة والنتائج

| الدليل | النتيجة |
| --- | --- |
| [candidate-tests.log](candidate-tests.log) | **46/46**، منها **28 قارئًا و18 CLI**، دون إخفاق أو تخط |
| [npm-test.log](npm-test.log) | **41/41** للتطبيق؛ لا تغييرات على الواجهة أو خدمات التطبيق |
| [READER_TRANSCRIPT.json](READER_TRANSCRIPT.json) | ثلاث تجارب ملفات فعلية على مدخلات اصطناعية: READ، ومعرف مكرر، وUTF-8 معيب؛ إضافة إلى CLI version وstrict المحجوب وخام المخرجات |
| [SOURCE_PIN.json](SOURCE_PIN.json) | بصمة المصدر الجديد وثمانية ملفات، مرتبطة ببصمة E1.a السابقة |
| [PREFLIGHT.json](PREFLIGHT.json) | تسع لقطات قبل التحرير و185 مدخلًا محميًا؛ تفويض E1.b فقط |
| [REGRESSIONS.json](REGRESSIONS.json) | تصنيف العيبين المثبتين وتصحيحهما وربطهما بالاختبار والدليل قبل/بعد |
| [VALIDATION.json](VALIDATION.json)، [AFTER.json](AFTER.json) | نتائج الفحوص النهائية وبصمات التسليم والفروق وحفظ المدخلات |

اكتشفت المراجعة عيبين في التنفيذ الجديد وصنفتهما PRODUCT_DEFECT: قبول اختيار ملف مباشرة عبر مستودع متداخل، ورفض زوج Unicode مهرب صحيح في JSON. أثبتهما [اختبارا ما قبل الإصلاح](regression-before-fix.log)، ثم أصلح فحص حدود المجلدات الوسيطة وفك الزوج الصحيح مع استمرار رفض المحرف المنفرد. الاختباران موجودان وناجحان في المجموعة النهائية؛ لم تخفف البوابة أو تتخطَّ الحالة البيئية.

تغيرت بصمة المصدر من `e28b5897b9c6e4a5e12d8fd43420e69b89c832c8355a64b954ad82f4d01f8fde` إلى `7adb0e1aaa3a71bd1ed4814cd7d5b428a6a7895bed401c7953f00cc4f0fc5481`. أدلة E1.a محفوظة كلقطة سابقة؛ فحوص المرشح الحالية ترتبط بالمصدر الجديد.

## الحالة التالية

لا يوجد manifest لحزمة مرجعية فعلية داخل المرشح بعد؛ ملفات التجارب في temp اصطناعية وليست E1.c. لا إخراج فهرس إنتاجي من CLI قبل E1.d، ولا strict/lint حاكمان قبل E2. ترخيص المصدر الجديد NOT_ASSIGNED، وهوية الناشر UNKNOWN، وربط المحرك بالتطبيق لم يتغير.

T01 `BLOCKED_NOT_CLOSED`، T02 `NOT_STARTED`؛ تأهيل المضيفين NOT_RUN، والمراجعة المستقلة NOT_PERFORMED، وقبول الإصدار NOT_GRANTED. المرجع الافتراضي 1.2.0 والمرشح 1.3.0 والعقود محفوظة. التقدير الأولي للمتبقي من E1.c/E1.d وE2 وإعادة T01 هو 7–13 يوم عمل غير مقاس؛ انتظار الترخيص/المالك وE3–E6 خارج هذا التقدير.

**موضع الاستئناف:** E1.c — إعداد مرشح مصدر فعلي وإثبات بيانات المالك والترخيص، بعد توجيه الشريحة.
