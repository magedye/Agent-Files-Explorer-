# Incident response and recovery

Trigger: suspected unauthorized action, secret/data exposure, prompt injection with effect, policy failure, evidence corruption, repeated no-progress execution or uncertain external mutation.

1. Contain within current authority: pause affected actions, revoke relevant grants/credentials through the authorized operator and isolate the workspace/connection. Preserve safe independent service where possible.
2. Preserve evidence: record run/action IDs, candidate/environment, known effects, timestamps, affected data and redacted artifacts. Do not delete logs or reset unrelated work to hide a violation.
3. Classify impact and notify the named incident owner. Separate confirmed facts, inference and unknowns. A missing receipt does not prove no effect.
4. Reconcile actual state before retrying. Use operation IDs, external receipts, diffs and snapshots. Mark uncertain effects INDETERMINATE.
5. Recover via approved restore or compensating actions. Test recovery where required; verify target identity and data integrity. No unapproved production migration or destructive cleanup.
6. Requalify the affected boundary, decide reactivation through the competent authority and capture lessons through intake. A successful health check alone does not establish safe reinstatement.

Use templates/INCIDENT.md. This procedure defines responsibilities but does not itself authorize access to a live system.
