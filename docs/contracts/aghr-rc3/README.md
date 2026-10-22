# المرحلة 0 — عقود Studio rc.3

**الحالة:** `COMPLETE_FOR_IMPLEMENTATION_REVIEW`، `contract.1`، 2026-10-22. اكتمل تعريف العقود وفحوصها المحلية؛ المرحلة 0 التنفيذية ما زالت `IN_PROGRESS`. لا يمثل ذلك اعتماد إصدار أو تشغيل واجهات جديدة. مرجع التطبيق 1.2.0 محفوظ.

## المرجعية والنطاق

[مرجع rc.3](../../specs/aghr-rc3/AGHR_REFERENCE.md) يحدد الحوكمة؛ [مواصفة Studio](../../specs/aghr-rc3/STUDIO_SPECIFICATION.md) تحدد المنتج والعقود والقبول. [وصف المنتج المصحح](../../plans/STUDIO_PRODUCT_AND_CONTRACTS_AR.md) يربط الالتزامات C1–C12 بآلية ومعيار قبول. عند الاختلاف تُراجع المسودة؛ لا تعدّل المرجع ضمنيًا.

| العقد | المصدر | التغطية |
| --- | --- | --- |
| [aghr.schema.json](aghr.schema.json)، [aghr.json](aghr.json) | المرجع §2.1 | manifest بـ`schemaVersion: 1.2` ومثال غير مسجل؛ إعلان المالك والتوقيع لا يثبت الثقة |
| [item.schema.json](item.schema.json)، [capability.schema.json](capability.schema.json)، [qualification.schema.json](qualification.schema.json) | المرجع §§3،5،6،7 وStudio §39 | الأنواع والقوى والسلطة والأثر والتدرج، payload المهارة، والتأهيل الواحد/المتعدد بمفاتيحه الأربعة |
| [state.schema.json](state.schema.json)، [auth.schema.json](auth.schema.json) | المرجع §12 وStudio §44 وG.4 | الحالة المنشورة من CI، والثقة وسياق التفويض المملوك للخادم |
| [evidence.schema.json](evidence.schema.json)، [EVIDENCE_FORMAT.json](EVIDENCE_FORMAT.json) | المرجع §12.2 وStudio G.4 | تسلسل JSONL محدد، حدث واحد في السطر، حفظ الأصل، وإقرار خام مستقل عن حالة التنفيذ |
| [001_initial.sql](sqlite/001_initial.sql)، [MIGRATIONS.json](MIGRATIONS.json) | Studio §§5–10 | كتل SQL الست، 12 جدولًا، checksum ومعاملة ذرية وuser_version؛ فحص في الذاكرة فقط |
| [openapi.json](openapi.json)، [API_OPERATIONS.json](API_OPERATIONS.json)، [تغطية العمليات](API_COVERAGE.md) | Studio §§27–36 و§37 | 58 عملية أصلية، وإضافة submit موثقة؛ مداخل وأجوبة وأخطاء ومصادقة، مع قناة WS |
| [أنواع القراءة](api.read.schema.json)، [أنواع التغيير](api.change.schema.json)، [أنواع التنفيذ](api.execution.schema.json)، [الأجوبة المولدة](api.responses.schema.json) | Studio §§5–10 و§§27–36 | أنواع جميع العمليات وأغلفتها، وسجلات الأدلة والمقاييس دون قيم نجاح مصطنعة |
| [proposal.schema.json](proposal.schema.json)، [transport.schema.json](transport.schema.json)، [common.schema.json](common.schema.json) | Studio §§4،21،37–39 | الغلاف المنظم للمقترحات، وتشخيص الأخطاء وأنواع النقل المشتركة |
| [settings.schema.json](settings.schema.json)، [settings.yaml](settings.yaml)، [engine.schema.json](engine.schema.json) | Studio §§26،43،44 | إعدادات ذاكرة بلا أسرار، محرك NOT_CONFIGURED وضوابط موارد محددة لا تدعي التأهيل |
| [DECISIONS.md](DECISIONS.md)، [PROTOCOL.md](PROTOCOL.md) | Studio §46 وG.4 | قرارات التنفيذ وتسلسل الأدلة والثقة والبصمات والتوافق، مع فصل التعريف عن دليل التطبيق |
| [ENGINE_ACCEPTANCE.json](ENGINE_ACCEPTANCE.json) | المرجع وStudio C1–C12 | معايير المحرك والمضيف التي لا تثبتها فحوص JSON؛ تظل REQUIRED / NOT_RUN / NOT_WAIVED |
| [ACCEPTANCE.md](ACCEPTANCE.md) | Studio §§3،45 | تبعيات وقبول المرحلة، مع `REQUIRED / NOT_RUN / NOT_WAIVED` للفحوص التي لم تنفذ |

