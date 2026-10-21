#!/usr/bin/env python3
"""Local adoption, records and synthetic executor demonstration. No model calls."""
from __future__ import annotations
import argparse
import copy
import json
import os
import shutil
import sys
import threading
from pathlib import Path
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from runtime.common import (ROOT, GovernanceError, check_project, check_state, check_request, digest,
    instant, load, now, replace_json, safe_path, save_new, sha, shape)
from runtime.policy import Context, FileExecutor

_STATE_LOCK=threading.RLock()

def records(project: Path) -> tuple[dict,dict]:
    cfg=load(safe_path(project,".aghr/project.json",must_exist=True))
    state=load(safe_path(project,".aghr/state.json",must_exist=True))
    return cfg,state

def _display(value: str) -> str:
    return value.replace("\n"," ").replace("\r"," ")

def map_content(project: dict,state: dict) -> str:
    lines=["# PROJECT_MAP — Derived View", "", f"Project record digest: `{digest(project)}`",
           f"State digest: `{digest(state)}`",f"State revision: {state['revision']}",
           f"Canonical backend: {project['canonical_backend']}",
           "This map is not an instruction source, a grant, or an independent status register.","",
           "## [TECH_STACK]", "\n".join('- '+_display(x) for x in project['stack']) or "Not yet recorded.","",
           "## [SYSTEM_FLOW]", "\n".join('- '+_display(x) for x in project['system_flow']) or "Not yet recorded.","",
           "## [ARCHITECTURE]",_display(project['architecture']) or "Not yet recorded.","",
           "## [ORPHANS & PENDING]"]
    if project['canonical_backend']=="DECLARED_EXTERNAL":lines.append("External canonical backend: this local view is a snapshot; refresh from the declared adapter before use.")
    pending=[x for x in state['pending'] if x['status']!="RESOLVED"]
    lines.extend(f"- {p['id']}: {_display(p['description'])} [{p['status']}; blocking={p['blocking']}] — {_display(p['resume_condition'])}" for p in pending)
    if not pending:lines.append("No pending records. This does NOT prove product completeness or acceptance.")
    lines.extend(["", "## Next action",_display(state['next_action']), ""])
    if "delivery" in state:
        d=state["delivery"];g=d["git_observation"]
        lines.extend(["## Delivery observations",f"Phase: {d['phase']}",f"Mode: {d['execution_mode']} (not an execution grant)",f"Branch: {_display(g['branch'] or 'UNKNOWN')}",f"Remote checked: {g['remote_checked']}; observed at: {g['observed_at'] or 'UNKNOWN'}",f"Open findings: {sum(f['status']=='OPEN' for f in d['findings'])}","Read canonical STATE for observation evidence, unmerged branches and limitations.",""])
    return "\n".join(lines)

def render_map(project: Path) -> Path:
    cfg,state=records(project)
    errors=shape(cfg,"PROJECT")+shape(state,"STATE")
    if errors:raise GovernanceError("; ".join(errors))
    path=safe_path(project,".aghr/PROJECT_MAP.md")
    text=map_content(cfg,state)
    # This path is a dedicated generated view; never write the root PROJECT_MAP.
    path.write_text(text,encoding="utf-8")
    return path

def update_state(project: Path,new_state: dict,expected_revision: int) -> None:
    """Single-process compare-and-swap only; host must serialize outside writers."""
    with _STATE_LOCK:
        cfg,old=records(project)
        if cfg['canonical_backend']!="LOCAL_JSON":raise GovernanceError("External canonical state must use its declared adapter")
        if type(expected_revision) is not int or old['revision']!=expected_revision:raise GovernanceError("Stale state revision")
        if new_state.get('project_id')!=old['project_id']:raise GovernanceError("State belongs to another project")
        updated=copy.deepcopy(new_state);updated['revision']=old['revision']+1
        errors=check_state(updated,project)
        if errors:raise GovernanceError("; ".join(errors))
        replace_json(safe_path(project,".aghr/state.json",must_exist=True),updated)
        render_map(project)

