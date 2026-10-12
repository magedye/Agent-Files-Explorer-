# فهرس القواعد الآمن للمختبر الأعمى

> يحتوي الهوية والوزن والوصف والزناد ونمط الفشل فقط. حُذفت الأمثلة الجذرية والنتائج السابقة وProvenance الدلالية منعًا للتلوث.

## R01 — منع المعنى المسبق (`ZERO-PRIOR-MEANING`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F01_SOURCE_AND_PRIOR
- **الوصف:** Start semantic discovery from `UNKNOWN`. A remembered, dictionary, exegetical, conventional, doctrinal, or model-internal meaning MUST NOT be used as the starting definition of a Quranic root or lexeme.
- **الزناد:** Any root/lexeme semantic analysis.
- **نمط الفشل:** The analyst starts with a known gloss and bends occurrences to fit it.

## R02 — الإفصاح عن تلوث المعرفة المسبقة (`PRIOR-CONTAMINATION DISCLOSURE`)
- **الوزن:** HIGH
- **العائلة:** F01_SOURCE_AND_PRIOR
- **الوصف:** A model cannot guarantee that it has forgotten a previously known meaning. If a candidate hypothesis matches a known prior, label it `PRIOR_CONTAMINATED` and require independent Quran-internal support.
- **الزناد:** A hypothesis resembles a remembered gloss, prior project result, dictionary meaning, or earlier conversation result.
- **نمط الفشل:** Claiming an inference was independently discovered when it may have been recalled.

## R03 — بوابة corpus أولًا (`CORPUS-FIRST GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** No root-core claim may be proposed before the required root corpus has been assembled.
- **الزناد:** Before `CANDIDATE_HYPOTHESIS`.
- **نمط الفشل:** Defining a root from one verse and then using the rest as confirmation.

## R04 — قاعدة التغطية الكاملة للجذور قليلة الورود (`LOW-FREQUENCY FULL COVERAGE RULE`)
- **الوزن:** HIGH
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** When the root has a small manageable corpus, 100% of confirmed occurrences MUST be examined before a root-core conclusion.
- **الزناد:** Small/limited root corpus.
- **نمط الفشل:** Omitting an inconvenient occurrence.

## R05 — قاعدة تغطية الجذور كثيرة الورود (`HIGH-FREQUENCY ROOT COVERAGE RULE`)
- **الوزن:** HIGH
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** For a large corpus, inspect at least 10 occurrences selected for maximal contextual, morphological, syntactic, and domain diversity. This is a minimum, not automatic sufficiency.
- **الزناد:** A root whose full corpus is impractical in the current task.
- **نمط الفشل:** Ten near-duplicate examples are treated as representative.

## R06 — قاعدة العينة الخصومية (`ADVERSARIAL SAMPLING RULE`)
- **الوزن:** HIGH
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** Sampling MUST seek occurrences most likely to break the hypothesis, not occurrences easiest to explain.
- **الزناد:** Any partial-corpus root analysis.
- **نمط الفشل:** Convenient sampling of supportive verses.

## R07 — وحدة corpus الجذر (`ROOT CORPUS UNITY RULE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** All explicit derivatives assigned to one root form one mandatory corpus by default, but the corpus MUST be stratified by form/pattern. Shared root/form assignment removes an easy separation excuse; it does not by itself prove the semantic bridge. Separation requires a compelling morphological/root-assignment argument, while unification requires independent bridge evidence.
- **الزناد:** Root-family construction or proposed homonymy/separation.
- **نمط الفشل:** Either excluding a hard branch because its form differs, or treating formal overlap as proof of one semantic bridge.

## R08 — مفهوم جذري واحد ثابت (`SINGLE ROOT CORE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** A confirmed single root has one invariant axial/basic/original Root Concept shared by its explicit derivatives. Forms, constructions, and contexts add layers or select realizations; they do not replace the core. The core MUST NOT be an unprincipled disjunction `A OR B` between unrelated features. Distant branches require a testable bridge; failure to establish it remains `UNKNOWN/C0`, not permission for semantic mutation.
- **الزناد:** Any semantic-core proposal or cross-branch bridge.
- **نمط الفشل:** Unrelated local meanings, or a disjunctive abstraction that fits every branch and predicts nothing.

## R09 — تغاير المبنى والمعنى (`FORM–MEANING COVARIANCE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Every linguistically meaningful change in form MUST be investigated for a corresponding semantic contribution. The contribution may be qualitative rather than simply “more meaning”. Form changes include pattern, additions, deletion, gemination, order, pronouns, number, gender, tense/aspect, voice, transitivity, and construction.
- **الزناد:** Any comparison of different forms/constructions.
- **نمط الفشل:** Two materially different forms are translated identically with no account of the structural difference.

## R10 — تحليل كل موضع مستقلًا (`INDEPENDENT OCCURRENCE ANALYSIS`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** Profile each occurrence independently before allowing another occurrence’s proposed meaning to control it.
- **الزناد:** Local occurrence profiling.
- **نمط الفشل:** Reading a verse through an interpretation imported from another verse.

## R11 — الملاحظة لا تساوي التفسير (`OBSERVATION ≠ INTERPRETATION`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Keep claim layers explicit: `OBSERVATION`, `CONSTRAINT`, `HYPOTHESIS`, `INFERENCE`, `EXTERNAL_EVIDENCE`, `RESULT/CONCLUSION`, `UNKNOWN`. Do not silently promote one layer to another.
- **الزناد:** Every material semantic claim.
- **نمط الفشل:** “The object is bones” becomes “therefore the verb means raise/assemble”.

## R12 — المجهول نتيجة صحيحة (`UNKNOWN IS VALID`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** `UNKNOWN` is a correct outcome when evidence cannot distinguish candidates. Never fill uncertainty with a familiar gloss.
- **الزناد:** Insufficient evidence or unresolved alternatives.
- **نمط الفشل:** Inventing a meaning because the system feels obliged to answer.

## R13 — المفهوم قبل المرادف (`CONCEPT BEFORE GLOSS`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Build the conceptual structure before choosing a one-word gloss. A root core may be a relational or multidimensional semantic bundle.
- **الزناد:** Root-core formulation.
- **نمط الفشل:** “Find one Arabic word that means this root” becomes the primary task.

## R14 — الحزمة الدلالية قبل المرادف الواحد (`SEMANTIC BUNDLE BEFORE SINGLE GLOSS`)
- **الوزن:** HIGH
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** When no single word preserves the invariant, retain a compact bundle of linked semantic features before compressing it into a gloss.
- **الزناد:** A single gloss loses important dimensions.
- **نمط الفشل:** One broad word erases contact/intensity/interaction distinctions.

