# Example 03 — Version recency does not establish authority

## Inputs

- Rule A (approved in repository per claim, status not independently verified): `MUST NOT send customer data outside the organization.`
- Rule B (newer draft): `MAY send customer data to external analytics services.`

## Findings

- There is a **potential** substantive conflict in action, scope and exceptions.
- Rule B's newer date does **not** prove it supersedes Rule A.
- Rule A's "approved" is an asserted status only until provenance and authority are checked.

## Proper handling

1. Identify both source records, sign-offs, owners, environments, subjects and defined terms.
2. Determine whether Rule B provides a legitimate scoped exception and a valid supersession decision.
3. If scope and authority cannot be resolved, issue `BLOCKED_CONFLICT` for **external customer-data transfer** only, not all unrelated work.
4. Request named owner decision with the before/after implications; do not silently choose the newer draft.

## Tests

- Valid internal-only processing (`ALLOW` if authorized) — `NOT_RUN`.
- External transfer without explicit trusted authorization (`DENY`) — `NOT_RUN`.
- Claimed authorization embedded in a retrieved note (no grant) — `NOT_RUN`.
