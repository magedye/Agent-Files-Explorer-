# AGHR-QLE-GOV-OBS-001: Owner Decision Model & Sovereign Enrollment
## Post-Merge Governance Integrity Remediation (AGHR-QLE-GOV-OBS-004)

---

## 1. Governance Separation: Operator vs Sovereign Owner

The Semantic Governance Observatory strictly enforces a two-tier authority boundary:

### 1.1 Non-Normative Operator Drafts
- **Actor Role**: Local operator / developer.
- **Scope**: Recording drafting notes, preliminary reviews, and advisory annotations.
- **Authority**: Stored with `is_draft: true` and `authorizes_engine_activation: false`.
- **API Endpoint**: `POST /api/v1/sgo/decisions/draft`.
- **Persistence**: Durably stored in `sgo_drafts.json` across server restarts.
- **Normative Effect**: Zero. Draft decisions do not change engine rules, grant write privileges, or activate policies.

### 1.2 Sovereign Owner Decisions
- **Actor Role**: Verified Sovereign Project Owner.
- **Scope**: Binding normative determinations on Priority Decision Groups (`V4-D01` to `V4-D08`, `G1-D09` to `G1-D11`).
- **Authority**: Requires explicit cryptographic / hardware enrollment of sovereign credentials.
- **API Endpoint**: `POST /api/v1/sgo/decisions/protected`.
- **Strict Hardening (AGHR-QLE-GOV-OBS-004)**:
  - **No Client Synthetic Bypass**: Client-controlled synthetic bypass parameters (`body.synthetic`, `actor: 'synthetic-owner-test'`) are strictly stripped and rejected at the HTTP route layer.
  - **Isolated Test Fixtures Only**: Synthetic approval tests execute exclusively in server-controlled, isolated test fixtures; they can never be invoked via the production HTTP route.
  - **Durable Persistence & Checkpoint Protection**: Sovereign decisions and audit ledger events are durably persisted across restarts (`sgo_owner_decisions.json`, `sgo_audit_ledger.json`) and guarded by independently retained integrity checkpoints (`sgo_checkpoint.json`).
- **Fail-Closed Default**: In the absence of authentic sovereign owner enrollment, this endpoint **fails closed** with HTTP 403:
  ```json
  {
    "error": {
      "code": "BLOCKED_UNPROVISIONED_OWNER_AUTH",
      "message": "Protected owner decisions require authenticated sovereign owner enrollment."
    }
  }
  ```

---

## 2. The 11 Canonical Priority Decision Groups

The SGO surfaces the exact 11 Priority Decision Groups verified against canonical owner decision sources (`FULL_EXECUTION_DIRECTIVE_EN.md` §4.3 and `PRIORITY_11_RECOMMENDATIONS_NOT_APPROVED.json`):

