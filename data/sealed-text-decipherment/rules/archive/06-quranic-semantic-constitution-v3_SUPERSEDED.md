# الدستور الدلالي القرآني وسجل القواعد الرسمي (`Quranic Semantic Constitution and Formal Rule Registry`) — v3.3.0

## السلطة وطريقة الاستخدام (`Authority and Use`)

يسجل هذا الملف القواعد والبوابات الرسمية لتحليل الجذور والألفاظ القرآنية داخل المهارة. وتبقى المعرّفات الإنجليزية ثابتة لأغراض التتبع الآلي، بينما يقدم `rules/RULE_REGISTRY_ARABIC_INDEX.md` مقابلات عربية لجميع القواعد.

This registry records the formal Rules/Gates for Quranic root/lexeme analysis in this Skill.
Authority above the numbered registry is held by the active owner constitutional decisions in:
`references/quran/governance/OWNER_CONSTITUTIONAL_DECISIONS.md`.
The mandatory presentation sequence is governed by:
`references/quran/governance/MANDATORY_LAYERED_SEMANTIC_ANALYSIS_PRESENTATION_PROTOCOL.md`.
For Quranic semantic work these authorities and this registry override conflicting legacy references, examples,
prior results, or older design notes. Nothing overrides the canonical Quranic text.

Every named English rule or gate in this file is a formal rule. Each rule carries:
**Weight**, **Description**, **Impact**, **Trigger**, **Failure mode**, and **Example(s)**.

### Weight scale

- **CONSTITUTIONAL / CRITICAL** — violation can invalidate the semantic analysis.
- **HIGH** — major control on inference quality; failure normally requires revision or rank reduction.
- **MEDIUM** — important discriminating or verification rule.
- **SUPPORTING / HYPOTHESIS** — may generate or enrich hypotheses; never governs by itself.

---

# I. Constitutional rules

## R01 — ZERO-PRIOR-MEANING / PRECONCEPTION PROHIBITION / منع المعنى المسبق
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Start semantic discovery from `UNKNOWN`. A remembered, dictionary, exegetical, conventional, doctrinal, or model-internal meaning MUST NOT be used as the starting definition of a Quranic root or lexeme.  
**Impact:** Prevents confirmation bias and circular reconstruction.  
**Trigger:** Any root/lexeme semantic analysis.  
**Failure mode:** The analyst starts with a known gloss and bends occurrences to fit it.  
**Examples:**
- Do not begin `ن ش ز` with “rise” or “disobedience”.
- First profile `ننشزها`, `انشزوا`, `نشوزهن`, and `نشوزًا أو إعراضًا` without importing a gloss.

## R02 — PRIOR-CONTAMINATION DISCLOSURE / الإفصاح عن تلوث المعرفة المسبقة
**Weight:** HIGH  
**Description:** A model cannot guarantee that it has forgotten a previously known meaning. If a candidate hypothesis matches a known prior, label it `PRIOR_CONTAMINATED` and require independent Quran-internal support.  
**Impact:** Makes hidden model knowledge auditable instead of pretending it was erased.  
**Trigger:** A hypothesis resembles a remembered gloss, prior project result, dictionary meaning, or earlier conversation result.  
**Failure mode:** Claiming an inference was independently discovered when it may have been recalled.  
**Example:** “height/rise” for `ن ش ز` must be marked prior-contaminated if already known before corpus analysis.

## R03 — CORPUS-FIRST GATE / بوابة corpus أولًا
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** No root-core claim may be proposed before the required root corpus has been assembled.  
**Impact:** Prevents a famous verse or domain from defining the root for all other occurrences.  
**Trigger:** Before `CANDIDATE_HYPOTHESIS`.  
**Failure mode:** Defining a root from one verse and then using the rest as confirmation.  
**Examples:**
- Low-frequency root: inspect every confirmed occurrence.
- High-frequency root: inspect at least 10 deliberately diverse occurrences before a serious provisional root-core claim.

## R04 — LOW-FREQUENCY FULL COVERAGE RULE / قاعدة التغطية الكاملة للجذور قليلة الورود
**Weight:** HIGH  
**Description:** When the root has a small manageable corpus, 100% of confirmed occurrences MUST be examined before a root-core conclusion.  
**Impact:** Eliminates avoidable sampling bias where complete inspection is feasible.  
**Trigger:** Small/limited root corpus.  
**Failure mode:** Omitting an inconvenient occurrence.  
**Example:** `ن ش ز` is treated as a full-corpus regression case.

## R05 — HIGH-FREQUENCY ROOT COVERAGE RULE / قاعدة تغطية الجذور كثيرة الورود
**Weight:** HIGH  
**Description:** For a large corpus, inspect at least 10 occurrences selected for maximal contextual, morphological, syntactic, and domain diversity. This is a minimum, not automatic sufficiency.  
**Impact:** Gives a disciplined starting point without pretending a small sample is full coverage.  
**Trigger:** A root whose full corpus is impractical in the current task.  
**Failure mode:** Ten near-duplicate examples are treated as representative.  
**Example:** Ten diverse occurrences may permit a provisional confidence ceiling near 70%, while actual Corpus Coverage remains the real examined/total percentage.

## R06 — ADVERSARIAL SAMPLING RULE / قاعدة العينة الخصومية
**Weight:** HIGH  
**Description:** Sampling MUST seek occurrences most likely to break the hypothesis, not occurrences easiest to explain.  
**Impact:** Converts sampling from confirmation to falsification.  
**Trigger:** Any partial-corpus root analysis.  
**Failure mode:** Convenient sampling of supportive verses.  
**Example:** Include materially different forms, participants, domains, and the hardest apparent outlier.

## R07 — ROOT CORPUS UNITY RULE / وحدة corpus الجذر
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** All explicit derivatives assigned to one root form one mandatory corpus by default, but the corpus MUST be stratified by form/pattern. Shared root/form assignment removes an easy separation excuse; it does not by itself prove the semantic bridge. Separation requires a compelling morphological/root-assignment argument, while unification requires independent bridge evidence.  
**Impact:** Prevents both hiding resistant derivatives and forcing a bridge from spelling alone.  
**Trigger:** Root-family construction or proposed homonymy/separation.  
**Failure mode:** Either excluding a hard branch because its form differs, or treating formal overlap as proof of one semantic bridge.  
**Example:** `سَلَم / سِلْم / سَلام / سُلَّم` remain one default corpus but are form-stratified; removal of a separation argument does not close the Root Core.

## R08 — SINGLE ROOT CORE / ONE INVARIANT ROOT CONCEPT / مفهوم جذري واحد ثابت
**Weight:** CONSTITUTIONAL / CRITICAL — highest tier  
**Description:** A confirmed single root has one invariant axial/basic/original Root Concept shared by its explicit derivatives. Forms, constructions, and contexts add layers or select realizations; they do not replace the core. The core MUST NOT be an unprincipled disjunction `A OR B` between unrelated features. Distant branches require a testable bridge; failure to establish it remains `UNKNOWN/C0`, not permission for semantic mutation.  
**Impact:** Establishes semantic identity while preventing forced, unfalsifiable unification.  
**Trigger:** Any semantic-core proposal or cross-branch bridge.  
**Failure mode:** Unrelated local meanings, or a disjunctive abstraction that fits every branch and predicts nothing.  
**Example:** One root corpus does not authorize inventing “independence or movement” merely to connect distant branches.

## R09 — FORM–MEANING COVARIANCE / NO FORM CHANGE WITHOUT MEANING CHANGE / تغاير المبنى والمعنى
**Weight:** CONSTITUTIONAL / CRITICAL — highest tier  
**Description:** Every linguistically meaningful change in form MUST be investigated for a corresponding semantic contribution. The contribution may be qualitative rather than simply “more meaning”. Form changes include pattern, additions, deletion, gemination, order, pronouns, number, gender, tense/aspect, voice, transitivity, and construction.  
**Impact:** Prevents collapsing distinct forms into one local gloss and missing the language’s own distinctions.  
**Trigger:** Any comparison of different forms/constructions.  
**Failure mode:** Two materially different forms are translated identically with no account of the structural difference.  
**Examples:**
- `ننشزها`, `انشزوا`, and `نشوز` share one Root Concept but MUST differ in local event structure.
- A shadda is a form change and therefore requires semantic investigation; its exact effect remains an empirical question.

## R10 — INDEPENDENT OCCURRENCE ANALYSIS / تحليل كل موضع مستقلًا
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Profile each occurrence independently before allowing another occurrence’s proposed meaning to control it.  
**Impact:** Prevents cross-contamination between contexts.  
**Trigger:** Local occurrence profiling.  
**Failure mode:** Reading a verse through an interpretation imported from another verse.  
**Example:** `ننشزها` must first be recorded as an event applied to bones before any proposal from the council or marital contexts is imported.

## R11 — OBSERVATION ≠ INTERPRETATION / الملاحظة لا تساوي التفسير
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Keep claim layers explicit: `OBSERVATION`, `CONSTRAINT`, `HYPOTHESIS`, `INFERENCE`, `EXTERNAL_EVIDENCE`, `RESULT/CONCLUSION`, `UNKNOWN`. Do not silently promote one layer to another.  
**Impact:** Makes the inference chain inspectable and blocks intuitive leaps.  
**Trigger:** Every material semantic claim.  
**Failure mode:** “The object is bones” becomes “therefore the verb means raise/assemble”.  
**Example:** In `كيف ننشزها ثم نكسوها لحمًا`, direct observations include the object and sequence; “interlock/bring into close contact” begins as a hypothesis.

## R12 — UNKNOWN IS VALID / المجهول نتيجة صحيحة
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** `UNKNOWN` is a correct outcome when evidence cannot distinguish candidates. Never fill uncertainty with a familiar gloss.  
**Impact:** Protects against forced certainty.  
**Trigger:** Insufficient evidence or unresolved alternatives.  
**Failure mode:** Inventing a meaning because the system feels obliged to answer.  
**Example:** A single occurrence may constrain an event without identifying its exact Root Concept.

## R13 — CONCEPT BEFORE GLOSS / المفهوم قبل المرادف
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Build the conceptual structure before choosing a one-word gloss. A root core may be a relational or multidimensional semantic bundle.  
**Impact:** Prevents premature synonym substitution.  
**Trigger:** Root-core formulation.  
**Failure mode:** “Find one Arabic word that means this root” becomes the primary task.  
**Example:** `ن ش ز` is not reduced to “قرب”, “ارتفاع”, or “عصيان”.

## R14 — SEMANTIC BUNDLE BEFORE SINGLE GLOSS / الحزمة الدلالية قبل المرادف الواحد
**Weight:** HIGH  
**Description:** When no single word preserves the invariant, retain a compact bundle of linked semantic features before compressing it into a gloss.  
**Impact:** Preserves discriminatory structure.  
**Trigger:** A single gloss loses important dimensions.  
**Failure mode:** One broad word erases contact/intensity/interaction distinctions.  
**Example:** “adhesion/contact + interlocking/engagement + very close convergence” is more faithful for the `ن ش ز` regression core than “closeness” alone.

