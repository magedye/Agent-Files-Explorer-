import copy
import json
import tempfile
import unittest
from pathlib import Path
from runtime.common import ROOT,load,sha
from tools.check_package import schema_audit,row_errors,check

class PackageTests(unittest.TestCase):
    def test_all_schemas_supported(self):
        for p in (ROOT/'schemas').glob('*.schema.json'):
            with self.subTest(schema=p.name):self.assertEqual(schema_audit(load(p)),[])
    def test_unsupported_nested_keyword_rejected(self):
        self.assertTrue(schema_audit({'anyOf':[{'type':'string'},{'format':'unknown'}]}))
    def test_zero_target_inventory_is_not_success(self):self.assertTrue(row_errors([],'id',40,'rules'))
    def test_duplicate_id_rejected(self):self.assertTrue(row_errors([{'id':'x'},{'id':'x'}],'id',2,'rows'))
    def test_missing_id_rejected(self):self.assertTrue(row_errors([{}],'id',1,'rows'))
    def test_active_source_control_targets_complete(self):
        rows=load(ROOT/'compatibility/V4_CONTROL_MAPPING.json')['rows'];rules={r['id'] for r in load(ROOT/'registry/RULES.json')['rules']}
        self.assertEqual(len(rows),48)
        for r in rows:self.assertTrue(r['target_ids']);self.assertLessEqual(set(r['target_ids']),rules)
    def test_frozen_primary_design_digest(self):
        b=load(ROOT/'design/BASELINE.json');self.assertFalse(b['supplementary_v4_content_read'])
        for p,h in b['files'].items():self.assertEqual(sha(ROOT/'design/frozen'/p),h)
    def test_current_file_inventory_not_upstream82(self):
        files=load(ROOT/'compatibility/V4_INVENTORY.json')['files'];disp=load(ROOT/'compatibility/V4_FILE_DISPOSITION.json')['rows']
        self.assertEqual(len(files),73);self.assertEqual({r['path'] for r in files},{r['source_path'] for r in disp})
    def test_no_native_adapter_pass_inferred(self):
        for a in load(ROOT/'adapters/REGISTER.json')['adapters']:self.assertEqual(a['live_qualification'],'NOT_RUN')
    def test_missing_package_cannot_pass(self):
        with tempfile.TemporaryDirectory() as d:self.assertEqual(check(Path(d),preflight=True)['status'],'FAIL')
    def test_inherited_traces_marked_not_reverified(self):
        for p,n in [('V4_INHERITED_88.json',88),('V4_INHERITED_441.json',441)]:
            rows=load(ROOT/'compatibility'/p)['rows'];self.assertEqual(len(rows),n)
            self.assertTrue(all(r['upstream_original_reverified'] is False for r in rows))
    def test_independent_acceptance_not_claimed(self):
        s=load(ROOT/'PACKAGE_STATUS.json');self.assertEqual(s['independent_review'],'NOT_PERFORMED');self.assertEqual(s['release_acceptance'],'NOT_GRANTED')

class SourceArchiveTests(unittest.TestCase):
    def test_zip_prefix_is_removed_explicitly(self):
        import zipfile,hashlib
        from tools.check_package import archive_inventory
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'source.zip'
            with zipfile.ZipFile(p,'w') as z:z.writestr('source/file.md','text')
            self.assertEqual(archive_inventory(p,'source/'),{'file.md':{'bytes':4,'sha256':hashlib.sha256(b'text').hexdigest()}})
    def test_zip_outside_declared_prefix_rejected(self):
        import zipfile
        from tools.check_package import archive_inventory
        from runtime.common import GovernanceError
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'source.zip'
            with zipfile.ZipFile(p,'w') as z:z.writestr('other/file.md','text')
            with self.assertRaises(GovernanceError):archive_inventory(p,'source/')
    def test_zip_traversal_rejected(self):
        import zipfile
        from tools.check_package import archive_inventory
        from runtime.common import GovernanceError
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'source.zip'
            with zipfile.ZipFile(p,'w') as z:z.writestr('source/../escape','text')
            with self.assertRaises(GovernanceError):archive_inventory(p,'source/')

class MutationTests(unittest.TestCase):
    def setUp(self):
        import shutil
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)/'copy'
        shutil.copytree(ROOT,self.root,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
    def mutate(self,path,fn):
        from runtime.common import replace_json
        p=self.root/path;d=load(p);fn(d);replace_json(p,d)
    def test_truncated_control_mapping_fails(self):
        self.mutate('compatibility/V4_CONTROL_MAPPING.json',lambda d:d['rows'].pop())
        r=check(self.root,preflight=True);self.assertEqual(r['status'],'FAIL');self.assertTrue(any('48' in e for e in r['errors']))
    def test_duplicate_rules_do_not_count_as_complete(self):
        self.mutate('registry/RULES.json',lambda d:d['rules'].__setitem__(1,d['rules'][0]))
        r=check(self.root,preflight=True);self.assertEqual(r['status'],'FAIL');self.assertTrue(any('Rule' in e or 'Rules' in e for e in r['errors']))
    def test_invalid_json_matrix_fails(self):
        (self.root/'compatibility/V4_FILE_DISPOSITION.json').write_text('not valid JSON')
        self.assertEqual(check(self.root,preflight=True)['status'],'FAIL')
    def test_missing_critical_file_fails(self):
        (self.root/'contracts/ENFORCEMENT.md').unlink();self.assertEqual(check(self.root,preflight=True)['status'],'FAIL')
    def test_unmanifested_payload_fails(self):
        from runtime.common import save_new,replace_json
        manifest={'files':{str(p.relative_to(self.root)):sha(p) for p in self.root.rglob('*') if p.is_file() and p.name!='MANIFEST.json' and '__pycache__' not in p.parts and not str(p.relative_to(self.root)).startswith('verification/results/')}}
        replace_json(self.root/'MANIFEST.json',manifest)
        (self.root/'unlisted.txt').write_text('not in frozen payload')
        r=check(self.root);self.assertEqual(r['status'],'FAIL');self.assertTrue(any('unlisted.txt' in e for e in r['errors']))
    def test_native_pass_claim_rejected(self):
        self.mutate('adapters/REGISTER.json',lambda d:d['adapters'][0].update(live_qualification='PASS'))
        self.assertEqual(check(self.root,preflight=True)['status'],'FAIL')
