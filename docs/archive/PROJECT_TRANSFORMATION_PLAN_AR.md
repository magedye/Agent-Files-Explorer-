# خطة تطوير Agent-Files-Explorer إلى منصة إدارة حوكمة الوكلاء AGHR

أوصي بتطوير المشروع الحالي تدريجيًا إلى منصة محلية باسم مقترح `AGHR Governance Studio`، مع الاحتفاظ بجميع قدراته الموجودة، وجعل حزمة `Agent Governance and Harness Reference (AGHR 1.0.0)` المرجعية الحاكمة الوحيدة للمنصة.

الهدف ليس بناء مستكشف أجمل للملفات، بل إنشاء نظام لإدارة دورة حياة الحوكمة وتبنيها وتحديثها والتحقق من تطبيقها على مشاريع البرمجة ووكلائها.

سأقدم خطة تنفيذية كاملة، ثم طلبًا جاهزًا لإرساله إلى الوكيل البرمجي داخل المسار:

`D:\APP\Skill-manager\Agent-Files-Explorer`

## 1. الحالة الحالية ونقطة الانطلاق

استنادًا إلى قائمة الملفات المحلية التي قدمتها، ومراجعة شفرة المستودع المقابل في GitHub سابقًا، نعرف أن المشروع يضم:

| المكون                                      | الحالة                                      | التصرف المقترح                                    |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| تطبيق React + Vite                          | موجود في النسخة التي فُحصت                  | الاحتفاظ به وتطويره                               |
| `src/`                                      | موجود محليًا                                | فحص مطابقته لنسخة GitHub قبل التعديل              |
| `vite.config.mjs`                           | يتضمن في النسخة المفحوصة API لقراءة الملفات | تأمين القراءة وفصل API عن تهيئة Vite              |
| واجهة Explorer                              | موجودة في النسخة المفحوصة                   | تحويلها إلى مستكشف حوكمة                          |
| `data/`                                     | موجود محليًا                                | فحص محتواه وتحديد وظيفته                          |
| `Agent_Governance_Harness_Reference_1.0.0/` | موجود محليًا                                | التحقق من سلامته واعتماده مرجعًا                  |
| وثيقة Skill Steward SACP                    | موجودة                                      | مصالحتها مع AGHR والاستفادة من وظائفها            |
| `node_modules/`                             | موجود                                       | لا يعاد تثبيته إلا لسبب تقني                      |
| `package.json`                              | موجود                                       | الحفاظ على التبعيات الحالية ما لم توجد حاجة مثبتة |

قيد مهم: لم أفحص محتويات المجلد المحلي بعد قائمة `ls` الأخيرة، لذلك يجب ألا يفترض الوكيل أن الشفرة المحلية مطابقة تمامًا للمستودع المنشور.

كما يجب ألا يبدأ التنفيذ بإعادة كتابة التطبيق أو تثبيت أطر جديدة قبل إثبات الحاجة إليها.

# 2. تعريف المنتج المستهدف

## AGHR Governance Studio

Local-first Agent Governance Management Platform

Reference Manager

المراجع والقواعد والإصدارات

Governance Explorer

الملفات والعلاقات والتدفقات

Intake & Changes

الطلبات والتصنيف والمصالحة

Project Adoption

تبني الحوكمة في المشاريع

Control & Authority

الضوابط والصلاحيات والانطباق

Evidence & Evaluation

التحقق والاختبارات والأدلة

### القدرات النهائية المطلوبة

| النظام                       | وظيفة النظام                                     | المخرج المتوقع                      |
| ---------------------------- | ------------------------------------------------ | ----------------------------------- |
| Reference Management         | إدارة واستعراض مرجعية AGHR وإصداراتها ومصادرها   | مرجع قابل للبحث والتتبع             |
| Rule Intelligence            | فهم القواعد وتصنيف السلطة والإلزام والانطباق     | Rule Register وفحوص التعارض         |
| Governance Explorer          | استكشاف المستندات والروابط والعلاقات             | مخططات علاقات وتدفقات قابلة للتفسير |
| Change Management            | استقبال أي طلب أو ملاحظة وتحويله إلى تغيير مقترح | ChangePacket وImpact Analysis       |
| Adoption Management          | تبني الحزمة في المشاريع الجديدة والقائمة         | Adoption Profile وخطة ومخرجات تحقق  |
| Runtime Configuration        | تعريف مضيف الوكيل والنموذج والأدوات وحدودها      | Runtime Contract                    |
| Compliance & Evaluation      | عرض مدى استيفاء الضوابط بالأدلة                  | نتائج مؤهلة بحسب نطاق التحقق        |
| Release & Version Management | إدارة المرشحات والنسخ وقرارات القبول             | Release Candidate وأدلة وإحالات     |

