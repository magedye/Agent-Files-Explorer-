# Lisan Methodology Audit & Rule Extraction Template v1.1 — Canonical Consolidated

**Purpose:** Post-lock methodology audit for a completed Blind Lab run. This document is not a semantic-definition card. Its primary purpose is to extract reusable methodology improvements, rule refinements, regression tests, and Skill changes from the run.

> **Authority note:** `METHOD VALUE > LOCAL ANSWER` — the reusable methodological lesson is more valuable than merely solving one root locally.

> **Lock requirement:** This template is filled only after a valid `LOCK_INTERNAL_RESULT`. Pre-lock methodological events are recorded in the separate **Blind Process Observation Log** and imported here after lock.

---

## 0. Audit Identity

```yaml
audit_id: ""
root_or_target: ""
blind_run_id: ""
blind_run_type: "LOW_FREQUENCY_ROOT | HIGH_FREQUENCY_ROOT | PHYSICAL_ABSTRACT | LEXICAL_COLLISION | MULTI_FORM | CONSTRUCTION | OTHER"
methodology_version: ""
skill_version: ""
canonical_profile: "HAFS_ASIM_MADINAH"
started_at: ""
locked_at: ""
audited_at: ""
auditor: ""
```

### Run integrity

```yaml
methodology_version_pinned: true | false
blind_source_manifest_pinned: true | false
prior_isolation_verified: true | false
corpus_claim_supported_by_evidence_matrix: true | false
lock_eligibility_passed: true | false
```

If any value is `false`, explain before continuing.

---

# 1. Result Snapshot — Do Not Re-derive

Import the locked result exactly as recorded. Do not improve or rewrite it after viewing priors.

```yaml
locked_result:
  root_core_candidate: ""
  status: ""
  semantic_boundary:
    REQUIRED: []
    PERMITTED: []
    EXCLUDED: []
    UNKNOWN: []
  positive_core_confidence: ""
  negative_determination_confidence: ""
  structural_stability: ""
  corpus_coverage: ""
  context_diversity_coverage: ""
  lexical_differentiation_status: ""
```

### Strongest decisive/discriminating contexts

| Context | Status | Information gain | Structural stability | What it proves/excludes |
|---|---|---|---|---|
| | | | | |

### Strongest unresolved point

- **Unresolved issue:**
- **Why unresolved:**
- **Reopen condition:**

---

# 2. Observable Failure Modes & Friction Points

Do **not** reconstruct hidden chain-of-thought. Audit only observable artifacts from the run: rejected hypotheses, revisions, gate reports, structural disputes, invalid transitions, source-access attempts, and recorded process events.

For each event:

```yaml
failure_event:
  event_id: ""
  stage: "BLIND_DISCOVERY | FALSIFICATION | SEMANTIC_BOUNDARY | LOCK"
  observed_failure_or_friction: ""
  evidence_artifact: ""
  impact: "LOW | MEDIUM | HIGH | CRITICAL"
  corrected_during_run: true | false
  correction_used: ""
  recurrence_risk: "LOW | MEDIUM | HIGH"
```

### Failure Mode Register

| ID | Stage | Observable failure/friction | Impact | Existing rule that should have prevented it | Did the rule fail, or was it missing? |
|---|---|---|---|---|---|
| | | | | | |

---

# 3. Gate Effectiveness Audit

For every relevant Gate, classify:

- `EFFECTIVE`
- `PARTIALLY_EFFECTIVE`
- `NOT_TRIGGERED`
- `TRIGGERED_TOO_LATE`
- `AMBIGUOUS`
- `MISSING_GATE`

| Rule/Gate | Status | Trigger evidence | Effect on result | Required change |
|---|---|---|---|---|
| ZERO-PRIOR-MEANING | | | | |
| CORPUS-FIRST GATE | | | | |
| OBSERVATION ≠ INTERPRETATION | | | | |
| FALSIFICATION GATE | | | | |
| DECISIVE CONTEXT PRINCIPLE | | | | |
| STRUCTURAL-AMBIGUITY BEFORE DECISIVENESS | | | | |
| ABSTRACTION ESCALATION GATE | | | | |
| ROOT-TRACEABILITY GATE | | | | |
| CONSTRUCTIONAL-CONTRIBUTION SUBTRACTION | | | | |
| LEXICAL DISTINCTIVENESS | | | | |
| NEGATIVE DETERMINATION | | | | |
| CLAIMED-COVERAGE EVIDENCE GATE | | | | |
| LOCK ELIGIBILITY GATE | | | | |

---

# 4. Candidate Rule Extraction

A methodological observation does not become a formal rule automatically.

Lifecycle:

`OBSERVED → PROPOSED_RULE → AGREED → REGRESSION_BACKED → authoritative weight`

For every proposed rule:

