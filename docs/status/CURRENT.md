# SGO Protected Decision Ledger Integrity Remediation — Derived Execution State

Updated 2026-11-05 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing test verification.

Executed under Owner Directive `AGHR-QLE-GOV-OBS-006` (Protected Decision Ledger Integrity — Final Targeted Remediation):
- **Branch & Baseline:** Isolated feature branch `feat/aghr-qle-gov-obs-006-integrity` branched from `main` at `a13f59384e47b78c2356203c7a082886be99dbc9`.
- **Verification Suites:** 254/254 regression tests passing (`npm test`), 69/69 discrete tests passing (`node --test tests/sgo_integration.test.mjs`), Microsoft Edge headless browser UI passing, context health healthy (~4,150 tokens < 5,000 tokens limit).
- **Integrity & Durability Remediations:**
  * Pre-verification of audit history and retained checkpoints before any startup synchronization.
  * Strict prohibition against regenerating or overwriting an existing integrity anchor simply because loaded ledger differs.
  * Valid-prefix ledger truncation detected on startup; preserves checkpoint evidence and fails closed (`NEG-01`).
  * Corrupted or missing-after-initialization records classified as integrity incidents, never degraded to fresh empty stores (`NEG-02`..`NEG-04`).
  * Silent persistence error suppression removed from all decision and audit write operations (`NEG-05`).
  * Logical transaction atomicity: decision, audit event, and checkpoints commit atomically or roll back in-memory state and disk snapshots, throwing `PERSISTENCE_TRANSACTION_FAILED` (`NEG-05`, `NEG-06`).
  * Trust boundary reality documented: path separation is defense-in-depth, not independent hardware immutability.
- **Preservation & Boundaries:** Pinned AGHR rc.3 engine, release hashes, Quran corpus, and unpromoted AAPES v2.1 preserved intact. Real owner endpoint remains disabled/fail-closed (`BLOCKED_UNPROVISIONED_OWNER_AUTH`).
- **Final Candidate Status:** `QUALIFIED_ON_BRANCH_READY_FOR_OWNER_REVIEW`.

## Stop position
STOP: Isolated candidate ready on `feat/aghr-qle-gov-obs-006-integrity`. Do NOT merge, push, deploy, or activate rules without separate sovereign owner authorization.