## R15 — النواة الدنيا الكافية (`MINIMAL SUFFICIENT INVARIANT`)
- **الوزن:** HIGH
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** The core should be the smallest invariant structure that explains all confirmed derivatives without importing form-specific or context-specific detail.
- **الزناد:** Refining a provisional core.
- **نمط الفشل:** Core is either so broad that it explains almost any verb, or so narrow that it contains marital/physical specifics.

## R16 — بوابة الدحض (`FALSIFICATION GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** A hypothesis is not accepted because many occurrences fit. Intentionally attack it with the hardest occurrence and a stated failure condition.
- **الزناد:** Before `PROVISIONALLY_ACCEPTABLE`.
- **نمط الفشل:** Counting only supporting verses.

## R17 — التناقض لا يساوي عدم الحسم (`CONTRADICTION ≠ INDETERMINATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Classify occurrence tests as `SUPPORTS`, `COMPATIBLE`, `INDETERMINATE`, or `CONTRADICTS`. Lack of proof is not contradiction. A genuine Root Concept contradiction is more serious than multiple indeterminate cases.
- **الزناد:** Occurrence-by-occurrence hypothesis testing.
- **نمط الفشل:** Treating uncertainty as disproof or calling a contradiction “unclear” to save the model.

## R18 — فصل الجذر والصيغة والنحو والسياق (`ROOT`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Diagnose every apparent mismatch by layer: `ROOT CONCEPT → MORPHOLOGICAL FORM → SYNTAX/CONSTRUCTION → CONTEXTUAL REALIZATION → UTTERANCE MEANING`.
- **الزناد:** Any resistance or semantic mismatch.
- **نمط الفشل:** A form-specific effect is mistaken for a new root meaning.

## R19 — الصرف يعدل الحدث لا النواة (`MORPHOLOGY MODIFIES THE EVENT, NOT THE ROOT CORE`)
- **الوزن:** HIGH
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Morphology changes event structure, participant roles, intensity, aspect, causation, reciprocity, or related layers while preserving the invariant root core.
- **الزناد:** Cross-form comparison.
- **نمط الفشل:** Assigning unrelated core meanings to derived patterns.

## R20 — طبقات الاشتقاق (`DERIVATIONAL LAYERING`)
- **الوزن:** HIGH
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Preferred order when evidence permits: `ATTESTED ROOT FAMILY / LEAST-MARKED EVIDENCE → ROOT CORE CANDIDATE → FORM OPERATOR CANDIDATE → PARTICLE/CONSTRUCTION → ARGUMENT SEMANTICS → CONTEXT → LOCAL MEANING`. Do not define a marked form first and project its gloss backward into the root.
- **الزناد:** Any full interpretation or derived-form analysis.
- **نمط الفشل:** A local or marked-form paraphrase is treated as the root definition.

## R21 — السياق يختار ولا يعيد التعريف (`CONTEXT SELECTS, IT DOES NOT REDEFINE`)
- **الوزن:** HIGH
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Context selects a face/realization of the invariant Root Concept and contributes local detail; it does not replace the core with an unrelated meaning.
- **الزناد:** Contextual interpretation.
- **نمط الفشل:** “In marriage the root means rebellion; in bones it means raise” with no invariant bridge.

## R22 — تركيب معنى الملفوظ (`UTTERANCE MEANING COMPOSITION`)
- **الوزن:** HIGH
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** The speaker’s local meaning is composed from Root Concept + morphology + syntax/construction + particles/relations + context.
- **الزناد:** Producing a verse-level interpretation.
- **نمط الفشل:** Translating the root core directly as the whole clause.

## R23 — بوابة تتبع النواة (`ROOT-TRACEABILITY GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Every proposed local meaning MUST be traceable backward through context, syntax, and morphology to the invariant Root Concept without an unexplained semantic jump.
- **الزناد:** Before accepting any `LOCAL_MEANING`.
- **نمط الفشل:** A local gloss cannot show how it derives from the root core.

## R24 — منع التحور الدلالي (`NO-SEMANTIC-MUTATION RULE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Form and context may specify, intensify, weaken, distribute, temporalize, causalize, or relationally realize the core, but MUST NOT mutate it into a concept of a different semantic kind.
- **الزناد:** Any context-specific paraphrase.
- **نمط الفشل:** Unexplained jumps between unrelated semantic domains.

## R25 — اختبار النزع العكسي (`REVERSE-STRIPPING TEST`)
- **الوزن:** HIGH
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Strip local layers in reverse: remove context-specific detail, construction, morphology, and affixes; compare the remaining invariant across derivatives.
- **الزناد:** Refining a candidate core.
- **نمط الفشل:** The proposed common remainder disappears when local layers are removed.

## R26 — اختبار ثبات النواة عبر الاشتقاقات (`CROSS-DERIVATION INVARIANCE TEST`)
- **الوزن:** HIGH
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Test whether the same core remains recognizable across noun/verb/verbal noun, transitive/intransitive, physical/abstract, and other derivational contrasts.
- **الزناد:** Before high confidence.
- **نمط الفشل:** A core only works in one derivational form.

## R27 — التفريد الدلالي وعدم الترادف التام (`LEXICAL DISTINCTIVENESS`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** Consistency across occurrences is necessary but not sufficient. The extracted Root Concept must be lexically distinctive and MUST NOT collapse into a complete identity with another Quranic lexeme. Different Quranic forms are presumed to carry meaningful distinctions unless strong evidence shows only contextual functional convergence.
- **الزناد:** After a provisional core survives the corpus.
- **نمط الفشل:** The definition could be copied unchanged as the full definition of another Quranic word.

## R28 — الأصل عدم الترادف التام (`NO PERFECT SYNONYMY AS DEFAULT`)
- **الوزن:** HIGH
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** Do not assume perfect Quranic synonymy. Large overlap is possible, and two words can be functionally equivalent in one local context, but full lexical identity requires exceptional evidence.
- **الزناد:** Comparing near-synonyms.
- **نمط الفشل:** “X and Y mean exactly the same everywhere” without proof.

## R29 — التفريق عن أقرب لفظ (`NEAREST-LEXEME DIFFERENTIATION`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** After a root core becomes provisionally acceptable, compare it with the nearest Quranic lexemes and state the smallest qualitative difference that explains the lexical choice.
- **الزناد:** Before `HIGH_CONFIDENCE`.
- **نمط الفشل:** No attempt to distinguish the core from its closest Quranic neighbors.

## R30 — اختبار البقية الدلالية (`SEMANTIC-RESIDUE TEST`)
- **الوزن:** HIGH
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** Subtract the semantic territory already covered by the nearest competing lexeme; the remaining discriminating feature is a candidate component of lexical identity.
- **الزناد:** Overlap with a near lexeme.
- **نمط الفشل:** Shared meaning is mistaken for the unique core.

## R31 — اختبار الاستبدال المضاد (`COUNTERFACTUAL-SUBSTITUTION TEST`)
- **الوزن:** HIGH
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** Mentally substitute the closest Quranic alternative into the construction and ask what semantic or functional property is lost or changed.
- **الزناد:** Lexical differentiation.
- **نمط الفشل:** Substitution changes nothing because the proposed core is too broad.

