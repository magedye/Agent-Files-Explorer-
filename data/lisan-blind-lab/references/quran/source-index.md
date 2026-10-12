# مصادر دراسة النص القرآني المحكم — v3.3.0

## السلطة الحاكمة

- `governance/OWNER_CONSTITUTIONAL_DECISIONS.md`
- `governance/SOURCE_FIREWALL_CANONICAL.md`
- `governance/CANONICAL_QURAN_TEXT_ARTIFACT_CONTRACT.md`
- `governance/ARABIC_FIRST_SCIENTIFIC_PRESENTATION_STANDARD.md`
- `governance/QURANIC_OUTPUT_LEVELS_STANDARD.md`
- `governance/MANDATORY_LAYERED_SEMANTIC_ANALYSIS_PRESENTATION_PROTOCOL.md`
- `rules/06-quranic-semantic-constitution-v3.md`
- `rules/v3.2/RULE_STATUS_LEDGER.md`

## المصادر المسموحة دلالياً

| المصدر | الدور | الحكم |
|---|---|---|
| حفص عن عاصم / مصحف المدينة | النص القانوني | المصدر الدلالي النصي الحاكم؛ لا يدعى التحقق النهائي بلا Artifact مثبت البصمة |
| QAC Morphology 0.4 المرفق | root/lemma/POS/morphology candidates | بنيوي فقط؛ لا gloss ولا تحقق رسم الآية |
| موارد صرفية/نحوية إضافية مقبولة | تحقق بنيوي متقاطع | الحقول البنيوية المصرح بها فقط مع lineage |
| قواعد المنهج | تنظيم الإجراء | لا تحقن إجابة دلالية مخزنة |
| مرجع العوامل الصرفية v0.2 | تنظيم طبقات morphology + إحصاء بنيوي + فرضيات معلنة | الجزء البنيوي مسموح؛ القيم العاملية ليست دليلًا ولا AGREED |

## المصادر المحجوبة في Blind Run

كل ما في `references/quran/priors/`، ومنها:

- Semantic Definition Registry.
- «على بصيرة» بنسختيه.
- AMN/SLM/BWA/RJL working cards.
- خارطة الطريق والنتائج السابقة.

تُفتح بعد `LOCK_INTERNAL_RESULT` للمقارنة التفاضلية مع priors المشروع فقط.

## المصادر المحظورة من خط التحقق الدلالي

- التفاسير.
- المعاجم واللسانيات الموروثة بوصفها معنى.
- الحديث والشعر والاستعمال الثقافي/الديني المتأخر.
- الترجمات وglosses وقوائم المرادفات وWordNet/WSD/semantic labels.
- ذاكرة النموذج بوصفها evidence.

لا تفتح هذه المواد بعد القفل للتحقق أو الإثراء. ويجوز بطلب مالك صريح إعداد ملحق تاريخي/تفسيري منفصل وفق `POST-LOCK INTERPRETIVE REVIEW POLICY`؛ يقيس الآراء بالنتيجة المقفلة ولا يعدلها أو يرفع ثقتها.

## موارد مرفقة

- QAC raw: `assets/quran/qac/quranic-corpus-morphology-0.4.txt`.
- وصفه: `qac-morphology-0.4.md`.
- أداة الاستعلام: `scripts/qac_morphology_query.py`.
- مرجع العوامل الصرفية: `morphology/LISAN_Quranic_Morphological_Operator_Reference_v0.2.md`.
- السجل الآلي للعوامل: `morphology/morphological-operator-registry-v0.2.json`.
- Validator المرجع: `scripts/validate_operator_reference.py`.
- تقرير المراجعة والدمج: `morphology/REVIEW_AND_INTEGRATION_REPORT_v3.3.0.md`.
- مصادر قديمة: دستور v2 وتصميم النظام وتقرير الدمج v2، وهي legacy غير حاكمة عند التعارض.

## ملف النص القانوني

العقد الحاكم: `governance/CANONICAL_QURAN_TEXT_ARTIFACT_CONTRACT.md`. الحزمة الحالية توثق المورد المرشح لكنها لا تدعي أن Artifact نص مصحف المدينة مثبت البصمة مضمن افتراضيًا.
