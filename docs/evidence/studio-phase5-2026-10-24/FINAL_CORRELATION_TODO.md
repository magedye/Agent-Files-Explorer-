# Required final metric correlation checks

Status: COMPLETED / TESTED_LOCAL_DRAFT. Complete baseline149/149 on V2; final affected lifecycle/Phase5 tests27/27 on V3; saved actual runtime outputs reprojected successfully. FINAL_ACCEPTANCE explicitly records composed evidence. No blanket native qualification or owner/release acceptance.

The full baseline regression NPM_TEST_FINAL_V2 is running on TESTED_SOURCE_FINAL_V2. Preserve it unchanged. After it finishes:

1. In phase5/observations.mjs, derive historical observations' host version from their actual execution receipts / stored lifecycle view, rather than labeling historical runs with the current Node version. Unknown/mixed versions are unobserved. Test a prior-version receipt excluded from current metrics.
2. If a VERIFIED result references an execution outside the bounded observation window, classify it unobservable instead of inventing a false-success violation. Explicit missing execution reference or a mismatched observed execution still fails. Retain an excluded observation count and test it.
3. Clarify actual discovery input language observation: Arabic script is positively detected; arbitrary non-ASCII punctuation must not label an English task non-English. Other undeclared languages remain unobserved. Preserve query source metadata.
4. Freeze final source V3, then run all Phase5 and changed lifecycle integration suites on it. Preserve the complete baseline regression and report the final affected-scope regression separately. This is composed V3/V2 evidence, not a claim that every baseline test ran on modified bytes. E1–E4 and their verification assumptions stay unchanged.
5. Update finalizer to retain both source manifests and counts; FINAL_ACCEPTANCE must explain composition and require final focused results. Then context check, preservation, before/after and custody. No more optional tests or feature work.

User authority: owner accepted Phase4 and authorized actual project evaluator setup, T30–T33 and T34/T35 plan only. No canonical writes, no pilot execution or Git publication. Current npm test session18588; no source mutations while it runs. Earlier run24561 was cancelled with exact owned-process custody and is not a pass. Focused20/20 and final Edge/Sentinel already passed V2.
