import hashlib,json,sys
from pathlib import Path
request=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
failure=request['failure']
assert failure['exit_code']!=0 and failure['stdout']
source=(Path.cwd()/'pilot-app-l3/procedures/learning/SKILL.md').read_bytes()
print(json.dumps({'valid':True,'disposition':'PROPOSE_CP_ONLY','cause':'UNPROVEN','policy_written':False,'failure_hash':hashlib.sha256(json.dumps(failure,sort_keys=True).encode()).hexdigest(),'instruction_hash':hashlib.sha256(source).hexdigest(),'lesson':'Check declared row acceptance criteria against measured sandbox data.'}))
