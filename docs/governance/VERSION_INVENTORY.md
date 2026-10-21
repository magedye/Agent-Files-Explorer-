# تقرير الجرد الشامل لإصدارات الحوكمة (Governance Version Inventory)

> **سجل الحزم المحلي**: VERSION_INVENTORY.md  
> **التاريخ**: 2026-10-15؛ تحديث مسارات التخزين 2026-10-20  
> **المشروع**: AGHR Governance Studio  
> **الحالة**: DERIVED_PACKAGE_CATALOG — حالة الرصد لا تمنح اعتماد إصدار

---

## 1. سجل الحزم المسجلة محلياً في المنصة (Registered Package Catalog)

| معرف الحزمة (`package_id`) | الإصدار | طبيعة الحزمة (`kind`) | المسار الفعلي المحفوظ | عدد القواعد والمصادر | البصمة والتحقق |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`aghr`** (أو `aghr_1_0_0`) | 1.0.0 | `HISTORICAL_BASELINE` | `governance_packages/archive/Agent_Governance_Harness_Reference_1.0.0_repository_baseline/Agent_Governance_Harness_Reference_1.0.0/` | 40 قاعدة · 30 مصدراً · 12 محولاً | نسخة تاريخية متاحة للاختيار والمقارنة؛ تحتفظ بمعرفاتها السابقة |
| **`aghr_1_1_0`** | 1.1.0 | `FULL_REFERENCE` | `governance_packages/archive/Agent_Governance_Harness_Reference_1.1.0/` | 47 قاعدة · 56 مصدراً · 12 محولاً | أرشيف التوزيع السابق محفوظ في `archive/`؛ بصمته المسجلة: `FF6048D6C96FDA6110B460CE93EB32A50E01830C58E921D921C950F2434DD206` |
| **`aghr_minimal_1_1_0`** | 1.1.0 | `MINIMAL_CORE` | `governance_packages/archive/AGHR_Minimal_1.1.0/` | 47 قاعدة · 56 مصدراً | أرشيف التوزيع المصغر السابق محفوظ في `archive/`؛ بصمته المسجلة: `D6CC377076383A4028F09FAC3EECF8690FD0DCB05CC459888E42E3D20E275554` |
| **`aghr_1_2_0`** | 1.2.0 | `FULL_REFERENCE` | `governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/` | 47 قاعدة · 56 مصدراً · 12 محولاً · 11 مهارة | مرجع محدث وافتراضي التطبيق بتوجيه صريح من المالك؛ [إيصال التسليم والبصمة](../evidence/reference-1.2.0-update/delivery.json) |

نسخة 1.0.0 المحلية الثانية محفوظة مستقلة في `governance_packages/archive/Agent_Governance_Harness_Reference_1.0.0_local_copy/` ولا تُسجل جذرًا إضافيًا في التطبيق. مرشح 1.2.0 السابق وأرشيفه محفوظان في `governance_packages/archive/AGHR_Candidate_1.2.0_pre_update_20261020/` وملف ZIP المجاور. [تقرير التحويل](REFERENCE_UPDATE_1_2_0.md) يربط الحالة السابقة واللاحقة؛ اختيار 1.2.0 افتراضيًا داخل التطبيق جاء بتوجيه لاحق صريح من المالك، ولا يفعّل تبنّي أي مشروع تلقائيًا.

---

## 2. جدول الفروقات البنيوية بين الإصدار 1.0.0 و 1.1.0

### مرشح مهارات مستقل — 2026-10-21

[AGHR_Candidate_1.3.0](../../governance_packages/candidates/AGHR_Candidate_1.3.0/README.md) موجود في candidates فقط، ولم يسجل له package_id في التطبيق أو قرار ترقية مرجعية. يحتفظ بالقواعد الـ47 والمهارات الإحدى عشرة، ويحدث محرك المهارات وبيانات المضيف/المشروع والأدلة. [الخطة والتوافق](../plans/SKILLS_GOVERNANCE_CANDIDATE_1_3_0.md)؛ يبقى الافتراضي aghr_1_2_0.

- **القواعد الحاكمة**: 40 قاعدة ⬅️ 47 قاعدة (+7 قواعد مضافة جديدة في 1.1.0: `AGHR-041` إلى `AGHR-047`).
- **المصادر المعتمدة**: 30 مصدراً ⬅️ 56 مصدراً (+26 مرجعاً جديداً من وثائق المطورين الرسمية لمزودي النماذج والمضيفين).
- **العقود الأساسية**: متطابقة معمارياً (4 عقود معيارية: `GOVERNANCE`, `RUNTIME`, `ENFORCEMENT`, `EVIDENCE`).
- **قاعدة المقارنة الحاكمة**: `NEWER != SUPERSEDES`؛ أحدثية الملف لا تمنحه سلطة الاستبدال التلقائي دون تفويض صريح.

تحديث تنظيم 2026-10-20: يحتوي references/ على 1.2.0 فقط مع ZIP وبصمته؛ نُقلت توزيعتا 1.1.0 وملفا ZIP إلى archive/ دون تغيير المحتوى. بقيت معرفاتها متاحة للمقارنة. حقل kind يصف نوع التوزيع، وموضع archive يحدد حفظه كإصدار سابق. [البصمات قبل النقل وبعده](../evidence/reference-layout-2026-10-20/after.json).
