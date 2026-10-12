# Quranic Semantic Definition Registry — v1

## Governance

This registry preserves owner-agreed or explicitly tracked semantic definitions so they do not disappear into chat history.
It is a **reference and regression memory**, not pre-analysis evidence.

### Access rule

- In a **fresh independent discovery** task, this file MUST remain hidden until `LOCK_INTERNAL_SEMANTICS`.
- If the task explicitly asks to **reuse, compare, audit, refine, or continue** an existing agreed definition, the relevant entry MAY be opened as declared prior context.
- A stored definition never overrides the canonical Quranic corpus, decisive contexts, falsification, or lexical-distinctiveness gates.
- Any revision MUST preserve the previous wording, reason for change, decisive evidence, and reopen condition.

### Required fields per entry

- `root_or_lexeme`
- `status`
- `root_core_definition`
- `semantic_boundary`: `REQUIRED / PERMITTED / EXCLUDED / UNKNOWN`
- `decisive_contexts`
- `competing_or_rejected_definitions`
- `supporting_rules`
- `local_realizations`
- `coverage_and_confidence`
- `provenance`
- `reopen_condition`
- `regression_tests`
- `last_updated`

---

## Entry: ن ش ز

**root_or_lexeme:** `ن ش ز`  
**status:** `AGREED / REGRESSION_BACKED / LEXICALLY_NOT_FULLY_DIFFERENTIATED`  
**last_updated:** `2026-08-14`

### Root core definition

> حزمة دلالية تتمحور حول **الالتصاق، والاشتباك، والتقارب الشديد بين أطراف أو أجزاء**، مع بقاء النواة الواحدة ثابتة عبر الصيغ والسياقات، واختلاف وجه التحقق بحسب الطبقات الصرفية والتركيبية والسياقية.

### Semantic boundary

**REQUIRED**
- علاقة بين أطراف/أجزاء، لا مجرد حركة عنصر منفرد.
- تقارب شديد يصل إلى تماس/التصاق/اشتباك بحسب التحقق.
- بقاء النواة قابلة للتتبع في العظام، والمجلس، والسياق الزوجي.

**PERMITTED / LOCAL REALIZATIONS**
- التحام/اشتباك أجزاء في تحقق مادي.
- تضام/تقارب شديد في تحقق مكاني.
- اشتباك/احتكاك علائقي أو شعوري في تحقق زوجي.

**EXCLUDED AS ROOT CORE**
- `العصيان` وحده.
- `الارتفاع` أو `العلو` وحده.
- `الإعراض/الابتعاد` بوصفه تطابقًا للنشوز.
- أي تعريف خاص بالمرأة أو بالسياق الزوجي وحده.

**UNKNOWN / OPEN**
- التفريد النهائي عن أقرب الألفاظ القرآنية التي تشارك معنى القرب/الضم/التماس.
- الصياغة العربية الأدق والأقصر التي تحفظ جميع عناصر النواة دون التطابق مع لفظ قرآني آخر.

### Decisive contexts

- `كيف ننشزها` مع العظام: decisive negative evidence ضد `العصيان` وضد حصر الجذر في مجال زوجي.
- `تفسحوا ... انشزوا`: contrast-axis evidence لاختبار المسافة/التقارب.
- `نشوزًا أو إعراضًا`: structural non-redundancy ضد طمس النشوز في الإعراض.
- `واهجروهن في المضاجع`: remedial-coherence evidence ثانوي، لا تعريف.

### Supporting rules

`SINGLE ROOT CORE`, `ZERO-PRIOR-MEANING`, `CORPUS-FIRST GATE`, `RELATIONAL-SEMANTICS CHECK`, `PHYSICAL–RELATIONAL INVARIANT`, `CONTRAST-AXIS SEARCH`, `STRUCTURAL NON-REDUNDANCY`, `FALSIFICATION GATE`, `LEXICAL DISTINCTIVENESS`.

### Regression tests

- `tests/quran-n-sh-z-regression.md`

### Provenance

- Owner/model iterative analysis, 2026-08-14.
- The agreed result followed correction of prior-contaminated paths `ارتفاع` and `عصيان`.

### Reopen condition

Reopen if a confirmed Hafs/Madinah occurrence genuinely contradicts the invariant, or lexical-differentiation testing shows that the stored definition fully collapses into another Quranic lexeme.

---

## Entry: ك ت ب

**root_or_lexeme:** `ك ت ب`  
**status:** `AGREED_WORKING / PROVISIONAL / DIFFERENTIATION_IN_PROGRESS`  
**last_updated:** `2026-08-14`

### Owner working definition

