# AAPES v2.1 Integration Merged — Derived Execution State

Updated 2026-11-05 Asia/Aden. Ground truth is determined by actual Git HEAD, working tree, and passing test verification.

Owner authorized AAPES v2.1 Policy Engineering, Assessment, Evaluation, and Studio Integration under Task ID `AGHR-AAPES-INTEGRATION-001`. Completed, qualified, and merged into `main` by owner directive:
- **Scope & Architecture:** Preserved AGHR Studio v1.0.0 release and pinned `aghr_rc3` default engine. AAPES v2.1 integrated as external review candidate (`aapes_v2_1` / `aapes-candidate`) with 12 domains, 48 requirements, and 100% importance weighting.
- **Studio Interface & API:** Fully accessible via accepted Studio interface (`StudioApp.jsx` + `AapesStudio.jsx`), unified backend (`unified-runtime.mjs` + `aapes-candidate.mjs`), and canonical `/api/v1/aapes/*` routes under ephemeral token authentication on port 5183.
- **Demonstration Flow (7 Steps):** Complete 7-step owner flow verified end-to-end (interface login, candidate workspace access, 48-requirement inspection, static policy review with BCP 14 and unified diffs, R0–R3 risk-weighted readiness assessment with hard-gate separation, 48-row compatibility matrix [43 COVERED, 5 PARTIAL], and governed draft Change Package preparation into `rc3-local` SQLite custody).
- **Verification Suites:** 185 tests passing (`npm test`), 59/59 canonical API operations with 169 schema checks valid (`npm run test:studio-api`), 1/1 Studio 7-step flow test passing (`tests/aapes_studio_flow.test.mjs`), 1/1 Microsoft Edge headless browser test passing (`tests/aapes_browser.spec.mjs`), and context health passed (0 errors, 0 warnings).
- **Owner Disposition:** Merge, push, and synchronization to remote repository authorized and executed. Draft change packages remain unapproved in SQLite custody until separate owner adoption. Pinned `aghr_rc3` remains default baseline.

## Owner authority and custody
- Owner sign-off on Studio v1.0.0 ([`docs/evidence/studio-signoff-2026-10-26/OWNER_SIGNOFF_AR.md`](../evidence/studio-signoff-2026-10-26/OWNER_SIGNOFF_AR.md)) and rc.3 default engine preserved.
- Prior Markdown INBOX draft intake (22 sources, 172 draft CPs in local SQLite custody) preserved.
- Directives, reports, and evidence recorded in [REVIEW_AND_APPROVAL.md](../../REVIEW_AND_APPROVAL.md), [IMPLEMENTATION_REPORT.md](../../IMPLEMENTATION_REPORT.md), [TEST_AND_VERIFICATION_REPORT.md](../../TEST_AND_VERIFICATION_REPORT.md), and [AAPES_AGHR_COMPATIBILITY_MATRIX.csv](../../AAPES_AGHR_COMPATIBILITY_MATRIX.csv).
- Untracked Windows scripts (`setup.ps1`, `start.ps1`, `stop.ps1`, `verify.ps1`) and custody packages (`governance_packages/INBOX/NEW/`, `governance_packages/candidates/AAPES_v2.1_Candidate/`) preserved intact.

## Stop position
STOP: AAPES v2.1 integration and qualification merged and synchronized on `main` per owner directive. Production baseline remains locked to `aghr_rc3`. Any promotion of candidate rules to active normative authority or adoption of draft change packages requires separate owner sign-off.
