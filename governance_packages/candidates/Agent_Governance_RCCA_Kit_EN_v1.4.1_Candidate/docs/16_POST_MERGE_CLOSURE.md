# Post-Merge Git and Development-Runtime Closure Procedure

**Status:** `CANDIDATE_OPERATIONAL_PROCEDURE / NOT_RUNTIME_ENFORCED`
**Reused authorities:** `GOV-004`, `GOV-005`, `GOV-007`, `GOV-009`, `GOV-011`, `GOV-012`, `GOV-013`, `GOV-015`, `GOV-018`, `GOV-020`; `ADEQ-02`, `ADEQ-03`, `ADEQ-06`, `ADEQ-07`, `ADEQ-09`, `ADEQ-12`, `ADEQ-15`, `ADEQ-18`, `ADEQ-20`, `ADEQ-21`, `ADEQ-22`, `ADEQ-23`; workflows `INT-04`, `INT-05`, `INT-06`.
**Reused optional skills:** `adeq-quality` (`skills/adeq-quality/SKILL.md`), plus legacy optional skills `safe-git-closeout` and `risk-based-verification` when adopted by the host project. No new skill or parallel rule register is created.

---

## 1. Purpose and Non-Enforcement Boundary

This procedure defines a reusable, project-neutral workflow for post-merge Git synchronization, completed task-branch cleanup, selective local development-runtime refresh, and honest closure reporting after a change has been integrated into a target branch.

These are **declarative operational instructions**, not runtime PEP/PDP enforcement, Git hooks, or owner authentication (`policies/CORE.md`). The optional CLI diagnostic `python -B -m agdl post-merge-check` inspects caller-supplied state metadata read-only and never runs Git commands, stops processes, restarts services, or grants approval.

---

## 2. Bounded Maintenance Delegation

Under `GOV-004` and `ADEQ-22` (`docs/02_BOUNDED_AUTONOMY.md`), **one bounded post-merge closure authorization** permits the complete authorized maintenance sequence without repeated per-step confirmation:

1. Inspect Git local/remote state, linked worktrees, pending operations, and unrelated changes.
2. Identify active watchers and quiesce **only** those posing a material synchronization risk.
3. Fast-forward-only synchronize (`--ff-only`) the local integration branch.
4. Verify recoverability and delete completed task branches / task-owned worktrees that contain zero unique unmerged work.
5. Refresh **only** affected local development services when required, and run proportionate verification checks.

**Escalate only material authority, safety, or scope exceptions** (`ADEQ-23`, `GOV-015`, `GOV-020`):
- `push`, `merge`, `deploy`, force-push, history rewrite, production migration, permission changes, or unauthorized recovery (`agdl/delegation.py` `RESERVED`).
- Deleting a branch or worktree that holds unique unmerged commits, uncommitted changes, untracked artifacts, or user stashes.
- Divergent integration branches, remote SHA shifts causing non-fast-forward state, or expired/exceeded risk acceptances.

Block only the affected step; continue unaffected independent authorized work (`ADEQ-06`).

---

## 3. Operational Steps

### Step 1 — Verify Git State Before Acting
Inspect and record before mutating Git refs or files (`GOV-005`, `GOV-013`, `ADEQ-15`):
- Actual repository root, current branch or detached `HEAD`, and configured target integration branch (never hardcode `main` when the project uses another branch).
- Remote tracking ref and fresh fetch state (capture `expected_remote_sha`; if offline or unauthorized to fetch, record `REMOTE_UNAVAILABLE` rather than inferring freshness from stale refs).
- Linked worktrees (`git worktree list`), pending Git operations (`MERGE_HEAD`, `REBASE_HEAD`, `rebase-merge`, `rebase-apply`, `CHERRY_PICK_HEAD`, `BISECT_LOG`, `sequencer`), dirty/staged/untracked files, and stashes.

**Fail-closed pre-sync gate:** Do not sync or switch branches if any pending Git operation exists, if the local target branch has divergent commits, if dirty/untracked files collide with target sync paths, or if another linked worktree holds colliding checkout/dirty state. Never absorb, bulk-stage, or discard unrelated edits.

### Step 2 — Risk-Based Watcher Inspection and Selective Quiescing
Identify file watchers, hot-reloaders, build/test daemons, or IDE auto-writers active on the synced paths:
- **Harmless, read-only, or unrelated watchers:** Leave running. Do not impose blanket process kills.
- **Watchers with material synchronization risk** (e.g., auto-writing generated files during sync, holding exclusive OS/Windows file locks over target paths, or hot-reloading half-synced revisions against mutable dev state): Verify target process identity (PID + executable/command path + start time or workspace binding), then quiesce only those affected watchers for the sync window.

### Step 3 — Fast-Forward-Only Synchronization
- Prefer fast-forward-only synchronization (`git merge --ff-only` / `git pull --ff-only`) for post-merge closure of the local integration branch.
- Re-check the remote target SHA immediately at sync time. If the remote SHA drifted to a non-fast-forward state or local divergence appeared, **abort synchronization** without creating merge commits, rebasing, or resetting. Preserve local state and report exact SHAs.

