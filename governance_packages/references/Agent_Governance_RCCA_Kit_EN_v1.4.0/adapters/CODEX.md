# Codex adapter — primary host, adoption not performed

**Status:** DOCUMENTATION_REVIEWED / LIVE_HOST_NOT_RUN / WINDOWS_NOT_RUN.
**Official sources:** S01, S02, S03, S13. Provider and host identity must both be recorded.

## Discover before configuring

Record the installed Codex version and available configuration options without printing secrets. Read the current
session's actual higher-priority instructions. Inspect only authorized global/project instruction locations.
Official documentation describes project guidance discovery through AGENTS files, including override files and
more specific directories [S02]. Record the files actually loaded, their scope and any instruction-size limits.
Do not assume that an AGENTS filename places its content at system or developer authority. Do not disclose hidden
system messages or private reasoning to build an authority map; record observable boundaries and UNKNOWN values.

## Minimal adoption

Use the existing project AGENTS entrypoint, task/request record and owner-decision mechanism. Propose a small merge
from `../templates/AGENTS.fragment.md`; never replace the entire file or copy this package's own maintenance AGENTS.
Link only the core and task-relevant policies. A 24-rule catalog is an audit reference, not a requirement to load
all documentation into every prompt. Retain current instructions that remain applicable.

## Broad local autonomy with real host boundaries

Sandbox controls and approval prompts are separate controls [S03]. The inert TOML example shows a documented local
workspace profile. It is not an installation script and may not match every installed version. Inspect effective
permissions, approved paths and network policy first. Do not disable sandboxing or choose blanket unrestricted
execution merely to avoid interruptions. Preauthorize reversible local edits, focused tests, builds, relevant local
dependency updates and local commits when the owner explicitly grants them. Dependencies and tests may execute
code: keep them in the approved environment, with no production secrets or unintended external calls.

Remote push/merge, production writes, destructive cleanup, global installation and permission changes remain
separate decisions unless an exact existing grant already covers them. A different decision can be made by the
owner, but never by an agent-authored `approved: true` value.

## Optional helpers

Use one primary writer. A read-only helper session can examine a bounded diff or test result if the installed host
supports it and current permissions allow it. This is optional, not a required multi-agent workflow. Different
model names or sessions do not confer independent approval. Never invent concurrency limits or model identifiers.

## Qualification checklist

- [ ] Version/model/provider and actual guidance discovery recorded.
- [ ] Existing owner authority and local write scope reconciled.
- [ ] Effective sandbox and approval behavior verified on a disposable, authorized fixture.
- [ ] Out-of-scope file, network and sensitive-action behavior recorded, including bypass paths.
- [ ] Resume preserves source, constraints, unfinished requirements and current workspace changes.
- [ ] Host limitations and remaining NOT_RUN items reported honestly.

Do not mark this adapter qualified merely because the offline kit tests pass.

## v1.4.0 optional ADEQ integration

Use the mapped Core entry in existing project guidance, with the full ADEQ/workflows on demand. The bundled `skills/adeq-quality/SKILL.md` is not automatically installed. Resolve its references and verify current session loading in a separately authorized adoption. See `docs/15_PROVIDER_SOURCE_DELTA.md`; no global settings are changed by this release.