## R32 — بوابة التصادم اللفظي (`LEXICAL COLLISION GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** Before `HIGH_CONFIDENCE`, verify that the Root Concept does not fully collide with the concept of another Quranic lexeme. If it does, refine the core or keep the result unresolved.
- **الزناد:** Final root-core approval.
- **نمط الفشل:** A “final” core is semantically indistinguishable from another lexical item.

## R33 — حياد الإطار المرجعي (`REFERENCE-FRAME NEUTRALITY`)
- **الوزن:** HIGH
- **العائلة:** F99_CROSS_CUTTING
- **الوصف:** Do not preselect the semantic axis (up/down, near/far, motion/rest, union/separation, etc.). Infer the relevant relation from the corpus.
- **الزناد:** Early hypothesis generation.
- **نمط الفشل:** Selecting “vertical height” because one nearby word is “raise”.

## R34 — اختبار الدلالة العلائقية (`RELATIONAL-SEMANTICS CHECK`)
- **الوزن:** HIGH
- **العائلة:** F99_CROSS_CUTTING
- **الوصف:** When occurrences repeatedly involve multiple participants/parts, test whether the root describes a relation among them rather than movement or state of one isolated element.
- **الزناد:** Multi-participant corpus.
- **نمط الفشل:** Treating a relational event as simple movement.

## R35 — ثبات النواة بين المادي والعلاقاتي (`PHYSICAL–RELATIONAL INVARIANT`)
- **الوزن:** HIGH
- **العائلة:** F99_CROSS_CUTTING
- **الوصف:** If the root occurs in physical and emotional/social domains, preserve one abstract invariant that can realize in both; do not create separate unrelated dictionary meanings.
- **الزناد:** Domain shift in the corpus.
- **نمط الفشل:** Creating unrelated domain-specific dictionary meanings instead of testing one invariant.

## R36 — نمذجة الانتقال بين الحالات (`STATE-TRANSITION MODELING`)
- **الوزن:** MEDIUM
- **العائلة:** F99_CROSS_CUTTING
- **الوصف:** Model each occurrence as `STATE BEFORE → TARGET EVENT/STATE → STATE AFTER`, where the text supports such a transition.
- **الزناد:** Sequential, physical, spatial, or process-like contexts.
- **نمط الفشل:** Jumping from event to gloss without describing the state change.

## R37 — البحث عن محور التقابل (`CONTRAST-AXIS SEARCH`)
- **الوزن:** HIGH
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** When two items are structurally contrasted, search for the shared semantic axis on which they differ rather than interpreting each in isolation.
- **الزناد:** Parallel contrast, alternatives, opposite instructions, or paired states.
- **نمط الفشل:** BACKFILL_REQUIRED

## R38 — عدم التكرار البنيوي (`STRUCTURAL NON-REDUNDANCY`)
- **الوزن:** HIGH
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** When `X` and `Y` occupy the same grammatical alternative slot (e.g., `X أو Y`), an analysis that makes them nearly redundant requires strong evidence.
- **الزناد:** Coordination/alternative structures.
- **نمط الفشل:** Collapsing two explicitly contrasted lexemes into near-total synonymy.

## R39 — بوابة الجار التقابلي (`CONTRASTIVE-NEIGHBOR GATE`)
- **الوزن:** HIGH
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** Do not define target `X` using a prior meaning of neighboring `Y`. If the distinction is decisive, analyze `Y` independently under the same method before using it as a comparator.
- **الزناد:** X/Y contrast drives the argument.
- **نمط الفشل:** Defining one contrasted lexeme solely from a prior meaning assigned to its neighbor.

## R40 — المجاورة لا تعني الترادف (`ADJACENCY ≠ SYNONYMY`)
- **الوزن:** HIGH
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** A nearby word, rhetorical echo, or later result does not define the target root.
- **الزناد:** A tempting nearby lexical cue.
- **نمط الفشل:** Treating a nearby rhetorical echo or result as a synonymic definition.

## R41 — النتيجة ليست المفهوم الجذري (`RESULT ≠ ROOT CONCEPT`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** A physical or contextual result of performing the action is not necessarily the root core.
- **الزناد:** A visible outcome tempts direct glossing.
- **نمط الفشل:** Treating a visible consequence of an action as the invariant root concept.

## R42 — بوابة التحديد التفسيري (`EXPLANATORY SPECIFICITY GATE`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** A candidate must distinguish the root from generic concepts and nearest Quranic neighbors. It MUST generate at least one negative prediction and preserve a lexical semantic residue beyond participant frame or near-neighbor overlap.
- **الزناد:** A candidate fits everything too easily or uses generic words such as relation/change/action/state.
- **نمط الفشل:** A core explains every occurrence but excludes nothing and collapses into another lexeme.

## R43 — قيد المراحل المتعاقبة (`SEQUENTIAL-STAGE CONSTRAINT`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** In `A ثم B` or another explicit stage sequence, treat A and B as distinct ordered stages and use that distinction to constrain meaning.
- **الزناد:** Explicit temporal/process sequencing.
- **نمط الفشل:** Equating an earlier target event with a distinct later stage in an explicit sequence.

## R44 — العلاج أو الحل لا يعرّف الحالة (`REMEDY/RESOLUTION ≠ DEFINITION`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** A remedy, response, or condition that ends a state does not automatically define the state or prove lexical antonymy.
- **الزناد:** A verse provides actions after naming a condition.
- **نمط الفشل:** Treating a resolving condition as the lexical definition of the preceding state.

## R45 — اختبار انسجام التدبير (`REMEDIAL COHERENCE TEST`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** Although a remedy does not define the condition, functional coherence between proposed condition and response may strengthen or weaken hypotheses.
- **الزناد:** Competing root/local-meaning hypotheses predict different response logic.
- **نمط الفشل:** Ignoring that a proposed meaning makes the response sequence unnecessarily incoherent.

## R46 — فصل الشحنة القيمية عن الجذر (`ROOT POLARITY SEPARATION`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** Do not copy moral, positive, or negative polarity from one context into the invariant root core unless the full corpus requires it.
- **الزناد:** A root appears in morally loaded and neutral contexts.
- **نمط الفشل:** Importing local moral polarity into the invariant root core.

## R47 — منع هيمنة المجال (`NO DOMAIN DOMINANCE`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** The socially, legally, or traditionally famous domain of a word MUST NOT dominate root-core extraction.
- **الزناد:** One domain is much more familiar than others.
- **نمط الفشل:** Allowing the most famous domain to dominate before cross-domain occurrences are analyzed.

