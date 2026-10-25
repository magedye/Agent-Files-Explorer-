# AGHR T12 Candidate — 47 provisional rule drafts

**Status: DRAFT_ONLY_NOT_ADMITTED / PROVISIONAL_OWNER_REVIEW.**

This operator-authored package contains exactly 47 governance items in `policies/drafts/`. It contains no skill library, imported examples, Active instructions or generated AGENTS.md.

Every authored item value is marked by JSON Pointer in `drafting/FIELD_PROVENANCE.json`. Typed enum values remain valid: e.g. `authority.level=project`, `authority.status=draft`, and `impact.evidence=assumed`. Only inherited id and force are unchanged source values. Original applicability conditions are retained explicitly in rule text; project-wide path scope is a proposal, not automatic understanding of those conditions.

The owner authorized drafting; final approval of drafted values is pending. `authority.approvedBy=PROVISIONAL_OWNER_REVIEW` denotes pending review. The declaration in `drafting/OWNER_DIRECTIVE.json` cannot authenticate itself or supply a host SourceGrant. No enterprise authority is claimed. All prospective eval fixtures are NOT_RUN; no E3/E4 implementation or qualification was performed.

The unchanged protocol-3 engine structurally accepts all 47 records. Native `validate --strict`, `validate` and `lint` return **BLOCKED / exit 3**: unverified sources (47), draft mandatory authority (44), and missing E3 evidence (3). **Admitted items: zero.** PACKAGE_STATUS is operator creation/result metadata; the engine's actual consumed inputs remain the manifest and 47 rule files.

[Delivery and raw executions](../../../docs/evidence/studio-t12-2026-10-23/README.md). Reference 1.2.0 and candidate 1.3.0 are unchanged. Provisional owner/license remain as accepted in E1; no final signature or deployment acceptance is asserted.