## R15 — MINIMAL SUFFICIENT INVARIANT / النواة الدنيا الكافية
**Weight:** HIGH  
**Description:** The core should be the smallest invariant structure that explains all confirmed derivatives without importing form-specific or context-specific detail.  
**Impact:** Balances overbreadth against overfitting.  
**Trigger:** Refining a provisional core.  
**Failure mode:** Core is either so broad that it explains almost any verb, or so narrow that it contains marital/physical specifics.  
**Example:** “change of position” is too broad for `ن ش ز`.

## R16 — FALSIFICATION GATE / بوابة الدحض
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** A hypothesis is not accepted because many occurrences fit. Intentionally attack it with the hardest occurrence and a stated failure condition.  
**Impact:** Controls confirmation bias.  
**Trigger:** Before `PROVISIONALLY_ACCEPTABLE`.  
**Failure mode:** Counting only supporting verses.  
**Examples:**
- `ن ش ز = disobey` fails on bones/council.
- A proposed core must survive every confirmed occurrence or be revised.

## R17 — CONTRADICTION ≠ INDETERMINATE / التناقض لا يساوي عدم الحسم
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Classify occurrence tests as `SUPPORTS`, `COMPATIBLE`, `INDETERMINATE`, or `CONTRADICTS`. Lack of proof is not contradiction. A genuine Root Concept contradiction is more serious than multiple indeterminate cases.  
**Impact:** Prevents both over-rejection and hand-waving.  
**Trigger:** Occurrence-by-occurrence hypothesis testing.  
**Failure mode:** Treating uncertainty as disproof or calling a contradiction “unclear” to save the model.  
**Example:** If a verse does not reveal whether contact is intense, it may be `INDETERMINATE`; if it positively requires the opposite relation, it may be `CONTRADICTS`.

## R18 — ROOT / FORM / SYNTAX / CONTEXT SEPARATION / فصل الجذر والصيغة والنحو والسياق
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Diagnose every apparent mismatch by layer: `ROOT CONCEPT → MORPHOLOGICAL FORM → SYNTAX/CONSTRUCTION → CONTEXTUAL REALIZATION → UTTERANCE MEANING`.  
**Impact:** Prevents rejecting the core for an error in form or construction analysis, and prevents using form/context to redefine the core.  
**Trigger:** Any resistance or semantic mismatch.  
**Failure mode:** A form-specific effect is mistaken for a new root meaning.  
**Example:** Causative/transitive realization in `ننشزها` is not identical to participant self-action in `انشزوا`.

## R19 — MORPHOLOGY MODIFIES THE EVENT, NOT THE ROOT CORE / الصرف يعدل الحدث لا النواة
**Weight:** HIGH  
**Description:** Morphology changes event structure, participant roles, intensity, aspect, causation, reciprocity, or related layers while preserving the invariant root core.  
**Impact:** Enforces both R08 and R09.  
**Trigger:** Cross-form comparison.  
**Failure mode:** Assigning unrelated core meanings to derived patterns.  
**Example:** A causative form may “cause X to enter the root relation” rather than redefine X.

## R20 — DERIVATIONAL LAYERING / طبقات الاشتقاق
**Weight:** HIGH  
**Description:** Preferred order when evidence permits: `ATTESTED ROOT FAMILY / LEAST-MARKED EVIDENCE → ROOT CORE CANDIDATE → FORM OPERATOR CANDIDATE → PARTICLE/CONSTRUCTION → ARGUMENT SEMANTICS → CONTEXT → LOCAL MEANING`. Do not define a marked form first and project its gloss backward into the root.  
**Impact:** Makes local meaning traceable and prevents marked-form contamination of the core.  
**Trigger:** Any full interpretation or derived-form analysis.  
**Failure mode:** A local or marked-form paraphrase is treated as the root definition.  
**Example:** Analyze attested family evidence before assigning a root meaning from Form IV alone.

## R21 — CONTEXT SELECTS, IT DOES NOT REDEFINE / السياق يختار ولا يعيد التعريف
**Weight:** HIGH  
**Description:** Context selects a face/realization of the invariant Root Concept and contributes local detail; it does not replace the core with an unrelated meaning.  
**Impact:** Prevents domain-specific dictionaries from fracturing the root.  
**Trigger:** Contextual interpretation.  
**Failure mode:** “In marriage the root means rebellion; in bones it means raise” with no invariant bridge.  
**Example:** One neutral root relation may realize physically, spatially, emotionally, or relationally.

## R22 — UTTERANCE MEANING COMPOSITION / تركيب معنى الملفوظ
**Weight:** HIGH  
**Description:** The speaker’s local meaning is composed from Root Concept + morphology + syntax/construction + particles/relations + context.  
**Impact:** Prevents equating root core with sentence meaning.  
**Trigger:** Producing a verse-level interpretation.  
**Failure mode:** Translating the root core directly as the whole clause.  
**Example:** The same root core may produce distinct local paraphrases across forms without changing its invariant.

## R23 — ROOT-TRACEABILITY GATE / بوابة تتبع النواة
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Every proposed local meaning MUST be traceable backward through context, syntax, and morphology to the invariant Root Concept without an unexplained semantic jump.  
**Impact:** Detects semantic mutation.  
**Trigger:** Before accepting any `LOCAL_MEANING`.  
**Failure mode:** A local gloss cannot show how it derives from the root core.  
**Example:** If a local meaning “authority/rebellion” cannot be compositionally derived from the established root relation, it must not be asserted as the root meaning.

## R24 — NO-SEMANTIC-MUTATION RULE / منع التحور الدلالي
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Form and context may specify, intensify, weaken, distribute, temporalize, causalize, or relationally realize the core, but MUST NOT mutate it into a concept of a different semantic kind.  
**Impact:** Protects root identity.  
**Trigger:** Any context-specific paraphrase.  
**Failure mode:** Unexplained jumps between unrelated semantic domains.  
**Example:** “contact/interlocking” cannot become “height” merely because a nearby clause contains “raise”.

## R25 — REVERSE-STRIPPING TEST / اختبار النزع العكسي
**Weight:** HIGH  
**Description:** Strip local layers in reverse: remove context-specific detail, construction, morphology, and affixes; compare the remaining invariant across derivatives.  
**Impact:** Aids discovery of the shared root core.  
**Trigger:** Refining a candidate core.  
**Failure mode:** The proposed common remainder disappears when local layers are removed.  
**Example:** Strip marital context from `نشوزهن`, causative event structure from `ننشزها`, and imperative/person-number from `انشزوا`; compare what remains.

## R26 — CROSS-DERIVATION INVARIANCE TEST / اختبار ثبات النواة عبر الاشتقاقات
**Weight:** HIGH  
**Description:** Test whether the same core remains recognizable across noun/verb/verbal noun, transitive/intransitive, physical/abstract, and other derivational contrasts.  
**Impact:** Direct test of R08.  
**Trigger:** Before high confidence.  
**Failure mode:** A core only works in one derivational form.  
**Example:** `ن ش ز` must retain one relational invariant across bones, council participants, and marital relations.

---

# II. Lexical identity and differentiation

## R27 — LEXICAL DISTINCTIVENESS / NON-SYNONYMY PRINCIPLE / التفريد الدلالي وعدم الترادف التام
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Consistency across occurrences is necessary but not sufficient. The extracted Root Concept must be lexically distinctive and MUST NOT collapse into a complete identity with another Quranic lexeme. Different Quranic forms are presumed to carry meaningful distinctions unless strong evidence shows only contextual functional convergence.  
**Impact:** Adds `Lexical Identity` to `Meaning Consistency`.  
**Trigger:** After a provisional core survives the corpus.  
**Failure mode:** The definition could be copied unchanged as the full definition of another Quranic word.  
**Example:** If `ن ش ز` were defined merely as “near”, it would require differentiation from Quranic lexemes of nearness/contact.

## R28 — NO PERFECT SYNONYMY AS DEFAULT / الأصل عدم الترادف التام
**Weight:** HIGH  
**Description:** Do not assume perfect Quranic synonymy. Large overlap is possible, and two words can be functionally equivalent in one local context, but full lexical identity requires exceptional evidence.  
**Impact:** Prevents flattening Quranic lexical choice.  
**Trigger:** Comparing near-synonyms.  
**Failure mode:** “X and Y mean exactly the same everywhere” without proof.  
**Example:** `FUNCTIONALLY_EQUIVALENT_IN_CONTEXT` may be a local relation; it does not establish identical Root Concepts.

## R29 — NEAREST-LEXEME DIFFERENTIATION / التفريق عن أقرب لفظ
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** After a root core becomes provisionally acceptable, compare it with the nearest Quranic lexemes and state the smallest qualitative difference that explains the lexical choice.  
**Impact:** Prevents premature finalization of a broad core.  
**Trigger:** Before `HIGH_CONFIDENCE`.  
**Failure mode:** No attempt to distinguish the core from its closest Quranic neighbors.  
**Example:** Compare `ن ش ز` with lexemes of nearness, joining, attachment, confrontation, and turning away as relevant.

## R30 — SEMANTIC-RESIDUE TEST / اختبار البقية الدلالية
**Weight:** HIGH  
**Description:** Subtract the semantic territory already covered by the nearest competing lexeme; the remaining discriminating feature is a candidate component of lexical identity.  
**Impact:** Helps isolate what is uniquely carried by the target root.  
**Trigger:** Overlap with a near lexeme.  
**Failure mode:** Shared meaning is mistaken for the unique core.  
**Example:** If two words both reduce distance, the residue may be intense contact/interlocking rather than generic nearness.

## R31 — COUNTERFACTUAL-SUBSTITUTION TEST / اختبار الاستبدال المضاد
**Weight:** HIGH  
**Description:** Mentally substitute the closest Quranic alternative into the construction and ask what semantic or functional property is lost or changed.  
**Impact:** Tests whether the proposed lexical distinction has explanatory value.  
**Trigger:** Lexical differentiation.  
**Failure mode:** Substitution changes nothing because the proposed core is too broad.  
**Example:** Substituting a lexeme of “turning away” for `نشوز` in `نشوزًا أو إعراضًا` should expose why the two are not lexically identical.

## R32 — LEXICAL COLLISION GATE / بوابة التصادم اللفظي
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Before `HIGH_CONFIDENCE`, verify that the Root Concept does not fully collide with the concept of another Quranic lexeme. If it does, refine the core or keep the result unresolved.  
**Impact:** Final lexical-identity safety gate.  
**Trigger:** Final root-core approval.  
**Failure mode:** A “final” core is semantically indistinguishable from another lexical item.  
**Example:** A final definition of `ن ش ز` cannot be merely the complete definition of a Quranic word for generic nearness or generic joining.

