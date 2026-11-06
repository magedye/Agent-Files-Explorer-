# Provider and host alignment — evidence-limited, not certification

**Reviewed as of:** 2026-11-06. **Scope:** governance semantics and selected official host controls.
No live model evaluation was performed. Public behavior specifications are not universal implementation
standards, and project text cannot guarantee model compliance.

## Provider is not host

| Provider/model family | Reviewed official basis | Kit alignment decision | Qualification boundary |
|---|---|---|---|
| OpenAI / GPT | Model Spec and Codex instructions/security documentation | Respect native authority, bounded delegation, honest evidence, user control and untrusted-data boundaries | Primary design target; latest-full-text/source freshness unresolved; no conformity certification |
| Google / Gemini | Official system-instruction and safety guidance | Treat system instructions as guidance under Google's policies; retain application-side checks | Do not invent an OpenAI-equivalent complete hierarchy for Gemini; verify selected model/runtime |
| Anthropic / Claude | Official Constitution | Preserve legitimate principal oversight, honesty and bounded action | Relevant when selected through an optional host; not assumed identical to OpenAI authority levels |
| Other providers | No complete provider-specific review in this build | Keep core project safeguards; require separate provider review | NOT_ASSESSED; not implicitly certified through OpenCode support |

Host documents reviewed: Codex discovery/permissions [S02/S03], Antigravity [S04/S05], OpenCode
V1/V2 [S06/S07]. Sources are listed in `../sources/SOURCE_REGISTER.json`.

## Important source reconciliation

Search results from OpenAI's official announcement/release notes and changelog identified an October 29, 2026
Model Spec update. However, direct retrieval of the versioned new full text failed; other direct/cached views
returned December 18, 2025 material. Therefore the kit records:

- Latest update announcement: verified from official indexed sources.
- Detailed text actually inspected: the retrieved 2025-12-18 specification and official host documents.
- Full text of the announced 2026-10-29 version: `NOT_FULLY_RETRIEVED`; exact per-principle authority changes
  must not be asserted as fully checked.

The plan's emphasis on human intent, honest reporting, oversight and bounded side effects is consistent with
the stated update themes [S13], but that is a scoped design inference, not full conformance proof.
No rule in this kit tries to override actual live higher-priority instructions, regardless of this snapshot.

Codex security source views also differed over the retired `untrusted` approval value. The included example uses
only the documented common `workspace-write` / `on-request` combination, remains inert, and requires verification
against the installed version. The kit deliberately does not prescribe the disputed setting.

## Interpretation limits

System instructions, project files, skill instructions and tool permissions are different mechanisms. A rule
named CRITICAL is still at its legitimate delivery level. A provider safety policy is not automatically replaced
by an owner's local policy. Equally, a project's preference is not to be misrepresented as a provider prohibition.

Use official provider guidance for each selected model; do not assume that using Antigravity or OpenCode determines
the provider. The adapter must record both. Do not hard-code a supposedly latest model identifier or reasoning
effort without checking the installed host's exposed options.

## Requalification triggers

Recheck the relevant mapping when the provider spec, host version, discovery behavior, permission schema,
selected provider/model or material tool scope changes. Requalify the affected portion; do not restart all unrelated
project acceptance. Host behavioral and Windows-specific checks remain NOT_RUN in this delivery.
