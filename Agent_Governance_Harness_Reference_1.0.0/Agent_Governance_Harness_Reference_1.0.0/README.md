# Agent Governance and Harness Reference (AGHR)
## Version 1.0.0 — independent reference edition

**Default provider route:** OpenAI / GPT. **Default assurance profile:** STANDARD.
**Language:** English operational materials; Arabic explanatory guide with English terminology.

A self-contained reference library, adoption workflow and executable local toolkit for governing software agents. This is a new architecture, not a renamed v4. Official developer references and owner requirements established the primary design; v4 was reviewed afterward as a supplementary source.

## Start with the minimum
Read [START_HERE.md](START_HERE.md), choose a profile, then use [the adoption prompt](prompts/ADOPT.md). The operating agent needs the project entry instructions, current task and relevant protocol, not the entire library.

| Responsibility | Entry |
|---|---|
| Founding principles and technical reference policy | [CHARTER](CHARTER.md) |
| Four-contract architecture | [ARCHITECTURE](ARCHITECTURE.md) |
| Canonical rules | [registry/RULES.json](registry/RULES.json) |
| Official references and limits | [sources/REGISTER.json](sources/REGISTER.json) |
| Project adoption | [procedures/ADOPTION.md](procedures/ADOPTION.md) |
| New requests and changes | [procedures/REQUEST_INTAKE.md](procedures/REQUEST_INTAKE.md) |
| Model and host adapters | [adapters/README.md](adapters/README.md) |
| Runnable local tooling | [runtime/README.md](runtime/README.md) |
| Scope of actual verification | [verification/REPORT.md](verification/REPORT.md) |
| Supplementary v4 disposition | [compatibility/V4_RECONCILIATION.md](compatibility/V4_RECONCILIATION.md) |
| Arabic academic guide | [guide/GUIDE_AR.md](guide/GUIDE_AR.md) |

## Run locally
Use Python 3.10+ (standard library only); use `python3` or `py -3` if that is your installed launcher. The delivered environment and actual tested version are recorded in the verification report, not inferred from the compatibility target.

```sh
python tools/check_package.py --root .
python tools/run_tests.py
python runtime/cli.py demo --output ../aghr-demo
python runtime/cli.py init --project ../my-project --name "My Project" --owner "Project Owner"
```

`demo` uses synthetic inputs and the bundled local executor; it does not call any model. `init` creates a new `.aghr` directory without replacing existing project instructions. It does not activate policy or change global configuration. The destination must not already contain `.aghr` and must not be inside this reference package.

## What is and is not implemented
Delivered: canonical rules, four contracts, profiles, procedures, six provider routes, six host routes, templates, schemas, local validators, a bounded file-operation executor, offline scenario grading and tests. The host adapters are researched adaptation procedures, not installed integrations. No native CLI, model endpoint, production system, identity provider or independent review is silently claimed as qualified.

A local policy evaluator is not an operating-system sandbox. A reference that is complete within its stated scope still needs project facts, authority and actual host qualification to become effective in a real project. See [LIMITATIONS](verification/LIMITATIONS.md).
