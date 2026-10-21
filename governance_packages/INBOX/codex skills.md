# جرد مهارات Codex — 21 أكتوبر 2026

أُجري الجرد **للقراءة فقط**. لم أثبّت أو أحذف أو أعدّل أي مهارة. أُعيد فحص بصمات الملفات الـ125 في نهاية الجرد، ولم تتغير.

## 1. النتيجة الإجمالية

| الفئة | ملفات `SKILL.md` المحلية | المعلنة لهذه الجلسة | ملاحظات |
|---|---:|---:|---|
| مهارات النظام | 5 | 4 | `review-agent` موجودة، وغير مدرجة في قائمة الجلسة |
| مهارات المستخدم | 18 | 17 | `lisan-quran` معطّلة صراحةً |
| مهارات إضافات الجلسة | 54 | 54 | تشمل إضافتي لسان القرآن |
| مهارات إضافتي Figma وGitHub المحليتين | 16 | 0 | الإضافتان مفعّلتان في الإعدادات؛ مهاراتهما غير معلنة هنا |
| مهارات مشروع في مسارات الاكتشاف التلقائي | 0 | 0 | لا توجد مهارات مشروع مثبتة بهذه الطريقة |
| مهارات الحزمة المرجعية AGHR | 11 | 0 | أصول مرجعية اختيارية، خارج مسارات الاكتشاف |
| مهارات قوالب محفوظة في ذاكرة الإضافات | 20 | 0 | وجود محلي؛ التفعيل غير مثبت |
| قالب مهارة داخل Plugin Creator | 1 | 0 | نموذج لإنشاء مهارة، وليس مهارة تشغيلية مفعّلة |
| **المجموع المحلي المفحوص** | **125** | **75** | العدد يشمل الأصول المرجعية والقوالب |
| **الكتالوج الخارجي المفحوص** | — | — | **39 مهارة؛ تسعة أسماء منها موجودة محليًا أيضًا** |

**المعلنة** تعني أن المهارة مدرجة في قائمة المهارات المتاحة لهذه الجلسة. أما وجود الملف أو تفعيل إضافة في الإعدادات فيثبت حالة مختلفة عن إعلان المهارة للجلسة.

