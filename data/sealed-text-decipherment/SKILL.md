---
name: sealed-text-decipherment
description: >-
  منهج استقراء لساني داخلي لفك النصوص المحكمة وتحليل الجذور والألفاظ القرآنية،
  مع corpus أولًا، ومفهوم جذري واحد، وفصل الصيغة والتركيب والسياق، والدحض،
  والسياقات الحاسمة، والاستبعادات، والقفل المرحلي. في الملف القرآني يعتمد حفصًا
  عن عاصم/مصحف المدينة، ويمنع المعاني الخارجية من المسار الدلالي، ويستخدم نواة
  تشغيل مختصرة وحزم قواعد مرحلية، مع فصل حزمة Project Hub عن مختبر Blind Lab.
---

# مهارة الاستقراء اللساني لفك رموز النص المحكم — v3.4.0

## 1. الغرض

تستخدم هذه المهارة لاكتشاف البنية والمعنى من داخل corpus مضبوط، مع الاعتراف بأن النتيجة قد تكون `UNKNOWN` أو `LOCK_BLOCKED`. وهي لا تجعل النموذج أو المعجم أو التفسير سلطة معنى.

## 2. المرجع الأعلى

عند المهمة القرآنية اقرأ أولًا:

1. `references/quran/governance/LISAN_CONSTITUTIONAL_CORE_v4.0.md`
2. `rules/runtime/RUNTIME_KERNEL_V4.md`
3. `rules/runtime/STAGE_RULE_PACKS_V4.md`
4. حزمة المرحلة الحالية فقط.
5. القالب المطلوب.

سجل R01–R113 مرجع موسع للسلالة، وليس Prompt إلزاميًا كاملًا لكل تشغيل:

`rules/06-quranic-semantic-constitution-v4.md`

## 3. المبادئ الحاجبة

- **السيادة الدلالية القرآنية الداخلية (`QURAN-INTERNAL SEMANTIC SOVEREIGNTY`)**.
- **منع المعنى المسبق (`ZERO-PRIOR-MEANING`)**.
- **مفهوم جذري واحد لهوية جذرية مؤكدة (`SINGLE ROOT CORE`)**.
- **تغاير المبنى والمعنى (`FORM–MEANING COVARIANCE`)**.
- **corpus أولًا ووحدة corpus الجذر (`CORPUS-FIRST / ROOT CORPUS UNITY`)**.
- **الفصل الطبقي والتتبع (`LAYER SEPARATION / ROOT TRACEABILITY`)**.
- **الملاحظة لا تساوي التفسير (`OBSERVATION ≠ INTERPRETATION`)**.
- **المجهول نتيجة صحيحة (`UNKNOWN IS VALID`)**.
- **الدحض والنفي والسياق الحاسم**.
- **التفريد اللفظي (`LEXICAL DISTINCTIVENESS`)**.
- **القفل لا يساوي قبول المالك أو اعتماد السجل**.
- **قيمة المنهج أعلى من الجواب المحلي**.

## 4. سلطة النص والمصادر

### الملف القرآني

- النص: حفص عن عاصم/مصحف المدينة فقط.
- لا تدع تحققًا نهائيًا للاقتباس أو اكتمال corpus دون Artifact مسجل ببصمة.
- QAC مورد بنيوي مرشح، وليس نصًا قانونيًا ولا سلطة دلالية؛ root/lemma/form annotations قابلة للمراجعة.
- التفاسير والمعاجم والحديث والشعر والترجمات والمصطلحات اللاحقة وذاكرة النموذج لا تدخل مسار الدلالة ولا تولد فرضيات.
- بعد قفل صالح وبطلب المالك فقط، يمكن إعداد ملحق تاريخي/تفسيري منفصل موثق المصدر، بلا أثر على النواة أو الثقة أو الاعتماد.

## 5. معنى العمى

`BLIND` يعني عزل Priors الوثائقية والجلسية. لا يعني محو المعرفة البارامترية للنموذج.

للتشغيل الأعمى الحقيقي استخدم حزمة `lisan-blind-lab` المنفصلة. إذا كانت Priors متاحة، أخرج:

`BLIND_ISOLATION_NOT_VERIFIED`.

## 6. دورة التحليل

### المرحلة 0 — Preflight

- ثبّت target، methodology/skill versions، Profile، source manifest.
- املأ `templates/quran/10-blind-run-manifest.md`.
- شغل schema validator عند توفره.

### المرحلة 1 — Corpus وملفات المواضع

- اجمع كل المشتقات المرشحة.
- افصل:
  - `INDEX COVERAGE`
  - `DEEP ANALYSIS COVERAGE`
  - `CONTEXT DIVERSITY COVERAGE`
  - `STRUCTURAL STABILITY`
