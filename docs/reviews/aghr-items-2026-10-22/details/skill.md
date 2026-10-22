# مهارة اختيارية — التفاصيل الكاملة

وحدات مستخرجة للمراجعة؛ ورود النص هنا لا يمنحه صلاحية أو قبولًا جديدًا. مصادر الحزمة تبقى مستقلة عن اقتراحات الترحيل.

## SKILL-agent-tool-security — agent-tool-security

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/0.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "tool_security",
      "mcp_tool",
      "credential_exposure",
      "permission_audit",
      "tool_vetting",
      "tool_qualification"
    &#93;,
    "after": &#91;
      "tool_security",
      "mcp_tool",
      "credential_exposure",
      "permission_audit",
      "tool_vetting",
      "tool_qualification",
      "أمن الأدوات",
      "أمن أدوات",
      "حماية الأسرار",
      "مراجعة صلاحيات الأدوات"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "tool_security"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "agent-tool-security",
  "path": "optional_skills/agent-tool-security/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "00fb742a08b84a0f260e94533145ca198d3b09b89d141a356d7e82f2c690d77b",
  "triggers": &#91;
    "tool_security",
    "mcp_tool",
    "credential_exposure",
    "permission_audit",
    "tool_vetting",
    "tool_qualification",
    "أمن الأدوات",
    "أمن أدوات",
    "حماية الأسرار",
    "مراجعة صلاحيات الأدوات"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "security_assessment",
    "tool_boundaries_report"
  &#93;,
  "capabilities": &#91;
    "tool_security"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "agent-tool-security",
  "path": "optional_skills/agent-tool-security/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "00fb742a08b84a0f260e94533145ca198d3b09b89d141a356d7e82f2c690d77b",
  "triggers": &#91;
    "tool_security",
    "mcp_tool",
    "credential_exposure",
    "permission_audit",
    "tool_vetting",
    "tool_qualification",
    "أمن الأدوات",
    "أمن أدوات",
    "حماية الأسرار",
    "مراجعة صلاحيات الأدوات"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "security_assessment",
    "tool_boundaries_report"
  &#93;,
  "capabilities": &#91;
    "tool_security"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-architecture-options — architecture-options

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/1.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "architecture_design",
      "pattern_choice",
      "tradeoff_analysis",
      "system_structure",
      "structural_decision"
    &#93;,
    "after": &#91;
      "architecture_design",
      "pattern_choice",
      "tradeoff_analysis",
      "system_structure",
      "structural_decision",
      "تصميم معماري",
      "بدائل معمارية",
      "معمارية النظام"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "architecture"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "architecture-options",
  "path": "optional_skills/architecture-options/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "579f4573936ffa650aa4457a06670a00b4b2101adf6e45fe7a6ed2425c5d6704",
  "triggers": &#91;
    "architecture_design",
    "pattern_choice",
    "tradeoff_analysis",
    "system_structure",
    "structural_decision",
    "تصميم معماري",
    "بدائل معمارية",
    "معمارية النظام"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "architecture_options_analysis",
    "tradeoff_matrix"
  &#93;,
  "capabilities": &#91;
    "architecture"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "architecture-options",
  "path": "optional_skills/architecture-options/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "579f4573936ffa650aa4457a06670a00b4b2101adf6e45fe7a6ed2425c5d6704",
  "triggers": &#91;
    "architecture_design",
    "pattern_choice",
    "tradeoff_analysis",
    "system_structure",
    "structural_decision",
    "تصميم معماري",
    "بدائل معمارية",
    "معمارية النظام"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "architecture_options_analysis",
    "tradeoff_matrix"
  &#93;,
  "capabilities": &#91;
    "architecture"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-incremental-change — incremental-change

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/2.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "incremental_refactor",
      "stepwise_implementation",
      "slice_execution",
      "migration_steps",
      "surgical_change"
    &#93;,
    "after": &#91;
      "incremental_refactor",
      "stepwise_implementation",
      "slice_execution",
      "migration_steps",
      "surgical_change",
      "تنفيذ تدريجي",
      "تطوير ميزة",
      "إضافة ميزة",
      "تعديل برمجي"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "implementation"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "incremental-change",
  "path": "optional_skills/incremental-change/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "c681d722e01533a5e2be93b12a72f3ef9c0a6b5ef4512093250e073b027a5cc3",
  "triggers": &#91;
    "incremental_refactor",
    "stepwise_implementation",
    "slice_execution",
    "migration_steps",
    "surgical_change",
    "تنفيذ تدريجي",
    "تطوير ميزة",
    "إضافة ميزة",
    "تعديل برمجي"
  &#93;,
  "required_tools": &#91;
    "read_file",
    "write_file"
  &#93;,
  "permissions": &#91;
    "WORKSPACE_WRITE"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file",
      "write_file"
    &#93;
  },
  "output_criteria": &#91;
    "slice_plan",
    "verified_increment"
  &#93;,
  "capabilities": &#91;
    "implementation"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "incremental-change",
  "path": "optional_skills/incremental-change/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "c681d722e01533a5e2be93b12a72f3ef9c0a6b5ef4512093250e073b027a5cc3",
  "triggers": &#91;
    "incremental_refactor",
    "stepwise_implementation",
    "slice_execution",
    "migration_steps",
    "surgical_change",
    "تنفيذ تدريجي",
    "تطوير ميزة",
    "إضافة ميزة",
    "تعديل برمجي"
  &#93;,
  "required_tools": &#91;
    "read_file",
    "write_file"
  &#93;,
  "permissions": &#91;
    "WORKSPACE_WRITE"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file",
      "write_file"
    &#93;
  },
  "output_criteria": &#91;
    "slice_plan",
    "verified_increment"
  &#93;,
  "capabilities": &#91;
    "implementation"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-plan-drift-review — plan-drift-review

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/3.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "plan_drift",
      "scope_creep",
      "orphaned_tasks",
      "milestone_audit",
      "drift_analysis"
    &#93;,
    "after": &#91;
      "plan_drift",
      "scope_creep",
      "orphaned_tasks",
      "milestone_audit",
      "drift_analysis",
      "انحراف الخطة",
      "مراجعة الخطة",
      "تجاوز النطاق"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "plan_review"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "plan-drift-review",
  "path": "optional_skills/plan-drift-review/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "cf92548866c5300ef23982331d802071091f3560eee41bdcab5f14f4df803839",
  "triggers": &#91;
    "plan_drift",
    "scope_creep",
    "orphaned_tasks",
    "milestone_audit",
    "drift_analysis",
    "انحراف الخطة",
    "مراجعة الخطة",
    "تجاوز النطاق"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "drift_report",
    "reconciliation_actions"
  &#93;,
  "capabilities": &#91;
    "plan_review"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "plan-drift-review",
  "path": "optional_skills/plan-drift-review/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "cf92548866c5300ef23982331d802071091f3560eee41bdcab5f14f4df803839",
  "triggers": &#91;
    "plan_drift",
    "scope_creep",
    "orphaned_tasks",
    "milestone_audit",
    "drift_analysis",
    "انحراف الخطة",
    "مراجعة الخطة",
    "تجاوز النطاق"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "drift_report",
    "reconciliation_actions"
  &#93;,
  "capabilities": &#91;
    "plan_review"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-rag-data-quality — rag-data-quality

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/4.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "rag_evaluation",
      "context_retrieval_quality",
      "grounding_check",
      "chunking_audit",
      "retrieval_benchmark"
    &#93;,
    "after": &#91;
      "rag_evaluation",
      "context_retrieval_quality",
      "grounding_check",
      "chunking_audit",
      "retrieval_benchmark",
      "جودة الاسترجاع",
      "تقييم الاسترجاع",
      "جودة المصادر"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "retrieval_quality"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "rag-data-quality",
  "path": "optional_skills/rag-data-quality/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "134e4399e2b0cf7b9194cc04488981967a60159261050d89ba63614b062b586c",
  "triggers": &#91;
    "rag_evaluation",
    "context_retrieval_quality",
    "grounding_check",
    "chunking_audit",
    "retrieval_benchmark",
    "جودة الاسترجاع",
    "تقييم الاسترجاع",
    "جودة المصادر"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "rag_quality_scorecard",
    "grounding_findings"
  &#93;,
  "capabilities": &#91;
    "retrieval_quality"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "rag-data-quality",
  "path": "optional_skills/rag-data-quality/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "134e4399e2b0cf7b9194cc04488981967a60159261050d89ba63614b062b586c",
  "triggers": &#91;
    "rag_evaluation",
    "context_retrieval_quality",
    "grounding_check",
    "chunking_audit",
    "retrieval_benchmark",
    "جودة الاسترجاع",
    "تقييم الاسترجاع",
    "جودة المصادر"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "rag_quality_scorecard",
    "grounding_findings"
  &#93;,
  "capabilities": &#91;
    "retrieval_quality"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-requirements-traceability — requirements-traceability

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/5.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "requirements_trace",
      "criteria_mapping",
      "test_coverage_trace",
      "acceptance_verification",
      "traceability_audit"
    &#93;,
    "after": &#91;
      "requirements_trace",
      "criteria_mapping",
      "test_coverage_trace",
      "acceptance_verification",
      "traceability_audit",
      "تتبع المتطلبات",
      "معايير القبول",
      "مراجعة المتطلبات"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "requirements"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "requirements-traceability",
  "path": "optional_skills/requirements-traceability/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "deefcbe720798dabaac939915970c5118b02411e81700fbb824edf3d901b847f",
  "triggers": &#91;
    "requirements_trace",
    "criteria_mapping",
    "test_coverage_trace",
    "acceptance_verification",
    "traceability_audit",
    "تتبع المتطلبات",
    "معايير القبول",
    "مراجعة المتطلبات"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "traceability_matrix",
    "gap_identification"
  &#93;,
  "capabilities": &#91;
    "requirements"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "requirements-traceability",
  "path": "optional_skills/requirements-traceability/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "deefcbe720798dabaac939915970c5118b02411e81700fbb824edf3d901b847f",
  "triggers": &#91;
    "requirements_trace",
    "criteria_mapping",
    "test_coverage_trace",
    "acceptance_verification",
    "traceability_audit",
    "تتبع المتطلبات",
    "معايير القبول",
    "مراجعة المتطلبات"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "traceability_matrix",
    "gap_identification"
  &#93;,
  "capabilities": &#91;
    "requirements"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-risk-based-verification — risk-based-verification

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/6.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "risk_testing",
      "safety_gate_verification",
      "boundary_testing",
      "critical_path_test",
      "risk_verification"
    &#93;,
    "after": &#91;
      "risk_testing",
      "safety_gate_verification",
      "boundary_testing",
      "critical_path_test",
      "risk_verification",
      "تحقق حسب المخاطر",
      "اختبار الحدود",
      "اختبارات القبول"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "verification"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "risk-based-verification",
  "path": "optional_skills/risk-based-verification/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "35fd3382c2af95442ca41feb4f1a339d70bee87fc5e632076f0e5e7d79fb1115",
  "triggers": &#91;
    "risk_testing",
    "safety_gate_verification",
    "boundary_testing",
    "critical_path_test",
    "risk_verification",
    "تحقق حسب المخاطر",
    "اختبار الحدود",
    "اختبارات القبول"
  &#93;,
  "required_tools": &#91;
    "read_file",
    "run_test"
  &#93;,
  "permissions": &#91;
    "EXECUTE_TEST"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file",
      "run_test"
    &#93;
  },
  "output_criteria": &#91;
    "risk_test_matrix",
    "gate_verdict"
  &#93;,
  "capabilities": &#91;
    "verification"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "risk-based-verification",
  "path": "optional_skills/risk-based-verification/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "35fd3382c2af95442ca41feb4f1a339d70bee87fc5e632076f0e5e7d79fb1115",
  "triggers": &#91;
    "risk_testing",
    "safety_gate_verification",
    "boundary_testing",
    "critical_path_test",
    "risk_verification",
    "تحقق حسب المخاطر",
    "اختبار الحدود",
    "اختبارات القبول"
  &#93;,
  "required_tools": &#91;
    "read_file",
    "run_test"
  &#93;,
  "permissions": &#91;
    "EXECUTE_TEST"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file",
      "run_test"
    &#93;
  },
  "output_criteria": &#91;
    "risk_test_matrix",
    "gate_verdict"
  &#93;,
  "capabilities": &#91;
    "verification"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-root-cause-debugging — root-cause-debugging

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/7.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "root_cause_analysis",
      "diagnose_failure",
      "bug_investigation",
      "reproduce_error",
      "incident_diagnosis"
    &#93;,
    "after": &#91;
      "root_cause_analysis",
      "diagnose_failure",
      "bug_investigation",
      "reproduce_error",
      "incident_diagnosis",
      "تشخيص خطأ",
      "تصحيح عطل",
      "السبب الجذري",
      "اختبار فاشل"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "debugging"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "root-cause-debugging",
  "path": "optional_skills/root-cause-debugging/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "8b02b4494bc0738fdb7187fc4e01eaa5d1824c8410409328f4fbe3e20b998efc",
  "triggers": &#91;
    "root_cause_analysis",
    "diagnose_failure",
    "bug_investigation",
    "reproduce_error",
    "incident_diagnosis",
    "تشخيص خطأ",
    "تصحيح عطل",
    "السبب الجذري",
    "اختبار فاشل"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "root_cause_diagnosis",
    "targeted_fix_recommendation"
  &#93;,
  "capabilities": &#91;
    "debugging"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "root-cause-debugging",
  "path": "optional_skills/root-cause-debugging/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "8b02b4494bc0738fdb7187fc4e01eaa5d1824c8410409328f4fbe3e20b998efc",
  "triggers": &#91;
    "root_cause_analysis",
    "diagnose_failure",
    "bug_investigation",
    "reproduce_error",
    "incident_diagnosis",
    "تشخيص خطأ",
    "تصحيح عطل",
    "السبب الجذري",
    "اختبار فاشل"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "root_cause_diagnosis",
    "targeted_fix_recommendation"
  &#93;,
  "capabilities": &#91;
    "debugging"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-safe-git-closeout — safe-git-closeout

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/8.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "git_closeout",
      "working_tree_clean",
      "branch_handoff",
      "uncommitted_changes",
      "closeout_verification"
    &#93;,
    "after": &#91;
      "git_closeout",
      "working_tree_clean",
      "branch_handoff",
      "uncommitted_changes",
      "closeout_verification",
      "إغلاق الفرع",
      "تسليم المستودع",
      "حالة git"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "git_closeout"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "safe-git-closeout",
  "path": "optional_skills/safe-git-closeout/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "c7b7a3f0e909b838c407060ea4ed5f5f5c42fdead9ba50b5de2f7bb2a2c5c89d",
  "triggers": &#91;
    "git_closeout",
    "working_tree_clean",
    "branch_handoff",
    "uncommitted_changes",
    "closeout_verification",
    "إغلاق الفرع",
    "تسليم المستودع",
    "حالة git"
  &#93;,
  "required_tools": &#91;
    "read_file",
    "git_status"
  &#93;,
  "permissions": &#91;
    "READ_ONLY",
    "GIT_STATUS"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file",
      "git_status"
    &#93;
  },
  "output_criteria": &#91;
    "tree_status_report",
    "safe_closeout_summary"
  &#93;,
  "capabilities": &#91;
    "git_closeout"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "safe-git-closeout",
  "path": "optional_skills/safe-git-closeout/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "c7b7a3f0e909b838c407060ea4ed5f5f5c42fdead9ba50b5de2f7bb2a2c5c89d",
  "triggers": &#91;
    "git_closeout",
    "working_tree_clean",
    "branch_handoff",
    "uncommitted_changes",
    "closeout_verification",
    "إغلاق الفرع",
    "تسليم المستودع",
    "حالة git"
  &#93;,
  "required_tools": &#91;
    "read_file",
    "git_status"
  &#93;,
  "permissions": &#91;
    "READ_ONLY",
    "GIT_STATUS"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file",
      "git_status"
    &#93;
  },
  "output_criteria": &#91;
    "tree_status_report",
    "safe_closeout_summary"
  &#93;,
  "capabilities": &#91;
    "git_closeout"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-smart-clarification — smart-clarification

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/9.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "clarify_ambiguity",
      "intake_questions",
      "assumption_reconciliation",
      "safety_uncertainty",
      "ambiguous_requirement"
    &#93;,
    "after": &#91;
      "clarify_ambiguity",
      "intake_questions",
      "assumption_reconciliation",
      "safety_uncertainty",
      "ambiguous_requirement",
      "استيضاح المتطلبات",
      "طلب غير واضح",
      "تعارض المتطلبات"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "clarification"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "smart-clarification",
  "path": "optional_skills/smart-clarification/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "ee9adb3e5f2ec02dd5c80db7b750fbf4d857d88a39254c09ecce0eacab6693ae",
  "triggers": &#91;
    "clarify_ambiguity",
    "intake_questions",
    "assumption_reconciliation",
    "safety_uncertainty",
    "ambiguous_requirement",
    "استيضاح المتطلبات",
    "طلب غير واضح",
    "تعارض المتطلبات"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "clarification_matrix",
    "reversible_assumptions"
  &#93;,
  "capabilities": &#91;
    "clarification"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "smart-clarification",
  "path": "optional_skills/smart-clarification/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING",
  "version": "1.1.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "ee9adb3e5f2ec02dd5c80db7b750fbf4d857d88a39254c09ecce0eacab6693ae",
  "triggers": &#91;
    "clarify_ambiguity",
    "intake_questions",
    "assumption_reconciliation",
    "safety_uncertainty",
    "ambiguous_requirement",
    "استيضاح المتطلبات",
    "طلب غير واضح",
    "تعارض المتطلبات"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "clarification_matrix",
    "reversible_assumptions"
  &#93;,
  "capabilities": &#91;
    "clarification"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.

