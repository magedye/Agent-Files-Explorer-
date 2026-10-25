# T12 المحاكى ونواة T13/T14

**الحالة:** `T12 CLOSED_FOR_T12_OWNER_APPROVED_MOCK_ONLY` بناءً على شرط المالك الصريح ونجاح التشغيل. `T13/T14 CORE_IMPLEMENTED_TESTED_ISOLATED`؛ التكامل والتفعيل التفاعلي للكتابة لم يُنفذا. التطبيق الحالي يظل للقراءة فقط.

## T12 — Passing Candidate Package ضمن المحاكاة المعتمدة

حُفظت المسودات الأصلية المقفلة دون تعديل. النسخة الجديدة في [owner-approved-mock](../../../governance_packages/candidates/AGHR_T12_Candidate/owner-approved-mock/README.md)، وبها نفس البنود الـ47.

- [SourceGrant.json](../../../governance_packages/candidates/AGHR_T12_Candidate/owner-approved-mock/.t12/SourceGrant.json) يحمل `OWNER_GRANTED_T12` و`T12_OWNER_APPROVED_MOCK`، وموقّع بـEd25519 بمفتاح اختبار مؤقت في الذاكرة؛ لم يُحفظ المفتاح الخاص.
- [HOST_FIXTURE_PIN](HOST_FIXTURE_PIN.json) خارج النسخة يثبت المفتاح العام والإيصال وmanifest ومجموعة مصادر البنود كاملة. لا يُستمد هذا التثبيت من ملف يصدّق نفسه.
- صارت authority.status=active وapprovedBy=OWNER_T12_OVERRIDE في **44** قاعدة MUST/MUST_NOT، للمحاكاة فقط. بقيت الثلاث SHOULD في draft، ومنح المصدر المحاكاة مربوطة بقيمها الفعلية. تغيّر authority.source إلى ملف SourceGrant لكل الـ47.
- جميع الحقول المعدلة موسومة في [FIELD_PROVENANCE](../../../governance_packages/candidates/AGHR_T12_Candidate/owner-approved-mock/drafting/FIELD_PROVENANCE.json)، و[قبل/بعد](MOCK_BEFORE_AFTER.json) محفوظ. لم تُخفض severity أو force أو gate.required.
- ثلاثة أدلة E3 محاكاة فقط: AGHR-004 وAGHR-014 وAGHR-016، type=human-approval وrequired=true. لم يُبنَ doctor حقيقي.

| التشغيل الفعلي على نفس النسخة | النتيجة | Exit |
| --- | --- | ---: |
| موائم الاختبار — validate --strict | VALID، 47 بنداً | **0** |
| موائم الاختبار — lint | VALID، 47 بنداً | **0** |
| CLI الأصلي دون الموائم | BLOCKED | **3** |

مقتطف من stdout الفعلي للموائم:

```json
{"protocol_version":"3","command":"validate","result":"VALID","exit_code":0}
```

حقل checks.reason وstderr يعلنان `T12_OWNER_APPROVED_MOCK`. [stdout الكامل](mock-validate.stdout.json)، [lint](mock-lint.stdout.json)، [نتيجة CLI الأصلي](native-control.stdout.json)، [الاستدعاءات والنتائج](RUN_RESULTS.json).

الموائم أداة اختبار مستقلة في tools/t12. يتحقق Node من توقيع وبصمات الـ47 والمجموعة الكاملة، ثم يمرر SourceGrant إلى API الموجود في E2 داخل عملية Python معزولة تمنع الكتابة والشبكة والعمليات التابعة. يستدعي validate_package/lint_package الأصليين، ويستبدل اعتماد E3 للثلاثة المحددة فقط داخل العملية. لا يعيد كتابة النتيجة أو رمز الخروج بعد حسابهما، ولا يعدل المحرك أو CLI أو schemas. publisher_authentication يبقى UNKNOWN، وqualification=NOT_RUN، وgovernance_release_acceptance=NOT_GRANTED.

**الإغلاق يخص Passing Candidate في المحاكاة التي أجازها المالك.** لا يتضمن قبولاً إنتاجياً أو SourceGrant حقيقياً للكتابة أو ترقية مرجع. فحوص E4 السبعة REQUIRED / NOT_RUN / NOT_WAIVED.

## T13 — العمل المنفذ في Backend

