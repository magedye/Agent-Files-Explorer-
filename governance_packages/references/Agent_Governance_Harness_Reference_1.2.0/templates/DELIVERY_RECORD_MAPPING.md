# Delivery record mapping — one canonical backend

| Need | Canonical owner | Representation |
|---|---|---|
| Material question, options, recommendation and decision | REQUEST | Optional `clarifications` list; existing decision references |
| Guided/continuous selection, phase, approved plan baseline | STATE | Optional `delivery` object; selection is NOT a grant |
| Current branch and remote freshness | STATE | `delivery.git_observation`; observer supplies facts; CLI does not inspect Git |
| Deviations and remediation | STATE | `delivery.findings`; evidence/check and decision references |
| Actual authority and protected effects | Existing host/operator grant and PROJECT adoption | Existing operating contract; no boolean in a template grants permission |
| Standards applicability | Existing decision/pending register | `templates/STANDARDS_APPLICABILITY.md`, referenced by a decision |
| Optional capability adoption | Existing request/decision and host qualification | `templates/CAPABILITY_REVIEW.md` |

Old REQUEST/STATE records without extension fields remain valid. Existing external systems can map these fields instead of replacing their canonical database. Request capture validates records but does not authenticate a decision or approve an action. `delivery` data is not a security policy. Unknown facts remain null/UNKNOWN and must not be converted into safe defaults.
