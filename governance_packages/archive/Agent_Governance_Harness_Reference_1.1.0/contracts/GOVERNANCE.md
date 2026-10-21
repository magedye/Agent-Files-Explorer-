# Governance Contract

**Owner:** project governance authority. **Consumers:** intake processor, instruction assembler, reviewer. **Canonical rules:** registry/RULES.json.

## Input and output
Input: original request/source text, source location/version, institutional issuer, adoption decision, relevant project facts. Output: classified items, applicable approved rules, conflict decisions and an execution grant reference. Never infer a grant from a forceful verb or a MUST keyword.

## Orthogonal dimensions
Record separately: instruction channel (host supplied), institutional authority (approved project source), source trust, item kind, normative force, applicability conditions, approval state, waiverability, enforcement mechanism and verification obligation. MUST, MUST_NOT, SHOULD, SHOULD_NOT, MAY and INFORMATIVE are semantic categories, not percentages. Optional impact/priority scores never change authority.

## Resolution
First honor the actual host's instruction hierarchy. Then apply valid organizational sources within that ceiling. Determine the exact subject and applicability, check approval and explicit supersession, preserve exceptions, and compare authorities with jurisdiction over that subject. More recent, more specific or more restrictive is not sufficient by itself. Escalate unresolved equal-authority conflict for the affected action only. Missing mandatory safety facts cannot be silently assumed; noncritical assumptions may be documented and used provisionally.

## Rule lifecycle
CAPTURED → CLASSIFIED → PROPOSED → APPROVED → EFFECTIVE → SUPERSEDED or RETIRED. Rejection and deferral remain traceable. Approval does not automatically mean operational deployment. An imported document is evidence/data until promoted by the authorized owner. Each effective rule has an original source, purpose, condition, owner, check and change path.

## Acceptance boundary
The author may implement and test; independence requires distinct authority and freedom from conflict, not just another model instance. LITE does not require three people for every edit. Release and activation decisions are recorded separately if the product is deployable; a library can have release acceptance with activation not applicable.

## Failure
Return a classified unresolved item, the narrow affected scope, missing decision and permitted independent work. Never manufacture precedence. Source policy is defined in sources/REFERENCE_POLICY.md. Technical basis: OA-01; this institutional resolution procedure is package synthesis.

## Integrated delivery records (1.1.0)
Clarifications and alternatives remain intake/decision records, not a fifth contract. External capabilities and standards enter through the same classification/adoption process. The owner requested additions are reconciled in [the mapping](../compatibility/ADDITIONS_CONTROL_MAPPING.json); EXT identifiers and standards checklist IDs are trace labels, not additional normative catalogs.
