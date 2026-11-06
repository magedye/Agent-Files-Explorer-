# Example 01 — Output format vs factual accuracy (R0/R1)

## Input

> «يجب أن يلخص الوكيل سياسة الإرجاع في ثلاث نقاط فقط عند سؤال العميل عنها.»

## Classification

- Primary: format requirement; there may be a **separate** factual-grounding obligation, but the quoted text alone does not say so.
- Risk: R0/R1 depending on underlying read access; do not invent data classification.
- Authority: `NOT_VERIFIED`.

## Minimal revision (meaning-preserving)

> «عند سؤال العميل عن سياسة الإرجاع، يجب أن يتضمن الرد الملخص ثلاثة بنود نقطية بالضبط.»

`EDITORIAL/CLARIFYING` (the word "الملخص" preserves target). No new source requirement.

## Separate engineered proposal (substantive addition)

> «عند سؤال العميل عن سياسة الإرجاع، يُنتج الوكيل ثلاثة بنود نقطية بالضبط. ويجب أن تُستمد المعلومات من نسخة سياسة الإرجاع السارية والمعتمدة، وأن يذكر تعذّر الوصول إليها بدل اختلاق أحكام.»

**Owner decision required:** this adds a new mandatory sourcing/fallback obligation, which must not be silently merged into the minimal revision.

## Control and proof

- Format: output validator counts **top-level** bullets; deterministic (define Markdown parsing rules).
- Factual support: reference-grounded check; hybrid evaluator calibrated against human-reviewed examples.
- `TC-01`: three bullet items -> PASS in format oracle, `NOT_RUN` execution.
- `TC-02`: four bullet items -> FAIL in format oracle, `NOT_RUN` execution.
- `TC-03`: three bullet items containing invented policy -> format passes, grounding fails, `NOT_RUN` execution.

**Decision:** `EDIT_NON_SUBSTANTIVE`, optionally `PROPOSE_SUBSTANTIVE_CHANGE` in a separate owner choice. Never use LLM judgment to count bullets when a parser suffices.