# 3. المعمارية التقنية المقترحة

أوصي بالاحتفاظ بواجهة React/Vite، وإضافة Backend محلي مستقل يستخدم أدوات AGHR الأصلية عبر واجهات واضحة.

لا أوصي حاليًا بإعادة كتابة محرك AGHR بلغة JavaScript؛ الأفضل الاستفادة من الأدوات الموجودة داخل الحزمة، بعد إثبات توافقها مع Windows.

React + Vite — Governance Studio UI

Dashboard · Explorer · Rules · Intake · Projects · Evaluations

Local API & Application Services

Validation · Authorization · Change Workflow · Read Models

Governance Core

AGHR Contracts & Rules

Skill Steward Engine

Intake & Classification

Evaluation Engine

Checks · Evidence · Findings

Project Adapters

Git · Codex · Claude · OpenCode

Authoritative Files + Derived Indexes

Versioned AGHR · Project Records · Evidence · Cache

### القرارات المعمارية المقترحة

| القرار              | التوصية                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| Frontend            | الاحتفاظ بـ React/Vite                                                 |
| Backend             | خدمة Python محلية مستقلة إذا أثبتت ملاءمتها لأدوات AGHR                |
| التخزين             | ملفات معتمدة تحت Git وفهارس مشتقة؛ قاعدة بيانات لاحقًا إذا ثبتت الحاجة |
| الذكاء الاصطناعي    | GPT/OpenAI افتراضيًا، وبقية المزودين عبر Adapters                      |
| نمط التشغيل         | Local-first                                                            |
| الكتابة على المصادر | Staging ثم Apply مصرح به                                               |
| الفهرسة             | تدريجية بدل تحميل كل الملفات                                           |
| إدارة الحالة        | أحداث وسجلات ذات مصدر حقيقة محدد                                       |
| الإنفاذ             | Backend وأدوات محكومة، وليس قواعد UI فقط                               |

هذه توصيات تصميم، ويجب تأكيد تفاصيل التنفيذ بعد فحص المشروع والحزمة المحليين.

# 4. خطة التنفيذ التفصيلية

أوصي بتقسيم التطوير إلى ثماني مراحل، مع تنفيذ متتابع داخل التفويض، وبوابة تحقق لكل مرحلة.

## المرحلة 0 — تأهيل المشروع وحماية الحالة الحالية

الهدف: إثبات نقطة البداية قبل تغيير أي كود.

| العمل                                     | نتيجة مطلوبة                         |
| ----------------------------------------- | ------------------------------------ |
| فحص Git والفرع والتغييرات غير الملتزم بها | Baseline موثق                        |
| فحص المشروع والاعتمادات والأوامر          | Inventory حقيقي                      |
| فحص ملفات AGHR وسجلاتها وبصماتها          | Reference Qualification              |
| فحص وثيقة SACP                            | قائمة وظائف قابلة لإعادة الاستخدام   |
| بناء المشروع الحالي إن أمكن               | Baseline Build Evidence              |
| فحص واجهات القراءة والمسارات              | Security Findings                    |
| إعداد مصفوفة فجوات                        | Reuse / Extend / Implement / Blocked |

معيار النجاح: وجود تقرير يحدد ما يعمل فعلًا، وما هو موثق فقط، وما هو غير موجود، مع المحافظة على جميع الملفات والتغييرات السابقة.

## المرحلة 1 — تأمين الأساس وعزل Backend

الأولوية: P0

تعالج هذه المرحلة المخاطر التي ظهرت في `vite.config.mjs` عند مراجعة النسخة المنشورة.

