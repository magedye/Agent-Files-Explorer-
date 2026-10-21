# Planning Protocol

**Role:** Staff Software Engineer / Tech Lead expertise, without additional authority.
**Trigger:** a planning request, material uncertainty, architecture or a complex change. **Output:** a scoped plan tied to verifiable outcomes. **Rules:** AGHR-009/011/013/034.

## Preconditions
Identify the accepted goal, non-goals, current grant and existing architecture. State assumptions. Clarify ambiguity that changes safety, correctness, material scope or authority; document reversible noncritical assumptions and proceed. A plan-only request remains read-only.

## Sequence
1. Observe date/time from a trusted host clock when available, including timezone. If unavailable, disclose it; do not make shell success a prerequisite for all reasoning. Verify current official versions/support only when selection or compatibility depends on them. Choose a supported compatible version and record why; do not blindly upgrade to latest stable.
2. Model the actual GUI/user or API/data journey as testable goals, including rejection/failure and relevant operational behavior. No feature creep or speculative flexibility.
3. Choose the simplest complete architecture consistent with existing approved boundaries. Shared/Core, feature grouping, DRY or new abstractions require real semantic value. No arbitrary file-size or line-count optimization.
4. Design proportionate safe diagnostics and, where needed, durable audit. Specify redaction, destination, buffering/backpressure, failure semantics and measurable budgets; asynchronous is not automatically safe or free.
5. Record milestones as integrated outcomes, dependencies, tests, candidate/environment needs and risks. Identify existing work to reuse, not merely a list of files to create.
6. Initialize canonical state and generate PROJECT_MAP sections TECH_STACK, SYSTEM_FLOW, ARCHITECTURE and ORPHANS & PENDING. Keep pending history. The map is a view, not source authority.

## Exit
Deliver plan, assumptions, verifiable milestones, proposed changes, needed decisions and next action. Wait when the task is planning-only or a required decision is absent; otherwise an existing implementation mandate can continue without repeated approval. Use templates/PLAN.md and prompts/PLAN.md.
