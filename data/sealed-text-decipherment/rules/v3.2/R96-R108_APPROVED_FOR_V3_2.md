# R96–R108 — Approved for v3.2.0 Integration

These rules are approved for integration into the v3.2.0 methodology release. They do not contain semantic answers for tested roots.

---

## R96 — BLIND SOURCE ISOLATION GATE
**Weight:** CONSTITUTIONAL / CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** A run MUST NOT be described as blind unless source isolation is verifiable through a pinned manifest of allowed and blocked sources. Prompt-level instructions to “ignore priors” are insufficient if semantic priors remain accessible.  
**Impact:** Makes blindness an auditable source property rather than a behavioral claim.  
**Trigger:** Start of any blind root/lexeme rediscovery run.  
**Failure Mode:** A result is described as independently discovered even though registry definitions, prior analyses, translations, or other semantic priors were accessible.  
**Provenance:** Blind Lab governance; reinforced by AMN/SLM runs conducted outside fully isolated blind environments.  
**Related Rules:** R01, R02, R49, R51, R95.  
**Regression Test:** A run with Semantic Definition Registry access must return `BLIND_ISOLATION_NOT_VERIFIED`, not a blind-ready verdict.

## R97 — FROZEN METHODOLOGY DURING BLIND RUN
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** The methodology and Skill versions are pinned at blind-run start. Newly observed failure modes or rule ideas are logged as discovery events but MUST NOT alter the active run procedure.  
**Impact:** Prevents the experiment from changing its own success criteria while being evaluated.  
**Trigger:** A potential new Rule/Gate is discovered pre-lock.  
**Failure Mode:** The analyst changes methodology mid-run and then treats the result as tested under one stable method.  
**Provenance:** Blind Lab Runbook and Process Observation Log; repeatedly needed during AMN/SLM.  
**Related Rules:** R79–R87.  
**Regression Test:** A pre-lock `DISCOVERY_EVENT` may be logged but must not modify the pinned run manifest or procedure.

## R98 — FORM-IDENTITY VERIFICATION GATE
**Weight:** CRITICAL when the inference depends on form identity; otherwise HIGH  
**Status:** INTEGRATE_V3_2  
**Description:** Before an occurrence is used as evidence for a morphological claim, verify its exact formal identity: additions, gemination, voice, pronouns, relevant inflection, and high-impact construction features.  
**Impact:** Prevents false semantic generalization from morphological misclassification.  
**Trigger:** Any bare/derived-form comparison or operator claim.  
**Failure Mode:** A derived form is treated as the base form, producing a false root/form generalization.  
**Provenance:** BWA cycle (`تبوء` vs `تبوّءا`); reinforced by AMN (`أَمِنَ` vs `آمَنَ`) and SLM form stratification.  
**Related Rules:** R09, R18–R20, R69–R71.  
**Regression Test:** The analyst must establish the form distinction before using `أَمِنَ/آمَنَ` or `أَسْلَمَ/سَلَّمَ/استسلم` as operator evidence.

## R99 — CLAIMED-COVERAGE EVIDENCE GATE
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** A numerical corpus-coverage claim requires an auditable Evidence Matrix representing every occurrence counted in the numerator and denominator and its verification state.  
**Impact:** Separates real coverage from a query count or narrative claim.  
**Trigger:** Any `Corpus Coverage = X%`, `all occurrences`, or equivalent statement.  
**Failure Mode:** A tool count or sample is reported as complete coverage without occurrence-level evidence.  
**Provenance:** BWA/AMN methodology audits.  
**Related Rules:** R03–R06, R54–R56.  
**Regression Test:** `20/879 examined` must remain literal and must not be reported as full coverage regardless of diversity.

## R100 — POSITIVE-HYPOTHESIS COMPETITION GATE
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** Strong negative determination does not authorize immediate promotion of the first surviving abstraction. Generate genuinely competing positive hypotheses plus `C0`, each with predictions and falsification conditions.  
**Impact:** Prevents premature abstraction after conventional glosses are rejected.  
**Trigger:** A strong exclusion ledger with no positively discriminated core.  
**Failure Mode:** Several familiar glosses are rejected and one newly invented abstraction is accepted simply because it is the only positive candidate formulated.  
**Provenance:** BWA and AMN.  
**Related Rules:** R12, R16, R42, R57, R59, R67.  
**Regression Test:** Semantic Boundary is blocked if Stage 1 contains fewer than two genuine positive candidates plus `C0` when the evidence permits alternatives.

## R101 — STRUCTURAL-AMBIGUITY BEFORE DECISIVENESS
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** An occurrence MUST NOT be labeled decisive when its inferential force depends on an unverified parse, attachment, pronoun antecedent, ellipsis, scope, or other structurally material choice.  
**Impact:** Prevents a false Root Core built on one preferred parse.  
**Trigger:** Any high-information occurrence with a structurally consequential alternative.  
**Failure Mode:** `UNVERIFIED PARSE → FALSE DECISIVE CONTEXT → FALSE ROOT CORE`.  
**Provenance:** BWA 59:9; reinforced by AMN particle analysis.  
**Related Rules:** R10, R11, R18, R63, R64.  
**Regression Test:** Any decisive claim that depends on shared attachment must record material alternatives first.

