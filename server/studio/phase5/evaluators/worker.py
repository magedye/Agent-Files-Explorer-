"""Actual repository evaluator; no subprocesses, source writes or synthetic success."""
import copy
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path.cwd().resolve()  # E4 runs a pinned byte copy in its trusted repo cwd.
ENGINE = ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate'
sys.path[:0] = [str(ROOT/'server/studio/aghr/e3'), str(ROOT/'server/studio/aghr/e5'), str(ENGINE/'tools')]
from core import schema, prepare
from workflow import generation
from policy import verify
from jsonschema import Draft202012Validator

def digest(b):
    return 'sha256:'+hashlib.sha256(b).hexdigest()

def run(request):
    binding = request['binding']
    if binding['scope'] != ROOT.as_posix()+'/**':
        raise ValueError('PROJECT_SCOPE_MISMATCH')
    source = ENGINE/'policies/observations/reference-state.json'
    item = json.loads(source.read_text(encoding='utf-8'))
    security = ROOT/'server/security.js'
    before, after = security.read_bytes(), security.read_bytes()
    conforms = lambda b: bool(re.search(rb'DEFAULT_PACKAGE_ID\s*=\s*[\'"]aghr_1_2_0[\'"]', b) and re.search(rb'AGHR_ROOT\s*=\s*AGHR_1_2_0_ROOT', b))
    if 'item' in request:
        if request['item'] != item:
            raise ValueError('MEASUREMENT_PLAN_REQUIRED_FOR_ITEM')
        return {'binding':binding,'valid':before==after and conforms(after),'before_metric':int(conforms(before)), 'after_metric':int(conforms(after)),
                'repo_hash':digest(after),'measurement':'two actual reads of current source; delta zero is not an improvement claim',
                'sources':[{'path':'server/security.js','sha256':digest(after)},{'path':source.relative_to(ROOT).as_posix(),'sha256':digest(source.read_bytes())}]}
    files = request['change']['files']
    if not files:
        raise ValueError('META_FILES_REQUIRED')
    evidence=[]
    for f in files:
        name=f['path']
        if not re.fullmatch(r'schemas/[\w-]+\.schema\.json',name) or (ENGINE/name).exists():
            raise ValueError('META_EVALUATOR_SCOPE_UNSUPPORTED: only additive schemas; closed contracts and tools require another qualified evaluator')
        candidate=json.loads(f['content']);Draft202012Validator.check_schema(candidate)
        cases=candidate.get('x-aghr-examples')
        if not isinstance(cases,dict) or not cases.get('valid') or not cases.get('invalid'):
            raise ValueError('EXPLICIT_SCHEMA_EXAMPLES_REQUIRED')
        validator=Draft202012Validator(candidate)
        if not all(validator.is_valid(x) for x in cases['valid']) or any(validator.is_valid(x) for x in cases['invalid']):
            raise ValueError('PROPOSED_SCHEMA_EXAMPLES_FAILED')
        evidence.append({'path':name,'sha256':digest(f['content'].encode('utf-8')),'valid_examples':len(cases['valid']),'invalid_examples':len(cases['invalid'])})
    payload={'title':item['title'],'kind':item['kind'],'target_item_id':item['id'],'proposed_yaml':json.dumps(item,ensure_ascii=False),'source':{'type':'request','ref':'phase5-project-evaluator'}}
    base={'base_package_version':'1.3.0-rc.3-core-candidate','base_candidate_hash':digest((ENGINE/'aghr.json').read_bytes())}
    # Standalone generation probe binds the actual manifest bytes; the enclosing
    # CP still uses the catalog read-set hash, checked by the unchanged bridge.
    manifest=json.loads((ENGINE/'aghr.json').read_text(encoding='utf-8'))
    base['base_package_version']=manifest['version']
    prepared=prepare(payload,base)
    broken=copy.deepcopy(item);broken['force']='MUST';broken['authority']={'owner':'project-evaluator'}
    bad={**payload,'proposed_yaml':json.dumps(broken)}
    rejected=False;negative_diagnostics=[]
    try:
        result=verify(bad,base,ENGINE,[])
        negative_diagnostics=result.get('findings',[])
        rejected=result.get('result')=='INVALID' and any('/authority' in str(f) and 'level' in str(f) for f in negative_diagnostics)
    except ValueError as error:
        negative_diagnostics=json.loads(str(error))
        rejected=any(d.get('pointer')=='/authority' and "'level'" in d.get('message','') for d in negative_diagnostics)
    if not rejected:
        raise ValueError('AUTHORITY_NEGATIVE_CONTROL_FAILED')
    bad_scope=copy.deepcopy(item);del bad_scope['scope']
    try:
        schema('item.schema.json',None,bad_scope)
    except ValueError as error:
        scope_diagnostics=json.loads(str(error))
        if not any("'scope'" in d.get('message','') for d in scope_diagnostics):
            raise ValueError('WRONG_SCOPE_NEGATIVE_DIAGNOSTIC')
    else:
        raise ValueError('SCOPE_NEGATIVE_CONTROL_FAILED')
    generated=generation(payload,base,ENGINE,{'agent':'codex','profile':'draft-l1','dry_run':True})
    if generated['stage']=='fail' or not generated['prin_007_present'] or not generated['p0_preserved']:
        raise ValueError('REAL_GENERATION_CHECK_FAILED')
    return {'binding':binding,'valid':True,'generation_check':'PASS','behavioral_evals':[{'id':i,'status':'PASS'} for i in ['schema-examples','authority-negative','scope-negative']],
            'sources':evidence+[{'path':source.relative_to(ROOT).as_posix(),'sha256':digest(source.read_bytes())}],
            'generation':generated,'negative_controls':{'authority':negative_diagnostics,'scope':scope_diagnostics},'proposal_hash':prepared['proposal_version_hash'],'scope':'additive schemas only; no contract replacement or tool execution'}

if __name__=='__main__':
    try:
        result=run(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')))
        print(json.dumps(result,ensure_ascii=False))
    except Exception as error:
        print(json.dumps({'valid':False,'reason':str(error)},ensure_ascii=False))
        sys.exit(1)
