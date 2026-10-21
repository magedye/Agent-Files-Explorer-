# Unified request and change intake

**Applies to:** features, fixes, reviews, plans, rules, recommendations, notes, policies, exceptions, removals and source updates. **Records:** templates/REQUEST.json or the short Markdown form; one canonical project registry.

## Short route
For routine work already within a valid grant, record original request/locator, goal, scope/exclusions, criterion, authority reference, disposition and evidence/result. Use templates/SHORT_REQUEST.md. A short request still distinguishes review from implementation and does not skip protected checks.

## Full route
1. Capture the exact available source in approved custody. Record source ID, locator/version, captured time and hash where appropriate. Sensitive sources may use protected references; do not duplicate secrets.
2. Split compound items without losing conditions, exclusions or original wording. Classify kind, force, institutional authority, host-channel observation, trust, approval, applicability, impact and waiverability.
3. Identify existing coverage, implementation and conflicts. Determine whether the request is a rule, a product requirement, a task, or information only. Classifying a recommendation does not approve it.
4. Propose ADD, MERGE, STRENGTHEN, REPLACE, LINK, REJECT, DEFER or NEEDS_INFORMATION. State added value and affected contracts/files/criteria. Avoid synonymous duplicate rules.
5. Resolve with the proper authority. Existing authorization may permit routine actions. New protected permissions, governance changes, external obligations and unresolved meaningful conflicts need the competent decision. Do not halt independent authorized items.
6. Apply approved changes through a work item; define acceptance before implementation. Record rule/version and effective-date changes separately from deployment.
7. Verify the actual candidate and update evidence/state/map. Preserve rejection/deferral history and source relationships. Review is not independent unless genuinely established.

## Disposition example
Input: 'Never open any lockfile.' Kind: proposed constraint. Force: proposed MUST_NOT, not effective. Decision: REPLACE with targeted inspection when needed for dependency correctness; avoid unnecessary full-file context loading. Rationale: an absolute read ban would block legitimate security and compatibility review. Target: AGHR-006/013 and ENGINEERING policy. No model parameter or confidence percentage changes its authority.

## Unresolved source
Input: '[cite: 1]' without a resolvable source. Preserve it in the original and mark source support UNVERIFIED. Do not invent a publication. A separate reliable reference can support a new proposal but cannot be claimed as the missing original.

## CLI
`python runtime/cli.py intake --project ../my-project --request request.json` validates and saves the request under its unique ID. It never approves, executes or rewrites source policies. Existing IDs are refused, preserving prior records.

## Smart clarification (1.1.0)
Apply AGHR-041 before dependent effects: inspect authorized sources, then ask only unresolved material questions with options, impact and a recommendation. Preserve prior valid answers; record a bounded assumption only for reversible noncritical detail. Separate missing source access from missing user intent. Do not treat silence as permission. Continue unaffected authorized work.

Use [the detailed procedure](SMART_CLARIFICATION_AR.md). Optional `clarifications` in REQUEST records capture decisions; the CLI validates records, not the truth of user consent. See [record mapping](../templates/DELIVERY_RECORD_MAPPING.md).
