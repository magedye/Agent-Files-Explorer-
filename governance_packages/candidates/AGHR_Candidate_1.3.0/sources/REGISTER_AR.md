# سجل المراجع الموحّد

نسخة مقروءة مشتقة من `sources/REGISTER.json`، وليست سجل سلطة ثانٍ. مصادر الأصل محفوظة بتواريخها وحدودها؛ نتائج الفحص المرتبط بالدمج في `REVALIDATION_1.1.0.json`.

## OA-01 — Model Spec
الناشر: OpenAI. نوع المرجع: `BEHAVIOR_SPEC`.
المصدر: https://model-spec.openai.com/2026-08-18.html
نطاق الاطلاع: Instructions and levels of authority; The chain of command
الخلاصة المحدودة: Instructions have host-defined authority; untrusted data has no instructional authority by default. Published desired behavior is not proof that a deployment always complies.

## OA-02 — Harness engineering: leveraging Codex in an agent-first world
الناشر: OpenAI. نوع المرجع: `ENGINEERING_EXPERIENCE`.
المصدر: https://openai.com/index/harness-engineering/
نطاق الاطلاع: Repository knowledge; Enforcing architecture; What we are still learning
الخلاصة المحدودة: A navigable repository, short entry instructions, feedback tools and mechanically checked boundaries supported the reported experiment. Its architecture and permissive merge choices are not universal mandates.

## OA-03 — Rethinking skills and prompts for GPT-6 Astra
الناشر: OpenAI. نوع المرجع: `MODEL_SPECIFIC_GUIDANCE`.
المصدر: https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra
نطاق الاطلاع: Better skills; Up-to-date AGENTS.md; Persistence
الخلاصة المحدودة: Review accumulated prompts and skill routing for bloat and overconstraint. Define completion and safe continuation explicitly. Re-evaluate guidance for the actual model instead of extrapolating a guarantee of safe behavior.

## OA-04 — Custom instructions with AGENTS.md
الناشر: OpenAI. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://learn.chatgpt.com/docs/agent-configuration/agents-md
نطاق الاطلاع: How Codex discovers guidance
الخلاصة المحدودة: Codex discovers guidance across global and project scopes. Overrides, working directory, concatenation order and byte caps affect what is loaded. Verify the actual chain rather than assuming file presence is sufficient.

## OA-05 — Running Codex safely at OpenAI
الناشر: OpenAI. نوع المرجع: `ENGINEERING_EXPERIENCE`.
المصدر: https://openai.com/index/running-codex-safely/
نطاق الاطلاع: Sandboxing and approvals
الخلاصة المحدودة: Sandbox boundaries and approval policies are different controls. Technical limits constrain access while approval policy governs escalation beyond configured authority.

## OA-06 — Safety in building agents
الناشر: OpenAI. نوع المرجع: `PRODUCT_GUIDANCE`.
المصدر: https://developers.openai.com/api/docs/guides/agent-builder-safety
نطاق الاطلاع: Prompt injections; Data leakage; Best practices
الخلاصة المحدودة: Treat prompt injection and private-data leakage as workflow risks. Structured intermediate data and approvals are useful defenses, not proofs of immunity. The retrieved page is product-scoped; no Agent Builder dependency is imposed here.

## OA-07 — Guardrails - OpenAI Agents SDK
الناشر: OpenAI. نوع المرجع: `SDK_DOCUMENTATION`.
المصدر: https://openai.github.io/openai-agents-python/guardrails/
نطاق الاطلاع: Workflow boundaries; Execution modes
الخلاصة المحدودة: Agent input/output guardrails have workflow boundaries. Parallel input checks may complete after work starts. Sensitive actions need blocking checks at the relevant tool boundary.

## OA-08 — Function calling
الناشر: OpenAI. نوع المرجع: `API_DOCUMENTATION`.
المصدر: https://developers.openai.com/api/docs/guides/function-calling
نطاق الاطلاع: Function calling lifecycle; Strict mode
الخلاصة المحدودة: Tool requests and execution results form a protocol. Validate arguments and correlate results with calls; schema compliance does not grant permission to execute.

## OA-09 — Evaluate agent workflows
الناشر: OpenAI. نوع المرجع: `EVALUATION_GUIDANCE`.
المصدر: https://developers.openai.com/api/docs/guides/agent-evals
نطاق الاطلاع: Agent evaluations
الخلاصة المحدودة: Evaluate workflows, not only final wording. Workflow-level testing and trace evaluation help locate failures in agent decisions and tool use.

