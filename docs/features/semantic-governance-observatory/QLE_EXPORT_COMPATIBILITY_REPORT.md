# AGHR-QLE-GOV-OBS-001: Governed Export Compatibility & Safety Report

## 1. Overview of Export Artifacts
The SGO Exporter (`server/studio/sgo/sgo-export.mjs`) generates 8 standardized, governed export artifacts available for download via `GET /api/v1/sgo/export/:type`:

1. **`QLE_GOV_SOURCE_RECONCILIATION.csv`**:
   - Tabulates the 423 items, matching candidate IDs (`V4`) to original source IDs (`SOURCE_255` / `V2`).
   - Includes origin, normative force, case count, and AAPES domains.

2. **`QLE_GOV_QUALIFICATION_MATRIX.json`**:
   - Machine-readable matrix recording all 423 items.
   - Enforces the strict invariant: `test_execution_status: "DESIGNED_NOT_RUN"`, `executed_cases_count: 0`, `qualification_verdict: "NOT_ASSESSED"`.

3. **`QLE_GOV_OPEN_DECISIONS.md`**:
   - Markdown summary of the 11 Priority Decision Groups, questions, advisory notes, and pending owner review statuses.

4. **`QLE_GOV_EVIDENCE_MANIFEST.json`**:
   - Complete digest manifest listing all source packages, compiled dataset hashes, and current audit ledger verification state.

5. **`QLE_GOV_APPROVED_RULESET_CANDIDATE.json`**:
   - **Critical Invariant**: Exported with `status: "EMPTY_ZERO_AUTHENTIC_APPROVALS"` and `approved_items_count: 0`.
   - Prevents the inadvertent or unauthorized deployment of candidate rules as approved baselines.

6. **`QLE_GOV_OWNER_APPROVAL_RECORD.md`**:
   - Governed draft template for sovereign owner signature and formal adoption.

7. **`QLE_GOV_RELATIONAL_EDGES.csv`**:
   - Complete 606 relational links between items.

8. **`QLE_GOV_DECISION_LEDGER.json`**:
   - Complete serialized SHA-256 hash-chained audit log.

---

## 2. Security: Formula Injection Neutralization
To prevent CSV formula injection attacks (CVE-style command execution in spreadsheet software like Microsoft Excel or LibreOffice Calc):
- All string values undergo strict formula sanitization.
- Any text starting with `= `, `+`, `-`, or `@` is prepended with a single quote character (`'`).
- In addition, fields containing commas, line breaks, or double quotes are safely quoted and escaped according to RFC 4180.

---

## 3. Draft Change Package Integration
Operators can transition an SGO review item into an actionable proposal by calling `POST /api/v1/sgo/propose-change-package`:
- Converts the candidate item into a compliant AGHR `OBSERVATION` draft.
- Validates payload structure through the canonical pinned Python worker (`draftValidator`).
- Stores the resulting Change Package (`CP-YYYY-xxxxxxxx`) into rc3-local SQLite draft custody without touching published project files or modifying active governance authority.