---

# III. Discovering the semantic axis

## R33 — REFERENCE-FRAME NEUTRALITY / حياد الإطار المرجعي
**Weight:** HIGH  
**Description:** Do not preselect the semantic axis (up/down, near/far, motion/rest, union/separation, etc.). Infer the relevant relation from the corpus.  
**Impact:** Prevents searching on the wrong conceptual dimension.  
**Trigger:** Early hypothesis generation.  
**Failure mode:** Selecting “vertical height” because one nearby word is “raise”.  
**Example:** The `ن ش ز` regression moved from an assumed vertical axis toward a relation among multiple parts/participants.

## R34 — RELATIONAL-SEMANTICS CHECK / اختبار الدلالة العلائقية
**Weight:** HIGH  
**Description:** When occurrences repeatedly involve multiple participants/parts, test whether the root describes a relation among them rather than movement or state of one isolated element.  
**Impact:** Reveals relational cores hidden by verb-centered paraphrase.  
**Trigger:** Multi-participant corpus.  
**Failure mode:** Treating a relational event as simple movement.  
**Example:** Bones, people in a limited council space, and spouses all provide multi-element relational structures for `ن ش ز`.

## R35 — PHYSICAL–RELATIONAL INVARIANT / ثبات النواة بين المادي والعلاقاتي
**Weight:** HIGH  
**Description:** If the root occurs in physical and emotional/social domains, preserve one abstract invariant that can realize in both; do not create separate unrelated dictionary meanings.  
**Impact:** Tests cross-domain unity.  
**Trigger:** Domain shift in the corpus.  
**Failure mode:** Physical meaning A and marital meaning B are unrelated except by tradition.  
**Example:** A neutral contact/interlocking/intense-convergence core can realize as physical interlocking or relational engagement/friction.

## R36 — STATE-TRANSITION MODELING / نمذجة الانتقال بين الحالات
**Weight:** MEDIUM  
**Description:** Model each occurrence as `STATE BEFORE → TARGET EVENT/STATE → STATE AFTER`, where the text supports such a transition.  
**Impact:** Extracts constraints without prematurely naming the meaning.  
**Trigger:** Sequential, physical, spatial, or process-like contexts.  
**Failure mode:** Jumping from event to gloss without describing the state change.  
**Example:** Limited council space can be modeled in terms of spacing before and after `تفسحوا` / `انشزوا`.

## R37 — CONTRAST-AXIS SEARCH / البحث عن محور التقابل
**Weight:** HIGH  
**Description:** When two items are structurally contrasted, search for the shared semantic axis on which they differ rather than interpreting each in isolation.  
**Impact:** Can reveal the root’s operative dimension.  
**Trigger:** Parallel contrast, alternatives, opposite instructions, or paired states.  
**Examples:**
- `تفسحوا` and `انشزوا` in the same council setting invite a spacing/convergence analysis.
- `نشوزًا أو إعراضًا` requires preserving a meaningful distinction.

## R38 — STRUCTURAL NON-REDUNDANCY / عدم التكرار البنيوي
**Weight:** HIGH  
**Description:** When `X` and `Y` occupy the same grammatical alternative slot (e.g., `X أو Y`), an analysis that makes them nearly redundant requires strong evidence.  
**Impact:** Uses lexical choice as a constraint.  
**Trigger:** Coordination/alternative structures.  
**Failure mode:** Defining `نشوز` as almost the same as `إعراض` and ignoring why both were named.  
**Example:** `نشوزًا أو إعراضًا` is high-value evidence against semantic collapse.

## R39 — CONTRASTIVE-NEIGHBOR GATE / بوابة الجار التقابلي
**Weight:** HIGH  
**Description:** Do not define target `X` using a prior meaning of neighboring `Y`. If the distinction is decisive, analyze `Y` independently under the same method before using it as a comparator.  
**Impact:** Prevents importing dictionary meaning through a neighboring word.  
**Trigger:** X/Y contrast drives the argument.  
**Failure mode:** “إعراض means withdrawal, therefore نشوز must be its exact opposite” without independent analysis.  
**Example:** `ع ر ض` may need its own corpus analysis before a precise opposition claim.

## R40 — ADJACENCY ≠ SYNONYMY / المجاورة لا تعني الترادف
**Weight:** HIGH  
**Description:** A nearby word, rhetorical echo, or later result does not define the target root.  
**Impact:** Blocks associative glossing.  
**Trigger:** A tempting nearby lexical cue.  
**Failure mode:** `انشزوا ... يرفع الله` → “therefore نشز = rise.”  
**Example:** `يرفع` may be a contextual/rhetorical clue, not a root definition.

## R41 — RESULT ≠ ROOT CONCEPT / النتيجة ليست المفهوم الجذري
**Weight:** HIGH  
**Description:** A physical or contextual result of performing the action is not necessarily the root core.  
**Impact:** Distinguishes consequence from lexical invariant.  
**Trigger:** A visible outcome tempts direct glossing.  
**Failure mode:** “A seated person may stand, so the root means stand/rise.”  
**Example:** Standing can result from an imperative without constituting the lexical core.

## R42 — EXPLANATORY SPECIFICITY GATE / بوابة التحديد التفسيري
**Weight:** HIGH  
**Description:** A candidate must distinguish the root from generic concepts and nearest Quranic neighbors. It MUST generate at least one negative prediction and preserve a lexical semantic residue beyond participant frame or near-neighbor overlap.  
**Impact:** Prevents vacuous fits and post-hoc abstractions.  
**Trigger:** A candidate fits everything too easily or uses generic words such as relation/change/action/state.  
**Failure mode:** A core explains every occurrence but excludes nothing and collapses into another lexeme.  
**Example:** “A relation between entity and state” fails unless operationalized into features and a negative prediction.

# IV. Sequence, response, polarity, and domain controls

## R43 — SEQUENTIAL-STAGE CONSTRAINT / قيد المراحل المتعاقبة
**Weight:** HIGH  
**Description:** In `A ثم B` or another explicit stage sequence, treat A and B as distinct ordered stages and use that distinction to constrain meaning.  
**Impact:** Prevents collapsing a stage into the overall process outcome.  
**Trigger:** Explicit temporal/process sequencing.  
**Failure mode:** Defining `ننشزها` as the final outcome “revive” when `ثم نكسوها لحمًا` names a later stage.  
**Example:** The bone event must be semantically distinct from the later clothing with flesh.

## R44 — REMEDY/RESOLUTION ≠ DEFINITION / العلاج أو الحل لا يعرّف الحالة
**Weight:** HIGH  
**Description:** A remedy, response, or condition that ends a state does not automatically define the state or prove lexical antonymy.  
**Impact:** Blocks circular definition from consequences.  
**Trigger:** A verse provides actions after naming a condition.  
**Failure mode:** `فإن أطعنكم` → “therefore نشوز = disobedience.”  
**Example:** Compliance may end a broader relational state without being its lexical opposite.

## R45 — REMEDIAL COHERENCE TEST / اختبار انسجام التدبير
**Weight:** HIGH  
**Description:** Although a remedy does not define the condition, functional coherence between proposed condition and response may strengthen or weaken hypotheses.  
**Impact:** Adds secondary discriminating evidence.  
**Trigger:** Competing root/local-meaning hypotheses predict different response logic.  
**Failure mode:** Ignoring that a proposed meaning makes the response sequence unnecessarily incoherent.  
**Example:** `واهجروهن في المضاجع` is more naturally coherent with a hypothesis involving intense relational engagement/friction than with a hypothesis already equivalent to withdrawal; this is supporting evidence, not a definition.

## R46 — ROOT POLARITY SEPARATION / فصل الشحنة القيمية عن الجذر
**Weight:** HIGH  
**Description:** Do not copy moral, positive, or negative polarity from one context into the invariant root core unless the full corpus requires it.  
**Impact:** Keeps neutral lexical structure separate from contextual evaluation.  
**Trigger:** A root appears in morally loaded and neutral contexts.  
**Failure mode:** Defining `ن ش ز` as inherently “rebellious/bad” because marital contexts are negative.  
**Example:** Bones and council uses require a non-moral root core.

## R47 — NO DOMAIN DOMINANCE / منع هيمنة المجال
**Weight:** HIGH  
**Description:** The socially, legally, or traditionally famous domain of a word MUST NOT dominate root-core extraction.  
**Impact:** Prevents specialized usage from swallowing the family.  
**Trigger:** One domain is much more familiar than others.  
**Failure mode:** “نشوز” is defined entirely through marital law before bones/council are analyzed.  
**Example:** Marital occurrences have equal evidential standing with physical/spatial occurrences for root-core discovery.

---

# V. Root assignment and source policy

## R48 — ROOT_ASSIGNMENT_UNCERTAIN / عدم يقين إسناد الجذر
**Weight:** HIGH  
**Description:** If assigning a form to a root is morphologically disputed, mark it `ROOT_ASSIGNMENT_UNCERTAIN` and do not let it support or contradict the core until the assignment is resolved sufficiently.  
**Impact:** Prevents false contradictions caused by incorrect family membership.  
**Trigger:** Competing plausible root analyses.  
**Failure mode:** A disputed form is treated as decisive corpus evidence.  
**Example:** A homographic form with two plausible roots remains quarantined from root-core scoring.

