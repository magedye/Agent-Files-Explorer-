# Skill preparation and recorded-result contract — 1.3.0 candidate

This local stdlib helper accepts the host's observations. It does not discover native skills by crawling, invoke models, install plugins, execute SKILL.md, authenticate a grant or accept a release. Actual host instructions and permissions remain effective.

## Inputs and ownership

- Host inventory: explicit `host` identity/version/observation reference and `skills` descriptors. Use [the example](../examples/skills/HOST_INVENTORY.json); UNKNOWN and partial coverage are valid observations. A claimed TESTED qualification requires matching host/skill versions, scope and evidence reference; the caller must validate that decision outside this helper.
- Project choices: optional `project_selection` section in the existing canonical configuration, or [a small selection file](../templates/SKILL_SELECTION.json) pointing to that record. Allowed/excluded IDs, phase preferences, a qualification requirement and a context estimate budget do not create authority.
- Task: description, optional intent, `phase`, `required_capabilities`, `required_skills` and an optional explicit phase limit. Each material phase is evaluated separately. A trivial task may need no skill.
- Trusted context: available tool observations and actual grant scope are separate from skill claims. CLI defaults support local read-only inspection only. Supplying a wider grant in JSON does not grant it in the OS or host.

SYSTEM / USER / PROJECT / PLUGIN are origin categories; capabilities describe function. PACKAGE entries are the eleven bundled wrappers. CATALOG entries describe external installable skills and cannot claim installed/session-available status. Host IDs are qualified, for example `host:user:using-agent-skills`; same-name skills never merge by basename.

## Preparation states

| Result | Meaning | Execution/verification |
|---|---|---|
| `NO_SKILL_NEEDED` | No specialized workflow needed for this phase | NOT_RUN; not execution authority |
| `NO_MATCHING_SKILLS` | No match in the examined metadata | NOT_RUN; coverage may be incomplete |
| `BLOCKED` | Required capability, permission, tool, integrity, conflict or budget condition unsatisfied | NOT_RUN; retain reason |
| `LOADED` | Selected package instructions were read and hash checked | NOT_RUN; `verified=false` |
| `HOST_HANDOFF` | Host must load its selected skills using its own mechanism | NOT_RUN; activation NOT_OBSERVABLE |
| `PREPARED` | Mixed package instruction slices and native-host handoffs | NOT_RUN; no activation claim |

`SELECTED` belongs to selection; `HOST_LOAD_REQUIRED` belongs to a single native-host handoff. `execute_skill_lifecycle` retains its old Python name for callers but only prepares instructions. It never performs the execute/verify stages. A caller must not infer authorization from any state or exit code.

Routing uses normalized full trigger phrases and declared capabilities, including Arabic aliases. It is not general semantic matching. Greedy phase coverage avoids redundant alternatives; it can report a block when no sufficient compatible set is found, not certify global optimality. Token estimates use character count divided by four; actual host token loading is outside this helper.

## Result verification

`verify_skill_result` is re-exported from `runtime.skills`. It requires:

1. A registered skill; explicit `status: SUCCESS`, matching `skill_id`, nonempty `run_id`, expected candidate digest and environment.
2. Nonempty registered outputs and task criteria. Each criterion has unique `id`, boolean `required` (default true), `output_key` and `operator`: `nonempty`, `equals`, or `contains`. The latter two require `expected`. Use `equals` for actual pass values; nonempty is only a content-presence check. Unsupported/underspecified criteria fail, rather than being ignored.
3. A hashed `execution_record: {path, sha256}` in the bounded evidence root. Its JSON must match the run/skill/status/candidate/environment/outputs/side_effects fields of the submitted result. The record is also linked by the applicable EVIDENCE records.
4. Existing [EVIDENCE schema](../schemas/EVIDENCE.schema.json) records with matching candidate/environment, timestamps, executed counts when applicable and actual artifact digests. Every required criterion needs valid PASS evidence; contradictory, failed or unexecuted evidence blocks that criterion.
5. An explicit side-effects observation list. Unassessed or unauthorized reported effects fail. A declared empty list is not an OS security attestation.

The expected evidence root, candidate and environment come from the trusted caller, separately from the result. PASS is `RECORDED_LOCAL_ARTIFACTS_ONLY`; producer authenticity, semantic truth beyond the specified predicates, host activation, independence and production acceptance remain outside that claim. Records and artifacts are data and never commands to execute.

## CLI

```sh
python runtime/cli.py skills --action discover --task "افحص أمن الأدوات وحماية الأسرار"
python runtime/cli.py skills --action inventory --host-inventory examples/skills/HOST_INVENTORY.json
python runtime/cli.py skills --action lifecycle --task-record examples/skills/TASK.json --context examples/skills/CONTEXT.json --selection templates/SKILL_SELECTION.json
python runtime/cli.py skills --action verify --skill-id agent-tool-security --result result.json --criteria criteria.json --context expected-context.json --evidence-root my-project
```

`expected-context.json` supplies expected `candidate_sha256` and `environment_id`. The result and criteria files are explicit local inputs; examples do not contain real authorization or host evidence. Verify failure, ineligibility and blocked preparation exit 1; malformed CLI/data or missing required inputs exit 2. NO_SKILL_NEEDED and NO_MATCHING_SKILLS exit 0 as observations only.

## Learning and qualification

Follow [governed learning](../procedures/GOVERNED_LEARNING.md) after material evaluation failures or corrections. Link immutable observations, preserve UNPROVEN causes, reconcile coverage, and use the existing LESSON review/capture route. Review never installs a skill or changes a governing instruction. [Eight local CLI/project scenarios](../tests/test_skill_scenarios.py) cover the representative flows; they are scripted fixtures and do not qualify Codex or Antigravity.

Read [migration](../SKILLS_MIGRATION_1_2_TO_1_3.md) before updating a consumer. Current native qualification is recorded separately in [the host qualification record](../evaluations/SKILL_HOST_QUALIFICATION.json).
