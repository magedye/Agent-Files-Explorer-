# SGO Post-Merge Security & Governance Integrity Remediation — Derived Execution State

Updated 2026-11-05 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing test verification.

Remediation executed under Directive `AGHR-QLE-GOV-OBS-004` on isolated feature branch `feat/aghr-qle-gov-obs-004-remediation` (baseline `main` at `6f68849`):
- **HTTP Synthetic Bypass Denial:** Stripped client-controlled synthetic bypass from `POST /api/v1/sgo/decisions/protected`; hardcoded `allowSyntheticFixture: false` at route level; returns `403 BLOCKED_UNPROVISIONED_OWNER_AUTH` (verified in `ADV-01`).
- **Genuine Schema Validation:** Replaced placeholder schema check with pure JS JSON Schema validator (`sgo-schema-validator.mjs`) against version-pinned schemas (`change-package`, `sgo-export`, `audit-ledger`). Negative tests prove malformed exports return `VALIDATION_FAILED`, never `VALIDATED_PASSED` (verified in `ADV-02`).
- **Fixture-Only Synthetic Approvals:** Synthetic approval tests restricted strictly to server-controlled test fixtures via `recordSyntheticFixtureDecision` with non-activation invariant (verified in `ADV-03`).
- **Durable Persistence Across Restarts:** Persisted protected owner decisions (`sgo_owner_decisions.json`) and audit events (`sgo_audit_ledger.json`) across server restarts (verified in `ADV-04`).
- **Independent Checkpoint Protection:** Added independent integrity checkpoint (`sgo_checkpoint.json`); tampering or truncation detected immediately (verified in `ADV-05`).
- **Lineage-Based 230+25 Mapping:** Replaced positional slicing with explicit identifier- and version-lineage reconciliation (`LISAN-GOV-001..230` primary, `231..255` auxiliary); 0 discrepancies (verified in `ADV-06`).
- **Canonical Priority Decisions:** Replaced fabricated text in `OWNER_DECISION_MODEL_AND_ENROLLMENT.md` with canonical 11 codex reorganization topics (`V4-D01..D08`, `G1-D09..D11`) (verified in `ADV-07`).
- **Verification Suites:** 245/245 regression tests passing (`npm test`), 60/60 integration tests passing (`node --test tests/sgo_integration.test.mjs`), Edge headless browser UI passing, context health healthy (~4,194 tokens).
- **Remediation Status:** `READY_FOR_OWNER_SECURITY_REVIEW`. Preserved local branch; no push, no merge to main.

## Stop position
STOP: All 8 defects remediated, verified by adversarial tests, passing 245/245 suite. Branch `feat/aghr-qle-gov-obs-004-remediation` ready for sovereign owner security review.