def init_project(project: Path,name: str,owner: str,profile: str="STANDARD") -> dict:
    if not name.strip() or not owner.strip():raise GovernanceError("Project name and owner required")
    if profile not in {"LITE","STANDARD","CONTROLLED"}:raise GovernanceError("Unknown profile")
    if project.is_symlink():raise GovernanceError("Symlink project root rejected")
    project=project.resolve()
    if project.is_relative_to(ROOT):raise GovernanceError("Cannot adopt inside the reference package")
    project.mkdir(parents=True,exist_ok=True)
    home=project/".aghr"
    if home.exists() or home.is_symlink():raise GovernanceError("Existing .aghr preserved; use reviewed migration instead")
    for path in ROOT.rglob('*'):
        if path.is_symlink():raise GovernanceError("Reference contains symlink; initialization stopped")
    home.mkdir()
    try:
        for part in ("intake","evidence","proposed"): (home/part).mkdir()
        cfg=load(ROOT/"templates/PROJECT.json");state=load(ROOT/"templates/STATE.json")
        pid='project-'+digest({'path':str(project),'name':name})[:12]
        cfg.update(project_id=pid,name=name,owner=owner,profile=profile,repository_ref=str(project))
        state['project_id']=pid
        save_new(home/"project.json",cfg);save_new(home/"state.json",state)
        shutil.copytree(ROOT,home/"reference",ignore=shutil.ignore_patterns('__pycache__','*.pyc','.git'))
        proposed='''# Project Agent Instructions — Proposed, not active

Confirm the project's actual instruction-loading chain and reconcile existing guidance before adoption.
Use `.aghr/reference/CHARTER.md` and the scoped contract when needed, not as an instruction to preload the library.
Read `.aghr/project.json`, the authoritative task/state, and the relevant protocol.
Treat `.aghr/PROJECT_MAP.md` as a derived view; it cannot authorize action.
Work only within actual host grants. No publication, destructive operation or release acceptance is implied.
Use `.aghr/reference/procedures/REQUEST_INTAKE.md` for new requirements and rule changes.
Report actual checks, unresolved constraints, candidate/environment and next permitted action.
'''
        (home/"proposed/AGENTS.md").write_text(proposed,encoding='utf-8')
        inbox = project / "_INBOX"
        inbox.mkdir(exist_ok=True)
        inbox_guide = inbox / "README.md"
        if not inbox_guide.exists():
            inbox_guide.write_text(
                "# Governed Project Inbox (_INBOX/)\n\n"
                "Safe drop location for new files, documents, proposals and packages.\n\n"
                "1. Placing files here NEVER constitutes an execution grant or policy adoption.\n"
                "2. Files are scanned, fingerprinted, and classified via `python runtime/cli.py inbox --project .`.\n"
                "3. Original files are preserved in immutable custody without overwriting active assets.\n",
                encoding="utf-8"
            )
        render_map(project)
        result={'status':'PREPARED','project':str(project),'created_at':now(),'reference_version':(ROOT/'VERSION').read_text(encoding='utf-8').strip(),'activated':False,'host_qualified':False,'existing_project_instructions_changed':False,'next':'Discover facts, reconcile instructions, qualify applicable routes, record competent adoption decision.'}
        save_new(home/"INITIALIZATION.json",result)
        return result
    except Exception as exc:
        # Preserve partial output for inspection; do not recursively delete data.
        (home/"INITIALIZATION_FAILED.txt").write_text(f"Initialization incomplete: {type(exc).__name__}\nInspect and reconcile partial output; no activation occurred.\n")
        raise

def validate_project(project: Path,ready: bool=False) -> dict:
    cfg,state=records(project)
    errors=check_project(cfg,ready=ready)+check_state(state,project)
    if cfg.get('project_id')!=state.get('project_id'):errors.append("Project/state identity mismatch")
    map_path=safe_path(project,".aghr/PROJECT_MAP.md")
    if not map_path.exists() or map_path.read_text(encoding='utf-8')!=map_content(cfg,state):errors.append("Derived map missing or stale")
    if ready:
        # This only checks adoption prerequisites; it never calls product ready.
        for field,value in [('decision_ref',cfg['adoption']['decision_ref']),('qualification_ref',cfg['host']['qualification_ref'])]:
            if value and not (value.startswith('https://') or value.startswith('urn:')):
                try:safe_path(project,value,must_exist=True)
                except GovernanceError as exc:errors.append(f"{field}: {exc}")
    return {'status':'PASS' if not errors else 'FAIL','check':'ADOPTION_PREREQUISITES' if ready else 'RECORD_STRUCTURE_AND_SEMANTICS','errors':errors,'limits':['Recorded decisions are not authenticated by this checker.','Host/provider execution is not tested.','This is not product acceptance or release authorization.']}

