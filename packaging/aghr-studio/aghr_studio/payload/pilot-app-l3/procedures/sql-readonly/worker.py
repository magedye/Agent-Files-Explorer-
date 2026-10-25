"""Actual project-specific safety procedure, run under E4's read-only launcher."""
import hashlib,json,sys
from pathlib import Path
root=Path.cwd()/'pilot-app-l3'
sys.path.insert(0,str(root))
from app.repository import query
request=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
if request.get('negative_control')=='empty':raise SystemExit(0)
database=root/'data/inventory.sqlite'
before=hashlib.sha256(database.read_bytes()).hexdigest()
rows=query(database,'SELECT sku,quantity FROM inventory ORDER BY sku')
denied=[]
for sql in ['DELETE FROM inventory','DROP TABLE inventory','SELECT * FROM inventory; DROP TABLE inventory','SELECT load_extension(\'x\')','PRAGMA journal_mode=WAL']:
    try:query(database,sql)
    except PermissionError as error:denied.append({'sql':sql,'reason':str(error)})
after=hashlib.sha256(database.read_bytes()).hexdigest()
source={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in ['app/security.py','app/repository.py','data/inventory.sqlite']}
controls={}
try:(root/'data/forbidden-agent-write.txt').write_text('Must be denied',encoding='utf-8')
except PermissionError:controls['filesystem_write']='DENIED'
import socket,subprocess
try:socket.socket().connect(('127.0.0.1',9))
except PermissionError:controls['network']='DENIED'
try:subprocess.run([sys.executable,'--version'],capture_output=True)
except PermissionError:controls['subprocess']='DENIED'
valid=len(rows)==3 and len(denied)==5 and before==after and request.get('expected_rows',3)==len(rows) and len(controls)==3
print(json.dumps({'valid':valid,'project':'pilot-app-l3','rows':len(rows),'denied':len(denied),'unchanged':before==after,'source':source,'cases':denied,'sandbox':controls,'binding':request.get('binding')}))
raise SystemExit(0 if valid else 1)