| المهمة                                 | التحقق المطلوب                     |
| -------------------------------------- | ---------------------------------- |
| تقييد جذور القراءة بقائمة معتمدة       | رفض أي مسار خارج الجذر             |
| معالجة Path Traversal وSymlink Escapes | اختبارات سلبية ناجحة               |
| تقييد حجم الملفات والقراءات            | عدم استنزاف الموارد                |
| حماية الملفات الحساسة                  | عدم إتاحة أسرار غير مصرح بها       |
| فصل API عن Vite                        | استمرار عمل الواجهة                |
| إنشاء طبقة أخطاء آمنة                  | عدم تسريب مسارات وأسرار في الرسائل |
| اختبار تشغيل Windows                   | بناء وتشغيل API والواجهة فعليًا    |

بوابة النجاح: لا يستطيع طلب HTTP قراءة ملف خارج النطاق المعتمد، وتظل وظائف الاستكشاف الحالية تعمل.

## المرحلة 2 — Governance Reference Explorer

الهدف: جعل AGHR مرجعًا قابلًا للتصفح والتحليل، بدل التعامل معه كمجلد ملفات عادي.

الوظائف المطلوبة:

| الوظيفة             | السلوك                                       |
| ------------------- | -------------------------------------------- |
| Reference Navigator | عرض عقود AGHR وسياساتها وأقسامها             |
| Rule Explorer       | البحث بالمعرف والنوع والقوة والانطباق        |
| Source Explorer     | عرض المصدر الرسمي والإصدار وحالة التحقق      |
| Relationship Graph  | تمثيل روابط القاعدة بالمصدر والعقد والاختبار |
| Coverage Viewer     | كشف الإحالات الناقصة والتداخلات              |
| Document Viewer     | عرض Markdown دون تعديل المصدر                |

يجب أن تكون العلاقات الموثقة مختلفة بصريًا ودلاليًا عن العلاقات المكتشفة بالاستدلال.

بوابة النجاح: يستطيع المستخدم اختيار قاعدة، ومعرفة مصدرها، وسلطتها، وانطباقها، وضابط تنفيذها، ودليل التحقق المطلوب إن كان مسجلًا.

## المرحلة 3 — Intake & Change Management

الهدف: إدارة كل إضافة أو تعديل يبدأه المستخدم، وليس التعليمات فقط.

يعاد استخدام ما يصلح من مواصفة Skill Steward مع تعميمه على AGHR.

Raw Input

نص · وثيقة · ملاحظة · توصية · طلب

Atomic Classification

النوع · السلطة · الإلزام · النطاق · الأثر

Reconciliation & ChangePacket

ADD · STRENGTHEN · MERGE · REJECT · DEFER

Review → Staging → Verify → Authorized Apply

يبدأ التطبيق في هذه المرحلة بتوليد الاقتراحات والفروقات دون تعديل المرجع. ثم تضاف إمكانية التطبيق لاحقًا بعد تأهيل ضوابطه.

بوابة النجاح: يتحول مدخل مركب إلى عناصر تغيير واضحة، ويحفظ النص الأصلي، وتظهر الأسباب والتعارضات والمخرجات المقترحة دون اعتماد تلقائي.

## المرحلة 4 — Project Adoption Manager

الهدف: تمكين المستخدم من اختيار مشروع وتطبيق AGHR عليه وفق مسار متناسب.

| الوظيفة                   | المطلوب                                      |
| ------------------------- | -------------------------------------------- |
| Project Discovery         | التعرف على البنية والتقنيات والملفات الحاكمة |
| Governance Reconciliation | كشف السياسات المتوافقة والمتعارضة            |
| Profile Selection         | LITE / STANDARD / CONTROLLED                 |
| Provider & Host Selection | اختيار GPT/Codex افتراضيًا أو بدائل أخرى     |
| Adoption Preview          | عرض ما سيُضاف أو يتغير قبل التنفيذ           |
| Configuration             | تهيئة ملفات المشروع دون الكتابة فوق الموجود  |
| Qualification             | التحقق من تحميل التعليمات والحدود التشغيلية  |
| Adoption Report           | حالة التبني والأدلة والفجوات                 |

بوابة النجاح: تبني مشروع تجريبي جديد وآخر قائم دون فقدان ملفاته أو تغيير صلاحياته ضمنيًا.

## المرحلة 5 — Compliance & Evaluation Center

الهدف: تحويل القواعد إلى أدلة قابلة للمراجعة، وليس مجرد مؤشرات نجاح.

