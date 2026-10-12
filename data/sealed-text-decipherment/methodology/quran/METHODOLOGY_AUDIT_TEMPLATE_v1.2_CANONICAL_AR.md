# قالب تدقيق المنهج واستخراج القواعد — الإصدار 1.2

**الاسم الإنجليزي المرجعي:** `METHODOLOGY AUDIT & RULE EXTRACTION TEMPLATE`  
**وقت الاستخدام:** بعد `LOCK_INTERNAL_RESULT` صالح فقط.  
**الغرض:** استخراج قيمة منهجية قابلة لإعادة الاستخدام، لا إعادة اشتقاق المعنى.

> **قيمة المنهج أعلى من الجواب المحلي (`METHOD VALUE > LOCAL ANSWER`)**.

---

# 0. هوية التدقيق

```yaml
audit_id: ""
root_or_target: ""
blind_run_id: ""
blind_run_type: "LOW_FREQUENCY_ROOT | HIGH_FREQUENCY_ROOT | PHYSICAL_ABSTRACT | LEXICAL_COLLISION | MULTI_FORM | CONSTRUCTION | OTHER"
methodology_version: ""
skill_version: ""
canonical_profile: "HAFS_ASIM_MADINAH"
canonical_text_artifact_id: ""
started_at: ""
locked_at: ""
audited_at: ""
auditor: ""
```

## سلامة التشغيل

```yaml
methodology_version_pinned: true | false
blind_source_manifest_pinned: true | false
prior_isolation_verified: true | false
canonical_text_status: "VERIFIED | PROVISIONAL_USER_SUPPLIED | UNAVAILABLE"
corpus_claim_supported_by_evidence_matrix: true | false
lock_eligibility_passed: true | false
```

أي قيمة `false` أو `UNAVAILABLE` يجب تفسيرها قبل متابعة الاعتماد.

---

# 1. لقطة النتيجة المقفلة — بلا إعادة صياغة

```yaml
locked_result:
  root_core_candidate: ""
  status: ""
  semantic_boundary:
    REQUIRED: []
    PERMITTED: []
    EXCLUDED: []
    UNKNOWN: []
  positive_core_confidence: ""
  negative_determination_confidence: ""
  structural_stability: ""
  corpus_coverage: ""
  context_diversity_coverage: ""
  lexical_differentiation_status: ""
```

## أقوى السياقات

| السياق | حالته | كسب المعلومات | الثبات البنيوي | ما يثبته أو يستبعده |
|---|---|---|---|---|
| | | | | |

## أقوى نقطة غير محسومة

- المسألة:
- سبب عدم الحسم:
- شرط إعادة الفتح:

---

# 2. أنماط الفشل ونقاط الاحتكاك القابلة للرصد

لا تعِد بناء سلسلة التفكير الخفية. راجع فقط artifacts ظاهرة: فرضيات مرفوضة، Gate Reports، تعديلات، خلافات بنيوية، محاولات وصول محظورة، وانتقالات حالة.

```yaml
failure_event:
  event_id: ""
  stage: "BLIND_DISCOVERY | FALSIFICATION | SEMANTIC_BOUNDARY | LOCK"
  observed_failure_or_friction: ""
  evidence_artifact: ""
  impact: "LOW | MEDIUM | HIGH | CRITICAL"
  corrected_during_run: true | false
  correction_used: ""
  recurrence_risk: "LOW | MEDIUM | HIGH"
```

| ID | المرحلة | الفشل أو الاحتكاك المرصود | الأثر | القاعدة المفترض أن تمنعه | قاعدة ناقصة أم تطبيق ناقص؟ |
|---|---|---|---|---|---|
| | | | | | |

---

# 3. تدقيق فاعلية البوابات

صنف كل بوابة ذات صلة:

`EFFECTIVE | PARTIALLY_EFFECTIVE | NOT_TRIGGERED | TRIGGERED_TOO_LATE | AMBIGUOUS | MISSING_GATE`

| القاعدة/البوابة بالعربية (`English ID`) | الحالة | دليل التفعيل | أثرها | التغيير المطلوب |
|---|---|---|---|---|
| منع المعنى المسبق (`ZERO-PRIOR-MEANING`) | | | | |
| corpus أولًا (`CORPUS-FIRST GATE`) | | | | |
| الملاحظة لا تساوي التفسير | | | | |
| بوابة الدحض (`FALSIFICATION GATE`) | | | | |
| السياق الحاسم | | | | |
| الغموض البنيوي قبل الحسم | | | | |
| منع التجريد المفرط | | | | |
| تتبع النواة إلى المعنى الموضعي | | | | |
| طرح مساهمة التركيب | | | | |
| التفريد المعجمي | | | | |
| النفي الدلالي | | | | |
| إثبات ادعاء التغطية | | | | |
| الحذر من الأساس غير الموثق | | | | |
| البقية الإيجابية للنواة السلبية | | | | |
| أهلية القفل | | | | |

