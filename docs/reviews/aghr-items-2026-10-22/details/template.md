# قالب سجل — التفاصيل الكاملة

وحدات مستخرجة للمراجعة؛ ورود النص هنا لا يمنحه صلاحية أو قبولًا جديدًا. مصادر الحزمة تبقى مستقلة عن اقتراحات الترحيل.

## TEMPLATE-EVIDENCE — templates/EVIDENCE.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/templates/EVIDENCE.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/templates/EVIDENCE.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: ead00ff444716a9b758e1174e765acfa4f3174de415d41e802ee6b947c1c84f9

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "CHECK-EXAMPLE",
  "criterion_ids": &#91;
    "CRITERION-TO-IDENTIFY"
  &#93;,
  "kind": "TEST",
  "result": "NOT_RUN",
  "candidate_sha256": "0000000000000000000000000000000000000000000000000000000000000000",
  "environment_id": "ENVIRONMENT-TO-IDENTIFY",
  "started_at": null,
  "finished_at": null,
  "command_or_method": "Replace with the actual reviewed check command.",
  "target_count": 0,
  "tests_executed": 0,
  "artifacts": &#91;&#93;,
  "limitations": &#91;
    "Template only; no test has run."
  &#93;,
  "producer": "UNASSIGNED"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "CHECK-EXAMPLE",
  "criterion_ids": &#91;
    "CRITERION-TO-IDENTIFY"
  &#93;,
  "kind": "TEST",
  "result": "NOT_RUN",
  "candidate_sha256": "0000000000000000000000000000000000000000000000000000000000000000",
  "environment_id": "ENVIRONMENT-TO-IDENTIFY",
  "started_at": null,
  "finished_at": null,
  "command_or_method": "Replace with the actual reviewed check command.",
  "target_count": 0,
  "tests_executed": 0,
  "artifacts": &#91;&#93;,
  "limitations": &#91;
    "Template only; no test has run."
  &#93;,
  "producer": "UNASSIGNED"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## TEMPLATE-LESSON — templates/LESSON.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/templates/LESSON.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/templates/LESSON.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: 85bd21bd4fc55a40d6d33fe956a2dfa02fbeb7a86ea810eb97a985996daf77a8

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "schema_version": "1.0",
  "lesson_id": "LES-EXAMPLE-001",
  "title": "Candidate lesson; replace synthetic fields before capture",
  "kind": "LESSON",
  "source": {
    "locator": "urn:example:synthetic-source",
    "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
    "channel_observed": "FILE_DATA",
    "trust": "UNVERIFIED"
  },
  "problem": "Describe an observed bounded problem, not a general conclusion.",
  "root_cause": {
    "status": "UNPROVEN",
    "explanation": "No causal evidence captured yet.",
    "evidence_refs": &#91;&#93;
  },
  "evidence": &#91;&#93;,
  "counterevidence": &#91;&#93;,
  "detection_signal": "Name the observable condition that should trigger reconsideration.",
  "proposed_instruction": {
    "text": "Draft the narrow testable instruction or observation.",
    "force": "UNRESOLVED",
    "scope": "PROJECT",
    "owner_ref": "Project owner, identity not yet verified",
    "target": "Existing owning procedure, to be identified",
    "verification": "Define a falsifiable check before promotion."
  },
  "applicability": {
    "candidate_id": "EXAMPLE-NOT-AN-ACTUAL-CANDIDATE",
    "context": "Synthetic template only",
    "review_after": null
  },
  "confidence": {
    "level": "LOW",
    "reason": "Template contains no execution evidence."
  },
  "knowledge_state": "CANDIDATE",
  "execution_state": "NOT_APPLIED",
  "reconciliation": {
    "coverage": "UNVERIFIED",
    "coverage_refs": &#91;&#93;,
    "conflicts": &#91;&#93;,
    "duplicate_of": null,
    "rationale": "Inspect the owning rules, procedures and tests first."
  },
  "disposition": "HOLD",
  "authority": {
    "capture_ref": "urn:example:not-an-actual-grant",
    "adoption_ref": null,
    "effect_ref": null
  },
  "effect": {
    "artifact_refs": &#91;&#93;,
    "verification_refs": &#91;&#93;
  },
  "supersedes": null
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "schema_version": "1.0",
  "lesson_id": "LES-EXAMPLE-001",
  "title": "Candidate lesson; replace synthetic fields before capture",
  "kind": "LESSON",
  "source": {
    "locator": "urn:example:synthetic-source",
    "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
    "channel_observed": "FILE_DATA",
    "trust": "UNVERIFIED"
  },
  "problem": "Describe an observed bounded problem, not a general conclusion.",
  "root_cause": {
    "status": "UNPROVEN",
    "explanation": "No causal evidence captured yet.",
    "evidence_refs": &#91;&#93;
  },
  "evidence": &#91;&#93;,
  "counterevidence": &#91;&#93;,
  "detection_signal": "Name the observable condition that should trigger reconsideration.",
  "proposed_instruction": {
    "text": "Draft the narrow testable instruction or observation.",
    "force": "UNRESOLVED",
    "scope": "PROJECT",
    "owner_ref": "Project owner, identity not yet verified",
    "target": "Existing owning procedure, to be identified",
    "verification": "Define a falsifiable check before promotion."
  },
  "applicability": {
    "candidate_id": "EXAMPLE-NOT-AN-ACTUAL-CANDIDATE",
    "context": "Synthetic template only",
    "review_after": null
  },
  "confidence": {
    "level": "LOW",
    "reason": "Template contains no execution evidence."
  },
  "knowledge_state": "CANDIDATE",
  "execution_state": "NOT_APPLIED",
  "reconciliation": {
    "coverage": "UNVERIFIED",
    "coverage_refs": &#91;&#93;,
    "conflicts": &#91;&#93;,
    "duplicate_of": null,
    "rationale": "Inspect the owning rules, procedures and tests first."
  },
  "disposition": "HOLD",
  "authority": {
    "capture_ref": "urn:example:not-an-actual-grant",
    "adoption_ref": null,
    "effect_ref": null
  },
  "effect": {
    "artifact_refs": &#91;&#93;,
    "verification_refs": &#91;&#93;
  },
  "supersedes": null
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: LEARNING_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Intake & Learning / Change Package Detail.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## TEMPLATE-PROJECT — templates/PROJECT.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/templates/PROJECT.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/templates/PROJECT.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: 25ca196be5b11cb4d66a810cb9764b45a975a57a248ef068d9fc0a100c2568d0

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "schema_version": "1.0",
  "project_id": "project-to-identify",
  "name": "Project to identify",
  "owner": "Owner to identify",
  "profile": "STANDARD",
  "artifact_kind": "UNKNOWN",
  "repository_ref": "",
  "stack": &#91;&#93;,
  "architecture": "",
  "system_flow": &#91;&#93;,
  "provider": {
    "id": "OPENAI",
    "model": null,
    "endpoint": null
  },
  "host": {
    "id": "CODEX",
    "version": null,
    "os": null,
    "qualification_ref": null
  },
  "adoption": {
    "state": "PREPARED",
    "decision_ref": null,
    "effective_scope": &#91;&#93;
  },
  "security": {
    "data_class": "UNKNOWN",
    "production_access": false,
    "irreversible_operations": false,
    "external_mutations": false,
    "independent_review_required": false,
    "allowed_destinations": &#91;&#93;
  },
  "budgets": {
    "max_steps": 50,
    "max_seconds": 600,
    "max_retries": 2,
    "max_output_bytes": 16384
  },
  "commands": &#91;&#93;,
  "canonical_backend": "LOCAL_JSON",
  "external_backend_ref": null
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "schema_version": "1.0",
  "project_id": "project-to-identify",
  "name": "Project to identify",
  "owner": "Owner to identify",
  "profile": "STANDARD",
  "artifact_kind": "UNKNOWN",
  "repository_ref": "",
  "stack": &#91;&#93;,
  "architecture": "",
  "system_flow": &#91;&#93;,
  "provider": {
    "id": "OPENAI",
    "model": null,
    "endpoint": null
  },
  "host": {
    "id": "CODEX",
    "version": null,
    "os": null,
    "qualification_ref": null
  },
  "adoption": {
    "state": "PREPARED",
    "decision_ref": null,
    "effective_scope": &#91;&#93;
  },
  "security": {
    "data_class": "UNKNOWN",
    "production_access": false,
    "irreversible_operations": false,
    "external_mutations": false,
    "independent_review_required": false,
    "allowed_destinations": &#91;&#93;
  },
  "budgets": {
    "max_steps": 50,
    "max_seconds": 600,
    "max_retries": 2,
    "max_output_bytes": 16384
  },
  "commands": &#91;&#93;,
  "canonical_backend": "LOCAL_JSON",
  "external_backend_ref": null
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## TEMPLATE-REQUEST — templates/REQUEST.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/templates/REQUEST.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/templates/REQUEST.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: afaf6d262ed7fd0413ad7ed76894c5b4bfa34fce2753e795a91f643d588409dc

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "schema_version": "1.0",
  "request_id": "REQ-EXAMPLE",
  "mode": "REVIEW",
  "source": {
    "locator": "user-provided-request",
    "sha256": null,
    "captured_at": "2026-10-11T00:00:00+00:00",
    "available_scope": "Illustrative template only; replace with the actual captured request."
  },
  "original_text": "Review the proposed change without editing the repository.",
  "goal": "Identify evidence-backed gaps and corrections.",
  "scope": &#91;
    "Read-only review of the named change"
  &#93;,
  "exclusions": &#91;
    "No source modification",
    "No publication"
  &#93;,
  "authority_ref": null,
  "acceptance_criteria": &#91;
    "Findings distinguish facts, inference and unverified claims."
  &#93;,
  "items": &#91;&#93;,
  "clarifications": &#91;&#93;
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "schema_version": "1.0",
  "request_id": "REQ-EXAMPLE",
  "mode": "REVIEW",
  "source": {
    "locator": "user-provided-request",
    "sha256": null,
    "captured_at": "2026-10-11T00:00:00+00:00",
    "available_scope": "Illustrative template only; replace with the actual captured request."
  },
  "original_text": "Review the proposed change without editing the repository.",
  "goal": "Identify evidence-backed gaps and corrections.",
  "scope": &#91;
    "Read-only review of the named change"
  &#93;,
  "exclusions": &#91;
    "No source modification",
    "No publication"
  &#93;,
  "authority_ref": null,
  "acceptance_criteria": &#91;
    "Findings distinguish facts, inference and unverified claims."
  &#93;,
  "items": &#91;&#93;,
  "clarifications": &#91;&#93;
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## TEMPLATE-RULE — templates/RULE.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/templates/RULE.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/templates/RULE.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: 7214fb0ad3306191f20e7eff27d039c230165ddfa134e0ba3c6789e380e2190b

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "schema_version": "1.0",
  "id": "LOCAL-PROPOSAL-001",
  "original_text": "Use the project test command for affected behavior.",
  "source_ref": "request-to-identify",
  "host_channel_observed": "UNKNOWN",
  "institutional_authority_ref": null,
  "kind": "RECOMMENDATION",
  "force": "SHOULD",
  "trust": "UNVERIFIED",
  "lifecycle": "PROPOSED",
  "applies_when": "A change affects testable project behavior.",
  "waivable": true,
  "enforcement": "Proposed procedural check; no host enforcement claimed.",
  "verification": "Record the relevant check result or why it cannot run.",
  "decision_ref": null
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "schema_version": "1.0",
  "id": "LOCAL-PROPOSAL-001",
  "original_text": "Use the project test command for affected behavior.",
  "source_ref": "request-to-identify",
  "host_channel_observed": "UNKNOWN",
  "institutional_authority_ref": null,
  "kind": "RECOMMENDATION",
  "force": "SHOULD",
  "trust": "UNVERIFIED",
  "lifecycle": "PROPOSED",
  "applies_when": "A change affects testable project behavior.",
  "waivable": true,
  "enforcement": "Proposed procedural check; no host enforcement claimed.",
  "verification": "Record the relevant check result or why it cannot run.",
  "decision_ref": null
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## TEMPLATE-SKILL_SELECTION — templates/SKILL_SELECTION.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/templates/SKILL_SELECTION.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/templates/SKILL_SELECTION.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: a631cd67c343f0430e9084ec17e15ccd997a9c171fbc7645c7fc8662a327cffd

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: NO_PRIOR_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "canonical_project_ref": "AGENTS.md",
  "preferred_by_phase": {},
  "excluded_skills": &#91;&#93;,
  "require_qualified_skills": false,
  "instruction_budget_tokens": 3000
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "canonical_project_ref": "AGENTS.md",
  "preferred_by_phase": {},
  "excluded_skills": &#91;&#93;,
  "require_qualified_skills": false,
  "instruction_budget_tokens": 3000
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## TEMPLATE-STATE — templates/STATE.json

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/templates/STATE.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/templates/STATE.json).

