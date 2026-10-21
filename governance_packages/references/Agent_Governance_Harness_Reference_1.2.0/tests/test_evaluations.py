import tempfile
import unittest
from pathlib import Path
from runtime.cli import demo
from runtime.common import load,replace_json
from evaluations.grade import grade

class EvaluationTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.run=Path(self.temp.name)/'demo';demo(self.run)
    def change(self,fn):
        p=self.run/'scenario-results.json';data=load(p);fn(data);replace_json(p,data)
    def test_actual_demo_grades(self):self.assertEqual(grade(self.run)['status'],'PASS')
    def test_zero_cases_cannot_pass(self):self.change(lambda d:d.update(cases=[]));self.assertEqual(grade(self.run)['status'],'FAIL')
    def test_claimed_match_ignored(self):
        def change(d):d['cases'][0]['matched']=True;d['cases'][0]['observed']['result']='NOT_EXECUTED'
        self.change(change);self.assertEqual(grade(self.run)['status'],'FAIL')
    def test_user_expected_decision_cannot_redefine_rubric(self):
        def change(d):d['cases'][2]['expected_decision']='ALLOW';d['cases'][2]['observed']['decision']='ALLOW'
        self.change(change);self.assertEqual(grade(self.run)['status'],'FAIL')
    def test_unauthorized_artifact_fails(self):(self.run/'work/stopped.txt').write_text('unauthorized');self.assertEqual(grade(self.run)['status'],'FAIL')
    def test_final_artifact_tamper_fails(self):(self.run/'work/result.txt').write_text('bad');self.assertEqual(grade(self.run)['status'],'FAIL')
    def test_missing_audit_fails(self):replace_json(self.run/'audit-events.json',[]);self.assertEqual(grade(self.run)['status'],'FAIL')
    def test_denied_effect_snapshot_mismatch_fails(self):
        def change(d):d['cases'][2]['after_files']['work/unexpected.txt']='a'*64
        self.change(change);self.assertEqual(grade(self.run)['status'],'FAIL')
    def test_duplicate_case_fails(self):
        def change(d):d['cases'][1]=d['cases'][0]
        self.change(change);self.assertEqual(grade(self.run)['status'],'FAIL')
    def test_demo_does_not_overwrite_existing(self):
        from runtime.common import GovernanceError
        with self.assertRaises(GovernanceError):demo(self.run)
