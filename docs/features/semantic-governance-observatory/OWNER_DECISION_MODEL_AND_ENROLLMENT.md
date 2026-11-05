# AGHR-QLE-GOV-OBS-001: Owner Decision Model & Sovereign Enrollment

## 1. Governance Separation: Operator vs Sovereign Owner

The Semantic Governance Observatory strictly enforces a two-tier authority boundary:

### 1.1 Non-Normative Operator Drafts
- **Actor Role**: Local operator / developer.
- **Scope**: Recording drafting notes, preliminary reviews, and advisory annotations.
- **Authority**: Stored with `is_draft: true` and `authorizes_engine_activation: false`.
- **API Endpoint**: `POST /api/v1/sgo/decisions/draft`.
- **Normative Effect**: Zero. Draft decisions do not change engine rules, grant write privileges, or activate policies.

### 1.2 Sovereign Owner Decisions
- **Actor Role**: Verified Sovereign Project Owner.
- **Scope**: Binding normative determinations on Priority Decision Groups (`V4-D01` to `V4-D08`, `G1-D09` to `G1-D11`).
- **Authority**: Requires explicit cryptographic / hardware enrollment.
- **API Endpoint**: `POST /api/v1/sgo/decisions/protected`.
- **Fail-Closed Default**: In the absence of sovereign owner enrollment, this endpoint **fails closed** with HTTP 403:
  ```json
  {
    "error": {
      "code": "BLOCKED_UNPROVISIONED_OWNER_AUTH",
      "message": "Protected owner decisions fail closed until sovereign owner identity enrollment is securely provisioned."
    }
  }
  ```

---

## 2. The 11 Priority Decision Groups

The SGO surfaces the exact 11 Priority Decision Groups extracted from authoritative review records:

| Decision ID | Focus Area | Priority | Affected Rows | Advisory Note (Not Pre-selected) |
| :--- | :--- | :---: | :---: | :--- |
| **`V4-D01`** | الرسم العثماني وضبط المصحف المعتمد | P0 | 12 | يوصى باعتماد التحقق الشامل مع مصحف مجمع الملك فهد. |
| **`V4-D02`** | التحقق من صحة القراءات المتواترة | P0 | 15 | يوصى بحظر القراءات الشاذة في الاستدلال اللغوي المعياري. |
| **`V4-D03`** | تجريد الجذور اللغوية وموازين الأفعال | P0 | 18 | يوصى بفصل المعالجة الصرفية عن الدلالات السياقية. |
| **`V4-D04`** | ضبط حدود الإعراب والوظائف النحوية | P1 | 14 | يوصى بربط الإعراب بالرتبة التركيبية المعتمدة. |
| **`V4-D05`** | معالجة الوجوه البلاغية والبيانية | P1 | 10 | يوصى بتوثيق الشواهد البلاغية من أمهات كتب التفسير. |
| **`V4-D06`** | ضبط الترادف الدلالي والفروق اللغوية | P1 | 16 | يوصى برفض الترادف التام في الألفاظ القرآنية. |
| **`V4-D07`** | توثيق المعاجم والشواهد اللغوية | P1 | 12 | يوصى بحصر الاحتجاج بالمعاجم السبعة المعتمدة. |
| **`V4-D08`** | حوكمة التحديثات وضبط الإصدارات | P0 | 8 | يوصى باعتماد آلية التوقيع الرقمي الصارم لكل تحديث. |
| **`G1-D09`** | التحقق التبادلي بين النحو والصرف | P1 | 11 | يوصى بالتحقق التبادلي التلقائي قبل اعتماد التحليل. |
| **`G1-D10`** | إدارة الاستثناءات وحالات الشذوذ اللغوي | P1 | 9 | يوصى بحظر تجاوز القواعد دون سند إجماعي موثق. |
| **`G1-D11`** | اعتماد حزم الاختبارات القياسية (Benchmarks) | P0 | 14 | يوصى بعدم اعتماد أي نموذج دون اجتياز حزمة الاختبارات. |

---

## 3. Tamper-Evident SHA-256 Audit Ledger

Every decision event, draft modification, and verification is recorded into an append-only, SHA-256 hash-chained audit ledger:
```text
Event 0 (GENESIS): Hash = SHA256("0" + Payload)
Event N:           Hash = SHA256(Hash_{N-1} + Payload_N)
```
The integrity of the ledger can be independently verified at any time via `GET /api/v1/sgo/audit/verify` or through the Studio UI.
