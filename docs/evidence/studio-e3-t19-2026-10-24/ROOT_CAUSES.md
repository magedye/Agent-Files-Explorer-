# Verification development notes

| Observation | Classification | Resolution |
| --- | --- | --- |
| Existing E5 regression expected missing PRIN-007 in the old preview | STALE_CONTEXT / changed supported profile | Preserve immutable E5 implementation/tests for its renderer. Active E3 intentionally inserts the normative PRIN-007 text; update only the active runtime expectation to full/present. Original snapshot retained. |
| Old run-count assertion assumed generation did not persist a bounded run | TEST_DEFECT after added evidence | Count validate runs by command; keep additional actual generation receipts rather than removing them. |
| Draft bootstrap initially used the accepted E2 process transport | REQUIRED_FOR_CURRENT_ACCEPTANCE | Add optional Job transport for Draft bootstrap only; preserve original read-only default. All subsequent full tests use bounded bootstrap. No T01 re-evaluation. |
| Evidence helper reused the latest response variable after a new local-source scenario | TEST_DEFECT | Capture the SEC-001 review artifact path at creation, then use that stable value when copying evidence. Product approval/export assertions had passed; failed full log retained under attempts. Re-run full npm suite passes82/82. |
| Canonical SEC-001 rejected | EXPECTED_UNSUPPORTED_OR_OPTIONAL_STATE with required unmet gates | Enterprise issuer/required GitHub gate unverified; P0 E4 explicitly NOT_RUN. Preserve blockers and emit only visibly unapproved review patch. No waiver, mock success or weakened item. |

The82 tests and E3 control canaries do not constitute the seven E4 operational honesty checks. Those remain REQUIRED / NOT_RUN / NOT_WAIVED.
