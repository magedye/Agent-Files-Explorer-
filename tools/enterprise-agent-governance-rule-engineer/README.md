# Enterprise Agent Governance Rule Engineer Tooling (Candidate Packet 2A)

**Status:** `QUALIFIED_OPTIONAL_TOOL / NOT_MANDATORY_GATE`  
**License:** Permissive MIT / Internal Reference  
**Language:** Python 3.8+ (Zero external dependencies; 100% standard library)

## Purpose & Scope
This directory contains offline heuristic preflight tools for authors drafting governance rules in Markdown or YAML.
It is an **optional developer assistance tool**. It is **NOT** a mandatory pre-commit hook, CI gate, or runtime PEP/PDP interceptor.

## Tools Included:
1. `scripts/lint_rule.py`: Scans text or files for ambiguous terminology, absolute claims, and unverified status assertions.
2. `scripts/validate_skill.py`: Checks skill package file structures and encoding.
3. `tests/test_skill.py`: Standalone offline unit tests.

## Running Tests:
```bash
py -m unittest discover -s tools/enterprise-agent-governance-rule-engineer/tests
```

## Running the Linter:
```bash
py tools/enterprise-agent-governance-rule-engineer/scripts/lint_rule.py --text "Rule text here" --format text
```
