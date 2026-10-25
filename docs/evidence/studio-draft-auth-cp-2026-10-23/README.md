# تسليم Draft — T13/T14 وT15 وبداية T16

**النطاق:** اعتمد المالك T12 ضمن المحاكاة، وأجاز تفعيل الكتابة في بيئة مسودات فقط. نُفذ ربط الهوية والمنح والتخزين والتدقيق، ومحول الموارد Windows، وأول إنشاء/عرض CP. لا اعتماد إصدار أو ترقية للمرجع. [التشغيل والاستخدام وحدود API](../../features/STUDIO_DRAFT_MODE.md).

## المنفذ

| المهمة | الحالة والأثر |
| --- | --- |
| T13 | تفويض خادمي فعلي في Draft: هوية من OS bootstrap، منح مرتبطة بالفاعل/workspace/namespace/الفعل/CP/بصمة المقترح/المدة، مرة واحدة. لا إصدار منح أو رفع أدوار من HTTP؛ الموافقة من طرفية المشغل. جميع مسارات الأعمال الكاتبة تتطلب منحة، وغير المنفذ وlegacy يرفض403 مع التدقيق. المعاينة تقرأ/تحلل فقط ولا تحفظ CP أو تصدر منحة |
| T14 | SQLite دائمة فعلية، 12 جدولًا، الهجرة المقفلة نفسها. جُرّب المسار الافتراضي ثم أعيد فتحه مع بقاء التدقيق؛ لا CP تجريبية فيه. إنشاء CP ودليل نجاحه معاملة واحدة. إخفاق التدقيق يلغي CP؛ الرفض محفوظ بهوية خادمية أو unauthenticated دون تخمين |
| T15 | محول Windows Job Object: حدود eval600s وqualify3600s و2GiB؛ بدء داخل Job قبل أول تعليمة، منع breakaway، watchdog مستقل، قتل الشجرة، مخرجات جزئية، تمييز الإلغاء عن التجاوز. الاختبارات بعمليات مصطنعة وحد ذاكرة128MiB؛ لم يُشغل eval/qualify الحقيقيان |
| T16 — الشريحة الأولى | شاشة عربية/إنجليزية RTL/LTR، إعداد بند واحد بمخطط Python ثم إنشاء/قائمة/تفاصيل Draft CP، حالة الفحوص NOT_RUN. تظل بقية دورة T16 مفتوحة، خاصة قدرات E5 للمحرك والتحقق/التحرير/الإرسال للمراجعة |

## أدلة التشغيل

- [تفعيل التخزين الافتراضي](APP_STORAGE_ACTIVATION.json): `.governance/studio-drafts/studio.sqlite`، 184320 بايت عند الرصد، إقلاعان و12 جدولًا، 0 CP تجريبية، سجل التدقيق استمر. توقفت عمليات الاختبار؛ لا خادم اختبار متروك. الملف التشغيلي mutable ومستثنى من قفل المصادر؛ البصمة رصد مؤرخ وليست وعدًا بثبات قاعدة تشغيلية.
- [طلب Create الفعلي](HTTP_CREATE_REQUEST.json)، [HTTP رفض403](HTTP_DENIED.json)، [قائمة CP المحفوظة](HTTP_CREATED_LIST.json)، [سجل التدقيق الفعلي](HTTP_AUDIT.json)، [مطابقة الاستجابات بالعقود](API_CONTRACTS.json).
- [Edge/Sentinel](BROWSER_SENTINEL.json) و[المتصفح](BROWSER.json): واجهة فعلية، اعتماد من قناة المشغل،201 للحفظ و403 للرفض و422 لبند بلا authority.level، إعادة تشغيل وقراءة نفس CP، 1521 ملفًا سابقًا محفوظة، ولا كتابة مصادر. الكتابة المسموحة: قاعدة الاختبار وjournal وملف Edge المعزول. [نسخة SQLite المعزولة](ISOLATED_DRAFT_DB.sqlite) مصطنعة وليست قاعدة التطبيق.
- الواجهة: [العربية](DRAFT_AR.png)، [الإنجليزية](DRAFT_EN.png)، [الهاتف](DRAFT_MOBILE.png)، [التدقيق](DRAFT_AUDIT.png). استُخدم Microsoft Edge بملف معزول وCDP مباشر؛ MCP وPlaywright غير متاحين، ولا وصول إلى ملف المتصفح العادي.
- `npm test`: **77/77** بلا فشل أو skipped؛ build ناجح. فحص السياق: المخرجات الخام في npm-test.txt وbuild.txt وcontext-health.txt؛ الخلاصة النهائية في VERIFICATION.json. يوجد تنبيه build للحزمة الكبيرة السابقة، دون تعطيل البناء.

