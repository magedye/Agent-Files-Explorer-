# Evidence Contract

> Minimal scope: these are operating obligations, not an implemented host integration. See [distribution limits](../README.md) and [reference routing](../REFERENCE_MAP.json).

**Owner:** verifier and relevant acceptance authority. **Consumers:** work-state updater, evaluator, release reviewer.

## Claim record
Bind a claim and criterion to the tested candidate digest, environment ID, provider/host configuration where relevant, check command or procedure, start/end time, target count, outcome, raw artifact path/digest, known exclusions and producer identity. For test claims, executed test count must be positive. Other checks use a nonempty explicit target population. A zero exit code without a meaningful target is insufficient.

## Outcome vocabulary
PASS, FAIL, NOT_RUN, BLOCKED, ERROR and NOT_APPLICABLE describe a check. INDETERMINATE describes an uncertain action effect. ACCEPTED_LIMITATION is a decision with scope and owner, never a test PASS. Work state and review/acceptance states are separate. No global percentage called quality or compliance without a stated denominator and measured procedure.

## Validity
Reject missing artifacts, malformed timestamps, unsupported outcomes, zero-target success, mismatched candidate/environment, stale policy where material, corrupted hashes or unexplained exclusions. Rebuilds and signed/deployed artifacts have their own identities. Invalidate only affected evidence when a documented dependency changes; avoid both blanket reuse and unnecessary full reruns. Hash equality is integrity relative to a baseline, not authenticity or semantic truth.

## Test integrity and behavioral evaluation
A legitimate change to a faulty test or approved requirement is possible, but keep its rationale and approval. Never lower assertions, delete cases, substitute shallow mocks or change thresholds merely to make failure disappear. Evaluate representative success and negative paths, permission attempts, injection, resumption and side effects. Freeze evaluation criteria before the run. Deterministic checks, model-judged scores and human review remain distinguishable. Behavioral sampling is not proof of universal compliance.

## Acceptance
Implementation verification is not product completeness, independent review, release acceptance or environment activation. A release decision names the authority, exact candidate, evidence, limitations and environments. The author can report a local test but cannot invent independent sign-off. Missing live prerequisites produce NOT_RUN/BLOCKED with the next required action.

Technical foundations: OA-09/10. This record contract and state vocabulary are package definitions.

## Progress and deviation evidence (1.1.0)
A progress view reports criterion evidence separately from declared task completion. Findings identify rule/version, expected and observed behavior, scope, evidence, severity and corrective decision. Missing telemetry is unknown, not conformity; accepted replanning is not automatically a violation. A closure requires retest evidence. No numeric average can neutralize a critical finding. See [the minimal progress summary](../CORE.md#progress) and the full edition procedure identified in [the reference map](../REFERENCE_MAP.json).