## R48 — عدم يقين إسناد الجذر (`ROOT_ASSIGNMENT_UNCERTAIN`)
- **الوزن:** HIGH
- **العائلة:** F01_SOURCE_AND_PRIOR
- **الوصف:** If assigning a form to a root is morphologically disputed, mark it `ROOT_ASSIGNMENT_UNCERTAIN` and do not let it support or contradict the core until the assignment is resolved sufficiently.
- **الزناد:** Competing plausible root analyses.
- **نمط الفشل:** A disputed form is treated as decisive corpus evidence.

## R49 — سلطة نص حفص ومصحف المدينة (`HAFS–MADINAH CANONICAL TEXT AUTHORITY`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F01_SOURCE_AND_PRIOR
- **الوصف:** Quranic semantic analysis in this Skill uses **Hafs `an Asim only, with the Madinah Mushaf as the canonical reading/text profile**. Other qira'at are outside the semantic evidence scope of this profile.
- **الزناد:** Canonicalization and quotation verification.
- **نمط الفشل:** Introducing another reading as semantic evidence in this profile.

## R50 — منع الاعتماد الدلالي على التفاسير (`NO TAFSIR DEPENDENCY`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F01_SOURCE_AND_PRIOR
- **الوصف:** Tafsir is excluded from semantic discovery, hypothesis generation, ranking, falsification, lock eligibility, confidence, and registry adoption. It MUST NOT be used as evidence for the Root Core or local lexical meaning. After a valid lock and only on explicit owner request, tafsir may be examined in a separate non-governing historical/interpretive appendix under `POST-LOCK INTERPRETIVE REVIEW POLICY`.
- **الزناد:** Any attempt to retrieve or cite tafsir in or around a semantic analysis.
- **نمط الفشل:** Using exegetical authority to establish, confirm, correct, enrich, or reject a lexical meaning.

## R51 — إنفاذ السيادة الدلالية القرآنية الداخلية (`QURAN-INTERNAL SEMANTIC SOVEREIGNTY ENFORCEMENT`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F01_SOURCE_AND_PRIOR
- **الوصف:** Quranic semantic meaning is discovered and tested from the Quran-internal corpus only. Tafsir, dictionaries, hadith, poetry, inherited usage/terminology, translations, glosses, synonym lists, WordNet/WSD labels, and model-remembered meanings MUST NOT serve as semantic evidence, confirmation, enrichment, correction, tie-breaker, or hypothesis source at any stage. A separate owner-requested historical/comparative or interpretive review is outside the semantic pipeline, begins only after lock, follows the dedicated policy, and cannot revise or validate the internal result.
- **الزناد:** Any attempt to introduce external/inherited semantic material.
- **نمط الفشل:** External authority supplies or confirms the target meaning.

## R52 — فرضية الحدس الصوتي وترتيب الحروف (`PHONIC/ORDER INTUITION HYPOTHESIS`)
- **الوزن:** SUPPORTING / HYPOTHESIS
- **العائلة:** F10_SUPPORTING_HYPOTHESES
- **الوصف:** The articulatory/acoustic qualities of letters and their order may offer a natural intuitive clue to the Root Concept and may support the view that Arabic wording can disclose aspects of meaning through its own form. This is a hypothesis-generation/enrichment channel, not governing proof.
- **الزناد:** After or alongside internal hypothesis generation, never as sole proof.
- **نمط الفشل:** Inventing a sound story after the desired meaning is already chosen.

## R53 — فرضية دلالة التشديد على التكثيف (`GEMINATION/SHADDA INTENSIFICATION HYPOTHESIS`)
- **الوزن:** SUPPORTING / HYPOTHESIS
- **العائلة:** F10_SUPPORTING_HYPOTHESES
- **الوصف:** Gemination/shadda is a form change and may correlate with pressure, force, intensification, compression, recurrence, or another strengthened realization of the root concept. The exact contribution must be learned from usage and MUST NOT be assumed universally.
- **الزناد:** Geminated vs non-geminated forms.
- **نمط الفشل:** “Every shadda always means more force” asserted without corpus testing.

## R54 — تغطية corpus (`CORPUS COVERAGE`)
- **الوزن:** HIGH
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** `Corpus Coverage = examined confirmed occurrences / total confirmed occurrences in the declared root corpus`. This is a factual percentage and MUST NOT be inflated because the sample is diverse.
- **الزناد:** Every root analysis.
- **نمط الفشل:** BACKFILL_REQUIRED

## R55 — تغطية تنوع السياقات (`CONTEXT DIVERSITY COVERAGE`)
- **الوزن:** HIGH
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** Report how well the examined set covers distinct contextual, morphological, syntactic, participant, and domain patterns found in the corpus. Keep this separate from raw occurrence coverage.
- **الزناد:** Partial corpus or multi-domain root.
- **نمط الفشل:** A 10% sample is called “70% coverage” because it was diverse.

## R56 — المتانة الدلالية (`SEMANTIC ROBUSTNESS`)
- **الوزن:** HIGH
- **العائلة:** F09_LOCK_AND_OUTPUT
- **الوصف:** Semantic Robustness is an ordinal assessment of how strongly the proposed core survives the examined evidence, alternatives, and falsification. It is reported separately from Corpus Coverage and Context Diversity, but may be influenced by them. It is not a probability.
- **الزناد:** Reporting a provisional or strong Root Core candidate.
- **نمط الفشل:** Converting sample count into a probability-like confidence number or calling reported metrics causally independent.

## R57 — دورة حياة الفرضية (`HYPOTHESIS LIFECYCLE`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** Use explicit states: `UNKNOWN → CANDIDATE_HYPOTHESIS → QURAN_TESTED → PROVISIONALLY_ACCEPTABLE → ENRICHED → HIGH_CONFIDENCE`, with `CONTRADICTED → REVISE/REJECT`.
- **الزناد:** Any semantic hypothesis.
- **نمط الفشل:** Candidate wording is reported as settled meaning.

## R58 — سجل القواعد الرسمي (`FORMAL-RULE REGISTRY`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Every formal Rule/Gate MUST preserve at least: Name; Description; Weight; Impact; Trigger; Failure Mode; and canonical Status. Provenance, Related Rules, Examples, Regression Test, and Generalization Scope are required before promotion to `REGRESSION_BACKED`; legacy entries lacking them are marked `BACKFILL_REQUIRED` in the machine-readable registry rather than silently treated as complete.
- **الزناد:** Adding, refining, or promoting methodology.
- **نمط الفشل:** A local lesson becomes an unscoped universal rule or is lost in discussion.

## R59 — النفي قبل تحديد المعنى (`NEGATIVE DETERMINATION`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** A root analysis may conclusively reject a candidate core before the correct positive core is fully identified. Negative determination is an independent scientific result.
- **الزناد:** A candidate claims to be the invariant core and a decisive confirmed occurrence makes that claim impossible or illicitly forced.
- **نمط الفشل:** “We cannot reject X until we know the exact correct meaning.”

## R60 — سجل الاستبعادات الدلالية (`SEMANTIC EXCLUSION LEDGER`)
- **الوزن:** HIGH
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** Maintain rejected candidates with candidate, status, decisive evidence, logical rule, confidence, reopen condition, and mandatory `rejection_scope`, such as `REJECTED_AS_ROOT_CORE`, `REJECTED_AS_FORM_CONTRIBUTION`, `REJECTED_IN_CONSTRUCTION_X`, or `REJECTED_AS_LOCAL_MEANING`.
- **الزناد:** Any candidate is falsified or excluded.
- **نمط الفشل:** A rejected Root Core is reintroduced, or a root-level rejection is misread as prohibition of every local gloss.

## R61 — فصل النواة عن التحقق الموضعي (`ROOT CORE ≠ LOCAL REALIZATION`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** The invariant Root Core is distinct from a context-specific realization produced after morphology, construction, particles, participant roles, and context are applied.
- **الزناد:** Any apparently familiar local meaning such as obligation, writing, rebellion, contract, or withdrawal.
- **نمط الفشل:** `كتب عليكم` → “therefore كتب = obligation.”

## R62 — تنوع التحققات بلا تحور النواة (`REALIZATION DIVERSITY WITHOUT CORE MUTATION`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** A single invariant core may have widely different physical, relational, legal, or abstract realizations. Diversity of realization does not license multiple unrelated root meanings.
- **الزناد:** Same root appears across distant domains.
- **نمط الفشل:** Assigning one root meaning per domain because local paraphrases differ.

## R63 — مبدأ السياق الحاسم (`DECISIVE CONTEXT PRINCIPLE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** Contexts are weighted by information gain. A context may receive `DECISIVE` status only after material structural alternatives are recorded and it passes R101/R102 robustness requirements.
- **الزناد:** Ranking occurrences or labeling one decisive/governing.
- **نمط الفشل:** A famous or structurally sensitive verse is called decisive without robustness.

