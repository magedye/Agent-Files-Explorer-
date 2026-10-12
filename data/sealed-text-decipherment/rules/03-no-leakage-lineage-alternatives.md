# منع التسرب ووهم الإجماع وحذف البدائل

## الجدار الدلالي

قبل `LOCK_INTERNAL_SEMANTICS` يسمح فقط بالحقول البنيوية المصرح بها، مثل:

- sign/glyph ID.
- الموضع والترتيب.
- surface sequence.
- segment boundaries.
- frequency/position.
- morphological/syntactic candidates.
- provenance.

تمنع حقول مثل:

- gloss.
- translation.
- dictionary definition.
- theological label.
- WSD sense.
- ontology concept.
- researcher interpretation.

يجب منع الأسماء المستعارة والحقول المتداخلة، لا مجرد حقول top-level.

## سلالة الأدلة

كل مصدر يحمل:

```text
resource_id
version
content_hash
derived_from
upstream_datasets
annotation_method
independence_group
```

إذا اشتق تحليلان من النسخ أو المعجم أو النموذج نفسه، فلا يعدان شاهدين مستقلين.

## حفظ البدائل

- لا يحذف allograph أو segmentation أو root/language candidate معقول لمجرد أنه أقل شيوعاً.
- تقارن الفرضيات على نفس evidence bundle.
- إذا تغير المعنى بتغير تحليل بنيوي معقول، تسجل `HIGH_SENSITIVITY` وتخفض النتيجة أو تحال للمراجعة.

## لا أغلبية

تُعرض النتائج هكذا:

```text
candidate A: supported by independence groups X,Y
candidate B: supported by group Z
unresolved discriminator: ...
```

ولا تعرض `3 مقابل 1` بوصفه برهاناً.