يجب أن تعرض الواجهة حالات `PASS / FAIL / BLOCKED / NOT_RUN / NOT_APPLICABLE` مع تعريف واضح لكل حالة، وربط كل حكم بالدليل والبيئة والمرشح الفعلي.

بوابة النجاح: لا تقبل المنصة إعلان PASS لفحص لم يُنفذ، ولا تخلط نجاح التهيئة مع صلاحية الإنتاج.

## المرحلة 6 — Governed Change Application

الهدف: الانتقال من اقتراح التغييرات إلى تطبيقها عندما يكون ذلك مصرحًا.

| الضابط             | السلوك                              |
| ------------------ | ----------------------------------- |
| Staging            | إنشاء نسخة مرشحة مستقلة             |
| Diff Review        | عرض التغييرات الدقيقة               |
| Authority Check    | تحقق من صلاحية التطبيق              |
| Protected Files    | منع التعديل غير المخول              |
| Precondition Check | كشف تغير الملفات منذ إعداد الاقتراح |
| Apply              | تطبيق ذري بقدر الإمكان              |
| Recovery           | حفظ إمكانية الاستعادة المناسبة      |
| Audit Evidence     | تسجيل الأثر والنتيجة                |

بوابة النجاح: نجاح السيناريو المصرح، ورفض غير المصرح، والتعامل الآمن مع تغير الملفات أثناء المراجعة.

## المرحلة 7 — التحقق الشامل والاستقرار والتسليم

تشمل هذه المرحلة اختبارات الوحدات والتكامل والأمان والواجهة والمسارات السلبية والتوافق مع Windows، ثم التأكد من عمل وظائف Explorer الأصلية وعدم حصول Regression.

يجب أن يثبت التسليم أن المنصة تستطيع:

- استعراض AGHR وفهم علاقاتها.
- استقبال طلب تعديل وإنشاء ChangePacket.
- إعداد تبني مشروع فعلي ضمن تفويض محدد.
- تنفيذ أدوات التحقق وجمع الأدلة.
- التمييز بين التنفيذ والاختبار والاعتماد.
- رفض الإجراءات غير المصرح بها.

# 5. ترتيب الأولويات دون تعطيل التنفيذ

لا ينبغي تنفيذ جميع الوحدات بالتوازي منذ البداية.

| الترتيب | مجموعة العمل            | السبب                                       |
| ------- | ----------------------- | ------------------------------------------- |
| P0      | Baseline + API Security | لا نبني وظائف إدارة فوق قراءة غير محكومة    |
| P1      | Reference Explorer      | يجعل المرجعية قابلة للفهم والتحقق           |
| P1      | Intake Engine           | المدخل الأساسي لإدارة التغييرات             |
| P1      | Adoption Manager        | القيمة العملية لإدارة المشاريع              |
| P1      | Evaluation Center       | إثبات صحة التشغيل                           |
| P2      | Governed Apply          | يحتاج تأهيلًا أعلى بسبب الكتابة على المصادر |
| P2      | Model-Assisted Analysis | تحسين اختياري بعد إثبات المحرك الأساسي      |
| P2      | Advanced Analytics      | بعد توفر بيانات تشغيل حقيقية                |

ليس المقصود تأجيل الوظائف إلى منتج ناقص دائم؛ بل تسليم المنتج الكامل على مراحل ذات بوابات تحقق واضحة.

# 6. الطلب التنفيذي الجاهز للوكيل البرمجي

هذا الطلب موجه لوكيل يعمل داخل مشروعك المحلي. يسمح بالتنفيذ المتتابع دون طلب موافقة عند كل مرحلة، لكنه لا يمنحه تفويضًا ضمنيًا بالنشر أو الحذف أو الاعتماد النهائي.

# AGHR GOVERNANCE STUDIO — FULL PROJECT TRANSFORMATION REQUEST

## 1. Role and mission

Act as a Staff Software Engineer, Software Architect, Security Engineer, and Technical Lead.

Your mission is to **inspect, preserve, adapt, extend, secure, implement, test, and complete the existing Agent-Files-Explorer application** into a local-first **AGHR Governance Studio** for managing the Agent Governance and Harness Reference (AGHR) across AI-assisted software engineering projects.

**Project root:**

`D:\APP\Skill-manager\Agent-Files-Explorer`

**Authoritative governance reference:**

