# مورد Quranic Arabic Corpus Morphology 0.4 المرفق

## الهوية

- الملف: `assets/quran/qac/quranic-corpus-morphology-0.4.txt`
- SHA-256: `a1d12923815341face765083805d2148ed2d9f5cc3f7d6665219d887675d8c46`
- السجلات الصرفية: `128219`
- الجذور المعلّمة في الملف: `1642`
- اللممات المعلّمة في الملف: `4832`
- المصدر يصرح أنه QAC morphology 0.4، وأن النص المضمن فيه مبني على Tanzil Uthmani 1.0.2.

## الترخيص والحفظ

الملف مرفق **حرفياً دون تعديل** بناءً على النسخة التي قدمها المستخدم. يجب إبقاء كتلة حقوق QAC/Tanzil الأصلية في أوله، والإسناد إلى `corpus.quran.com` وTanzil وفق الشروط المكتوبة داخل الملف. راجع `THIRD_PARTY_NOTICES.md`.

## البنية

```text
LOCATION    FORM    TAG    FEATURES
(surah:ayah:word:segment)
```

`FORM` والـroot/lemma مكتوبة بترميز QAC/Buckwalter، لا بالرسم العربي القانوني.

## الاستخدام المسموح قبل القفل

- العنوان والمقطع.
- surface transliteration.
- POS.
- root candidate.
- lemma candidate.
- الخصائص الصرفية والتقسيم.

كلها مرشحات بنيوية من الطبقة ب، وتحمل provenance إلى السطر والملف والبصمة.

## ما لا يثبته المورد

- لا يثبت النواة الدلالية.
- لا يحسم الجذر عند وجود بديل معقول.
- لا يعد نصاً قانونياً حالياً للتحقق من الاقتباس العربي.
- لا يثبت اكتمال الجمع إذا كان نطاق الدراسة يستخدم نسخة نص مختلفة.
- لا يعد مستقلاً عن Tanzil أو عن موارد مشتقة من QAC.

## أداة الاستعلام

```text
python scripts/qac_morphology_query.py --verify
python scripts/qac_morphology_query.py --root ktb --summary
python scripts/qac_morphology_query.py --lemma kita`b --format jsonl
python scripts/qac_morphology_query.py --location 2:2 --format tsv
```

الاستعلام لا يختار معنى ولا يحذف البدائل.
