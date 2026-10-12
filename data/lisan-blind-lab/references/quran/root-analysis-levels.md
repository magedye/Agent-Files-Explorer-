# مستويات تحليل الجذر والعائلة الاشتقاقية — v3

## المستوى الإلزامي

1. `ZERO-PRIOR-MEANING`: البداية `UNKNOWN`.
2. تثبيت حفص عن عاصم / مصحف المدينة.
3. جمع كل المشتقات الصريحة في corpus واحد (`ROOT CORPUS UNITY RULE`).
4. الجذور القليلة: 100% من المواضع. الجذور الكثيرة: ≥10 مواضع متنوعة خصومياً كبداية.
5. بناء ملف محلي مستقل لكل موضع.
6. فصل `OBSERVATION / CONSTRAINT / HYPOTHESIS / INFERENCE / RESULT / UNKNOWN`.
7. تحليل مساهمة تغير المبنى (`FORM–MEANING COVARIANCE`).
8. اقتراح عدة فرضيات **لنواة واحدة ثابتة**، لا عدة نوى للجذر المؤكد.
9. تصنيف كل موضع `SUPPORTS / COMPATIBLE / INDETERMINATE / CONTRADICTS`.
10. اختبار الإبطال على أصعب موضع.
11. فصل Root / Form / Syntax / Context / Local Meaning.
12. تطبيق `REVERSE-STRIPPING` و`CROSS-DERIVATION INVARIANCE`.
13. تفريد النواة عن أقرب الألفاظ القرآنية.
14. حساب `Corpus Coverage`, `Context Diversity Coverage`, `Semantic Confidence`.
15. التصريح بالـunknowns وشرط الدحض.

## المستوى المتقدم

- اللزوم والتعدية والمعلوم والمجهول والفاعل والمفعول.
- الزمن والعدد والجنس والضمائر والزيادة والنقص والترتيب والتشديد.
- المصاحبات والمقابلات والتراكيب والحروف.
- `STATE-TRANSITION MODELING` و`CONTRAST-AXIS SEARCH`.
- `SEMANTIC-RESIDUE TEST` و`COUNTERFACTUAL-SUBSTITUTION TEST`.
- `ROOT-TRACEABILITY GATE` و`NO-SEMANTIC-MUTATION RULE`.
- `PHONIC/ORDER INTUITION HYPOTHESIS` و`GEMINATION/SHADDA INTENSIFICATION HYPOTHESIS` استئناسياً فقط.

## المستوى البحثي

- إحصاء وتوزيع واختيار adversarial sampling موسع.
- holdout اشتقاقي أو موضعي عند الإمكان دون خرق اكتمال الجذر القليل.
- حساسية الجذر والتقطيع والصرف والنحو.
- الاستئناس بالمعاجم والحديث والشعر وفق السياسة غير الحاكمة.
- سجل القرارات والفرضيات المرفوضة.

## معايير قبول النواة

تكون النواة أقوى عندما:

- تكون **واحدة وثابتة** في جميع المشتقات المؤكدة.
- تفسر أفراد الأسرة دون تمطيط ودون semantic mutation.
- تسمح للصيغ والتركيبات بإضافة فروق محلية حقيقية.
- تنجو من أصعب موضع ومن اختبار الإبطال.
- تتفرد عن أقرب الألفاظ القرآنية ولا تتطابق مع مفهوم مفردة قرآنية أخرى.
- تترك أقل بواقي وتحتاج أقل افتراضات خاصة.

## الجذور الواسعة

لا يبرر اتساع الجذر اعتماد «عدة نوى» للجذر المؤكد. إذا فشل نموذج النواة الواحدة، أعد فحص: root assignment، الاشتقاق، الصيغة، التركيب، corpus، أو أبق النتيجة `UNKNOWN / ROOT_ASSIGNMENT_UNCERTAIN` حتى يثبت الحل.
