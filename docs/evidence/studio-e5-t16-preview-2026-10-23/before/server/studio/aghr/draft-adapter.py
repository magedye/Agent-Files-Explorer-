"""Host draft preparation only. Reuse pinned E2 parsing/schema; no E5 claim."""
import hashlib
import json
import sys
from pathlib import Path

engine = Path(sys.argv[1])
sys.path.insert(0, str(engine / 'tools'))
from loader import parse_source
from validate import SchemaChecks

checks = SchemaChecks()


def prepare(request):
    payload, base = request['payload'], request['base']
    wrapper = checks.validators['api.change.schema.json'].evolve(schema={
        '$ref': 'https://aghr.invalid/contracts/rc3/api.change.schema.json#/$defs/Create'})
    issues = [{'code': 'REQUEST_SCHEMA', 'pointer': '/' + '/'.join(map(str, e.absolute_path)),
               'message': e.message} for e in wrapper.iter_errors(payload)]
    if issues:
        raise ValueError(json.dumps(issues[:40]))
    # This first slice handles the thirteen governance kinds. Operational CP
    # payloads and calibration numeric metadata await E5 and the full editor.
    if payload['kind'] in ('calibration', 'PROJECT_SELECTION', 'GENERATED_FILE') or payload.get('source', {}).get('type') == 'calibration':
        raise ValueError('OPERATIONAL_CP_REQUIRES_E5')
    parsed = parse_source('draft.yaml', payload['proposed_yaml'].encode('utf-8'))
    if len(parsed.documents) != 1 or len(parsed.documents[0].members) != 1:
        raise ValueError('ONE_ITEM_REQUIRED')
    member = parsed.documents[0].members[0]
    issues = checks.errors('item.schema.json', member)
    if issues:
        raise ValueError(json.dumps(issues[:40]))
    item = member.value
    if item['kind'] != payload['kind'] or payload.get('target_item_id', item['id']) != item['id']:
        raise ValueError('WRAPPER_PAYLOAD_MISMATCH')
    bound = {**base, 'title': payload['title'], 'kind': payload['kind'],
             'target_item_id': payload.get('target_item_id'), 'source': payload.get('source'),
             'proposed_yaml': payload['proposed_yaml']}
    # JCS equivalent on this restricted seven-field domain: ASCII field names,
    # string/null values and a source object containing only string values.
    if bound['source'] and any(not isinstance(v, str) for v in bound['source'].values()):
        raise ValueError('SOURCE_VALUE_PROFILE_UNSUPPORTED')
    canonical = json.dumps(bound, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode('utf-8')
    result = {'adapter_revision': 'draft.1', 'engine_protocol_version': '3',
              'result': 'STRUCTURE_VALID', 'strict_status': 'NOT_RUN',
              'hash_qualification': 'LOCAL_ADAPTER_NOT_E5',
              'proposal_version_hash': 'sha256:' + hashlib.sha256(canonical).hexdigest(),
              'canonical_base64': __import__('base64').b64encode(canonical).decode('ascii'),
              'payload': bound, 'item_id': item['id']}
    return result


print(json.dumps({'event': 'ready', 'adapter_revision': 'draft.1'}), flush=True)
while True:
    raw = sys.stdin.buffer.readline(262145)
    if not raw:
        break
    request_id = None
    try:
        if len(raw) > 262144 or not raw.endswith(b'\n'):
            raise ValueError('REQUEST_LIMIT')
        request = json.loads(raw.decode('utf-8'))
        request_id = request['request_id']
        result = prepare(request)
    except Exception as error:
        result = {'adapter_revision': 'draft.1', 'result': 'REJECTED', 'strict_status': 'NOT_RUN',
                  'reason': str(error)[:12000]}
    print(json.dumps({'request_id': request_id, **result}, ensure_ascii=False, separators=(',', ':')), flush=True)
