"""Author-created synthetic fixtures, not real project evidence or independent labels."""
from pathlib import Path
from agdl.io import digest
from agdl.legacy import blank_template

def make_fixture(root: Path):
    files = {
        'request.txt':'Add an input validator.\nDo not publish the project.\n',
        'spec.md':'# Fixture specification\nReject negative input; no publication.\n',
        'tasks.md':'- [x] T001 Implement and test the fixture validator.\n',
        'src/feature.py':'def valid(value):\n    return value >= 0\n',
        'test.log':'SYNTHETIC TEST LOG: no live agent or production execution. Fixture label PASSED.\n',
        'inspection.log':'SYNTHETIC INSPECTION: no publication inside this fixture.\n',
        'review.md':'SYNTHETIC SELF REVIEW: labels and source coverage checked by fixture author.\n',
        'grant.md':'SYNTHETIC OWNER RECORD: local fixture edits; no remote action. Not real authorization.\n',
        'decision.md':'SYNTHETIC exception decision; no real owner identity authenticated.\n'}
    for name,text in files.items():
        p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8',newline='')
    raw=(root/'request.txt').read_bytes();trace=blank_template(raw.decode(),digest(raw))
    trace['risk_tier']='R0';trace['authorization']={'status':'VERIFIED','source_ref':'GRANT-1'}
    trace['review']={'independence':'L0','review_evidence_ref':'REVIEW-1','independent_approval_verified':False}
    trace['requirements']=[]
    for i,unit in enumerate(trace['source_units'],1):
        rid=f'REQ-{i:03d}';unit.update(disposition='REQUIREMENTS',requirement_ids=[rid])
        trace['requirements'].append({'id':rid,'normative':'MUST' if i==1 else 'MUST_NOT',
            'source_unit_ids':[unit['unit_id']],'applicability':'APPLICABLE',
            'acceptance':{'test_id':f'TEST-{i:03d}','oracle':'Fixture oracle: expected scoped observation is recorded.'},
            'implementation_state':'IMPLEMENTED','verification':{'status':'PASSED','evidence_ref':f'EV-{i}'}})
    ref_rows=[('SPEC-1','SPEC','spec.md'),('TASKS-1','TASK_RECORD','tasks.md'),
              ('IMPL-1','IMPLEMENTATION','src/feature.py'),('LOG-1','TEST_LOG','test.log'),
              ('LOG-2','INSPECTION_LOG','inspection.log'),('REVIEW-1','REVIEW','review.md'),
              ('GRANT-1','DELEGATION','grant.md'),('DECISION-1','DECISION','decision.md')]
    references=[{'id':i,'kind':k,'path':p,'sha256':digest((root/p).read_bytes()),'authority_class':'REFERENCE_ONLY'} for i,k,p in ref_rows]
    evidence=[{'id':f'EV-{i}','requirement_ids':[f'REQ-{i:03d}'],'artifact_ref':f'LOG-{i}',
        'subject_revision':'fixture-revision-1','source_sha256':digest(raw),'method':'TEST' if i==1 else 'INSPECTION',
        'result':'PASSED','evidence_class':'SYNTHETIC','producer':'fixture-author',
        'command_or_method':'Synthetic acceptance-label construction; not a live model run.',
        'observed_result':'Fixture expectation PASSED; semantic validity is not machine-authenticated.'} for i in (1,2)]
    review={'status':'REVIEWED','artifact_ref':'REVIEW-1','reviewer':'fixture-author','mode':'SELF'}
    return {'schema_version':'agdl-1.3','record_kind':'DERIVED_NON_AUTHORITATIVE','environment':'SYNTHETIC_FIXTURE',
        'subject_revision':'fixture-revision-1','risk_tier':'R0','rcca':trace,'references':references,'evidence':evidence,
        'bindings':{f'REQ-{i:03d}':{'spec_refs':['SPEC-1'],'task_refs':['T001'],'implementation_refs':['IMPL-1'],
            'evidence_refs':[f'EV-{i}'],'no_spec_reason':'','no_task_reason':''} for i in (1,2)},
        'tasks':[{'id':'T001','source_ref':'TASKS-1','status':'DONE','depends_on':[]}],
        'coverage_review':dict(review),'completion_review':dict(review)}
