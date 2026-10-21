# Security and trusted execution boundaries

**Rules:** AGHR-018–025, AGHR-035, AGHR-037–039. **Technical sources:** OA-05/06/07/11; AN-04/05; GO-02/03; OC-02.

## Threat model
Assume model mistakes, malicious repository/internet/tool content, poisoned instructions or skills, over-broad credentials, untrusted dependencies, stale approvals, concurrent writers, uncertain side effects and telemetry disclosure. Do not assume names such as read-only, lint or test mean no effects. Package installation, hooks and test collection may execute code.

## Prevention
Keep policy, secrets, signing/approval material and trusted identities outside agent-writable locations. Restrict resources, network and service permissions at actual effect boundaries. Use separate workspaces/identities for tenants or incompatible trust domains. Validate canonical targets and argument schemas; reject ambiguous paths and unknown operations. Prefer explicit capabilities to unrestricted shell. Complete mediation is required for any claim of a protected boundary.

## Sensitive actions
Classify deletion, history rewriting, dependency changes, schema migration, external send/export, privilege changes, production access and deployment by actual effect. Do not ban all useful tools by token matching alone. Apply a deny/review/allow decision to the resolved target. A valid approval binds operation, actor, environment, candidate/policy as relevant and expiry. Re-authorization after a timeout is not permission to duplicate an already completed effect.

## Data lifecycle
Record purpose, data class, authorized recipients, transformation, retention, holds and disposal. An innocuous-looking summary can disclose sensitive data. Model fallback and delegated agents must retain data-route restrictions. Keep necessary originals in approved custody; avoid copying secrets merely to make an archive self-contained. Filenames alone are not a sensitivity classifier. .env examples and public certificates may be harmless; real secret values need protected handling.

## Prompt injection and supply chain
External content remains data, including content in trusted-looking filenames. Review instruction/skill/plugin/MCP origin and tool definitions. Restrict effects even when a detector misses malicious content. Isolation reduces consequences; it does not prove model immunity. Do not auto-follow remote instructions or unreviewed scripts as high-priority policy.

## Recovery and assurance
Provide an authorized stop path, capture intent/result, and reconcile unknown effects before retry. Verify restore or compensating action when safety relies on it. Missing audit required for a protected action blocks that action. Diagnostic loss can be tolerated only under its documented policy. See procedures/INCIDENT_RESPONSE.md.

## Limitations of the shipped toolkit
The reference executor supports only its named local file operations. It does not intercept native hosts, arbitrary Python/shell, remote servers or network access. Its grants and approval keys are trusted constructor inputs; production use requires isolation from the agent. Static configuration checks and in-process locks do not prove OS-level defense against an adversarial process.