تعتمد مهارات Codex على ملف `SKILL.md`، وتختلف مسارات اكتشاف مهارات المستخدم والمشروع والنظام. كما يمكن أن يظهر اسمان متماثلان دون دمجهما تلقائيًا. [وثائق OpenAI لاكتشاف المهارات](https://learn.chatgpt.com/docs/build-skills).

### قراءة الجداول

- **اسم كل مهارة رابط إلى ملف `SKILL.md` الفعلي**، محليًا أو في المستودع الخارجي.
- الأوصاف والوظائف أدناه ملخصات عربية للبيانات والتعليمات المقروءة.
- مصدر كل مجموعة ومسارها موضحان قبل جدولها.

---

# 2. المهارات المثبتة محليًا

## أ. مهارات النظام — System Skills

**المصدر:** مهارات Codex المدمجة.
**الجذر:** `C:\Users\Majed\.codex\skills\.system`

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام | الحالة |
|---|---|---|---|---|
| [imagegen](C:/Users/Majed/.codex/skills/.system/imagegen/SKILL.md) | إنشاء الصور وتحريرها | توليد أصول وصور من وصف أو مرجع | التصميم، الرسومات، النماذج البصرية | مثبتة ومعلنة |
| [openai-docs](C:/Users/Majed/.codex/skills/.system/openai-docs/SKILL.md) | إرشادات OpenAI وCodex | الرجوع إلى الوثائق الرسمية الحالية | APIs، النماذج، الإعدادات، المهارات | مثبتة ومعلنة |
| [skill-creator](C:/Users/Majed/.codex/skills/.system/skill-creator/SKILL.md) | تأليف المهارات | إنشاء أو تحسين مهارة ومواردها | تخصيص Codex، الإجراءات المتكررة | مثبتة ومعلنة |
| [skill-installer](C:/Users/Majed/.codex/skills/.system/skill-installer/SKILL.md) | إدارة تثبيت المهارات | عرض الكتالوج والتثبيت من مستودعات | اكتشاف المهارات وإدارتها | مثبتة ومعلنة |
| [review-agent](C:/Users/Majed/.codex/skills/.system/review-agent/SKILL.md) | مراجعة تغييرات للقراءة فقط | استخراج العيوب القابلة للإجراء | مراجعة الفروق والالتزامات | مثبتة؛ غير معلنة لهذه الجلسة |

## ب. مهارات المستخدم — User Skills

### المسار الأول: `.agents\skills`

**المصدر:** تثبيت المستخدم المحلي.
**الجذر:** `C:\Users\Majed\.agents\skills`

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام | الحالة |
|---|---|---|---|---|
| [browser-testing-with-devtools](C:/Users/Majed/.agents/skills/browser-testing-with-devtools/SKILL.md) | اختبار المتصفح الحقيقي | فحص DOM والشبكة والأخطاء والمظهر | الواجهات، اختبارات المتصفح | مثبتة ومعلنة |
| [code-review-and-quality](C:/Users/Majed/.agents/skills/code-review-and-quality/SKILL.md) | مراجعة جودة متعددة المحاور | تقييم الشيفرة قبل الدمج | الجودة، الصيانة، المراجعات | مثبتة ومعلنة |
| [context-engineering](C:/Users/Majed/.agents/skills/context-engineering/SKILL.md) | تنظيم سياق الوكيل | ضبط التعليمات والمراجع والاستئناف | حوكمة الوكلاء والمشاريع | مثبتة ومعلنة |
| [debugging-and-error-recovery](C:/Users/Majed/.agents/skills/debugging-and-error-recovery/SKILL.md) | تشخيص منهجي للأعطال | إثبات السبب ثم إصلاحه والتحقق | الأعطال، البناء، الاختبارات | مثبتة ومعلنة |
| [find-skills](C:/Users/Majed/.agents/skills/find-skills/SKILL.md) | اكتشاف مهارات مناسبة | البحث عن قدرات قابلة للإضافة | توسيع إمكانات الوكيل | مثبتة ومعلنة |
| [frontend-ui-engineering](C:/Users/Majed/.agents/skills/frontend-ui-engineering/SKILL.md) | تطوير واجهات متقنة | بناء واجهات متجاوبة وميسّرة | الويب، المكونات، تجربة الاستخدام | مثبتة ومعلنة |
| [git-workflow-and-versioning](C:/Users/Majed/.agents/skills/git-workflow-and-versioning/SKILL.md) | تنظيم عمل Git والإصدارات | إدارة الفروع والالتزامات والتغييرات | التطوير، الدمج، الإصدارات | مثبتة ومعلنة |
| [idea-refine](C:/Users/Majed/.agents/skills/idea-refine/SKILL.md) | تنقيح الأفكار | تحليل البدائل والافتراضات | اكتشاف المنتج والتخطيط | مثبتة ومعلنة |
| [incremental-implementation](C:/Users/Majed/.agents/skills/incremental-implementation/SKILL.md) | التنفيذ التدريجي | تقسيم التغيير إلى أجزاء قابلة للتحقق | الميزات والتغييرات المتعددة | مثبتة ومعلنة |
| [interview-me](C:/Users/Majed/.agents/skills/interview-me/SKILL.md) | استيضاح الاحتياج | مقابلة منظمة لتحديد المطلوب | المتطلبات والطلبات الغامضة | مثبتة ومعلنة |
| [performance-optimization](C:/Users/Majed/.agents/skills/performance-optimization/SKILL.md) | تحسين الأداء | تشخيص الاختناقات وقياس التحسن | الواجهات والخوادم وقواعد البيانات | مثبتة ومعلنة |
| [planning-and-task-breakdown](C:/Users/Majed/.agents/skills/planning-and-task-breakdown/SKILL.md) | تفكيك العمل | تحويل المتطلبات إلى مهام مرتبة | الخطط وتقدير النطاق | مثبتة ومعلنة |
| [shipping-and-launch](C:/Users/Majed/.agents/skills/shipping-and-launch/SKILL.md) | إعداد الإطلاق | تنظيم التحقق والمراقبة والتراجع | النشر والإطلاقات | مثبتة ومعلنة |
| [source-driven-development](C:/Users/Majed/.agents/skills/source-driven-development/SKILL.md) | تطوير مستند إلى المصادر | إسناد القرارات إلى الوثائق الرسمية | الأطر والمكتبات والتكاملات | مثبتة ومعلنة |
| [spec-driven-development](C:/Users/Majed/.agents/skills/spec-driven-development/SKILL.md) | المواصفات قبل التنفيذ | تحديد العقود ومعايير القبول | المشاريع والميزات المهمة | مثبتة ومعلنة |
| [using-agent-skills](C:/Users/Majed/.agents/skills/using-agent-skills/SKILL.md) | توجيه استخدام المهارات | اختيار المهارة المناسبة للمرحلة | تنظيم سير عمل الوكيل | مثبتة ومعلنة |

### المسار الثاني: `.codex\skills`

**الجذر:** `C:\Users\Majed\.codex\skills`

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام | الحالة |
|---|---|---|---|---|
| [langfuse](C:/Users/Majed/.codex/skills/langfuse/SKILL.md) | رصد وتقييم تطبيقات الذكاء الاصطناعي | التتبّع والتجارب ومجموعات التقييم | LLM، الوكلاء، تقييم المخرجات | مثبتة ومعلنة |
| [lisan-quran](C:/Users/Majed/.codex/skills/lisan-quran/SKILL.md) | بحث قرآني داخلي تراكمي | إدارة البحث والفرضيات والأدلة | الألفاظ والجذور والدراسات القرآنية | **مثبتة ومعطّلة صراحةً** |

وجدت إعداد `enabled = false` لمهارة `lisan-quran` في إعدادات المستخدم، ولم أغيّره.

---

## ج. مهارات الإضافات المعلنة للجلسة — Plugin Skills

**جذر ملفات الإضافات:**
`C:\Users\Majed\.codex\plugins\cache`

### إضافتا لسان القرآن — 14 مهارة

المصدران:

- `created-by-me-remote/dev-4f852f1010848191b338196d967bdccb/1.1.0-cumulative.2`
- `created-by-me-remote/quran-lisan-candidate/1.1.0-candidate.1`

كل صف أدناه يمثل **مهارتين معلنتين تحت نطاقَي إضافتين مختلفتين**.

| الاسم | الوصف | الوظيفة ومجال الاستخدام | ملف النسخة التراكمية | ملف النسخة المرشحة |
|---|---|---|---|---|
| `lisan-compare` | مقارنة الاستعمال القرآني | التفريق الدلالي بين لفظين أو تركيبين | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/dev-4f852f1010848191b338196d967bdccb/1.1.0-cumulative.2/skills/lisan-compare/SKILL.md) | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/quran-lisan-candidate/1.1.0-candidate.1/skills/lisan-compare/SKILL.md) |
| `lisan-context` | تحليل السياق القريب | دراسة آية أو تركيب محدد | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/dev-4f852f1010848191b338196d967bdccb/1.1.0-cumulative.2/skills/lisan-context/SKILL.md) | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/quran-lisan-candidate/1.1.0-candidate.1/skills/lisan-context/SKILL.md) |
| `lisan-hypothesis` | اختبار الفرضيات | فحص الفرضية والأدلة المضادة | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/dev-4f852f1010848191b338196d967bdccb/1.1.0-cumulative.2/skills/lisan-hypothesis/SKILL.md) | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/quran-lisan-candidate/1.1.0-candidate.1/skills/lisan-hypothesis/SKILL.md) |
| `lisan-occurrences` | جمع المواضع والإحصاء | استرجاع الصيغ وفحص دعوى الورود | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/dev-4f852f1010848191b338196d967bdccb/1.1.0-cumulative.2/skills/lisan-occurrences/SKILL.md) | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/quran-lisan-candidate/1.1.0-candidate.1/skills/lisan-occurrences/SKILL.md) |
| `lisan-setup` | الإعداد وتشخيص الحالة | فحص النسخة والبصمات والأدوات | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/dev-4f852f1010848191b338196d967bdccb/1.1.0-cumulative.2/skills/lisan-setup/SKILL.md) | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/quran-lisan-candidate/1.1.0-candidate.1/skills/lisan-setup/SKILL.md) |
| `lisan-study` | دراسة الدلالة الداخلية | البحث في معنى لفظ أو تركيب | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/dev-4f852f1010848191b338196d967bdccb/1.1.0-cumulative.2/skills/lisan-study/SKILL.md) | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/quran-lisan-candidate/1.1.0-candidate.1/skills/lisan-study/SKILL.md) |
| `lisan-verify` | تدقيق الدراسات | مراجعة الاقتباسات والأعداد ودعم الدعاوى | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/dev-4f852f1010848191b338196d967bdccb/1.1.0-cumulative.2/skills/lisan-verify/SKILL.md) | [SKILL.md](C:/Users/Majed/.codex/plugins/cache/created-by-me-remote/quran-lisan-candidate/1.1.0-candidate.1/skills/lisan-verify/SKILL.md) |