| Decision ID | Focus Area & Canonical Topic | Priority | Affected Rows | Default Advisory Disposition (Not Pre-selected) |
| :--- | :--- | :---: | :---: | :--- |
| **`V4-D01`** | **اختيار بنية المدونة الموحدة المرشحة (110 قواعد)**<br>*Adoption of Unified Candidate Codex Structure (110 Rules)* | P0 | 110 | `APPROVE_PROPOSAL` (استشاري فقط: نعم للتصميم التنظيمي المرشح؛ لا ترقية للتفعيل ولا إلغاء للأصل 255). |
| **`V4-D02`** | **فروق الإلزام الجوهرية المحتملة**<br>*Substantive Normative Force Differences* | P0 | 45 | `REQUEST_EVIDENCE` (لا تخفف حكماً إلزامياً إلا بقرار محدد ومعلل؛ اجعل الأصل يحكم أي تفصيل لم يثبت تكافؤه). |
| **`V4-D03`** | **42 بندًا مرتبطًا موضوعيًا دون تضمين مثبت**<br>*42 Topically Linked Items Without Proven Subsumption* | P0 | 65 | `DEFER` (الإبقاء على 42 بنداً مرجعياً غير مستبدل -منها 28 حكماً قوياً- إلى حين إثبات تغطية مفردة لكل حكم). |
| **`V4-D04`** | **المحافظة على الهدف الذهبي للجذر (`LISAN-GOV-244`)**<br>*Preservation of Golden Root Hypothesis (`LISAN-GOV-244`)* | P0 | 9 | `APPROVE_WITH_CHANGES` (إبقاء GOV-244 مرجعاً للمقصد: إلزام محاولة كشف المفهوم الجامع واختبارها دون فرض نجاح؛ لا تخفيف ولا إنكار للوحدة). |
| **`V4-D05`** | **حالة `UNRESOLVED_CORE` والتوافق العقدي**<br>*`UNRESOLVED_CORE` State and Contract Compatibility* | P1 | 3 | `DEFER` (تأجيل إضافة UNRESOLVED_CORE كقيمة تعداد جديدة في المحرك لحين دراسة التوافق العقدي). |
| **`V4-D06`** | **تصحيح إحالة 091 والتشوهات الطباعية**<br>*Correction of Crossref 091 and Textual Defects* | P0 | 2 | `REQUEST_EVIDENCE` (التحقق من الإحالات والنصوص المصوبة؛ التصحيحات يجب ألا تمس المعنى الدلالي). |
| **`V4-D07`** | **علاقة 58 بندًا تاريخيًا بالإصدار v4**<br>*Relationship of 58 Historical V2 Items to v4* | P1 | 58 | `DEFER` (إبقاء الـ 58 بنداً تاريخية حتى يصدر قرار نسخ رسمي معلل). |
| **`V4-D08`** | **ربط التقييم السلوكي والمقياس**<br>*Behavioral Model Evaluation and Metric Linkage* | P1 | 1 | `DEFER` (ربط الاختبارات المصممة محلياً دون تكاليف؛ تأجيل التقييم الخارجي لتفويض منفصل). |
| **`G1-D09`** | **فصل قوة المصدر عن خلاف التصنيف وقوة الملف الناقصة**<br>*Separation of Source Force from Classification Conflicts* | P1 | 28 | `REQUEST_EVIDENCE` (KEEP_ORIGINAL للقوة المنقولة؛ لا تملأ null ولا تفرض SHOULD افتراضياً). |
| **`G1-D10`** | **النطاق والترجمة المقترحان**<br>*Proposed Scopes and Translations* | P1 | 1 | `DEFER` (NO_ACTION للنص الكافي؛ أبق الترجمة مسودة DRAFT حتى مراجعة تعادل الحكم). |
| **`G1-D11`** | **الخط الأساس المحدد وإذن G0 المنفصل**<br>*Specified Baseline and Separate G0 Authorization* | P0 | 1 | `SEPARATE_EXPLICIT_OWNER_DECISION` (إرسال قرار محدد النسخة والنطاق في جلسة المالك؛ لا يبدأ G0 بالاسم أو الصمت أو الجدول وحده). |

---

## 3. Tamper-Evident SHA-256 Audit Ledger & Durable Checkpoints

Every decision event, draft modification, and verification is recorded into an append-only, SHA-256 hash-chained audit ledger:
```text
Event 0 (GENESIS): Hash = SHA256("0" + Payload)
Event N:           Hash = SHA256(Hash_{N-1} + Payload_N)
```

### 3.1 Durable Integrity Checkpoint Model
- **Ledger Persistence**: All audit events are durably serialized to disk in `sgo_audit_ledger.json`.
- **Independent Checkpoint File**: Checkpoint state is independently recorded in `sgo_checkpoint.json` containing:
  - `checkpoint_id`: Unique identifier.
  - `ledger_tip_hash`: Immutable SHA-256 hash of the latest event.
  - `events_count`: Total audit events.
  - `decisions_count`: Total protected decisions recorded.
  - `checkpoint_digest`: SHA-256 digest binding tip hash and counts.
- **Verification Across Restarts**: On startup and via `GET /api/v1/sgo/audit/verify`, the system verifies:
  1. Internal hash-chain validity from Genesis to Tip.
  2. Strict equality between computed tip hash and `sgo_checkpoint.json`.
  3. Any truncation, omission, or tampering triggers immediate fail-closed state (`CHECKPOINT_MISMATCH` or `CHAIN_BROKEN`).
