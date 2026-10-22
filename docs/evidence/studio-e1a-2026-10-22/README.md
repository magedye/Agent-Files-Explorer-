# تسليم E1.a — مصدر المرشح وبروتوكول CLI والتبعيات

**الحالة:** `IMPLEMENTED_AND_TESTED_FOR_E1A_BOOTSTRAP`، 2026-10-22. توجيه المالك أجاز هذه الشريحة وحدها. [النطاق والتبعيات](../../plans/STUDIO_E1_E2_CORE_SCOPE_AR.md) يحدد ما يليها؛ لا تمثل هذه النتيجة قبول إصدار أو إغلاق T01 أو تأهيل مضيف.

## المصدر المنفذ

أنشئت خمسة ملفات داخل `governance_packages/candidates/AGHR_rc3_Core_Candidate/`، دون نسخ الحزم القديمة:

| الملف | الوظيفة |
| --- | --- |
| [PROVENANCE.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/PROVENANCE.json) | مصدر محلي جديد، نطاق التفويض، جرد الملفات، مراجع التصميم، وفصل البصمة عن التوثيق والثقة |
| [CLI_CONTRACT.json](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/CLI_CONTRACT.json) | بروتوكول CLI الداخلي 1 ومخطط 2020-12 لنتائجه، مستقل عن contract.1 المقفل |
| [tools/cli.py](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/tools/cli.py) | help/version وهوية المصدر؛ استدعاء بلا shell أو تنفيذ لملفات المشروع |
| [requirements.lock](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/requirements.lock) | قفل سبع توزيعات وبصمات wheel؛ CPython 3.12 / Windows AMD64، دون source builds |
| [tests/test_cli.py](../../../governance_packages/candidates/AGHR_rc3_Core_Candidate/tests/test_cli.py) | 18 اختبارًا للبروتوكول وعمليات CLI والعزل والبصمة والتبعيات |

بصمة المصدر `sha256-path-map-v1`:

```text
e28b5897b9c6e4a5e12d8fd43420e69b89c832c8355a64b954ad82f4d01f8fde
```

تحسب من خريطة المسارات النسبية POSIX إلى SHA-256 لبايتات الملفات الخمسة، بترتيب مفاتيح ثابت. طابقت عملية حساب مستقلة في Node ما أعاده CLI في Python؛ ليست CP/JCS أو توقيع ناشر. `repository_context_head` في provenance موضع المستودع قبل العمل؛ المصدر الجديد غير موجود في ذلك commit ولم ينسب إلى إصدار خارجي.

## سلوك CLI المثبت

| الطلب | النتيجة | الخروج |
| --- | --- | --- |
| `--help` أو `--version` | INFO لطلب المعلومات؛ checks = NOT_RUN | 0 |
| `validate --strict` أو `lint` | BLOCKED / IMPLEMENTATION_UNAVAILABLE؛ التنفيذ الحاكم ينتظر E2 | 3 |
| generate/check/doctor/eval/qualify | BLOCKED مع المرحلة المطلوبة؛ لم ينفذ جسم أي منها | 3 |
| أمر أو علم غير صحيح، أو مصدر هوية ناقص | ERROR مع سبب محدد، دون إعادة قيم المعاملات إلى السجلات | 2 |
| INVALID | محجوز لنتيجة تحقق فعلية في E2؛ لم يصدر من bootstrap | 1 |

JSON هو الافتراضي: كائن UTF-8 واحد في stdout وسطر نهاية واحد، وstderr محفوظ بصورة مستقلة. `--format text` متاح للمساعدة والعرض النصي. candidate/config/inputs hashes والفهرس null؛ لا فهرس فارغ مصطنع ولا VERIFIED أو PASS لتحميل التعليمات. لا كتابة ملفات أو تشغيل عمليات أو اتصال شبكة داخل CLI.

مثال PowerShell على البيئة المحلية التي اختبرت:

```powershell
$e1Python = 'D:/APP/Agent-Files-Explorer/temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'
$e1Cli = 'D:/APP/Agent-Files-Explorer/governance_packages/candidates/AGHR_rc3_Core_Candidate/tools/cli.py'
& $e1Python -I -B -X utf8 $e1Cli --version --format json
& $e1Python -I -B -X utf8 $e1Cli validate --strict --format json # المتوقع: BLOCKED، خروج 3
```

