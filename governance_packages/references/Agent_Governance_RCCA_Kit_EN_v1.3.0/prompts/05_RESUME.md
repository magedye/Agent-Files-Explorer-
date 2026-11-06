# Resume an interrupted authorized task

Reconcile the handoff with the actual workspace before acting. Check source/request hashes, approved changes,
current revision and uncommitted work, owner grant/revocation, effective host instructions, task dependencies and
which evidence is stale. A summary is a pointer to evidence, not a new authority.

Read only the context necessary for the next authorized step. Do not replay irreversible or external operations
merely because a previous session lacks their result. Verify the observed state or escalate that action. Do not
reset unrelated work. Preserve pending obligations and exact blocked conditions.

Continue unblocked work inside the valid grant without a new global approval. If no authorized work remains,
return BLOCKED with the specific missing decision/evidence and resume condition; do not repeat unchanged checks.
The optional continuity checker only diagnoses supplied task metadata and cannot authorize execution.