---

# 4. استخراج قاعدة مرشحة

دورة الحياة:

`OBSERVED → PROPOSED_RULE → AGREED → REGRESSION_BACKED`

```yaml
rule_candidate:
  proposed_rule_id: ""
  name: "ENGLISH RULE NAME"
  arabic_label: ""
  status: "PROPOSED_RULE"
  weight: "CONSTITUTIONAL/CRITICAL | HIGH | MEDIUM | SUPPORTING/HYPOTHESIS"
  description_ar: ""
  impact_ar: ""
  trigger_ar: ""
  failure_mode_prevented: ""
  provenance:
    root_or_target: ""
    context_or_artifact: ""
    run_id: ""
  related_rules: []
  examples: []
  regression_tests: []
  generalization_scope: ""
  evidence_needed_for_promotion: ""
```

## شروط الترقية

- [ ] المبدأ قبل المثال.
- [ ] التعميم لا يتجاوز الدليل.
- [ ] لا تعارض مع القواعد الدستورية.
- [ ] نمط الفشل قابل للرصد.
- [ ] اختبار انحدار محدد.
- [ ] أصل القاعدة محفوظ.
- [ ] الترجمة العربية والاسم الإنجليزي الثابت كلاهما موجودان.

---

# 5. تنقيح قاعدة قائمة

```yaml
rule_refinement:
  rule_id: ""
  current_text_or_behavior: ""
  observed_gap: ""
  proposed_refinement_ar: ""
  reason: ""
  compatibility_impact: "NONE | PATCH | MINOR | MAJOR"
  affected_regressions: []
  new_regressions_required: []
```

---

# 6. المقارنة بعد القفل

## 6.1 Priors المشروع

```yaml
prior_comparison:
  source: ""
  comparison: "MATCH | PARTIAL_MATCH | CONFLICT | NEW_DIMENSION | UNRESOLVED"
  overlapping_features: []
  new_features_in_blind_result: []
  unsupported_features_in_prior: []
  prior_features_not_recovered_blindly: []
  methodological_lesson: ""
```

## 6.2 المراجعة التفسيرية/التاريخية الاختيارية

إذا طلبها المالك، تستخدم `templates/quran/17-post-lock-interpretive-review.md`، ولا تدخل في الثقة أو الاعتماد.

- [ ] لم تُعد كتابة النتيجة المقفلة بعد المقارنة.
- [ ] أي تغيير صار Revision مستقلًا ذا provenance.

---

# 7. أثر الاختبار في هندسة المهارة

اختر:

`NO_METHOD_CHANGE | NEW_RULE | RULE_REFINEMENT | RULE_CONFLICT | NEW_REGRESSION | SCHEMA_CHANGE | WORKFLOW_CHANGE | SOURCE_FIREWALL_CHANGE | SKILL_PROMPT_CHANGE`

| التغيير | الملف المستهدف | السبب | نوع الزيادة في الإصدار | دليل الانحدار |
|---|---|---|---|---|
| | | | | |

---

# 8. قرار أهلية اعتماد التعريف

```yaml
registry_adoption:
  eligible_for_owner_review: true | false
  proposed_status: "BLIND_TESTED | PROVISIONAL | AGREED | REGRESSION_BACKED | UNRESOLVED"
  blockers: []
  semantic_definition_diff_ready: true | false
```

المدقق لا يمنح قبول المالك.

---

# 9. حزمة الانحدار

```yaml
regression_case:
  test_id: ""
  target_rule: ""
  must_pass_case: ""
  must_fail_case: ""
  expected_gate_behavior: ""
  expected_status: ""
```

يجب أن يعيد اختبار واحد على الأقل إنتاج الفشل الذي كشفه التشغيل.

---

# 10. الحكم النهائي

```yaml
methodology_audit_verdict:
  blind_run_validity: "VALID | VALID_WITH_LIMITATIONS | INVALID"
  reusable_method_value: "NONE | LOW | MEDIUM | HIGH | CRITICAL"
  new_rules_proposed: 0
  rules_refined: 0
  regressions_added: 0
  semantic_definition_ready_for_owner_review: true | false
  skill_release_recommended: "NO | AFTER_MORE_ROOTS | PATCH | MINOR | MAJOR"
  next_methodology_action: ""
```

## الخلاصة التنفيذية

- ماذا علمنا تحليل الجذر عن المنهج؟
- ما أخطر فشل مُنع أو اكتُشف؟
- ما أهم قاعدة قابلة لإعادة الاستخدام؟
- ما الذي يجب تغييره قبل التشغيل التالي؟
