# Lisan Blind Lab Operator Runbook v1.1 — Canonical Consolidated

## Purpose

Operational guide for running a reproducible Blind Lab cycle whose primary output is both:

1. a more reliable Quran-internal semantic result; and
2. reusable methodology improvements for the Skill.

The Blind Lab is not the permanent knowledge hub. It is an isolated experiment. The Project Hub owns registries, accepted methodology, releases, and priors.

**Constitutional source rule:** Quran-internal semantic evidence only. Inherited external semantic authorities are not used before or after lock.

---

# 1. Roles

## Project Hub / Control Plane

Owns:

- Constitution;
- Rule Registry;
- Semantic Definition Registry;
- Root Roadmap;
- Decisive Context Registry;
- Regression Tests;
- methodology/Skill versions;
- owner decisions;
- post-lock priors.

## Blind Lab

Receives only:

- pinned methodology/Skill version;
- canonical Quran corpus/profile;
- approved non-semantic structural data;
- target root/lexeme/test type.

It must not receive semantic priors before lock.

---

# 2. Preflight — Before Opening the Blind Thread

Create a run manifest:

```yaml
blind_run:
  run_id: ""
  target: ""
  test_type: ""
  methodology_version: ""
  skill_version: ""
  canonical_profile: "HAFS_ASIM_MADINAH"
  allowed_sources: []
  blocked_sources: []
  expected_corpus_policy: "ALL | ADVERSARIAL_SAMPLE_THEN_EXPAND"
```

### Mandatory blocked sources pre-lock

- Semantic Definition Registry;
- *على بصيرة*;
- prior semantic reports;
- dictionary meanings;
- translations/glosses;
- synonym lists;
- semantic embeddings/labels;
- tafsir.

Tafsir stays prohibited after lock too.

### Preflight verdict

- `READY_FOR_BLIND_RUN`
- `BLIND_ISOLATION_NOT_VERIFIED`
- `SOURCE_PROFILE_INCOMPLETE`

Do not call a run “blind” if source isolation is not verifiable.

---

# 3. Stage 1 — Blind Discovery

Use `blind-lab-master-prompt-v2.md`.

Required deliverables:

1. Corpus Status.
2. Occurrence profiles.
3. Observation/Constraint Matrix.
4. Negative Determination Ledger.
5. Multiple positive hypotheses + `C0`.
6. Structural ambiguity list.
7. Blind Process Observation Log.

### Operator checks

- Has the model proposed a Root Core too early?
- Did any conventional gloss enter as evidence?
- Is corpus completeness demonstrated or merely asserted?
- Were decisive contexts labeled before parse stability was checked?
- Did a broad abstraction emerge that can fit almost anything?

If yes, trigger the corresponding Gate; do not supply the correct semantic answer.

---

# 4. Stage 2 — Adversarial Falsification

Prefer a fresh review thread/session when practical, using only the Stage-1 artifacts and the same pinned methodology—not semantic priors.

Ask the reviewer to:

- attack the strongest candidate;
- preserve `C0`;
- search for true contradictions;
- distinguish `INDETERMINATE` from `CONTRADICTS`;
- test structural alternatives;
- search for decisive contexts with high information gain;
- test lexical competitors;
- apply counterfactual substitution;
- check constructional contribution subtraction;
- identify over-abstraction.

### Output

A falsification matrix:

| Occurrence | H1 | H2 | H3 | C0 | Structural sensitivity | Notes |
|---|---|---|---|---|---|---|

---

# 5. Stage 3 — Semantic Boundary

Create the semantic card:

```yaml
ROOT_CORE_CANDIDATE: ""
REQUIRED: []
PERMITTED: []
EXCLUDED: []
UNKNOWN: []
DECISIVE_CONTEXTS: []
STRUCTURALLY_SENSITIVE_CONTEXTS: []
NEAREST_LEXEMES: []
LOCAL_REALIZATIONS: []
FALSIFICATION_CONDITION: ""
```

Do not confuse:

- Root Core;
- morphology;
- construction;
- argument semantics;
- context;
- local gloss.

---

# 6. Stage 4 — Lock Eligibility

Request a Lock Eligibility Report.

Minimum conditions:

