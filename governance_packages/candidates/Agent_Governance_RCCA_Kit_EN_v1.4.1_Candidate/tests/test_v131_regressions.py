"""Issue-specific 1.3.1 regressions (synthetic, not host qualification)."""
from __future__ import annotations
import copy
from pathlib import Path
import tempfile
import unittest
from agdl.assurance import validate_record, continuity
from tests.fixtures import make_fixture

class GateAndScopeRegressions(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='agdl_131_')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.record = make_fixture(self.root)

    def gate(self, stage='G5', record=None):
        return validate_record(record if record is not None else self.record,
                               self.root, 'request.txt', stage, 'fixture-revision-1')

    def issues(self, report):
        return report['issues'] + report['unknowns']

    def test_F01_linked_done_task_with_incomplete_dependency_must_fail(self):
        self.record['tasks'].append({'id':'T002','source_ref':'TASKS-1','status':'TODO','depends_on':[]})
        self.record['tasks'][0]['depends_on']=['T002']
        r=self.gate()
        self.assertEqual(r['verdict'],'GAPS_FOUND')
        self.assertIn('unsatisfied_dependency:T001:T002',r['issues'])

    def test_F01_transitive_incomplete_dependency_must_fail(self):
        self.record['tasks'] += [
            {'id':'T002','source_ref':'TASKS-1','status':'DONE','depends_on':['T003']},
            {'id':'T003','source_ref':'TASKS-1','status':'TODO','depends_on':[]},
        ]
        self.record['tasks'][0]['depends_on']=['T002']
        self.assertIn('unsatisfied_dependency:T002:T003',self.gate()['issues'])

    def test_F01_missing_dependency_must_fail(self):
        self.record['tasks'][0]['depends_on']=['UNKNOWN-TASK']
        self.assertIn('unknown_dependency:T001:UNKNOWN-TASK',self.gate()['issues'])

    def test_F01_cycle_with_done_tasks_must_fail(self):
        self.record['tasks'][0]['depends_on']=['T001']
        self.assertIn('dependency_cycle:T001',self.gate()['issues'])

    def test_F01_unrelated_optional_cycle_does_not_block_scoped_completion(self):
        self.record['tasks'].append({'id':'OPT','source_ref':'TASKS-1',
                                      'status':'TODO','depends_on':['OPT'],
                                      'completion_scope':'OPTIONAL'})
        self.assertEqual(self.gate()['verdict'],'METADATA_READY_FOR_REVIEW')
        self.assertIn('dependency_cycle:OPT', continuity(self.record, 'fixture-revision-1')['issues'])

    def test_F02_unclassified_unbound_todo_is_unknown_not_pass(self):
        self.record['tasks'].append({'id':'T999','source_ref':'TASKS-1','status':'TODO','depends_on':[]})
        r=self.gate()
        self.assertEqual(r['verdict'],'INCONCLUSIVE')
        self.assertIn('unclassified_unbound_task:T999',r['unknowns'])

    def test_F02_explicit_required_unbound_todo_fails(self):
        self.record['tasks'].append({'id':'T999','source_ref':'TASKS-1','status':'TODO','depends_on':[],
                                      'completion_scope':'REQUIRED'})
        self.assertIn('required_task_not_complete:T999',self.gate()['issues'])

    def test_F02_explicit_optional_unbound_todo_does_not_block(self):
        self.record['tasks'].append({'id':'T999','source_ref':'TASKS-1','status':'TODO','depends_on':[],
                                      'completion_scope':'OPTIONAL'})
        self.assertEqual(self.gate()['exit_code'],0)

    def test_F02_deferred_requires_decision_reference(self):
        self.record['tasks'].append({'id':'T999','source_ref':'TASKS-1','status':'TODO','depends_on':[],
                                      'completion_scope':'DEFERRED'})
        self.assertIn('task_exclusion_decision_missing:T999',self.gate()['issues'])

    def test_F02_deferred_with_checked_decision_warns_not_authenticates(self):
        self.record['tasks'].append({'id':'T999','source_ref':'TASKS-1','status':'TODO','depends_on':[],
                                      'completion_scope':'DEFERRED','scope_decision_ref':'DECISION-1'})
        r=self.gate()
        self.assertEqual(r['exit_code'],0)
        self.assertFalse(r['authorization_authenticated'])
        self.assertIn('task_exclusion_owner_authority_not_authenticated:T999',r['warnings'])
        self.assertNotIn('T999',continuity(self.record,'fixture-revision-1')['candidate_ready_task_refs'])

    def test_F02_mandatory_task_cannot_be_marked_optional(self):
        self.record['tasks'][0]['completion_scope']='OPTIONAL'
        self.assertTrue(any(x.startswith('mandatory_task_scope_conflict:T001') for x in self.gate()['issues']))

    def test_F03_G1_does_not_require_bindings(self):
        self.record['bindings']={}
        self.assertEqual(self.gate('G1')['exit_code'],0)
        self.assertIn('requirement_binding_missing:REQ-001',self.gate('G5')['issues'])

    def test_F03_G1_accepts_initial_extract_only_envelope(self):
        early={k:copy.deepcopy(self.record[k]) for k in ('schema_version','record_kind','rcca')}
        self.assertEqual(self.gate('G1',early)['exit_code'],0)

    def test_F03_G2_does_not_require_G5_references(self):
        early={k:copy.deepcopy(self.record[k]) for k in ('schema_version','record_kind','rcca','references','risk_tier')}
        self.assertEqual(self.gate('G2',early)['exit_code'],0)

    def test_F03_G2_grant_hash_mismatch_is_found(self):
        self.record['references'][-2]['sha256']='0'*64  # grant is second-last
        early={k:copy.deepcopy(self.record[k]) for k in ('schema_version','record_kind','rcca','references','risk_tier')}
        self.assertIn('delegation_reference_hash_mismatch',self.gate('G2',early)['issues'])

    def test_F03_G1_does_not_fake_owner_authorization(self):
        r=self.gate('G1')
        self.assertFalse(r['authorization_authenticated'])
        self.assertFalse(r['runtime_enforcement_verified'])

    def test_existing_fixture_still_passes_G5(self):
        self.assertEqual(self.gate()['verdict'],'METADATA_READY_FOR_REVIEW')

    def test_invalid_completion_scope_fails_schema(self):
        self.record['tasks'][0]['completion_scope']='ALWAYS_DONE'
        self.assertTrue(any(x.startswith('schema:') for x in self.gate()['issues']))

    def test_G1_does_not_validate_future_task_scope(self):
        self.record['tasks'][0]['completion_scope']='ALWAYS_DONE'
        self.assertEqual(self.gate('G1')['exit_code'],0)

if __name__ == '__main__':
    unittest.main()
