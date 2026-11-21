# Changelog

## 1.4.1-candidate — Post-merge closure & GESI increment

- Added focused reusable post-merge operational procedure and project-neutral checklist in `docs/16_POST_MERGE_CLOSURE.md` (reusing existing `GOV-*`, `ADEQ-*`, `INT-*`, and optional skills without adding rival rules or new skills).
- Added read-only diagnostic `agdl/post_merge.py`, closed schema `schemas/post-merge.schema.json`, CLI subcommand `post-merge-check`, and focused tests `tests/test_post_merge_closure.py`.
- Added Governed Engineering Skills Integration (GESI) specification, external skill evaluation, and assessment template in `docs/17_GOVERNED_ENGINEERING_SKILLS.md`, plus read-only `agdl/gesi.py`, `schemas/gesi.schema.json`, CLI subcommand `skills-check`, and focused tests `tests/test_gesi_skills.py` (including M1–M5 host-pilot corrective refinements for task-vs-inventory findings, safety-first ordering, constraint preservation, slice-gated partial adaptation, and cross-root/session visibility tracking).
- Extended `skills/adeq-quality/SKILL.md`, `docs/05_ADOPTION_AND_ROLLBACK.md`, and host adapters (`adapters/CODEX.md`, `adapters/ANTIGRAVITY.md`, `adapters/OPENCODE.md`) with GESI reconciliation pointers.
- Cross-referenced post-merge closure and non-destructive partial-failure handling in `docs/03_WORKFLOW_AND_ACCEPTANCE.md`, `docs/05_ADOPTION_AND_ROLLBACK.md`, and `templates/QUALITY_CLOSEOUT.md`.
- Normalized relative path keys with `.as_posix()` in `tools/check_package.py` for portable Windows/POSIX manifest verification.

## 1.4.0 — ADEQ 1.1 quality integration

- Add 24 stable ADEQ rules with five targeted enhancements and three distinct confidence judgments.
- Add seven on-demand workflows and generated Core/detailed views.
- Reuse v1.3.1 RCCA trace and G5 closure unchanged; add optional read-only quality routing, checking, convergence proposals and PRE/POST arithmetic.
- Add QA-01..20 behavioral evaluation designs, actual deterministic tests, source reconciliation, templates, PRE/POST prompts and optional uninstalled skill.
- No live project adoption, direct Spec Kit install, PEP/PDP, agent orchestration or measured behavioral improvement claimed.

# v1.3.1 corrective release — 2026-11-06

- Fixed F-01: G5 now validates mandatory task transitive dependency closure and detects missing or cyclic edges.
- Fixed F-02: optional completion-scope classification; unbound unfinished unclassified tasks are `INCONCLUSIVE`, explicitly required unfinished tasks are gaps, and out-of-scope/deferred tasks need a decision reference.
- Fixed F-03: gate-specific structural checks; G1 no longer requires later-stage bindings, G2 no longer requires G5 artifacts.
- Added F-04 diagnostic declared-source instruction inventory (`instruction-audit`) with deliberately unverified native loading/authority.
- Added synthetic negative tests and retained legacy v1.2 scripts/tests unchanged.
- Kept the preexisting contract `agdl-1.3` and historic 1.3.0 verification evidence; regenerated package checksums and patch verification.
- No production enforcement, owner authentication, live Codex/Windows qualification, or target-project activation is claimed.

---

# Changelog

## 1.3.0 — 2026-11-06 — implemented candidate

- Reconciled the supplied plan for one developer, one primary agent and small/medium projects.
- Added English core, 24 classified rules and broad task-bound local autonomy without approval loops.
- Separated native authority, project authority, impact, normative force, attention and activation.
- Preserved the original seven scripts and two test files; reused G1/G2 and explicitly scoped the new G5 profile.
- Added strict local reference/evidence contracts and missing/stale/unknown diagnostics without an acceptance claim.
- Added bounded partial Markdown bridges with byte-preserving raw export and semantic loss reports.
- Added optional dependency/resume diagnostics and a declared-scope classifier, not orchestration or enforcement.
- Added Codex-first and version-specific optional-host guides, inert examples, prompts and proportional templates.
- Added deterministic tests and a narrow synthetic comparison; retained live qualification and efficacy as NOT_RUN.
- No target project, original archive, global host configuration or remote repository was modified.

Release maintenance note: the inherited CLI version test expected 1.3.1 and failed on the first complete run. Its expected release string was updated to 1.4.0; no functional acceptance criterion was weakened. The first failing run is preserved in V140_TESTS_INITIAL.
