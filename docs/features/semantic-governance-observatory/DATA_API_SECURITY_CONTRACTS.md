# AGHR-QLE-GOV-OBS-001: Data, API & Security Contracts

## 1. Security Architecture & Canonical Studio Authentication

All Semantic Governance Observatory endpoints are hosted under `/api/v1/sgo/*` and operate under the trusted authority of the AGHR Governance Studio:
1. **Header Authentication**: Every request must carry a valid session token in the `X-Studio-Token` header.
2. **Fail-Closed Default**: Requests with missing, malformed, or forged tokens are rejected immediately with HTTP 401 or 403.
3. **No Role Spoofing**: User roles, grants, and principal capabilities are process-owned objects managed by the server authority; client headers cannot forge or elevate roles.

---

## 2. API Endpoints Specification

### 2.1 Read-Only Endpoints

| Method | Endpoint | Description | Scope / Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/sgo/overview` | KPI summary (423 items, 11 priority groups, 2,240 designed tests, 0 authentic approvals). | Authenticated session |
| `GET` | `/api/v1/sgo/items` | Query items with filtering (`q`, `origin`, `aapes_domain`, `limit`, `offset`). | Authenticated session |
| `GET` | `/api/v1/sgo/items/:id` | Detailed item profile, including atomic obligations and candidate relations. | Authenticated session |
| `GET` | `/api/v1/sgo/priority-decisions` | 11 priority decision groups (`V4-D01` to `V4-D08`, `G1-D09` to `G1-D11`). | Authenticated session |
| `GET` | `/api/v1/sgo/relations` | Relational edges filtered by relation type. | Authenticated session |
| `GET` | `/api/v1/sgo/audit/ledger` | Chronological audit trail of governance actions with SHA-256 hash chaining. | Authenticated session |
| `GET` | `/api/v1/sgo/audit/verify` | Validates hash chain continuity across all events in the ledger. | Authenticated session |
| `GET` | `/api/v1/sgo/export/:type` | Downloads governed export artifacts (CSV/JSON/MD) with formula neutralization. | Authenticated session |

### 2.2 Analytical & Inquiry Endpoints

| Method | Endpoint | Payload | Output / Gate Verification |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sgo/merge/analyze` | `{ source_ids: [...], proposed_force: "MUST", simulate_drop_p0: false }` | Analyzes atomic obligation preservation; verifies merge gates (fails closed on dropped P0, MUST->SHOULD, changed actors). |
| `POST` | `/api/v1/sgo/impact/simulate` | `{ target_id: "QL4-A01" }` | Reachability analysis without fabricating runtime test failures; associated tests remain `DESIGNED_NOT_RUN`. |
| `POST` | `/api/v1/sgo/chat/ask` | `{ query: "QL4-A01" }` | Evidence-grounded lexical search with Arabic normalization, prompt-injection defanging, and source citations. |

### 2.3 Mutation & Decision Endpoints

| Method | Endpoint | Authorization Contract | Behavior |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sgo/decisions/draft` | Operator role | Persists non-normative operator review drafts into SQLite memory store. Marked `is_draft: true`. Does NOT affect normative authority. |
| `POST` | `/api/v1/sgo/decisions/protected` | Sovereign Owner | **Fails closed** with `403 FORBIDDEN` (`BLOCKED_UNPROVISIONED_OWNER_AUTH`) unless sovereign owner hardware/cryptographic enrollment is provisioned. Synthetic principal allowed for unit test validation only. |
| `POST` | `/api/v1/sgo/propose-change-package` | Operator / Studio Authority | Prepares compliant `OBSERVATION` draft change package via canonical E5 Python worker (`draftValidator`) into rc3-local SQLite draft custody. Does not modify published rules. |

---

## 3. Threat Model & Protections

1. **Prompt Injection Defanging**: In `SgoChat`, inputs containing injection patterns (`ignore all instructions`, `override system`, `<script>`) are defanged, logged as security events, and grounded strictly in the compiled offline evidence.
2. **Formula Injection Neutralization**: In `SgoExporter`, all CSV/text fields starting with formula trigger characters (`=`, `+`, `-`, `@`) are escaped with a leading single quote (`'`).
3. **Draft Isolation**: Governed change packages created from SGO remain in draft custody (`rc3-local`) and can never modify the baseline or activate policies without a 7-step adoption workflow.
