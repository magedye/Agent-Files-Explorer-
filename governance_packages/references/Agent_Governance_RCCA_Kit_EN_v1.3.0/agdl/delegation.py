"""Read-only scope comparison of declared metadata. Not a PEP or identity verifier."""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
from .io import InputError, loads, read_explicit, relative_name
from .schema import check

ROOT = Path(__file__).resolve().parents[1]
RESERVED = {'push', 'merge', 'deploy', 'production_migration', 'permissions_change', 'secret_access', 'external_publish', 'install_global', 'execute_imported'}

def assess(grant: dict, action: dict, request_sha256: str, now: datetime | None = None) -> dict:
    out = {'record_kind': 'DERIVED_NON_AUTHORITATIVE', 'verdict': 'INCONCLUSIVE',
           'reasons': [], 'authorization_authenticated': False,
           'runtime_enforcement_verified': False, 'execution_performed': False}
    for name, value in [('delegation', grant), ('action', action)]:
        errors = check(value, loads(read_explicit(ROOT / f'schemas/{name}.schema.json')))
        out['reasons'].extend(name + ':' + e for e in errors)
    if out['reasons']:
        return out
    if grant['status'] == 'REVOKED':
        out['verdict'] = 'NOT_ELIGIBLE'; out['reasons'].append('grant_revoked'); return out
    if grant['status'] != 'OWNER_RECORDED':
        out['verdict'] = 'OWNER_DECISION_NEEDED'; out['reasons'].append('template_is_not_a_grant'); return out
    if not grant['owner_decision_ref'].strip():
        out['reasons'].append('owner_decision_reference_missing'); return out
    if grant['request_sha256'] != request_sha256 or action['project_id'] != grant['project_id']:
        out['verdict'] = 'NOT_ELIGIBLE'; out['reasons'].append('grant_binding_mismatch'); return out
    if grant['valid_until'] is not None:
        try:
            expiry = datetime.fromisoformat(grant['valid_until'].replace('Z', '+00:00'))
            if expiry.tzinfo is None:
                raise ValueError('timezone_required')
        except ValueError:
            out['reasons'].append('invalid_expiry'); return out
        if expiry <= (now or datetime.now(timezone.utc)):
            out['verdict'] = 'NOT_ELIGIBLE'; out['reasons'].append('grant_expired'); return out
    if action['operation'] in RESERVED:
        out['verdict'] = 'OWNER_DECISION_NEEDED'
        out['reasons'].append('reserved_action_requires_separate_exact_scope_and_runtime_validation')
        return out
    if action['operation'] not in grant['allowed_operations']:
        out['verdict'] = 'OWNER_DECISION_NEEDED'; out['reasons'].append('operation_not_delegated'); return out
    if not action['paths']:
        out['reasons'].append('targets_not_declared'); return out
    try:
        allowed_files = {relative_name(x).casefold() for x in grant['allowed_files']}
        protected_files = {relative_name(x).casefold() for x in grant['protected_files']}
        allowed_prefixes = [relative_name(x.rstrip('/')).casefold() + '/' for x in grant['allowed_prefixes']]
        protected_prefixes = [relative_name(x.rstrip('/')).casefold() + '/' for x in grant['protected_prefixes']]
        for path in action['paths']:
            value = relative_name(path).casefold()
            if value in protected_files or any(value.startswith(x) or value == x[:-1] for x in protected_prefixes):
                out['reasons'].append('protected_target:' + path)
            elif value not in allowed_files and not any(value.startswith(x) for x in allowed_prefixes):
                out['reasons'].append('outside_declared_scope:' + path)
    except InputError as exc:
        out['reasons'].append(str(exc))
    out['verdict'] = 'NOT_ELIGIBLE' if out['reasons'] else 'ELIGIBLE_ONLY_IF_GRANT_AUTHENTIC_AND_RUNTIME_ALLOWS'
    out['note'] = 'This checks declared path strings, not complete command side effects or authenticated owner intent.'
    return out
