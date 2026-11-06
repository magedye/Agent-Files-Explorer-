# Candidate Enhancement Packet 2B: Localized Arabic Operational Profile
## Compact Prompt Adapter for Arabic Agent Execution & Owner Collaboration

**Packet ID:** `CANDIDATE-PACKET-2B`  
**Parent Workstream:** `AFE-GOV-LEGACY-RECONCILE-002`  
**Source Origins:**
- `governance_packages/INBOX/MARSAD — الدستور التنفيذي المقترح لإدارة وتشغيل الوكلاء الأذكياء.md`
- `governance_packages/INBOX/MARSAD_Agent_Language_and_Decision_Guide_2026-10-19.md`
**Target Specification:** `docs/profiles/arabic_operational_adapter.md`  
**Status:** `CANDIDATE_SPECIFICATION_PENDING_OWNER_DECISION (DEC-007)`

---

## 1. Executive Summary & Intent

During the historical governance intake, multiple rich Arabic documents were cataloged in `INBOX/` representing operational agreements between the project owner and Codex in the MARSAD and SQLChat environments.

**Problem:** Injecting full Arabic constitutional texts into global system prompts bloats bootstrap context (> 8,000 tokens) and creates translation/interpretation collisions with technical code.

**Solution:** Condense the verified Arabic operational principles into an **on-demand, modular prompt adapter** (< 800 tokens) that can be activated specifically during Arabic coding, review, or reporting sessions, leaving the English baseline (`AGENTS.md`) clean and compact.

---

## 2. Core Operational Directives to Extract

1. **الوضوح والشفافية التقنية المباشرة:**
   - الإفصاح الفوري والصريح عن الحدود التقنية للوكيل ومخاطر أي إجراء مقترح، وتجنب المجاملة اللغوية أو الوعود التي لا تدعمها أدلة اختبارية صلبة.
2. **الفصل الصارم بين التقرير المعرفي والتغيير البرمجي:**
   - النصوص الإنشائية في المحادثات لا تعد تفويضاً ضمنياً بتعديل الكود أو تفعيل سياسات ملزمة ما لم يصدر أمر صريح ومحدد النطاق من المالك.
3. **الانضباط مع Git وعزل الفروع:**
   - العمل دائماً على فروع عمل مستقلة، والتحقق من نظافة بيئة العمل (`working tree clean`)، وعدم إجراء أي دفع إلى المستودع البعيد (`origin`) دون إذن سيادي مباشر.
4. **لغة التخاطب والتقارير:**
   - صياغة تقارير المالك بلغة عربية تقنية دقيقة وواضحة، مع إبراز الأسئلة المفتوحة والقرارات التي تحتاج توجيه المالك بصورة مستقلة عن سرد التفاصيل الهندسية.

---

## 3. Acceptance Criteria & Test Plan

- **AC-2B-01 (Strict Token Budget):** The final adapter text must not exceed 800 estimated tokens (measured via `tools/check_context_health.mjs`).
- **AC-2B-02 (Zero Global Pollution):** The adapter must reside in `docs/profiles/` and must NEVER be imported by default in `AGENTS.md`.
- **AC-2B-03 (Normative Non-Contradiction):** All Arabic directives must map 1:1 to Baseline v1 invariants (`GOV-001`, `GOV-004`, `GOV-005`, `GOV-007`, `GOV-015`, `GOV-022`) without relaxing any requirement.
