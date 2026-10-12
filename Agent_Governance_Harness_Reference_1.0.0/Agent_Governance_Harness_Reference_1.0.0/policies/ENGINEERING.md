# Software engineering discipline

**Rules:** AGHR-009–016, AGHR-031, AGHR-034, AGHR-040.

Start from the accepted user/data journey and current repository. Identify what is already complete, what needs extension, what needs implementation and what is blocked. These dispositions guide work selection; they are not release states. Prefer the simplest complete integrated slice and existing verified components.

## Changes and architecture
Keep the minimal coherent diff, not the fewest possible lines. Preserve contracts, types, relevant comments and unrelated staged/untracked changes. Update documentation that your change invalidates. Follow valid existing patterns; explain necessary divergence for correctness or security. Do not impose Domain-Driven Design, Shared/Core, a monorepo, a type system, asynchronous logging or a specific style on every project. Extract abstractions only for real coherent reuse or an accepted boundary.

Scaffolds and planned TODOs are allowed only in explicitly scoped drafts or known pending work; never claim their behavior is complete. Remove only verified orphans introduced by this change. Inspect consumers, dynamic references and generated entrypoints before deletion. Existing debt can be reported without unauthorized cleanup.

## Commands and dependencies
Discover real commands from reviewed manifests, scripts and project documentation. Record argv/shell, working directory, prerequisites, expected evidence and effects. Avoid inventing pnpm/npm/Gradle/dotnet commands. A single-line command is useful only when appropriate to the actual shell and project. Do not execute an unreviewed script to discover whether it is safe.

Check installed API definitions or compatible official versioned documentation. Lockfiles and generated outputs are inspectable when needed; prefer targeted or programmatic analysis. New dependency selection considers support, compatibility, provenance, license/security obligations and migration/recovery. Latest stable is not automatically the safest compatible choice. Generated files should use the approved generator; migrations are not universally disposable artifacts.

## Verification
Use targeted checks first, then expand according to impact and accepted release gates. Prove a reported bug safely when possible; record environmental failures separately from the defect. Correct an invalid test only from the accepted contract and document the reason. Do not delete/skip cases, lower thresholds or replace real integration with mocks to conceal failure. No blanket guarantee of no regression comes from a limited suite.

## Source control
Editing, staging, committing, pushing, merging, rewriting history and publishing are distinct operations. Preserve the existing working tree and branch unless the task requires an authorized alternate workspace. One active writer per worktree/resource is the default concurrency safeguard. Use isolated worktrees for justified parallel work and reconcile against the current baseline before merge.

## Performance and observability
Measure the actual bottleneck and environment. Keep structured diagnostics simple, bounded and redacted. Audit durability requirements may justify blocking before an effect; asynchronous logs are not zero-cost or lossless. Favor measurable outcome, reliability and maintainability over task count or LOC targets.
