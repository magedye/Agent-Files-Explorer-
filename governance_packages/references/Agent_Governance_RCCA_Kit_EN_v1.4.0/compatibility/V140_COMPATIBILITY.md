# v1.4.0 compatibility report

The complete supplied v1.3.1 is the base. Existing RCCA trace schema (`agdl-1.3`),
G1/G2/G5 module, task-scope/dependency logic, IO safeguards, bridges, delegation, rules
lint, instruction audit and legacy loader are preserved byte-for-byte. All nine legacy
v1.2 Python scripts/tests are unchanged. See `verification/V140_REUSED_COMPONENTS.json`.

The CLI entry and version change to 1.4.0 and add opt-in commands. One inherited CLI
version assertion is updated accordingly; no functional acceptance threshold is relaxed.
Existing 185 tests are included in the 295 distinct passing cases, not added twice.

New contracts are optional and separately versioned: `adeq-1.1`, `adeq-metrics-1`,
and ADEQ rules 1.1. No existing trace needs rewriting for old CLI commands to work.
The quality snapshot references the existing trace; it is not a replacement authority.

Changes to README, Core, adoption guidance and templates are intentional instruction
deltas. Compare them with project policy before adoption. Old verification artifacts
retain their original scope; new evidence has V140 prefixes.

No target Windows repository, Codex session, protected owner-decision store or default
package setting was accessed or changed. Spec Kit methodology is adapted, not a tested
executable integration. Secondary host adapters are retained with their qualification limits.
