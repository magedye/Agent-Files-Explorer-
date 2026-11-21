# v1.3.1 corrective scope — release engineering decision

**Status:** `IMPLEMENTED_CANDIDATE / NOT_OWNER_ACCEPTED / NOT_ACTIVE`  
**Target:** one developer + one primary Codex agent, small/medium projects.  
**Parent:** unmodified v1.3.0 source package. Upstream schema `agdl-1.3` is retained.

## Disposition of independent review findings

| Finding | Disposition in 1.3.1 | Evidence and residual limit |
|---|---|---|
| F-01 G5 ignores task dependencies | FIXED IN SYNTHETIC TEST SCOPE | G5 checks transitive dependencies, cycles, and unknown task edges for the mandatory completion set. Task graph is still supplied, not reconstructed from Git. |
| F-02 unbound tasks silently ignored | FIXED WITH SCOPE CLASSIFICATION | Unknown unfinished unbound task yields INCONCLUSIVE, REQUIRED unfinished task yields GAPS_FOUND. OPTIONAL does not block; DEFERRED/OUT_OF_SCOPE require a DECISION hash reference, not authentication. |
| F-03 G1 incorrectly requires implementation bindings | FIXED IN SYNTHETIC TEST SCOPE | G1 minimal envelope and G2 minimal authorization envelope supported; G5 remains full-contract. |
| F-04 effective instruction visibility | DIAGNOSTIC ONLY | Explicit-source inventory CLI reads declared files, hashes them and reports loading/authority as NOT_VERIFIED. Actual effective host instruction loading is unavailable without supported host evidence. |
| F-05 authored evidence can be forged | KNOWN LIMITATION | Hashes support content consistency only; independent runners and audit storage are future project-dependent qualifications. |
| F-06 grants are not authenticated | KNOWN LIMITATION | No signing/identity service introduced. Authentic authority must come from current owner and host controls. |
| Lite/Full split | DEFERRED | Full candidate remains available; `policies/CORE.md` is the daily minimal profile, generated distribution is not claimed. |

## Corrected gate model

- G1 = original request segmentation, obligations, oracles; no binding obligations.
- G2 = G1 + authorization/conflict metadata, referenced delegation artifact and risk consistency; not verified owner identity.
- G5 = full reference, implementation, evidence and review metadata + mandatory task dependency closure + task scope classification.

New or missing scope information is not silently imputed. There is no new role hierarchy or product-wide authority created by these checks.

## Non-goals

No production PEP/PDP, forced PRD for trivial work, built-in task scheduler, full OpenSpec/Spec Kit parser, requirement re-interpretation, owner credential service, native runtime instrumentation, or automatic policy activation.

## Required later evidence

Windows and Codex qualified environment behavior, owner-approved adoption and an independent PRE/POST task trial are `NOT_RUN`. This artifact has synthetic engineering verification, not a production/security certificate. Reconcile with existing project instruction sources before activating any policy.
