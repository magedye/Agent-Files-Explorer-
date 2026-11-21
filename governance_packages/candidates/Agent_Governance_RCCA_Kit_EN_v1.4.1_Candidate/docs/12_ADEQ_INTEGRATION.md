# Architecture and responsibility map

AGHR/RCCA owns the existing authority/delegation/trace/evidence contracts. ADEQ defines
quality of advice, decisions, documents and implementation. Seven proportional
workflows apply those rules. They are not three independent hierarchies.

## Actual source-of-truth policy

The target project's existing registry remains authoritative. REQUEST_REGISTER.json,
updates.json, TASK_STATE.md and write-set.json in the supplied proposal are candidate
names only. Discover their actual role before adoption. Task state and requirements
are read from the existing RCCA trace export; the quality snapshot does not redefine them.
Its source facts and review observations are derived annotations, never new authority.

`policies/RULES.json` remains the governance register. `policies/ADEQ_RULES.json` is
the behavioral quality register and cross-references governance IDs. Generated
`policies/ADEQ.md` and `policies/CORE.md` are views of that canonical content.
`workflows/QUALITY_WORKFLOWS.json` owns procedure routing/actions, not duplicate rules.
Run `python -B tools/build_quality_docs.py --check` to detect generated-view drift.

## Five requested enhancements and confidence correction

| Enhancement | Existing IDs extended | Operational mechanism | Validation boundary |
|---|---|---|---|
| Requirement traceability | 02,16,19,21 | Reuse source/requirement/task/evidence links, many-to-many coverage | Link checks do not prove the requirement was interpreted correctly |
| Independent quality review | 20,21 | SELF vs separated-review claim, project-specific independence requirement | A reviewer label or another model alone does not prove independence |
| Authority/conflict resolution | 03,13 | Scope, approval, explicit supersession and affected-only escalation | No synthetic hierarchy or automatic owner authentication |
| Recovery readiness | 09,15 | Rollback/restore/forward recovery with procedure, rehearsal and residual risk | Never execute recovery in a diagnostic; irreversible effects remain irreversible |
| Effectiveness | 24 | Frozen PRE/POST data, omission/rework/decision/defect/overhead metrics | Metadata test success is not agent-quality improvement |
| Confidence | 10,11 | Suitability + feasibility before; correctness after actual checks | Optional subjective ranges are not scientific probabilities |

## Authority versus impact

The host/provider decides instruction roles. Project source authority concerns approved
requirements and decisions within scope. Normative force expresses obligation. Impact
expresses consequence. Attention determines when to load a rule. None substitutes for
another. A CRITICAL repository rule cannot create a system message; a low-priority
presentation preference cannot override a protected data boundary.

## Analyze and converge: what is automated

PRE reuses RCCA G1 and checks planned links, declared uncertainty, choices and explicit
source claims. POST reuses the patched G5, preserving its transitive task dependencies,
completion scope, exception references and evidence checks. A supplied semantic review
can report MISSING/PARTIAL/CONTRADICTS/UNREQUESTED/UNVERIFIED. Identical proposals are
stable and deduplicated; original task IDs are reused. No commands are executed, tasks
created, documents rewritten, approvals granted or extra code deleted.

An agent/human must inspect actual prose and code to supply meaningful assertions.
For example, the tool detects two *declared* `primary-store/database` values of SQLite
and PostgreSQL, but it does not autonomously extract that conflict from arbitrary Markdown.
Source hashes establish consistency, not that an annotation accurately paraphrases it.

## Review model for one developer

Routine work may use labeled self-review plus focused tests. For high-impact work,
seek a separated review when feasible; if project policy requires it and it is unavailable,
keep that acceptance/activation blocked while unrelated authorized work continues.
Do not create another agent merely to satisfy a cosmetic independence field. Record
review identity, scope, write privileges, shared evidence and unresolved limitations.
