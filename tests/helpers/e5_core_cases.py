"""Real Python proposal checks; local candidate evidence, no E4 execution."""
import json
from pathlib import Path
import sys
import unittest

root = Path(sys.argv.pop(1))
sys.path.insert(0, str(root / 'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools'))
sys.path.insert(0, str(root / 'server/studio/aghr/e5'))
import core

engine = root / 'governance_packages/candidates/AGHR_rc3_Core_Candidate'
base = {'base_package_version': '1.0.0-rc.3', 'base_candidate_hash': 'sha256:' + 'a' * 64}
observation = json.loads((engine / 'policies/observations/reference-state.json').read_text(encoding='utf-8'))
observation['id'] = 'OBS-E5-PYTHON-001'

def proposal(item):
    return {'title': 'مقترح 😀', 'kind': item['kind'], 'proposed_yaml': json.dumps(item, ensure_ascii=False) + '\r\n'}

class Cases(unittest.TestCase):
    def test_rfc_numbers(self):
        self.assertEqual(core.canonical([333333333.33333329, 1e30, 4.50, 2e-3, 1e-27, -0.0, 1e-6, 1e-7, 1e20, 1e21]),
                         b'[333333333.3333333,1e+30,4.5,0.002,1e-27,0,0.000001,1e-7,100000000000000000000,1e+21]')

    def test_utf16_and_escaping(self):
        value={'\ufb33': 'last', '\U0001f600': 'emoji', '\r': '\x00\b\t\n\f\r"\\/', 'e\u0301': 'unchanged'}
        self.assertEqual(list(json.loads(core.canonical(value))), ['\r', 'e\u0301', '\U0001f600', '\ufb33'])
        self.assertIn(b'\\u0000\\b\\t\\n\\f\\r\\"\\\\/', core.canonical(value))
        for invalid in [float('inf'), float('nan'), '\ud800', {'\udfff':'bad'}]:
            with self.assertRaises(ValueError): core.canonical(invalid)

    def test_exact_yaml_bytes_and_seven_fields(self):
        p=proposal(observation); a=core.prepare(p,base)
        self.assertEqual(len(a['payload']),7)
        self.assertIsNone(a['payload']['source']); self.assertIsNone(a['payload']['target_item_id'])
        p['proposed_yaml']=p['proposed_yaml'].replace('\r\n','\n')
        self.assertNotEqual(a['proposal_version_hash'],core.prepare(p,base)['proposal_version_hash'])

    def test_numeric_origin(self):
        p=proposal(observation); p['source']={'type':'calibration','ref':'fixture','eval_run_id':'NOT_RUN','measured_delta':1e20,'reason':'hash only'}
        self.assertIn(b'100000000000000000000', __import__('base64').b64decode(core.prepare(p,base)['canonical_base64']))

    def test_real_e2_policy(self):
        self.assertEqual(core.verify(proposal(observation),base,engine)['exit_code'],0)
        item=json.loads((root/'governance_packages/candidates/AGHR_T12_Candidate/policies/drafts/AGHR-001.json').read_text(encoding='utf-8'))
        blocked=core.verify(proposal(item),base,engine)
        self.assertEqual(blocked['exit_code'],3)
        self.assertIn('AUTHORITY_SOURCE_UNVERIFIED',[f['code'] for f in blocked['findings']])
        del item['authority']['level']
        with self.assertRaises(ValueError):core.prepare(proposal(item),base)

    def test_wrapper_and_edit(self):
        p=proposal(observation)
        with self.assertRaises(ValueError):core.prepare({**p,'kind':'CONSTRAINT'},base)
        with self.assertRaises(ValueError):core.edit(p,{'proposed_yaml':'x','role':'governance-owner'})

    def test_approval_bound_to_exact_hash(self):
        h=core.prepare(proposal(observation),base)['proposal_version_hash']
        a={'id':1,'package_id':'CP-fixture','role':'governance-owner','approver':'authenticated-fixture','decision':'approve','approved_version_hash':h,'reason':'TEST_ONLY','at':'2026-10-23T00:00:00Z'}
        self.assertTrue(core.approval_binding(h,a))
        with self.assertRaises(ValueError):core.approval_binding('sha256:'+'0'*64,a)
        with self.assertRaises(ValueError):core.approval_binding(h,{**a,'role':'owner-from-body'})

if __name__=='__main__':unittest.main()