- [write-authorization.js](../../../server/studio/write-authorization.js): هوية ودور من bootstrap الخادم وجلسة محلية، ومنح عشوائية قصيرة الأجل مخزنة في الخادم ومربوطة بالفاعل/workspace/المشروع/الفعل/المورد/بصمة المقترح. الإيصالات كائنات خاصة بالعملية لا يعاد إنشاؤها من JSON.
- إصدار المنح يتطلب governance-owner موثّقاً في تهيئة المضيف؛ يُفحص دور المستفيد، والانتهاء، والإبطال، والنطاق، وإعادة الاستخدام عند الأثر. لا endpoint لرفع الدور أو إصدار منحة من جسم طلب.
- بيانات SourceGrant المحاكاة وOWNER_T12_OVERRIDE وAUTHORIZED_BY_PROJECT_OWNER لا تمنح صلاحية Backend. لا تستورد شيفرة server موائم tools/t12.
- [staging.js](../../../server/staging.js) يطلب إيصالاً خادمياً للإنشاء وإصدار الرمز والتطبيق والاسترداد. أزيل قبول الرمز الثابت؛ الرمز الديناميكي وحده لا يكفي. فُحصت بصمات المحتوى المرحلي، وربط الاسترداد ببصمات النسخة المراجعة، وحُميت مسارات الحوكمة والروابط الرمزية.
- مسارات legacy الكاتبة في [api.js](../../../server/api.js) تعيد 403 قبل قراءة الجسم. بقيت معاينات adoption التي لا تكتب متاحة. إزالة تهيئة مجلدات التخزين عند import أو GET من intake/evaluation تمنع الكتابة العرضية.
- التغيير في اختبار M3 من 201 إلى 403 يعكس عقد منع الكتابة غير المفوضة الحالي؛ لم يُضعف اختبار لإخفاء فشل. اختبار M6 ما زال يثبت staging/precondition/apply/rollback، باستخدام منح حقيقية من كود الخادم وملفات مؤقتة خارج التطبيق.

## T14 — التخزين المصرح به المعزول

[persistent.js](../../../server/studio/db/persistent.js) يوفر factory مستقلة تحتاج تصريح storage.initialize مربوطاً بالمسار وبصمة migration. لا يستدعيها runtime الحالي؛ createCatalog ما زال :memory:.

- SQL المقفل نفسه، checksum SHA-256 قبل فتح الملف، transaction وROLLBACK وPRAGMA user_version=1، وبصمة DDL عند إعادة الفتح؛ **12 جدولاً** دون جدول ledger إضافي.
- قيود SQLite الأصلية وتاريخ الموافقات محفوظة؛ رفض schema زائدة أو إصدار غير مدعوم. لا استعادة تلقائية لبيانات مالك.
- audit_events بإدراج parameterized، وactor/actor_role من إيصال خادمي مستهلك، وsimulated_role=NULL؛ رفض إعادة تسجيل الإيصال نفسه، وعدم كشف db أو SQL عام من factory.
- اختبار فعلي لملف SQLite في مجلد مؤقت: فتح، كتابة audit، إغلاق، إعادة فتح، والتحقق من البيانات. اختبار فشل migration بواسطة رفض CREATE INDEX فعلياً ثم إثبات rollback إلى صفر جداول وإعادة المحاولة؛ واختبار FK لتاريخ الموافقات وانحراف DDL.

## التحقق والأدلة

- `npm test`: **68/68**، صفر فشل أو skipped.
- اختبارات T12 ترفض توقيعاً مزوراً ومفتاحاً مختلفاً وبنداً زائداً غير موقع وتغير manifest؛ وسيناريو موقّع صالح يفقد scope يُرفض INVALID/1.
- اختبارات T13 تشمل HTTP فعلياً، تزوير الأدوار، اختلاف المشروع/الفعل/المورد/البصمة، انتهاء/إبطال المنحة وإعادة الاستخدام، والرفض قبل أي أثر. اختبار عملية Node محمية يثبت صفر كتابة عند import/refusal؛ لا ينسب إليه إثبات Edge/Sentinel جديد.
- التحقق النهائي وفروق المصادر في VERIFICATION.json وDIFFS.json؛ صور before/after الخام محفوظة. CUSTODY.lock.json يربط القفل السابق ومدخلات النسخة الجديدة والمخرجات.

## حدود التسليم والخطوة التالية

T12 مغلقة في النطاق المحاكى المعتمد. نواة T13 وT14 منفذة ومختبرة، وتبقى مهام تكامل الكتابة التفاعلية مفتوحة: ربط هوية المشغل وإصدار المنح ومسارات الأعمال وسجل قراراتها بمخزن يحدد مساره صراحة. لم يُفعّل مخزن تطبيق دائم، ولم يُفتح CRUD أو يولد AGENTS.md أو يكتب state.json/runtime_evidence. اختبارات الملفات وSQLite كانت في مساحات مؤقتة معزولة، ومخرجات الأدلة كتبها المشغل.

المرجع 1.2.0 والمسودات السابقة والمحرك ذو 46 ملفاً والعقود محفوظة. لا اعتماد إصدار أو استقلال مراجعة أو تأهيل مضيف. لم تبدأ T15/T16 أو E3 الحقيقي أو E4.
