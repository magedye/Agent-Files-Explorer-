# Change, adoption and exception control

**Rules:** AGHR-004–005, AGHR-029–032, AGHR-038.

## One intake route
Use procedures/REQUEST_INTAKE.md for features, fixes, new rules, recommendations, observations, source updates, exceptions and proposed removals. Record the original text/locator and available scope. Classify before promoting. Routine authorized changes use the short form; architecture/security/authority changes require a fuller impact record. Do not inflate a minor typo repair into a mandatory ADR.

## Decision content
A decision identifies the competent issuer, exact scope, source, selected disposition, rationale, affected rules/contracts/assets, effective date, predecessor/successor, conditions and verification. ADD, MERGE, STRENGTHEN, REPLACE, LINK, REJECT, DEFER and NEEDS_INFORMATION are dispositions, not check outcomes. Approval to change a document does not automatically activate a host permission.

## Exceptions
Only a waivable rule may have an exception from the appropriate originating authority. Record reason, scope, expiry/review event, compensating control, residual risk and revalidation. Exception expiry restores the base requirement. No exception permits fabricated evidence, unauthorized privilege or false independence. A limitation accepted for a release remains a limitation, never a fabricated PASS.

## Rule quality
A new rule must have a specific benefit, applicability, owner and practical verification. Prefer an existing rule's explanation or task-specific procedure when the meaning is already covered. Do not create a new permanent rule solely because one model made one mistake. Evaluate repeated evidence, cost and unintended blockage. Remove redundant instruction text through authorized supersession rather than silently deleting source history.

## Dependency and migration
Changes to model routing, instructions, tool schema, permissions, data destination, state schema or runtime are compatibility changes. Assess evidence invalidation and rollback. Historical taxonomy identifiers retain their meaning; changed codes receive an explicit migration mapping. Existing approved project controls remain in force until deliberately superseded by the competent authority.
