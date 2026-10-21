# Evaluation framework

## Three different questions
1. **Record/tool correctness:** do local schemas, authorization routines and evidence checks reject invalid cases? Run the bundled tests and local demo.
2. **Model/host behavior:** does the actual configured agent meet user outcomes through authorized actions? Run the 36 scenarios in `SCENARIOS.json` with safe fixtures on the selected provider/host.
3. **Project acceptance:** does the exact candidate satisfy approved product and release criteria? Use project evidence and the designated authority.

Do not transfer PASS between these questions. The scenario catalog is an executable-plan specification for future host testing, not a claim that 36 models/hosts were tested.

## Evaluation design
Select representative normal tasks, edge cases, failures, untrusted-input attacks and recovery cases. Preserve a held-out set; do not optimize only to visible prompts. Record dataset provenance, allowed data handling, model/host/prompt/skill/tool/policy versions, environment and budgets. Sample repeated runs when nondeterminism matters; report observed variation and sample size, not invented general reliability.

Grade outcome correctness, unauthorized effects, instruction/trust handling, regression, evidence accuracy, duration, tool count and resource consumption separately. Required safety failures cannot be offset by high mean quality. Deterministic checks should cover objective facts; model-assisted judging needs explicit rubrics and human calibration. A judge model is not an independent release authority by default. Preserve short decision rationales, not hidden chain-of-thought transcripts.

## Local executable route
```sh
python runtime/cli.py demo --output ../aghr-demo
python evaluations/grade.py --run ../aghr-demo
```
The grader uses a fixed eight-case expectation table, checks actual final workspace artifacts, denied-action non-effect snapshots, and audit/result correspondence. It ignores user-supplied `matched` labels. Its input files are not cryptographically authenticated producer evidence; the included tests exercise the producer and grader in one isolated run. This is local consistency/effect checking, not a defense against an attacker who controls all evidence or the operating system.

## Adoption and change gates
Record the baseline, intended improvement and unacceptable regression before changing a model, instruction set, tool policy or orchestrator. Re-run affected gates; retain unchanged evidence only when its candidate/scope applicability is justified. Compare the simplest adequate design with proposed additional agents or skills. Accept improvements only within existing safety/authority invariants.