## R102 — DECISIVE-CONTEXT ROBUSTNESS ACROSS PARSES
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** After plausible structural analyses are enumerated, test the decisive claim across them. If a reasonable parse removes the decisive force, downgrade the occurrence to `STRUCTURALLY_SENSITIVE_CANDIDATE`.  
**Impact:** Makes decisiveness depend on structural robustness.  
**Trigger:** More than one materially plausible parse for a high-information occurrence.  
**Failure Mode:** A context remains “decisive” although a reasonable alternate parse makes it merely indeterminate.  
**Provenance:** BWA methodology audit; codified in Blind Lab v2.  
**Related Rules:** R63, R64, R101.  
**Regression Test:** If Parse B changes `CONTRADICTS` to `INDETERMINATE`, the occurrence cannot retain `DECISIVE` without resolving Parse B.

## R103 — ARGUMENT-STRUCTURE ≠ ROOT CORE
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** A participant frame such as “entity + location/state” or “source + target” is not sufficient to identify a Root Core. The analysis must isolate the lexical property that distinguishes this relation from roots sharing the same frame.  
**Impact:** Prevents syntax/argument structure from masquerading as lexical identity.  
**Trigger:** Root proposals phrased mainly as participant relations.  
**Failure Mode:** `PARTICIPANT FRAME → MISTAKEN FOR LEXICAL IDENTITY`.  
**Provenance:** BWA; reinforced by RJL/AMN.  
**Related Rules:** R27–R31, R34, R42.  
**Regression Test:** A core that can describe several near-neighbor roots unchanged fails until a semantic residue is shown.

## R104 — CONSTRUCTIONAL-CONTRIBUTION SUBTRACTION
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** Before a semantic feature is assigned to the Root Core, subtract all contribution plausibly attributable to morphological form, particles, construction, argument semantics/roles, and context.  
**Impact:** Prevents constructional meaning from being deposited into the root.  
**Trigger:** Derived forms, particle constructions, semantically rich objects/arguments, and alternating valency/constructions.  
**Failure Mode:** A feature originating in `ب/ل/من`, a form operator, argument meaning, or construction is asserted as root meaning.  
**Provenance:** BWA; central in AMN; reinforced in SLM.  
**Related Rules:** R18–R25, R61, R68–R71.  
**Regression Test:** Representative local meanings must be displayed as `ROOT + FORM + PARTICLE/CONSTRUCTION + ARGUMENT ROLE + CONTEXT` with unresolved layers preserved as `UNKNOWN`.

## R105 — ABSTRACT-CORE OPERATIONALIZATION GATE
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** An abstract Root Core is not accepted merely because it is broad enough to fit the corpus. Its abstract terms must be converted into testable REQUIRED/EXCLUDED features, predictions, competitors, and a falsification condition.  
**Impact:** Prevents unfalsifiable rhetorical abstractions.  
**Trigger:** Core wording such as relation, structure, determination, realization, independence, transition, or other high-level abstractions.  
**Failure Mode:** `OVER-ABSTRACT CORE → UNIVERSAL COMPATIBILITY → ZERO DISTINCTIVENESS`.  
**Provenance:** BWA/RJL/AMN.  
**Related Rules:** R13–R15, R42, R65, R90.  
**Regression Test:** A core with no predicted failure case or lexical residue fails this Gate.

## R106 — ROOT-CORE PREDICTIVE CONTENT GATE
**Weight:** HIGH; blocking before lock  
**Status:** INTEGRATE_V3_2  
**Description:** A mature Root Core must constrain an occurrence or feature not used to build it. It must generate a prediction capable of failing rather than merely explaining observations post hoc.  
**Impact:** Gives operational content to falsification.  
**Trigger:** Transition from `QURAN_TESTED` toward lock eligibility.  
**Failure Mode:** A post-hoc model that accepts every possible outcome.  
**Provenance:** BWA/AMN.  
**Related Rules:** R16, R42, R57, R85.  
**Regression Test:** Withhold a suitable occurrence/feature, record the prediction, then reveal it; a core that constrained nothing has insufficient predictive content.

## R107 — CROSS-DERIVATION BRIDGE EVIDENCE GATE
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** When derivational branches appear semantically distant, SINGLE ROOT CORE does not license an invented abstraction. A testable semantic bridge must show how the invariant survives across the branches without semantic mutation.  
**Impact:** Prevents forced unification.  
**Trigger:** Materially distant nominal/verbal, physical/abstract, bodily/relational, or other derivational branches.  
**Failure Mode:** `SINGLE ROOT CORE PRESSURE → OVERGENERALIZED BRIDGE`.  
**Provenance:** RJL; reinforced by AMN and SLM hard branches.  
**Related Rules:** R07, R08, R26, R35, R42, R62.  
**Regression Test:** Shared spelling/root assignment is insufficient; the bridge must survive every branch and produce at least one negative prediction.

## R108 — LOCK ELIGIBILITY GATE
**Weight:** GOVERNANCE / CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** `LOCK_INTERNAL_RESULT` requires an explicit Lock Eligibility Report. Analyst conviction is insufficient.  
**Impact:** Makes lock auditable and separates a strong candidate from a lock-qualified result.  
**Trigger:** Request to transition from Semantic Boundary to lock.  
**Failure Mode:** A persuasive core is locked despite unaudited coverage, unresolved structural ambiguity, missing C0, weak differentiation, or hidden contradictions.  
**Minimum Conditions:** verified source isolation; auditable coverage claim; competing positive hypotheses + C0; negative ledger; hardest counterexample; structural ambiguity handled; abstract core operationalized; root/form/construction traceability; sufficient lexical differentiation for the intended claim; no hidden genuine contradiction; falsification/predictive condition.  
**Provenance:** Blind Lab Runbook/Master Prompt; reinforced by AMN/SLM.  
**Related Rules:** R16, R23, R27, R54–R57, R59–R73, R95–R107.  
**Regression Test:** Any blocking condition yields `LOCK_BLOCKED`, never a weakened implicit lock.