## R64 — وزن كسب المعلومات (`INFORMATION-GAIN WEIGHTING`)
- **الوزن:** HIGH
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** Weight evidence by how much it reduces viable hypotheses, not merely by occurrence count.
- **الزناد:** Choosing contexts for a high-frequency root or comparing evidence strength.
- **نمط الفشل:** Frequency voting.

## R65 — حدود ما يمكن وما لا يمكن أن يعنيه (`CAN-MEAN`)
- **الوزن:** HIGH
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** Report semantic boundaries as `REQUIRED`, `PERMITTED`, `EXCLUDED`, and `UNKNOWN` features, not only a single gloss.
- **الزناد:** Any provisional Root Core.
- **نمط الفشل:** Forcing one polished sentence to hide boundary uncertainty.

## R66 — الدليل السلبي الحاسم (`DECISIVE NEGATIVE EVIDENCE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** One confirmed decisive occurrence can reject a universal Root Core candidate even if it does not identify the correct alternative.
- **الزناد:** A candidate claims invariance across the root corpus.
- **نمط الفشل:** Saving a candidate by labeling the decisive counterexample “special” without a general rule.

## R67 — عدم تماثل الثقة الدلالية (`ASYMMETRIC SEMANTIC CERTAINTY`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** Confidence in rejecting a candidate may legitimately be much higher than confidence in the current positive core. Report them separately.
- **الزناد:** Strong falsification but incomplete positive differentiation.
- **نمط الفشل:** Lowering a decisive rejection merely because the positive core is still provisional.

## R68 — سلسلة اشتقاق المعنى الموضعي (`CORE-TO-REALIZATION DERIVATION CHAIN`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Every local meaning must expose: `ROOT CORE + FORM OPERATOR + PARTICLE/CONSTRUCTION + ARGUMENT SEMANTICS/ROLE + CONTEXTUAL FACE = LOCAL MEANING`. Any unresolved layer remains `UNKNOWN`.
- **الزناد:** Any local gloss or verse interpretation.
- **نمط الفشل:** A local meaning is asserted with no traceable layer attribution.

## R69 — ثبات مساهمة العامل الصرفي (`MORPHOLOGICAL OPERATOR INVARIANCE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** A recurring morphological form/pattern is investigated under a one-invariant-contribution hypothesis across roots. This methodological principle does not establish any concrete operator value. Every concrete value carries an evidence scope label.
- **الزناد:** Interpreting a derived pattern or comparing the same form across roots.
- **نمط الفشل:** The form is assigned unrelated ad-hoc meanings, or one root-local value is universalized.

## R70 — مساهمة الصيغة لا تساوي مساهمة الجذر (`MORPHOLOGICAL CONTRIBUTION ≠ ROOT CONTRIBUTION`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** Explicitly separate root contribution from form contribution and label the operator claim scope: `LOCAL_CONSTRUCTION | ROOT_INTERNAL | CROSS_ROOT_SUPPORTED | CORPUS_WIDE_SUPPORTED | REGRESSION_BACKED`.
- **الزناد:** Derived forms, voice, transitivity, gemination, number, tense/aspect, etc.
- **نمط الفشل:** A form-specific effect is stored as root meaning or described at broader scope than evidence supports.

## R71 — اختبار الصيغة عبر الجذور (`CROSS-ROOT FORM TEST`)
- **الوزن:** HIGH
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** Infer a form contribution by comparing the same form across deliberately diverse roots, subtracting root-specific cores, testing competing operator hypotheses, and recording claim scope.
- **الزناد:** Form semantics are uncertain or proposed beyond one root.
- **نمط الفشل:** Defining a pattern from one root or from inherited school glosses.

## R72 — افتراض البيان والاستقرار (`BAYAN/STABILITY ASSUMPTION`)
- **الوزن:** HIGH
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** Expect non-arbitrary semantic stability in roots, forms, particles, and recurring constructions, while treating each concrete operator value as an empirical hypothesis. Stability does not override corpus contradiction.
- **الزناد:** The same operator receives unrelated explanations across contexts/roots.
- **نمط الفشل:** Either arbitrary operator polysemy or forced invariance despite contradiction.

## R73 — الخلاصة تتضمن المستبعدات (`SUMMARY MUST INCLUDE EXCLUSIONS`)
- **الوزن:** HIGH
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** A mature root-analysis summary must state the current core candidate, what the root cannot mean as a shared core, decisive evidence for each exclusion, the rule/gate used, and unresolved questions.
- **الزناد:** Final/provisional root report.
- **نمط الفشل:** Reporting only the favored definition.

## R74 — السياق الحاسم المرجعي للذات (`SELF-REFERENTIAL DECISIVE CONTEXT`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** When actor and target/related participant collapse to the same referent, hypotheses that require two independent parties are sharply constrained or rejected.
- **الزناد:** A construction in which normally separate semantic roles collapse into one referent.
- **نمط الفشل:** Inventing an external obligor/obligee to save a two-party definition.

