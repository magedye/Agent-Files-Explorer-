# قالب فرق اعتماد سجل التعريفات الدلالية — v1.2

**الاسم الإنجليزي المرجعي:** `SEMANTIC DEFINITION REGISTRY ADOPTION DIFF`  
يستخدم بعد `LOCK_INTERNAL_RESULT` وقبل مراجعة المالك.

```yaml
registry_diff:
  root_or_lexeme: ""
  run_id: ""
  current_registry_status: "NOT_PRESENT | NOT_STARTED | PROVISIONAL | AGREED | REGRESSION_BACKED | REOPENED"
  proposed_status: "BLIND_TESTED | PROVISIONAL | AGREED | REGRESSION_BACKED | UNRESOLVED"
  owner_approval_required: true

  locked_internal_result:
    root_core: ""
    REQUIRED: []
    PERMITTED: []
    EXCLUDED: []
    UNKNOWN: []
    decisive_contexts: []
    structurally_sensitive_contexts: []
    nearest_lexemes: []
    local_realizations: []
    falsification_condition: ""

  evidence:
    canonical_text_artifact_id: ""
    canonical_text_artifact_hash: ""
    occurrence_evidence_matrix_ref: ""
    semantic_exclusion_ledger_ref: ""
    total_occurrences: ""
    examined_occurrences: ""
    corpus_coverage: ""
    context_diversity_coverage: ""
    positive_core_confidence: ""
    negative_determination_confidence: ""
    structural_stability: ""
    lexical_differentiation_status: ""

  prior_comparison:
    status: "NOT_OPENED | MATCH | PARTIAL_MATCH | CONFLICT | NEW_DIMENSION | UNRESOLVED"
    notes: ""

  optional_interpretive_review:
    opened: false
    review_ref: null
    affects_confidence: false
    affects_adoption: false

  proposed_changes:
    root_core_changed: true | false
    boundary_changed: true | false
    exclusions_changed: true | false
    decisive_contexts_changed: true | false
    regressions_changed: true | false

  provenance:
    methodology_version: ""
    skill_version: ""
    blind_source_manifest_hash: ""
    lock_record: ""
    methodology_audit: ""

  reopen_condition: ""
  regression_tests: []
```

## قائمة تحقق الاعتماد

- [ ] يوجد `LOCK_INTERNAL_RESULT` صالح.
- [ ] لم تُعد كتابة اللقطة المقفلة بعد فتح Priors.
- [ ] ادعاءات اكتمال corpus مسنودة بمصفوفة أدلة.
- [ ] سجل الاستبعادات الدلالية موجود.
- [ ] الحساسية البنيوية ظاهرة.
- [ ] التفريد المعجمي كافٍ لنطاق التعريف المقترح.
- [ ] كل UNKNOWN ظاهر.
- [ ] المالك راجع الحالة المقترحة.
- [ ] اختبارات الانحدار صالحة.
- [ ] أي ملحق تفسيري/تاريخي بقي خارج الثقة والاعتماد.

## ملاحظة سلطوية

اعتماد السجل يتعلق بالنتيجة القرآنية الداخلية فقط. لا تُستخدم الآراء أو التفاسير أو أي سلطة موروثة دليلًا للاعتماد.
