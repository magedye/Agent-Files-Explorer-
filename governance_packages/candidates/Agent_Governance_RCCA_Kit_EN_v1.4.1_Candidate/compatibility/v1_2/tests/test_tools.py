"""Stdlib tests; ALL mutations are within TemporaryDirectory fixtures."""
from __future__ import annotations
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SCRIPTS=ROOT/'scripts'


def run_tool(file, *args, cwd=None):
    return subprocess.run([sys.executable,str(SCRIPTS/file),*map(str,args)],
                          cwd=cwd,text=True,capture_output=True,timeout=20)


class GovernanceToolTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='gov_fixture_')
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        (self.root/'src'/'feature').mkdir(parents=True)
        (self.root/'owner-decisions').mkdir()
        (self.root/'docs').mkdir()
        self.policy=self.root/'write-set.json'
        self.policy.write_text(json.dumps({
            'task_id':'TEST-001', 'status':'DRAFT_EXAMPLE_ONLY',
            'allowed_files':['docs/example.md'],
            'allowed_prefixes':['src/feature/'],
            'blocked_files':['AGENTS.md'],
            'blocked_prefixes':['owner-decisions/']}),encoding='utf-8')

    def check(self,*paths):
        r=run_tool('06_WRITESET_CHECK.py','--root',self.root,'--policy',self.policy,'--paths',*paths)
        return r,json.loads(r.stdout)

    def test_allow_declared_path(self):
        r,j=self.check('src/feature/ok.py')
        self.assertEqual(r.returncode,0)
        self.assertEqual(j['status'],'PASS_WITHIN_DECLARED_PATHS')
        self.assertFalse(j['authorization_verified'])

    def test_denies_outside(self):
        r,j=self.check('unrelated.txt')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'FAIL_PATH_SCOPE')

    def test_denies_protected_even_if_allowlisted(self):
        d=json.loads(self.policy.read_text())
        d['allowed_files'].append('AGENTS.md')
        self.policy.write_text(json.dumps(d))
        r,j=self.check('AGENTS.md')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'FAIL_PROTECTED_PATH')

    def test_parent_path_rejected(self):
        r,j=self.check('../outside.txt')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'INVALID_PATH')

    def test_absolute_path_rejected(self):
        r,j=self.check('C:\\Users\\Public\\a.txt')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'INVALID_PATH')

    def test_git_internal_path_rejected(self):
        r,j=self.check('.git/config')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'INVALID_PATH')

    def test_malformed_policy_inconclusive(self):
        self.policy.write_text('{bad',encoding='utf-8')
        r=run_tool('06_WRITESET_CHECK.py','--root',self.root,'--policy',self.policy,'--paths','src/feature/a.py')
        self.assertEqual(r.returncode,3)
        self.assertEqual(json.loads(r.stdout)['status'],'INCONCLUSIVE')

    def test_empty_allowlist_fails_closed(self):
        self.policy.write_text(json.dumps({'allowed_files':[]}),encoding='utf-8')
        r=run_tool('06_WRITESET_CHECK.py','--root',self.root,'--policy',self.policy,'--paths','anything')
        self.assertEqual(r.returncode,3)

    def test_symlink_detected(self):
        outside=self.root/'some_target';outside.mkdir()
        link=self.root/'src'/'feature'/'linked'
        try:link.symlink_to(outside,target_is_directory=True)
        except OSError:self.skipTest('Symlinks unavailable')
        r,j=self.check('src/feature/linked/evil.py')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'INVALID_PATH')

    def test_git_missing_head_inconclusive(self):
        subprocess.run(['git','init','-q',str(self.root)],check=True,capture_output=True)
        r=run_tool('06_WRITESET_CHECK.py','--root',self.root,'--policy',self.policy,'--git')
        self.assertEqual(r.returncode,3)

    def test_git_workspace_includes_untracked(self):
        subprocess.run(['git','init','-q',str(self.root)],check=True,capture_output=True)
        (self.root/'.gitignore').write_text('*.cache\n')
        (self.root/'docs'/'example.md').write_text('baseline')
        subprocess.run(['git','-C',str(self.root),'add','docs/example.md','.gitignore','write-set.json'],check=True,capture_output=True)
        subprocess.run(['git','-C',str(self.root),'-c','user.name=Test','-c','user.email=test@example.invalid',
                        'commit','-qm','fixture baseline'],check=True,capture_output=True)
        (self.root/'src'/'feature'/'new.py').write_text('1')
        r=run_tool('06_WRITESET_CHECK.py','--root',self.root,'--policy',self.policy,'--git')
        self.assertEqual(r.returncode,0,r.stderr+r.stdout)
        j=json.loads(r.stdout)
        self.assertIn('src/feature/new.py',[x['path'] for x in j['paths']])
        (self.root/'outside.txt').write_text('test')
        r2=run_tool('06_WRITESET_CHECK.py','--root',self.root,'--policy',self.policy,'--git')
        self.assertEqual(r2.returncode,2)

    def test_metadata_inventory(self):
        (self.root/'AGENTS.md').write_text('do not modify')
        (self.root/'secret.env').write_text('secret-value-here')
        r=run_tool('05_GOV_AUDIT_READONLY.py','--root',self.root)
        self.assertEqual(r.returncode,0)
        j=json.loads(r.stdout)
        self.assertTrue(any(x['path']=='AGENTS.md' for x in j['candidates']))
        self.assertNotIn('secret-value-here',r.stdout)
        self.assertFalse(j['file_contents_read'])

    def test_fingerprint_and_staleness(self):
        (self.root/'AGENTS.md').write_text('v1')
        r=run_tool('07_DERIVED_VIEW.py','--root',self.root,'--source','AGENTS.md')
        self.assertEqual(r.returncode,0)
        view=self.root/'view.json';view.write_text(r.stdout)
        r2=run_tool('07_DERIVED_VIEW.py','--root',self.root,'--check',view)
        self.assertEqual(r2.returncode,3)
        self.assertEqual(json.loads(r2.stdout)['status'],'INCONCLUSIVE_GIT_BASELINE')
        (self.root/'AGENTS.md').write_text('v2')
        r3=run_tool('07_DERIVED_VIEW.py','--root',self.root,'--check',view)
        self.assertEqual(r3.returncode,2)
        self.assertEqual(json.loads(r3.stdout)['status'],'STALE')

    def test_fingerprint_reject_secret_config(self):
        (self.root/'auth.json').write_text('{}')
        r=run_tool('07_DERIVED_VIEW.py','--root',self.root,'--source','auth.json')
        self.assertEqual(r.returncode,3)
        self.assertEqual(json.loads(r.stdout)['status'],'INCONCLUSIVE')


    def test_windows_casefold_protected(self):
        cfg=json.loads(self.policy.read_text())
        cfg['blocked_prefixes'].append('src/private/')
        self.policy.write_text(json.dumps(cfg),encoding='utf-8')
        r,j=self.check('src/PRIVATE/secret.md')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'FAIL_PROTECTED_PATH')

    def test_windows_casefold_allow(self):
        r,j=self.check('SRC/FEATURE/Example.py')
        self.assertEqual(r.returncode,0)
        self.assertEqual(j['paths'][0]['decision'],'PASS_PATH_MATCH')

    def test_windows_reserved_alias_rejected(self):
        r,j=self.check('src/feature/CON.txt')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'INVALID_PATH')

    def test_windows_trailing_dot_rejected(self):
        r,j=self.check('src/feature/example. ')
        self.assertEqual(r.returncode,2)
        self.assertEqual(j['paths'][0]['decision'],'INVALID_PATH')

    def test_git_inventory_includes_untracked(self):
        subprocess.run(['git','init','-q',str(self.root)],check=True,capture_output=True)
        (self.root/'operator-notes.txt').write_text('private notes',encoding='utf-8')
        r=run_tool('05_GOV_AUDIT_READONLY.py','--root',self.root)
        self.assertEqual(r.returncode,0)
        j=json.loads(r.stdout)
        self.assertIn('?? operator-notes.txt',j['git']['status']['value'])
        self.assertFalse(j['custody_inventory_complete'])

    def test_new_governance_source_stales_view(self):
        subprocess.run(['git','init','-q',str(self.root)],check=True,capture_output=True)
        (self.root/'AGENTS.md').write_text('a',encoding='utf-8')
        (self.root/'docs'/'example.md').write_text('a',encoding='utf-8')
        subprocess.run(['git','-C',str(self.root),'add','AGENTS.md'],check=True,capture_output=True)
        subprocess.run(['git','-C',str(self.root),'-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','baseline'],check=True,capture_output=True)
        r=run_tool('07_DERIVED_VIEW.py','--root',self.root,'--source','AGENTS.md')
        self.assertEqual(r.returncode,0)
        snapshot=self.root/'old_view.json';snapshot.write_text(r.stdout,encoding='utf-8')
        check=run_tool('07_DERIVED_VIEW.py','--root',self.root,'--check',snapshot)
        self.assertEqual(check.returncode,0)
        self.assertEqual(json.loads(check.stdout)['status'],'UNCHANGED_IN_DECLARED_SOURCES')
        (self.root/'docs'/'GOVERNANCE.md').write_text('new',encoding='utf-8')
        check2=run_tool('07_DERIVED_VIEW.py','--root',self.root,'--check',snapshot)
        self.assertEqual(check2.returncode,2)
        self.assertIn('docs/GOVERNANCE.md',json.loads(check2.stdout)['inventory_diff']['added'])

if __name__=='__main__':
    unittest.main(verbosity=2)
