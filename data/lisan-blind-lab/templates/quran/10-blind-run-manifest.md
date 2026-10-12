# بيان تشغيل المختبر الأعمى

```yaml
run_id: ""
target: ""
test_type: ""
methodology_version: "4.0"
skill_version: "3.4.0"
canonical_profile: "HAFS_ASIM_MADINAH"
canonical_text_artifact_id: ""
canonical_text_artifact_hash: null
canonical_text_status: "VERIFIED | PROVISIONAL_USER_SUPPLIED | UNAVAILABLE"
allowed_sources: []
blocked_sources: []
prior_access: "DENIED"
source_isolation_verdict: "READY_FOR_BLIND_RUN | BLIND_ISOLATION_NOT_VERIFIED | SOURCE_PROFILE_INCOMPLETE | CANONICAL_TEXT_ARTIFACT_UNAVAILABLE"
expected_corpus_policy: "ALL | FULL_INDEX_PLUS_DEEP_SAMPLE"
output_level: "FULL_LAYERED_REPORT | CONTROLLED_CONCISE_SUMMARY | STATUS_ONLY"
blindness_scope:
  documentary_isolation: "VERIFIED | NOT_VERIFIED"
  parametric_prior_risk: "PRESENT"
  claim: "DOCUMENTARY_AND_SESSION_ISOLATION_ONLY"
```

لا يوصف التشغيل بأنه Blind إذا لم يكن `documentary_isolation: VERIFIED`. ولا تدّعي هذه الحالة محو الذاكرة البارامترية.