## OA-10 — Evaluation best practices
الناشر: OpenAI. نوع المرجع: `EVALUATION_GUIDANCE`.
المصدر: https://developers.openai.com/api/docs/guides/evaluation-best-practices
نطاق الاطلاع: Eval-driven development; Continuous evaluation
الخلاصة المحدودة: Use representative task data, explicit criteria and repeated evaluation across changes. Separate model-assisted judging from deterministic checks and human calibration.

## OA-11 — Sandbox security
الناشر: OpenAI. نوع المرجع: `PRODUCT_GUIDANCE`.
المصدر: https://developers.openai.com/api/docs/guides/agents-api/environments/security
نطاق الاطلاع: Isolate workloads; Network; Credentials
الخلاصة المحدودة: Generated code can use resources exposed to its environment. Isolate workloads, restrict networking and protect credentials independently of instructions. No hosted API is required by this package.

## OA-12 — Conversation state
الناشر: OpenAI. نوع المرجع: `API_DOCUMENTATION`.
المصدر: https://developers.openai.com/api/docs/guides/conversation-state
نطاق الاطلاع: Conversation state; Managing context
الخلاصة المحدودة: Conversation continuity is an API concern with storage and context implications. Maintain durable application state separately and check the selected endpoint behavior during integration.

## OA-13 — Reasoning best practices
الناشر: OpenAI. نوع المرجع: `MODEL_FAMILY_GUIDANCE`.
المصدر: https://developers.openai.com/api/docs/guides/reasoning-best-practices
نطاق الاطلاع: How to prompt reasoning models effectively
الخلاصة المحدودة: Clear goals, direct prompts and delimiters are preferred. Do not require private chain-of-thought disclosure. Historical endpoint-specific examples must not be applied to every newer model.

## AN-01 — Effective context engineering for AI agents
الناشر: Anthropic. نوع المرجع: `ENGINEERING_GUIDANCE`.
المصدر: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
نطاق الاطلاع: The anatomy of effective context; Long-horizon tasks
الخلاصة المحدودة: Curate high-value context; retrieve information when needed; preserve relevant state across compaction. Tool ambiguity and excess instructions can reduce effectiveness.

## AN-02 — Building effective agents
الناشر: Anthropic. نوع المرجع: `ENGINEERING_GUIDANCE`.
المصدر: https://www.anthropic.com/engineering/building-effective-agents
نطاق الاطلاع: When and when not to use agents; Note about tooling
الخلاصة المحدودة: Start with simple composable approaches and add orchestration when justified. The article itself points to newer managed-agent material for current tooling, so it is used for design principles only.

## AN-03 — How Claude remembers your project
الناشر: Anthropic. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://code.claude.com/docs/en/memory
نطاق الاطلاع: AGENTS.md; Share one file with other coding tools
الخلاصة المحدودة: CLAUDE.md and imports are supported. Current documentation also describes version- and configuration-dependent AGENTS.md loading. Verify conflicts and actual loading; do not create duplicate context files blindly.

## AN-04 — Configure permissions
الناشر: Anthropic. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://code.claude.com/docs/en/permissions
نطاق الاطلاع: Permission rules; Permission modes
الخلاصة المحدودة: Configure permission rules and modes for the actual host. Treat instructions, approvals and operating-system isolation as distinct layers.

## AN-05 — Configure the sandboxed Bash tool
الناشر: Anthropic. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://code.claude.com/docs/en/sandboxing
نطاق الاطلاع: Sandboxing; Supported platforms
الخلاصة المحدودة: Sandbox support and isolation behavior depend on platform and settings. Qualify file and network restrictions on the deployment operating system.

## AN-06 — Tool use with Claude
الناشر: Anthropic. نوع المرجع: `API_DOCUMENTATION`.
المصدر: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
نطاق الاطلاع: How tool use works
الخلاصة المحدودة: Distinguish client-executed tools from server tools and preserve tool_use/tool_result structure and correlation. Do not translate another vendor message envelope mechanically.

## GO-01 — Provide context with GEMINI.md files
الناشر: Google. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://geminicli.com/docs/cli/gemini-md/
نطاق الاطلاع: Understand the context hierarchy; Manage context
الخلاصة المحدودة: Gemini CLI has hierarchical context discovery, imports, configurable filenames and /memory inspection. Tool-triggered discovery can add more instructions later.

## GO-02 — Sandboxing in Gemini CLI
الناشر: Google. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://geminicli.com/docs/cli/sandbox/
نطاق الاطلاع: Sandboxing
الخلاصة المحدودة: Select and verify an isolation backend appropriate to the operating system. Approval or model steering is not itself filesystem or network isolation.