## R49 — HAFS–MADINAH CANONICAL TEXT AUTHORITY / سلطة نص حفص ومصحف المدينة
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Quranic semantic analysis in this Skill uses **Hafs `an Asim only, with the Madinah Mushaf as the canonical reading/text profile**. Other qira'at are outside the semantic evidence scope of this profile.  
**Impact:** Fixes the textual/reading basis and prevents cross-reading contamination.  
**Trigger:** Canonicalization and quotation verification.  
**Failure mode:** Introducing another reading as semantic evidence in this profile.  
**Example:** Do not add “in another qira'ah…” to derive or rescue a root hypothesis.

## R50 — NO TAFSIR DEPENDENCY / منع الاعتماد الدلالي على التفاسير
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Tafsir is excluded from semantic discovery, hypothesis generation, ranking, falsification, lock eligibility, confidence, and registry adoption. It MUST NOT be used as evidence for the Root Core or local lexical meaning. After a valid lock and only on explicit owner request, tafsir may be examined in a separate non-governing historical/interpretive appendix under `POST-LOCK INTERPRETIVE REVIEW POLICY`.  
**Impact:** Protects Quran-internal induction while allowing a clearly isolated critical review after the semantic result is frozen.  
**Trigger:** Any attempt to retrieve or cite tafsir in or around a semantic analysis.  
**Failure mode:** Using exegetical authority to establish, confirm, correct, enrich, or reject a lexical meaning.  
**Example:** Agreement with tafsir does not increase internal confidence. If an appendix labels an opinion supported, the locked internal result supports the opinion—not the reverse.

## R51 — QURAN-INTERNAL SEMANTIC SOVEREIGNTY ENFORCEMENT / إنفاذ السيادة الدلالية القرآنية الداخلية
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Quranic semantic meaning is discovered and tested from the Quran-internal corpus only. Tafsir, dictionaries, hadith, poetry, inherited usage/terminology, translations, glosses, synonym lists, WordNet/WSD labels, and model-remembered meanings MUST NOT serve as semantic evidence, confirmation, enrichment, correction, tie-breaker, or hypothesis source at any stage. A separate owner-requested historical/comparative or interpretive review is outside the semantic pipeline, begins only after lock, follows the dedicated policy, and cannot revise or validate the internal result.  
**Impact:** Prevents inherited meaning from contaminating discovery or post-lock validation.  
**Trigger:** Any attempt to introduce external/inherited semantic material.  
**Failure mode:** External authority supplies or confirms the target meaning.  
**Examples:** A dictionary cannot generate a candidate when analysis stalls; a post-lock agreement with inherited material does not raise Quran-internal confidence.

# VI. Phonic/form intuitions — supporting only

## R52 — PHONIC/ORDER INTUITION HYPOTHESIS / فرضية الحدس الصوتي وترتيب الحروف
**Weight:** SUPPORTING / HYPOTHESIS  
**Description:** The articulatory/acoustic qualities of letters and their order may offer a natural intuitive clue to the Root Concept and may support the view that Arabic wording can disclose aspects of meaning through its own form. This is a hypothesis-generation/enrichment channel, not governing proof.  
**Impact:** Opens a disciplined path for sound-symbolic intuition without allowing retrofitted storytelling.  
**Trigger:** After or alongside internal hypothesis generation, never as sole proof.  
**Failure mode:** Inventing a sound story after the desired meaning is already chosen.  
**Examples:**
- `بلع` is retained as a future test case for following articulation points/order and comparing the intuitive motion with corpus-derived meaning.
- Any phonic proposal must survive corpus, falsification, and lexical-distinctiveness tests.

## R53 — GEMINATION/SHADDA INTENSIFICATION HYPOTHESIS / فرضية دلالة التشديد على التكثيف
**Weight:** SUPPORTING / HYPOTHESIS  
**Description:** Gemination/shadda is a form change and may correlate with pressure, force, intensification, compression, recurrence, or another strengthened realization of the root concept. The exact contribution must be learned from usage and MUST NOT be assumed universally.  
**Impact:** Connects sound/form change to R09 while keeping the specific effect empirical.  
**Trigger:** Geminated vs non-geminated forms.  
**Failure mode:** “Every shadda always means more force” asserted without corpus testing.  
**Example:** Compare related forms to determine whether the shadda intensifies degree, event structure, causation, repetition, or another dimension.

---

# VII. Coverage, diversity, confidence, and lifecycle

## R54 — CORPUS COVERAGE / تغطية corpus
**Weight:** HIGH  
**Description:** `Corpus Coverage = examined confirmed occurrences / total confirmed occurrences in the declared root corpus`. This is a factual percentage and MUST NOT be inflated because the sample is diverse.  
**Impact:** Separates actual coverage from confidence.  
**Trigger:** Every root analysis.  
**Example:** 10 examined out of 100 = 10% Corpus Coverage.

## R55 — CONTEXT DIVERSITY COVERAGE / تغطية تنوع السياقات
**Weight:** HIGH  
**Description:** Report how well the examined set covers distinct contextual, morphological, syntactic, participant, and domain patterns found in the corpus. Keep this separate from raw occurrence coverage.  
**Impact:** Explains why a small sample can still be structurally informative without pretending it is complete.  
**Trigger:** Partial corpus or multi-domain root.  
**Failure mode:** A 10% sample is called “70% coverage” because it was diverse.  
**Example:** Ten occurrences may cover most identified context families while raw Corpus Coverage remains 10%.

## R56 — SEMANTIC CONFIDENCE / الثقة الدلالية
**Weight:** HIGH  
**Description:** Semantic Confidence estimates how strongly the proposed core explains the examined evidence without contradiction or forced exceptions. It is not Corpus Coverage and is not a calibrated probability unless explicitly validated.  
**Impact:** Separates quality of hypothesis from quantity of inspected material.  
**Trigger:** Reporting a provisional or high-confidence core.  
**Guidance:** For a high-frequency root, successful analysis of at least 10 deliberately diverse occurrences may permit a **provisional confidence ceiling around 70%**, not an automatic 70%. Higher confidence requires broader coverage, stronger diversity, falsification success, and no genuine unresolved core contradiction.  
**Failure mode:** Converting sample count directly into probability.  
**Example:** `Corpus Coverage 10%`, `Context Diversity Coverage high`, `Semantic Confidence <=70% provisional` can coexist.

## R57 — HYPOTHESIS LIFECYCLE / دورة حياة الفرضية
**Weight:** HIGH  
**Description:** Use explicit states: `UNKNOWN → CANDIDATE_HYPOTHESIS → QURAN_TESTED → PROVISIONALLY_ACCEPTABLE → ENRICHED → HIGH_CONFIDENCE`, with `CONTRADICTED → REVISE/REJECT`.  
**Impact:** Prevents a hypothesis from being presented as a result too early.  
**Trigger:** Any semantic hypothesis.  
**Failure mode:** Candidate wording is reported as settled meaning.  
**Example:** External dictionary/hadith/poetry enrichment is not opened until the hypothesis is at least `PROVISIONALLY_ACCEPTABLE`, except for controlled hypothesis generation after an internal impasse.

---

# VIII. Formal registry and reporting

## R58 — FORMAL-RULE REGISTRY / سجل القواعد الرسمي
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Every formal Rule/Gate preserves: Name; Description; Weight/Priority; Impact; Trigger; Failure Mode; Provenance; Related Rules; Examples; Regression Test; Generalization Scope; Status. Named discoveries remain candidates until their recorded promotion conditions are met.  
**Impact:** Makes methodology evolution auditable and prevents rules from disappearing into prose or being promoted without scope.  
**Trigger:** Adding, refining, or promoting methodology.  
**Failure mode:** A local lesson becomes an unscoped universal rule or is lost in discussion.  
**Example:** R109/R110 remain proposed/regression-pending rather than silently becoming authoritative.

# IX. Mandatory execution order for Quranic root analysis

1. Canonicalize to **Hafs `an Asim / Madinah Mushaf**.
2. Enter `UNKNOWN`; disclose known priors that may contaminate reasoning.
3. Build the explicit derivative corpus under **ROOT CORPUS UNITY RULE**.
4. Apply full coverage for small roots; adversarial diverse sampling for large roots.
5. Build independent occurrence profiles containing observations and constraints only.
6. Model form, syntax, participants, sequence, contrasts, and state transitions without naming the core prematurely.
7. Generate multiple Quran-internal candidate hypotheses.
8. Test each occurrence as `SUPPORTS / COMPATIBLE / INDETERMINATE / CONTRADICTS`.
9. Apply falsification to the hardest occurrence.
10. Separate Root Concept from form, construction, context, and local utterance meaning.
11. Apply reverse stripping and cross-derivation invariance.
12. Select the **single provisional invariant Root Concept** that best survives the corpus.
13. Apply lexical differentiation: nearest lexeme, semantic residue, substitution, lexical collision.
14. Re-test the refined concept against the corpus.
15. Report Corpus Coverage, Context Diversity Coverage, Semantic Confidence, and unresolved constraints.
16. If internally blocked, dictionaries/hadith/poetry may generate candidates, then return immediately to Quran testing.
17. After `PROVISIONALLY_ACCEPTABLE`, dictionaries/hadith/poetry may enrich/corroborate non-governingly.
18. **Never use tafsir** in this methodology.
19. Produce local meaning only through the traceable composition: `Root Core + Form + Syntax/Construction + Context`.

---

# X. Regression case — N-Sh-Z (`ن ش ز`)

This case is a regression oracle for methodology maintenance and MUST NOT be used as pre-analysis evidence in a fresh runtime analysis.

**Owner-approved root-core regression target:**
> A semantic bundle centered on **adhesion/contact, interlocking/engagement, and very close convergence among parts/participants**.

**Required methodological observations:**
- The corpus is small enough for full coverage.
- “height/rise” and “disobedience” MUST NOT be starting definitions.
- `ننشزها` with bones, `انشزوا` in the council setting, and marital `نشوز` must preserve one invariant core.
- `تفسحوا` / `انشزوا` is a high-value contrast for spacing/convergence analysis.
- `نشوزًا أو إعراضًا` MUST preserve a meaningful lexical distinction; collapsing them into near identity fails Structural Non-Redundancy.
- `واهجروهن في المضاجع` is secondary remedial-coherence evidence, not the definition of `نشوز`.
- The final core must still pass lexical-distinctiveness tests against the nearest Quranic lexemes.

**Regression failures include:**
- E01 prior-gloss injection.
- E02 interpreting a verse before corpus assembly.
- E03 confirmation-only use of later occurrences.
- E04 observation promoted directly to meaning.
- E05 premature one-word gloss.
- E06 hypothesis presented as conclusion.
- E07 no hardest-case falsification.
- E08 refusal to return UNKNOWN.
- E09 root/form/context collapse.
- E10 famous-domain dominance.
- E11 early external-source leakage.
- E12 rhetorical model wording presented as textual fact.
- E13 preselecting a semantic axis.
- E14 confusing result with Root Concept.
- E15 collapsing `X أو Y` into semantic redundancy.
- E16 accepting consistency without lexical identity/differentiation.


# XI. Formal aliases for previously named rules

These names appeared during methodology development and are therefore retained as formal aliases. Each alias inherits the Weight, Impact, Trigger, Failure Mode, and Examples of its canonical rule.

- **PRECONCEPTION PROHIBITION** → R01 `ZERO-PRIOR-MEANING / PRECONCEPTION PROHIBITION`.
- **TEXT AUTHORITY** → R49 `HAFS–MADINAH CANONICAL TEXT AUTHORITY`.
- **MEANING IS COMPOSITIONAL** → R22 `UTTERANCE MEANING COMPOSITION`.
- **CONTRAST-PAIR INFORMATION** → R37 + R38 (`CONTRAST-AXIS SEARCH` + `STRUCTURAL NON-REDUNDANCY`).
- **INVARIANT PRESERVATION ACROSS DOMAINS** → R35 `PHYSICAL–RELATIONAL INVARIANT`.
- **PHONIC INTUITION IS A HYPOTHESIS CHANNEL, NOT A GOVERNING PROOF** → R52 `PHONIC/ORDER INTUITION HYPOTHESIS`.
- **ROOT CORE** / **ROOT CONCEPT** in rule names → governed by R08 `SINGLE ROOT CORE / ONE INVARIANT ROOT CONCEPT`.
- **CONTEXT SELECTS** → R21 `CONTEXT SELECTS, IT DOES NOT REDEFINE`.
- **FORM–MEANING COVARIANCE** → R09 `FORM–MEANING COVARIANCE / NO FORM CHANGE WITHOUT MEANING CHANGE`.
- **NO PERFECT SYNONYMY** → R28 `NO PERFECT SYNONYMY AS DEFAULT`.

