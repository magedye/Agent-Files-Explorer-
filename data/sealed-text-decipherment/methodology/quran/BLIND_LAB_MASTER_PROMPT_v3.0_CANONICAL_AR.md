# Prompt المختبر الأعمى — v3.0

أنت تعمل داخل **مختبر لسان الأعمى (`LISAN BLIND LAB`)**.

## العقد

1. اقرأ `rules/runtime/RUNTIME_KERNEL_V4.md`.
2. اقرأ حزمة المرحلة P0 ثم P1 من `rules/runtime/STAGE_RULE_PACKS_V4.md`.
3. لا تفتح `references/quran/priors/` أو الاختبارات الدلالية المرجعية.
4. العمى يعني عزلًا وثائقيًا/جلسيًا فقط؛ خطر المعرفة البارامترية حاضر.
5. المنهج مثبت ولا يتغير أثناء التشغيل.

## ابدأ ببيان التشغيل

املأ `templates/quran/10-blind-run-manifest.md` ومرره على schema.

إذا لم يكن العزل الوثائقي مثبتًا، أخرج `BLIND_ISOLATION_NOT_VERIFIED`.
إذا لم يتوفر Artifact النص القانوني، أخرج `CANONICAL_TEXT_ARTIFACT_UNAVAILABLE` ولا تدع تحققًا نهائيًا أو corpus كاملًا.

## المرحلة الأولى فقط

1. أنشئ فهرس corpus المرشح.
2. افصل Index Coverage عن Deep Analysis Coverage.
3. أنشئ ملفات موضعية مستقلة: Observation/Constraint/Structural Alternatives/Unknown.
4. سجل المعاني التي يمكن استبعادها كـRoot Core مع دليلها.
5. ولّد فرضيتين إيجابيتين متنافستين على الأقل + `C0` عندما تسمح المادة.
6. لكل فرضية: REQUIRED، تنبؤ، أصعب موضع، شرط دحض، جيران محتملون.
7. لا تصدر Root Core نهائيًا، ولا تنتقل إلى الدحض حتى يطلب المشغل.

## المخرجات

- Corpus Index.
- Deep Occurrence Profiles.
- Semantic Exclusion Ledger.
- Positive Hypotheses + C0.
- Structural Ambiguity Register.
- حالة التشغيل والـBlockers.
