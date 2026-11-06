"""Authored synthetic metadata fixtures, never observed live-agent behavior."""
import json
from pathlib import Path
from agdl.io import digest
from tests.fixtures import make_fixture


def make_quality_fixture(root: Path):
    trace = make_fixture(root)
    (root/'trace.json').write_text(json.dumps(trace,indent=2)+'\n',encoding='utf-8')
    refs = [('QSPEC','SPEC','spec.md'),('QPLAN','PLAN','tasks.md'),
            ('QREVIEW','REVIEW','review.md'),('QDECISION','DECISION','decision.md'),
            ('QLOG','TEST_LOG','test.log'),('QINSPECT','INSPECTION_LOG','inspection.log')]
    snapshot = {
        'schema_version':'adeq-1.1','record_kind':'DERIVED_NON_AUTHORITATIVE',
        'subject_revision':'fixture-revision-1','request_path':'request.txt',
        'trace_ref':{'path':'trace.json','sha256':digest((root/'trace.json').read_bytes())},
        'context':{'task_id':'TASK-EXAMPLE','work_type':'FEATURE','complexity':'LOW','impact':'LOW',
                   'reversibility':'YES','material_decision':False,'documentation_changed':False},
        'sources':[{'id':i,'role':role,'path':p,'sha256':digest((root/p).read_bytes()),
                    'trust':'PROJECT_REFERENCE','authority_reference':'SYNTHETIC_FIXTURE_NOT_REAL_AUTHORITY'} for i,role,p in refs],
        'ambiguities':[],'decisions':[],'claims':[],'observations':[],'confidence':{},
        'review':{'status':'REVIEWED','mode':'SELF','reviewer':'fixture-author','artifact_ref':'QREVIEW',
                  'separation_note':'Not independent','independent_required_by_project':False,'policy_ref':''},
        'rollback':{'strategy':'NOT_APPLICABLE','procedure_ref':'','rehearsal':'NOT_RUN','evidence_ref':'','residual_risk':'Synthetic reversible example only.'},
        'document_checks':[]}
    return trace, snapshot


def save_trace(root: Path, trace, snapshot):
    path=root/'trace.json';path.write_text(json.dumps(trace,indent=2)+'\n',encoding='utf-8')
    snapshot['trace_ref']['sha256']=digest(path.read_bytes())


def confidence(level='MEDIUM'):
    return {'level':level,'rationale':'Synthetic evidence limited to scoped fixtures.',
            'support_refs':['QSPEC'],'uncertainties':['Live runtime not tested.']}


def measurement(arm='BEFORE'):
    return {'schema_version':'adeq-metrics-1','record_kind':'DERIVED_NON_AUTHORITATIVE',
            'run_id':'synthetic-'+arm.lower(),'arm':arm,'evidence_class':'SYNTHETIC',
            'definition_id':'ADEQ-METRICS-1','sample_size':6,
            'conditions':{'model':'fixture-not-an-llm','host_version':'fixture-1',
                          'task_set_sha256':'a'*64,'oracle_sha256':'b'*64,'environment_id':'isolated-fixture',
                          'governance_version':'1.3.1' if arm=='BEFORE' else '1.4.0'},
            'measurements':[{'id':'omission_rate','numerator':2 if arm=='BEFORE' else 1,'denominator':10,
                             'value':None,'evidence_ref':'SYNTHETIC-COUNTS-NOT-OBSERVED'},
                            {'id':'critical_violations','numerator':None,'denominator':None,'value':0,
                             'evidence_ref':'SYNTHETIC-COUNTS-NOT-OBSERVED'}]}
