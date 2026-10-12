# External anchors and staged comparison — general decipherment only

> **Quranic override:** This chapter applies to non-Quranic decipherment tasks. For Quranic semantic analysis, inherited/external semantic authorities are prohibited under `QURAN-INTERNAL SEMANTIC SOVEREIGNTY`; after lock, only project-internal priors may be compared differentially.


## أنواع الـanchors

- نص ثنائي أو متعدد اللغة.
- اسم علم محتمل.
- أعداد أو تقاويم أو وحدات قياس.
- لغة قريبة أو cognates.
- سياق أثري/مادي.
- iconography.
- ترجمات أو قراءات سابقة.

## متى تُفتح؟

- anchors بصرية/نسخية: بعد `LOCK_TRANSCRIPTION`.
- anchors صوتية/لغوية: بعد `LOCK_STRUCTURE`.
- glosses وترجمات وتأويلات: بعد `LOCK_INTERNAL_SEMANTICS`.

## قواعد الاستخدام

1. سجل anchor قبل الاستعمال مع المصدر والنسخة والبصمة.
2. لا تفترض الاستقلال؛ تتبع lineage.
3. لا تقبل cognates منتقاة؛ اطلب مراسلات منتظمة.
4. اختبر mapping على بيانات لم تستخدم في بنائه.
5. اسم العلم لا يترجم بقية المعجم تلقائياً.
6. السياق الأثري يقيد المجال ولا يحدد gloss دقيقاً وحده.
7. الخارج قد يدحض الداخل أو يخصصه؛ لا يعيد كتابته صامتاً.

## نتائج المقارنة

- `SUPPORTS`
- `CONTRADICTS`
- `SPECIALIZES`
- `CONTEXTUALIZES`
- `UNRESOLVED`
- `NOT_INDEPENDENT`

## إعادة الفتح

إذا ظهر anchor قوي يناقض القفل، أنشئ revision جديداً:

```text
internal_snapshot_v1
→ external_finding
→ review decision
→ internal_snapshot_v2
```

ولا تستبدل v1.