## حدود العقود

- تُحمّل مخططات JSON العامة لفحص البنية؛ لا يكتب Node نسخة ثانية من منطق AGHR. الحكم النهائي على البنود والتعارض والتوليد والأدلة يتم بمحرك Python واحد مثبت الإصدار والبصمة في Studio وCI.
- تحقق JSON Schema لا يثبت أن بوابة حماية موجودة أو أن مصدرًا موثوقًا أو أن ملف المخرجات غير فارغ. قياس المحتوى، وتسلسل التنفيذ، ومعايير المهمة، وتطابق التأهيل، ومعايرة الأثر فحوص محرك منفصلة.
- `scope.language` لا يغير مجموعة القواعد المنطبقة. يحافظ API على جميع البنود، ويعرض العميل شارة `translation_unavailable` بدل إخفائها.
- الصيغ المنفذة في العقود لا تعتمد تسجيلات 1.2.0 القديمة بوصفها بيانات rc.3. تبقى محولات المحرك وصدق الأدلة وتغطية المهارات المتعددة فحوصًا تنفيذية مطلوبة؛ عقودها محددة في البروتوكول ومعايير القبول.
- `settings.yaml` ليس تفويضًا. لا watcher فعلي ولا اعتماد تلقائي لمدخلات INBOX. يظل الحفظ الدائم وعملية التصدير والتنفيذ تحت مسار التفويض والقبول الخاص بهما.

## التحقق المحلي

من جذر المستودع:

```powershell
pwsh -NoProfile -File tools/check_studio_contracts.ps1
node tools/contracts/build_openapi.mjs --check
npm test
node tools/check_context_health.mjs
```

يفحص المدقق أمثلة مستقلة لكل نوع طلب ولكل جواب عملية، بما فيه رفض انتحال الهوية والنجاح غير المطابق. يجمع المراجع محليًا دون تحميل شبكة، ويقارن API بالنص المعتمد، وSQL بمصدره، ويختبر قيوده في الذاكرة. يضم npm اختبارات تسلسل الأدلة. هذا ليس `aghr validate --strict` أو تأهيل HTTP/متصفح/CI/مضيف.

[إيصال الاستكمال](../../evidence/studio-contracts-completion-2026-10-22/README.md) يحفظ النتائج والنسخ السابقة والفرق. [إيصال البدء](../../evidence/studio-phase0-2026-10-22/README.md) يبقى سجلًا تاريخيًا. يحفظ [CONTRACTS.lock.json](CONTRACTS.lock.json) بصمات هذه النسخة؛ القفل تقني ولا يمنح قبولًا أو تفويضًا.

## التسلسل التالي

راجع [التقييم الذاتي وحدوده](SELF_REVIEW.md) عند الاستلام؛ لا يثبت مراجعة مستقلة.

ربط المحرك المثبت وتأهيل محولاته → العرض المطلوب للقراءة فقط وبوابة عدم الكتابة → تحقق قالب SEC-001 عبر المحرك → مراجعة بنود الحزمة الحالية بالقالب الموحد → الترحيل والدورة التنفيذية. لم يبدأ القالب ضمن مهمة استكمال العقود.