- للجذر المحدود افحص الجميع عميقًا.
- للجذر الواسع أنشئ فهرسًا كاملًا وعينة عميقة >=10 تغطي كل الصيغ والتراكيب والعناقيد والمقاومات، ثم توسع حسب كسب المعلومات.
- كل ملف موضع يحتوي Observation/Constraint/Structural Alternatives/Unknown فقط، بلا Root Core جاهز.

### المرحلة 2 — الاستبعاد والفرضيات

- أنشئ `SEMANTIC EXCLUSION LEDGER`.
- ولّد فرضيتين إيجابيتين متنافستين على الأقل + `C0` عندما تسمح الأدلة.
- لكل فرضية: REQUIRED، تنبؤ، أصعب موضع، شرط دحض، جيران محتملون.

### المرحلة 3 — الدحض الخصومي

استخدم Prompt المرحلة الثانية في سياق مستقل قدر الإمكان. للادعاءات عالية الأثر لا تمنح قفلًا قويًا بلا مراجعة خصومية مستقلة.

صنف كل اختبار:

`SUPPORTS | COMPATIBLE | INDETERMINATE | CONTRADICTS`.

لا تنقذ التناقض بمجاز أو استثناء غير موثق.

### المرحلة 4 — التفكيك الطبقي

```text
ROOT CORE
+ STEM FORM
+ ASPECT / VIEW
+ VOICE
+ MOOD
+ NOMINALIZATION / PARTICIPLE
+ PARTICLE / CONSTRUCTION
+ ARGUMENT SEMANTICS
+ CONTEXT
= LOCAL MEANING
```

- الإثبات البنيوي لا يثبت دلالة العامل.
- لا تدمج مكدس العوامل في Gloss واحد.
- إذا كان الأساس غير موثق، لا تخترع معناه.
- إذا كانت النواة سلبية محضة، ابحث عن البقية الإيجابية.

### المرحلة 5 — الحدود والتفريد

أنتج:

- REQUIRED
- PERMITTED
- EXCLUDED
- UNKNOWN
- Decisive Contexts
- Structurally Sensitive Contexts
- Nearest Lexemes
- Semantic Residue
- Counterfactual Substitution
- Falsification/Reopen Condition

إذا بقي التعريف مطابقًا لجار قرآني، يكون القفل `LOCK_BLOCKED` أو تضيق الدعوى.

### المرحلة 6 — أهلية القفل

املأ `templates/quran/13-lock-eligibility-report.md` وشغل `scripts/validate_run_artifacts.py` عند توفره.

لا يصدر `LOCK_INTERNAL_RESULT` بالقناعة وحدها.

### المرحلة 7 — بعد القفل والتدقيق

- المقارنة مع Priors المشروع تحدث بعد القفل فقط.
- لا تعديل صامت؛ Revision جديد.
- Methodology Audit مشروع أيضًا للتشغيلات `LOCK_BLOCKED`، مع بقاء Priors مغلقة.
- كل Failure متكرر يقيّم للتحويل إلى Rule/Refinement/Regression.

## 7. حالات صادقة

- `UNKNOWN`
- `CANDIDATE_HYPOTHESIS`
- `QURAN_TESTED`
- `C0_PREFERRED`
- `STRUCTURAL_INSTABILITY`
- `ROOT_ASSIGNMENT_UNCERTAIN`
- `LOCK_CANDIDATE`
- `LOCK_BLOCKED`
- `LOCK_INTERNAL_RESULT`
- `HUMAN_REVIEW_REQUIRED`

## 8. مستويات المخرجات

- `FULL_LAYERED_REPORT`: للاكتشاف والقفل والاعتماد.
- `CONTROLLED_CONCISE_SUMMARY`: ملخص schema-driven لا يخفي UNKNOWN أو EXCLUDED أو التغطية أو القفل.
- `STATUS_ONLY`: حالة التشغيل والبوابات فقط.

العربية الفصحى لغة العرض الأساسية، وتترجم القواعد الإنجليزية عند أول ذكر.

## 9. السجلات

- Semantic Definition Registry داخل `references/quran/priors/` في حزمة Project Hub فقط.
- Rule Registry الموسع في `rules/06-quranic-semantic-constitution-v4.md`.
- السجل الآلي في `rules/RULE_REGISTRY_V4.json`.
- حالات القواعد في `rules/runtime/RULE_STATUS_LEDGER_V4.md`.

## 10. أدوات التحقق

```text
python scripts/qac_morphology_query.py --verify
python scripts/validate_rule_consistency.py
python scripts/validate_operator_reference.py
python scripts/validate_run_artifacts.py --manifest <json> --lock-report <json>
python scripts/validate_package.py
```

إذا تعذر Validator أو Artifact لازم، لا تدع مستوى تحقق أعلى مما ثبت.