## GO-03 — Policy engine
الناشر: Google. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://geminicli.com/docs/reference/policy-engine/
نطاق الاطلاع: Policy engine
الخلاصة المحدودة: The CLI exposes a policy engine for tool decisions. Inspect effective policy, precedence and supported rule syntax for the installed release.

## GO-04 — Function calling with the Gemini API
الناشر: Google. نوع المرجع: `API_DOCUMENTATION`.
المصدر: https://ai.google.dev/gemini-api/docs/function-calling
نطاق الاطلاع: Function calling
الخلاصة المحدودة: Function declarations, model calls and function results use Gemini protocol structures. Validate the selected model and SDK behavior rather than relying on API compatibility assumptions.

## GO-05 — Thought signatures
الناشر: Google. نوع المرجع: `API_DOCUMENTATION`.
المصدر: https://ai.google.dev/gemini-api/docs/thought-signatures
نطاق الاطلاع: Thought signatures
الخلاصة المحدودة: Applicable Gemini tool flows carry opaque thought signatures. Preserve provider-required protocol state without treating it as inspectable reasoning or authorization.

## OC-01 — Rules
الناشر: Anomaly / OpenCode. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://opencode.ai/docs/rules/
نطاق الاطلاع: Precedence; Custom instructions
الخلاصة المحدودة: AGENTS.md, configured instruction paths and documented Claude-compatible fallbacks have distinct precedence. Remote instructions are a supply-chain boundary requiring trust review.

## OC-02 — Permissions
الناشر: Anomaly / OpenCode. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://opencode.ai/docs/permissions/
نطاق الاطلاع: Actions; Granular rules; Auto mode
الخلاصة المحدودة: Permission outcomes include allow, ask and deny. Pattern ordering and agent-specific overrides matter. Auto-approval settings can change the handling of ask decisions.

## GH-01 — Adding repository custom instructions for GitHub Copilot
الناشر: GitHub. نوع المرجع: `HOST_DOCUMENTATION`.
المصدر: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions
نطاق الاطلاع: Repository-wide and path-specific instructions
الخلاصة المحدودة: Repository and path-specific instruction mechanisms vary by Copilot surface. Qualify the supported files and effective scope for the installed editor or hosted agent.

## DS-01 — Tool Calls
الناشر: DeepSeek. نوع المرجع: `API_DOCUMENTATION`.
المصدر: https://api-docs.deepseek.com/guides/tool_calls/
نطاق الاطلاع: Tool calls; strict Mode (Beta)
الخلاصة المحدودة: Tool calls require client handling. Strict mode is documented as beta with endpoint and schema restrictions; do not assume OpenAI-shaped requests imply identical semantics.

## MI-01 — Function Calling
الناشر: Mistral. نوع المرجع: `API_DOCUMENTATION`.
المصدر: https://docs.mistral.ai/studio/conversations/function-calling
نطاق الاطلاع: Five steps; Execute Functions
الخلاصة المحدودة: The model proposes functions; the application executes client tools and returns correlated results. Tool choice and parallel-call settings need explicit treatment in the adapter.

## QW-01 — Function Calling
الناشر: Qwen Team. نوع المرجع: `MODEL_INTEGRATION_GUIDANCE`.
المصدر: https://qwen.readthedocs.io/en/latest/framework/function_call.html
نطاق الاطلاع: Inference with Function Calling; Conclusion
الخلاصة المحدودة: Model chat templates and tool parsers must match. The documentation warns that generated calls may still violate the protocol; validate and handle malformed output.

## OA-14 — Build skills
الناشر: OpenAI. نوع المرجع: `host_technical_documentation`.
المصدر: https://learn.chatgpt.com/docs/build-skills
نطاق الاطلاع: selected_full_text_sections
الخلاصة المحدودة: بنية SKILL.md والاكتشاف التدريجي. يلزم التحقق من تطابقها مع المضيف المثبت قبل التفعيل.

## OA-15 — Agent approvals and security
الناشر: OpenAI. نوع المرجع: `host_technical_documentation`.
المصدر: https://learn.chatgpt.com/docs/agent-approvals-security
نطاق الاطلاع: selected_full_text_sections
الخلاصة المحدودة: فصل الموافقات عن العزل وصلاحيات الأفعال؛ لا يعوض النص إعدادات المضيف الفعلية.

## ISO-5338 — ISO/IEC 5338:2023
الناشر: ISO/IEC. نوع المرجع: `international_standard`.
المصدر: https://www.iso.org/standard/81118.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: دورة حياة أنظمة الذكاء الاصطناعي. النص المعياري الكامل لم يُراجع.