## صدق الحالات والفصل

1. SourceGrant الخاص بـT12 وOWNER_T12_OVERRIDE لا يصدران صلاحية Backend. اعتمد المالك إغلاق T12 **MOCK_ONLY**؛ نتيجة CLI الأصلية لذلك المرشح تبقى BLOCKED/3.
2. Python المثبت يحمل القارئ والمخططات مرة واحدة لجلسة Draft، ويقرأ النص المقدم ويفحص المخطط بما فيه authority.level؛ لا منطق حوكمة مكرر في Node ولا تعديل للمحرك أو schemas.
3. حفظ Draft لا يعني نجاح validate --strict. تجزئة المقترح وفق المجال المحدود من JCS محول محلي `LOCAL_ADAPTER_NOT_E5`. قدرات E5 الأصلية، الأنواع التشغيلية والمعايرة، والتحرير والتحقق والإرسال لم تُدعَ مكتملة.
4. الأدلة التشغيلية `.aghr/runtime_evidence/` وstate.json لا تُكتب هنا. فحوص E4 السبعة `REQUIRED / NOT_RUN / NOT_WAIVED`، وE3 الحقيقي والتوليد والنشر لم تبدأ.
5. هذا تحقق ملف محلي على Windows، لا تأهيلًا لمضيف Codex/Antigravity أو مراجعة مستقلة. المرجع1.2.0 والمرشح T12 والمحرك ذو46ملفًا والعقود محفوظة.

## ملاحظات الاختبارات والمراجعة

[ROOT_CAUSES.json](ROOT_CAUSES.json) يحفظ الفشل الأولي وتصحيحه؛ لا نتائج محذوفة أو tests skipped. تأكد DRAFT_PARSER_TIMEOUT من التشخيص، وعولج بإعادة استخدام القارئ دون رفع مهلة الطلب15s. بوابة npm test تعمل بتزامن ملفين، ولا تغيّر حدود المنتج. قيس تجاوز وقت فعلي وإنهاء كل الأبناء، ورفض تخصيص ذاكرة فعلي مع JOB_MEMORY_LIMIT وقراءة الحد من Windows. بقي قياس PeakJobMemoryUsed الخام قرب132MiB لعينة128MiB؛ لم يخفض إلى رقم مصطنع، وتفسير العداد الداخلي غير محسوم. لا يُساوى هذا العداد بدليل تخصيص ناجح فوق الحد.

رُوجعت الصحة والوضوح والمعمارية والأمن والموارد ذاتيًا وفق code-review-and-quality؛ المراجعة ليست مستقلة. ثُبتت معالجة سجل محاولة مرفوضة لنفس CP قبل نجاح إعادة المحاولة، ومعاملة audit/CP، وعدم قبول رموز وهمية أو أدوار يرسلها العميل. صور before/after والفروق وبصمات المصادر في DIFFS.json وCUSTODY.lock.json.

## الخطوة التالية

استكمال T16 عبر قدرات E5 المؤهلة على المحرك: اقتراح/بصمة وتحليل مرتبطان بالمحرك، ثم edit→validate→submit وفق الشروط. لا يبدأ توليد أو تصدير أو تغيير مصدر مرجعي ضمن هذا التسليم.

## المصادر التقنية للمحول

بُني محول الموارد على واجهات Windows الأصلية الموثقة: [Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)، [JOB_LIST في UpdateProcThreadAttribute](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-updateprocthreadattribute)، [حدود الذاكرة](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_extended_limit_information)، و[رسائل completion port](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_associate_completion_port). يُسند الحكم على نجاح الحالات المختبرة إلى الأدلة المحلية أعلاه.
