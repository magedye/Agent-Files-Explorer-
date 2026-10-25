"""Read-only E4 protocol-3 extension. Host material is not public CLI input."""
import hashlib
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path[:0] = [str(HERE.parent), str(HERE.parent / 'e5'), str(ROOT / 'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools')]


def run(request):
    op, data = request['operation'], request['data']
    if op == 'evidence':
        from e4.evidence import load_events
        return load_events(data['root'], data['path'], data['task_id'], data['session'])
    if op == 'discover':
        from e4.discovery import discover
        return discover(data, request['host']['capture'], request['host']['permissions'])
    if op == 'transition':
        from e4.lifecycle import transition
        return transition(data, request['host'])
    if op == 'eval':
        from e4.eval import evaluate
        return evaluate(data, request['host']['runs'])
    if op == 'qualify':
        from e4.qualify import qualify
        return qualify(data, request['host']['runs'])
    if op == 'qualification':
        from e4.qualify import check
        return check(data, request['host'].get('known'))
    raise ValueError('E4_OPERATION_UNAVAILABLE')


def main():
    report = {'protocol_version': '3', 'command': 'check', 'result': 'INVALID', 'exit_code': 1,
              'source': None, 'data': None, 'diagnostics': []}
    try:
        lock = (HERE / 'SOURCE.lock.json').read_bytes()
        pin = json.loads(lock)
        for name, expected in pin['files'].items():
            if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != expected:
                raise ValueError('E4_SOURCE_DRIFT')
        report['source'] = {'implementation_id': 'aghr-e4-native-core', 'revision': pin['revision'],
                            'content_hash': hashlib.sha256(lock).hexdigest(), 'publisher_authentication': 'UNKNOWN'}
        raw = Path(sys.argv[1]).read_bytes()
        if len(raw) > 1024 * 1024:
            raise ValueError('E4_INPUT_LIMIT')
        from e4.evidence import strict_json
        request = strict_json(raw)
        report['command'] = request['command']
        data = run(request)
        result = data.get('result', 'READ')
        code = {'READ': 0, 'VALID': 0, 'INVALID': 1, 'BLOCKED': 3}[result]
        report.update(result=result, exit_code=code, data=data)
    except Exception as error:
        report['diagnostics'] = [{'code': 'E4_REJECTED', 'message': str(error)[:4000]}]
    print(json.dumps(report, ensure_ascii=False, allow_nan=False, separators=(',', ':')))
    return report['exit_code']


if __name__ == '__main__':
    raise SystemExit(main())
