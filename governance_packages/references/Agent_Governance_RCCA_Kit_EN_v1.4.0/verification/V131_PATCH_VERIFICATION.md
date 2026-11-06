# v1.3.1 Corrective Release — Verification Report

**Status:** `IMPLEMENTED_CANDIDATE / NOT_OWNER_ACCEPTED / NOT_ACTIVE`  
**Scope:** offline synthetic diagnostics and unchanged legacy compatibility tests on Linux.  
**Independence:** author self-assessment; NOT independent host qualification.

## Verified checks

| Test group | Observed result | Evidence |
|---|---|---|
| `V131_NEW_UNIT` | 141 tests, PASSED | `V131_NEW_TESTS.txt` |
| `V131_LEGACY_TOOLS` | 20 tests, PASSED | `V131_LEGACY_TOOLS.txt` |
| `V131_LEGACY_RCCA` | 24 tests, PASSED | `V131_LEGACY_RCCA.txt` |

Total distinct tests in these groups: **185**. Existing v1.3.0 verification and its 160-test claim remain as historical evidence; those counts are not added to this total. The v1.3.1 new suite contains the prior 116 tests plus 19 F-01/F-02/F-03 regressions and 6 instruction audit tests. Legacy tools and RCCA suites together contain 44 unmodified tests.

## Negative scenarios exercised

- G5 rejects a DONE task whose immediate or transitive mandatory dependency is not DONE.
- G5 detects a required-task dependency cycle and unknown dependency target.
- G5 returns INCONCLUSIVE for an unfinished unbound unclassified task, instead of silently passing it.
- An explicitly required unfinished unbound task is a G5 gap; explicitly optional task incompleteness does not veto an unrelated scoped claim.
- DEFERRED / OUT_OF_SCOPE requires a checked DECISION reference; metadata does not authenticate owner authority.
- G1 accepts an early source-only envelope without downstream bindings; G2 accepts an authorization-stage envelope without G5 artifacts.
- Explicit instruction-source audit reports file presence/hashes but not actual host loading, instruction priority or enforcement.

## Interpretation and limits

G5 metadata readiness is **not** acceptance. Tests are author-created synthetic fixtures; task graph and scope may be incomplete or fabricated by an agent. SHA-256 does not validate a signer or a claimed test execution. The instruction audit is not a hidden-prompt inspection tool. No production PEP/PDP, live Windows/Codex evaluation, independent test oracle, target-project adoption or PRE/POST performance comparison was performed.

## What remains before owner adoption

1. Qualify the package on the intended Windows and Codex configuration, with environment/version-specific evidence.
2. Reconcile current project authority and protected owner decisions; do not overwrite existing rules or grants.
3. Conduct a proportionate representative behavioral pilot with external acceptance labels; compare the same baseline tasks where possible.
4. Request separate owner approval for adopting or activating this candidate. No Git push, merge, deployment or external runtime permissions are included in this deliverable.
