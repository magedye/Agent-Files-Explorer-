# خط الأساس وحفظ الأصول ومصفوفة المكونات (Baseline and Preservation Ledger)

> **وثيقة معتمدة**: BASELINE_AND_PRESERVATION.md  
> **التاريخ**: 2026-10-15  
> **المشروع**: Agent-Files-Explorer / AGHR Governance Studio  
> **فرع العمل**: `main` | **HEAD Commit**: `4b9b877d835450f119b09d28bdc70faaaf791f4b`  
> **حالة العمل عند إعداد التقرير في 2026-10-15**: شجرة عمل نظيفة مطابقة للمستودع، مع وجود إضافات غير متتبعة (`governance_packages/`, `docs/`, `tools/`). هذه لقطة تاريخية؛ حالة Git الحالية تُقاس من المستودع.

> **تحديث تنظيم 2026-10-20:** انتقلت الحزم إلى `governance_packages/references/` و`governance_packages/archive/` و`governance_packages/candidates/`. أبقيت نسختي 1.0.0 كاملتين؛ مسارات الجدول الآتية محدثة للتخزين ولا تغير حكم التأهيل أو الاعتماد.

---

## 1. جرد الأصول وحزم الحوكمة المحفوظة (Preserved Governance Assets)

جميع الحزم الأصلية محفوظة بحالتها وبصماتها الكاملة دون أي مساس أو تعديل:

| أصل الحزمة / الملف | المسار الفعلي المعتمد | نوع الأصل | بصمة SHA-256 | عدد القواعد والمصادر | حالة الحزمة |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AGHR 1.0.0 (Baseline)** | `governance_packages/archive/Agent_Governance_Harness_Reference_1.0.0_repository_baseline/` | مجلد مستخرج ومحفوظ | مستمد من MANIFEST الداخلي | 40 قاعدة، 30 مصدراً، 12 محولاً | `FINAL_REFERENCE` (غير معتمد للنشر) |
| **AGHR 1.1.0 (Full Package)** | `governance_packages/archive/Agent_Governance_Harness_Reference_1.1.0/` | مجلد مستخرج كامل | مستمد من MANIFEST الداخلي | 47 قاعدة، 56 مصدراً، 12 محولاً | `INTEGRATED_REFERENCE_FOR_REVIEW` |
| **AGHR 1.1.0 ZIP Archive** | `governance_packages/archive/Agent_Governance_Harness_Reference_1.1.0.zip` | أرشيف توزيع رسمي | `FF6048D6C96FDA6110B460CE93EB32A50E01830c58E921D921C950F2434DD206` | مطابق للأصل 100% في التقرير الأصلي | محفوظ كمرجع غير قابل للتعديل |
| **AGHR Minimal 1.1.0** | `governance_packages/archive/AGHR_Minimal_1.1.0/` | توزيعة مصغرة (Core) | - | 47 قاعدة، 56 مصدراً | `STRUCTURAL_PASS` (عبر VERIFY.py) |
| **AGHR Minimal 1.1.0 ZIP** | `governance_packages/archive/AGHR_Minimal_1.1.0.zip` | أرشيف توزيع مصغر | `D6CC377076383A4028F09FAC3EECF8690FD0DCB05CC459888E42E3D20E275554` | مطابق للأصل 100% في التقرير الأصلي | محفوظ كمرجع مصغر |

---

## 2. مصفوفة تصنيف المكونات (Component Classification Matrix)

تصنيف المكونات القائمة وفق معيار: `REUSE / EXTEND / IMPLEMENT / BLOCKED`:

| المكون / الخدمة | الملف المصدر | التصنيف | التبرير والخطوة المطلوبة |
| :--- | :--- | :--- | :--- |
| **Security & Containment (M1)** | `server/security.js` | **EXTEND** | الحفاظ على آلية `resolveSafePath` وحماية المسارات؛ وتوسيع سجل الجذور ليشمل `governance_packages` ديناميكياً مع إبقاء توافق `aghr` 1.0.0. |
| **Governance Reference (M2)** | `server/governance.js` | **EXTEND** | دعم تعدد الإصدارات مع الحفاظ على المعرفات التاريخية؛ بتوجيه المالك في 2026-10-20 أصبحت ردود API عند عدم تحديد إصدار تستخدم 1.2.0. |
| **Intake & Statements (M3)** | `server/intake.js` | **EXTEND** | تصحيح القوة المعيارية الافتراضية من `MUST` إلى `PROPOSED/UNDETERMINED` وفصل الاقتراحات والملاحظات عن القواعد الإلزامية. |
| **Candidate Adoption (M4)** | `server/adoption.js` | **REUSE** | آلية فحص المشاريع واقتراح خطة التبني سليمة تماماً وتعمل بدون مشاكل. |
| **Governed Staging & Apply (M6)** | `server/staging.js` | **EXTEND** | استبدال الرمز السري الثابت `AUTHORIZED_BY_PROJECT_OWNER` بنظام جلسة تفويض مصرحة، مع توثيق حدود الاستعادة (Rollback). |
| **Subprocess Evaluator (M5)** | `server/evaluation.js` | **IMPLEMENT** | إضافة خدمة فحص وتشغيل الاختبارات المستقلة لكل حزمة بأمان (Python runner لـ `VERIFY.py` و `check_package.py`). |
| **Multi-Version Diff & Impact** | `server/comparison.js` | **IMPLEMENT** | بناء محرك مقارنة بين الإصدارات وتحليل الأثر المعماري (`SUPERSEDES`, `MODIFIED`, `NEW`, `DEPRECATED`). |
| **UI Reference Manager** | `src/components/ReferenceManager.jsx` | **EXTEND** | إضافة محدد الحزمة والإصدار (Package Selector) وتحديث الإحصائيات ديناميكياً. |
| **Production Publishing / Push** | Remote Git Operations | **BLOCKED** | محظور بأمر الميثاق والتفويض (No unauthorized push/merge/publish). |

---

## 3. نتائج اختبارات خط الأساس الحي (Live Verification Baseline)

- **اختبارات تطبيق Studio**: تشغيل `node --test tests/*.test.mjs` حقق **21/21 اختباراً ناجحاً** بنسبة 100% وبدون أي إخفاق.
- **بناء واجهة المستخدم (Vite Build)**: تشغيل `npm run build` حقق نجاحاً تاماً بحجم حزمة `dist/` سليم وقابل للنشر المحلي.

تحديث مواقع التخزين 2026-10-20: نُقلت مراجع 1.1.0 السابقة إلى archive/، مع حفظ البايتات والبصمات. التحقق من هذا النقل في [إيصال الحفظ](../evidence/reference-layout-2026-10-20/after.json)؛ لم تتغير حالات الاعتماد الموروثة بالنقل.