### Codex Security — 15 مهارة

**المصدر:** `openai-curated-remote/codex-security/0.1.32`
**حالة جميع الصفوف:** مثبتة ومعلنة.

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام |
|---|---|---|---|
| [assess-patch-risk](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/assess-patch-risk/SKILL.md) | تقييم مخاطر رقعة ثابتة | تحليل الأثر والانحدار وقابلية الدمج | الرقع ونطاقات الالتزامات |
| [attack-path-analysis](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/attack-path-analysis/SKILL.md) | تحليل مسار الهجوم | تتبع المصدر إلى موضع الأثر | تحليل نتائج أمنية محددة |
| [deep-security-scan](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/deep-security-scan/SKILL.md) | فحص أمني متعدد الجولات | تجميع مراجعات مستقلة متكررة | التدقيق الأمني الشامل |
| [define-security-policy](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/define-security-policy/SKILL.md) | تحديد سياسة الأمن | إعداد أو تحديث `SECURITY.md` | حدود المراجعة والضمانات |
| [finding-discovery](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/finding-discovery/SKILL.md) | اكتشاف نتائج مرشحة | البحث عن مشكلات أمنية محتملة | مرحلة الاكتشاف |
| [fix-finding](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/fix-finding/SKILL.md) | إصلاح ثغرة محددة | تنفيذ إصلاح والتحقق منه | المعالجة الأمنية المصرح بها |
| [propose-security-hardening](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/propose-security-hardening/SKILL.md) | تحسينات أمنية بنيوية | اقتراح بدائل وحلول معمارية | تقوية تصميم النظام |
| [security-diff-scan](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/security-diff-scan/SKILL.md) | مراجعة أمن الفروق | تدقيق تغييرات محددة | PR والالتزامات والتغييرات المحلية |
| [security-scan](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/security-scan/SKILL.md) | فحص مستودع أمني | مراجعة كاملة بجولة واحدة | المستودعات والمكونات |
| [threat-model](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/threat-model/SKILL.md) | نمذجة التهديدات | تحديد الأصول وحدود الثقة ومسارات الإساءة | تصميم الأمن |
| [track-findings](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/track-findings/SKILL.md) | تتبع النتائج المثبتة | تسجيل القضايا والتنبيهات | إدارة المعالجة الأمنية |
| [triage-finding](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/triage-finding/SKILL.md) | فرز نتائج واردة | تقييمها مقابل الشيفرة والسياسة | نتائج الماسحات والتقارير |
| [validation](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/validation/SKILL.md) | التحقق من صحة النتيجة | إثبات أو نفي النتيجة المرشحة | التحقق الأمني |
| [verify-fix](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/verify-fix/SKILL.md) | مراجعة إصلاح أمني | التحقق من معالجة الثغرة | اعتماد الإصلاح المحدد |
| [vulnerability-writeup](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.32/skills/vulnerability-writeup/SKILL.md) | كتابة تقرير ثغرة | تنظيم الأدلة والأثر وإعادة الإنتاج | التقارير والإفصاح |

بعض هذه المهارات مخصصة **لمراحل داخل الفحص**؛ لا تُعامل كلها كنقاط بدء لفحص المستودع.

### بقية إضافات الجلسة — 25 مهارة

