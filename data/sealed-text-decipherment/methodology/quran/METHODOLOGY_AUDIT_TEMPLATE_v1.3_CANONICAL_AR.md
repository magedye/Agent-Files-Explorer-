# قالب تدقيق المنهج واستخراج القواعد — v1.3

يستخدم بعد تشغيل مكتمل سواء انتهى بقفل أو حجب أو امتناع.

```yaml
audit_id: ""
run_id: ""
target: ""
terminal_status: "LOCK_INTERNAL_RESULT | LOCK_BLOCKED | C0_PREFERRED | STRUCTURAL_INSTABILITY | INVALID_RUN"
methodology_version: "4.0"
skill_version: "3.4.0"
prior_comparison_opened: false
observable_failure_modes: []
effective_gates: []
late_or_missing_gates: []
rule_candidates: []
rule_refinements: []
regressions_required: []
registry_diff_eligible: false
next_action: ""
```

## الضوابط

- لا تعِد بناء سلسلة التفكير الخفية؛ راجع Artifacts فقط.
- لا تفتح Priors إلا إذا كان terminal_status هو `LOCK_INTERNAL_RESULT`.
- كل Rule Candidate يمر ببروتوكول التصفية والحوكمة.
- كل Failure تقني مقبول يحتاج Regression أو Validator عند الإمكان.
- المدقق لا يمنح Owner Acceptance.
