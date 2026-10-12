# مرجع العوامل الصرفية القرآنية

**الاسم الإنجليزي المرجعي:** `Quranic Morphological Operator Reference`

## الغرض

يوفر هذا المجلد مرجعًا متطورًا لفصل مساهمات البنية الصرفية عن المفهوم الجذري والسياق. المرجع لا يقدم «معاني أوزان» مدرسية مقفلة، بل يجمع:

1. إثباتًا بنيويًا من مورد QAC Morphology 0.4؛
2. فرضيات عاملية قرآنية داخلية قابلة للدحض؛
3. حالات ونطاقات ادعاء واضحة؛
4. اختبارات لازمة قبل ترقية أي قيمة عاملية.

## المصدر الحاكم داخل المجلد

- السجل الآلي: `morphological-operator-registry-v0.2.json`
- العرض العلمي العربي: `LISAN_Quranic_Morphological_Operator_Reference_v0.2.md`
- العرض الجدولي: `LISAN_Quranic_Morphological_Operator_Reference_v0.2.xlsx`

المجلد `archive/v0.1/` للحفظ والتتبع فقط، ولا يحكم عند التعارض.

## سياسة الوصول

- الأعداد والوسوم البنيوية مسموحة قبل القفل بوصفها بيانات بنيوية غير دلالية.
- القيم العاملية المقترحة ليست أدلة ولا نتائج معتمدة؛ يجب إعادة اختبارها على Corpus الهدف.
- إذا كان هدف التشغيل اكتشاف قيمة العامل نفسه، تُحجب القيم المقترحة ويستخدم الجزء البنيوي فقط.
- الأمثلة توضيحية وليست `EVIDENCE MATRIX`.

## القواعد الحاكمة

- ثبات مساهمة العامل الصرفي (`MORPHOLOGICAL OPERATOR INVARIANCE`) — R69.
- مساهمة الصيغة لا تساوي مساهمة الجذر (`MORPHOLOGICAL CONTRIBUTION ≠ ROOT CONTRIBUTION`) — R70.
- اختبار الصيغة عبر الجذور (`CROSS-ROOT FORM TEST`) — R71.
- بوابة التحقق من هوية الصيغة (`FORM-IDENTITY VERIFICATION GATE`) — R98.
- الحذر من الصيغة الأساس غير الموثقة (`UNATTESTED-BASE FORM CAUTION GATE`) — R109.
- استقلال مساهمة العامل اللغوي وثباتها (`OPERATOR-CONTRIBUTION INDEPENDENCE & INVARIANCE`) — R111.
- الإثبات البنيوي لا يساوي إثبات دلالة العامل (`STRUCTURAL ATTESTATION ≠ OPERATOR SEMANTIC VALIDATION`) — R112.
- عدم دمج طبقات العوامل الصرفية (`MORPHOLOGICAL OPERATOR STACK NON-COLLAPSE`) — R113.
