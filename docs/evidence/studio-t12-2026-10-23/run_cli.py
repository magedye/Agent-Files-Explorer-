"""Real unchanged protocol-3 CLI, scoped processes and raw evidence capture."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone
from collections import Counter
import copy,hashlib,json,os,subprocess,time
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
CANDIDATE=ROOT/'governance_packages/candidates/AGHR_T12_Candidate'
PYTHON=ROOT/'temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'
CLI=ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools/cli.py'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def snapshot(root):return {p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file()}
def utc():return datetime.now(timezone.utc).isoformat()
if (OUT/'RUN_RESULTS.json').exists():raise FileExistsError('Preserve all real execution records')
manifest=(CANDIDATE/'aghr.json').read_bytes();fixtures=load(CANDIDATE/'drafting/eval-fixtures.json')
owner=(CANDIDATE/'drafting/OWNER_DIRECTIVE.json').read_bytes()
def make_case(name,rid,remove=None):
    root=OUT/'cases'/name;assert not root.exists();(root/'policies/drafts').mkdir(parents=True)
    (root/'aghr.json').write_bytes(manifest)
    value=load(CANDIDATE/f'policies/drafts/{rid}.json')
    if remove=='level':del value['authority']['level']
    if remove=='scope':del value['scope']
    write(root/f'policies/drafts/{rid}.json',value)
    write(root/'drafting/eval-fixtures.json',{rid:fixtures[rid]})
    (root/'drafting/OWNER_DIRECTIVE.json').write_bytes(owner)
    return root
jobs=[]
for i in range(1,48):
    rid=f'AGHR-{i:03}';jobs.append((rid,make_case(rid,rid),['validate','--strict']))
jobs += [('negative-missing-level',make_case('negative-missing-level','AGHR-001','level'),['validate','--strict']),
         ('negative-missing-scope',make_case('negative-missing-scope','AGHR-001','scope'),['validate','--strict'])]
jobs += [(name,CANDIDATE,args) for name,args in [('package-strict',['validate','--strict']),('package-validate',['validate']),('package-lint',['lint'])]]
candidate_before=snapshot(CANDIDATE)
write(OUT/'CANDIDATE_BEFORE_CLI.json',candidate_before)
def execute(job):
    name,cwd,args=job;start=utc();clock=time.perf_counter();before=snapshot(cwd)
    command=[str(PYTHON),'-X','utf8','-B',str(CLI),*args,'--format','json']
    env=dict(os.environ);env.pop('PYTHONPATH',None);env['PYTHONDONTWRITEBYTECODE']='1';env['PYTHONIOENCODING']='utf-8'
    completed=subprocess.run(command,cwd=cwd,env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=60,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
    result=load_bytes= json.loads(completed.stdout.decode('utf-8'))
    assert result['protocol_version']=='3' and result['exit_code']==completed.returncode
    assert before==snapshot(cwd),'CLI wrote to its input package: '+name
    run=OUT/'runs'/name;run.mkdir(parents=True)
    (run/'stdout.json').write_bytes(completed.stdout);(run/'stderr.txt').write_bytes(completed.stderr)
    v=result['data']['validation'];items=v['items']
    record={'name':name,'started_at':start,'finished_at':utc(),'wall_seconds':time.perf_counter()-clock,
     'executable':str(PYTHON),'argv':command[1:],'cwd':cwd.relative_to(ROOT).as_posix(),'process_exit_code':completed.returncode,
     'protocol_version':result['protocol_version'],'result':result['result'],'structure':v['stages']['structure']['status'],
     'diagnostics':dict(Counter(d['code'] for d in result['diagnostics'])),'item_ids':[d['id'] for d in items],
     'source_hash':result['source']['content_hash'],'inputs':result['inputs'],'input_before':before,'input_after_unchanged':True,
     'stdout_sha256':hashlib.sha256(completed.stdout).hexdigest(),'stderr_sha256':hashlib.sha256(completed.stderr).hexdigest()}
    write(run/'execution.json',record)
    return record
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(execute,jobs))
assert snapshot(CANDIDATE)==candidate_before
write(OUT/'CANDIDATE_AFTER_CLI.json',snapshot(CANDIDATE))
per_rule=results[:47]
assert all(r['structure']=='PASS' for r in per_rule),[(r['name'],r['diagnostics']) for r in per_rule if r['structure']!='PASS']
assert all(r['process_exit_code']==1 and r['result']=='INVALID' for r in results[47:49])
write(OUT/'RUN_RESULTS.json',{'status':'REAL_NATIVE_CLI_COMPLETE','engine_modified':False,'protocol_version':'3','rules':47,
 'per_rule':{'strict_exit_0':sum(r['process_exit_code']==0 for r in per_rule),'strict_blocked':sum(r['process_exit_code']==3 for r in per_rule),
 'strict_invalid':sum(r['process_exit_code']==1 for r in per_rule),'structural_pass':sum(r['structure']=='PASS' for r in per_rule)},
 'runs':results,'qualification':'NOT_RUN','E4':'7 REQUIRED / NOT_RUN / NOT_WAIVED','app_writes':0})
print(json.dumps({'rules':47,'strict_results':dict(Counter(r['process_exit_code'] for r in per_rule)),
 'package_commands':[{k:r[k] for k in ['name','process_exit_code','result','structure','diagnostics']} for r in results[-3:]],
 'negative_controls':[r['process_exit_code'] for r in results[47:49]],'source_writes':0},ensure_ascii=False))