**حالة جميع الصفوف:** مثبتة ومعلنة. يظهر المصدر في الاسم المؤهل ومسار الملف.

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام |
|---|---|---|---|
| [visualize:visualize](C:/Users/Majed/.codex/plugins/cache/openai-bundled/visualize/1.0.49/skills/visualize/SKILL.md) | تصورات تفاعلية | شرح العلاقات والسيناريوهات بصريًا | المقارنات والمحاكاة |
| [google-drive:google-drive](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/google-drive/0.1.22/skills/google-drive/SKILL.md) | إدارة محتوى Drive | البحث والتنظيم والوصول للمستندات | مستندات Google |
| [google-drive:google-docs](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/google-drive/0.1.22/skills/google-docs/SKILL.md) | مستندات Google الأصلية | إنشاؤها وتحريرها بالأدوات المتصلة | الكتابة والتعاون |
| [google-drive:google-drive-comments](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/google-drive/0.1.22/skills/google-drive-comments/SKILL.md) | تعليقات المستندات | كتابة التعليقات والردود ومعالجتها | مراجعة المستندات |
| [google-drive:google-sheets](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/google-drive/0.1.22/skills/google-sheets/SKILL.md) | جداول Google | تحليل وتعديل الخلايا والصيغ والرسوم | البيانات والتخطيط |
| [google-drive:google-slides](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/google-drive/0.1.22/skills/google-slides/SKILL.md) | عروض قائمة على مرجع | تعديل العروض مع اتباع قالبها | Google Slides |
| [pages:write-page](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/pages/0.1.23/skills/write-page/SKILL.md) | تأليف الصفحات | إنشاء أو تعديل Page أو Space | التوثيق والمحتوى |
| [pages:organize-space](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/pages/0.1.23/skills/organize-space/SKILL.md) | تنظيم المساحات | إعادة ترتيب الصفحات وبنيتها | إدارة المعرفة |
| [pages:maintain-space](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/pages/0.1.23/skills/maintain-space/SKILL.md) | صيانة المعرفة | دمج الأدلة الجديدة في الصفحات | تحديث التوثيق |
| [pages:manage-schedules](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/pages/0.1.23/skills/manage-schedules/SKILL.md) | الأتمتة المجدولة | مراجعة الجداول وإدارتها | أعمال Space المتكررة |
| [plugin-creator:create-plugin](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/plugin-creator/0.1.28/skills/create-plugin/SKILL.md) | إنشاء الإضافات | تجميع المهارات والأدوات والتكاملات | Plugins وMCP |
| [plugin-creator:update-plugin](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/plugin-creator/0.1.28/skills/update-plugin/SKILL.md) | تحديث الإضافات | فحص وتعديل إضافة مملوكة | صيانة Plugins |
| [plugin-creator:prepare-plugin-submission](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/plugin-creator/0.1.28/skills/prepare-plugin-submission/SKILL.md) | إعداد تسليم الإضافة | تجهيز الحزمة والبيانات والمراجعة | النشر العام للإضافات |
| [plugin-management:plugin-management](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/plugin-management/0.1.0/skills/plugin-management/SKILL.md) | إدارة الإضافات | اكتشافها وفحص التبعيات والصلاحيات | إدارة التكاملات |
| [sites:sites](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/sites/1.1.0/skills/sites/SKILL.md) | بناء مواقع عبر Sites | إنشاء المواقع وتعديلها وإدارتها | المواقع والبوابات |
| [sites:sites-remix](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/sites/1.1.0/skills/sites-remix/SKILL.md) | اشتقاق موقع جديد | إنشاء نسخة مشتقة من Site محدد | إعادة استخدام المواقع |
| [work-pets:create-pet](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/work-pets/0.1.6/skills/create-pet/SKILL.md) | إنشاء شخصية متحركة | توليد وتجهيز Pet | ChatGPT Work |
| [work-pets:pets](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/work-pets/0.1.6/skills/pets/SKILL.md) | إدارة الشخصيات | عرض واختيار وتنزيل الشخصيات | مكتبة Pets |
| [work-pets:update-pet](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/work-pets/0.1.6/skills/update-pet/SKILL.md) | تحديث الشخصية | تعديل وإصلاح شخصية قائمة | الرسوم المتحركة |
| [documents:documents](C:/Users/Majed/.codex/plugins/cache/openai-primary-runtime/documents/26.1013.11914/skills/documents/SKILL.md) | ملفات Word | إنشاء وتحرير وتصيير المستندات | DOCX والتحقق البصري |
| [pdf:pdf](C:/Users/Majed/.codex/plugins/cache/openai-primary-runtime/pdf/26.1013.11914/skills/pdf/SKILL.md) | معالجة PDF | القراءة والإنشاء والفحص والتصيير | المستندات والنماذج |
| [presentations:Presentations](C:/Users/Majed/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations/SKILL.md) | العروض التقديمية | إنشاء وتحرير العروض | PowerPoint وGoogle Slides |
| [spreadsheets:Spreadsheets](C:/Users/Majed/.codex/plugins/cache/openai-primary-runtime/spreadsheets/26.1013.11914/skills/spreadsheets/SKILL.md) | ملفات الجداول | تحليل الصيغ والبيانات والرسوم | XLSX وCSV وSheets |
| [spreadsheets:excel-live-control](C:/Users/Majed/.codex/plugins/cache/openai-primary-runtime/spreadsheets/26.1013.11914/skills/excel-live-control/SKILL.md) | التحكم في Excel المفتوح | التعامل مع جلسة Excel متصلة | المصنفات الحية |
| [template-creator:template-creator](C:/Users/Majed/.codex/plugins/cache/openai-primary-runtime/template-creator/26.1013.11914/skills/template-creator/SKILL.md) | إنشاء مهارة قالب | تحويل مرجع إلى قالب شخصي متكرر | المستندات والعروض والجداول |

---

## د. إضافات محلية مفعّلة في الإعدادات، وغير معلنة لهذه الجلسة

### Figma — 12 مهارة

**المصدر:** `openai-curated/figma/bd2122cb`
**الحالة المشتركة:** ملفات محلية، والإضافة مفعّلة في الإعدادات؛ إعلان هذه المهارات للجلسة وتشغيلها غير مثبتين.

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام |
|---|---|---|---|
| [figma-code-connect](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-code-connect/SKILL.md) | ربط التصميم بالشيفرة | إدارة ملفات Code Connect | مكتبات المكونات |
| [figma-create-new-file](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-create-new-file/SKILL.md) | إنشاء ملف Figma | إعداد ملف تصميم أو لوحة جديدة | Figma وFigJam وSlides |
| [figma-design-to-code](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-design-to-code/SKILL.md) | التصميم إلى تطبيق | تنفيذ واجهة من تصميم Figma | تطوير الواجهات |
| [figma-generate-design](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-generate-design/SKILL.md) | توليد تصميم | بناء شاشة من وصف أو شيفرة | تصميم الصفحات |
| [figma-generate-diagram](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-generate-diagram/SKILL.md) | توليد المخططات | إنشاء مخططات عبر الأدوات | المعمارية والتدفقات |
| [figma-generate-library](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-generate-library/SKILL.md) | إنشاء نظام تصميم | بناء المكونات والمتغيرات والسمات | Design Systems |
| [figma-implement-motion](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-implement-motion/SKILL.md) | تنفيذ الحركة | تحويل حركة التصميم إلى شيفرة | واجهات متحركة |
| [figma-swiftui](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-swiftui/SKILL.md) | ربط SwiftUI وFigma | الترجمة بين التطبيق والتصميم | iOS وSwiftUI |
| [figma-use](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-use/SKILL.md) | استعمال أدوات Figma | تنظيم القراءة والكتابة البرمجية | عمليات ملف Figma |
| [figma-use-figjam](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-use-figjam/SKILL.md) | سياق FigJam | استخدام أدوات اللوحات | جلسات التخطيط |
| [figma-use-motion](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-use-motion/SKILL.md) | سياق الحركة | تعديل الإطارات والتوقيت والمنحنيات | الرسوم المتحركة |
| [figma-use-slides](C:/Users/Majed/.codex/plugins/cache/openai-curated/figma/bd2122cb/skills/figma-use-slides/SKILL.md) | سياق عروض Figma | استخدام أدوات الشرائح | العروض التقديمية |