```yaml
rule_candidate:
  proposed_rule_id: ""
  name: "ENGLISH RULE NAME"
  arabic_label: ""
  status: "PROPOSED_RULE"
  weight: "CONSTITUTIONAL/CRITICAL | HIGH | MEDIUM | SUPPORTING/HYPOTHESIS"
  description: ""
  impact: ""
  trigger: ""
  failure_mode_prevented: ""
  provenance:
    root_or_target: ""
    context_or_artifact: ""
    run_id: ""
  related_rules: []
  examples: []
  regression_tests: []
  generalization_scope: ""
  evidence_needed_for_promotion: ""
```

### Mandatory checks before promotion

- [ ] **PRINCIPLE BEFORE EXAMPLE:** The rule captures the general principle, not only the local verse.
- [ ] **GENERALIZE WITHOUT OVERGENERALIZING:** Scope does not exceed evidence.
- [ ] **RULE CONSISTENCY CHECK:** No conflict with constitutional rules.
- [ ] **FAILURE-MODE-DRIVEN RULE DESIGN:** Violation is observable/testable.
- [ ] **RULE REGRESSION REQUIREMENT:** At least one regression test is specified.
- [ ] **RULE PROVENANCE:** Origin and failure prevented are recorded.

---

# 5. Existing Rule Refinement

Use this when the run reveals that a rule exists but is too weak, late, ambiguous, or overly broad.

```yaml
rule_refinement:
  rule_id: ""
  current_text_or_behavior: ""
  observed_gap: ""
  proposed_refinement: ""
  reason: ""
  compatibility_impact: "NONE | PATCH | MINOR | MAJOR"
  affected_regressions: []
  new_regressions_required: []
```

---

# 6. Post-Lock Differential Analysis

This section is opened only after `LOCK_INTERNAL_RESULT`.

Permitted post-lock semantic comparison sources under current project policy:

- Semantic Definition Registry;
- prior Quran-internal project results;
- *على بصيرة* only if classified as a project-internal prior/benchmark and opened after lock.

Inherited external semantic authorities—tafsir, dictionaries, hadith, poetry, conventional religious/cultural meanings, translations/glosses—remain outside the semantic validation pipeline at every stage. A separate historical/comparative study requires explicit owner instruction and may not validate or rewrite the locked Quran-internal result.

For each prior:

```yaml
prior_comparison:
  source: ""
  comparison: "MATCH | PARTIAL_MATCH | CONFLICT | NEW_DIMENSION | UNRESOLVED"
  overlapping_features: []
  new_features_in_blind_result: []
  unsupported_features_in_prior: []
  prior_features_not_recovered_blindly: []
  methodological_lesson: ""
```

### Non-rewrite rule

- [ ] The locked internal result was not silently edited after comparison.
- [ ] Any change required by post-lock evidence is represented as a new revision with provenance.

---

# 7. Skill Engineering Impact

Classify the run outcome:

```text
NO_METHOD_CHANGE
NEW_RULE
RULE_REFINEMENT
RULE_CONFLICT
NEW_REGRESSION
SCHEMA_CHANGE
WORKFLOW_CHANGE
SOURCE_FIREWALL_CHANGE
SKILL_PROMPT_CHANGE
```

### Proposed changes

| Change | Target artifact | Reason | Required version bump | Regression evidence |
|---|---|---|---|---|
| | | | | |

Possible targets include:

- `rules/`
- `methodology/`
- `templates/quran/`
- `quality/`
- `schemas/`
- `tests/`
- `references/quran/`
- `SKILL.md`

---

# 8. Semantic Registry Adoption Decision

The methodology auditor does not self-grant owner semantic acceptance.

```yaml
registry_adoption:
  eligible_for_owner_review: true | false
  proposed_status: "BLIND_TESTED | PROVISIONAL | AGREED | REGRESSION_BACKED | UNRESOLVED"
  blockers: []
  semantic_definition_diff_ready: true | false
```

Owner approval is required before promoting an owner-governed semantic definition to `AGREED`.

---

# 9. Regression Package

For each new or refined rule, define tests.

```yaml
regression_case:
  test_id: ""
  target_rule: ""
  must_pass_case: ""
  must_fail_case: ""
  expected_gate_behavior: ""
  expected_status: ""
```

Include at least one case that would have reproduced the failure observed in this run.

---

# 10. Final Audit Verdict

```yaml
methodology_audit_verdict:
  blind_run_validity: "VALID | VALID_WITH_LIMITATIONS | INVALID"
  reusable_method_value: "NONE | LOW | MEDIUM | HIGH | CRITICAL"
  new_rules_proposed: 0
  rules_refined: 0
  regressions_added: 0
  semantic_definition_ready_for_owner_review: true | false
  skill_release_recommended: "NO | AFTER_MORE_ROOTS | PATCH | MINOR | MAJOR"
  next_methodology_action: ""
```

## Executive summary

- **What the root analysis taught us about the methodology:**
- **Most important failure prevented/discovered:**
- **Most important reusable rule:**
- **What must change before the next Blind Lab run:**