## R75 — اختبار انهيار الأدوار (`ROLE-COLLAPSE TEST`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** Re-test every candidate when semantic roles collapse into one referent; the candidate must still work naturally without fabricated participants.
- **الزناد:** Reflexive/self-referential constructions.
- **نمط الفشل:** Candidate works only after splitting one referent into artificial roles.

## R76 — اختبار الموضوع المجرد الحاسم (`ABSTRACT-OBJECT DECISIVE TEST`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** A confirmed abstract-object use is decisive against making a physical instrument or physical manifestation the invariant Root Core.
- **الزناد:** Root applies to abstract content/state without required material medium.
- **نمط الفشل:** Pen, ink, surface, or physical inscription is made necessary for the root.

## R77 — ثبات التركيب عبر المشاركين (`CONSTRUCTIONAL INVARIANT ACROSS PARTICIPANTS`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F05_NEGATIVE_AND_DECISIVE
- **الوصف:** When the same root+construction recurs with different participants, extract the stable constructional contribution across participant changes.
- **الزناد:** Repeated structures such as `كتب + على` with self vs others.
- **نمط الفشل:** Participant-specific interpretation is assigned to the construction itself.

## R78 — التحقق الإلزامي ليس النواة (`DEONTIC REALIZATION ≠ ROOT CORE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** Obligation/requirement in some `كتب + على` contexts is a possible deontic local realization, not automatically the invariant Root Core.
- **الزناد:** Legislative occurrences.
- **نمط الفشل:** “كتب means impose/oblige” based only on legislation.

## R79 — من الحركة التحليلية إلى قاعدة رسمية (`ANALYTICAL MOVE → FORMAL RULE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Any analytical move that materially improves accuracy or prevents a recurring failure must be generalized into a named Rule/Gate rather than left as discussion prose.
- **الزناد:** A correction, decisive inference, or repeated successful diagnostic.
- **نمط الفشل:** Same mistake recurs because the lesson was never formalized.

## R80 — المبدأ قبل المثال (`PRINCIPLE BEFORE EXAMPLE`)
- **الوزن:** HIGH
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Extract the general principle that makes an example informative, then preserve the example as illustration/regression.
- **الزناد:** A particularly strong verse/example teaches a reusable lesson.
- **نمط الفشل:** Example is stored without transferable logic.

## R81 — أصل القاعدة (`RULE PROVENANCE`)
- **الوزن:** HIGH
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Every formal Rule/Gate should record or preserve its origin case, failure prevented, related rules, example(s), regression test, and status where practical.
- **الزناد:** Adding/updating a rule.
- **نمط الفشل:** Rules accumulate without knowing why they exist.

## R82 — وزن أثر القاعدة (`RULE IMPACT WEIGHTING`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Rules are weighted by the effect of violation: `CONSTITUTIONAL/CRITICAL`, `HIGH`, `MEDIUM`, `SUPPORTING/HYPOTHESIS`. Higher-impact rules take precedence in constrained analysis.
- **الزناد:** Rule registration or conflict.
- **نمط الفشل:** A supporting intuition overrides corpus/falsification controls.

## R83 — تصميم القاعدة من نمط الفشل (`FAILURE-MODE-DRIVEN RULE DESIGN`)
- **الوزن:** HIGH
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Each rule should identify the concrete failure pattern it prevents, not only describe ideal behavior.
- **الزناد:** Creating/revising a rule.
- **نمط الفشل:** Vague guidance with no detectable violation.

## R84 — عمّم بلا إفراط (`GENERALIZE WITHOUT OVERGENERALIZING`)
- **الوزن:** HIGH
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Generalize only as far as evidence supports. Every root-local operator/rule claim MUST state `generalization_scope` and promotion evidence. New rules may begin `PROPOSED/PROVISIONAL` and advance after independent regression success.
- **الزناد:** Promotion of a local observation, Rule/Gate, particle value, or form value.
- **نمط الفشل:** One example becomes a claim about all Quranic Arabic.

## R85 — شرط اختبار الانحدار (`RULE REGRESSION REQUIREMENT`)
- **الوزن:** HIGH
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Important rules should have one or more regression cases, including a must-pass and preferably a must-fail path.
- **الزناد:** Rule reaches `AGREED` or higher.
- **نمط الفشل:** Rule exists only in prose and is never tested.

## R86 — من سجل الاكتشاف إلى سجل القواعد (`DISCOVERY LOG → RULE REGISTRY`)
- **الوزن:** HIGH
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Distinguish provisional discoveries from owner-agreed formal rules. Suggested lifecycle: `OBSERVED → PROPOSED_RULE → AGREED → REGRESSION_BACKED → weighted formal status`.
- **الزناد:** Methodology discussion.
- **نمط الفشل:** Hypothesis and rule status are conflated.

## R87 — فحص اتساق القواعد (`RULE CONSISTENCY CHECK`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Every new rule must be checked against existing constitutional controls before admission; conflicts require explicit revision rather than silent coexistence.
- **الزناد:** Adding/updating a rule.
- **نمط الفشل:** A new rule permits what ZERO-PRIOR-MEANING or SINGLE ROOT CORE forbids.

## R88 — قيمة المنهج أعلى من الجواب المحلي (`METHOD VALUE > LOCAL ANSWER`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** The project values reusable methodological improvement above merely solving one lexical item. Successful or failed analyses must be mined for transferable rules before moving on.
- **الزناد:** Completion/correction of an analysis.
- **نمط الفشل:** Good local answer but no retained lesson.

## R89 — بوابة التصادم اللفظي في الآية نفسها (`SAME-VERSE LEXICAL COLLISION GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** Independent co-occurrence of the target and a proposed perfect synonym strongly supports non-identity. It does **not** by itself identify the positive semantic residue; positive differentiation requires independent corpus evidence or a separate discriminating test.
- **الزناد:** Candidate synonym co-occurs independently with target.
- **نمط الفشل:** Either `كتب = جمع`, or “therefore the difference must be X” without evidence.

## R90 — المكوّن اللازم ليس النواة المعرّفة (`NECESSARY COMPONENT ≠ DEFINING CORE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F06_LEXICAL_IDENTITY
- **الوصف:** A property may be necessary to a root model without being sufficient to define its lexical identity.
- **الزناد:** Candidate such as collect, bind, move, or fix explains part of the pattern.
- **نمط الفشل:** “K-T-B involves collection, therefore K-T-B = collect.”

## R91 — الربط المعياري لا يساوي الربط البنيوي (`NORMATIVE BINDING ≠ STRUCTURAL BINDING`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** Distinguish legal/deontic obligation from the more general structural binding/constraint of elements in a system. Normative obligation may be a local realization rather than the invariant core.
- **الزناد:** Root appears in both legal and non-legal contexts.
- **نمط الفشل:** Every binding relation is paraphrased as legal obligation.

