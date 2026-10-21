# Current local verification — AGHR 1.2.0 updated reference

Status: PASS for the bounded local reference tools. Reference designation: owner-directed. Whole-package independent review: NOT_PERFORMED. Release acceptance: NOT_GRANTED. Native host qualification and live-model evaluation: NOT_RUN.

## Actual final test run

Python 3.12.10 on Windows-11-10.0.26200-SP0. Run from 2026-10-20T07:34:47.667148+00:00 to 2026-10-20T07:36:04.661510+00:00. Command: python -B tools/run_tests.py.
Discovered/executed: 289; failures: 0; errors: 0; skipped: 0. These are actual runner counts, replacing historical prose counts.

| Module | Executed cases |
| --- | --- |
| test_decision_support | 20 |
| test_delivery_records | 48 |
| test_evaluations | 10 |
| test_inbox | 17 |
| test_integration | 18 |
| test_learning | 28 |
| test_learning_integration | 5 |
| test_metrics | 20 |
| test_package | 21 |
| test_records | 49 |
| test_runtime | 47 |
| test_skills | 6 |

Package structural/semantic/link checks passed; the final manifest is rechecked after this report/status freeze. The 47 rules, 56 primary-source records and 12 adapter records are preserved. Eleven optional skills are packaged and remain uninstalled.

Context measurement: AGENTS estimated 871 tokens; combined AGENTS/START_HERE/CONTENTS estimated 3682. Method is character-count/4, an advisory heuristic rather than an actual tokenizer count.

## Source custody and review

The original candidate contained 260 files and exactly matched its original ZIP payload. Both are preserved separately from this update. All eight INBOX source hashes remain unchanged. [Source identity](design/INBOX_SOURCES.json) and [53-group reconciliation](design/INBOX_RECONCILIATION.json) record their scopes and dispositions.

One bounded independent [skill forward review](design/LEARNING_FORWARD_REVIEW.md) found three consistency gaps. After corrections, nine synthetic follow-up cases matched expectations. This scoped exercise is separate from whole-package review and native host qualification.

## Evidence boundaries and failed intermediate check

Baseline: 252/252 local tests passed. Initial implementation: 279/279 passed. An intermediate 289-case run failed two checks because the source-section index omitted a body locator for a document without Markdown headings. The generator was corrected without weakening the gate; the two affected checks and then the complete final 289-case run passed. Earlier results and failures remain in the Studio custody receipt.

Raw check/test outputs, exact implementation-file hashes and the unified before/after diff are preserved by the Studio under docs/evidence/reference-1.2.0-update/. The delivery ZIP digest covers the complete distribution, including historical post-freeze logs excluded from the payload manifest. Hashes establish integrity, not authenticated authorship or consent.

Historical verification/, compatibility/ and pre-update root reports retain their original scope. They are not current host/model/release evidence. Missing Antigravity source, unrefreshed MARSAD state and PDF equivalence remain unresolved source questions, not silently passed gates.