> **جمع وضم مجموعة عناصر ضمن وحدة واحدة لتكون نظامًا ملزمًا.**

### Current analytical refinement under test

> **ضمّ وربط عناصر أو أطراف أو مضامين ضمن وحدة واحدة ذات علاقات محددة ومقيدة، فتتكون بنية واحدة محكومة؛ وقد يظهر الإلزام أو التشريع أو العقد أو التدوين أو التخصيص بوصفها تحققات موضعية ناتجة من النواة مع الصيغة والتركيب والسياق.**

This refinement does **not** replace the owner wording silently; it records the current decomposition needed to separate Root Core from local realizations.

### Semantic boundary

**REQUIRED / STRONGLY CANDIDATE**
- ضم/جمع عناصر أو أطراف أو مضمون داخل وحدة واحدة.
- ربط العناصر بعلاقات محددة، لا مجرد تجميع مكاني عابر.
- وجود بنية/نظام يجعل العناصر مترابطة أو مقيدة ضمن الوحدة.

**PERMITTED / LOCAL REALIZATIONS**
- الكتابة/التدوين المادي.
- الإلزام التشريعي في تراكيب مثل `كتب على` بحسب السياق.
- التخصيص أو النسبة في تراكيب أخرى.
- العقد/المكاتبة عند صيغة المشاركة والسياق المناسب.
- التسجيل أو الحفظ المنظم للمضمون.

**EXCLUDED AS ROOT CORE**
- `الخط بالقلم` أو التدوين المادي وحده.
- `الإلزام على الغير` وحده.
- `الجمع` وحده كتطابق كامل.
- `التثبيت` وحده كتطابق كامل.
- `الصدق/الحق/المشروعية` بوصفها خصائص لازمة للجذر.

**UNKNOWN / OPEN**
- هل `الإلزام/التقييد` جزء لازم من Root Core نفسه أم أثر منتظم من البنية والتركيب في بعض الوجوه؟
- التفريد النهائي عن جذور/ألفاظ قريبة: `جمع، ضم، ثبت، خط، سطر، رقم` وغيرها بحسب corpus.
- الصياغة الدنيا الكافية التي تفسر كامل corpus عالي التكرار دون overfitting.

### Decisive contexts

- `كتب على نفسه الرحمة`: **SELF-REFERENTIAL DECISIVE CONTEXT**؛ حاسم ضد `فرض على الغير` وضد جعل الوسيلة المادية Root Core.
- `فاكتبنا مع الشاهدين`: حاسم ضد حصر ك ت ب في الكتابة المادية؛ يختبر الإدخال/الضم ضمن نسبة أو وحدة.
- `يكتبون الكتاب بأيديهم ... هذا من عند الله`: **FALSE-CONTENT NEUTRALITY TEST**؛ الكتابة لا تضمن الحق أو المشروعية.
- `كتب على نفسه الرحمة ليجمعنكم`: **SAME-VERSE LEXICAL COLLISION GATE** و`DOWNSTREAM EVENT ≠ ROOT CORE`؛ يمنع التطابق التام بين `كتب` و`جمع`.
- `كتاب مسطور` / `كتاب مرقوم`: يفرّق ك ت ب عن السطر/الرقم كتطابق تام.

### Supporting rules

`SINGLE ROOT CORE`, `FORM–MEANING COVARIANCE`, `ROOT CORE ≠ LOCAL REALIZATION`, `CORE-TO-REALIZATION DERIVATION CHAIN`, `DECISIVE CONTEXT PRINCIPLE`, `SELF-REFERENTIAL DECISIVE CONTEXT`, `ROLE-COLLAPSE TEST`, `ABSTRACT-OBJECT DECISIVE TEST`, `NORMATIVE BINDING ≠ STRUCTURAL BINDING`, `SAME-VERSE LEXICAL COLLISION GATE`, `NECESSARY COMPONENT ≠ DEFINING CORE`, `LEXICAL DISTINCTIVENESS`.

### Coverage and confidence

- Root is high-frequency; full-corpus coverage has **not** yet been completed in this discussion.
- Current definition remains provisional despite strong decisive negative evidence against several alternatives.
- Negative determinations may carry higher confidence than positive identification under `ASYMMETRIC SEMANTIC CERTAINTY`.

### Regression tests

- `tests/quran-k-t-b-regression.md`

### Provenance

- Owner/model iterative analysis, 2026-08-14.
- Owner explicitly identified `كتب على نفسه الرحمة` as a decisive context.

### Reopen condition

Reopen/refine when broader corpus coverage, cross-lexeme differentiation, or a decisive context shows that the current structured-binding formulation is too broad, too narrow, or conflates Root Core with a constructional/local effect.
