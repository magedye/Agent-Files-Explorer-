"""One protocol-3 invocation inside T15 Job limits, read-only Python audit guard."""
import json
from pathlib import Path
import sys
import hashlib

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
ENGINE=ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate'
sys.path.insert(0,str(ENGINE/'tools'))
sys.path.insert(0,str(HERE.parent/'e5'))
sys.path.insert(0,str(HERE))

def run(request):
    import core
    op=request['operation'];payload=request.get('payload');base=request.get('base')
    if op=='prepare':return core.prepare(payload,base)
    if op=='edit':return core.prepare(core.edit(payload,request['edit']),base)
    if op=='attestation':
        prepared=core.prepare(payload,base);parsed,member=core.parse_proposal(payload);a=member.value.get('authority',{})
        actor=request['actor']
        if a.get('level') not in ('project','component') or a.get('owner')!=actor or a.get('approvedBy')!=actor or a.get('status')!='active':
            raise ValueError('LOCAL_SOURCE_ATTESTATION_REQUIRES_EXACT_PROJECT_OWNER')
        return {'item_path':member.location.path,'source_sha256':parsed.source.sha256,'authority_source':a['source'],'level':a['level'],
                'owner':actor,'approved_by':actor,'evidence_ref':'sqlite:source.attest/'+prepared['proposal_version_hash'],'item_ids':[member.value['id']],'advanced_kinds':[]}
    if op=='validate':
        from policy import verify
        return verify(payload,base,ENGINE,request.get('source_grants',[]))
    if op=='generate':
        from workflow import generation
        return generation(payload,base,ENGINE,request['preview'],request.get('lookup_context'))
    if op=='doctor':
        from doctor import doctor
        return doctor([m.value for m in core.overlay(payload,ENGINE).items],core.prepare(payload,base)['proposal_version_hash'])
    if op=='lookup':
        from lookup import retrieve,stored_items
        from workflow import items_for
        values=stored_items(request['lookup_context'],core.prepare(payload,base)['proposal_version_hash'],ENGINE) if request.get('lookup_context') else items_for(payload,ENGINE)
        return retrieve(values,request['item_id'],request.get('content_hash'))
    if op=='preview':
        from workflow import preview
        return preview(payload,base,ENGINE)
    if op=='approval':
        from policy import eligibility
        return eligibility(request['cp'],request['decision'],request['actor'],request['requirements'])
    if op=='export':
        from workflow import export_guard,preview
        export_guard(request['cp'],request['actor'],request['requirements'])
        return preview(payload,base,ENGINE)
    raise ValueError('UNSUPPORTED_OPERATION')

def main():
    report={'protocol_version':'3','command':None,'result':'ERROR','exit_code':2,'source':None,'checks':{'status':'NOT_RUN'},'diagnostics':[],'data':None}
    try:
        lock=(HERE/'SOURCE.lock.json').read_bytes();pin=json.loads(lock)
        for name,expected in pin['files'].items():
            if hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=expected:raise ValueError('ENGINE_SOURCE_DRIFT')
        report['source']={'implementation_id':'aghr-e3-local-draft','revision':'e3.1','content_hash':hashlib.sha256(lock).hexdigest(),'publisher_authentication':'UNKNOWN'}
        raw=Path(sys.argv[1]).read_bytes()
        if len(raw)>262144:raise ValueError('INPUT_LIMIT')
        request=json.loads(raw.decode('utf-8'),parse_int=float);report['command']=request['operation']
        data=run(request);result=data.get('result','READ')
        if request['operation']=='doctor':result={'PASS':'VALID','FAIL':'INVALID','BLOCKED':'BLOCKED'}[data['status']]
        if result not in ('VALID','INVALID','BLOCKED'):result='READ'
        code={'VALID':0,'INVALID':1,'BLOCKED':3,'READ':0}[result]
        report.update(result=result,exit_code=code,data=data,checks={'status':'COMPLETE' if code==0 else result})
    except Exception as error:
        report.update(result='INVALID',exit_code=1,diagnostics=[{'code':'OPERATION_REJECTED','message':str(error)[:6000]}])
    print(json.dumps(report,ensure_ascii=False,allow_nan=False,separators=(',',':')))
    return report['exit_code']

if __name__=='__main__':raise SystemExit(main())
