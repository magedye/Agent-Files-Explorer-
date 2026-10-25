from pathlib import Path
import json,threading,urllib.request
from app.server import create_server
from app.repository import query
root=Path(__file__).resolve().parent
database=root/'data/inventory.sqlite'
server=create_server(database);thread=threading.Thread(target=server.serve_forever);thread.start()
try:
    origin='http://127.0.0.1:'+str(server.server_address[1])
    def get(path):return json.load(urllib.request.urlopen(origin+path,timeout=5))
    assert get('/health')['project']=='pilot-app-l3'
    assert len(get('/inventory')['rows'])==3
    assert get('/totals')['units']==23
    assert get('/totals')['value']==376
    denied=0
    for sql in ['DELETE FROM inventory','DROP TABLE inventory','SELECT * FROM inventory; DROP TABLE inventory','SELECT load_extension(\'x\')','PRAGMA journal_mode=WAL']:
        try:query(database,sql)
        except PermissionError:denied+=1
        else:raise AssertionError('Unsafe SQL accepted')
    assert denied==5
    print(json.dumps({'status':'PASS','http_requests':4,'negative_sql_checks':denied,'rows':3,'units':23,'inventory_value':376}))
finally:server.shutdown();thread.join();server.server_close()