### GitHub — 4 مهارات

**المصدر:** `openai-curated/github/bd2122cb`
**الحالة المشتركة:** ملفات محلية ضمن إضافة مفعّلة في الإعدادات؛ غير معلنة لهذه الجلسة.

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام |
|---|---|---|---|
| [github](C:/Users/Majed/.codex/plugins/cache/openai-curated/github/bd2122cb/skills/github/SKILL.md) | توجيه أعمال GitHub | استعراض المستودعات والقضايا والطلبات | إدارة التطوير |
| [gh-address-comments](C:/Users/Majed/.codex/plugins/cache/openai-curated/github/bd2122cb/skills/gh-address-comments/SKILL.md) | معالجة ملاحظات المراجعة | تحليل التعليقات وتنفيذ التصحيحات المختارة | Pull Requests |
| [gh-fix-ci](C:/Users/Majed/.codex/plugins/cache/openai-curated/github/bd2122cb/skills/gh-fix-ci/SKILL.md) | إصلاح CI | تشخيص فحوص GitHub Actions | خطوط التكامل المستمر |
| [yeet](C:/Users/Majed/.codex/plugins/cache/openai-curated/github/bd2122cb/skills/yeet/SKILL.md) | نشر تغييرات محلية | تنظيم الالتزام والدفع وفتح طلب مسودة | تسليم العمل عبر GitHub |

---

# 3. مهارات المشروع والحزمة المرجعية

لم أجد `SKILL.md` في مسارات اكتشاف مهارات المشروع الحالي، ومنها:

- `D:\APP\Agent-Files-Explorer\.agents\skills`
- `D:\APP\Agent-Files-Explorer\.codex\skills`
- `D:\APP\Agent-Files-Explorer\.agent\skills`
- `D:\APP\Agent-Files-Explorer\skills`

لكن توجد **11 مهارة مرجعية اختيارية** داخل الحزمة الأحدث.

**المصدر:** AGHR Reference 1.2.0، مؤلفة ضمن المشروع.
**الجذر:**
`D:\APP\Agent-Files-Explorer\governance_packages\references\Agent_Governance_Harness_Reference_1.2.0\optional_skills`

**الحالة المشتركة:** موجودة مرجعيًا، وليست مثبتة في مسارات اكتشاف Codex. تحتاج مواءمة المضيف واعتماد الاستخدام المناسب؛ نسخ `SKILL.md` وحده قد يفصلها عن إجراءاتها المرجعية.

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام |
|---|---|---|---|
| [agent-tool-security](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/agent-tool-security/SKILL.md) | أمن أدوات الوكيل | مراجعة الثقة والصلاحيات والحقن | تمكين الأدوات والتكاملات |
| [architecture-options](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/architecture-options/SKILL.md) | بدائل التصميم | مقارنة الخيارات وتوثيق القرار | تصميم الأنظمة |
| [governed-learning](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/governed-learning/SKILL.md) | التعلم المحكوم | استخراج دروس وتصنيف تحسينات التعليمات | حوكمة الوكلاء وإغلاق العمل |
| [incremental-change](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/incremental-change/SKILL.md) | تغيير تدريجي محكوم | تنفيذ تغيير محدود مع أدلة واستئناف | تطوير الميزات |
| [plan-drift-review](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/plan-drift-review/SKILL.md) | مراجعة الانحراف | مقارنة التقدم بالمرجعية والخطة | متابعة التنفيذ |
| [rag-data-quality](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/rag-data-quality/SKILL.md) | جودة الاسترجاع والمصادر | تقييم المصدر والتغطية والإسناد | RAG والفهارس |
| [requirements-traceability](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/requirements-traceability/SKILL.md) | تتبع المتطلبات | ربط المتطلب بمعيار القبول والتغيير والدليل | المواصفات والتحقق |
| [risk-based-verification](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/risk-based-verification/SKILL.md) | تحقق متناسب مع المخاطر | تحديد ما تثبته الأدلة والفجوات | قبول التغييرات |
| [root-cause-debugging](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/root-cause-debugging/SKILL.md) | تشخيص السبب الجذري | فصل عطل المنتج عن البيئة والاختبار | تصحيح الأعطال |
| [safe-git-closeout](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/safe-git-closeout/SKILL.md) | إغلاق Git المحكوم | توثيق حالة الفرع والدمج والمزامنة | التسليم والإغلاق |
| [smart-clarification](D:/APP/Agent-Files-Explorer/governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/optional_skills/smart-clarification/SKILL.md) | استيضاح مؤثر | حسم الغموض دون اختراع مطلب أو صلاحية | المتطلبات والتفويض |

---

# 4. ملفات محلية مخزنة، وغير معلنة كمهارات للجلسة

## قوالب OpenAI Templates — 20 مهارة

**المصدر:** `openai-curated-remote/openai-templates/0.1.1`
**الحالة المشتركة:** ملفات موجودة في ذاكرة الإضافات؛ تفعيلها غير مثبت من قائمة الجلسة والإعدادات المفحوصة.

