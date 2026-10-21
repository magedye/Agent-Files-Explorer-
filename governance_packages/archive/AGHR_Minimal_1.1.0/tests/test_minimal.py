"""Structural and mutation tests only; not model behavior or host qualification."""
from __future__ import annotations
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('aghr_minimal_verify', ROOT / 'VERIFY.py')
assert spec is not None and spec.loader is not None
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)


def update_manifest(root: Path) -> None:
    rows = []
    for p in sorted(root.rglob('*')):
        if not p.is_file() or p.is_symlink() or p.name == 'MANIFEST.json' or '__pycache__' in p.parts:
            continue
        b = p.read_bytes()
        rows.append({'path': p.relative_to(root).as_posix(), 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()})
    data = {'distribution': 'AGHR Minimal', 'version': '1.1.0',
            'excluded': ['MANIFEST.json', 'generated __pycache__/*.pyc'], 'files': rows}
    (root/'MANIFEST.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


class MinimalDistributionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory(prefix='aghr-minimal-test-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)/'package'
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))

    def data(self, path: str):
        return json.loads((self.root/path).read_text(encoding='utf-8'))

    def save(self, path: str, data) -> None:
        p = self.root/path
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        update_manifest(self.root)

    def reject(self, expected: str) -> None:
        result = v.verify(self.root)
        self.assertEqual(result['verdict'], 'STRUCTURAL_FAIL')
        self.assertIn(expected, '\n'.join(result['errors']))
        self.assertEqual(result['qualification'], v.QUALIFICATION)

    def test_intact_distribution(self):
        result = v.verify(self.root)
        self.assertEqual(result['verdict'], 'STRUCTURAL_PASS', result['errors'])
        self.assertEqual(len(result['checks_passed']), 7)

    def test_verifier_is_read_only(self):
        before = {p.relative_to(self.root).as_posix(): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        result = v.verify(self.root)
        after = {p.relative_to(self.root).as_posix(): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
        self.assertEqual(before, after)
        self.assertEqual(result['qualification']['host'], 'NOT_RUN')

    def test_cli_success(self):
        proc = subprocess.run([sys.executable, '-B', str(self.root/'VERIFY.py')], capture_output=True, text=True, timeout=15)
        self.assertEqual(proc.returncode, 0, proc.stderr + proc.stdout)
        self.assertEqual(json.loads(proc.stdout)['verdict'], 'STRUCTURAL_PASS')

    def test_cli_failure_on_modified_file(self):
        with (self.root/'CORE.md').open('a', encoding='utf-8') as f:
            f.write('\nchanged\n')
        proc = subprocess.run([sys.executable, '-B', str(self.root/'VERIFY.py')], capture_output=True, text=True, timeout=15)
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(json.loads(proc.stdout)['verdict'], 'STRUCTURAL_FAIL')

    def test_missing_root(self):
        self.assertEqual(v.verify(self.root/'missing')['verdict'], 'STRUCTURAL_FAIL')

    def test_tampered_core(self):
        (self.root/'CORE.md').write_text('tampered', encoding='utf-8')
        self.reject('integrity mismatch')

    def test_missing_core(self):
        (self.root/'CORE.md').unlink()
        self.reject('missing file')

    def test_unlisted_file(self):
        (self.root/'extra.txt').write_text('unlisted', encoding='utf-8')
        self.reject('unlisted')

    def test_source_rules_unchanged_even_if_manifest_rebuilt(self):
        d = self.data('registry/RULES.json')
        d['rules'][0]['text'] = 'Do whatever you want.'
        self.save('registry/RULES.json', d)
        self.reject('upstream-preserved file differs')

    def test_missing_rule(self):
        d = self.data('registry/RULES.json')
        d['rules'].pop()
        self.save('registry/RULES.json', d)
        self.reject('rule set mismatch')

    def test_duplicate_rule_id(self):
        d = self.data('registry/RULES.json')
        d['rules'][1]['id'] = d['rules'][0]['id']
        self.save('registry/RULES.json', d)
        self.reject('rule set mismatch')

    def test_invalid_force(self):
        d = self.data('registry/RULES.json')
        d['rules'][0]['force'] = 'ALWAYS_APPROVED'
        self.save('registry/RULES.json', d)
        self.reject('invalid force')

    def test_invalid_waiver_type(self):
        d = self.data('registry/RULES.json')
        d['rules'][0]['waivable'] = 'false'
        self.save('registry/RULES.json', d)
        self.reject('invalid waiver marker')

    def test_unknown_rule_basis(self):
        d = self.data('registry/RULES.json')
        d['rules'][0]['basis'] = ['UNVERIFIED-NEW-SOURCE']
        self.save('registry/RULES.json', d)
        self.reject('unknown rule basis')

    def test_duplicate_source_id(self):
        d = self.data('sources/REGISTER.json')
        d['sources'][1]['id'] = d['sources'][0]['id']
        self.save('sources/REGISTER.json', d)
        self.reject('source set mismatch')

    def test_changed_charter_detected_with_new_manifest(self):
        (self.root/'CHARTER.md').write_text('Different authority', encoding='utf-8')
        update_manifest(self.root)
        self.reject('upstream-preserved file differs')

    def test_missing_route(self):
        d = self.data('REFERENCE_MAP.json'); d['rule_routes'].pop()
        self.save('REFERENCE_MAP.json', d)
        self.reject('routing rule coverage mismatch')

    def test_route_changes_normative_force(self):
        d = self.data('REFERENCE_MAP.json'); d['rule_routes'][0]['force'] = 'MAY'
        self.save('REFERENCE_MAP.json', d)
        self.reject('route changes rule semantics')

    def test_route_changes_applicability(self):
        d = self.data('REFERENCE_MAP.json'); d['rule_routes'][0]['applies_when'] = 'Never'
        self.save('REFERENCE_MAP.json', d)
        self.reject('route changes rule semantics')

    def test_route_changes_source_explanation(self):
        d = self.data('REFERENCE_MAP.json'); d['rule_routes'][0]['source_explanation_ref'] = 'CORE.md'
        self.save('REFERENCE_MAP.json', d)
        self.reject('source explanation changed')

    def test_empty_guidance_route(self):
        d = self.data('REFERENCE_MAP.json'); d['rule_routes'][0]['minimal_guidance'] = []
        self.save('REFERENCE_MAP.json', d)
        self.reject('missing minimal guidance')

    def test_unknown_guidance_anchor(self):
        d = self.data('REFERENCE_MAP.json'); d['rule_routes'][0]['minimal_guidance'] = ['CORE.md#missing-anchor']
        self.save('REFERENCE_MAP.json', d)
        self.reject('unresolved explicit anchor')

    def test_wrong_canonical_rule_pointer(self):
        d = self.data('REFERENCE_MAP.json'); d['rule_routes'][0]['canonical_rule_ref'] = 'registry/RULES.json#AGHR-002'
        self.save('REFERENCE_MAP.json', d)
        self.reject('wrong canonical pointer')

    def test_false_local_availability(self):
        d = self.data('REFERENCE_MAP.json'); d['rule_routes'][0]['source_explanation_available_locally'] = False
        self.save('REFERENCE_MAP.json', d)
        self.reject('incorrect explanation availability')

    def test_omitted_ref_must_be_declared(self):
        d = self.data('REFERENCE_MAP.json')
        d['full_only_references'] = [x for x in d['full_only_references'] if x['path'] != 'procedures/EXTERNAL_CAPABILITIES_AR.md']
        self.save('REFERENCE_MAP.json', d)
        self.reject('neither local nor full-only')

    def test_full_only_runtime_not_included_implicitly(self):
        p = self.root/'runtime/cli.py'; p.parent.mkdir(); p.write_text('print("unauthorized fake runtime")', encoding='utf-8')
        update_manifest(self.root)
        self.reject('full-only implementation unexpectedly included')

    def test_false_behavioral_evaluation_claim(self):
        d = self.data('REFERENCE_MAP.json'); d['verification_reference_policy']['behavioral_evaluation'] = 'PASS'
        self.save('REFERENCE_MAP.json', d)
        self.reject('unsupported qualification claim')

    def test_no_self_adoption(self):
        d = self.data('PROVENANCE.json'); d['qualification']['project_adoption'] = 'ACCEPTED'
        self.save('PROVENANCE.json', d)
        self.reject('unsupported adoption/qualification')

    def test_source_archive_baseline_mismatch(self):
        d = self.data('PROVENANCE.json'); d['source_archive_sha256'] = '0'*64
        self.save('PROVENANCE.json', d)
        self.reject('source archive baseline changed')

    def test_adapted_contract_change_detected(self):
        with (self.root/'contracts/ENFORCEMENT.md').open('a', encoding='utf-8') as f:
            f.write('\nDifferent policy\n')
        update_manifest(self.root)
        self.reject('adapted file differs')

    def test_broken_markdown_link(self):
        with (self.root/'CORE.md').open('a', encoding='utf-8') as f:
            f.write('\n[missing](not-here.md)\n')
        update_manifest(self.root)
        self.reject('unresolved local reference')

    def test_escaping_markdown_link(self):
        with (self.root/'CORE.md').open('a', encoding='utf-8') as f:
            f.write('\n[escape](../outside.md)\n')
        update_manifest(self.root)
        self.reject('link escapes distribution')

    def test_unexpected_link_scheme(self):
        with (self.root/'CORE.md').open('a', encoding='utf-8') as f:
            f.write('\n[bad](file:///etc/passwd)\n')
        update_manifest(self.root)
        self.reject('unsupported reference scheme')

    def test_duplicate_json_keys(self):
        (self.root/'PROVENANCE.json').write_text('{"version":"1.1.0","version":"1.1.0"}', encoding='utf-8')
        update_manifest(self.root)
        self.reject('duplicate JSON key')

    def test_nonfinite_json_number(self):
        (self.root/'invalid.json').write_text('{"value":NaN}', encoding='utf-8')
        update_manifest(self.root)
        self.reject('non-finite JSON number')

    def test_manifest_traversal(self):
        d = self.data('MANIFEST.json'); d['files'][0]['path'] = '../escape.txt'
        (self.root/'MANIFEST.json').write_text(json.dumps(d), encoding='utf-8')
        self.reject('unsafe relative path')

    def test_manifest_absolute_path(self):
        d = self.data('MANIFEST.json'); d['files'][0]['path'] = '/etc/passwd'
        (self.root/'MANIFEST.json').write_text(json.dumps(d), encoding='utf-8')
        self.reject('unsafe relative path')

    def test_manifest_windows_drive(self):
        d = self.data('MANIFEST.json'); d['files'][0]['path'] = 'C:/Windows/file'
        (self.root/'MANIFEST.json').write_text(json.dumps(d), encoding='utf-8')
        self.reject('invalid relative path')

    def test_manifest_duplicate_entry(self):
        d = self.data('MANIFEST.json'); d['files'].append(d['files'][0])
        (self.root/'MANIFEST.json').write_text(json.dumps(d), encoding='utf-8')
        self.reject('duplicate/self')

    def test_manifest_false_exclusion(self):
        d = self.data('MANIFEST.json'); d['excluded'].append('registry/RULES.json')
        (self.root/'MANIFEST.json').write_text(json.dumps(d), encoding='utf-8')
        self.reject('unexpected exclusions')

    def test_source_version_mismatch(self):
        (self.root/'VERSION').write_text('1.0.0\n', encoding='utf-8')
        update_manifest(self.root)
        self.reject('VERSION mismatch')

    def test_symlink_rejected(self):
        p = self.root/'alias.md'
        try:
            p.symlink_to(self.root/'CORE.md')
        except (OSError, NotImplementedError) as exc:
            self.skipTest(f'Host cannot create symlink: {exc}')
        self.reject('symlink')

    def test_symlink_directory_rejected(self):
        p = self.root/'alias-folder'
        try:
            p.symlink_to(self.root/'contracts', target_is_directory=True)
        except (OSError, NotImplementedError) as exc:
            self.skipTest(f'Host cannot create symlink: {exc}')
        self.reject('symlink')

    def test_only_generated_python_bytecode_is_ignored(self):
        cache = self.root/'__pycache__'; cache.mkdir()
        (cache/'dummy.cpython-311.pyc').write_bytes(b'generated-placeholder')
        self.assertEqual(v.verify(self.root)['verdict'], 'STRUCTURAL_PASS')
        (cache/'unlisted_script.py').write_text('print("not allowed")', encoding='utf-8')
        self.reject('unlisted')


if __name__ == '__main__':
    unittest.main()