- source isolation verified;
- corpus claim auditable;
- multiple positive hypotheses + `C0` considered;
- negative ledger present;
- strongest counterexample examined;
- structural ambiguity handled;
- abstraction operationalized;
- representative local meanings traceable to Root Core;
- lexical differentiation sufficiently advanced for the intended claim;
- no unresolved genuine contradiction hidden;
- falsification condition exists.

If not satisfied: `LOCK_BLOCKED`.

`LOCK_INTERNAL_RESULT` is a snapshot, not owner acceptance.

---

# 7. Stage 5 — Post-Lock Comparison

Only now expose permitted priors.

Compare independently against:

1. Semantic Definition Registry;
2. *على بصيرة*;
3. approved previous project results;
4. No inherited external semantic authority is opened in the semantic pipeline. Dictionaries/hadith/poetry/tafsir/conventional glosses remain prohibited. Separate historical/comparative work requires an explicit owner request and is isolated from semantic validation.

Never use tafsir.

Classify:

`MATCH | PARTIAL_MATCH | CONFLICT | NEW_DIMENSION | UNRESOLVED`

Do not overwrite the locked result. If comparison changes the analysis, create a new revision with provenance.

---

# 8. Stage 6 — Registry Adoption

Prepare a Semantic Definition Registry Diff.

Owner decides whether status becomes:

- `BLIND_TESTED`
- `PROVISIONAL`
- `AGREED`
- `REGRESSION_BACKED`
- `UNRESOLVED`

The model/agent cannot self-grant owner acceptance.

---

# 9. Stage 7 — Methodology Audit & Rule Extraction

Use `methodology-audit-rule-extraction-template-v1.md`.

Import the pre-lock Blind Process Observation Log.

Classify outcome:

- `NO_METHOD_CHANGE`
- `NEW_RULE`
- `RULE_REFINEMENT`
- `RULE_CONFLICT`
- `NEW_REGRESSION`
- `SCHEMA_CHANGE`
- `WORKFLOW_CHANGE`
- `SOURCE_FIREWALL_CHANGE`
- `SKILL_PROMPT_CHANGE`

Do not change the methodology retroactively for the completed run.

---

# 10. Skill Release Cadence

Do not release a new Skill version after every observation.

Recommended:

```text
Blind Runs
→ Discovery Logs
→ 5–10 roots or a major critical discovery
→ Rule consolidation
→ Regression expansion
→ Methodology Audit
→ Skill release
```

Immediate release is justified for a critical defect such as:

- prior leakage;
- invalid lock behavior;
- a constitutional rule contradiction;
- corrupted corpus claims;
- a Gate that permits systematic false confidence.

---

# 11. Recommended Root-Test Portfolio

Choose roots for methodological diversity, not only lexical importance.

Include over time:

- low-frequency full-corpus roots;
- very high-frequency roots;
- material/abstract cross-domain roots;
- roots with many morphological forms;
- close lexical pairs;
- roots with strong conventional priors;
- roots with structurally ambiguous decisive candidates;
- same-form cross-root morphology tests.

The roadmap is a prioritization tool, not semantic evidence.

---

# 12. Operator Commands — Logical Interface

These are workflow labels, not assumed ChatGPT product slash commands.

```text
INIT_BLIND_LAB(target)
RUN_FALSIFICATION(run_id)
BUILD_SEMANTIC_BOUNDARY(run_id)
CHECK_LOCK_ELIGIBILITY(run_id)
LOCK_INTERNAL_RESULT(run_id)
COMPARE_PRIORS(run_id)
PREPARE_REGISTRY_DIFF(run_id)
RUN_METHODOLOGY_AUDIT(run_id)
EXTRACT_RULE(event_id)
AUDIT_METHODOLOGY()
NEXT_PRIORITY()
```

---

# 13. Success Criteria for One Run

A run is valuable even if no positive Root Core is adopted.

Success may be:

- a strong negative boundary;
- a decisive context identified;
- a structural ambiguity discovered;
- a prior meaning falsified;
- a new Rule/Gate discovered;
- a regression case added;
- a semantic definition safely adopted.

This is the operational meaning of:

**METHOD VALUE > LOCAL ANSWER**.
