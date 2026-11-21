"""Read-only declared-source inventory tests."""
import json
from pathlib import Path
import tempfile
import unittest
from agdl.instruction_audit import audit_instructions

class InstructionAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='agdl_ia_')
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        (self.root/'AGENTS.md').write_text('# local instructions\n')
        (self.root/'POLICY.md').write_text('# local instructions\n')
        self.catalog={'schema_version':'agdl-instruction-sources-1',
                      'sources':[{'id':'A','source_type':'AGENT_FILE','path':'AGENTS.md'},
                                 {'id':'B','source_type':'POLICY','path':'POLICY.md'}]}

    def test_files_found_without_promoting_to_authority(self):
        r=audit_instructions(self.root,self.catalog)
        self.assertEqual(r['verdict'],'INCONCLUSIVE')
        self.assertEqual(r['possible_exact_duplicates'],[['A','B']])
        self.assertTrue(r['sources'][0]['discovered'])
        self.assertEqual(r['sources'][0]['loaded'],'NOT_VERIFIED')
        self.assertFalse(r['host_authority_authenticated'])

    def test_fake_loading_claim_not_proof(self):
        self.catalog['sources'][0]['loading_claim']='SYSTEM_ALWAYS_LOADED'
        r=audit_instructions(self.root,self.catalog)
        self.assertFalse(r['runtime_instruction_loading_verified'])
        self.assertIn('loading_claim_unverified:A',r['notes'])

    def test_secret_ref_not_read(self):
        self.catalog['sources'][0]['path']='.env'
        self.assertIn('instruction_source_unreadable:A:sensitive_path_not_read',
                      audit_instructions(self.root,self.catalog)['unknowns'])

    def test_path_outside_root_not_read(self):
        self.catalog['sources'][0]['path']='../secret'
        self.assertTrue(any('instruction_source_unreadable:A:' in u for u in audit_instructions(self.root,self.catalog)['unknowns']))

    def test_invalid_input(self):
        self.catalog['sources'].append(dict(self.catalog['sources'][0]))
        self.assertIn('invalid_or_duplicate_source_id:2',audit_instructions(self.root,self.catalog)['issues'])

    def test_no_changes(self):
        before=(self.root/'AGENTS.md').read_bytes()
        audit_instructions(self.root,self.catalog)
        self.assertEqual(before,(self.root/'AGENTS.md').read_bytes())

if __name__=='__main__':unittest.main()