Aliases are not weaker shortcuts; they are alternate stable names for the same executable controls.

---

# XII. Exclusion, decisive evidence, realization control, and methodology evolution

## R59 — NEGATIVE DETERMINATION / EXCLUSION BEFORE IDENTIFICATION / النفي قبل تحديد المعنى
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** A root analysis may conclusively reject a candidate core before the correct positive core is fully identified. Negative determination is an independent scientific result.  
**Impact:** Allows reliable progress without forcing premature positive closure.  
**Trigger:** A candidate claims to be the invariant core and a decisive confirmed occurrence makes that claim impossible or illicitly forced.  
**Failure mode:** “We cannot reject X until we know the exact correct meaning.”  
**Examples:** `ن ش ز = disobedience` is rejectable from the bones occurrence even before the final core is known; `ك ت ب = physical pen-writing` is rejectable as the full core from decisive non-physical contexts.

## R60 — SEMANTIC EXCLUSION LEDGER / سجل الاستبعادات الدلالية
**Weight:** HIGH  
**Description:** Maintain rejected candidates with candidate, status, decisive evidence, logical rule, confidence, reopen condition, and mandatory `rejection_scope`, such as `REJECTED_AS_ROOT_CORE`, `REJECTED_AS_FORM_CONTRIBUTION`, `REJECTED_IN_CONSTRUCTION_X`, or `REJECTED_AS_LOCAL_MEANING`.  
**Impact:** Prevents rejected meanings from silently re-entering and prevents root-level rejection from erasing a valid local realization.  
**Trigger:** Any candidate is falsified or excluded.  
**Failure mode:** A rejected Root Core is reintroduced, or a root-level rejection is misread as prohibition of every local gloss.  
**Example:** `تحمل` may be rejected as BWA Root Core while remaining a local gloss in one construction.

## R61 — ROOT CORE ≠ LOCAL REALIZATION / CORE–REALIZATION SEPARATION / فصل النواة عن التحقق الموضعي
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** The invariant Root Core is distinct from a context-specific realization produced after morphology, construction, particles, participant roles, and context are applied.  
**Impact:** Prevents local paraphrases from becoming root definitions.  
**Trigger:** Any apparently familiar local meaning such as obligation, writing, rebellion, contract, or withdrawal.  
**Failure mode:** `كتب عليكم` → “therefore كتب = obligation.”  
**Example:** Obligation can be a local realization of `كتب + على + legislative context` without being the Root Core.

## R62 — REALIZATION DIVERSITY WITHOUT CORE MUTATION / تنوع التحققات بلا تحور النواة
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** A single invariant core may have widely different physical, relational, legal, or abstract realizations. Diversity of realization does not license multiple unrelated root meanings.  
**Impact:** Preserves R08 while allowing compositional richness.  
**Trigger:** Same root appears across distant domains.  
**Failure mode:** Assigning one root meaning per domain because local paraphrases differ.  
**Example:** Physical recording, legal obligation, and relational assignment in `ك ت ب` must be compositionally traceable to one core if root membership is confirmed.

## R63 — DECISIVE CONTEXT PRINCIPLE / مبدأ السياق الحاسم
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Contexts are weighted by information gain. A context may receive `DECISIVE` status only after material structural alternatives are recorded and it passes R101/R102 robustness requirements.  
**Impact:** Prevents frequency or a preferred parse from masquerading as decisive evidence.  
**Trigger:** Ranking occurrences or labeling one decisive/governing.  
**Failure mode:** A famous or structurally sensitive verse is called decisive without robustness.  
**Example:** `تبوءوا الدار والإيمان` remains structurally sensitive until attachment/parse robustness is established.

## R64 — INFORMATION-GAIN WEIGHTING / وزن كسب المعلومات
**Weight:** HIGH  
**Description:** Weight evidence by how much it reduces viable hypotheses, not merely by occurrence count.  
**Impact:** Improves sample design and hypothesis ranking.  
**Trigger:** Choosing contexts for a high-frequency root or comparing evidence strength.  
**Failure mode:** Frequency voting.  
**Example:** A rare self-referential construction can be more diagnostic than dozens of ordinary written-text contexts.

## R65 — CAN-MEAN / CANNOT-MEAN BOUNDARY / حدود ما يمكن وما لا يمكن أن يعنيه
**Weight:** HIGH  
**Description:** Report semantic boundaries as `REQUIRED`, `PERMITTED`, `EXCLUDED`, and `UNKNOWN` features, not only a single gloss.  
**Impact:** Captures reliable negative knowledge and preserves uncertainty.  
**Trigger:** Any provisional Root Core.  
**Failure mode:** Forcing one polished sentence to hide boundary uncertainty.  
**Example:** For `ك ت ب`, physical writing may be `PERMITTED` while “physical writing only” is `EXCLUDED_AS_CORE`.

## R66 — DECISIVE NEGATIVE EVIDENCE / الدليل السلبي الحاسم
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** One confirmed decisive occurrence can reject a universal Root Core candidate even if it does not identify the correct alternative.  
**Impact:** Operationalizes falsification for universal lexical claims.  
**Trigger:** A candidate claims invariance across the root corpus.  
**Failure mode:** Saving a candidate by labeling the decisive counterexample “special” without a general rule.  
**Example:** Bones reject `ن ش ز = disobedience` as a universal root core.

## R67 — ASYMMETRIC SEMANTIC CERTAINTY / عدم تماثل الثقة الدلالية
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Confidence in rejecting a candidate may legitimately be much higher than confidence in the current positive core. Report them separately.  
**Impact:** Prevents false symmetry between identification and exclusion.  
**Trigger:** Strong falsification but incomplete positive differentiation.  
**Failure mode:** Lowering a decisive rejection merely because the positive core is still provisional.  
**Example:** Positive core confidence may be moderate while rejection of `كتب = pen-writing only` is high.

## R68 — CORE-TO-REALIZATION DERIVATION CHAIN / سلسلة اشتقاق المعنى الموضعي
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Every local meaning must expose: `ROOT CORE + FORM OPERATOR + PARTICLE/CONSTRUCTION + ARGUMENT SEMANTICS/ROLE + CONTEXTUAL FACE = LOCAL MEANING`. Any unresolved layer remains `UNKNOWN`.  
**Impact:** Prevents form, particle, argument, or context contributions from being deposited into the Root Core.  
**Trigger:** Any local gloss or verse interpretation.  
**Failure mode:** A local meaning is asserted with no traceable layer attribution.  
**Example:** `كتب + على + legislative construction` may realize obligation; obligation is not automatically K-T-B Root Core.

## R69 — MORPHOLOGICAL OPERATOR INVARIANCE / ثبات مساهمة العامل الصرفي
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** A recurring morphological form/pattern is investigated under a one-invariant-contribution hypothesis across roots. This methodological principle does not establish any concrete operator value. Every concrete value carries an evidence scope label.  
**Impact:** Extends stability testing to morphology without turning a local gloss into a Quran-wide law.  
**Trigger:** Interpreting a derived pattern or comparing the same form across roots.  
**Failure mode:** The form is assigned unrelated ad-hoc meanings, or one root-local value is universalized.  
**Example:** `Form IV = CAUSE/ESTABLISH` remains empirical unless cross-root evidence reaches the declared scope.

## R70 — MORPHOLOGICAL CONTRIBUTION ≠ ROOT CONTRIBUTION / مساهمة الصيغة لا تساوي مساهمة الجذر
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Explicitly separate root contribution from form contribution and label the operator claim scope: `LOCAL_CONSTRUCTION | ROOT_INTERNAL | CROSS_ROOT_SUPPORTED | CORPUS_WIDE_SUPPORTED | REGRESSION_BACKED`.  
**Impact:** Prevents form semantics from contaminating the Root Core and prevents scope inflation.  
**Trigger:** Derived forms, voice, transitivity, gemination, number, tense/aspect, etc.  
**Failure mode:** A form-specific effect is stored as root meaning or described at broader scope than evidence supports.  
**Example:** A Form IV value observed in AMN remains `ROOT_INTERNAL` until cross-root testing.

## R71 — CROSS-ROOT FORM TEST / اختبار الصيغة عبر الجذور
**Weight:** HIGH  
**Description:** Infer a form contribution by comparing the same form across deliberately diverse roots, subtracting root-specific cores, testing competing operator hypotheses, and recording claim scope.  
**Impact:** Provides an empirical Quran-internal method for morphology.  
**Trigger:** Form semantics are uncertain or proposed beyond one root.  
**Failure mode:** Defining a pattern from one root or from inherited school glosses.  
**Example:** Compare multiple Form-IV roots before any `CROSS_ROOT_SUPPORTED` claim.

## R72 — BAYAN/STABILITY ASSUMPTION / افتراض البيان والاستقرار
**Weight:** HIGH / FOUNDATIONAL OPERATIONAL ASSUMPTION  
**Description:** Expect non-arbitrary semantic stability in roots, forms, particles, and recurring constructions, while treating each concrete operator value as an empirical hypothesis. Stability does not override corpus contradiction.  
**Impact:** Encourages system discovery while preserving falsifiability.  
**Trigger:** The same operator receives unrelated explanations across contexts/roots.  
**Failure mode:** Either arbitrary operator polysemy or forced invariance despite contradiction.  
**Example:** Particle contribution may be investigated invariantly; `ب = ANCHOR` is not established merely from one root.

## R73 — SUMMARY MUST INCLUDE EXCLUSIONS / الخلاصة تتضمن المستبعدات
**Weight:** HIGH  
**Description:** A mature root-analysis summary must state the current core candidate, what the root cannot mean as a shared core, decisive evidence for each exclusion, the rule/gate used, and unresolved questions.  
**Impact:** Makes negative knowledge visible and reusable.  
**Trigger:** Final/provisional root report.  
**Failure mode:** Reporting only the favored definition.  
**Example:** `ك ت ب`: exclude “physical writing only”; cite self-referential/abstract decisive contexts and the relevant exclusion rule.

## R74 — SELF-REFERENTIAL DECISIVE CONTEXT / السياق الحاسم المرجعي للذات
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** When actor and target/related participant collapse to the same referent, hypotheses that require two independent parties are sharply constrained or rejected.  
**Impact:** High information gain for participant-role semantics.  
**Trigger:** Self-reference such as `كتب على نفسه`.  
**Failure mode:** Inventing an external obligor/obligee to save a two-party definition.  
**Example:** `كتب على نفسه الرحمة` rejects `كتب = impose on someone else` as the invariant core.