`D:\APP\Skill-manager\Agent-Files-Explorer\Agent_Governance_Harness_Reference_1.0.0`

**Supplementary architecture source:**

`Skill_Steward_SACP_Executive_Implementation_Spec_v1.0_AR.md`

The AGHR reference governs this transformation subject to applicable higher-priority host instructions and confirmed project authority. Skill Steward is a supplementary design source, not a competing authority.

The goal is a functioning, coherent, secure, maintainable, tested product—not simply documentation, task closure, or UI mockups.

## 2. Non-negotiable engineering principles

1. Respect the 12 foundational AGHR principles, including authority, scope, preservation, evidence integrity, test integrity, security, traceability, and proportionality.
2. Treat model developers' official documentation as the primary technical reference for interacting with their models, within the applicable host, security, and authorization boundaries.
3. Use OpenAI/GPT as the default provider profile, while preserving explicit alternative-provider adaptations.
4. Preserve existing working functions, project files, configurations, and unrelated changes.
5. Do not invent capabilities, test results, source authority, approval, or release acceptance.
6. Do not create competing sources of governance truth.
7. Use deterministic validation and authorization for protected actions; do not rely solely on LLM instructions.
8. Implement minimal, cohesive changes without unsolicited refactoring.
9. Maintain a functional product at each implementation milestone.
10. Continue independent authorized work when a task is blocked, documenting the blocker without repeatedly seeking permission.

## 3. Execution authorization

You are authorized to inspect the project, implement application code and tests, create necessary project files, perform local non-destructive builds and tests, and update project documentation within the agreed scope.

Do not assume authorization to:

- Publish or deploy to production.
- Push to remote repositories.
- Delete unrelated user data or overwrite existing governance decisions.
- Modify external projects.
- Expose secrets or transmit sensitive data to unapproved services.
- Grant yourself owner approval, independent review, or release acceptance.

Plan sufficiently for complex changes, but do not request permission again for every ordinary implementation step already within this authorization.

Require separate authorization only where an action exceeds these boundaries or an applicable AGHR control mandates it.

## 4. Mandatory Phase 0 — Evidence-based repository qualification

Before implementation:

- Identify the actual repository root, branch, HEAD, worktree changes, and untracked files.
- Inspect the existing application, dependencies, scripts, and available tests.
- Inspect the actual local AGHR package and its contracts, reference records, tools, and validation procedures.
- Review the Skill Steward specification and distinguish proposed features from existing implemented features.
- Identify active sources, generated outputs, archives, protected paths, and authoritative registries.
- Examine API path handling, file access, symlinks, local host exposure, and secrets risks.
- Run safe baseline build and tests when available.
- Classify existing capabilities as REUSE, EXTEND, IMPLEMENT, or BLOCKED.
- Document factual findings and uncertainties.

Create a baseline report containing the actual state, verified commands, reusable components, gaps, risks, and acceptance criteria.

Never assume the local project matches a previous GitHub snapshot.

## 5. Target architecture

Develop the application into these coherent modules:

### Governance Reference Management

- Version-aware AGHR browsing.
- Rules, contracts, policies, protocols, and authoritative sources.
- Rule authority, normative force, applicability, enforcement locus, and evidence requirements.
- Validated references and relationship graphs.

### Governance Explorer

- Preserve the existing file tree, document viewer, graph viewer, and flow viewer.
- Add governance-aware typed relationships.
- Distinguish authoritative links from inferred links.
- Support efficient incremental indexing and targeted content retrieval.

### Intake and Change Management

- Capture raw user input without silently altering it.
- Split compound requests into atomic statements.
- Classify requirement, rule, observation, recommendation, risk, assumption, and related types.
- Evaluate authority, applicability, duplication, overlap, conflict, and impact.
- Generate ChangePackets with individually traceable ChangeItems.
- Propose ADD, STRENGTHEN, MERGE, REPLACE, LINK, REJECT, DEFER, or REQUEST_INFORMATION.
- Keep proposed changes separate from approved and applied changes.

### Project Adoption Management

- Discover and inspect candidate projects.
- Reconcile existing governance without replacing approved instructions silently.
- Support LITE, STANDARD, and CONTROLLED.
- Configure provider and host adapters, defaulting to OpenAI/GPT where applicable.
- Preview exact project modifications.
- Generate and validate adoption records.
- Qualify instruction loading and host-specific enforcement boundaries where supported.

