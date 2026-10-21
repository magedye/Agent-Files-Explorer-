# State, checkpoints, retries and recovery

**Rules:** AGHR-025–026, AGHR-031–032, AGHR-035.

## Canonical state
The portable default is `.aghr/state.json`. A declared native tracker may replace it with a field/export mapping; do not keep two independently edited status stores. Link each work item to the accepted goal and criteria. Separate NOT_STARTED/IN_PROGRESS/IMPLEMENTED/VERIFIED/BLOCKED/CANCELLED from check outcomes and authority decisions.

Use an expected revision and one writer/lock for changes. Preserve previous evidence and reasons for transitions. The toolkit's reference state updater checks the revision under its in-process lock; external writers require host-level synchronization. A revision number without atomic enforcement is not concurrency control.

## PROJECT_MAP
The generated view contains TECH_STACK, SYSTEM_FLOW, ARCHITECTURE and ORPHANS & PENDING, plus source digests. It does not inspect actual application runtime or certify factual completeness. A stale map blocks reliance on that map for a dependent decision, not unrelated safe discovery. Refresh after material transitions and before handoff.

Pending entries are resolved by evidence or a scoped decision, not deletion to make the list empty. Keep resolved/withdrawn/deferred history. A work disposition such as EXTEND is not a check state. A verified feature may still await release or activation acceptance.

## Resume
Read the current grant, policy version, candidate and checkpoint. Inspect actual modifications, uncommitted work, completed side effects, expired approvals and evidence validity. Resume only the remaining authorized operations. If a prior send/write timed out, reconcile receipts and actual state before repeating it. Do not infer absence of effect from absence of a success response.

## Cancellation and incidents
Honor owner pause and host revocation. Checkpoint what is known, isolate a partially applied operation, preserve evidence, and name its resume condition. An uncertain action is INDETERMINATE. Recovery must use the authorized backup/compensation route and revalidate identity and readiness; liveness alone does not reopen a suspended capability.

## Custody
Capture exact available originals or a protected external custody reference. Do not claim unavailable upstream files were reconstructed. Before moving/removing a source, check active dependencies, holds, authority, destination protection and post-transfer integrity. Keep frozen reference/history outside active instruction discovery.

## Delivery view
[Progress/drift](../procedures/PROGRESS_AND_DRIFT_AR.md) extends state observations without introducing a competing source of truth. Report branch identity and the freshness/limits of remote observations. Retain unresolved clarifications in intake and pending records; link decisions rather than silently changing the plan. Local helper output is not an independent review.