## R75 — ROLE-COLLAPSE TEST / اختبار انهيار الأدوار
**Weight:** HIGH / CRITICAL  
**Description:** Re-test every candidate when semantic roles collapse into one referent; the candidate must still work naturally without fabricated participants.  
**Impact:** Detects hidden role assumptions.  
**Trigger:** Reflexive/self-referential constructions.  
**Failure mode:** Candidate works only after splitting one referent into artificial roles.  
**Example:** A definition requiring a separate external authority fails on `كتب على نفسه`.

## R76 — ABSTRACT-OBJECT DECISIVE TEST / اختبار الموضوع المجرد الحاسم
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** A confirmed abstract-object use is decisive against making a physical instrument or physical manifestation the invariant Root Core.  
**Impact:** Separates underlying relation from one material realization.  
**Trigger:** Root applies to abstract content/state without required material medium.  
**Failure mode:** Pen, ink, surface, or physical inscription is made necessary for the root.  
**Example:** `الرحمة` in `كتب على نفسه الرحمة` weakens physical inscription as the core.

## R77 — CONSTRUCTIONAL INVARIANT ACROSS PARTICIPANTS / ثبات التركيب عبر المشاركين
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** When the same root+construction recurs with different participants, extract the stable constructional contribution across participant changes.  
**Impact:** Separates lexical, constructional, and participant semantics.  
**Trigger:** Repeated structures such as `كتب + على` with self vs others.  
**Failure mode:** Participant-specific interpretation is assigned to the construction itself.  
**Example:** Compare `كتب على نفسه` and `كتب عليكم` before defining the contribution of `على`.

## R78 — DEONTIC REALIZATION ≠ ROOT CORE / التحقق الإلزامي ليس النواة
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Obligation/requirement in some `كتب + على` contexts is a possible deontic local realization, not automatically the invariant Root Core.  
**Impact:** Blocks legal-domain dominance.  
**Trigger:** Legislative occurrences.  
**Failure mode:** “كتب means impose/oblige” based only on legislation.  
**Example:** Self-referential `كتب على نفسه الرحمة` prevents reducing the root to imposing on another.

## R79 — ANALYTICAL MOVE → FORMAL RULE / من الحركة التحليلية إلى قاعدة رسمية
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Any analytical move that materially improves accuracy or prevents a recurring failure must be generalized into a named Rule/Gate rather than left as discussion prose.  
**Impact:** Converts discoveries into reusable methodology.  
**Trigger:** A correction, decisive inference, or repeated successful diagnostic.  
**Failure mode:** Same mistake recurs because the lesson was never formalized.  
**Example:** `كتب على نفسه الرحمة` generated R74/R75 rather than remaining only a K-T-B observation.

## R80 — PRINCIPLE BEFORE EXAMPLE / المبدأ قبل المثال
**Weight:** HIGH  
**Description:** Extract the general principle that makes an example informative, then preserve the example as illustration/regression.  
**Impact:** Prevents the Skill from becoming a bag of memorized examples.  
**Trigger:** A particularly strong verse/example teaches a reusable lesson.  
**Failure mode:** Example is stored without transferable logic.  
**Example:** Bones are not only an N-Sh-Z example; they instantiate decisive negative evidence.

## R81 — RULE PROVENANCE / أصل القاعدة
**Weight:** HIGH  
**Description:** Every formal Rule/Gate should record or preserve its origin case, failure prevented, related rules, example(s), regression test, and status where practical.  
**Impact:** Makes rule evolution auditable.  
**Trigger:** Adding/updating a rule.  
**Failure mode:** Rules accumulate without knowing why they exist.  
**Example:** `SELF-REFERENTIAL DECISIVE CONTEXT` provenance: K-T-B / `كتب على نفسه الرحمة`.

## R82 — RULE IMPACT WEIGHTING / وزن أثر القاعدة
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Rules are weighted by the effect of violation: `CONSTITUTIONAL/CRITICAL`, `HIGH`, `MEDIUM`, `SUPPORTING/HYPOTHESIS`. Higher-impact rules take precedence in constrained analysis.  
**Impact:** Prevents minor heuristics from competing with validity controls.  
**Trigger:** Rule registration or conflict.  
**Failure mode:** A supporting intuition overrides corpus/falsification controls.  
**Example:** Phonic intuition cannot override ZERO-PRIOR-MEANING or FALSIFICATION.

## R83 — FAILURE-MODE-DRIVEN RULE DESIGN / تصميم القاعدة من نمط الفشل
**Weight:** HIGH  
**Description:** Each rule should identify the concrete failure pattern it prevents, not only describe ideal behavior.  
**Impact:** Makes rules testable.  
**Trigger:** Creating/revising a rule.  
**Failure mode:** Vague guidance with no detectable violation.  
**Example:** ZERO-PRIOR-MEANING prevents importing a remembered gloss then searching for confirmation.

## R84 — GENERALIZE WITHOUT OVERGENERALIZING / عمّم بلا إفراط
**Weight:** HIGH  
**Description:** Generalize only as far as evidence supports. Every root-local operator/rule claim MUST state `generalization_scope` and promotion evidence. New rules may begin `PROPOSED/PROVISIONAL` and advance after independent regression success.  
**Impact:** Prevents one case from becoming a false universal law.  
**Trigger:** Promotion of a local observation, Rule/Gate, particle value, or form value.  
**Failure mode:** One example becomes a claim about all Quranic Arabic.  
**Example:** R109/R110 remain regression-pending until promotion evidence is met.

## R85 — RULE REGRESSION REQUIREMENT / شرط اختبار الانحدار
**Weight:** HIGH  
**Description:** Important rules should have one or more regression cases, including a must-pass and preferably a must-fail path.  
**Impact:** Prevents later Skill revisions from losing methodology.  
**Trigger:** Rule reaches `AGREED` or higher.  
**Failure mode:** Rule exists only in prose and is never tested.  
**Examples:** `tests/quran-n-sh-z-regression.md`; `tests/quran-k-t-b-regression.md`.

## R86 — DISCOVERY LOG → RULE REGISTRY / من سجل الاكتشاف إلى سجل القواعد
**Weight:** HIGH  
**Description:** Distinguish provisional discoveries from owner-agreed formal rules. Suggested lifecycle: `OBSERVED → PROPOSED_RULE → AGREED → REGRESSION_BACKED → weighted formal status`.  
**Impact:** Prevents temporary ideas from silently becoming constitution.  
**Trigger:** Methodology discussion.  
**Failure mode:** Hypothesis and rule status are conflated.  
**Example:** A new sound-symbolic observation remains provisional until agreed/tested.

## R87 — RULE CONSISTENCY CHECK / فحص اتساق القواعد
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Every new rule must be checked against existing constitutional controls before admission; conflicts require explicit revision rather than silent coexistence.  
**Impact:** Keeps the methodology coherent.  
**Trigger:** Adding/updating a rule.  
**Failure mode:** A new rule permits what ZERO-PRIOR-MEANING or SINGLE ROOT CORE forbids.  
**Example:** A context rule cannot authorize redefining the Root Core.

## R88 — METHOD VALUE > LOCAL ANSWER / قيمة المنهج أعلى من الجواب المحلي
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** The project values reusable methodological improvement above merely solving one lexical item. Successful or failed analyses must be mined for transferable rules before moving on.  
**Impact:** Compounds quality across future roots.  
**Trigger:** Completion/correction of an analysis.  
**Failure mode:** Good local answer but no retained lesson.  
**Example:** K-T-B analysis produced decisive-context and core/realization controls.

## R89 — SAME-VERSE LEXICAL COLLISION GATE / بوابة التصادم اللفظي في الآية نفسها
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Independent co-occurrence of the target and a proposed perfect synonym strongly supports non-identity. It does **not** by itself identify the positive semantic residue; positive differentiation requires independent corpus evidence or a separate discriminating test.  
**Impact:** Prevents both synonym collapse and unsupported residue invention.  
**Trigger:** Candidate synonym co-occurs independently with target.  
**Failure mode:** Either `كتب = جمع`, or “therefore the difference must be X” without evidence.  
**Example:** `كتب ... ليجمعنكم` blocks perfect identity but does not alone define K-T-B's positive residue.

## R90 — NECESSARY COMPONENT ≠ DEFINING CORE / المكوّن اللازم ليس النواة المعرّفة
**Weight:** HIGH / CRITICAL  
**Description:** A property may be necessary to a root model without being sufficient to define its lexical identity.  
**Impact:** Prevents reducing a specific root to a broad component.  
**Trigger:** Candidate such as collect, bind, move, or fix explains part of the pattern.  
**Failure mode:** “K-T-B involves collection, therefore K-T-B = collect.”  
**Example:** Collection may be part of K-T-B while structured relation/binding distinguishes it.

## R91 — NORMATIVE BINDING ≠ STRUCTURAL BINDING / الربط المعياري لا يساوي الربط البنيوي
**Weight:** CONSTITUTIONAL / CRITICAL  
**Description:** Distinguish legal/deontic obligation from the more general structural binding/constraint of elements in a system. Normative obligation may be a local realization rather than the invariant core.  
**Impact:** Prevents legislative contexts from overfitting the root.  
**Trigger:** Root appears in both legal and non-legal contexts.  
**Failure mode:** Every binding relation is paraphrased as legal obligation.  
**Example:** K-T-B may structurally bind elements/relations while `كتب عليكم` adds deontic force via construction/context.

## R92 — FALSE-CONTENT NEUTRALITY TEST / اختبار حياد المحتوى الكاذب
**Weight:** HIGH  
**Description:** If the root applies to false, corrupt, or illegitimate content, truth, authority, legitimacy, or correctness cannot be invariant Root Core requirements.  
**Impact:** Separates structural act/state from epistemic or moral status.  
**Trigger:** Confirmed false-content occurrence.  
**Failure mode:** “What is written is inherently authoritative/true.”  
**Example:** `يكتبون الكتاب بأيديهم ثم يقولون هذا من عند الله` preserves K-T-B while the claim is false.

## R93 — DOWNSTREAM EVENT ≠ ROOT CORE / الحدث اللاحق ليس النواة
**Weight:** HIGH  
**Description:** A later purpose/result/event in the same clause or verse must not be equated with the target Root Core merely because it follows from it.  
**Impact:** Prevents result-to-definition collapse.  
**Trigger:** Purpose/result clauses such as `لـ`, `ثم`, consequence statements.  
**Failure mode:** `كتب ... ليجمعنكم` → “therefore كتب = جمع.”  
**Example:** Gathering may be downstream from writing/binding, not lexical identity.

