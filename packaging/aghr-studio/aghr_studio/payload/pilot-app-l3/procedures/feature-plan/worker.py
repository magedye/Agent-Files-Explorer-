import ast,hashlib,json,sys
from pathlib import Path
source=(Path.cwd()/'pilot-app-l3/app/service.py').read_bytes()
request=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
proposal="def stock_summary(database):\n    return totals(database)\n"
tree=ast.parse(proposal)
print(json.dumps({'valid':isinstance(tree.body[0],ast.FunctionDef),'feature':request['feature'],'source_hash':hashlib.sha256(source).hexdigest(),'proposal':proposal,'applied':False}))