### Step 4 — Recoverability-First Task Branch and Worktree Cleanup
Never delete branches, worktrees, or stashes based on age alone. Before deleting a completed task branch or its task-owned worktree, verify all four conditions:
1. **Integration equivalence:** Confirm all changes are integrated into the target branch. For squash-merged or rebased branches where `git branch --merged` / ancestry checks return false negatives, verify via patch/tree equivalence or an authoritative merged-PR/commit receipt — never infer unmerged status from ancestry alone.
2. **Zero unique unmerged work:** Confirm zero unique unintegrated commits or meaningful uncaptured diff remain relative to the target branch. If unique unmerged work exists, **preserve the branch** and escalate with exact commit/diff details.
3. **Worktree, untracked, and stash safety:** Confirm no dirty files, untracked work, or unreviewed stashes depend on that branch or worktree.
4. **Recoverability record:** Record branch name, branch tip SHA, integration target SHA, and equivalence basis in the existing closeout note (local reflog + target SHA provide standard recovery; create an archive tag/ref **only** when audit custody requires preserving a distinct non-ancestor tip, avoiding blanket mass tagging).

### Step 5 — Selective Development Service Refresh and Proportionate Verification
Determine from the merged diff whether any running local development service loads changed code, configuration, templates, or dependencies:
- **Refresh not required:** When the diff affects only documentation, governance artifacts, offline scripts, or unstarted services, set Runtime Readiness to `NOT_REQUIRED`, skip restart, and **reuse valid unaffected test/qualification evidence** (`GOV-018`, `ADEQ-12`). Do not trigger unnecessary restarts or full-suite reruns without a material trigger (`docs/07_PROVIDER_ALIGNMENT.md`).
- **Refresh required (affected services only):**
  1. Verify **process identity** (PID + executable/command path + start time or bound workspace/port — never blind PID or port termination) before stopping or restarting only the affected service(s).
  2. Verify **proportionate post-refresh evidence** (`ADEQ-12`, `ADEQ-20`):
     - **Runtime health:** Readiness/health endpoint or smoke check passes.
     - **Loaded revision:** Running service reports or serves the synced target revision/build (liveness alone does not prove the intended code is loaded).
     - **Protected-state integrity:** Guarded files, custody records, and intentionally dormant controls (e.g., inactive PEP/PDP) remain intact and unaltered.

### Step 6 — Partial Failure Safety and No Destructive Auto-Rollback
If Git synchronization succeeded and a downstream runtime refresh or verification step fails:
- **Preserve the valid Git state**; do **not** run `git reset --hard`, `git clean`, automatic commit reverts, or unauthorized recovery/deployment (`ADEQ-09`, `ADEQ-15`, `docs/05_ADOPTION_AND_ROLLBACK.md`).
- Isolate the failed runtime step, capture logs/diagnostics, and report the preserved Git revision alongside bounded forward-recovery or owner-approved rollback options.

### Step 7 — Risk Acceptances, Exclusions, and Separate Closure Axes
- **Preserve existing approved risk acceptances:** Valid owner-accepted limitations, waivers, or deferred items remain preserved within their recorded expiry, revision/scope bounds, and non-waivable host/security limits. Do not re-litigate or fail closure over already-accepted items; escalate only when expired, out-of-scope, or invalidated by a material change.
- **Explicitly excluded operations:** Work recorded as `OUT_OF_SCOPE` or `DEFERRED` with a scoped decision reference (e.g., remote push, deployment, production migration, dormant enforcement, or deferred live qualification) is reported as excluded, **never** as incomplete (`MISSING`/`PARTIAL`).
- **Report five closure axes separately** (never collapse into a single `DONE` label; extends `docs/03_WORKFLOW_AND_ACCEPTANCE.md`):
  - **Git closure:** `SYNCED_CLOSED` / `PARTIAL` / `BLOCKED` / `NOT_STARTED`
  - **Runtime readiness:** `NOT_REQUIRED` / `READY` / `FAILED` / `NOT_RUN`
  - **Protected-data integrity:** `VERIFIED_INTACT` / `COMPROMISED` / `UNKNOWN`
  - **Owner acceptance:** `NOT_REQUESTED` / `PENDING` / `ACCEPTED` / `REJECTED`
  - **Production activation:** `NOT_ACTIVE` / `AUTHORIZED_ACTIVE`

---

## 4. Reusable Project-Neutral Post-Merge Closure Template

Attach this compact record to the existing task or quality closeout (`templates/QUALITY_CLOSEOUT.md`) without creating a competing ledger:

```markdown
### Post-Merge Closure Record
- **Target integration branch / synced SHA:** [branch @ sha] (remote sync: ff-only / not_synced / offline_limit)
- **Pre-sync checks:** pending_ops=[none/detail], worktrees=[checked], unrelated_changes=[preserved]
- **Watchers:** harmless_kept=[names/none], quiesced=[name + identity_basis + reason / none]
- **Branch cleanup:** [branch @ tip_sha -> equivalence basis (ancestry/tree-diff/PR); recoverability recorded; deleted / preserved_reason]
- **Runtime refresh:** [NOT_REQUIRED (reason; reused evidence ref) | affected_services=[names]; identity_verified=[yes]; health=[pass/fail]; loaded_revision=[sha]; protected_state=[intact/detail]]
- **Preserved risk acceptances:** [decision_id / scope / validity / none]
- **Excluded operations (out of scope):** [push / deploy / deferred items + decision_ref]
- **Closure axes:** Git=[...] | Runtime=[...] | Protected-Data=[...] | Owner-Acceptance=[...] | Activation=[...]
- **Escalations / Next owner decision:** [only unresolved material authority, safety, or partial-failure recovery items, or none]
```
