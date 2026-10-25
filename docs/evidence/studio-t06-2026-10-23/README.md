# T06 — SEC-001: أدلة التحقق والفجوة المتبقية

**الحالة:** `INCOMPLETE_ACCEPTANCE_NOT_MET`؛ T06 **لم تُغلق**. اعتمد المالك Phase 0 وT01 وT02–T05؛ تبقى مقبولة ضمن نطاق القراءة المحلي. إعداد التقرير لا يمنح نجاح القبول المفقود.

## التنفيذ الفعلي

أُلّف [المرشح المستقل](../../../governance_packages/candidates/AGHR_T06_SEC001_Candidate/README.md) من rc.3 §3.2، بكامل الحقول الرئيسية السبعة عشر. بقي `MUST_NOT / critical` وبوابة إنفاذ مطلوبة، دون تخفيض شدة أو تغيير المرجع 1.2.0. [مصدر التأليف والبصمات](AUTHORING_SOURCE.json)، و[جرد النسخ](CANDIDATE_INVENTORY.json).

أضيف اختيار `packageRoot` كتهيئة محلية موثوقة لجسر Python، محصورًا داخل مجلد candidates، مع رفض الروابط والمسارات الخارجية. يبقى الافتراضي حزمة المحرك نفسها، ويبقى مصدر Python مثبتًا وبروتوكول CLI 3 دون تغيير. لم يضف أي معامل HTTP لاختيار مسار، ولم تضف آلية لتصديق منح من داخل الملف. [بداية العمل وحفظ الحالة السابقة](PREFLIGHT.json)، و[اعتماد المالك](OWNER_ACCEPTANCE.json).

| المدخل | نتيجة المحرك الفعلية | Exit | الاستنتاج |
| --- | --- | --- | --- |
| SEC-001 كامل الحقول | BLOCKED؛ structure=PASS | **3** | البنية صحيحة؛ القبول الحاكم غير مثبت |
| حذف authority.level | INVALID / SCHEMA_REQUIRED | **1** | رفض النقص الإلزامي مثبت |
| حذف scope | INVALID / SCHEMA_REQUIRED | **1** | رفض غياب النطاق مثبت |
| حذف evalFixtures | INVALID / SCHEMA_REQUIRED | **1** | رفض غياب مرجع التقييم مثبت |

[نتائج التشغيل](RUN_RESULTS.json) وملفات `*.execution.json` تحفظ executable/argv/cwd ووقتي البدء والنهاية، وبصمات المحرك والمدخلات والإعدادات والمخرجات. `*.stdout.json` و`*.stderr.txt` تحفظ النصوص الخام لكل نسخة. عملية جمع الأدلة مستقلة عن رمز خروج المحرك؛ نجاح الجامع ليس نجاح T06.

## مقتطفات من المخرجات

من stdout للنسخة الكاملة، حقول مقتطفة دون تغيير قيمها:

```json
{"protocol_version":"3","command":"validate","result":"BLOCKED","exit_code":3}
```

من stderr للنسخة الكاملة:

```text
AUTHORITY_SOURCE_UNVERIFIED: AUTHORITY_SOURCE_UNVERIFIED at /authority.
ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE: ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE at /enforcement.
```

من stdout للنسخة التي حذفت scope:

```json
{"protocol_version":"3","command":"validate","result":"INVALID","exit_code":1}
```

ومن stderr:

```text
SCHEMA_REQUIRED: SCHEMA_REQUIRED at /scope.
```

المخرجات الكاملة: [الكامل stdout](complete.stdout.json)، [الكامل stderr](complete.stderr.txt)، [نقص المستوى](missing-authority-level.stderr.txt)، [نقص النطاق](missing-scope.stderr.txt)، [نقص evalFixtures](missing-eval-fixtures.stderr.txt).

## سبب عدم الإغلاق وخطة الاستكمال المحددة

1. **إثبات السلطة:** `authority.level: enterprise` واسم الموافق في الملف لا يصدقان نفسيهما. `authority.py` يقبل `SourceGrant` خارجيًا عبر API، لكن CLI المثبت يمرر قائمة منح فارغة ولا يستقبل إثباتًا موثوقًا من المضيف. اعتماد المالك تنفيذ T06 لا يمثل مصادقة مؤسسية تلقائية على الأسماء الموروثة من المثال.
2. **إثبات الإنفاذ:** `evidence.py` يعيد `ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE` للبند الحرج ذي بوابة required؛ لا توجد حاليًا في E2 آلية مؤهلة لقبول دليل فعلي على scanner/CI gate. وصف الأوامر والبوابة في JSON لا يثبت وجودهما أو نجاحهما.

**المطلوب التالي لقبول T06:** مصدر سلطة خارجي معتمد ومحدد للمجال، ومسار read-only مؤهل لإثبات بوابة الإنفاذ في E3 وربطها ببصمة المرشح، ثم إعادة strict وإثبات exit 0. لا يحتاج هذا التحديد إلى CRUD أو تخزين دائم أو توليد، لكنه يتطلب قدرة ودليلًا لا يوفرهما المصدر المقبول حاليًا. [تقرير الفجوات](GAPS.json) يربط كل فجوة بالملف والدالة ومعيار قبولها.

لم تتغير قواعد المحرك أو مخططاته لإزالة هذه الحواجز، ولم نختزل T06 إلى فحص بنية أو نعدّل التقرير إلى نجاح. بقي التوليد وE4 والتخزين الدائم غير مبدوءة. [اختبارات التسليم](VERIFICATION.json)، و[الفروق](DIFFS.json)، و[قفل البصمات](CUSTODY.lock.json) تحفظ نطاق العمل وحدوده.