def capture_request(project: Path,request_path: Path) -> dict:
    cfg,_=records(project)
    request=load(request_path);errors=check_request(request)
    if errors:raise GovernanceError('; '.join(errors))
    instant(request['source']['captured_at'])
    ids=[x['id'] for x in request['items']]
    if len(ids)!=len(set(ids)):raise GovernanceError('Duplicate request item IDs')
    rid=request['request_id'];dest=safe_path(project,f'.aghr/intake/{rid}.json')
    save_new(dest,request)
    return {'status':'CAPTURED','request_id':rid,'sha256':sha(dest),'promotion':'NONE','execution':'NOT_AUTHORIZED_BY_CAPTURE','canonical_backend':cfg['canonical_backend']}

def audit_instructions(project: Path) -> dict:
    if not project.is_dir():raise GovernanceError('Existing project directory required')
    found=[]
    names={'AGENTS.md','AGENTS.override.md','CLAUDE.md','CLAUDE.local.md','GEMINI.md','copilot-instructions.md','opencode.json','opencode.jsonc'}
    # Inventory metadata only; not execution, semantic approval or native loader emulation.
    for base,dirs,files in os.walk(project,followlinks=False):
        dirs[:]=[d for d in dirs if d not in {'.git','.aghr','node_modules','.venv','dist','build'} and not (Path(base)/d).is_symlink()]
        for name in files:
            path=Path(base)/name
            if name in names or name.endswith('.instructions.md'):
                if path.is_symlink():found.append({'path':path.relative_to(project).as_posix(),'status':'SYMLINK_NOT_READ'});continue
                found.append({'path':path.relative_to(project).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path),'status':'DISCOVERED_NOT_TRUSTED'})
    return {'status':'INVENTORY_ONLY','files':found,'actual_host_loading':'NOT_RUN','limits':['Global settings, parent-directory guidance, remote imports and dynamically loaded context require the selected host procedure.','A filename and digest do not authenticate instructional authority.']}

def demo(output: Path) -> dict:
    if output.exists() or output.is_symlink():raise GovernanceError('Demo output must not exist')
    output.mkdir(parents=True);(output/'work').mkdir();(output/'input').mkdir()
    current=[Context('synthetic-actor','synthetic-task','local-demo','policy-1','a'*64)]
    executor=FileExecutor(output,lambda:current[0]);cases=[]
    def snapshot():
        return {p.relative_to(output).as_posix():sha(p) for p in output.rglob('*') if p.is_file() and not p.is_symlink()}
    def run(cid,action,expected,token=None):
        before=snapshot();observed=executor.execute(action,token);after=snapshot()
        unchanged=before==after
        cases.append({'id':cid,'expected_decision':expected,'observed':observed,'before_files':before,'after_files':after,'matched':observed['decision']==expected and (expected=='ALLOW' or unchanged)})
        return observed
    run('CREATE',{'operation':'create_file','path':'work/result.txt','content':'verified demo\n'},'ALLOW')
    run('READ',{'operation':'read_file','path':'work/result.txt'},'ALLOW')
    run('TRAVERSAL',{'operation':'read_file','path':'../outside.txt'},'DENY')
    run('CONTROL_PLANE',{'operation':'create_file','path':'.aghr/policy.json','content':'tamper'},'DENY')
    run('UNKNOWN_SHELL',{'operation':'shell','path':'work/result.txt','content':'echo unsafe'},'DENY')
    action={'operation':'replace_file','path':'work/result.txt','content':'approved replacement\n','expected_sha256':sha(output/'work/result.txt')}
    run('REVIEW_REQUIRED',action,'REVIEW')
    token=executor.issue_approval(action)
    run('APPROVED_REPLACE',action,'ALLOW',token)
    current[0]=Context('synthetic-actor','synthetic-task','local-demo','policy-1','a'*64,cancelled=True)
    run('CANCELLED',{'operation':'create_file','path':'work/stopped.txt','content':'no'},'DENY')
    report={'status':'PASS' if all(x['matched'] for x in cases) and not (output/'work/stopped.txt').exists() else 'FAIL','scenario_count':len(cases),'cases':cases,'boundary':'BUNDLED_LOCAL_EXECUTOR_ONLY','live_model':'NOT_RUN','native_host':'NOT_RUN','independent_review':'NOT_PERFORMED'}
    save_new(output/'scenario-results.json',report);save_new(output/'audit-events.json',executor.events)
    return report

