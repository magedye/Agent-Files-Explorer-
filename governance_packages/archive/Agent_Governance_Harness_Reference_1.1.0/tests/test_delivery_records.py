"""Synthetic record checks, not model/host behavior or authenticated approvals."""
import copy
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from runtime.common import ROOT, GovernanceError, check_request, check_state, load, now, sha, save_new
from runtime.cli import capture_request, init_project, main
from runtime.delivery import progress_report

class ClarificationRecords(unittest.TestCase):
    def setUp(self):
        self.r=load(ROOT/'examples/REQUEST_WITH_CLARIFICATION.json')
        self.q=self.r['clarifications'][0]
    def test_old_request_without_extension(self):
        del self.r['clarifications'];self.assertEqual(check_request(self.r),[])
    def test_material_unresolved_is_valid_capture(self):self.assertEqual(check_request(self.r),[])
    def test_assumed_material_decision_rejected(self):
        self.q['status']='BOUNDED_ASSUMPTION';self.assertTrue(check_request(self.r))
    def test_small_bounded_assumption(self):
        self.q.update(material=False,status='BOUNDED_ASSUMPTION');self.assertEqual(check_request(self.r),[])
    def test_duplicate_questions(self):self.r['clarifications']*=2;self.assertTrue(check_request(self.r))
    def test_duplicate_options(self):self.q['options']*=2;self.assertTrue(check_request(self.r))
    def test_unknown_recommendation(self):self.q['recommendation_id']='invented';self.assertTrue(check_request(self.r))
    def test_recommendation_without_reason(self):self.q['recommendation_reason']=None;self.assertTrue(check_request(self.r))
    def test_missing_decision(self):self.q['status']='RESOLVED';self.assertTrue(check_request(self.r))
    def test_resolved_with_reference_not_authentication(self):
        self.q.update(status='RESOLVED',decision_ref='urn:fixture:decision');self.assertEqual(check_request(self.r),[])
    def test_unresolved_cannot_claim_decision(self):self.q['decision_ref']='urn:fixture:decision';self.assertTrue(check_request(self.r))
    def test_unknown_authority_field(self):self.q['permission_granted']=True;self.assertTrue(check_request(self.r))
    def test_boolean_is_not_string(self):self.q['material']='false';self.assertTrue(check_request(self.r))
    def test_capture_timestamp_needs_timezone(self):self.r['source']['captured_at']='2026-10-12T12:00:00';self.assertTrue(check_request(self.r))
    def test_unavailable_options_are_not_invented(self):
        self.q.update(options=[],recommendation_id=None,recommendation_reason='Insufficient alternatives; ask for missing fact.')
        self.assertEqual(check_request(self.r),[])

