# Agent Governance and Harness Reference — AGHR 1.2.0

Updated reference edition under the owner's local designation. Default provider family: OpenAI; default assurance profile: STANDARD. Consumer adoption and activation require the project's decision and actual host qualification. Current status is recorded in [PACKAGE_STATUS](PACKAGE_STATUS.json), not inferred from a folder name.

## Read only what the task needs

Start with [START_HERE](START_HERE.md) or [ابدأ هنا](START_HERE_AR.md), then the selected profile, project facts/current grant and relevant protocol. [CONTENTS](CONTENTS.md) maps task routes. The four contracts and 47 existing rule IDs remain the normative core; this library is not a monolithic prompt.

| Need | Owner entry |
| --- | --- |
| Normative rules and authority | [CHARTER](CHARTER.md), [rules](registry/RULES.json), [contracts](ARCHITECTURE.md) |
| New request or dropped input | [Request intake](procedures/REQUEST_INTAKE.md), [Inbox](procedures/PROJECT_INBOX.md) |
| Extract lessons and classify instructions | [Governed learning](procedures/GOVERNED_LEARNING.md), [optional skill](optional_skills/governed-learning/SKILL.md) |
| Source review, coverage and dispositions | [INBOX reconciliation](design/INBOX_RECONCILIATION.md) |
| Existing adoption migration | [1.1/candidate to 1.2](procedures/MIGRATION_1_1_TO_1_2.md) |
| Current update and actual evidence | [تقرير التحديث](REFERENCE_UPDATE_REPORT_AR.md), [verification](VERIFICATION_REPORT.md) |
| Human learning examples | [الدروس والتقارير](guide/LEARNING_AND_REPORTS_AR.md), [original guide](guide/GUIDE_AR.md) |

## Local tooling

Python 3.10+ standard library is the compatibility target; actual tested interpreter and results are in the verification report.

    python tools/check_package.py --root .
    python tools/run_tests.py
    python runtime/cli.py lesson --project ../my-project --record ../my-project/lesson.json --candidate-id exact-candidate --action review

The lesson command checks recorded evidence and preconditions or captures an immutable candidate. It never edits active instructions or authenticates a grant. No external skill, hook or user-memory integration is installed. Eleven optional instruction-only skills are packaged for selective project adoption.

The bundled executor and validators are bounded local reference tools. They are not an OS sandbox or proof of native host/model, release or production readiness. Earlier compatibility and verification trees remain historical evidence; current results do not silently requalify their claims.
