"""Trusted native transport, always launched inside the T15 Windows Job.

No input may select arbitrary commands or import execution evidence. Child
processes inherit the Job, its deadline, memory and process-tree cleanup.
"""
import json
from pathlib import Path
import queue
import subprocess
import sys
import threading

def emit(value):
    print(json.dumps(value, ensure_ascii=False, separators=(',', ':')), flush=True)

config = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
binary, cwd = config['binary'], config['cwd']
operation, host = config['operation'], config['host']
if operation in ('version', 'help'):
    child = subprocess.run([binary, '--version' if operation == 'version' else '--help'], cwd=cwd, capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
    sys.stdout.buffer.write(child.stdout)
    sys.stderr.buffer.write(child.stderr)
    sys.exit(child.returncode)
if host == 'codex':
    state = Path(config['state_directory'])
    overrides = ['sqlite_home=' + json.dumps((state / 'sqlite').as_posix()), 'log_dir=' + json.dumps((state / 'logs').as_posix()), 'history.persistence="none"', 'analytics.enabled=false']
    command = [binary]
    for override in overrides:
        command.extend(['--config', override])
    command.extend(['app-server', '--listen', 'stdio://'])
    child = subprocess.Popen(command, cwd=cwd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=subprocess.CREATE_NO_WINDOW)
    incoming = queue.Queue()
    def reader():
        for line in child.stdout:
            if len(line) > 1024 * 1024:
                incoming.put(RuntimeError('NATIVE_FRAME_LIMIT'))
                return
            try:
                incoming.put(json.loads(line))
            except ValueError:
                incoming.put(RuntimeError('NATIVE_PROTOCOL_INVALID'))
        incoming.put(RuntimeError('NATIVE_CHANNEL_CLOSED'))
    threading.Thread(target=reader, daemon=True).start()
    # Avoid leaking diagnostics containing host account/configuration data.
    threading.Thread(target=lambda: [None for _ in child.stderr], daemon=True).start()
    def send(method, params, identifier=None):
        frame = {'method': method, 'params': params}
        if identifier is not None:
            frame['id'] = identifier
        child.stdin.write((json.dumps(frame) + '\n').encode('utf-8'))
        child.stdin.flush()
    def receive(identifier):
        while True:
            frame = incoming.get(timeout=25)
            if isinstance(frame, Exception):
                raise frame
            if frame.get('id') == identifier:
                if 'error' in frame:
                    raise RuntimeError('NATIVE_RPC_ERROR ' + str(frame['error'].get('code')))
                return frame['result']
            if 'method' in frame and 'id' in frame:
                # Never grant native tool approval automatically.
                child.stdin.write((json.dumps({'id': frame['id'], 'error': {'code': -32000, 'message': 'AGHR native tool approval not granted'}}) + '\n').encode('utf-8'))
                child.stdin.flush()
            elif 'method' in frame:
                emit({'kind': 'notification', 'frame': frame})
    try:
        send('initialize', {'clientInfo': {'name': 'aghr_governance_studio', 'title': 'AGHR', 'version': '0.1.0'}}, 1)
        emit({'kind': 'initialized', 'result': receive(1)})
        send('initialized', {})
        send('skills/list', {'cwds': [cwd], 'forceReload': True}, 2)
        emit({'kind': 'discovery', 'result': receive(2)})
        if operation == 'execute':
            send('thread/start', {'cwd': cwd, 'ephemeral': True, 'approvalPolicy': 'never', 'sandbox': 'read-only'}, 3)
            thread = receive(3)['thread']['id']
            emit({'kind': 'thread', 'id': thread})
            send('turn/start', {'threadId': thread, 'input': [{'type': 'text', 'text': config['prompt']}, {'type': 'skill', 'name': config['skill_name'], 'path': config['skill_path']}]}, 4)
            emit({'kind': 'turn', 'result': receive(4)})
            while True:
                frame = incoming.get(timeout=25)
                if isinstance(frame, Exception):
                    raise frame
                if 'id' in frame and 'method' in frame:
                    raise RuntimeError('NATIVE_APPROVAL_REQUIRED')
                emit({'kind': 'notification', 'frame': frame})
                if frame.get('method') == 'turn/completed':
                    status = frame.get('params', {}).get('turn', {}).get('status')
                    sys.exit(0 if status == 'completed' else 1)
    finally:
        child.terminate()
        child.wait(timeout=5)
elif host == 'antigravity' and operation == 'execute':
    # Official agy headless CLI, never the Electron IDE/language_server binary.
    child = subprocess.Popen([binary, '-p', config['prompt'], '--output-format', 'stream-json', '--permission-mode', 'request-review'], cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=subprocess.CREATE_NO_WINDOW)
    threading.Thread(target=lambda: [None for _ in child.stderr], daemon=True).start()
    for line in child.stdout:
        if len(line) > 1024 * 1024:
            raise RuntimeError('NATIVE_FRAME_LIMIT')
        emit({'kind': 'native', 'frame': json.loads(line)})
    sys.exit(child.wait())
else:
    raise RuntimeError('NATIVE_CHANNEL_UNAVAILABLE')