class DeliveryRecords(unittest.TestCase):
    def setUp(self):
        t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup);self.root=Path(t.name)
        self.p=load(ROOT/'templates/PROJECT.json');self.s=load(ROOT/'templates/STATE.json')
        self.d=self.s['delivery'];self.g=self.d['git_observation']
    def errors(self,ready=False):return check_state(self.s,self.root,ready=ready)
    def proof(self):
        (self.root/'proof.txt').write_text('Fixture execution output; no live model.\n')
        e=load(ROOT/'templates/EVIDENCE.json')
        e.update(id='CHECK-1',criterion_ids=['C1'],result='PASS',candidate_sha256='a'*64,environment_id='fixture',started_at=now(),finished_at=now(),target_count=1,tests_executed=1,artifacts=[{'path':'proof.txt','sha256':sha(self.root/'proof.txt')}],limitations=[])
        self.s.update(candidate_sha256='a'*64,environment_id='fixture',goals=[{'id':'G1','outcome':'Fixture objective','criteria':[{'id':'C1','description':'Fixture acceptance','required':True}]}],work=[{'id':'W1','description':'Fixture work','goal_id':'G1','status':'VERIFIED','criterion_ids':['C1'],'depends_on':[],'blocker':None}],checks=[e])
        return e
    def finding(self):
        f=dict(id='F1',rule_id='AGHR-041',kind='MONITORING_GAP',severity='CRITICAL',expected='Observable decision',observed='Missing trace',evidence_ids=[],status='OPEN',decision_ref=None,retest_evidence_ids=[])
        self.d['findings']=[f];return f
    def test_old_state_without_extension(self):del self.s['delivery'];self.assertEqual(self.errors(),[])
    def test_empty_extension_valid_not_ready(self):self.assertEqual(self.errors(),[]);self.assertTrue(self.errors(True))
    def test_continuous_without_grant(self):self.d['execution_mode']='CONTINUOUS_WITHIN_GRANT';self.assertTrue(self.errors())
    def test_recorded_grant_not_permission(self):
        self.d.update(execution_mode='CONTINUOUS_WITHIN_GRANT',grant_ref='urn:fixture:grant')
        self.assertEqual(self.errors(),[]);self.assertFalse(progress_report(self.p,self.s,self.root)['permission_granted'])
    def test_no_guessed_main_branch(self):self.assertIsNone(progress_report(self.p,self.s,self.root)['git_observation']['default_branch'])
    def test_branch_requires_evidence(self):self.g['branch']='feature/example';self.assertTrue(self.errors())
    def test_default_branch_requires_evidence(self):self.g['default_branch']='trunk';self.assertTrue(self.errors())
    def test_remote_claim_requires_evidence(self):self.g['remote_checked']=True;self.assertTrue(self.errors())
    def test_valid_recorded_branch(self):
        self.g.update(branch='feature/example',observed_at=now(),evidence_ref='urn:fixture:git');self.assertEqual(self.errors(),[])
    def test_duplicate_unmerged_branch(self):
        self.g.update(unmerged_branches=['branch-a','branch-a'],observed_at=now(),evidence_ref='urn:fixture:git');self.assertTrue(self.errors())
    def test_full_measurement_without_baseline(self):self.d['measurement_scope_complete']=True;self.assertTrue(self.errors())
    def test_unknown_finding_evidence(self):self.finding()['evidence_ids']=['missing'];self.assertTrue(self.errors())
    def test_violation_requires_evidence(self):self.finding()['kind']='OBSERVED_VIOLATION';self.assertTrue(self.errors())
    def test_unknown_monitoring_not_violation(self):self.finding();self.assertEqual(self.errors(),[])
    def test_approved_replan_requires_decision(self):self.finding()['kind']='APPROVED_REPLAN';self.assertTrue(self.errors())
    def test_accepted_limitation_requires_decision(self):self.finding()['status']='ACCEPTED_LIMITATION';self.assertTrue(self.errors())
    def test_resolved_needs_retest(self):self.finding()['status']='RESOLVED';self.assertTrue(self.errors())
    def test_failed_retest_does_not_resolve(self):
        e=self.proof();e['result']='FAIL';self.s['work'][0]['status']='IMPLEMENTED'
        f=self.finding();f.update(status='RESOLVED',retest_evidence_ids=['CHECK-1']);self.assertTrue(self.errors())
    def test_valid_retest_record(self):
        self.proof();f=self.finding();f.update(status='RESOLVED',retest_evidence_ids=['CHECK-1']);self.assertEqual(self.errors(True),[])
    def test_critical_finding_blocks_readiness(self):self.proof();self.finding();self.assertTrue(self.errors(True))
    def test_fraction_none_for_empty_denominator(self):self.assertIsNone(progress_report(self.p,self.s,self.root)['criterion_evidence_fraction'])
    def test_valid_criterion_evidence_fraction(self):
        self.proof();x=progress_report(self.p,self.s,self.root);self.assertEqual(x['criterion_evidence_fraction'],1.0);self.assertEqual(x['release_acceptance'],'NOT_GRANTED')
    def test_finished_task_not_complete_product(self):
        self.proof();self.s['goals'][0]['criteria'].append({'id':'C2','description':'Missing product capability','required':True})
        x=progress_report(self.p,self.s,self.root);self.assertEqual(x['tasks_with_verified_status'],1);self.assertEqual(x['criterion_evidence_fraction'],0.5)
    def test_changed_artifact_fails_report(self):
        self.proof();(self.root/'proof.txt').write_text('tampered');self.assertEqual(progress_report(self.p,self.s,self.root)['status'],'FAIL')
    def test_conflicting_evidence_not_silently_selected(self):
        e=self.proof();failure=copy.deepcopy(e);failure.update(id='CHECK-2',result='FAIL');self.s['checks'].append(failure)
        x=progress_report(self.p,self.s,self.root);self.assertEqual(x['status'],'EVIDENCE_CONFLICT');self.assertEqual(x['criteria_with_checked_pass_evidence'],0);self.assertTrue(self.errors(True))
    def test_unobserved_scope_not_full_compliance(self):
        x=progress_report(self.p,self.s,self.root);self.assertFalse(x['measurement_scope_complete_as_declared']);self.assertEqual(x['overall_compliance_verdict'],'NOT_ASSESSED')
    def test_external_snapshot_requires_refresh(self):
        self.p.update(canonical_backend='DECLARED_EXTERNAL',external_backend_ref='urn:fixture:tracker')
        self.assertTrue(progress_report(self.p,self.s,self.root)['external_snapshot_needs_refresh'])
    def test_identity_mismatch_fails(self):self.p['project_id']='other';self.assertEqual(progress_report(self.p,self.s,self.root)['status'],'FAIL')
    def test_critical_visible_amid_success(self):
        self.proof();self.finding();x=progress_report(self.p,self.s,self.root);self.assertEqual(x['open_critical_findings'],['F1']);self.assertEqual(x['overall_compliance_verdict'],'NOT_ASSESSED')

class DeliveryCLI(unittest.TestCase):
    def setUp(self):
        t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup);self.root=Path(t.name)
        self.initial=init_project(self.root,'Synthetic fixture','Fixture owner')
    def test_init_references_current_version(self):self.assertEqual(load(self.root/'.aghr/INITIALIZATION.json')['reference_version'],'1.1.0')
    def test_progress_read_only(self):
        def snapshot():return {p.relative_to(self.root).as_posix():sha(p) for p in self.root.rglob('*') if p.is_file()}
        before=snapshot();stream=io.StringIO()
        with contextlib.redirect_stdout(stream):code=main(['progress','--project',str(self.root)])
        self.assertEqual(code,0);self.assertEqual(before,snapshot());self.assertFalse(json.loads(stream.getvalue())['permission_granted'])
    def test_clarification_capture_no_execution(self):
        p=self.root/'question.json';save_new(p,load(ROOT/'examples/REQUEST_WITH_CLARIFICATION.json'))
        result=capture_request(self.root,p);self.assertEqual(result['execution'],'NOT_AUTHORIZED_BY_CAPTURE')
    def test_material_assumption_capture_rejected(self):
        q=load(ROOT/'examples/REQUEST_WITH_CLARIFICATION.json');q['clarifications'][0]['status']='BOUNDED_ASSUMPTION'
        p=self.root/'question.json';save_new(p,q)
        with self.assertRaises(GovernanceError):capture_request(self.root,p)
