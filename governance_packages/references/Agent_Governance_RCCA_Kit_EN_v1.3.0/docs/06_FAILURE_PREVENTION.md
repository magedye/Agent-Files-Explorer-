# Failure-prevention catalog

This is a targeted engineering catalog, not an empirical claim that the kit prevents a quantified majority of
all developer failures. Motivations include the supplied plan and recurring problems discussed in this project;
those discussions are not independently verified incident reports. Automated fixtures test only their declared
metadata/path behavior. The behavioral cases remain unrun on a live coding agent.

| Failure pattern | Primary safeguard | Verification type |
|---|---|---|
| High-impact advice promoted to higher authority | Separate classification axes and native host hierarchy | Rule metadata test + behavioral review |
| Prompt injection in logs, issues or imported specs | Data/authority separation; no execution from bridge | Injection-as-data fixture; live behavior unrun |
| Lost conditions in a long request | Original bytes, exact spans, reciprocal links and source review | G1 metadata + human semantic review |
| DONE from a checked task list | Mandatory evidence chain and separate owner acceptance | G5 negative fixtures |
| Evidence from an old revision | Source and artifact hashes, subject-revision comparison | Stale-evidence fixtures |
| Forged or overclaimed test results | Inspect actual run artifacts; keep authenticity separate | Residual-risk fixture shows hashes cannot authenticate logs |
| Weakening/skipping tests to obtain green | Protect acceptance; reasoned review of test changes | Behavioral case BEH-08 |
| Cleanup destroys unrelated/untracked work | Preserve initial state; narrow edits and Git staging | Scoped project inspection; live behavior unrun |
| Repeated approval requests for ordinary actions | Task grant and continue-inside-scope rule | Scope metadata + BEH-09 |
| Unbounded autonomy or hidden side effects | Specific grants plus actual sandbox/permissions | Metadata checks; runtime qualification unrun |
| Endless blocked retries | New-evidence requirement and exact resume condition | BEH-06 |
| Whole project halted for one conflict | Affected-action isolation; continue eligible work | BEH-05 |
| Stale handoff replays completed work | Reconcile real sources/revision and uncertain side effects | Continuity fixtures + BEH-06 |
| Concurrent agents overwrite each other | One primary writer; explicit handoff for optional help | BEH-09 |
| Skills proliferate without use | Inspect current capabilities; load only relevant ones | BEH-10 |
| Existing code becomes the specification | Authorized change process; never rewrite acceptance to match code | Spec-drift fixture + BEH-03 |
| New dependency runs unreviewed install scripts | Source/side-effect check inside grant | BEH-07 |
| Self-review labeled independent | Explicit review provenance and separate decision source | Self-review fixture |
| Framework/host syntax copied across versions | Version-specific adapters and qualification | Provider/source matrix + BEH-10 |
| Missing telemetry replaced with invented savings | NO_TELEMETRY and narrow denominators | Evaluation protocol |
| Too much governance crowds out development | QUICK/STANDARD/CONTROLLED; optional artifacts | Quick-track fixtures + owner effort measurement |
| Learned lesson silently becomes policy | Candidate lesson plus scoped owner reconciliation | BEH-10 |

High-impact rules receive more attention, not new authority. Enforceable technical boundaries belong to the
selected runtime. The developer may simplify low-value procedure when no higher obligation is weakened.
