#!/usr/bin/env python3
"""Non-authoritative snapshot of APPROVED-NAME governance sources.

A hash establishes bytes-equality only; it never authenticates an author or
proves that the agent actually loaded a rule.  Never scan credentials/content.
Exit: 0 snapshot or unchanged_in_declared_sources with complete inventory and HEAD;
2 stale; 3 inconclusive.  Outputs JSON stdout; does not write files.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ALLOWED_NAMES = {
    'AGENTS.md','AGENTS.override.md','GOVERNANCE.md','GOVERNANCE_CHARTER.md',
    'REQUEST_REGISTER.json','OWNER_AUTHORIZATION.md','write-set.json',
    'AUTHORITY_MAP.md','TASK_STATE.md','PROJECT_CONTEXT.md','updates.json',
    'OWNER_DECISIONS.json','PERMISSION_MATRIX.md',
}
MAX_FILE_BYTES = 4_000_000
SKIP = {'.git','node_modules','.venv','venv','dist','build','.cache','__pycache__',
        '.tox','vendor','target','.terraform'}


def safe_relative(s):
    if not isinstance(s,str): raise ValueError('source_not_string')
    p=s.replace('\\','/')
    if (not p or p.startswith(('/', '~')) or ':' in p or
            any(x in ('','.','..') for x in p.split('/')) or p.split('/')[-1] not in ALLOWED_NAMES):
        raise ValueError('source_not_allowed')
    return p


def fingerprint(root:Path, relative:str):
    relative=safe_relative(relative)
    p=root
    for s in relative.split('/'):
        p=p/s
        if p.is_symlink():raise ValueError('symlink_source_refused')
    p=p.resolve(strict=True)
    p.relative_to(root)
    if not p.is_file() or p.stat().st_size>MAX_FILE_BYTES:
        raise ValueError('missing_or_large_source')
    h=hashlib.sha256()
    with p.open('rb') as stream:
        for block in iter(lambda:stream.read(65536),b''):
            h.update(block)
    return {'path':relative,'sha256':h.hexdigest(),'size':p.stat().st_size}


def source_inventory(root:Path, limit:int=200000):
    items=[];count=0;errors=[];truncated=False
    def onerror(e):errors.append(type(e).__name__)
    for directory, subdirectories, filenames in os.walk(root,followlinks=False,onerror=onerror):
        subdirectories[:] = [n for n in subdirectories if n not in SKIP and
                            not (Path(directory)/n).is_symlink()]
        for n in filenames:
            count+=1
            if count>limit:
                truncated=True;break
            p=Path(directory)/n
            if n in ALLOWED_NAMES and not p.is_symlink():
                items.append(p.relative_to(root).as_posix())
        if truncated:break
    return sorted(set(items)), not(truncated or errors), errors


def current_head(root):
    try:
        env=os.environ.copy();env.update(GIT_OPTIONAL_LOCKS='0',GIT_TERMINAL_PROMPT='0')
        x=subprocess.run(['git','-C',str(root),'rev-parse','--verify','HEAD'],
                         capture_output=True,text=True,timeout=5,
                         stdin=subprocess.DEVNULL,env=env)
        return x.stdout.strip() if x.returncode==0 else 'UNKNOWN'
    except (OSError, subprocess.TimeoutExpired):return 'UNKNOWN'


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root',required=True)
    p.add_argument('--source', action='append',default=[],help='explicit governance relative path')
    p.add_argument('--check',help='prior view JSON; no writes')
    ns=p.parse_args(argv)
    r={'tool':'GOVERNANCE_DERIVED_VIEW','version':'1.2',
       'authority':'DERIVED_NON_AUTHORITATIVE',
       'created_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
       'status':'INCONCLUSIVE','sources':[],'enforcement_verified':False,
       'approval_verified':False,
       'notice':'Hash is NOT signature. Regenerate; never edit as authority.'}
    code=3
    try:
        root=Path(ns.root).resolve(strict=True)
        if not root.is_dir():raise ValueError('root_not_directory')
        inventory,complete,errors=source_inventory(root)
        r['source_inventory']={'paths':inventory,'complete':complete,
                               'errors':errors,'scope':'known_basename_sources_in_repository_nonignored_scan'}
        r['git_head']=current_head(root)
        if ns.check:
            prior=json.loads(Path(ns.check).read_text(encoding='utf-8'))
            if prior.get('authority')!='DERIVED_NON_AUTHORITATIVE' or not isinstance(prior.get('sources'),list):
                raise ValueError('not_valid_derived_view')
            sources=[x['path'] for x in prior['sources']]
        else:
            if not ns.source:raise ValueError('at_least_one_source_required')
            sources=ns.source
        if len(sources)>100 or len(sources)!=len(set(sources)):
            raise ValueError('duplicate_or_too_many_sources')
        r['sources']=[fingerprint(root,x) for x in sources]
        if ns.check:
            oldinv=prior.get('source_inventory',{})
            changed_sources=(r['sources']!=prior['sources'])
            changed_inventory=(inventory!=oldinv.get('paths'))
            head_changed=(r['git_head']!=prior.get('git_head'))
            r['inventory_diff']={'added':sorted(set(inventory)-set(oldinv.get('paths',[]))),
                                'removed':sorted(set(oldinv.get('paths',[]))-set(inventory))}
            if changed_sources or changed_inventory or head_changed:
                r['status']='STALE';code=2
            elif r['git_head']=='UNKNOWN' or prior.get('git_head')=='UNKNOWN':
                r['status']='INCONCLUSIVE_GIT_BASELINE';code=3
            elif not complete or not oldinv.get('complete',False):
                r['status']='SOURCE_INVENTORY_NOT_VERIFIED';code=3
            else:
                r['status']='UNCHANGED_IN_DECLARED_SOURCES';code=0
        else:
            r['status']='DERIVED_SNAPSHOT' if (r['git_head']!='UNKNOWN' and complete) else 'DERIVED_SNAPSHOT_WITH_UNVERIFIED_BASELINE'
            code=0
    except (OSError,ValueError,KeyError,TypeError,IndexError,json.JSONDecodeError) as e:
        r['reason']=str(e)[:140] if isinstance(e,ValueError) else type(e).__name__
        code=3
    print(json.dumps(r,ensure_ascii=False,indent=2))
    return code

if __name__=='__main__':sys.exit(main())