## ISO-12207 — ISO/IEC/IEEE 12207:2026
الناشر: ISO/IEC/IEEE. نوع المرجع: `international_standard`.
المصدر: https://www.iso.org/standard/90219.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: الإصدار الثاني منشور في أبريل 2026؛ دورة حياة البرمجيات. النص الكامل لم يُراجع.

## ISO-42001 — ISO/IEC 42001:2023
الناشر: ISO/IEC. نوع المرجع: `management_system_requirements`.
المصدر: https://www.iso.org/standard/42001
نطاق الاطلاع: public_metadata_and_description
الخلاصة المحدودة: نظام الإدارة المؤسسية للذكاء الاصطناعي؛ لا تساوي هذه الإضافات شهادة نظام إدارة.

## ISO-23894 — ISO/IEC 23894:2023
الناشر: ISO/IEC. نوع المرجع: `risk_management_guidance`.
المصدر: https://www.iso.org/standard/77304.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: إرشادات إدارة مخاطر الذكاء الاصطناعي؛ النص الكامل لم يُراجع.

## NIST-RMF — AI Risk Management Framework 1.0
الناشر: NIST. نوع المرجع: `voluntary_framework`.
المصدر: https://www.nist.gov/itl/ai-risk-management-framework
نطاق الاطلاع: official_overview
الخلاصة المحدودة: الإطار المنشور 2023؛ الحوكمة وتحديد السياق والقياس والإدارة. الإعلان عن المراجعة لا ينشئ إصدارًا نهائيًا بديلًا.

## ISO-42005 — ISO/IEC 42005:2025
الناشر: ISO/IEC. نوع المرجع: `impact_assessment_guidance`.
المصدر: https://www.iso.org/standard/42005
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: تقييم أثر أنظمة الذكاء الاصطناعي عبر دورة حياتها؛ النص الكامل لم يُراجع.

## NIST-600-1 — NIST AI 600-1 — Generative AI Profile
الناشر: NIST. نوع المرجع: `voluntary_genai_profile`.
المصدر: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
نطاق الاطلاع: selected_pdf_sections_and_page_image
الخلاصة المحدودة: يوليو 2024؛ ملف مكمل لإطار المخاطر. روجعت مقدمة وأجزاء المخاطر وصورة الصفحة الثامنة، لا تدقيق لكل الإجراءات.

## OWASP-AGENTIC — Top 10 for Agentic Applications 2026
الناشر: OWASP. نوع المرجع: `community_security_guidance`.
المصدر: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
نطاق الاطلاع: official_landing_and_selected_pdf_sections
الخلاصة المحدودة: منشور في 2025-12-09؛ تصنيف مخاطر الوكلاء، وليس شهادة أو بديلًا لنمذجة تهديدات النظام.

## OWASP-LLM — GenAI LLM Top 10 2026
الناشر: OWASP. نوع المرجع: `community_security_guidance`.
المصدر: https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
نطاق الاطلاع: official_landing_and_selected_pdf_sections
الخلاصة المحدودة: الصفحة مؤرخة 2026-08-03. ملف التنزيل الذي عُرض يتضمن حقول تاريخ نشر غير مكتملة؛ إعادة تثبيت النسخة مطلوبة قبل تبني ربط معياري دقيق.

## ISO-27001 — ISO/IEC 27001:2022
الناشر: ISO/IEC. نوع المرجع: `management_system_requirements`.
المصدر: https://www.iso.org/standard/27001
نطاق الاطلاع: public_metadata_and_description
الخلاصة المحدودة: نظام إدارة أمن المعلومات؛ لم يُراجع نص المتطلبات أو الملحق كاملًا، ولا كل التعديلات المنطبقة.

## ISO-25059 — ISO/IEC 25059:2023
الناشر: ISO/IEC. نوع المرجع: `quality_model`.
المصدر: https://www.iso.org/standard/80655.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: نموذج جودة لأنظمة الذكاء الاصطناعي؛ ظهر بديل FDIS قيد الإقرار، لا يُعامل هنا كإصدار منشور ناسخ.

## ISO-5259-1 — ISO/IEC 5259-1:2024
الناشر: ISO/IEC. نوع المرجع: `international_standard`.
المصدر: https://www.iso.org/standard/81088.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: الجزء الأول: نظرة عامة ومصطلحات وأمثلة.

## ISO-5259-2 — ISO/IEC 5259-2:2024
الناشر: ISO/IEC. نوع المرجع: `international_standard`.
المصدر: https://www.iso.org/standard/81860.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: الجزء الثاني: مقاييس جودة البيانات.

