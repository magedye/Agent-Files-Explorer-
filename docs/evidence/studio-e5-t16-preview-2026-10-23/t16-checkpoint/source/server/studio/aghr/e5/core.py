"""E5 proposal.1: Python owns parsing/hash/policy; host owns authentication."""
import base64
from dataclasses import replace
import hashlib
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'vendor'))
import rfc8785
from loader import parse_source, read_package
from validate import SchemaChecks, validate_package
from lint import lint_package
from scope import ScopeContext

REVISION = 'e5-proposal.1'
checks = SchemaChecks()

def canonical(value):
    return rfc8785.dumps(value)

def digest(value):
    return 'sha256:' + hashlib.sha256(value).hexdigest()

def schema(name, definition, value):
    validator = checks.validators[name]
    if definition:
        validator = validator.evolve(schema={'$ref': validator.schema['$id'] + '#/$defs/' + definition})
    errors = list(validator.iter_errors(value))
    if errors:
        raise ValueError(json.dumps([{'pointer': '/' + '/'.join(map(str, e.absolute_path)), 'message': e.message} for e in errors[:40]]))

def parse_proposal(payload):
    parsed = parse_source('policies/drafts/proposal.yaml', payload['proposed_yaml'].encode('utf-8'))
    if len(parsed.documents) != 1 or len(parsed.documents[0].members) != 1:
        raise ValueError('ONE_ITEM_REQUIRED')
    member = parsed.documents[0].members[0]
    schema('proposal.schema.json', None, member.value)
    item = member.value
    if item['kind'] != payload['kind'] or (payload.get('target_item_id') and payload['target_item_id'] != item.get('id', item.get('target_item_id'))):
        raise ValueError('WRAPPER_PAYLOAD_MISMATCH')
    return parsed, member

def prepare(payload, base):
    schema('api.change.schema.json', 'Create', payload)
    schema('common.schema.json', 'Hash', base['base_candidate_hash'])
    schema('common.schema.json', 'Text', base['base_package_version'])
    _, member = parse_proposal(payload)
    bound = {k: base[k] for k in ('base_candidate_hash', 'base_package_version')}
    bound.update({k: payload.get(k) for k in ('title', 'kind', 'target_item_id', 'source', 'proposed_yaml')})
    raw = canonical(bound)
    return {'result': 'STRUCTURE_VALID', 'strict_status': 'NOT_RUN', 'hash_qualification': REVISION,
            'proposal_version_hash': digest(raw), 'canonical_base64': base64.b64encode(raw).decode('ascii'),
            'payload': bound, 'item_id': member.value.get('id')}

def overlay(payload, root):
    package = read_package(root)
    parsed, member = parse_proposal(payload)
    if any(m.value['id'] == member.value.get('id') for m in package.items) and not payload.get('target_item_id'):
        raise ValueError('DUPLICATE_ITEM_ID_REQUIRES_EXPLICIT_TARGET')
    items = tuple(m for m in package.items if m.value['id'] != payload.get('target_item_id')) + (member,)
    return replace(package, files=package.files + (parsed,), items=items)

def verify(payload, base, root, approvals=()):
    prepared = prepare(payload, base)
    for approval in approvals:
        approval_binding(prepared['proposal_version_hash'], approval)
    if payload['kind'] in ('calibration', 'PROJECT_SELECTION', 'GENERATED_FILE'):
        return {'result': 'BLOCKED', 'exit_code': 3, 'proposal_version_hash': prepared['proposal_version_hash'],
                'findings': [{'code': 'OPERATIONAL_EVIDENCE_UNAVAILABLE', 'disposition': 'BLOCKED'}], 'validation': None, 'lint': None}
    package = overlay(payload, root)
    validation, _ = validate_package(package, root, ScopeContext())
    lint, _ = lint_package(package, root, ScopeContext())
    return {'result': validation['result'], 'exit_code': validation['exit_code'], 'proposal_version_hash': prepared['proposal_version_hash'],
            'findings': validation['findings'], 'validation': validation, 'lint': lint}

def edit(payload, request):
    schema('api.change.schema.json', 'Edit', request)
    return {**payload, 'proposed_yaml': request['proposed_yaml']}

def approval_binding(proposal_hash, approval):
    # Shape/hash check only: never grants identity, authority or acceptance.
    schema('api.change.schema.json', 'Approval', approval)
    if approval['approved_version_hash'] != proposal_hash:
        raise ValueError('STALE_APPROVAL')
    return True