### Compliance, Evidence, and Evaluation

- Invoke qualified AGHR validation tools.
- Preserve raw evidence and its candidate/environment identity.
- Support PASS, FAIL, BLOCKED, NOT_RUN, and NOT_APPLICABLE where defined.
- Prevent false PASS and self-certification.
- Separate technical readiness, independent review, release acceptance, and activation.

### Governed Change Application

- Prepare proposed changes in isolated staging.
- Show a complete diff and detect stale preconditions.
- Require appropriate action-time authorization.
- Apply only permitted changes.
- Preserve recovery evidence and audit records.
- Never silently overwrite protected or unrelated files.

### Provider and Host Adapters

- Provide scoped adapters for supported models and agent hosts.
- Keep provider-specific behavior outside the governance core.
- Do not claim live host qualification without actual tests.

## 6. Security requirements — first implementation priority

The current published implementation previously exposed filesystem paths through development API endpoints. Inspect the local implementation rather than assuming the vulnerability remains identical.

Implement and test:

- Explicit approved-root identifiers.
- Canonical-path validation and symlink containment.
- Protected-file and sensitive-data handling.
- Safe request parsing and bounded resource use.
- Local access restrictions and appropriate authentication boundaries.
- Safe error responses without sensitive path disclosure.
- No arbitrary filesystem reads through client-provided paths.
- No uncontrolled process execution.
- No filesystem writes until explicit governed-write capability is implemented and authorized.

Do not expose the API beyond trusted local access by default.

## 7. Implementation approach

Preserve React/Vite unless investigation proves replacement is necessary.

Prefer integrating the existing AGHR tooling rather than duplicating its implementation in another language.

Evaluate a small local Python service for AGHR execution and validation. Choose the backend only after compatibility, packaging, deployment, and security requirements are documented.

Do not add a database, queue, distributed service, framework, or additional abstraction merely because it may become useful later.

Use a single authoritative project state and derive UI indexes and project maps from it.

## 8. Mandatory milestone sequence

### M0 — Repository and reference qualification

Deliver baseline inventory, architecture reconciliation, risk findings, and verified build status.

### M1 — Secure the existing application

Remediate filesystem/API boundaries and preserve all existing Explorer features.

### M2 — AGHR Reference Explorer

Implement governance-aware reference browsing, searching, and typed relationships.

### M3 — Intake and ChangePackets

Implement source preservation, classification, reconciliation, proposals, and traceability without unauthorized application.

### M4 — Project Adoption Center

Implement governed adoption for LITE, STANDARD, and CONTROLLED using real candidate projects and existing AGHR tools.

### M5 — Evidence and Evaluation

Implement test execution boundaries, evidence ingestion, results, qualification reporting, and honest status semantics.

### M6 — Governed Staging and Apply

Implement protected staged changes, authority checks, stale-change detection, safe apply, and recovery handling.

### M7 — Product Integration and Qualification

Complete end-to-end workflows, regression coverage, usability verification, documentation, and distribution checks.

At each milestone:

1. Confirm actual inputs and current state.
2. Define observable acceptance criteria.
3. Implement the required functionality.
4. Run relevant tests and negative-path checks.
5. Record exact outcomes and evidence.
6. Update authoritative state and derived project documentation.
7. Continue to the next authorized milestone unless a material blocker requires a decision.

Never present a milestone as complete solely because its tasks are checked off.

## 9. Required testing

Include tests for:

- Path traversal and symlink escape.
- Protected files and secrets exposure.
- Unauthorized reads, writes, and commands.
- Reference integrity and source attribution.
- Rule applicability and authority conflicts.
- Intake preservation and complex change decomposition.
- Duplicate and conflicting requirements.
- Adoption of new and existing projects.
- LITE/STANDARD/CONTROLLED eligibility.
- Missing or false validation evidence.
- Stale changes and safe recovery.
- Existing Explorer regression.
- Windows execution and local packaging.

Do not weaken existing tests to obtain PASS.

If a test cannot be executed, record NOT_RUN or the appropriate blocked state with the reason.

## 10. Required project records

Keep documentation concise and authoritative.

Maintain, as appropriate:

