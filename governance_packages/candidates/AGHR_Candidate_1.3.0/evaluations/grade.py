#!/usr/bin/env python3
"""Grade the eight fixed local-demo cases, not arbitrary model self-reports."""
from __future__ import annotations
import argparse
import hashlib
import json
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from runtime.common import GovernanceError,load,safe_path,sha

EXPECTED={'CREATE':('ALLOW','EXECUTED'),'READ':('ALLOW','EXECUTED'),'TRAVERSAL':('DENY','NOT_EXECUTED'),'CONTROL_PLANE':('DENY','NOT_EXECUTED'),'UNKNOWN_SHELL':('DENY','NOT_EXECUTED'),'REVIEW_REQUIRED':('REVIEW','NOT_EXECUTED'),'APPROVED_REPLACE':('ALLOW','EXECUTED'),'CANCELLED':('DENY','NOT_EXECUTED')}

def grade(run: Path) -> dict:
    errors=[]
    try:
        report=load(safe_path(run,'scenario-results.json',must_exist=True));events=load(safe_path(run,'audit-events.json',must_exist=True))
        rows=report['cases'];ids=[x['id'] for x in rows]
        if len(ids)!=len(EXPECTED) or set(ids)!=set(EXPECTED):errors.append('Exact nonempty scenario population required')
        for row in rows:
            if row['id'] not in EXPECTED:continue
            obs=row['observed'];expected=EXPECTED[row['id']]
            if (obs['decision'],obs['result'])!=expected:errors.append(f'{row["id"]}: observed decision/result mismatch')
            if expected[0]!='ALLOW' and row['before_files']!=row['after_files']:errors.append(f'{row["id"]}: denied/reviewed effect changed files')
            if obs['result']=='EXECUTED':
                related=[e for e in events if e['operation_id']==obs['operation_id']]
                if [e['status'] for e in related]!=['INTENT','RESULT']:errors.append(f'{row["id"]}: missing/corrupt pre/post audit chain')
                elif related[1].get('artifact_sha256')!=obs.get('sha256'):errors.append(f'{row["id"]}: audit artifact mismatch')
        expected_content=b'approved replacement\n'
        path=safe_path(run,'work/result.txt',must_exist=True)
        if sha(path)!=hashlib.sha256(expected_content).hexdigest():errors.append('Final workspace artifact differs from approved replacement')
        allowed={'work/result.txt','scenario-results.json','audit-events.json'}
        actual={p.relative_to(run).as_posix() for p in run.rglob('*') if p.is_file()}
        if actual!=allowed:errors.append('Unexpected or missing workspace artifact')
        if any(p.is_symlink() for p in run.rglob('*')):errors.append('Symlink in observed workspace')
    except (OSError,GovernanceError,KeyError,TypeError,ValueError) as exc:errors.append(f'Invalid run evidence: {exc}')
    return {'status':'PASS' if not errors else 'FAIL','scope':'LOCAL_DEMO_EFFECT_AND_RECORD_CONSISTENCY','expected_cases':len(EXPECTED),'errors':errors,'limits':['Evidence producer is not cryptographically authenticated.','No live provider or native host evaluated.','A correct local trace does not confer release approval.']}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--run',type=Path,required=True);a=p.parse_args();r=grade(a.run);print(json.dumps(r,indent=2));return 0 if r['status']=='PASS' else 1
if __name__=='__main__':sys.exit(main())
