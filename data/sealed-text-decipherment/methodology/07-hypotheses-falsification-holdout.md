# الفرضيات والدحض والـholdout

## سجل الفرضية

كل فرضية تسجل:

- claim type.
- scope.
- evidence used.
- competing hypothesis.
- null hypothesis.
- predictions.
- falsification condition.
- residuals.
- sensitivity dependencies.

## تجميد التنبؤ

قبل كشف holdout اكتب مثلاً:

- أين يجب أن تظهر العلامة؟
- أي affix ينبغي أن يلحق بهذا stem؟
- أي صيغة موازية متوقعة؟
- ما sequence غير المسموح إذا كانت الفرضية صحيحة؟
- كيف يجب أن يتصرف cognate محتمل؟

## أنواع الـholdout

- أسطر محجوبة.
- شاهد جديد.
- variant لمخطوط آخر.
- عضو paradigm محجوب.
- اسم/عدد لم يستخدم في البناء.
- bilingual segment محجوب.

## الدحض

تُرفض أو تُخفض الفرضية إذا:

- فشل تنبؤ مركزي.
- احتاجت استثناءات بعدد كبير.
- حسنت fit فقط بعد رؤية holdout.
- انهارت تحت segmentation أو parse بديل معقول.
- تفوقت عليها C0 أو فرضية أبسط.

## منع التسرب

- لا يقرأ المنفذ oracle.
- لا تستخدم الأمثلة التدريبية كتقييم مستقل.
- كل كشف holdout يسجل زمنه وهوية candidate السابقة له.

## السجل الإلزامي عند استعمال Holdout

في الملف القرآني استخدم:

`templates/quran/15-holdout-prediction-freeze.md`

ولا يكون شرط أهلية القفل مستوفى إلا إذا كانت قيمة:

`holdout_prediction_frozen_or_not_applicable: true`