## R94 — INSTRUMENTAL REALIZATION ≠ ROOT CORE / التحقق الأداتي ليس النواة
**Weight:** HIGH / CRITICAL  
**Description:** A physical instrument or material realization used in some occurrences must not be promoted to Root Core when the root is confirmed in non-instrumental/abstract contexts.  
**Impact:** Prevents pen/hand/surface from defining K-T-B.  
**Trigger:** Root has both material and abstract uses.  
**Failure mode:** Physical writing is treated as the root itself.  
**Example:** `يكتبون ... بأيديهم` is a material realization; `كتب على نفسه الرحمة` shows the core must be more abstract.

## R95 — SEMANTIC DEFINITION REGISTRY / سجل التعريفات الدلالية
**Weight:** HIGH / GOVERNANCE  
**Description:** Preserve formally tracked definitions in a versioned registry with status, boundaries, decisive/structurally sensitive contexts, rejected alternatives and scope, local realizations, coverage/confidence, provenance, reopen condition, and regressions. Governance separation is mandatory: `LOCK_INTERNAL_RESULT ≠ OWNER_ACCEPTANCE ≠ REGISTRY_ADOPTION`.  
**Impact:** Preserves decisions without prior leakage or unauthorized promotion.  
**Trigger:** A locked result is prepared for owner review or a stored definition is revised.  
**Failure mode:** Chat-only definitions, pre-lock leakage, or automatic promotion from lock to AGREED.  
**Examples:** N-Sh-Z/K-T-B are project priors; AMN/SLM/BWA/RJL working cards remain blocked and retain their stated statuses.


# XIII. v3.2 approved Blind Lab and lock-governance rules

## R96 — BLIND SOURCE ISOLATION GATE / بوابة عزل مصادر المختبر الأعمى
**Weight:** CONSTITUTIONAL / CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** A run MUST NOT be described as blind unless source isolation is verifiable through a pinned manifest of allowed and blocked sources. Prompt-level instructions to “ignore priors” are insufficient if semantic priors remain accessible.  
**Impact:** Makes blindness an auditable source property rather than a behavioral claim.  
**Trigger:** Start of any blind root/lexeme rediscovery run.  
**Failure Mode:** A result is described as independently discovered even though registry definitions, prior analyses, translations, or other semantic priors were accessible.  
**Provenance:** Blind Lab governance; reinforced by AMN/SLM runs conducted outside fully isolated blind environments.  
**Related Rules:** R01, R02, R49, R51, R95.  
**Regression Test:** A run with Semantic Definition Registry access must return `BLIND_ISOLATION_NOT_VERIFIED`, not a blind-ready verdict.

## R97 — FROZEN METHODOLOGY DURING BLIND RUN / تجميد المنهج أثناء التشغيل الأعمى
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** The methodology and Skill versions are pinned at blind-run start. Newly observed failure modes or rule ideas are logged as discovery events but MUST NOT alter the active run procedure.  
**Impact:** Prevents the experiment from changing its own success criteria while being evaluated.  
**Trigger:** A potential new Rule/Gate is discovered pre-lock.  
**Failure Mode:** The analyst changes methodology mid-run and then treats the result as tested under one stable method.  
**Provenance:** Blind Lab Runbook and Process Observation Log; repeatedly needed during AMN/SLM.  
**Related Rules:** R79–R87.  
**Regression Test:** A pre-lock `DISCOVERY_EVENT` may be logged but must not modify the pinned run manifest or procedure.

## R98 — FORM-IDENTITY VERIFICATION GATE / بوابة التحقق من هوية الصيغة
**Weight:** CRITICAL when the inference depends on form identity; otherwise HIGH  
**Status:** ACTIVE / REFINED_IN_V3_3_0  
**Description:** Before an occurrence is used as evidence for a morphological claim, verify its exact formal identity: root length and assignment, additions, gemination, stem form, voice, aspect/view, mood, pronouns, relevant inflection, and high-impact construction features. Absence of a derived-form tag in a structural resource does not by itself prove triliteral Form I.  
**Impact:** Prevents false semantic generalization from morphological misclassification and prevents structural buckets from being mistaken for linguistic operators.  
**Trigger:** Any bare/derived-form comparison, operator claim, or aggregation of untagged/base records.  
**Failure Mode:** A derived form is treated as the base form, or an untagged bucket is labeled Form I although it contains quadriliteral or otherwise unverified members.  
**Provenance:** BWA cycle (`تبوء` vs `تبوّءا`); reinforced by AMN (`أَمِنَ` vs `آمَنَ`), SLM form stratification, and the v0.1 morphological-operator reference review.  
**Related Rules:** R09, R18–R20, R69–R71, R109, R112–R113.  
**Regression Test:** The analyst must establish the form distinction before using `أَمِنَ/آمَنَ` or `أَسْلَمَ/سَلَّمَ/استسلم` as operator evidence. A QAC untagged bucket of 12,347 verbs must not be reported as 12,347 confirmed triliteral Form-I verbs; the 14 quadriliteral-root candidates must be separated as a subset.

## R99 — CLAIMED-COVERAGE EVIDENCE GATE / بوابة إثبات ادعاء التغطية
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** A numerical corpus-coverage claim requires an auditable Evidence Matrix representing every occurrence counted in the numerator and denominator and its verification state.  
**Impact:** Separates real coverage from a query count or narrative claim.  
**Trigger:** Any `Corpus Coverage = X%`, `all occurrences`, or equivalent statement.  
**Failure Mode:** A tool count or sample is reported as complete coverage without occurrence-level evidence.  
**Provenance:** BWA/AMN methodology audits.  
**Related Rules:** R03–R06, R54–R56.  
**Regression Test:** `20/879 examined` must remain literal and must not be reported as full coverage regardless of diversity.

## R100 — POSITIVE-HYPOTHESIS COMPETITION GATE / بوابة تنافس الفرضيات الإيجابية
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** Strong negative determination does not authorize immediate promotion of the first surviving abstraction. Generate genuinely competing positive hypotheses plus `C0`, each with predictions and falsification conditions.  
**Impact:** Prevents premature abstraction after conventional glosses are rejected.  
**Trigger:** A strong exclusion ledger with no positively discriminated core.  
**Failure Mode:** Several familiar glosses are rejected and one newly invented abstraction is accepted simply because it is the only positive candidate formulated.  
**Provenance:** BWA and AMN.  
**Related Rules:** R12, R16, R42, R57, R59, R67.  
**Regression Test:** Semantic Boundary is blocked if Stage 1 contains fewer than two genuine positive candidates plus `C0` when the evidence permits alternatives.

## R101 — STRUCTURAL-AMBIGUITY BEFORE DECISIVENESS / الغموض البنيوي قبل الحسم
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** An occurrence MUST NOT be labeled decisive when its inferential force depends on an unverified parse, attachment, pronoun antecedent, ellipsis, scope, or other structurally material choice.  
**Impact:** Prevents a false Root Core built on one preferred parse.  
**Trigger:** Any high-information occurrence with a structurally consequential alternative.  
**Failure Mode:** `UNVERIFIED PARSE → FALSE DECISIVE CONTEXT → FALSE ROOT CORE`.  
**Provenance:** BWA 59:9; reinforced by AMN particle analysis.  
**Related Rules:** R10, R11, R18, R63, R64.  
**Regression Test:** Any decisive claim that depends on shared attachment must record material alternatives first.

## R102 — DECISIVE-CONTEXT ROBUSTNESS ACROSS PARSES / متانة السياق الحاسم عبر التحليلات النحوية
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** After plausible structural analyses are enumerated, test the decisive claim across them. If a reasonable parse removes the decisive force, downgrade the occurrence to `STRUCTURALLY_SENSITIVE_CANDIDATE`.  
**Impact:** Makes decisiveness depend on structural robustness.  
**Trigger:** More than one materially plausible parse for a high-information occurrence.  
**Failure Mode:** A context remains “decisive” although a reasonable alternate parse makes it merely indeterminate.  
**Provenance:** BWA methodology audit; codified in Blind Lab v2.  
**Related Rules:** R63, R64, R101.  
**Regression Test:** If Parse B changes `CONTRADICTS` to `INDETERMINATE`, the occurrence cannot retain `DECISIVE` without resolving Parse B.

## R103 — ARGUMENT-STRUCTURE ≠ ROOT CORE / بنية المشاركين لا تساوي المفهوم الجذري
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** A participant frame such as “entity + location/state” or “source + target” is not sufficient to identify a Root Core. The analysis must isolate the lexical property that distinguishes this relation from roots sharing the same frame.  
**Impact:** Prevents syntax/argument structure from masquerading as lexical identity.  
**Trigger:** Root proposals phrased mainly as participant relations.  
**Failure Mode:** `PARTICIPANT FRAME → MISTAKEN FOR LEXICAL IDENTITY`.  
**Provenance:** BWA; reinforced by RJL/AMN.  
**Related Rules:** R27–R31, R34, R42.  
**Regression Test:** A core that can describe several near-neighbor roots unchanged fails until a semantic residue is shown.

## R104 — CONSTRUCTIONAL-CONTRIBUTION SUBTRACTION / طرح مساهمة التركيب
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** Before a semantic feature is assigned to the Root Core, subtract all contribution plausibly attributable to morphological form, particles, construction, argument semantics/roles, and context.  
**Impact:** Prevents constructional meaning from being deposited into the root.  
**Trigger:** Derived forms, particle constructions, semantically rich objects/arguments, and alternating valency/constructions.  
**Failure Mode:** A feature originating in `ب/ل/من`, a form operator, argument meaning, or construction is asserted as root meaning.  
**Provenance:** BWA; central in AMN; reinforced in SLM.  
**Related Rules:** R18–R25, R61, R68–R71.  
**Regression Test:** Representative local meanings must be displayed as `ROOT + FORM + PARTICLE/CONSTRUCTION + ARGUMENT ROLE + CONTEXT` with unresolved layers preserved as `UNKNOWN`.

## R105 — ABSTRACT-CORE OPERATIONALIZATION GATE / بوابة تشغيل المفهوم المجرد
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** An abstract Root Core is not accepted merely because it is broad enough to fit the corpus. Its abstract terms must be converted into testable REQUIRED/EXCLUDED features, predictions, competitors, and a falsification condition.  
**Impact:** Prevents unfalsifiable rhetorical abstractions.  
**Trigger:** Core wording such as relation, structure, determination, realization, independence, transition, or other high-level abstractions.  
**Failure Mode:** `OVER-ABSTRACT CORE → UNIVERSAL COMPATIBILITY → ZERO DISTINCTIVENESS`.  
**Provenance:** BWA/RJL/AMN.  
**Related Rules:** R13–R15, R42, R65, R90.  
**Regression Test:** A core with no predicted failure case or lexical residue fails this Gate.

