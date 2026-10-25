from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def digest(p):return {'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
if (OUT/'PREFLIGHT.json').exists():raise FileExistsError('Preserve preflight')
parent=ROOT/'docs/evidence/studio-t12-2026-10-23/CUSTODY.lock.json';lock=load(parent)
drift=[p for p,v in lock['files'].items() if digest(ROOT/p)!=v];assert not drift,drift
before={}
for name in ['docs/INDEX.md','docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','server/api.js','server/staging.js','tests/governance_studio.test.mjs']:
 p=ROOT/name;q=OUT/'before'/f'{name}.raw';q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(p.read_bytes());before[name]=digest(p)
value={'at':datetime.now(timezone.utc).isoformat(),'HEAD':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'branch':subprocess.check_output(['git','branch','--show-current'],cwd=ROOT,text=True).strip(),'git_status':subprocess.check_output(['git','status','--porcelain=v1'],cwd=ROOT,text=True),'prior_custody':{'path':parent.relative_to(ROOT).as_posix(),**digest(parent),'files_verified':len(lock['files'])},'before':before,'owner_scope':'T12 signed SourceGrant / active override / E3 mock explicitly authorized. Conditional owner acceptance only for mock passing candidate. Then implement T13/T14, no live application writes or default storage activation.'}
(OUT/'PREFLIGHT.json').write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PASS','prior_files':len(lock['files']),'before_snapshots':len(before)}))