## SKILL-governed-learning — governed-learning

المصدر: [governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json](../../../../governance_packages/candidates/AGHR_Candidate_1.3.0/optional_skills/REGISTER.json).

الموضع: /skills/10.

بصمة المصدر SHA-256: 5590ff11329dfe1c4d752ad8dbf9316b70ad0d1c1bc74c05efca3245c5ff19b4

القوة المعلنة: غير محددة على مستوى هذا السجل؛ المقارنة: MODIFIED_RECORD.

الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):

<pre dir="auto">&#91;
  {
    "pointer": "/triggers",
    "before_present": true,
    "after_present": true,
    "before": &#91;
      "lesson_extraction",
      "lessons_learned",
      "learning_review",
      "retrospective",
      "classified_instructions",
      "استخراج الدروس",
      "الدروس المستفادة"
    &#93;,
    "after": &#91;
      "lesson_extraction",
      "lessons_learned",
      "learning_review",
      "retrospective",
      "classified_instructions",
      "استخراج الدروس",
      "الدروس المستفادة",
      "مراجعة درس",
      "دروس مستفادة"
    &#93;
  },
  {
    "pointer": "/capabilities",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": &#91;
      "learning"
    &#93;
  },
  {
    "pointer": "/source_kind",
    "before_present": false,
    "after_present": true,
    "before": null,
    "after": "PACKAGE"
  }