## R106 — ROOT-CORE PREDICTIVE CONTENT GATE / بوابة المحتوى التنبؤي للمفهوم الجذري
**Weight:** HIGH; blocking before lock  
**Status:** INTEGRATE_V3_2  
**Description:** A mature Root Core must constrain an occurrence or feature not used to build it. It must generate a prediction capable of failing rather than merely explaining observations post hoc.  
**Impact:** Gives operational content to falsification.  
**Trigger:** Transition from `QURAN_TESTED` toward lock eligibility.  
**Failure Mode:** A post-hoc model that accepts every possible outcome.  
**Provenance:** BWA/AMN.  
**Related Rules:** R16, R42, R57, R85.  
**Regression Test:** Withhold a suitable occurrence/feature, record the prediction, then reveal it; a core that constrained nothing has insufficient predictive content.

## R107 — CROSS-DERIVATION BRIDGE EVIDENCE GATE / بوابة دليل الجسر عبر الاشتقاقات
**Weight:** CRITICAL  
**Status:** INTEGRATE_V3_2  
**Description:** When derivational branches appear semantically distant, SINGLE ROOT CORE does not license an invented abstraction. A testable semantic bridge must show how the invariant survives across the branches without semantic mutation.  
**Impact:** Prevents forced unification.  
**Trigger:** Materially distant nominal/verbal, physical/abstract, bodily/relational, or other derivational branches.  
**Failure Mode:** `SINGLE ROOT CORE PRESSURE → OVERGENERALIZED BRIDGE`.  
**Provenance:** RJL; reinforced by AMN and SLM hard branches.  
**Related Rules:** R07, R08, R26, R35, R42, R62.  
**Regression Test:** Shared spelling/root assignment is insufficient; the bridge must survive every branch and produce at least one negative prediction.

## R108 — LOCK ELIGIBILITY GATE / بوابة أهلية القفل
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

# XIV. Constitutional owner decisions outside the numbered registry

The following are active constitutional authorities and are not optional candidates:

- `OCD-001 — QURAN-INTERNAL SEMANTIC SOVEREIGNTY`.
- `OCD-002 — MANDATORY LAYERED SEMANTIC ANALYSIS & PRESENTATION PROTOCOL`.
- `OCD-003 — ARABIC-FIRST SCIENTIFIC PRESENTATION STANDARD`.

Full wording is stored under `references/quran/governance/`.

R109–R113 are active in v3.3.0. Non-promoted candidates remain non-authoritative; see `rules/v3.2/RULE_STATUS_LEDGER.md`.


# XV. إضافات v3.2.2 المعتمدة

## R109 — UNATTESTED-BASE FORM CAUTION GATE / بوابة الحذر من الصيغة الأساس غير الموثقة
**Weight:** HIGH  
**Status:** ACTIVE / REGRESSION_BACKED_IN_PACKAGE  
**Description:** عندما تكون صيغة مشتقة موثقة في corpus بينما الصيغة الأساس المقارنة غير موثقة أو غير مستقرة، يُمنع اختراع gloss للأساس واستخدامه دليلًا على مساهمة الصيغة المشتقة. تُستخرج النواة من الأسرة الموثقة، ويُخفض نطاق دعوى العامل الصرفي.  
**Impact:** يمنع صناعة معنى أساس افتراضي ثم استخدامه Prior خفيًا في تفسير المزيد.  
**Trigger:** صيغة مزيدة موثقة مع غياب الأساس أو ضعف دليله.  
**Failure mode:** `UNATTESTED BASE → INVENTED GLOSS → FALSE FORM OPERATOR`.  
**Provenance:** دورة س ل م/أَسْلَمَ، مع Regression قائم.  
**Related rules:** R03, R07, R09, R18–R20, R69–R71, R98.  
**Regression test:** إذا وُجد Form IV ولم يثبت Form I، يجب حظر قول «الأساس يعني X، إذن المزيد يسبب X» إلا بدليل مستقل من الأسرة الموثقة.

## R110 — PRIVATIVE-CORE POSITIVE-RESIDUE GATE / بوابة البقية الإيجابية للنواة السلبية
**Weight:** HIGH; BLOCKING BEFORE LOCK WHEN TRIGGERED  
**Status:** ACTIVE / REGRESSION_BACKED_IN_PACKAGE  
**Description:** إذا صيغ مرشح Root Core بوصفه مجرد غياب أو نفي لخاصية X، يجب البحث خصوميًا عن سياق يذكر غياب X بصورة مستقلة مع بقاء اللفظ المستهدف غير زائد. إذا بقي له أثر دلالي، فالنواة السلبية المحضة غير كافية، ويجب استخراج البقية الإيجابية بعد طرح مساهمة الصيغة والتركيب.  
**Impact:** يمنع التعريفات السلبية الواسعة التي تقبل كل المواضع لأنها لا تقدم محتوى تمييزيًا موجبًا.  
**Trigger:** تعريف من نوع «غياب X / لا Y / من دون Z».  
**Failure mode:** `PRIVATIVE CORE → UNIVERSAL FIT → NO POSITIVE PREDICTION`.  
**Provenance:** دورة س ل م، ولا سيما بقاء target lexeme بعد تعبير سلبي مستقل.  
**Related rules:** R15, R16, R27–R31, R42, R104–R106.  
**Regression test:** إذا عبّر السياق عن غياب المانع مستقلًا ثم استعمل الجذر، لا يجوز أن تبقى النواة مجرد «غياب المانع».

## R111 — OPERATOR-CONTRIBUTION INDEPENDENCE & INVARIANCE / استقلال مساهمة العامل اللغوي وثباتها
**Weight:** HIGH / FOUNDATIONAL OPERATIONAL RULE  
**Status:** ACTIVE_WITH_SCOPE_LABELING  
**Description:** كل عامل لغوي متكرر—صيغة صرفية أو حرف أو تركيب—يُبحث تحت فرضية مساهمة جوهرية مستقرة يمكن فصلها عن Root Core وعن معنى المشاركين والسياق. لا يثبت أي معنى محدد للعامل إلا بدليل داخلي عابر للبيئات، ويجب وسم نطاق الدعوى.  
**Impact:** يوسع R69–R72 من الصيغ الصرفية إلى الحروف والتراكيب، مع منع كل من التفسير الاعتباطي والتعميم المبكر.  
**Trigger:** تفسير صيغة أو حرف أو تركيب متكرر، أو اختلاف تفسير العامل نفسه بين جذور/بيئات.  
**Failure mode:** `LOCAL OPERATOR GLOSS → SILENT GLOBAL LAW`, أو `SAME OPERATOR → UNRELATED AD-HOC MEANINGS`.  
**Provenance:** AMN/SLM ومراجعة v3.2.1.  
**Related rules:** R09, R18–R24, R68–R72, R84, R98, R104, R109.  
**Regression test:** لا تُرفع قيمة عامل من `ROOT_INTERNAL` إلى `CROSS_ROOT_SUPPORTED` قبل مقارنة بيئات مستقلة وطرح مساهمة الجذور والمشاركين.

# XVI. إضافات v3.3.0 المعتمدة — مرجع العوامل الصرفية

## R112 — STRUCTURAL ATTESTATION ≠ OPERATOR SEMANTIC VALIDATION / الإثبات البنيوي لا يساوي إثبات دلالة العامل
**Weight:** CONSTITUTIONAL / CRITICAL  
**Status:** ACTIVE / REGRESSION_BACKED_IN_PACKAGE  
**Description:** عدد ورود صيغة، وعدد الجذور المرشحة، ووسم QAC أو أي مورد بنيوي يثبت وجود البنية أو ترشيح هويتها فقط؛ ولا يثبت المساهمة الدلالية للعامل. يجب فصل `structural_status` عن `semantic_status` وعن `claim_scope` وعن حالة `Evidence Matrix`.  
**Impact:** يمنع تحويل كثرة الشواهد البنيوية إلى قانون دلالي، ويحفظ الفصل بين طبقة البنية وطبقة الاستنباط.  
**Trigger:** الاستدلال بعدد الصيغ أو الجذور أو وسم مورد صرفي على معنى الوزن أو الحرف أو التركيب.  
**Failure mode:** `STRUCTURAL COUNT → SEMANTIC CERTAINTY` أو `QAC TAG → OPERATOR MEANING`.  
**Provenance:** مراجعة `LISAN Quranic Morphological Operator Reference v0.1`؛ ثبت أن الأعداد صحيحة بنيويًا بينما القيم العاملية لم تكن مصحوبة بمصفوفة أدلة دلالية.  
**Related rules:** R03–R06, R20–R24, R54–R56, R69–R72, R98–R99, R111.  
**Regression test:** لا يجوز الاستدلال من وجود 3,487 فعلًا موسومًا Form IV على أن `أَفْعَلَ = التعدية` أو `الإحداث` بوصفه قانونًا معتمدًا. يجب أن يبقى العدد `STRUCTURAL` والقيمة `CANDIDATE` حتى ينجح الاختبار العابر للجذور والدحض.

## R113 — MORPHOLOGICAL OPERATOR STACK NON-COLLAPSE / عدم دمج طبقات العوامل الصرفية
**Weight:** CONSTITUTIONAL / CRITICAL  
**Status:** ACTIVE / REGRESSION_BACKED_IN_PACKAGE  
**Description:** المعنى الموضعي للصيغة المركبة يجب أن يفصل طبقاتها المستقلة: `ROOT CORE + STEM FORM + ASPECT/VIEW + VOICE + MOOD + NOMINALIZATION/PARTICIPLE + PARTICLE/CONSTRUCTION + ARGUMENTS + CONTEXT`. لا يجوز دمج أثرين أو أكثر في gloss واحد ثم نسبتهما إلى الجذر أو إلى وزن اشتقاقي واحد.  
**Impact:** يمنع نسبة أثر المبني للمجهول أو التام/غير التام أو المزاج أو المصدر/اسم الفاعل إلى Root Core أو Stem Form، ويجعل تغاير المبنى قابلًا للتتبع.  
**Trigger:** كل لفظ يحمل أكثر من سمة صرفية/نحوية مؤثرة، أو كل مقارنة بين صيغ تتغير فيها عدة طبقات معًا.  
**Failure mode:** `MULTIPLE OPERATORS → SINGLE UNTRACEABLE GLOSS` أو `VOICE/ASPECT EFFECT → ROOT OR FORM MEANING`.  
**Provenance:** معمارية مرجع العوامل الصرفية v0.1، وصقلها في v0.2.  
**Related rules:** R09, R18–R24, R68–R72, R98, R104, R109, R111–R112.  
**Regression test:** تحليل `أُنزِلَ` يجب أن يفصل Root N-Z-L عن Form IV وعن `PERF` وعن `PASSIVE`. يفشل التحليل إذا وصف الكلمة كلها بأنها «معنى Form IV» أو أودع أثر المبني للمجهول في Root Core.