## ISO-5259-3 — ISO/IEC 5259-3:2024
الناشر: ISO/IEC. نوع المرجع: `international_standard`.
المصدر: https://www.iso.org/standard/81092.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: الجزء الثالث: متطلبات وإرشادات إدارة جودة البيانات.

## ISO-5259-4 — ISO/IEC 5259-4:2024
الناشر: ISO/IEC. نوع المرجع: `international_standard`.
المصدر: https://www.iso.org/standard/81093.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: الجزء الرابع: إطار عمليات جودة البيانات.

## ISO-5259-5 — ISO/IEC 5259-5:2025
الناشر: ISO/IEC. نوع المرجع: `international_standard`.
المصدر: https://www.iso.org/standard/5259-5
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: الجزء الخامس: إطار حوكمة جودة البيانات. السنة الصحيحة للإصدار المعروض 2025.

## ISO-5259-6 — ISO/IEC TR 5259-6:2026
الناشر: ISO/IEC. نوع المرجع: `technical_report`.
المصدر: https://www.iso.org/standard/5259-6
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: الجزء السادس: إطار التصوير المرئي لجودة البيانات؛ تقرير تقني، لا مساواة تلقائية مع المتطلبات المعيارية.

## IASC-DR — Revised IASC Operational Guidance on Data Responsibility in Humanitarian Action — 2023
الناشر: OCHA Centre for Humanitarian Data / IASC. نوع المرجع: `humanitarian_operational_guidance`.
المصدر: https://centre.humdata.org/revised-iasc-operational-guidance-on-data-responsibility-in-humanitarian-action/
نطاق الاطلاع: official_custodian_summary
الخلاصة المحدودة: التحديث الثاني، مايو 2023، وفق الجهة المشاركة الحاضنة. تعذر فتح رابط الوثيقة المباشر؛ لم تُراجع كل بنودها.

## ICRC-DP — Handbook on Data Protection in Humanitarian Action — third edition
الناشر: ICRC. نوع المرجع: `humanitarian_handbook`.
المصدر: https://www.icrc.org/en/data-protection-humanitarian-action-handbook
نطاق الاطلاع: official_publisher_overview
الخلاصة المحدودة: الطبعة الثالثة 2024؛ روجع التعريف العام، لا نص الكتاب الكامل. إخفاء الهوية محليًا اقتراح هندسي مشروط لا نص منسوب للكتاب.

## ISO-25010 — ISO/IEC 25010:2023
الناشر: ISO/IEC. نوع المرجع: `supplementary_quality_model`.
المصدر: https://www.iso.org/standard/78176.html
نطاق الاطلاع: public_metadata_and_abstract
الخلاصة المحدودة: مرجع تكميلي لجودة المنتج البرمجي المحيط بالنموذج؛ لم يُراجع كامل النص.

## NIST-SSDF — SP 800-218 — SSDF Version 1.1
الناشر: NIST. نوع المرجع: `supplementary_secure_development_framework`.
المصدر: https://csrc.nist.gov/projects/ssdf
نطاق الاطلاع: official_overview
الخلاصة المحدودة: الصفحة الرسمية تصف 1.1 بأنه نهائي؛ ليست قائمة تحقق جامدة. لا يُستنتج عدم وجود مسودات أخرى.

## OPT-BMAD — BMAD Method documentation
الناشر: BMAD project. نوع المرجع: `optional_external_methodology`.
المصدر: https://docs.bmad-method.org/
نطاق الاطلاع: public_documentation_overview
الخلاصة المحدودة: خيار للتحليل والتصميم والتطوير والأدوار. لا تثبيت ولا اختيار إصدار ولا اعتماد تشغيل في هذه الإضافات.

## OPT-SPECKIT — Spec Kit repository
الناشر: GitHub. نوع المرجع: `optional_external_toolkit`.
المصدر: https://github.com/github/spec-kit
نطاق الاطلاع: public_repository_overview
الخلاصة المحدودة: خيار لتنظيم المواصفات والخطط والمهام؛ لا ينشئ دستورًا أعلى من الحزمة.

## OPT-ADDY — Agent Skills catalog
الناشر: Addy Osmani. نوع المرجع: `optional_external_skill_catalog`.
المصدر: https://skills.addy.ie/skills/
نطاق الاطلاع: public_catalog
الخلاصة المحدودة: خيار لمهارات هندسية متخصصة. لم تُنقل نصوص المهارات أو سكربتاتها، ولم تُراجع كل مهارة أمنيا.
