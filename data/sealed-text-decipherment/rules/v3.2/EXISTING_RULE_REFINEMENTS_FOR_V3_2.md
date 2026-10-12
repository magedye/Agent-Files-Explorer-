# v3.2.0 Refinements to Existing Rules

These are not new Rules/Gates. They amend existing rules to absorb validated lessons without registry bloat.

## R07 — ROOT CORPUS UNITY RULE
Add: Root-family unity is the default corpus assumption, but shared form/root assignment does not itself prove a semantic bridge. If homonymy/separation is proposed, test morphological independence; removal of a separation argument does not establish the bridge.

## R08 + Explanatory Specificity — No Disjunctive Core
Add: A core relying on an unprincipled `A OR B` between unrelated features is suspect. Re-express it as one operational invariant or retain `C0`.

## R09 / R20 — Form-Stratified Root Corpus
Add: ROOT CORPUS UNITY does not erase form distinctions. Corpus analysis must stratify branches by morphological/nominal pattern before transferring evidence between `سَلَم / سِلْم / سَلام / سُلَّم`, Form II, Form IV, Form X, or analogous families.

## R20 — DERIVATIONAL LAYERING
Make the default operational order explicit when evidence permits:
`ATTESTED ROOT FAMILY / LEAST-MARKED EVIDENCE → ROOT CORE CANDIDATE → FORM OPERATOR CANDIDATE → PARTICLE/CONSTRUCTION → ARGUMENT SEMANTICS → CONTEXT → LOCAL MEANING`.
Do not define a marked form first and project its gloss backward into the root.

## R42 — EXPLANATORY SPECIFICITY GATE
Add two requirements: (1) a core must generate at least one negative prediction; (2) it must not collapse into participant frame or nearest lexeme without a semantic residue.

## R58 — FORMAL-RULE REGISTRY
Mandatory fields: Name; Description; Weight/Priority; Impact; Trigger; Failure Mode; Provenance; Related Rules; Examples; Regression Test; Generalization Scope; Status.

## R60 — SEMANTIC EXCLUSION LEDGER
Make `rejection_scope` mandatory, using labels such as `REJECTED_AS_ROOT_CORE`, `REJECTED_AS_FORM_CONTRIBUTION`, `REJECTED_IN_CONSTRUCTION_X`, `REJECTED_AS_LOCAL_MEANING`. Root-level rejection does not automatically prohibit a local realization.

## R63 — DECISIVE CONTEXT PRINCIPLE
Add: structurally sensitive occurrences must pass R101/R102 before receiving `DECISIVE` status.

## R68 — CORE-TO-REALIZATION DERIVATION CHAIN
Use: `ROOT CORE + FORM OPERATOR + PARTICLE/CONSTRUCTION + ARGUMENT SEMANTICS/ROLE + CONTEXTUAL FACE = LOCAL MEANING`. Preserve unresolved layers as `UNKNOWN`.

## R69–R72 — LINGUISTIC OPERATOR INVARIANCE (PROPOSED Generalization/Refinement)
Generalize the existing morphological stability principle: recurring linguistic operators—morphological forms, particles, and recurrent constructions—are investigated under a one-invariant-contribution hypothesis. Local surface glosses may vary compositionally; the operator must not be assigned unrelated ad-hoc meanings merely because the root changes.
Crucial separation: **operator invariance is a methodological principle; the concrete operator value is an empirical hypothesis.**
Concrete values require their own evidence and claim-scope labels.

## R84 — GENERALIZE WITHOUT OVERGENERALIZING
Add: no root-local operator/rule claim may be promoted to a general linguistic law without explicit `generalization_scope` and promotion evidence.

## R89 — SAME-VERSE LEXICAL COLLISION GATE
Add: collision strongly supports non-identity, but does not by itself identify the positive semantic residue. Positive differentiation requires independent corpus evidence or a separate discriminating test.

## R95 — SEMANTIC DEFINITION REGISTRY
Add explicit governance separation: `LOCK_INTERNAL_RESULT ≠ OWNER_ACCEPTANCE ≠ REGISTRY_ADOPTION`. Lock is an immutable internal snapshot; owner acceptance is a governance decision; registry adoption is a documented diff after checklist completion.
