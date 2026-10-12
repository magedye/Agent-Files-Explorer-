# حجر رشيد الداخلي والاستقراء الدلالي

## 1. الملف المحلي المستقل

لكل occurrence أو وحدة مرشحة سجل مستقل يضم:

- الشكل والعنوان.
- segmentation alternatives.
- morphology candidates.
- syntactic slot.
- الجوار القريب والبعيد.
- parallel/contrast relations.
- discourse position.
- unknowns.

يُمنع إدخال المعنى المرشح في هذا الملف.

## 2. مصادر المعنى الداخلي

تولّد semantic features من:

- substitution in parallel structures.
- contrasts and negation.
- co-reference أو إعادة الصياغة المحتملة.
- predictable participants/arguments.
- list membership.
- causal/temporal position.
- repeated formula variants.
- self-description داخل النص.

## 3. النواة الدلالية

للوحدة أو العائلة المرشحة:

```text
local meaning =
semantic core candidate
+ morphological contribution
+ construction contribution
+ contextual selection
+ residuals
```

يجب أن تكون النواة:

- أضيق ما يفسر الاستعمالات.
- غير مساوية لمجال واحد.
- قابلة للاختبار على مواضع لم تستخدم في بنائها.
- أقل استثناءات من البديل.

## 4. الفرضية الصفرية

تظل `C0` متاحة:

- لا معنى واحداً مثبتاً.
- homography/polysemy.
- أكثر من lexeme تحت الشكل نفسه.
- corpus غير كافٍ.

## 5. ترجمة الجمل

لا تنتج ترجمة كاملة إلا بعد:

- تغطية بنيوية كافية.
- معجم مرشح موثق.
- تفسير residuals.
- نجاح على holdout.

وإلا تنتج ترجمة هيكلية مثل:

```text
[فاعل محتمل] + [فعل حركة/تحول غير محسوم] + [هدف]
```

بدلاً من ألفاظ دقيقة مخترعة.
