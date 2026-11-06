#!/usr/bin/env python3
"""Local hash-chained append-only-by-convention audit events.

Not cryptographically signed or tamper-proof: filesystem owner can rewrite
entire chain.  External immutable anchoring or separate trusted storage is
required for authenticity/non-repudiation.  --append requires --allow-write.
"""
from __future__ import annotations
import argparse, hashlib, json, os, sys
from pathlib import Path
from datetime import datetime, timezone

MAX_EVENT_BYTES=64_000
MAX_LINE_BYTES=128_000
SECRET_FIELD_NAMES={'password','secret','token','api_key','private_key','authorization','credential'}
EVENT_TYPES={'GATE_SNAPSHOT','REQUIREMENT_REVISED','EVIDENCE_LINKED','EXCEPTION_REQUESTED',
             'OWNER_DECISION_REFERENCED','POST_DONE_DEFECT','VERIFICATION_RESULT','NOTE'}


def canonical(x):
    return json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf-8')


def sha(x):return hashlib.sha256(x).hexdigest()


def forbidden_keys(obj):
    if isinstance(obj,dict):
        for k,v in obj.items():
            if str(k).casefold() in SECRET_FIELD_NAMES:return True
            if forbidden_keys(v):return True
    if isinstance(obj,list):return any(forbidden_keys(v) for v in obj)
    return False


def verify_log(path):
    if not path.exists():return {'status':'EMPTY','count':0,'last_hash':'GENESIS'}
    previous='GENESIS';count=0
    with path.open('rb') as f:
        for line in f:
            if len(line)>MAX_LINE_BYTES:raise ValueError(f'line_too_large:{count+1}')
            count+=1
            if not line.endswith(b'\n'):raise ValueError(f'partial_line:{count}')
            try:entry=json.loads(line)
            except Exception:raise ValueError(f'invalid_json_line:{count}')
            if not isinstance(entry,dict) or entry.get('sequence')!=count or entry.get('previous_hash')!=previous:
                raise ValueError(f'broken_sequence_or_chain:{count}')
            claimed=entry.get('record_hash')
            item={k:v for k,v in entry.items() if k!='record_hash'}
            if claimed!=sha(canonical(item)):
                raise ValueError(f'broken_digest:{count}')
            previous=claimed
    return {'status':'CHAIN_CONSISTENT_LOCALLY','count':count,'last_hash':previous}


def append_event(path,event):
    if not isinstance(event,dict) or event.get('type') not in EVENT_TYPES:
        raise ValueError('event_type_invalid')
    if forbidden_keys(event):raise ValueError('secret_like_field_name_forbidden')
    if len(canonical(event))>MAX_EVENT_BYTES:raise ValueError('event_too_large')
    if not path.parent.is_dir():raise ValueError('ledger_parent_missing')
    lock=Path(str(path)+'.lock')
    try:
        fd=os.open(str(lock),os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    except FileExistsError:raise ValueError('ledger_locked_refuse_parallel_write')
    try:
        os.close(fd)
        state=verify_log(path)
        item={'sequence':state['count']+1,'previous_hash':state['last_hash'],
              'timestamp_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
              'event':event}
        item['record_hash']=sha(canonical(item))
        raw=canonical(item)+b'\n'
        fd=os.open(str(path),os.O_CREAT|os.O_APPEND|os.O_WRONLY,0o600)
        try:
            if os.write(fd,raw)!=len(raw):raise OSError('partial_append')
            os.fsync(fd)
        finally:os.close(fd)
        return verify_log(path)
    finally:
        try:lock.unlink()
        except FileNotFoundError:pass


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--ledger',required=True)
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument('--verify',action='store_true')
    group.add_argument('--event',help='JSON file describing one event')
    p.add_argument('--allow-write',action='store_true')
    args=p.parse_args()
    status={'tool':'RCCA_LEDGER','authenticity_verified':False,'external_anchoring_verified':False}
    code=3
    try:
        path=Path(args.ledger)
        if args.verify:
            status.update(verify_log(path));code=0
        elif args.allow_write:
            event=json.loads(Path(args.event).read_text(encoding='utf-8'))
            status.update(append_event(path,event));code=0
        else:
            status['status']='WRITE_REQUIRES_EXPLICIT_FLAG';code=2
    except (OSError,ValueError,json.JSONDecodeError) as e:
        status['status']='INCONCLUSIVE'
        status['reason']=str(e)[:120] if isinstance(e,ValueError) else type(e).__name__
    print(json.dumps(status,ensure_ascii=False,indent=2))
    return code

if __name__=='__main__':sys.exit(main())
