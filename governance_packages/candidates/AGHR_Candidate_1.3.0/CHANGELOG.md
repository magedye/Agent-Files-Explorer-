# 1.3.0 isolated candidate — 2026-10-21

- Corrected preparation/verification states, task criteria, empty/unknown results and permission/dependency blocks.
- Added explicit host metadata, lightweight project/phase choices, bounded Arabic/English matching and evidence-aware CLI paths.
- Kept native discovery/loading/execution with the host. No installation or separate router service.
- Added regressions and eight scripted CLI/project scenarios; learning uses the existing route without automatic promotion.
- Preserved all 47 rules and eleven skill instruction payloads. See [migration](SKILLS_MIGRATION_1_2_TO_1_3.md). Native qualification, independent acceptance and publication are not granted.

# 1.2.0 updated reference — 2026-10-20

- Reconciled the eight owner-supplied inputs with item dispositions and source custody.
- Added governed learning, a classified LESSON record/schema, a bounded review/capture CLI and meaningful negative-path tests.
- Added one original optional governed-learning skill and linked it to the owning procedure.
- Preserved captured Inbox REQUEST bytes; disposition history now uses separate immutable decisions and registry recovery is explicit.
- Clarified relevant engineering/model/task guidance, context budgets, migration, current version and evidence routes.
- Preserved prior candidate/history and existing 47 rule IDs. Local reference designation is distinct from consumer activation and independent release acceptance.

# Changelog

## 1.2.0 — 2026-10-15 (Release Candidate)
Additive context optimization, durable governance, and Governed Project Inbox capability developed independently from Agent-Files-Explorer.
- **Progressive Disclosure & Task Routing:** Added task-based entry matrix to `AGENTS.md` and integrated 5-layer knowledge organization in `CONTENTS.md`. Quarantined heavy audit paths (`compatibility/`, `verification/`, `design/frozen/`) as `ON_DEMAND_AUDIT` without removing or decoupling any files or tests.
- **Context Budget Tooling:** Extended `tools/check_package.py` with stdlib context footprint evaluation (bytes, chars, lines, estimated tokens) enforcing the < 1,000 token bootstrap entry router requirement (`AGENTS.md`: ~792 tokens) and checking potential committed secrets.
- **Durable Single Source of Truth:** Clarified in `policies/STATE_AND_RECOVERY.md` that `.aghr/state.json` is the sole authoritative state store. Expanded `templates/HANDOFF.md` into a structured, point-in-time derived snapshot incorporating Git HEAD, branch, uncommitted diffs, and verified outcomes.
- **Governed Project Inbox (`_INBOX/`):** Introduced a unified drop staging area at project root. Added `runtime/inbox.py` and `procedures/PROJECT_INBOX.md` implementing an 8-stage intake lifecycle (Discovery, Registration, Classification, Authority Audit, Reconciliation, Disposition, Authorized Work, Verification). Added `templates/INBOX_DISPOSITION.md`. Dropped submissions are fingerprinted (SHA-256) and preserved in immutable custody without granting automatic execution or overwriting canonical assets.
- **Cross-Platform & Windows Portability:** Normalized path handling using POSIX paths (`.as_posix()`) and UTF-8 encoding across all runtime and test tools, eliminating platform-specific path separator and encoding errors.
- **Expanded Test Coverage:** Added 13 new unit tests in `tests/test_inbox.py` covering duplicate detection, canonical file conflicts, untrusted authority claims, unsafe zip archives, in-flight mutations, concurrency, and crash recovery (total test suite expanded from 233 to 246 tests, 100% PASS).

## 1.1.0 — 2026-10-12
Additive integration requested by the owner against the supplied complete 1.0.0 archive. Preserve the four contracts, original rule IDs, profile semantics, adapters, frozen primary-design payload and v4 provenance. Refine AGHR-010/011/023/038 and add AGHR-041–047. Integrate smart clarification, lifecycle tailoring, alternatives, Git closeout, communication, continuous execution and plan/drift review. Add an optional skill library, standards reference cards and a single consolidated source register. Extend local request/state records additively and add advisory progress tooling and regression tests. No live host/model, independent acceptance, installation, remote Git merge or production activation is claimed.

## Historical 1.0.0 changelog

## 1.0.0 — 2026-10-11

Initial independent AGHR reference. Primary design established from owner requirements and 30 official model/host developer sources, frozen before supplemental v4 review. Introduces four contracts, 40 canonical rules, three assurance profiles, provider/host separation, version-scoped adapters, short/full intake, three engineering protocols, copyable adoption prompt, bounded local runtime and negative tests.

v4 was not renamed or used as the base. All 73 actual source files and 48 active controls have dispositions. Historical 88/441/598 records remain inherited trace, not freshly verified originals. Prior release/test statuses are not carried over.

The source ZIP prefix normalization issue found during local validation was corrected and covered by regression tests. Documentation distinguishes local tooling from actual host isolation, real model behavior, authenticated adoption and independent acceptance.
