import copy
import json
from pathlib import Path
import tempfile
import unittest
from agdl.assurance import validate_record, continuity
from agdl.io import digest
from tests.fixtures import make_fixture

class AssuranceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='agdl_test_');self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.record=make_fixture(self.root)
    def run_check(self,stage='G5',revision='fixture-revision-1'):
        return validate_record(self.record,self.root,'request.txt',stage,revision)
    def assertIssue(self,needle,report=None):
        report=self.run_check() if report is None else report
        self.assertTrue(any(needle in x for x in report['issues']+report['unknowns']),report)
    def test_complete_metadata_is_not_approval(self):
        r=self.run_check();self.assertEqual(r['verdict'],'METADATA_READY_FOR_REVIEW',r)
        for k in ('authorization_authenticated','runtime_enforcement_verified','semantic_completeness_verified','independent_review_verified','execution_performed'):self.assertIs(r[k],False)
    def test_G1_does_not_grant_execution(self):
        r=self.run_check('G1');self.assertEqual(r['exit_code'],0);self.assertFalse(r['execution_performed'])
    def test_original_request_drift(self):
        (self.root/'request.txt').write_text('Different request.\n');self.assertIssue('original_source_hash_mismatch')
    def test_missing_source_unit(self):
        self.record['rcca']['source_units'].pop();self.assertIssue('missing_source_unit')
    def test_missing_mandatory_oracle(self):
        self.record['rcca']['requirements'][0]['acceptance']['oracle']='';self.assertIssue('unverifiable')
    def test_duplicate_requirement(self):
        self.record['rcca']['requirements'].append(copy.deepcopy(self.record['rcca']['requirements'][0]));self.assertIssue('duplicate_requirement_id')
    def test_duplicate_reference(self):
        self.record['references'].append(copy.deepcopy(self.record['references'][0]));self.assertIssue('duplicate_reference')
    def test_duplicate_evidence(self):
        self.record['evidence'].append(copy.deepcopy(self.record['evidence'][0]));self.assertIssue('duplicate_evidence')
    def test_duplicate_task(self):
        self.record['tasks'].append(copy.deepcopy(self.record['tasks'][0]));self.assertIssue('duplicate_task')
    def test_unknown_normative_level(self):
        self.record['rcca']['requirements'][0]['normative']='IMPORTANT';self.assertIssue('schema:')
    def test_typed_contract_rejects_unhashable_id(self):
        self.record['rcca']['source_units'][0]['unit_id']=[];self.assertIssue('schema:')
    def test_extra_field_cannot_claim_system_authority(self):
        self.record['system_override']=True;self.assertIssue('additional_property')
    def test_source_hash_format(self):
        self.record['rcca']['source_sha256']='nonsense';self.assertIssue('schema:')
    def test_missing_binding(self):
        del self.record['bindings']['REQ-001'];self.assertIssue('requirement_binding_missing')
    def test_binding_unknown_requirement(self):
        self.record['bindings']['REQ-NO']=copy.deepcopy(self.record['bindings']['REQ-001']);self.assertIssue('binding_unknown_requirement')
    def test_missing_spec_link_requires_reason(self):
        self.record['bindings']['REQ-001']['spec_refs']=[];self.assertIssue('spec_link_or_proportionality_reason_missing')
    def test_quick_fix_need_not_create_spec(self):
        b=self.record['bindings']['REQ-001'];b['spec_refs']=[];b['no_spec_reason']='The exact source and oracle suffice for this isolated quick fix.'
        self.assertEqual(self.run_check()['exit_code'],0)
    def test_quick_fix_need_not_create_task_database(self):
        b=self.record['bindings']['REQ-001'];b['task_refs']=[];b['no_task_reason']='One atomic task is the request itself.'
        self.assertEqual(self.run_check()['exit_code'],0)
    def test_unknown_task_link(self):
        self.record['bindings']['REQ-001']['task_refs']=['T404'];self.assertIssue('binding_task_missing')
    def test_missing_implementation_snapshot(self):
        self.record['bindings']['REQ-001']['implementation_refs']=[];self.assertIssue('implementation_snapshot_missing')
    def test_implementation_file_changed(self):
        (self.root/'src/feature.py').write_text('pass\n');self.assertIssue('reference_hash_mismatch:IMPL-1')
    def test_spec_changed_without_refresh(self):
        (self.root/'spec.md').write_text('Different acceptance.\n');self.assertIssue('reference_hash_mismatch:SPEC-1')
    def test_log_changed(self):
        (self.root/'test.log').write_text('FAKE NEW LOG');self.assertIssue('reference_hash_mismatch:LOG-1')
    def test_missing_log_is_unknown_not_pass(self):
        (self.root/'test.log').unlink();self.assertIssue('reference_unreadable:LOG-1');self.assertNotEqual(self.run_check()['exit_code'],0)
    def test_wrong_artifact_kind(self):
        self.record['evidence'][0]['artifact_ref']='SPEC-1';self.assertIssue('evidence_artifact_wrong_kind')
    def test_wrong_spec_kind(self):
        self.record['bindings']['REQ-001']['spec_refs']=['IMPL-1'];self.assertIssue('spec_reference_wrong_kind')
    def test_wrong_implementation_kind(self):
        self.record['bindings']['REQ-001']['implementation_refs']=['SPEC-1'];self.assertIssue('implementation_reference_wrong_kind')
    def test_evidence_revision_stale(self):
        self.record['evidence'][0]['subject_revision']='old';self.assertIssue('evidence_revision_stale')
    def test_evidence_request_stale(self):
        self.record['evidence'][0]['source_sha256']='0'*64;self.assertIssue('evidence_request_stale')
    def test_current_revision_mismatch(self):
        self.assertIssue('current_revision_mismatch',self.run_check(revision='different'))
    def test_missing_current_revision(self):
        self.assertIssue('current_revision_not_supplied',self.run_check(revision=None))
    def test_synthetic_evidence_not_live(self):
        self.record['environment']='PROJECT';self.assertIssue('synthetic_evidence_for_project')
    def test_evidence_pointer_must_match(self):
        self.record['rcca']['requirements'][0]['verification']['evidence_ref']='invented';self.assertIssue('rcca_evidence_pointer_not_linked')
    def test_missing_evidence(self):
        self.record['bindings']['REQ-001']['evidence_refs']=[];self.assertIssue('missing_verification')
    def test_nonreciprocal_evidence(self):
        self.record['evidence'][0]['requirement_ids']=['REQ-002'];self.assertIssue('evidence_link_not_reciprocal')
    def test_failed_negative_control(self):
        self.record['evidence'][1]['result']='FAILED';self.assertIssue('evidence_not_passed:EV-2')
    def test_not_run_not_pass(self):
        self.record['rcca']['requirements'][0]['verification']['status']='NOT_RUN';self.assertIssue('verification_not_passed')
    def test_unknown_implementation_not_missing(self):
        self.record['rcca']['requirements'][0]['implementation_state']='UNKNOWN'
        r=self.run_check();self.assertIn('implementation_unknown:REQ-001',r['unknowns']);self.assertNotIn('missing_implementation:REQ-001',r['issues'])
    def test_explicit_unimplemented(self):
        self.record['rcca']['requirements'][0]['implementation_state']='NOT_IMPLEMENTED';self.assertIssue('missing_implementation')
    def test_unknown_applicability(self):
        self.record['rcca']['requirements'][0]['applicability']='UNKNOWN';self.assertIssue('applicability_unknown')
    def test_exception_needs_decision(self):
        self.record['rcca']['requirements'][0]['applicability']='NOT_APPLICABLE';self.assertIssue('not_applicable_without_decision')
    def test_exception_record_does_not_authenticate_owner(self):
        req=self.record['rcca']['requirements'][0];req['applicability']='NOT_APPLICABLE';req['exception']={'approved':True,'authority_reference':'DECISION-1'}
        r=self.run_check();self.assertEqual(r['exit_code'],0);self.assertFalse(r['authorization_authenticated'])
    def test_should_requires_deviation(self):
        q=self.record['rcca']['requirements'][0];q['normative']='SHOULD';q['verification']['status']='NOT_RUN';self.assertIssue('should_deviation_unrecorded')
    def test_should_can_deviate_with_reason(self):
        q=self.record['rcca']['requirements'][0];q['normative']='SHOULD';q['verification']['status']='NOT_RUN';q['deviation_reason']='Deliberate documented fixture deviation.'
        self.assertEqual(self.run_check()['exit_code'],0)
    def test_self_review_not_independent(self):
        r=self.run_check();self.assertIn('completion_review_self_review_not_independent',r['warnings']);self.assertFalse(r['independent_review_verified'])
    def test_missing_coverage_review(self):
        self.record['coverage_review']['status']='NOT_REVIEWED';self.assertIssue('coverage_review_not_recorded')
    def test_high_risk_needs_external_qualification(self):
        self.record['risk_tier']=self.record['rcca']['risk_tier']='R2';self.assertIssue('high_risk_external_qualification_required')
    def test_unknown_risk(self):
        self.record['risk_tier']=self.record['rcca']['risk_tier']='UNKNOWN';self.assertIssue('risk_tier_unknown')
    def test_risk_mismatch(self):
        self.record['risk_tier']='R1';self.assertIssue('risk_tier_mismatch')
    def test_unresolved_conflict(self):
        self.record['rcca']['conflicts']=[{'status':'OPEN'}];self.assertIssue('unresolved_authority_conflict')
    def test_unknown_authorization(self):
        self.record['rcca']['authorization']['status']='UNKNOWN';self.assertIssue('authorization_not_verified')
    def test_grant_ref_is_required(self):
        self.record['rcca']['authorization']['source_ref']='SPEC-1';self.assertIssue('delegation_reference_invalid')
    def test_valid_hash_does_not_authenticate_forged_content(self):
        (self.root/'test.log').write_text('This file asserts PASS without proof.\n')
        for ref in self.record['references']:
            if ref['id']=='LOG-1':ref['sha256']=digest((self.root/'test.log').read_bytes())
        r=self.run_check();self.assertFalse(r['semantic_completeness_verified']);self.assertFalse(r['authorization_authenticated'])
        self.assertIn('evidence_contents_and_semantic_oracles_require_review',r['warnings'])
    def test_reference_to_sensitive_file_rejected(self):
        self.record['references'][0]['path']='.env';self.assertIssue('sensitive_path_not_read')
    def test_readonly_no_file_changes(self):
        before={str(p.relative_to(self.root)):p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        self.run_check()
        after={str(p.relative_to(self.root)):p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        self.assertEqual(before,after)

    def test_unknown_revision_label_not_verified(self):
        self.record['subject_revision']='UNKNOWN'
        for ev in self.record['evidence']: ev['subject_revision']='UNKNOWN'
        self.assertIssue('current_revision_not_supplied',self.run_check(revision='UNKNOWN'))
    def test_whitespace_revision_not_verified(self):
        self.record['subject_revision']=' '
        for ev in self.record['evidence']: ev['subject_revision']=' '
        self.assertIssue('current_revision_not_supplied',self.run_check(revision=' '))
    def test_reviewed_without_reviewer_not_verified(self):
        self.record['coverage_review']['reviewer']=' '
        self.assertIssue('coverage_review_reviewer_not_recorded')
    def test_linked_task_incomplete_not_done(self):
        self.record['tasks'][0]['status']='DOING'
        self.assertIssue('linked_task_not_complete')

class ContinuityTests(AssuranceTests):
    # Only the dedicated methods below are collected for this class, see loader below.
    def test_continuity_unknown_revision(self):
        self.record['subject_revision']='UNKNOWN'
        self.assertIssue('resume_revision_not_known',continuity(self.record,'UNKNOWN'))
    def test_continuity_ready_task(self):
        self.record['tasks'].append({'id':'T002','source_ref':'TASKS-1','status':'TODO','depends_on':['T001']})
        self.assertEqual(continuity(self.record,'fixture-revision-1')['candidate_ready_task_refs'],['T002'])
    def test_continuity_cycle(self):
        self.record['tasks'][0]['depends_on']=['T001'];self.assertIssue('dependency_cycle',continuity(self.record,'fixture-revision-1'))
    def test_continuity_unknown_dependency(self):
        self.record['tasks'][0]['depends_on']=['T999'];self.assertIssue('unknown_dependency',continuity(self.record,'fixture-revision-1'))
    def test_continuity_done_before_dependency(self):
        self.record['tasks'].append({'id':'T002','source_ref':'TASKS-1','status':'TODO','depends_on':[]})
        self.record['tasks'][0]['depends_on']=['T002'];self.assertIssue('unsatisfied_dependency',continuity(self.record,'fixture-revision-1'))
    def test_continuity_revision_change(self):
        r=continuity(self.record,'changed');self.assertEqual(r['candidate_ready_task_refs'],[]);self.assertIssue('resume_revision_changed',r)
    def test_continuity_blocked_is_not_ready(self):
        self.record['tasks'][0]['status']='BLOCKED';self.assertEqual(continuity(self.record,'fixture-revision-1')['candidate_ready_task_refs'],[])

def load_tests(loader, tests, pattern):
    suite=unittest.TestSuite(loader.loadTestsFromTestCase(AssuranceTests))
    for name in ContinuityTests.__dict__:
        if name.startswith('test_continuity_'):suite.addTest(ContinuityTests(name))
    return suite