&#93;</pre>

ملف SKILL.md: UNCHANGED_INSTRUCTIONS. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.

القواعد المرتبطة: لم يصرح المصدر بربط مباشر. الربط سياقي، ولا يثبت التطابق الدلالي.

### النص الأصلي

<pre dir="auto">{
  "id": "governed-learning",
  "path": "optional_skills/governed-learning/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING_WITH_RECONCILED_EXTERNAL_IDEAS",
  "version": "1.2.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "a851238d2936e9fa17ec10c21b56ac36e10744e176fc5079aa55a19ba1b0b28b",
  "triggers": &#91;
    "lesson_extraction",
    "lessons_learned",
    "learning_review",
    "retrospective",
    "classified_instructions",
    "استخراج الدروس",
    "الدروس المستفادة",
    "مراجعة درس",
    "دروس مستفادة"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "lesson_review",
    "classified_dispositions"
  &#93;,
  "capabilities": &#91;
    "learning"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### بيانات السجل الأصلية كاملة

<pre dir="auto">{
  "id": "governed-learning",
  "path": "optional_skills/governed-learning/SKILL.md",
  "source": "ORIGINAL_PACKAGE_AUTHORING_WITH_RECONCILED_EXTERNAL_IDEAS",
  "version": "1.2.0",
  "auto_installed": false,
  "host_qualification": "NOT_RUN",
  "activation": "OWNER_SELECTION_AND_HOST_ADOPTION_REQUIRED",
  "sha256": "a851238d2936e9fa17ec10c21b56ac36e10744e176fc5079aa55a19ba1b0b28b",
  "triggers": &#91;
    "lesson_extraction",
    "lessons_learned",
    "learning_review",
    "retrospective",
    "classified_instructions",
    "استخراج الدروس",
    "الدروس المستفادة",
    "مراجعة درس",
    "دروس مستفادة"
  &#93;,
  "required_tools": &#91;
    "read_file"
  &#93;,
  "permissions": &#91;
    "READ_ONLY"
  &#93;,
  "conflicts_with": &#91;&#93;,
  "dependencies": {
    "min_tools": &#91;
      "read_file"
    &#93;
  },
  "output_criteria": &#91;
    "lesson_review",
    "classified_dispositions"
  &#93;,
  "capabilities": &#91;
    "learning"
  &#93;,
  "source_kind": "PACKAGE"
}</pre>

### استكمال المراجعة والترحيل

النوع المقترح: CAPABILITY؛ المسار: CAPABILITY_DRAFT.

شاشات التطبيق المقترحة: Capabilities & Hosts / Skill Detail / Meta-Governance.

البيانات المطلوب استكمالها: severity، scope، authority.level، authority.owner، authority.approvedBy، authority.effectiveFrom، rationale، verification.commands، verification.evalFixtures، enforcement.technical، enforcement.mergeEffect، enforcement.gate، impact.band، impact.evidence، reviewCadence، nextReview، force، skillQualification(host,version,scope,contentHash).

حالة المراجعة: PENDING_REVIEW. القرار: لم يحدد؛ السبب: لم يسجل. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.
