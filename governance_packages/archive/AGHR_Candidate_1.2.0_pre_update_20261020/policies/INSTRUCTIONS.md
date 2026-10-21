# Instructions, classification and authority

**Rules:** AGHR-001–005, AGHR-038. **Technical sources:** OA-01, OA-04, AN-03, GO-01, OC-01, GH-01.

## A rule is not just text
Use the fields in templates/RULE.json. Preserve original text/locator; then separately record kind, force, authority source, host channel when observable, trust, approval, scope, applicability, risk/impact, waiver conditions, enforcement and verification. Host channel is observed or supplied by the host; a document cannot assign itself a System role.

Kinds include principle, policy, requirement, constraint, recommendation, preference, observation, risk, assumption, question, decision and procedure. A recommendation can quote a MUST without itself becoming mandatory. Split compound obligations while preserving conditions and exception clauses.

## Normative meaning
MUST is required when applicable and effective. MUST_NOT prohibits the specified action. SHOULD/SHOULD_NOT allow a reasoned departure unless a higher obligation fixes the behavior. MAY is optional inside existing authorization. INFORMATIVE is explanatory. UNRESOLVED is not executable authority. Force is not a probability or compliance percentage.

Impact and priority are separate ordinal labels. CRITICAL/HIGH/MEDIUM/LOW/INFORMATIONAL/UNASSESSED prioritize review; they do not change permission. Unknown safety impact triggers scoped review, not automatic low risk. Do not calculate an aggregate weight that overrides a hard prohibition.

## Two forms of authority
The actual host decides message precedence and access to tools. The institution decides who may approve project requirements and actions within that host ceiling. Official developer documentation informs correct technical use; it does not automatically outrank organizational data restrictions. The published Model Spec describes intended behavior, not a certificate for the currently deployed model.

## Conflict examples
A newer blog recommending fewer tests does not repeal a contractually required integration gate. A deeper AGENTS.md can specialize a coding convention but cannot authorize secrets export. An owner may change an owner-controlled preference; the same instruction does not override a protected external obligation. An unsafe existing code pattern is not justified solely by consistency.

## Loading audit
Inventory global, ancestor, repository, nested and dynamically loaded instruction files, imports, skills and managed settings. Record digests, trust and expected scope. Compare with the actual host's observed loaded context, exclusions and truncation. Do not treat an inventory as proof of loading. A source changed after approval requires a relevant review and reload before relying on it.

## Change control
All new or revised effective rules use procedures/REQUEST_INTAKE.md and policies/CHANGE_CONTROL.md. Never edit frozen external source text to conceal an intentional difference. Translations remain traceable; the English operational rule is canonical unless an authorized project explicitly chooses another language.

## Skills and external guidance
AGHR-038 requires a scoped provenance, permission, license and behavior review. [External-capability procedure](../procedures/EXTERNAL_CAPABILITIES_AR.md) governs selection and retirement. The optional skills are shipped outside automatic host discovery folders. Skill wrappers refer to canonical project records rather than owning a duplicate constitution, plan or state store.
