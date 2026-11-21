# Final execution plan — AG-DLF / RCCA v1.3.0

**Decision:** build a small assurance layer over existing development tools.
**Operating model:** one developer-owner, one primary Codex agent, small/medium projects.
**Artifact authorization:** current owner request authorizes this isolated English kit and its fixture tests.
**Project activation authorization:** none. **Primary outcome:** a reviewable implementation, not a conformity certificate.

## 1. Revisions to the supplied proposal

| Proposal item | Final scoped decision | Reason |
|---|---|---|
| Governance, traceability and verification over existing tools | Retained | Avoid replacing useful development workflows. |
| P0 real-project baseline before new code | Split into local engineering baseline and later real-project value baseline | No pilot repository/runtime has been supplied; explicit authorization now covers the isolated package. Do not invent pilot results. |
| Model compatibility | Add provider/host alignment matrix with source dates and gaps | A repository policy is not a model system instruction; host and provider differ. |
| Broad autonomy | Add task-bound delegation and continue/ask/stop rules | One developer should not approve every ordinary edit or test. |
| Highest-priority rules | Separate native authority, project authority, normative force, impact and lifecycle | Importance cannot manufacture higher authority. |
| G1/G2/G5 reuse | Reuse legacy G1/G2; explicitly replace G5's old independence-floor policy in the v1.3 profile | R1 self-checks must not require imaginary extra staff; no competing G5 judgments for one task. |
| Interoperability | Explicit-file generic/Spec Kit/OpenSpec Markdown envelopes | No external installations or version-wide parser claims. |
| P3 task continuity | Ship an optional read-only checker of supplied task references | No task database, scheduler or automatic task execution; use only when useful. |
| Independent oracle and holdout | Keep as a real-project qualification requirement | Package author-created fixtures are not independent labels or blind holdout. |
| Interface/roles/registry | Defer | CLI, Markdown and existing skills are sufficient for this candidate. |

## 2. Scope and success conditions

Implement: English operating core; 24 categorized rules; bounded-autonomy templates; G1/G2 compatibility;
new G5 artifact-link checks; byte-preserving raw import/export; partial normalized mapping with loss reports;
optional dependency/resume diagnostics; host adoption checklists; adversarial/unit fixtures; reproducible evidence.

Do not implement: IDE, multi-agent orchestrator, production authorization/signing service, credential management,
automatic deployment, a semantic requirements extractor, autonomous spec rewriting, or a new skills marketplace.

A successful isolated build requires valid contracts, deterministic handling of negative/unknown inputs,
no unauthorized project writes, explicit compatibility disposition and reproducible test output.
A successful **adoption** additionally needs the actual owner decision and host qualification.
A successful **value claim** additionally needs a suitable live comparison. These are different gates.

## 3. Executed engineering stages

| Stage | Work | Acceptance check | Evidence location |
|---|---|---|---|
| E0 | Inspect v1.2, preserve inputs, rerun baseline | Original inputs unchanged; 44 legacy tests run | `sources/INPUT_MANIFEST.json`, `verification/BASELINE_V12_TESTS.txt` |
| E1 | English authority/autonomy design and plan reconciliation | No self-elevating hierarchy; candidate grants inert | `policies/`, `docs/`, schemas and rule tests |
| E2 | Read-only bridges and trace wrapper | Raw-byte round trip; explicit partial semantics; valid cross-links | `agdl/bridge.py`, `agdl/assurance.py`, new tests |
| E3 | Optional continuity/scope diagnostics | Cycles, stale revisions, expired/revoked/invalid grants surfaced | `agdl/assurance.py`, `agdl/delegation.py`, tests |
| E4 | Synthetic adversarial verification and comparison | Report exact fixture scope, not live superiority | `evaluations/`, `verification/` |
| E5 | Reviewable packaging | Internal references, hashes, code syntax and tests checked | `MANIFEST.json`, `SHA256SUMS.txt`, package checker |

The final verification ledger records which checks actually ran. This plan does not predeclare their success.

## 4. Later project qualification — not executed here

1. Choose a non-sensitive existing repository and freeze a scoped baseline without resetting unrelated work.
2. Identify the actual installed host version, model/provider, active instructions and permission boundaries.
3. Have the developer-owner define expected results before running the paired tasks. A separate reviewer is optional
   for ordinary local tasks and required only where risk and the current project policy justify it.
4. Compare the existing workflow with the adopted assurance layer on the six supplied task families.
   Keep model, repository state, permissions and acceptance criteria comparable. Counterbalance run order where practical.
5. Create genuinely unseen holdout cases outside the author's calibration set. Never call bundled fixtures holdout.
6. Record errors, false completion, false blocks, time, tokens and owner effort where telemetry exists.
   Without telemetry record `NO_TELEMETRY`; do not estimate numerical savings.
7. Decide `GO`, `ADJUST`, `DEFER` or `STOP` for the **specific adoption**. Critical violations are reported separately,
   not averaged away by many successful routine tasks.

No live qualification may be inferred from passing a schema, CLI fixture or hash check.

## 5. Responsibilities and maintenance

The one developer owns decisions, maintenance and acceptance. The primary agent performs authorized implementation
and self-checks. Optional Antigravity/OpenCode assistance is task-scoped and normally read-only. Do not add a standing
review bureaucracy or simultaneous mutation of the same worktree. An owner review is not represented as institutionally
independent from the owner's product decisions.

Maintenance is event-driven: recheck relevant sources after provider/host changes, schema changes, changed permissions
or a concrete failure. Do not rerun unrelated expensive qualification merely because a new file or chat exists.
Owner time/budget limits are project decisions, not invented estimates in this kit.

## 6. Stop and continue conditions

Stop affected changes for invalid/revoked grants, unresolved authority conflicts, missing sensitive-action boundaries,
uncertain external side effects, attempted evidence fabrication, or altered protected acceptance criteria.
Continue unrelated work still inside the valid grant. End a blocked loop once there is no new evidence or authorized
recovery action, preserving the exact resume condition. Do not globally disable permissions to achieve autonomy.

## 7. Delivered status

`IMPLEMENTED_CANDIDATE` means code and documentation exist and can be inspected. Executed results are in
`verification/VERIFICATION_REPORT.md`. It does not mean `OWNER_ACCEPTED`, `HOST_QUALIFIED`, `ACTIVE`,
`MODEL_SPEC_CERTIFIED`, or `LIVE_VALUE_PROVEN`.
