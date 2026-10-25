"""Read-only JSONL transport for separately pinned E5 Python extension."""
import json
from pathlib import Path
import sys
engine = Path(sys.argv[1])
sys.path.insert(0, str(engine / 'tools'))
sys.path.insert(0, str(Path(__file__).resolve().parent / 'e5'))
import core

def dispatch(request):
    op = request.get('operation', 'prepare')
    if op == 'prepare':
        return core.prepare(request['payload'], request['base'])
    if op == 'edit':
        return core.prepare(core.edit(request['payload'], request['edit']), request['base'])
    if op == 'validate':
        return {'result': 'CHECKED', 'report': core.verify(request['payload'], request['base'], engine, request.get('approvals', []))}
    if op == 'generate':
        from generation import generate
        core.schema('api.execution.schema.json', 'GeneratePreviewRequest', request['preview'])
        if request['preview']['agent'] != 'codex' or request['preview']['profile'] != 'draft-l1':
            raise ValueError('PREVIEW_PROFILE_UNAVAILABLE')
        result = generate(request['payload'], {'engine_root': str(engine), 'budget_bytes': 32768, 'level': 'L1'})
        core.schema('api.execution.schema.json', 'Generation', result)
        return {'result': 'GENERATED', 'generation': result}
    raise ValueError('OPERATION_UNSUPPORTED')

print(json.dumps({'event': 'ready', 'adapter_revision': 'draft.2'}), flush=True)
while True:
    raw = sys.stdin.buffer.readline(262145)
    if not raw:
        break
    request_id = None
    try:
        if len(raw) > 262144 or not raw.endswith(b'\n'):
            raise ValueError('REQUEST_LIMIT')
        request = json.loads(raw.decode('utf-8'), parse_int=float)
        request_id = request['request_id']
        result = dispatch(request)
    except Exception as error:
        result = {'result': 'REJECTED', 'strict_status': 'NOT_RUN', 'reason': str(error)[:12000]}
    print(json.dumps({'request_id': request_id, 'adapter_revision': 'draft.2', **result}, ensure_ascii=False, separators=(',', ':'), allow_nan=False), flush=True)