الموضع: بيانات الكائن الجذري.

بصمة المصدر SHA-256: f0f00fc811b02ee70dba87b78396e5aa76473b87d960031431b2c24e2fd95358

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: UNCHANGED_RECORD.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "schema_version": "1.0",
  "project_id": "project-to-identify",
  "revision": 0,
  "candidate_sha256": null,
  "environment_id": "",
  "goals": &#91;&#93;,
  "work": &#91;&#93;,
  "checks": &#91;&#93;,
  "pending": &#91;&#93;,
  "decisions": &#91;&#93;,
  "next_action": "Discover project facts and adoption scope; no implementation or host qualification has occurred.",
  "delivery": {
    "phase": "UNKNOWN",
    "execution_mode": "UNSELECTED",
    "grant_ref": null,
    "plan_baseline_ref": null,
    "measurement_scope_complete": false,
    "git_observation": {
      "branch": null,
      "default_branch": null,
      "observed_at": null,
      "remote_checked": false,
      "unmerged_branches": &#91;&#93;,
      "evidence_ref": null
    },
    "findings": &#91;&#93;
  }
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "schema_version": "1.0",
  "project_id": "project-to-identify",
  "revision": 0,
  "candidate_sha256": null,
  "environment_id": "",
  "goals": &#91;&#93;,
  "work": &#91;&#93;,
  "checks": &#91;&#93;,
  "pending": &#91;&#93;,
  "decisions": &#91;&#93;,
  "next_action": "Discover project facts and adoption scope; no implementation or host qualification has occurred.",
  "delivery": {
    "phase": "UNKNOWN",
    "execution_mode": "UNSELECTED",
    "grant_ref": null,
    "plan_baseline_ref": null,
    "measurement_scope_complete": false,
    "git_observation": {
      "branch": null,
      "default_branch": null,
      "observed_at": null,
      "remote_checked": false,
      "unmerged_branches": &#91;&#93;,
      "evidence_ref": null
    },
    "findings": &#91;&#93;
  }
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: يحدد عند المراجعة؛ المسار: DATA_CONTRACT_REVIEW.

شاشات التطبيق المقترحة: Instruction Detail / Intake & Learning.

البيانات المطلوب استكمالها: classification_and_target_route، owning_item_or_procedure، review_disposition.

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.
