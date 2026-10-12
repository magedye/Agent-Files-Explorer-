# سجل تجميد تنبؤ العينة المحجوبة

```yaml
holdout_prediction:
  run_id: ""
  hypothesis_id: ""
  hypothesis_version: ""
  holdout_id: ""
  holdout_type: "OCCURRENCE | DERIVATIVE | FORM | CONSTRUCTION | OTHER"
  hidden_material_description_without_content: ""
  prediction_created_at: ""
  prediction_sha256: ""
  predicted_features: []
  prohibited_outcomes_if_hypothesis_is_true: []
  success_criteria: []
  failure_impact: "DOWNGRADE | REVISE | REJECT"
  prediction_frozen: true
```

بعد الكشف:

```yaml
holdout_result:
  revealed_at: ""
  observed_features: []
  outcome: "PASS | PARTIAL | FAIL | INVALID_HOLDOUT"
  effect_on_hypothesis: ""
  revision_required: false
  revision_id: ""
```

لا تعدل التنبؤ بعد الكشف. تستخدم البصمة لإثبات ثبات النص المجمد، دون الحاجة إلى Hash Chain معقدة.
