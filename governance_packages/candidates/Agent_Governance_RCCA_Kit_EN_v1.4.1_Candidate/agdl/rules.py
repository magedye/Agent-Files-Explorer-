"""Rule metadata linting; impact and normative force cannot manufacture authority."""
from .io import loads, read_explicit
from .schema import check
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def lint(catalog):
    issues = check(catalog, loads(read_explicit(ROOT / 'schemas/rules.schema.json')))
    if issues:
        return issues
    seen = set()
    for rule in catalog['rules']:
        rid = rule['id']
        if rid in seen:
            issues.append('duplicate_rule:' + rid)
        seen.add(rid)
        if rule['impact'] == 'CRITICAL' and not rule['failure_behavior'].strip():
            issues.append('critical_rule_failure_behavior_missing:' + rid)
        if rule['enforcement'] == 'RUNTIME_ENFORCED':
            issues.append('unsupported_runtime_enforcement_claim:' + rid)
    return sorted(set(issues))
