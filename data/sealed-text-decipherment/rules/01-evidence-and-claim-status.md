# طبقات الأدلة وأنواع الادعاء

## طبقات الأدلة

| الطبقة | التعريف |
|---|---|
| **أ** | ملاحظة مباشرة من corpus: علامة، تكرار، ترتيب، محاذاة بصرية، صيغة متطابقة، موضع |
| **ب** | استنتاج داخلي: allograph، اتجاه، تقطيع، paradigm، وظيفة نحوية، نواة دلالية داخلية |
| **ج** | anchor أو مقارنة خارجية بعد القفل المناسب: ثنائية لغة، اسم علم، عدد، لغة قريبة، مادة أثرية، ترجمة سابقة |
| **د** | احتمال أو عدم حسم أو فرضية غير كافية أو خلاف لا يمكن تمييزه |

لا تتحول ج إلى أ، ولا يُعرض ب كأنه قراءة مكتوبة صراحة في النص.

## أنواع الادعاء المستقلة

يجب وسم كل claim بنوع واحد على الأقل:

- `GLYPH_IDENTITY`
- `ALLOGRAPH_EQUIVALENCE`
- `READING_DIRECTION`
- `WRITING_SYSTEM_TYPE`
- `SEGMENTATION`
- `PHONETIC_VALUE`
- `MORPHEME_FUNCTION`
- `MORPHOLOGICAL_PARADIGM`
- `SYNTACTIC_FUNCTION`
- `LEXEME_MEMBERSHIP`
- `SEMANTIC_CORE`
- `LOCAL_MEANING`
- `TRANSLATION`
- `TEXTUAL_INTERPRETATION`

الاتفاق على نوع لا يرفع بقية الأنواع تلقائياً.

## درجات الادعاء

| الدرجة | المعنى |
|---|---|
| `OBSERVED` | مسجل مباشرة دون تفسير |
| `CANDIDATE` | فرضية محددة لها دليل أولي |
| `INTERNALLY_SUPPORTED` | تفسر مادة متنوعة وتتفوق على بديل معلوم |
| `PREDICTIVE` | قدمت تنبؤاً مجمداً نجح على مادة محجوبة |
| `EXTERNALLY_CORROBORATED` | وافقها anchor مستقل بعد القفل |
| `INDEPENDENTLY_REVIEWED` | راجعها مختص مستقل ضمن نطاقها |
| `REJECTED` | فشلت في بوابة أو دحضها دليل |
| `UNRESOLVED` | الأدلة لا تميز البدائل |

## قاعدة السقف

```text
translation_status <= min(
  corpus_integrity,
  transcription_status,
  segmentation_status,
  structure_status,
  lexicon_status,
  semantic_status,
  holdout_status,
  review_status
)
```

لا تعني الدرجة احتمالاً رقمياً للصحة.

## Quranic profile note

In the Quranic semantic profile, layer C is limited to **post-lock project-internal prior comparison**. Inherited external semantic sources do not become evidence layer C and cannot corroborate or correct the Quran-internal result.
