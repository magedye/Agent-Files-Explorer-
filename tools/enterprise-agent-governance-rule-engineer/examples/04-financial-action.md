# Example 04 — Money-transfer rule: schema != authorization

## Baseline

> «حوّل الأموال فقط إذا كان رمز الموافقة موجودًا.»

## Problems

- A **present token** is not necessarily genuine, unexpired, scoped or single-use.
- No user/resource/tenant/amount/currency binding.
- Replay and concurrent execution risk.
- No specified fallback if approval service unavailable.

## Conservative meaning-preserving edit

> «يُحظر إجراء تحويل مالي إذا لم يكن رمز الموافقة موجودًا.»

This preserves the **weak presence-only predicate** and should be labeled an insufficient R3 control. Do not pretend the minimal edit fixes the security defect.

## Engineered candidate requiring authorization

> «لا ينفذ تحويل مالي ما لم تتحقق بوابة تنفيذ مستقلة من هوية طالب التحويل والتفويض المعتمد المربوط بالمستفيد والمبلغ والعملة والنطاق والوقت، وتمنع إعادة التنفيذ ذريًا. عند غياب الدليل أو خطأ/تعطل التحقق: DENY.»

**Additional normative restrictions:** substantial security upgrade; owner must approve. Use precise monetary values, an independent identity service and backend idempotency; schema only checks shape. OPA/Rego or Cedar may evaluate access conditions but cannot by themselves guarantee bank settlement or atomic replay prevention.

## Minimum suggested tests

`TC-01` valid authorized transfer -> allowed candidate; `TC-02` missing approval -> denied; `TC-03` wrong amount -> denied; `TC-04` cross-tenant -> denied; `TC-05` stale approval -> denied; `TC-06` concurrent replay -> no duplicate; `TC-07` policy service down -> denied. All `NOT_RUN`.

**Decision:** `PROPOSE_SUBSTANTIVE_CHANGE`, P0 owner/security review and external validation required before any live activation.
