"""CLI protocol 3 extension, proposal stdin only; not a replacement E2 CLI."""
import hashlib
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[4]
engine = root / 'governance_packages/candidates/AGHR_rc3_Core_Candidate'

def run():
    command = sys.argv[1] if len(sys.argv) > 1 else ''
    report = {'protocol_version': '3', 'command': command, 'result': 'ERROR', 'exit_code': 2,
              'source': None, 'inputs': {}, 'checks': {'status': 'NOT_RUN'}, 'diagnostics': [], 'data': None}
    try:
        lock_bytes = (Path(__file__).parent / 'EXTENSION.lock.json').read_bytes()
        lock = json.loads(lock_bytes)
        for name, expected in lock['files'].items():
            if hashlib.sha256((root / name).read_bytes()).hexdigest() != expected:
                raise ValueError('EXTENSION_SOURCE_DRIFT')
        parent = json.loads((root / 'docs/evidence/studio-e2-2026-10-22/SOURCE_PIN.json').read_bytes())
        if parent['source_hash'] != lock['parent_e2']:
            raise ValueError('PARENT_PIN_MISMATCH')
        for name, expected in parent['files'].items():
            if hashlib.sha256((engine / name).read_bytes()).hexdigest() != expected:
                raise ValueError('PARENT_ENGINE_DRIFT')
        report['source'] = {'implementation_id': 'aghr-e5-proposal-extension', 'revision': '1',
                            'content_hash': hashlib.sha256(lock_bytes).hexdigest(), 'parent_e2': lock['parent_e2'],
                            'publisher_authentication': 'UNKNOWN'}
        if sys.argv[1:] not in (['change-hash'], ['validate', '--strict'], ['lint']):
            raise ValueError('UNSUPPORTED_COMMAND')
        sys.path.insert(0, str(engine / 'tools'))
        sys.path.insert(0, str(Path(__file__).parent))
        import core
        raw = sys.stdin.buffer.read(65537)
        if len(raw) > 65536:
            raise ValueError('REQUEST_LIMIT')
        request = json.loads(raw.decode('utf-8'), parse_int=float)
        if command == 'change-hash':
            data = core.prepare(request['payload'], request['base'])
            report.update(result='READ', exit_code=0, data=data)
        else:
            data = core.verify(request['payload'], request['base'], engine)
            report.update(result=data['result'], exit_code=data['exit_code'], data=data,
                          checks={'status': 'COMPLETE' if data['result'] == 'VALID' else data['result']})
    except Exception as error:
        report['diagnostics'].append({'code': 'PROPOSAL_REJECTED', 'message': str(error)[:12000]})
        if report['source'] is not None:
            report.update(result='INVALID', exit_code=1)
    print(json.dumps(report, ensure_ascii=False, allow_nan=False, separators=(',', ':')))
    return report['exit_code']

if __name__ == '__main__':
    raise SystemExit(run())
