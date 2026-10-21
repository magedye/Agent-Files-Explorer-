# AGHR Governance Studio

منصة محلية لاستعراض مراجع حوكمة الوكلاء، استقبال طلبات التغيير، إعداد تبنّي الحوكمة في المشاريع، وعرض نتائج التحقق قبل أي تطبيق محكوم.

## لغة الواجهة / Interface language

اختر **English** أو **العربية** من القائمة أعلى الواجهة. يُحفظ اختيار اللغة، ويتبدل الاتجاه تلقائيًا بين LTR وRTL مع الحفاظ على المسودة الحالية. [تفاصيل الدعم والتحقق](docs/features/INTERFACE_LANGUAGES.md).

Select **English** or **العربية** in the top bar. Your choice is saved and the layout direction updates automatically. Documents and entered text keep their original language.

## بنية المشروع

| المسار | الغرض |
| --- | --- |
| `src/` | واجهة React وVite |
| `server/` | API المحلي وخدمات الاستعراض والاستقبال والتبنّي والتقييم والتجهيز |
| `tests/` و`tools/` | اختبارات التطبيق وفحوص السياق |
| `.governance/` | بيانات التشغيل المحلية والأدلة والتجهيز والنسخ الاحتياطية |
| `governance_packages/` | الحزم المرجعية والمرشحة والتاريخية وموضع الوارد |
| `docs/` | حالة التنفيذ والخرائط والخطط والمواصفات والتقارير |

تفاصيل الحزم وحدود `INBOX` في [دليل الحزم](governance_packages/README.md)، ومسارات الوثائق في [الفهرس](docs/INDEX.md). المرجع **1.2.0** هو الافتراضي داخل التطبيق بتوجيه المالك، بما يشمل المستكشف ومدير المرجعية والمقارنة والتقييم وخطط التبنّي الجديدة. تظل الإصدارات السابقة متاحة للاختيار والمقارنة؛ هذا الاختيار لا يفعّل التبنّي تلقائيًا في أي مشروع.

مرجع [AGHR 1.2.0 المحدث](governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/README.md) مسجل للقراءة، ويتضمن دورة استخراج الدروس وتصنيف التعليمات والتقاط سجلاتها. [تقرير التحويل](docs/governance/REFERENCE_UPDATE_1_2_0.md) يربط الفرق والمراجعة والتحقق والنسخة السابقة المحفوظة.

حُذف مجلد `data/` بطلب المالك. يستطيع مسار إعداد التبنّي فحص مشروع موجود يحدد مساره صراحة؛ وتعيد قائمة الاكتشاف المحلية نتيجة فارغة ما دام المجلد الاختياري غير موجود.

## التشغيل المحلي

```sh
npm run dev
```

إذا كانت التبعيات غير مثبتة في نسخة جديدة، نفّذ `npm install` أولًا.

تعمل الواجهة وواجهة API المحلية عبر Vite على `127.0.0.1:5180`. للتحقق من الشيفرة بعد تعديلها:

```sh
npm test
node tools/check_context_health.mjs
npm run build
```

يحفظ [المقترح الأول للمشروع](docs/archive/INITIAL_PROJECT_PROPOSAL_AR.md) و[خطة التحويل](docs/archive/PROJECT_TRANSFORMATION_PLAN_AR.md) خلفية التصميم؛ حالتهما التاريخية لا تثبت اكتمال الميزات. الحالة التنفيذية الحالية في [CURRENT.md](docs/status/CURRENT.md)، وتفاصيل المعمارية في [PROJECT_MAP.md](PROJECT_MAP.md).