| المهارة وملفها | الوصف | الوظيفة | مجالات الاستخدام |
|---|---|---|---|
| [artifact-template-analytics-dashboard](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-analytics-dashboard/SKILL.md) | لوحة مؤشرات | إنشاء جدول تحليلي ورسوم | الأداء والتحويل والاحتفاظ |
| [artifact-template-business-review](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-business-review/SKILL.md) | مراجعة أعمال | إنشاء عرض مراجعة | مؤشرات الأعمال والقرارات |
| [artifact-template-design-report](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-design-report/SKILL.md) | تقرير تصميم | إعداد مستند نتائج وتوصيات | تقارير التصميم |
| [artifact-template-experiment-analysis](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-experiment-analysis/SKILL.md) | تحليل تجربة | توثيق الفرضية والمنهج والنتائج | الأبحاث والتجارب |
| [artifact-template-financial-budget](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-financial-budget/SKILL.md) | موازنة مالية | بناء جدول موازنة وسيناريوهات | التخطيط المالي |
| [artifact-template-investment-committee-memo](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-investment-committee-memo/SKILL.md) | مذكرة استثمار | تنظيم التحليل والمخاطر والتوصية | قرارات الاستثمار |
| [artifact-template-legal-memorandum](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-legal-memorandum/SKILL.md) | مذكرة قانونية | تنظيم الوقائع والتحليل والخلاصة | إعداد المستندات القانونية |
| [artifact-template-market-trends-report](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-market-trends-report/SKILL.md) | اتجاهات السوق | إنشاء عرض بالأدلة والآثار | الأبحاث السوقية |
| [artifact-template-minimal-letterhead](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-minimal-letterhead/SKILL.md) | مراسلات رسمية | إنشاء خطاب بترويسة | المستندات الإدارية |
| [artifact-template-operating-calendar](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-operating-calendar/SKILL.md) | تقويم تشغيلي | تنظيم المواعيد والمراحل | التخطيط السنوي والشهري |
| [artifact-template-operating-review](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-operating-review/SKILL.md) | مراجعة تشغيلية | إعداد عرض متابعة دوري | الفرق والعمليات |
| [artifact-template-project-kickoff](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-project-kickoff/SKILL.md) | انطلاق مشروع | توضيح النطاق والأدوار والمراحل | بدء المشاريع |
| [artifact-template-project-tracker](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-project-tracker/SKILL.md) | متابعة مشروع | إنشاء جدول مهام ومالكين ومواعيد | إدارة التنفيذ |
| [artifact-template-sales-pipeline](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-sales-pipeline/SKILL.md) | متابعة المبيعات | تنظيم الفرص والتوقعات | إدارة المبيعات |
| [artifact-template-simple-dark-mode](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-simple-dark-mode/SKILL.md) | عرض داكن | إنشاء عرض بقالب داكن | العروض التقديمية |
| [artifact-template-simple-light-mode](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-simple-light-mode/SKILL.md) | عرض فاتح | إنشاء عرض بقالب فاتح | العروض التقديمية |
| [artifact-template-strategy-memorandum](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-strategy-memorandum/SKILL.md) | مذكرة استراتيجية | عرض الخيارات والمبررات والمخاطر | القرارات الاستراتيجية |
| [artifact-template-system-design](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-system-design/SKILL.md) | مستند تصميم نظام | توثيق المكونات والتدفقات والعقود | المعمارية والتصميم |
| [artifact-template-team-alignment](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-team-alignment/SKILL.md) | مواءمة فريق | إعداد عرض أهداف وأولويات | تخطيط الفرق |
| [artifact-template-three-statement-forecast](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-three-statement-forecast/SKILL.md) | توقع مالي مترابط | إعداد قوائم مالية متكاملة | النمذجة المالية |

### قالب داخلي إضافي

| الملف | الوصف والوظيفة | الاستخدام | الحالة |
|---|---|---|---|
| [starter-workflow/SKILL.md](C:/Users/Majed/.codex/plugins/cache/openai-curated-remote/plugin-creator/0.1.28/skills/create-plugin/assets/starter-plugin/skills/starter-workflow/SKILL.md) | نموذج أولي يُستبدل بإجراء مالك الإضافة | إنشاء Plugins | قالب داخل الأصول؛ غير مفعّل |

كذلك وجدت إضافات مثل `code-review` و`codex-app-tools` ونسخة `github` تحت `openai-curated-remote` بلا ملفات `SKILL.md` في نسخها المفحوصة. وجود الإضافة أو أدواتها وحده لا يضيف مهارة إلى هذا الجرد.

---

# 5. الكتالوج الخارجي — منفصل عن التثبيت المحلي

**المصدر المفحوص:** مستودع `openai/skills`، المسار `skills/.curated`.
**النسخة المثبتة للجرد:** `49f948faa9258a0c61caceaf225e179651397431`.

تحققت من وجود ملفات المهارات الـ39 وقرأت بياناتها. يحتوي جذر `skills` في هذه النسخة على `.curated` و`.system`؛ لم يظهر فيه `.experimental`. [الكتالوج عند النسخة المفحوصة](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated).

هذا حصر للكتالوج الرسمي المحدد، وليس حصرًا لكل مستودعات المهارات العامة.