هذه البيئة تحت `temp/` المهمل في Git، وليست توزيعًا متنقلًا أو ربطًا بمحرك التطبيق. تعاد إنشاؤها من القفل عند الحاجة؛ بقي Python الأساسي وإعدادات المضيف كما هي.

## التبعيات والتحقق

ثبتت PyYAML 6.0.3 وjsonschema 4.26.0، مع attrs وjsonschema-specifications وreferencing وrpds-py وtyping-extensions بإصداراتها المحددة في القفل. نزلت wheels من PyPI وfiles.pythonhosted.org، وتحققت SHA-256، ثم ثبتت **بلا شبكة** من wheelhouse محلي مع `--require-hashes --only-binary=:all: --no-compile`. اجتاز `pip check` إغلاق التبعيات. تتفق الآلية مع [توثيق pip الرسمي](https://pip.pypa.io/en/stable/topics/secure-installs/).

| الدليل | النتيجة وحدودها |
| --- | --- |
| [SOURCE_PIN.json](SOURCE_PIN.json) | خمس بصمات وبصمة تجميع محلية؛ ليست Binding.QUALIFIED أو توثيق هوية الناشر |
| [DEPENDENCY_SOURCES.json](DEPENDENCY_SOURCES.json) | URLs وmetadata وأسماء wheels وتبعياتها وتراخيصها وبصماتها؛ الأصل الخام محفوظ تحت `pypi/` |
| [DEPENDENCY_INSTALL.json](DEPENDENCY_INSTALL.json)، [تقرير pip](pip-install-report.json) | تثبيت معزول بقفل hash؛ pip check ناجح؛ لا تثبيت عالمي |
| [candidate-tests.log](candidate-tests.log) | **18/18** بلا إخفاق أو تخط؛ يشمل تغيّر البصمة والنقل إلى مسار عربي والأخطاء ورفض النجاح المصطنع وعدم الكتابة |
| [CLI_TRANSCRIPT.json](CLI_TRANSCRIPT.json) | ستة استدعاءات فعلية مؤرخة وخام stdout/stderr؛ INFO وBLOCKED وERROR مفصولة |
| [npm-test.log](npm-test.log) | **41/41** للتطبيق؛ لا تستبدل تأهيل المحرك أو المضيفين |
| [PREFLIGHT.json](PREFLIGHT.json) | التفويض والموضع وخمس لقطات قبل التحرير و127 مدخلًا محميًا |
| [VALIDATION.json](VALIDATION.json)، [AFTER.json](AFTER.json) | نتيجة الفحوص النهائية وحفظ المدخلات وبصمات التسليم وفروق الوثائق |

فحص مكتبة PyYAML يثبت توفر safe_load ورفض الوسوم التنفيذية في تلك الواجهة؛ **لا يثبت تنفيذ قارئ E1.b أو حدوده للمفاتيح المكررة والدورات**. مخطط CLI واختباراته لا يحلان محل محرك الحوكمة أو سياسة المضيف.

## ما بقي مفتوحًا

- ترخيص المصدر الجديد `NOT_ASSIGNED` وهوية الناشر `UNKNOWN`؛ لا MIT مفترض من مثال المواصفة أو من المكتبات الخارجية. بيانات ترخيص المكتبات منفصلة في مصدر التبعيات. توقيع التوزيع وتوثيق الناشر NOT_RUN.
- لا manifest لحزمة مرجعية فعلية، ولا loader/catalog أو strict/lint حاكمان بعد. تبقى G1/G2/G3 مفتوحة عند حدودها في T01، رغم توفر مصدر bootstrap مثبت محليًا.
- T01 `BLOCKED_NOT_CLOSED`، T02 وE1.b `NOT_STARTED`؛ native qualification `NOT_RUN`، independent review `NOT_PERFORMED`، release acceptance `NOT_GRANTED`.
- المرجع الافتراضي 1.2.0 والمرشح 1.3.0 والعقود المعتمدة محفوظة؛ لم يتغير ربط المحرك في التطبيق أو يرقَّ أي مرجع.

**موضع الاستئناف:** E1.b — قراءة manifest والبنود، بعد توجيه الشريحة. تحفظ أدلة T01 وتعريف النطاق السابق كما صدرت، وتراجع معها الحالة الحالية قبل البدء.
