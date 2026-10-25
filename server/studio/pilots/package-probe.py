"""Read-only host probe composing unchanged E2/E3; no runtime claim is minted here.

The `grants` member is a trusted backend transport, like E3 policy.verify's
attestations parameter. This script is not a public CLI permission boundary.
The Node pilot host owns authorization and actual E4 observations.
"""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
ENGINE=ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate'
sys.path.insert(0,str(ENGINE/'tools'))
sys.path.insert(0,str(ROOT/'server/studio/aghr/e5'))
sys.path.insert(0,str(ROOT/'server/studio/aghr/e3'))
from loader import read_package
from authority import SourceGrant
from scope import ScopeContext
from lint import lint_package
from doctor import doctor
from render import render,required_principle
from core import canonical,digest

request=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
project=ROOT/request['project']
if project.name not in ('pilot-app-l2','pilot-app-l3') or project.parent!=ROOT:
    raise ValueError('SANDBOX_ROOT_REQUIRED')
if request.get('operation')=='principle':
    print(json.dumps(required_principle(ENGINE),ensure_ascii=False));raise SystemExit(0)
root=project/'.aghr/candidate'
package=read_package(root)
grants=[]
for value in request.get('grants',[]):
    if value['level']!='project' or value['owner']!='Sandbox Project Owner':raise ValueError('PROJECT_GRANT_REQUIRED')
    grants.append(SourceGrant(**{**value,'item_ids':tuple(value['item_ids']),'advanced_kinds':tuple(value.get('advanced_kinds',()))}))
context=ScopeContext(path=project.name+('/app.mjs' if project.name=='pilot-app-l2' else '/app/security.py'),skill_id=None if project.name=='pilot-app-l2' else 'pilot-sql-readonly',agent='aghr-local-process',host_version=request['host_version'])
validation,_=lint_package(package,root,context,grants=tuple(grants))
items=[m.value for m in package.items]
if request.get('operation')=='prepare':
    from core import prepare
    print(json.dumps(prepare(request['payload'],request['base']),ensure_ascii=False));raise SystemExit(0)
if request.get('operation')=='approval':
    from core import approval_binding
    approval_binding(request['proposal_hash'],request['approval'])
    print(json.dumps({'ready':True,'next_status':'approved','acknowledgements':[]}));raise SystemExit(0)
if request.get('operation')=='render':
    result=render(items,{'engine_root':ENGINE,'level':request['level'],'budget_bytes':request.get('budget_bytes',32768),'proposal_version_hash':digest(canonical(items)),**request.get('lookup',{})})
    print(json.dumps(result,ensure_ascii=False));raise SystemExit(0)
if request.get('operation')=='hash':
    print(json.dumps({'hash':digest(canonical(request['value']))}));raise SystemExit(0)
result={'protocol_version':'3','command':request.get('command','validate'),'source':{'content_hash':'037fe1426f36765a8c237a04cc7fb62295b15f8e150561c2e7fd8372fde441a3'},'profile':'TRUSTED_SANDBOX_HOST_API','validation':validation,'doctor':doctor(items,digest(canonical(items))),'items':items}
print(json.dumps(result,ensure_ascii=False))
raise SystemExit(validation['exit_code'])
