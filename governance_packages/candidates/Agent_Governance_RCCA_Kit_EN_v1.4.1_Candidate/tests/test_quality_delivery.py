"""Single-source documents, coverage designs and offline CLI smoke tests."""
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from tools.build_quality_docs import generated_views
from tests.quality_fixtures import make_quality_fixture, measurement
ROOT=Path(__file__).resolve().parents[1]


class QualityDeliveryTests(unittest.TestCase):
    def test_generated_documents_match_source(self):
        for name,text in generated_views().items():self.assertEqual((ROOT/name).read_text(),text,name)
    def test_24_stable_adeq_ids(self):
        rows=json.loads((ROOT/'policies/ADEQ_RULES.json').read_text())['rules']
        self.assertEqual([r['id'] for r in rows],[f'ADEQ-{i:02d}' for i in range(1,25)])
    def test_seven_components(self):
        rows=json.loads((ROOT/'workflows/QUALITY_WORKFLOWS.json').read_text())['workflows']
        self.assertEqual([r['id'] for r in rows],[f'INT-{i:02d}' for i in range(1,8)])
    def test_all_qa_cases_remain_live_not_run(self):
        rows=json.loads((ROOT/'evaluations/ADEQ_BEHAVIORAL_CASES.json').read_text())['cases']
        self.assertEqual(len(rows),20);self.assertTrue(all(r['live_status']=='NOT_RUN' for r in rows))
        self.assertTrue(all(r['holdout'] is False for r in rows))
    def test_governance_links_resolve(self):
        gov={r['id'] for r in json.loads((ROOT/'policies/RULES.json').read_text())['rules']}
        for r in json.loads((ROOT/'policies/ADEQ_RULES.json').read_text())['rules']:self.assertIn(r['governance_ref'],gov)
    def test_workflow_rule_links_resolve(self):
        rules={r['id'] for r in json.loads((ROOT/'policies/ADEQ_RULES.json').read_text())['rules']}
        for r in json.loads((ROOT/'workflows/QUALITY_WORKFLOWS.json').read_text())['workflows']:
            self.assertTrue(set(r['adeq'])<=rules)
    def test_core_entry_is_bounded(self):self.assertLess(len((ROOT/'policies/CORE.md').read_text().split()),650)
    def test_skill_resources_exist(self):
        import re
        p=ROOT/'skills/adeq-quality/SKILL.md'
        for rel in re.findall(r'\]\(([^)]+)\)',p.read_text()):self.assertTrue((p.parent/rel).is_file(),rel)
    def test_previous_cli_commands_still_exposed(self):
        from agdl.__main__ import parser
        for name in ('doctor','rules-lint'):
            self.assertEqual(parser().parse_args([name]).command,name)


class QualityCLITests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='adeq_cli_');self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);_,self.q=make_quality_fixture(self.root)
        self.snapshot=self.root/'quality.json';self.snapshot.write_text(json.dumps(self.q))
    def cmd(self,*args):
        r=subprocess.run([sys.executable,'-B','-m','agdl',*args],cwd=ROOT,capture_output=True,text=True,
                         timeout=15,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
        return r,json.loads(r.stdout)
    def test_route_command(self):
        r,j=self.cmd('quality-route','--snapshot',str(self.snapshot));self.assertEqual(r.returncode,0);self.assertEqual(j['profile'],'QUICK')
    def test_check_command(self):
        r,j=self.cmd('quality-check','--snapshot',str(self.snapshot),'--root',str(self.root),'--revision','fixture-revision-1')
        self.assertEqual(r.returncode,0);self.assertEqual(j['stage'],'PRE')
    def test_converge_command(self):
        r,j=self.cmd('converge','--snapshot',str(self.snapshot),'--root',str(self.root),'--revision','fixture-revision-1')
        self.assertEqual(r.returncode,0);self.assertEqual(j['stage'],'POST');self.assertFalse(j['execution_performed'])
    def test_compare_command(self):
        b=self.root/'before.json';a=self.root/'after.json';b.write_text(json.dumps(measurement()));a.write_text(json.dumps(measurement('AFTER')))
        r,j=self.cmd('quality-compare','--before',str(b),'--after',str(a));self.assertEqual(r.returncode,0);self.assertFalse(j['causal_effect_established'])
    def test_invalid_json_no_success(self):
        self.snapshot.write_text('{');r,j=self.cmd('quality-route','--snapshot',str(self.snapshot));self.assertEqual(r.returncode,3)
    def test_duplicate_json_key_no_success(self):
        self.snapshot.write_text('{"context":{},"context":{}}');r,j=self.cmd('quality-route','--snapshot',str(self.snapshot));self.assertEqual(r.returncode,3)