| المهارة ومصدر `SKILL.md` | الوصف | الوظيفة | مجالات الاستخدام | الحالة |
|---|---|---|---|---|
| [aspnet-core](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/aspnet-core/SKILL.md) | تطبيقات ASP.NET Core | بناء ومراجعة وتصميم التطبيقات | .NET والويب | متاحة للتثبيت |
| [chatgpt-apps](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/chatgpt-apps/SKILL.md) | تطبيقات ChatGPT | بناء MCP وواجهة التطبيق | Apps SDK | متاحة للتثبيت |
| [cli-creator](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cli-creator/SKILL.md) | أدوات سطر الأوامر | إنشاء CLI من APIs أو أدوات قائمة | الأتمتة والتكامل | متاحة للتثبيت |
| [cloudflare-deploy](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/cloudflare-deploy/SKILL.md) | نشر Cloudflare | نشر Workers وPages | الاستضافة | متاحة للتثبيت |
| [define-goal](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/define-goal/SKILL.md) | تحديد هدف قابل للقياس | ضبط الهدف ومعايير النجاح | التخطيط | متاحة للتثبيت |
| [figma](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma/SKILL.md) | سياق التصميم | استرجاع التصميم والأصول | Figma والتطوير | متاحة للتثبيت |
| [figma-code-connect-components](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-code-connect-components/SKILL.md) | ربط المكونات | إنشاء خرائط Code Connect | أنظمة التصميم | متاحة للتثبيت |
| [figma-create-design-system-rules](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-design-system-rules/SKILL.md) | قواعد تصميم المشروع | توليد تعليمات مخصصة | Figma إلى الشيفرة | متاحة للتثبيت |
| [figma-create-new-file](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-create-new-file/SKILL.md) | إنشاء ملف تصميم | إعداد ملف Figma جديد | التصميم | نسخة كتالوج؛ الاسم موجود محليًا |
| [figma-generate-design](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-generate-design/SKILL.md) | توليد واجهة تصميم | بناء شاشة من وصف أو تطبيق | تصميم الواجهات | نسخة كتالوج؛ الاسم موجود محليًا |
| [figma-generate-library](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-generate-library/SKILL.md) | توليد مكتبة تصميم | بناء المكونات والسمات | Design Systems | نسخة كتالوج؛ الاسم موجود محليًا |
| [figma-implement-design](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-implement-design/SKILL.md) | تنفيذ التصميم | تحويل Figma إلى تطبيق | الواجهات | متاحة للتثبيت |
| [figma-use](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/figma-use/SKILL.md) | تشغيل أدوات Figma | تنظيم عمليات ملف التصميم | Figma MCP | نسخة كتالوج؛ الاسم موجود محليًا |
| [gh-address-comments](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-address-comments/SKILL.md) | تعليقات المراجعة | معالجة ملاحظات PR عبر CLI | GitHub | نسخة كتالوج؛ الاسم موجود محليًا |
| [gh-fix-ci](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/gh-fix-ci/SKILL.md) | تشخيص CI | تحليل وإصلاح فحوص Actions | GitHub Actions | نسخة كتالوج؛ الاسم موجود محليًا |
| [hatch-pet](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/hatch-pet/SKILL.md) | شخصيات Codex | توليد وتجهيز Pet متحرك | أصول Codex البصرية | متاحة للتثبيت |
| [jupyter-notebook](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/jupyter-notebook/SKILL.md) | دفاتر Jupyter | إنشاء وتحرير دفاتر التجارب | التحليل والتعليم | متاحة للتثبيت |
| [linear](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/linear/SKILL.md) | إدارة العمل | التعامل مع المشاريع والقضايا | Linear | متاحة للتثبيت |
| [migrate-to-codex](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/migrate-to-codex/SKILL.md) | ترحيل إعدادات الوكلاء | نقل التعليمات والمهارات وMCP | الانتقال إلى Codex | متاحة للتثبيت |
| [netlify-deploy](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/netlify-deploy/SKILL.md) | نشر Netlify | إعداد ونشر المواقع | الاستضافة | متاحة للتثبيت |
| [notion-knowledge-capture](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-knowledge-capture/SKILL.md) | التقاط المعرفة | تحويل الملاحظات إلى صفحات مترابطة | Notion والتوثيق | متاحة للتثبيت |
| [notion-meeting-intelligence](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-meeting-intelligence/SKILL.md) | إعداد الاجتماعات | جمع السياق والأجندة والمواد | الاجتماعات | متاحة للتثبيت |
| [notion-research-documentation](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-research-documentation/SKILL.md) | بحث موثق | تجميع مصادر وإعداد تقارير | Notion والأبحاث | متاحة للتثبيت |
| [notion-spec-to-implementation](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/notion-spec-to-implementation/SKILL.md) | مواصفة إلى تنفيذ | إنشاء خطة ومهام وتتبع | تطوير المنتج | متاحة للتثبيت |
| [openai-docs](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/openai-docs/SKILL.md) | وثائق OpenAI | إرشاد قائم على المصادر الرسمية | OpenAI وCodex | موجودة محليًا كنظام؛ الكتالوج بديل |
| [pdf](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/pdf/SKILL.md) | معالجة PDF | القراءة والإنشاء والفحص البصري | المستندات | موجودة محليًا بإضافة؛ الكتالوج بديل |
| [playwright](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright/SKILL.md) | أتمتة المتصفح | تنفيذ سيناريوهات من الطرفية | E2E والاختبارات | متاحة للتثبيت |
| [playwright-interactive](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/playwright-interactive/SKILL.md) | متصفح تفاعلي مستمر | تصحيح تكراري عبر REPL | المتصفح وElectron | متاحة للتثبيت |
| [render-deploy](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/render-deploy/SKILL.md) | نشر Render | إعداد Blueprints والنشر | الاستضافة | متاحة للتثبيت |
| [screenshot](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/screenshot/SKILL.md) | تصوير سطح المكتب | التقاط نافذة أو منطقة | الفحص البصري | متاحة للتثبيت |
| [security-best-practices](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices/SKILL.md) | مراجعة الممارسات الأمنية | اقتراح تحسينات بحسب اللغة | Python وJS/TS وGo | متاحة للتثبيت |
| [security-ownership-map](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-ownership-map/SKILL.md) | ملكية الشيفرة الحساسة | تحليل المالكين والتاريخ والمخاطر | Git وCODEOWNERS | متاحة للتثبيت |
| [security-threat-model](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model/SKILL.md) | نمذجة تهديدات المستودع | توثيق الأصول والتهديدات والتخفيف | AppSec | متاحة للتثبيت |
| [sentry](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/sentry/SKILL.md) | فحص أخطاء التشغيل | استعراض الأحداث وصحة الخدمة | Sentry | متاحة للتثبيت |
| [speech](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/speech/SKILL.md) | توليد صوت | تحويل النص إلى كلام | الصوت وإتاحة المحتوى | متاحة للتثبيت |
| [transcribe](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/transcribe/SKILL.md) | تفريغ التسجيلات | تحويل الصوت إلى نص | الصوت والفيديو | متاحة للتثبيت |
| [vercel-deploy](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/vercel-deploy/SKILL.md) | نشر Vercel | إعداد نشر ومعاينات | تطبيقات الويب | متاحة للتثبيت |
| [winui-app](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/winui-app/SKILL.md) | تطبيقات Windows | بناء واجهات WinUI 3 | C# وWindows App SDK | متاحة للتثبيت |
| [yeet](https://github.com/openai/skills/blob/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/yeet/SKILL.md) | تسليم إلى GitHub | الالتزام والدفع وفتح PR | GitHub CLI | نسخة كتالوج؛ الاسم موجود محليًا |

---

# 6. التداخل والتكرار

## التكرار المثبت

- **سبعة أسماء مكررة** بين إضافتي لسان القرآن.
- **صفر ملفات متطابقة حرفيًا** بين ملفات `SKILL.md` المحلية الـ125 بحسب SHA-256.
- لذلك، تكرار الاسم أو الوصف لا يكفي للحكم بأن حذف إحدى النسختين آمن.

## التداخل الوظيفي

| المجموعة | المهارات المتداخلة | الفرق العملي |
|---|---|---|
| التنفيذ التدريجي | `incremental-implementation` و`incremental-change` | الأولى عامة؛ الثانية مرتبطة بإجراءات AGHR وسلطته |
| تشخيص الأعطال | `debugging-and-error-recovery` و`root-cause-debugging` | غرض متقارب مع اختلاف المرجعية والتفويض |
| الاستيضاح | `interview-me` و`idea-refine` و`smart-clarification` | مقابلة الاحتياج، تنقيح الفكرة، وحسم الغموض المؤثر |
| Git والإغلاق | `git-workflow-and-versioning` و`safe-git-closeout` و`yeet` | تنظيم العمل، إغلاق محكوم، ثم نشر تغييرات مصرح به |
| المراجعة | `code-review-and-quality` و`review-agent` و`security-diff-scan` | جودة عامة، عيوب تغيير، وتدقيق أمني متخصص |
| نمذجة التهديدات | `codex-security:threat-model` و`security-threat-model` الخارجية | مساران متقاربان مع أدوات وتعليمات مختلفة |
| الاختبارات البصرية | `browser-testing-with-devtools` و`playwright` و`playwright-interactive` | فحص DevTools مقابل أتمتة وسياق تفاعلي مستمر |
| المستندات | `documents` و`google-docs` | ملف مستند مُصيّر مقابل مستند Google أصلي متصل |
| الجداول والعروض | `Spreadsheets` و`google-sheets` و`excel-live-control`؛ والعروض العامة و`google-slides` | تختلف صيغ الملفات والجلسات وأدوات الاتصال |
| اكتشاف القدرات | `find-skills` و`skill-installer` و`plugin-management` | اكتشاف مهارة، تثبيتها، وإدارة إضافة كاملة |

### أسماء مرجعية غير مثبتة

دليل `using-agent-skills` يشير إلى أسماء لم أجدها كمهارات محلية في النطاق المفحوص، منها:

`test-driven-development`، `api-and-interface-design`، `doubt-driven-development`، `code-simplification`، `security-and-hardening`، `ci-cd-and-automation`، `deprecation-and-migration`، `documentation-and-adrs`، `observability-and-instrumentation`.

وجود الاسم في دليل سير عمل لا يثبت وجود ملف مهارته.

---

# 7. أهم المهارات للمجالات المطلوبة

| المجال | الترشيح من المعلن حاليًا | إضافات أو مراجع مكملة |
|---|---|---|
| **تطوير البرمجيات** | `spec-driven-development`، `planning-and-task-breakdown`، `source-driven-development`، `incremental-implementation`، `git-workflow-and-versioning`، `code-review-and-quality` | مهارات التقنية المحددة مثل `aspnet-core` و`winui-app` عند الحاجة |
| **تصميم الأنظمة** | `spec-driven-development`، `context-engineering`، `planning-and-task-breakdown`، `visualize` | `architecture-options` مرجعية؛ وقالب `artifact-template-system-design` محفوظ محليًا وغير معلن |
| **المراجعة الأمنية** | `security-diff-scan` للتغييرات، و`security-scan` للمستودع، و`threat-model` و`define-security-policy` | `deep-security-scan` للتدقيق الشامل المطلوب صراحةً؛ والمهارات الخارجية للممارسات والملكية الأمنية |
| **الاختبارات** | `browser-testing-with-devtools`، `debugging-and-error-recovery` | `playwright` و`playwright-interactive` متاحتان للتثبيت؛ و`risk-based-verification` مرجعية |
| **حوكمة الوكلاء** | `context-engineering`، `using-agent-skills`، `skill-creator`، `spec-driven-development` | الأولوية المرجعية لـ`governed-learning`، ثم `requirements-traceability` و`plan-drift-review` و`agent-tool-security` |
| **تقييم تطبيقات الذكاء الاصطناعي** | `langfuse` | `rag-data-quality` و`risk-based-verification` مرجعيتان |

**أولوية هذا المشروع تحديدًا:** الاستفادة المنهجية من `governed-learning` لاستخراج الدروس وتصنيفها وربطها بالأدلة والموضع الحاكم، مع الحفاظ على فصل مراجعة الدرس عن اعتماد تعديل التعليمات أو تثبيت مهارة.

اختياريًا: إعداد قائمة اعتماد مختصرة لكل مشروع من هذا الجرد، قبل التفكير في تثبيت مهارات إضافية.