## R92 — اختبار حياد المحتوى الكاذب (`FALSE-CONTENT NEUTRALITY TEST`)
- **الوزن:** HIGH
- **العائلة:** F99_CROSS_CUTTING
- **الوصف:** If the root applies to false, corrupt, or illegitimate content, truth, authority, legitimacy, or correctness cannot be invariant Root Core requirements.
- **الزناد:** Confirmed false-content occurrence.
- **نمط الفشل:** “What is written is inherently authoritative/true.”

## R93 — الحدث اللاحق ليس النواة (`DOWNSTREAM EVENT ≠ ROOT CORE`)
- **الوزن:** HIGH
- **العائلة:** F99_CROSS_CUTTING
- **الوصف:** A later purpose/result/event in the same clause or verse must not be equated with the target Root Core merely because it follows from it.
- **الزناد:** Purpose/result clauses such as `لـ`, `ثم`, consequence statements.
- **نمط الفشل:** `كتب ... ليجمعنكم` → “therefore كتب = جمع.”

## R94 — التحقق الأداتي ليس النواة (`INSTRUMENTAL REALIZATION ≠ ROOT CORE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F99_CROSS_CUTTING
- **الوصف:** A physical instrument or material realization used in some occurrences must not be promoted to Root Core when the root is confirmed in non-instrumental/abstract contexts.
- **الزناد:** Root has both material and abstract uses.
- **نمط الفشل:** Physical writing is treated as the root itself.

## R95 — سجل التعريفات الدلالية (`SEMANTIC DEFINITION REGISTRY`)
- **الوزن:** HIGH
- **العائلة:** F08_GOVERNANCE_AND_REGISTRIES
- **الوصف:** Preserve formally tracked definitions in a versioned registry with status, boundaries, decisive/structurally sensitive contexts, rejected alternatives and scope, local realizations, coverage/confidence, provenance, reopen condition, and regressions. Governance separation is mandatory: `LOCK_INTERNAL_RESULT ≠ OWNER_ACCEPTANCE ≠ REGISTRY_ADOPTION`.
- **الزناد:** A locked result is prepared for owner review or a stored definition is revised.
- **نمط الفشل:** Chat-only definitions, pre-lock leakage, or automatic promotion from lock to AGREED.

## R96 — بوابة عزل مصادر المختبر الأعمى (`BLIND SOURCE ISOLATION GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F01_SOURCE_AND_PRIOR
- **الوصف:** A run MUST NOT be described as blind unless source isolation is verifiable through a pinned manifest of allowed and blocked sources. Prompt-level instructions to “ignore priors” are insufficient if semantic priors remain accessible.
- **الزناد:** Start of any blind root/lexeme rediscovery run.
- **نمط الفشل:** A result is described as independently discovered even though registry definitions, prior analyses, translations, or other semantic priors were accessible.

## R97 — تجميد المنهج أثناء التشغيل الأعمى (`FROZEN METHODOLOGY DURING BLIND RUN`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F01_SOURCE_AND_PRIOR
- **الوصف:** The methodology and Skill versions are pinned at blind-run start. Newly observed failure modes or rule ideas are logged as discovery events but MUST NOT alter the active run procedure.
- **الزناد:** A potential new Rule/Gate is discovered pre-lock.
- **نمط الفشل:** The analyst changes methodology mid-run and then treats the result as tested under one stable method.

## R98 — بوابة التحقق من هوية الصيغة (`FORM-IDENTITY VERIFICATION GATE`)
- **الوزن:** HIGH
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** Before an occurrence is used as evidence for a morphological claim, verify its exact formal identity: root length and assignment, additions, gemination, stem form, voice, aspect/view, mood, pronouns, relevant inflection, and high-impact construction features. Absence of a derived-form tag in a structural resource does not by itself prove triliteral Form I.
- **الزناد:** Any bare/derived-form comparison, operator claim, or aggregation of untagged/base records.
- **نمط الفشل:** A derived form is treated as the base form, or an untagged bucket is labeled Form I although it contains quadriliteral or otherwise unverified members.

## R99 — بوابة إثبات ادعاء التغطية (`CLAIMED-COVERAGE EVIDENCE GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F02_CORPUS_AND_COVERAGE
- **الوصف:** A numerical corpus-coverage claim requires an auditable Evidence Matrix representing every occurrence counted in the numerator and denominator and its verification state.
- **الزناد:** Any `Corpus Coverage = X%`, `all occurrences`, or equivalent statement.
- **نمط الفشل:** A tool count or sample is reported as complete coverage without occurrence-level evidence.

## R100 — بوابة تنافس الفرضيات الإيجابية (`POSITIVE-HYPOTHESIS COMPETITION GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** Strong negative determination does not authorize immediate promotion of the first surviving abstraction. Generate genuinely competing positive hypotheses plus `C0`, each with predictions and falsification conditions.
- **الزناد:** A strong exclusion ledger with no positively discriminated core.
- **نمط الفشل:** Several familiar glosses are rejected and one newly invented abstraction is accepted simply because it is the only positive candidate formulated.

## R101 — الغموض البنيوي قبل الحسم (`STRUCTURAL-AMBIGUITY BEFORE DECISIVENESS`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** An occurrence MUST NOT be labeled decisive when its inferential force depends on an unverified parse, attachment, pronoun antecedent, ellipsis, scope, or other structurally material choice.
- **الزناد:** Any high-information occurrence with a structurally consequential alternative.
- **نمط الفشل:** `UNVERIFIED PARSE → FALSE DECISIVE CONTEXT → FALSE ROOT CORE`.

## R102 — متانة السياق الحاسم عبر التحليلات النحوية (`DECISIVE-CONTEXT ROBUSTNESS ACROSS PARSES`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** After plausible structural analyses are enumerated, test the decisive claim across them. If a reasonable parse removes the decisive force, downgrade the occurrence to `STRUCTURALLY_SENSITIVE_CANDIDATE`.
- **الزناد:** More than one materially plausible parse for a high-information occurrence.
- **نمط الفشل:** A context remains “decisive” although a reasonable alternate parse makes it merely indeterminate.

## R103 — بنية المشاركين لا تساوي المفهوم الجذري (`ARGUMENT-STRUCTURE ≠ ROOT CORE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** A participant frame such as “entity + location/state” or “source + target” is not sufficient to identify a Root Core. The analysis must isolate the lexical property that distinguishes this relation from roots sharing the same frame.
- **الزناد:** Root proposals phrased mainly as participant relations.
- **نمط الفشل:** `PARTICIPANT FRAME → MISTAKEN FOR LEXICAL IDENTITY`.

## R104 — طرح مساهمة التركيب (`CONSTRUCTIONAL-CONTRIBUTION SUBTRACTION`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** Before a semantic feature is assigned to the Root Core, subtract all contribution plausibly attributable to morphological form, particles, construction, argument semantics/roles, and context.
- **الزناد:** Derived forms, particle constructions, semantically rich objects/arguments, and alternating valency/constructions.
- **نمط الفشل:** A feature originating in `ب/ل/من`, a form operator, argument meaning, or construction is asserted as root meaning.

