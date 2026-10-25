"""Single native initialize diagnosis, inside T15. No credentials are read."""
import hashlib
import json
from pathlib import Path
import queue
import re
import subprocess
import sys
import threading
config=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
state=Path(config['state'])
argv=[config['binary'],'--config','sqlite_home='+json.dumps((state/'sqlite').as_posix()),'--config','log_dir='+json.dumps((state/'logs').as_posix()),'--config','history.persistence="none"','app-server','--stdio']
child=subprocess.Popen(argv,cwd=config['cwd'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,creationflags=subprocess.CREATE_NO_WINDOW)
messages=queue.Queue();diagnostics=bytearray()
def read_out():
    for line in child.stdout:
        if len(line)>1024*1024:
            messages.put({'diagnostic':'FRAME_LIMIT'});break
        try:messages.put(json.loads(line))
        except ValueError:messages.put({'diagnostic':'INVALID_JSON'})
def read_err():
    for line in child.stderr:
        if len(diagnostics)<16384:diagnostics.extend(line[:16384-len(diagnostics)])
threading.Thread(target=read_out,daemon=True).start();threading.Thread(target=read_err,daemon=True).start()
try:
    request={'id':1,'method':'initialize','params':{'clientInfo':{'name':'aghr_phase3_probe','title':'AGHR','version':'0.1.0'}}}
    child.stdin.write((json.dumps(request)+'\n').encode('utf-8'));child.stdin.flush()
    result=None
    try:
        while True:
            frame=messages.get(timeout=20)
            if frame.get('id')==1:result=frame;break
    except queue.Empty:pass
    if result and 'result' in result:
        child.stdin.write(b'{"method":"initialized","params":{}}\n');child.stdin.flush()
    safe=[]
    for line in diagnostics.decode('utf-8',errors='replace').splitlines():
        if re.search(r'(?i)token|authorization|api.?key|password|secret|bearer|cookie',line):safe.append('[credential-related diagnostic redacted]')
        else:safe.append(line[:500])
    print(json.dumps({'initialized':bool(result and 'result' in result),'initialize_response':result,'stderr_sha256':hashlib.sha256(diagnostics).hexdigest(),'diagnostics_redacted':safe,'result':'INITIALIZED' if result and 'result' in result else 'ENVIRONMENT_BLOCKED','qualification':'NOT_RUN'},ensure_ascii=False),flush=True)
finally:
    child.terminate()
    try:child.wait(timeout=3)
    except subprocess.TimeoutExpired:child.kill()
