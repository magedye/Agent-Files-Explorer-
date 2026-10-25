# Diagnosed development attempts

| Attempt | Classification | Cause / correction |
| --- | --- | --- |
| Initial rollback/replay assertion | TEST_DEFECT | Expected412 from an already consumed grant. Correct403 retained; added a separate unused stale intent that proves412. Rollback must not revive a one-use grant. |
| First T16 browser | PRODUCT_DEFECT (duplicate work) / environment sensitivity | Request exceeded the unchanged15s bound. Code inspection showed two complete strict passes, directly and through E2 lint; exact CPU/environment contributions were not isolated. Use E2 lint's complete pipeline once and separate advisory findings. No timeout increased. Both the T16 checkpoint and final Edge evidence pass; failed browser DB/log/Sentinel retained under attempts. |
| Generation fixture schema | TEST_DEFECT | Specification snippet lacked rationale/impact required by locked item schema. Added explicitly synthetic fixture metadata; no governing source or schema weakened. |
| Full-stage fixture budget | TEST_DEFECT | Arabic/emoji fixture exceeded its test full-stage budget, correctly selecting compress. Set a larger synthetic budget for the dedicated full case; production32768 stays fixed. |
| JavaScript specification extraction | TEST_DEFECT | Exact specification uses CRLF; fixture extraction expected LF. Normalize only the test specification extraction, never proposed_yaml input. |
| CLI unsupported operation | PRODUCT_DEFECT | Usage error became INVALID/1 after source verification. Separate unsupported-command ERROR/2 from malformed proposal INVALID/1; final8-case CLI run passes. Earlier log retained. |
| Snapshot Markdown link check | TEST_DEFECT / evidence layout | Raw before/after Markdown snapshots were interpreted as active documents from their archival paths. Keep their exact bytes as .md.raw with explicit DIFFS mapping; do not modify copied content or weaken the link checker. |

Transient development attempts are not acceptance evidence. Final current-source tests and locked custody govern claims. Test fixtures and unit test counts, including the seven Python unit methods, are unrelated to the seven deferred E4 operational honesty checks.