## R105 — بوابة تشغيل المفهوم المجرد (`ABSTRACT-CORE OPERATIONALIZATION GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** An abstract Root Core is not accepted merely because it is broad enough to fit the corpus. Its abstract terms must be converted into testable REQUIRED/EXCLUDED features, predictions, competitors, and a falsification condition.
- **الزناد:** Core wording such as relation, structure, determination, realization, independence, transition, or other high-level abstractions.
- **نمط الفشل:** `OVER-ABSTRACT CORE → UNIVERSAL COMPATIBILITY → ZERO DISTINCTIVENESS`.

## R106 — بوابة المحتوى التنبؤي للمفهوم الجذري (`ROOT-CORE PREDICTIVE CONTENT GATE`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** A mature Root Core must constrain an occurrence or feature not used to build it. It must generate a prediction capable of failing rather than merely explaining observations post hoc.
- **الزناد:** Transition from `QURAN_TESTED` toward lock eligibility.
- **نمط الفشل:** A post-hoc model that accepts every possible outcome.

## R107 — بوابة دليل الجسر عبر الاشتقاقات (`CROSS-DERIVATION BRIDGE EVIDENCE GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F03_CORE_AND_LAYERING
- **الوصف:** When derivational branches appear semantically distant, SINGLE ROOT CORE does not license an invented abstraction. A testable semantic bridge must show how the invariant survives across the branches without semantic mutation.
- **الزناد:** Materially distant nominal/verbal, physical/abstract, bodily/relational, or other derivational branches.
- **نمط الفشل:** `SINGLE ROOT CORE PRESSURE → OVERGENERALIZED BRIDGE`.

## R108 — بوابة أهلية القفل (`LOCK ELIGIBILITY GATE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** `LOCK_INTERNAL_RESULT` requires an explicit Lock Eligibility Report. Analyst conviction is insufficient.
- **الزناد:** Request to transition from Semantic Boundary to lock.
- **نمط الفشل:** A persuasive core is locked despite unaudited coverage, unresolved structural ambiguity, missing C0, weak differentiation, or hidden contradictions.

## R109 — بوابة الحذر من الصيغة الأساس غير الموثقة (`UNATTESTED-BASE FORM CAUTION GATE`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** عندما تكون صيغة مشتقة موثقة في corpus بينما الصيغة الأساس المقارنة غير موثقة أو غير مستقرة، يُمنع اختراع gloss للأساس واستخدامه دليلًا على مساهمة الصيغة المشتقة. تُستخرج النواة من الأسرة الموثقة، ويُخفض نطاق دعوى العامل الصرفي.
- **الزناد:** صيغة مزيدة موثقة مع غياب الأساس أو ضعف دليله.
- **نمط الفشل:** `UNATTESTED BASE → INVENTED GLOSS → FALSE FORM OPERATOR`.

## R110 — بوابة البقية الإيجابية للنواة السلبية (`PRIVATIVE-CORE POSITIVE-RESIDUE GATE`)
- **الوزن:** HIGH
- **العائلة:** F04_FALSIFICATION_AND_UNCERTAINTY
- **الوصف:** إذا صيغ مرشح Root Core بوصفه مجرد غياب أو نفي لخاصية X، يجب البحث خصوميًا عن سياق يذكر غياب X بصورة مستقلة مع بقاء اللفظ المستهدف غير زائد. إذا بقي له أثر دلالي، فالنواة السلبية المحضة غير كافية، ويجب استخراج البقية الإيجابية بعد طرح مساهمة الصيغة والتركيب.
- **الزناد:** تعريف من نوع «غياب X / لا Y / من دون Z».
- **نمط الفشل:** `PRIVATIVE CORE → UNIVERSAL FIT → NO POSITIVE PREDICTION`.

## R111 — استقلال مساهمة العامل اللغوي وثباتها (`OPERATOR-CONTRIBUTION INDEPENDENCE & INVARIANCE`)
- **الوزن:** HIGH
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** كل عامل لغوي متكرر—صيغة صرفية أو حرف أو تركيب—يُبحث تحت فرضية مساهمة جوهرية مستقرة يمكن فصلها عن Root Core وعن معنى المشاركين والسياق. لا يثبت أي معنى محدد للعامل إلا بدليل داخلي عابر للبيئات، ويجب وسم نطاق الدعوى.
- **الزناد:** تفسير صيغة أو حرف أو تركيب متكرر، أو اختلاف تفسير العامل نفسه بين جذور/بيئات.
- **نمط الفشل:** `LOCAL OPERATOR GLOSS → SILENT GLOBAL LAW`, أو `SAME OPERATOR → UNRELATED AD-HOC MEANINGS`.

## R112 — الإثبات البنيوي لا يساوي إثبات دلالة العامل (`STRUCTURAL ATTESTATION ≠ OPERATOR SEMANTIC VALIDATION`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** عدد ورود صيغة، وعدد الجذور المرشحة، ووسم QAC أو أي مورد بنيوي يثبت وجود البنية أو ترشيح هويتها فقط؛ ولا يثبت المساهمة الدلالية للعامل. يجب فصل `structural_status` عن `semantic_status` وعن `claim_scope` وعن حالة `Evidence Matrix`.
- **الزناد:** الاستدلال بعدد الصيغ أو الجذور أو وسم مورد صرفي على معنى الوزن أو الحرف أو التركيب.
- **نمط الفشل:** `STRUCTURAL COUNT → SEMANTIC CERTAINTY` أو `QAC TAG → OPERATOR MEANING`.

## R113 — عدم دمج طبقات العوامل الصرفية (`MORPHOLOGICAL OPERATOR STACK NON-COLLAPSE`)
- **الوزن:** CONSTITUTIONAL / CRITICAL
- **العائلة:** F07_MORPHOLOGY_AND_OPERATORS
- **الوصف:** المعنى الموضعي للصيغة المركبة يجب أن يفصل طبقاتها المستقلة: `ROOT CORE + STEM FORM + ASPECT/VIEW + VOICE + MOOD + NOMINALIZATION/PARTICIPLE + PARTICLE/CONSTRUCTION + ARGUMENTS + CONTEXT`. لا يجوز دمج أثرين أو أكثر في gloss واحد ثم نسبتهما إلى الجذر أو إلى وزن اشتقاقي واحد.
- **الزناد:** كل لفظ يحمل أكثر من سمة صرفية/نحوية مؤثرة، أو كل مقارنة بين صيغ تتغير فيها عدة طبقات معًا.
- **نمط الفشل:** `MULTIPLE OPERATORS → SINGLE UNTRACEABLE GLOSS` أو `VOICE/ASPECT EFFECT → ROOT OR FORM MEANING`.