- Product requirements and milestone acceptance.
- Architecture decisions and impact records.
- Project runtime profile.
- Current verified project state.
- A derived PROJECT_MAP.md.
- Governance/adoption/change records.
- Test and evidence reports.
- Known issues, external dependencies, and owner decisions.

Do not create redundant registers, parallel authority hierarchies, or excessive documentation.

## 11. Final acceptance criteria

The product must demonstrate these workflows on actual controlled fixtures or authorized local projects:

1. Browse AGHR and inspect a governing rule with source, authority, applicability, and evidence.
2. Submit a compound governance request and produce a traceable ChangePacket.
3. Prepare a governance adoption for an existing project without overwriting its approved settings.
4. Execute a qualified validation and display accurate results and evidence.
5. Reject an unauthorized filesystem or governance modification.
6. Safely stage and apply an authorized change when the apply capability has been qualified.
7. Preserve original Explorer features.
8. Restore project execution state without relying on conversation history.

All mandatory checks must be tied to the actual candidate and environment.

No independent approval or production acceptance may be self-issued.

## 12. Reporting contract

For each milestone, report:

- Actual implemented capabilities.
- Files changed and the reason for each substantive change.
- Verification commands run.
- Actual results and evidence locations.
- Remaining blockers and known limitations.
- Next authorized milestone.

Avoid generic progress reports, invented percentages, redundant analysis, and repeated approval requests.

## 13. Start instruction

**Begin with repository and AGHR qualification immediately.**

Then carry out the full milestone plan sequentially within the stated authorization.

Preserve existing project state, prioritize security and actual product capability, maintain verifiable progress, and do not confuse technical test success with independent release acceptance.

When the requested implementation is complete or further progress requires external authorization, provide a precise final handoff identifying what is implemented, verified, blocked, and not yet qualified.

# 7. معايير نجاح المشروع النهائية

أنصح بأن تُعتمد المعايير التالية بدل النجاح القائم على عدد المهام أو نسبة الملفات المكتملة.

| المعيار                 | المطلوب إثباته                                         |
| ----------------------- | ------------------------------------------------------ |
| Functional Completeness | تدفقات الإدارة والتبني والتغيير تعمل فعلًا             |
| Governance Integrity    | المرجعية واحدة ولا تُعتمد القواعد دون سلطة             |
| Security                | منع القراءة والكتابة خارج التفويض                      |
| Change Integrity        | كل تغيير قابل للتتبع والمراجعة                         |
| Evidence Integrity      | لا تُختلق نتائج الاختبارات أو الاعتماد                 |
| Compatibility           | استمرار وظائف Explorer الحالية                         |
| Usability               | إمكانية استخدام النظام دون الحاجة لفهم جميع ملفات AGHR |
| Portability             | إمكان تهيئة المشروع على Windows دون مسارات خاصة ثابتة  |
| Maintainability         | عدم بناء نظام مفرط التعقيد أو متعدد المصادر المتنافسة  |
| Recoverability          | استعادة الحالة بعد توقف الوكيل أو فشل جزئي             |

## 8. التوصية التنفيذية النهائية

ابدأ بالطلب أعلاه داخل Codex أو بيئة الوكيل العاملة في المجلد المحلي، مع جعل المرحلة صفر إلزامية قبل أي تعديل.

وأوصي بعدم نقل حزمة AGHR إلى داخل كود واجهة React أو نسخ قواعدها في مكونات الواجهة. ينبغي أن تبقى حزمة AGHR مرجعًا مستقلًا قابلًا للتحديث والإصدار، بينما تكون المنصة واجهة لإدارتها وتبنيها وفحص الامتثال لها.

الأولوية القصوى هي تحقيق ثلاثة أمور بالترتيب: تأمين الوصول إلى الملفات، ثم بناء مستكشف حوكمة فعلي، ثم تمكين استقبال التغييرات وتبني الحزمة في المشاريع. بقية الوحدات تُستكمل فوق هذا الأساس حتى يصبح المنتج متكاملًا.

حالة العمل الحالي: الخطة والطلب التنفيذي جاهزان. لم تُجرَ تعديلات على مشروعك المحلي أو تشغيل اختبارات فيه، ولذلك تبقى نقطة البداية الفنية ومخرجات التنفيذ مسؤولية فحص الوكيل الفعلي داخل المسار المحدد.