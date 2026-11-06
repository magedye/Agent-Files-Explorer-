# Instructions for maintaining this kit repository only

This file applies to the kit's own source tree, not to user projects that reference it.
Respect the host/provider's actual instruction hierarchy. This candidate does not grant itself authority.

- Keep user-facing kit code, comments, prompts and normative instructions in English.
- Preserve `compatibility/v1_2/` Python byte-for-byte; changes belong in the new wrapper with an explicit migration note.
- Keep the primary CLI offline and read-only; no command execution from imported content or auto-adoption.
- Keep every verdict explicit about metadata checks versus semantic truth, runtime enforcement and approval.
- Run new tests and the preserved legacy suite before claiming regression readiness.
- Do not edit test expectations only to obtain green results. Document material behavior changes.
- Use one source of project truth, risk-proportional work, and one primary agent by default.
- Report actual verification limits, especially provider-source freshness and unrun Windows/live-host tests.

Authoritative input references and hashes: `sources/INPUT_MANIFEST.json`.
The final English scope is recorded in `IMPLEMENTATION_PLAN.md`; it does not authorize deployment.
