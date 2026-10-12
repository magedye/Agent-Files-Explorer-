# الصرف والنحو قبل الدلالة

## 1. paradigms الشكلية

اجمع الوحدات التي تشترك في stem محتمل أو قالب:

```text
X-a
X-i
X-u
pre-X
X-suf
```

لا تسمّ اللواصق «جمعاً» أو «ماضياً» أولاً؛ سمها `AFFIX_A` ثم اختبر الوظيفة.

## 2. اختبارات الوظيفة الصرفية

- هل يظهر العنصر في الموضع نفسه من عدة كلمات؟
- هل يرتبط بتغير متسق في السياق؟
- هل يتبادل مع عنصر آخر؟
- هل يغير valency أو distribution؟
- هل التفسير الواحد يضغط corpus أفضل من memorization؟

## 3. الجذوع والعائلات

العضوية في عائلة شكلية لا تعني وحدة المعنى. افصل:

- formal family.
- morphological family.
- lexeme family.
- semantic family.

## 4. النحو

استنبط hypotheses حول:

- حدود الجملة.
- head/dependent.
- ترتيب S/O/V المحتمل.
- agreement.
- particles.
- negation.
- coordination.
- relative/embedded clauses.

## 5. بدائل التحليل

احتفظ بأكثر من parse عندما تكون الأدلة متقاربة. اختبر أثر كل parse على المعنى.

## 6. بوابة البنية

`LOCK_STRUCTURE` يتطلب:

- تغطية معلنة.
- بدائل محفوظة.
- no-cycle in dependency hypotheses حيث ينطبق.
- اختبارات تنبؤ على sequences محجوبة.
- عدم استخدام ترجمة سابقة لتسمية الوظائف.

## مكدس العوامل الصرفية في الملف القرآني

عند تطبيق المنهج على القرآن، لا تختزل الصيغة في تسمية واحدة. استخدم التفكيك:

```text
ROOT
+ STEM FORM
+ ASPECT / VIEW
+ VOICE
+ MOOD
+ NOMINALIZATION / PARTICIPLE
+ PARTICLE / CONSTRUCTION
+ ARGUMENTS
+ CONTEXT
= LOCAL FORM MEANING
```

لكل طبقة سجل مستقل من:

- `structural_status`: هل البنية موثقة؟
- `semantic_status`: هل القيمة الدلالية مفترضة أم مختبرة؟
- `claim_scope`: محلي، داخل الجذر، مدعوم عبر الجذور، أو أوسع.

تطبق R112 لمنع تحويل العدد أو الوسم البنيوي إلى معنى، وتطبق R113 لمنع دمج الطبقات في gloss واحد. المرجع المساعد هو `references/quran/morphology/LISAN_Quranic_Morphological_Operator_Reference_v0.2.md`.
