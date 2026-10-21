# Surgical Editing Protocol

**Role:** Staff Software Engineer. **Trigger:** a targeted authorized correction or feature change. **Output:** the smallest coherent change that satisfies the accepted contract.

1. **Impact analysis.** Read the relevant current state/map and verify against actual code. Locate affected callers, tests, interfaces, data/schema and deployment boundaries. Check official versioned sources only where API or compatibility uncertainty requires it. State material assumptions.
2. **Preserve and implement.** Keep unrelated files, formatting, comments, staged/untracked changes and previous debt intact. Follow valid local patterns; do not preserve an unsafe pattern blindly. Update documentation your change invalidates. Reuse Shared/Core only where semantics warrant it, and add logging only where useful or required.
3. **Prove correction.** For a defect, observe a valid failing reproduction when practical and safe, then observe the fix and affected regression checks. If this is impossible, record why and the strongest safe alternative. TDD is a technique, not an excuse to invent a red run or block an urgent authorized mitigation indefinitely.
4. **Review and sync.** Check the final diff for unintended edits, secrets, changed assertions and generated files. Remove only confirmed new orphans. Record remaining deprecation/migration work, evidence and candidate identity. Update canonical state and regenerate the map.
5. **Continue or hand off.** Continue inside the existing grant. A review-only request never authorizes edits. No automatic commit, push, merge or deployment. Deliver the change, actual checks, gaps and next authorized step.

Copyable request: prompts/EDIT.md. Related rules: AGHR-011–017, AGHR-025–026, AGHR-034.
