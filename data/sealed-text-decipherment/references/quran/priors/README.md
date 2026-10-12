# مواد مشروع سابقة محجوبة — Post-Lock Priors

كل ما في هذا المجلد نتيجة سابقة أو benchmark أو خارطة/سجل مشروع، وليس دليلاً pre-lock.

## قاعدة الوصول

- في Blind Run: `semantic_prior_access = DENIED` حتى `LOCK_INTERNAL_RESULT`.
- لا يستخدم prior لبناء occurrence profile أو hypothesis أو neighbor profile أو holdout.
- بعد القفل يجوز إجراء مقارنة تفاضلية مع priors المشروع فقط:
  `MATCH | PARTIAL_MATCH | CONFLICT | NEW_DIMENSION | UNRESOLVED`.
- لا تُعدل snapshot الداخلية صامتاً بعد المقارنة.
- `LOCK_INTERNAL_RESULT ≠ OWNER_ACCEPTANCE ≠ REGISTRY_ADOPTION`.

المعاجم والحديث والشعر والتفاسير والترجمات ليست priors مشروعة داخل خط التحقق الدلالي؛ إن طلب المالك دراسة تاريخية منفصلة، توسم خارج المسار ولا تصحح النتيجة القرآنية.