def main(argv=None) -> int:
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    a=sub.add_parser('init');a.add_argument('--project',type=Path,required=True);a.add_argument('--name',required=True);a.add_argument('--owner',required=True);a.add_argument('--profile',choices=['LITE','STANDARD','CONTROLLED'],default='STANDARD')
    a=sub.add_parser('validate');a.add_argument('--project',type=Path,required=True);a.add_argument('--ready',action='store_true')
    a=sub.add_parser('intake');a.add_argument('--project',type=Path,required=True);a.add_argument('--request',type=Path,required=True)
    for name in ['map','audit-instructions','progress']:
        a=sub.add_parser(name);a.add_argument('--project',type=Path,required=True)
    a=sub.add_parser('inbox')
    a.add_argument('--project',type=Path,required=True)
    a.add_argument('--register',type=str,help='Inbox filename to register')
    a.add_argument('--requester',default='OWNER')
    a.add_argument('--classification',default='PROPOSAL')
    a.add_argument('--notes',default='')
    a.add_argument('--disposition',choices=['ADOPT','RECONCILE','REJECT','DEFER','HOLD','REFERENCE_ONLY'])
    a.add_argument('--request-id',type=str)
    a.add_argument('--rationale',type=str)
    a.add_argument('--authority-ref',type=str)
    a=sub.add_parser('skills')
    a.add_argument('--task',type=str,default='',help='Task description or intent')
    a.add_argument('--skill-id',type=str,help='Target skill ID')
    a.add_argument('--action',choices=['discover','check','load','lifecycle'],default='discover')
    a=sub.add_parser('demo');a.add_argument('--output',type=Path,required=True)
    args=p.parse_args(argv)
    try:
        if args.command=='init':result=init_project(args.project,args.name,args.owner,args.profile)
        elif args.command=='validate':result=validate_project(args.project,args.ready)
        elif args.command=='intake':result=capture_request(args.project,args.request)
        elif args.command=='map':result={'status':'DERIVED_VIEW_UPDATED','path':str(render_map(args.project))}
        elif args.command=='audit-instructions':result=audit_instructions(args.project)
        elif args.command=='inbox':
            from runtime.inbox import scan_inbox, register_inbox_item, resolve_inbox_disposition
            if args.register:
                result=register_inbox_item(args.project, args.register, requester=args.requester, classification=args.classification, notes=args.notes)
            elif args.disposition:
                if not args.request_id or not args.rationale or not args.authority_ref:
                    raise GovernanceError("--disposition requires --request-id, --rationale, and --authority-ref")
                result=resolve_inbox_disposition(args.project, args.request_id, disposition=args.disposition, rationale=args.rationale, authority_ref=args.authority_ref)
            else:
                result=scan_inbox(args.project)
        elif args.command=='skills':
            from runtime.skills import discover_skills, check_skill_prerequisites, load_skill_details, execute_skill_lifecycle
            task = {'description': args.task, 'intent': args.task}
            if args.action == 'discover':
                result = {'status': 'SUCCESS', 'candidates': discover_skills(task)}
            elif args.action == 'check':
                if not args.skill_id:
                    raise GovernanceError("--skill-id is required for check")
                result = check_skill_prerequisites(args.skill_id, context={'available_tools': ['read_file'], 'grant': {'permissions': ['READ_ONLY']}})
            elif args.action == 'load':
                if not args.skill_id:
                    raise GovernanceError("--skill-id is required for load")
                result = load_skill_details(args.skill_id)
            else:
                result = execute_skill_lifecycle(task, context={'available_tools': ['read_file'], 'grant': {'permissions': ['READ_ONLY']}})
        elif args.command=='progress':
            from runtime.delivery import progress_report
            cfg,state=records(args.project);result=progress_report(cfg,state,args.project)
        try:
            print(json.dumps(result,ensure_ascii=False,indent=2))
        except UnicodeEncodeError:
            print(json.dumps(result,ensure_ascii=True,indent=2))
        return 1 if result.get('status') in ('FAIL','EVIDENCE_CONFLICT') else 0
    except (GovernanceError,OSError,ValueError,KeyError) as exc:
        print(json.dumps({'status':'ERROR','message':str(exc)},indent=2));return 2


if __name__=='__main__':sys.exit(main())
