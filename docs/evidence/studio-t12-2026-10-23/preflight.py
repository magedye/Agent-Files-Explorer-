"""Pin accepted custody before authorized drafting; never mutate a prior receipt."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib,json,subprocess
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def digest(p):return {'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
def save(n,v):(OUT/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if (OUT/'PREFLIGHT.json').exists():raise FileExistsError('Preserve the original preflight')
lockpath=ROOT/'docs/evidence/studio-t11b-2026-10-23/CUSTODY.lock.json';lock=load(lockpath)
drift=[p for p,pin in lock['files'].items() if digest(ROOT/p)!=pin];assert not drift,drift
before={}
for name in ['docs/INDEX.md','docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md']:
    p=ROOT/name;q=OUT/'before'/f'{name}.raw';q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(p.read_bytes());before[name]=digest(p)
candidate=ROOT/'governance_packages/candidates/AGHR_T12_Candidate';assert not candidate.exists(),'Existing candidate must not be overwritten'
inputs=['docs/reviews/aghr-items-2026-10-22/REVIEW_REGISTER.json','governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/registry/RULES.json','governance_packages/candidates/AGHR_Candidate_1.3.0/registry/RULES.json','docs/evidence/studio-e2-2026-10-22/SOURCE_PIN.json','docs/contracts/aghr-rc3/CONTRACTS.lock.json']
save('PREFLIGHT.json',{'at':datetime.now(timezone.utc).isoformat(),'HEAD':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'branch':subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip(),'git_status':subprocess.check_output(['git','status','--porcelain=v1'],cwd=ROOT,text=True),'prior_custody':{'path':lockpath.relative_to(ROOT).as_posix(),**digest(lockpath),'files_verified':len(lock['files'])},'before':before,'inputs':{n:digest(ROOT/n) for n in inputs},'owner_acceptance':'T11b accepted / inventory closed. 47 provisional rule drafts and T12 candidate authorized. No application writes or baseline promotion.'})
base={r['id']:r for r in load(ROOT/inputs[1])['rules']};latest={r['id']:r for r in load(ROOT/inputs[2])['rules']}
assert len(base)==len(latest)==47 and set(base)==set(latest)
delta=[{'id':rid,'fields_changed':[k for k in set(base[rid])|set(latest[rid]) if base[rid].get(k)!=latest[rid].get(k)]} for rid in base if base[rid]!=latest[rid]]
save('SOURCE_DELTA_1_2_TO_1_3.json',{'changes':delta,'count':len(delta),'baseline':'reference 1.2.0','draft_text_source':'Accepted T11 inventory of candidate 1.3.0; no source changes hidden'})
print(json.dumps({'status':'PASS','prior_files_verified':len(lock['files']),'rules':47,'source_changes_1_2_to_1_3':delta},ensure_ascii=False))
