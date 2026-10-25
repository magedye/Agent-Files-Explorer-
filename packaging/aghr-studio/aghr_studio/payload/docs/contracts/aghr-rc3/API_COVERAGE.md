# تغطية عمليات API — contract.1

مولد من API_OPERATIONS.json. الأصل 58 عملية في Studio §§27–36 (57 HTTP و1 WS)، وإضافة واحدة من §37: submit. المجموع 59 تعريفًا (58 HTTP و1 WS). القناة WS ممثلة بترقية GET في OpenAPI، وليست عملية HTTP إضافية فوق الجرد.

هذه تغطية عقد، وليست دليل خادم يعمل. عدم وجود جسم يعني رفضه؛ لا endpoint لكتابة state أو الأدلة.

| الطريقة | المسار بعد /api/v1 | مصدر Studio | نوع الطلب | نوع data في الجواب/الرسالة | If-Match |
| --- | --- | --- | --- | --- | --- |
| GET | `/workspaces` | 27 | `no body` | `api.read.schema.json#/$defs/Workspaces` | — |
| POST | `/workspaces` | 27 | `api.read.schema.json#/$defs/WorkspaceCreate` | `api.read.schema.json#/$defs/Workspace` | — |
| DELETE | `/workspaces/{id}` | 27 | `no body` | `transport.schema.json#/$defs/RemovedRegistration` | — |
| POST | `/workspaces/{id}/scan` | 27 | `no body` | `api.read.schema.json#/$defs/Scan` | — |
| GET | `/workspaces/{id}/projects` | 27 | `no body` | `api.read.schema.json#/$defs/Projects` | — |
| POST | `/workspaces/{id}/projects` | 27 | `api.read.schema.json#/$defs/ProjectCreate` | `api.read.schema.json#/$defs/Project` | — |
| DELETE | `/workspaces/{id}/projects/{pid}` | 27 | `no body` | `transport.schema.json#/$defs/RemovedRegistration` | — |
| POST | `/workspaces/{id}/projects/{pid}/scan` | 27 | `no body` | `api.read.schema.json#/$defs/Scan` | — |
| GET | `/workspaces/{id}/projects/{pid}/config` | 27 | `no body` | `api.read.schema.json#/$defs/ProjectConfig` | — |
| GET | `/workspaces/{id}/instructions` | 28 | `no body` | `api.read.schema.json#/$defs/Items` | — |
| GET | `/workspaces/{id}/instructions/{item_id}` | 28 | `no body` | `api.read.schema.json#/$defs/ItemView` | — |
| GET | `/workspaces/{id}/instructions/{item_id}/relations` | 28 | `no body` | `api.read.schema.json#/$defs/Relations` | — |
| GET | `/workspaces/{id}/instructions/{item_id}/history` | 28 | `no body` | `api.read.schema.json#/$defs/History` | — |
| GET | `/workspaces/{id}/instructions/{item_id}/evals` | 28 | `no body` | `api.execution.schema.json#/$defs/VerificationRuns` | — |
| GET | `/workspaces/{id}/instructions/{item_id}/calibrations` | 28 | `no body` | `api.read.schema.json#/$defs/Calibrations` | — |
| GET | `/workspaces/{id}/capabilities` | 29 | `no body` | `api.read.schema.json#/$defs/Capabilities` | — |
| GET | `/workspaces/{id}/capabilities/{item_id}` | 29 | `no body` | `api.read.schema.json#/$defs/CapabilityView` | — |
| GET | `/workspaces/{id}/capabilities/{item_id}/qualification` | 29 | `no body` | `api.read.schema.json#/$defs/Qualifications` | — |
| GET | `/workspaces/{id}/capabilities/{item_id}/usage` | 29 | `no body` | `api.read.schema.json#/$defs/Usages` | — |
| GET | `/workspaces/{id}/capabilities/matrix` | 29 | `no body` | `api.read.schema.json#/$defs/Matrix` | — |
| POST | `/workspaces/{id}/generate/preview` | 30 | `api.execution.schema.json#/$defs/GeneratePreviewRequest` | `api.execution.schema.json#/$defs/Generation` | — |
| POST | `/workspaces/{id}/generate/export` | 30 | `api.execution.schema.json#/$defs/GenerateExportRequest` | `api.execution.schema.json#/$defs/GeneratedDownload` | generated_content_hash |
| POST | `/workspaces/{id}/verify/run` | 31 | `api.execution.schema.json#/$defs/VerifyRequest` | `api.execution.schema.json#/$defs/StartedRun` | — |
| GET | `/workspaces/{id}/verify/runs` | 31 | `no body` | `api.execution.schema.json#/$defs/VerificationRuns` | — |
| GET | `/workspaces/{id}/verify/runs/{run_id}` | 31 | `no body` | `api.execution.schema.json#/$defs/VerificationRun` | — |
| GET | `/workspaces/{id}/verify/runs/{run_id}/sarif` | 31 | `no body` | `api.execution.schema.json#/$defs/Sarif` | — |
| WS | `/workspaces/{id}/verify/runs/{run_id}/stream` | 31 | `no body` | `api.execution.schema.json#/$defs/StreamFrame` | — |
| POST | `/workspaces/{id}/verify/runs/{run_id}/cancel` | 31 | `no body` | `transport.schema.json#/$defs/Ack` | — |
| GET | `/workspaces/{id}/evidence/tasks` | 32 | `no body` | `api.read.schema.json#/$defs/EvidenceTasks` | — |
| GET | `/workspaces/{id}/evidence/tasks/{task_id}` | 32 | `no body` | `api.read.schema.json#/$defs/EvidenceDetail` | — |
| GET | `/workspaces/{id}/evidence/tasks/{task_id}/events` | 32 | `no body` | `api.read.schema.json#/$defs/EvidenceEvents` | — |
| POST | `/workspaces/{id}/evidence/tasks/{task_id}/submit-to-ci` | 32 | `no body` | `api.read.schema.json#/$defs/EvidenceSubmission` | evidence_source_hash |
| GET | `/workspaces/{id}/cps` | 33 | `no body` | `api.change.schema.json#/$defs/Packages` | — |
| POST | `/workspaces/{id}/cps` | 33 | `api.change.schema.json#/$defs/Create` | `api.change.schema.json#/$defs/Package` | — |
| GET | `/workspaces/{id}/cps/{cp_id}` | 33 | `no body` | `api.change.schema.json#/$defs/Package` | — |
| PATCH | `/workspaces/{id}/cps/{cp_id}` | 33 | `api.change.schema.json#/$defs/Edit` | `api.change.schema.json#/$defs/Package` | proposal_version_hash |
| POST | `/workspaces/{id}/cps/{cp_id}/validate` | 33 | `no body` | `api.change.schema.json#/$defs/Package` | proposal_version_hash |
| POST | `/workspaces/{id}/cps/{cp_id}/preview` | 33 | `no body` | `api.change.schema.json#/$defs/Preview` | proposal_version_hash |
| POST | `/workspaces/{id}/cps/{cp_id}/submit` | 37 (extension) | `no body` | `api.change.schema.json#/$defs/Package` | proposal_version_hash |
| POST | `/workspaces/{id}/cps/{cp_id}/approve` | 33 | `api.change.schema.json#/$defs/ApprovalRequest` | `api.change.schema.json#/$defs/Package` | proposal_version_hash |
| POST | `/workspaces/{id}/cps/{cp_id}/export` | 33 | `api.change.schema.json#/$defs/ExportRequest` | `api.change.schema.json#/$defs/Export` | proposal_version_hash |
| POST | `/workspaces/{id}/cps/{cp_id}/close` | 33 | `no body` | `api.change.schema.json#/$defs/Package` | proposal_version_hash |
| POST | `/workspaces/{id}/adoptions` | 34 | `api.change.schema.json#/$defs/AdoptionCreate` | `api.change.schema.json#/$defs/Adoption` | — |
| GET | `/workspaces/{id}/adoptions/{aid}` | 34 | `no body` | `api.change.schema.json#/$defs/Adoption` | — |
| POST | `/workspaces/{id}/adoptions/{aid}/preview` | 34 | `no body` | `api.change.schema.json#/$defs/Preview` | proposal_version_hash |
| POST | `/workspaces/{id}/adoptions/{aid}/apply` | 34 | `api.change.schema.json#/$defs/AdoptionApply` | `api.change.schema.json#/$defs/Export` | proposal_version_hash |
| GET | `/workspaces/{id}/adoptions/{aid}/diff` | 34 | `no body` | `api.change.schema.json#/$defs/Preview` | — |
| GET | `/workspaces/{id}/metrics/current` | 35 | `no body` | `api.read.schema.json#/$defs/Metrics` | — |
| GET | `/workspaces/{id}/metrics/history` | 35 | `no body` | `api.read.schema.json#/$defs/MetricsHistory` | — |
| POST | `/workspaces/{id}/metrics/snapshot` | 35 | `no body` | `api.read.schema.json#/$defs/Metrics` | — |
| GET | `/audit/events` | 35 | `no body` | `api.read.schema.json#/$defs/AuditEvents` | — |
| GET | `/audit/events/{id}` | 35 | `no body` | `api.read.schema.json#/$defs/AuditEvent` | — |
| GET | `/settings` | 36 | `no body` | `settings.schema.json` | — |
| PATCH | `/settings/roles` | 36 | `settings.schema.json#/$defs/RolesPatch` | `settings.schema.json` | — |
| PATCH | `/settings/git` | 36 | `settings.schema.json#/$defs/GitPatch` | `settings.schema.json` | — |
| PATCH | `/settings/limits` | 36 | `settings.schema.json#/$defs/LimitsPatch` | `settings.schema.json` | — |
| PATCH | `/settings/hosts` | 36 | `settings.schema.json#/$defs/HostsPatch` | `settings.schema.json` | — |
| PATCH | `/settings/security` | 36 | `settings.schema.json#/$defs/SecurityPatch` | `settings.schema.json` | — |
| POST | `/settings/test-signing` | 36 | `no body` | `settings.schema.json#/$defs/SigningResult` | — |
