import copy
import datetime as dt
import json
import tempfile
import unittest
from pathlib import Path
from runtime.common import *
from runtime.cli import init_project,validate_project,render_map,capture_request,update_state,audit_instructions

class RecordTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        (self.root/'proof.txt').write_text('synthetic test output: one case passed\n')
        self.e=load(ROOT/'templates/EVIDENCE.json')
        self.e.update(id='CHECK-1',criterion_ids=['C1'],result='PASS',candidate_sha256='a'*64,environment_id='env',started_at=now(),finished_at=now(),target_count=1,tests_executed=1,artifacts=[{'path':'proof.txt','sha256':sha(self.root/'proof.txt')}],limitations=[])
        self.s=load(ROOT/'templates/STATE.json')
        self.s.update(candidate_sha256='a'*64,environment_id='env',goals=[{'id':'G1','outcome':'Synthetic fixture only','criteria':[{'id':'C1','description':'Fixture criterion','required':True}]}],work=[{'id':'W1','description':'Fixture work','goal_id':'G1','status':'VERIFIED','criterion_ids':['C1'],'depends_on':[],'blocker':None}],checks=[copy.deepcopy(self.e)])
    def evidence_errors(self):return check_evidence(self.e,self.root,'a'*64,'env')
    def test_valid_evidence(self):self.assertEqual(self.evidence_errors(),[])
    def test_zero_test_pass_rejected(self):self.e['tests_executed']=0;self.assertTrue(self.evidence_errors())
    def test_zero_target_pass_rejected(self):self.e['target_count']=0;self.assertTrue(self.evidence_errors())
    def test_missing_artifact_rejected(self):self.e['artifacts']=[];self.assertTrue(self.evidence_errors())
    def test_artifact_tampering(self):(self.root/'proof.txt').write_text('tampered');self.assertTrue(self.evidence_errors())
    def test_candidate_mismatch(self):self.e['candidate_sha256']='b'*64;self.assertTrue(self.evidence_errors())
    def test_environment_mismatch(self):self.e['environment_id']='other';self.assertTrue(self.evidence_errors())
    def test_missing_time(self):self.e['started_at']=None;self.assertTrue(self.evidence_errors())
    def test_naive_timestamp(self):self.e['started_at']='2026-01-01T12:00:00';self.assertTrue(self.evidence_errors())
    def test_reversed_timestamp(self):self.e['started_at']='2099-01-01T12:00:00+00:00';self.assertTrue(self.evidence_errors())
    def test_future_timestamp(self):self.e['finished_at']='2099-01-01T12:00:00+00:00';self.assertTrue(self.evidence_errors())
    def test_notrun_is_not_pass(self):
        self.s['checks'][0]['result']='NOT_RUN';self.s['checks'][0]['limitations']=['Not run'];self.assertTrue(check_state(self.s,self.root))
    def test_inspection_without_unit_test_count_can_pass(self):self.e['kind']='INSPECTION';self.e['tests_executed']=0;self.assertEqual(self.evidence_errors(),[])
    def test_evidence_traversal(self):self.e['artifacts'][0]['path']='../proof.txt';self.assertTrue(self.evidence_errors())
    def test_duplicate_json_keys(self):
        with self.assertRaises(GovernanceError):loads('{"a":1,"a":2}')
    def test_nonfinite_json(self):
        with self.assertRaises(GovernanceError):loads('{"a":NaN}')
    def test_boolean_is_not_integer(self):self.e['tests_executed']=True;self.assertTrue(self.evidence_errors())
    def test_unknown_field(self):self.e['approved']=True;self.assertTrue(self.evidence_errors())
    def test_unsupported_schema(self):self.assertTrue(validate_schema('x',{'type':'string','format':'custom'}))
    def test_all_templates_shape_valid(self):
        for name in ('PROJECT','STATE','EVIDENCE','REQUEST','RULE'):
            with self.subTest(name=name):self.assertEqual(shape(load(ROOT/'templates'/f'{name}.json'),name),[])
    def test_empty_state_not_product_ready(self):self.assertTrue(check_state(load(ROOT/'templates/STATE.json'),self.root,ready=True))
    def test_valid_state_readiness(self):self.assertEqual(check_state(self.s,self.root,ready=True),[])
    def test_duplicate_work_id(self):self.s['work']*=2;self.assertTrue(check_state(self.s,self.root))
    def test_unknown_goal(self):self.s['work'][0]['goal_id']='G9';self.assertTrue(check_state(self.s,self.root))
    def test_unknown_criterion(self):self.s['work'][0]['criterion_ids']=['C9'];self.assertTrue(check_state(self.s,self.root))
    def test_unknown_dependency(self):self.s['work'][0]['depends_on']=['W9'];self.assertTrue(check_state(self.s,self.root))
    def test_dependency_cycle(self):self.s['work'][0]['depends_on']=['W1'];self.assertTrue(check_state(self.s,self.root))
    def test_unproved_verified(self):self.s['checks']=[];self.assertTrue(check_state(self.s,self.root))
    def test_pending_without_resolution(self):
        self.s['pending']=[{'id':'P1','work_id':'W1','description':'pending','status':'RESOLVED','blocking':True,'owner':'owner','resume_condition':'verified','resolution_ref':None}];self.assertTrue(check_state(self.s,self.root))
    def test_blocked_work_needs_reason(self):self.s['work'][0]['status']='BLOCKED';self.assertTrue(check_state(self.s,self.root))
    def test_unknown_data_disqualifies_lite(self):
        p=load(ROOT/'templates/PROJECT.json');p['profile']='LITE';self.assertTrue(check_project(p))
    def test_lite_with_declared_low_risk(self):
        p=load(ROOT/'templates/PROJECT.json');p['profile']='LITE';p['security']['data_class']='PUBLIC';self.assertEqual(check_project(p),[])
    def test_production_requires_controlled(self):
        p=load(ROOT/'templates/PROJECT.json');p['security']['production_access']=True;self.assertTrue(check_project(p))
    def test_unknown_project_not_ready(self):self.assertTrue(check_project(load(ROOT/'templates/PROJECT.json'),ready=True))
    def test_effective_adoption_not_inferred(self):
        p=load(ROOT/'templates/PROJECT.json');p['adoption']['state']='EFFECTIVE';self.assertTrue(check_project(p))
    def test_external_backend_requires_mapping(self):
        p=load(ROOT/'templates/PROJECT.json');p['canonical_backend']='DECLARED_EXTERNAL';self.assertTrue(check_project(p))

class AdoptionTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        (self.root/'AGENTS.md').write_text('existing owner instructions\n');(self.root/'PROJECT_MAP.md').write_text('existing map\n')
        self.result=init_project(self.root,'Test project','Test owner')
    def test_initializer_preserves_instructions_and_map(self):
        self.assertEqual((self.root/'AGENTS.md').read_text(),'existing owner instructions\n');self.assertEqual((self.root/'PROJECT_MAP.md').read_text(),'existing map\n')
    def test_initializer_is_not_activation(self):
        self.assertEqual(self.result['status'],'PREPARED');self.assertFalse(self.result['activated']);self.assertFalse(self.result['host_qualified'])
    def test_self_contained_reference_copy(self):
        self.assertTrue((self.root/'.aghr/reference/contracts/RUNTIME.md').is_file());self.assertTrue((self.root/'.aghr/reference/runtime/cli.py').is_file())
    def test_existing_adoption_refused(self):
        before=sha(self.root/'.aghr/project.json')
        with self.assertRaises(GovernanceError):init_project(self.root,'Second','Other')
        self.assertEqual(sha(self.root/'.aghr/project.json'),before)
    def test_initial_records_validate_but_not_ready(self):
        self.assertEqual(validate_project(self.root)['status'],'PASS');self.assertEqual(validate_project(self.root,True)['status'],'FAIL')
    def test_derived_map_staleness_detected(self):
        s=load(self.root/'.aghr/state.json');s['next_action']='changed';replace_json(self.root/'.aghr/state.json',s)
        self.assertEqual(validate_project(self.root)['status'],'FAIL');render_map(self.root);self.assertEqual(validate_project(self.root)['status'],'PASS')
    def test_intake_is_capture_only(self):
        request=self.root/'request.json';save_new(request,load(ROOT/'templates/REQUEST.json'))
        result=capture_request(self.root,request);self.assertEqual(result['promotion'],'NONE');self.assertEqual(result['execution'],'NOT_AUTHORIZED_BY_CAPTURE')
    def test_intake_does_not_overwrite(self):
        request=self.root/'request.json';save_new(request,load(ROOT/'templates/REQUEST.json'));capture_request(self.root,request)
        with self.assertRaises(FileExistsError):capture_request(self.root,request)
    def test_intake_invalid_extra_authority(self):
        r=load(ROOT/'templates/REQUEST.json');r['auto_approve']=True;save_new(self.root/'request.json',r)
        with self.assertRaises(GovernanceError):capture_request(self.root,self.root/'request.json')
    def test_compare_and_swap_revision(self):
        s=load(self.root/'.aghr/state.json');s['next_action']='updated';update_state(self.root,s,0)
        self.assertEqual(load(self.root/'.aghr/state.json')['revision'],1)
        with self.assertRaises(GovernanceError):update_state(self.root,s,0)
    def test_foreign_state_rejected(self):
        s=load(self.root/'.aghr/state.json');s['project_id']='other'
        with self.assertRaises(GovernanceError):update_state(self.root,s,0)
    def test_external_backend_not_overwritten(self):
        p=load(self.root/'.aghr/project.json');p['canonical_backend']='DECLARED_EXTERNAL';p['external_backend_ref']='urn:tracker:test';replace_json(self.root/'.aghr/project.json',p)
        s=load(self.root/'.aghr/state.json')
        with self.assertRaises(GovernanceError):update_state(self.root,s,0)
    def test_instruction_audit_not_loading_claim(self):
        r=audit_instructions(self.root);self.assertEqual(r['actual_host_loading'],'NOT_RUN');self.assertEqual(r['files'][0]['status'],'DISCOVERED_NOT_TRUSTED')
