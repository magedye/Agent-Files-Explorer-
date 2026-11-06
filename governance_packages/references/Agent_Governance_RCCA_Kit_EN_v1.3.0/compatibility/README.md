# v1.2 executable compatibility — preserved, not silently promoted

The seven original Python scripts and two test files in `v1_2/` are byte-identical copies from the supplied
Agent_Governance_Kit_AR_v1.2_COMPLETE.zip. Original documents remain in the user's unchanged archive; their concepts
are reconciled in the new English documents, not copied as a second instruction authority. The separate AGHR
Reference archive is not merged wholesale. This is a complete v1.3 candidate, not a promise of identical old semantics.

The new wrapper reuses source segmentation and G1/G2 checks from script 08. It explicitly replaces old G5 review-floor
semantics for the solo-owner profile. Do not run both G5 policies as rival authoritative judgments of the same task.
A self-check may support low-risk local completion reporting but never claims independent approval.

The new `python -m agdl` CLI is diagnostic and writes only stdout. Some legacy tools can write when explicitly
invoked with write-related arguments: the event ledger and fixture gated-write demonstration are examples.
The latter is an isolated demonstration, not production interception. Do not run all legacy scripts blindly.
SHA-256 chaining is not tamper-proof storage or authenticated publisher identity.

Run compatibility tests from the package root:

```sh
python -B -m unittest discover -s compatibility/v1_2/tests -v
```

These 44 original fixture tests do not qualify Codex, Antigravity, OpenCode, Windows or real owner authority.
