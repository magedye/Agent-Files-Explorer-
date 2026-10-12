> **السلطة:** هذه الوثيقة تنفيذية تابعة لـ`references/quran/governance/LISAN_CONSTITUTIONAL_CORE_v4.0.md`، ولا تنشئ حكمًا متعارضًا معه.

# عقد ملف النص القرآني القانوني

**الاسم الإنجليزي المرجعي:** `CANONICAL QURAN TEXT ARTIFACT CONTRACT`  
**الحالة:** `REQUIRED CONTRACT / ARTIFACT MAY BE EXTERNAL OR USER-SUPPLIED`  
**الوزن:** `TEXTUAL INTEGRITY / CRITICAL`

## 1. الغرض

تحديد الملف الذي يُرجع إليه للتحقق من نص الآيات وأرقامها، بدل الاعتماد على ذاكرة النموذج أو مورد صرفي مثل QAC.

## 2. الملف المعتمد في هذا الـProfile

- الرواية: حفص عن عاصم.
- مرجع الرسم والعرض: مصحف المدينة وفق النسخة التي يعتمدها المالك.
- يجب أن يكون الملف محدد الإصدار والبصمة.

## 3. الحقول الإلزامية في وصف الملف

```yaml
canonical_quran_artifact:
  artifact_id: ""
  title: ""
  recitation_profile: "HAFS_ASIM"
  mushaf_profile: "MADINAH"
  version: ""
  path_or_resource_id: ""
  sha256: ""
  verse_count: ""
  source_provenance: ""
  license_or_use_decision: ""
  normalization_policy: "RAW_PRESERVED | DERIVED_COMPARISON_COPY"
```

## 4. أحكام التشغيل

1. لا يستخدم QAC للتحقق من الرسم القرآني.
2. لا يُدعى `canonical_text_verified: true` من دون ملف يطابق هذا العقد.
3. إذا لم يكن الملف متاحًا، تكون الحالة:

   `CANONICAL_TEXT_ARTIFACT_UNAVAILABLE`

   ويجوز استمرار تحليل أولي على نص يقدمه المستخدم مع وسمه `PROVISIONAL_USER_SUPPLIED`، لكن لا يدعى تحقق نهائي للاقتباس أو اكتمال corpus القانوني.
4. تحفظ البايتات الأصلية؛ أي تطبيع للمقارنة ينتج ملفًا مشتقًا ولا يستبدل الأصل.

## 5. حالة الحزمة الحالية

الحزمة توثق عقد الملف ومصدرًا مرشحًا، لكنها لا تدعي أن نص مصحف المدينة القانوني مضمن فيها ما لم يسجل `references/quran/resource-register.yaml` ذلك صراحة مع البصمة.
