"""Real bounded local control observations. No CI protection inferred from YAML."""
import hashlib
from pathlib import Path
import re
from datetime import datetime, timezone
import uuid

SECRET = re.compile(r'(?im)(?:\b(?:api[_-]?key|password|access[_-]?token|client[_-]?secret)\s*[:=]\s*[\"\x27]?[A-Za-z0-9_+/=-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
CONTROL_ID = 'studio-patch-secret-scanner-v1'

def inspect_patch(text):
    # Deterministic local detector, deliberately not advertised as complete
    # secret discovery. No matched content is returned in diagnostics/logs.
    return not bool(SECRET.search(text))

def doctor(items, proposal_hash):
    now=datetime.now(timezone.utc).isoformat();run_id='DOC-'+str(uuid.uuid4())
    control_hash='sha256:'+hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    observations=[]
    for item in items:
        gate=item.get('enforcement',{}).get('gate',{})
        required=gate.get('required',False) or (item['force']=='MUST_NOT' and item['severity'] in ('critical','high'))
        if not required:continue
        if gate.get('type')!=CONTROL_ID:
            observations.append({'item_id':item['id'],'status':'NOT_OBSERVABLE','code':'GATE_NOT_REGISTERED','gate_type':gate.get('type'),
                                 'reason':'No authenticated host observation proves this gate. A file/declaration is not branch protection.'})
            continue
        # Exercise actual detector with bounded public canaries, and scan the
        # actual proposed text. This is E3 control operation, not an E4 eval.
        deny=not inspect_patch('api_key = '+('A'*24));allow=inspect_patch('The agent must never disclose credentials.')
        clean=inspect_patch(item['rule'])
        passed=deny and allow and clean
        observations.append({'item_id':item['id'],'status':'PASS' if passed else 'FAIL','code':'LOCAL_GATE_OBSERVED' if passed else 'LOCAL_GATE_FAILED',
                             'gate_type':CONTROL_ID,'negative_control_denied':deny,'positive_control_allowed':allow,'proposal_clean':clean,
                             'control_hash':control_hash,'enforcement_scope':'local Draft patch preparation/export only; not CI merge protection'})
    blocked=any(o['status']!='PASS' for o in observations)
    return {'status':'BLOCKED' if blocked else 'PASS','run_id':run_id,'at':now,'proposal_version_hash':proposal_hash,
            'control_hash':control_hash,'observations':observations,'e4':'REQUIRED / NOT_RUN / NOT_WAIVED'}
