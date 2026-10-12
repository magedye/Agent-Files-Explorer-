# Lisan Blind Process Observation Log v1.0

**Purpose:** Pre-lock, source-safe process log for a Blind Lab run.

This log records only **observable methodology events**. It must not contain hidden chain-of-thought, prior definitions, dictionary meanings, tafsir, *على بصيرة*, Semantic Definition Registry content, or post-lock comparisons.

The methodology is **frozen for the duration of the run**. New rule ideas are logged here as `DISCOVERY_EVENT` only and are not allowed to modify the current run.

---

## Run header

```yaml
run_id: ""
target: ""
methodology_version: ""
skill_version: ""
canonical_profile: "HAFS_ASIM_MADINAH"
blind_source_manifest_hash: ""
semantic_prior_access: "DENIED"
started_at: ""
```

## Event types

- `GATE_TRIGGER`
- `HYPOTHESIS_CREATED`
- `HYPOTHESIS_REVISED`
- `HYPOTHESIS_REJECTED`
- `NEGATIVE_DETERMINATION`
- `STRUCTURAL_AMBIGUITY`
- `DECISIVE_CONTEXT_CANDIDATE`
- `DECISIVE_CONTEXT_DOWNGRADED`
- `LEXICAL_COLLISION`
- `ABSTRACTION_WARNING`
- `CONSTRUCTION_SUBTRACTION`
- `SOURCE_ACCESS_DENIED`
- `COVERAGE_CLAIM_BLOCKED`
- `LOCK_BLOCKED`
- `DISCOVERY_EVENT`
- `UNKNOWN_PRESERVED`

## Event record

```yaml
event:
  id: ""
  stage: ""
  type: ""
  observable_artifact: ""
  rule_or_gate: ""
  effect: ""
  status: "OPEN | RESOLVED | CARRIED_TO_AUDIT"
```

## Important constraints

1. Do not write a semantic prior into this log.
2. Do not rewrite earlier observations after a hypothesis changes; append a revision event.
3. Do not formalize a new Rule/Gate during the run.
4. Do not alter the pinned methodology version during the run.
5. Do not issue `LOCK_INTERNAL_RESULT` from this log; the lock requires an explicit Lock Eligibility Report.
