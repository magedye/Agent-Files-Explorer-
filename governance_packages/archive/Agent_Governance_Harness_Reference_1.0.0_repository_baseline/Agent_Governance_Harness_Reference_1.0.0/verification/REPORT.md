# Verification report — AGHR 1.0.0

**Recorded:** 2026-10-11T16:27:07+00:00. **Scope:** authored reference, bundled local tools, synthetic file effects and distribution integrity. **Independent review:** NOT_PERFORMED. **Native host/model qualification:** NOT_RUN.

## Executed checks
| Check | Actual observation | What it does not establish |
|---|---|---|
| Local unit/negative/mutation tests | **127 executed, 0 failures, 0 errors, 0 skipped** | Live model obedience or host isolation |
| CLI adoption/intake/map/demo workflows | **12 cases matched their required exit/result**, including deliberate refusal cases | An authenticated project adoption decision |
| Bounded file-executor demo and fixed grader | **8 scenarios**, actual create/read/approved replace, denials, cancellation and artifact/audit checks | Shell/network/MCP/deployment mediation |
| Source archive inventory and disposition | **73 actual v4 files and 48 active controls** matched/linked | Independent original-source semantic equivalence |
| Canonical rules / adapters / official sources | **40 rules, 6 provider adapters, 6 host adapters, 30 official reference records** | Every provider-host combination supported or tested |
| Record schemas | Five bounded schemas, valid template shapes and negative semantic checks | Truth or institutional authority of record producers |
| Syntax compatibility inspection | **14 Python files parsed with Python 3.10 grammar target** | Execution under Python 3.10 |
| Arabic guide rendering | **34 sections, 10 embedded SVG diagrams; 1440px and 390px Chromium viewports**, no document-wide horizontal overflow, broken TOC anchor or page script error observed | Full browser matrix or accessibility certification |
| Original project-file preservation | Existing instruction and unrelated-file hashes unchanged in CLI test | Authorization to adopt into any real project |

## Environment and method
Actual interpreter: Python **3.13.5**. Actual platform: `Linux-6.18.44-x86_64-with-glibc2.41`. Tests use Python's standard library and temporary workspaces. No API key, subscription, model call, native Codex/Claude/Gemini/Copilot integration, production endpoint or user Git repository was used.

The guide was visually inspected in rendered desktop and mobile screenshots. Chromium's environment policy blocked file-URI navigation; the same embedded HTML bytes were rendered with Playwright `page.set_content`. The policy was not disabled. Diagram/table containers intentionally support horizontal scrolling on narrow screens; the document body does not overflow. No external script, stylesheet or font is required. This is a rendering check, not proof of behavior under every browser's local-file policy.

## Defect found and corrected
The first source-ZIP comparison compared archive-prefixed names with package-relative inventory paths. It failed rather than producing a false PASS. The checker now removes only the declared top-level prefix, verifies bytes/hashes, and rejects unexpected prefixes, traversal and duplicate names. Dedicated regression tests cover that behavior. No source archive content was changed.

## Negative boundaries exercised
The suite checks invalid/extra authority fields, forged/expired/replayed approvals, changed actor/task/environment/policy/candidate/target, cancellation, traversal, symlinks, hard links, protected paths, output/time/step budgets, pre-effect audit failure and post-effect uncertainty. Record tests reject zero-test PASS, empty targets, missing/tampered evidence, timestamp errors, unknown/cyclic references, unproved VERIFIED state, inappropriate profiles, duplicate intake and stale revisions/maps. Mutation tests reject incomplete controls, duplicate rules, invalid matrices, missing contracts, unmanifested payload and false native PASS.

## Evidence locations and finalization
`verification/results/` contains actual raw tests, CLI cases, demo workspace/observations, guide measurements and source-preservation checks. Post-freeze test and package-validation records are emitted there after the payload manifest is fixed; their status is not inferred from this narrative. Clean extraction and revalidation of the final ZIP are recorded in the detached distribution-verification JSON alongside the archive.

`MANIFEST.json` hashes the immutable reference payload, excluding itself, interpreter caches and post-freeze `verification/results/`. The detached SHA-256 of the complete ZIP covers both payload and included results. No archive hash is embedded inside itself. Byte integrity is distinct from producer authentication and correctness.

## Source/design assurance
Nine primary artifacts were frozen before supplemental v4 inspection; exact bytes and local sequence metadata are retained under `design/`. This is an auditable author construction record, not an independently timestamped attestation. All available v4 files and active controls have dispositions. The inherited 88/441/598 historical records remain trace-only; absent originals have not become verified by mapping IDs.

## Remaining gates
Required before an actual project is effective: real project facts, scoped competent adoption decision, selected model/host identity, instruction-loading evidence and qualification of applicable protected tool routes. Real identity/key custody, OS/network isolation, durable replay/audit storage and concurrency protection are deployment responsibilities. External native-tracker connectors are not implemented. Independent review, product acceptance and production activation are not granted by local test success.

See [limits](LIMITATIONS.md), [runtime boundary](../runtime/README.md), and [v4 reconciliation](../compatibility/V4_RECONCILIATION.md). The reference is final within this stated delivery scope; consumer qualifications remain explicit rather than silently claimed.
