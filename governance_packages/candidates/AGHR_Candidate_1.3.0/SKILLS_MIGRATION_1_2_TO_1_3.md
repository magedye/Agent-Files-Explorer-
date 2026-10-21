# Skill-tool migration: 1.2.0 → 1.3.0 candidate

This candidate preserves the existing 47 rules, optional skill payloads, learning record/schema, host permission boundaries and reference 1.2.0. It adds metadata/phase choices and fixes inaccurate local helper results. Consumers of `runtime.skills` and the skills CLI must review the following observable changes. This is not automatic adoption.

| 1.2.0 behavior | 1.3.0 candidate behavior | Consumer action |
|---|---|---|
| SKILL_ACTIVATED + verified=true after instruction load | LOADED / HOST_HANDOFF / PREPARED; execution and verification NOT_RUN, verified=false | Treat preparation separately; obtain native/run evidence |
| DIRECT_EXECUTION_RECOMMENDED combines no need, no match and failed prerequisites | NO_SKILL_NEEDED / NO_MATCHING_SKILLS / BLOCKED | Preserve reasons; no state grants an effect |
| Required permissions/dependencies can fall through to direct execution | BLOCKED with per-skill reason | Resolve only the affected dependency/authorization; preserve independent work |
| Unknown/absent execution status may pass | Only explicit SUCCESS can pass recorded-result checks | Preserve actual run status |
| Output names alone may pass; task_criteria ignored | Nonempty values, evaluated required criteria, immutable run record and existing EVIDENCE artifacts required | Supply actual task predicates and expected candidate/environment separately |
| Unregistered skill may pass | NOT_FOUND finding / FAIL | Use exact qualified identity |
| One default selection; prose mentions two as a general maximum | Sufficient nonredundant set for each phase; optional explicit limit/budget | Declare phase needs and meaningful constraints |
| Package registry only | Package plus explicitly supplied host metadata | Keep host discovery native; mark incomplete inventories honestly |

Existing function names remain, including the re-export of `verify_skill_result`, but incomplete legacy inputs fail intentionally. There is no compatibility flag that restores false positive success. Corrective return-state changes are documented consumer impacts; 1.3.0 is an isolated candidate with additive metadata/CLI capability, not a promise of unchanged old result semantics.

Prepare changes in the consumer's normal adoption route, check affected scripts/exit-code assumptions, qualify the actual host, and retain the prior configuration and reference for rollback. Do not replace global skill folders, host settings, active instructions or canonical project state merely because this candidate is newer. Release acceptance, consumer adoption and publication are not granted.
