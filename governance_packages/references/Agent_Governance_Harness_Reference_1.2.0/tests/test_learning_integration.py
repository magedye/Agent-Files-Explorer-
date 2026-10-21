"""Source accounting and classifications must remain connected to actual owning files."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from runtime.common import ROOT, load
from tools.check_learning import check_learning


class LearningIntegrationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name) / 'package'
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))

    def change(self, name, mutation):
        file = self.root / name
        record = load(file)
        mutation(record)
        file.write_text(json.dumps(record), encoding='utf-8')

    def test_valid_source_and_owner_relationships(self):
        self.assertEqual(check_learning(self.root), [])

    def test_missing_input_cannot_silently_disappear(self):
        self.change('design/INBOX_SOURCES.json', lambda record: record['files'].pop())
        self.assertTrue(any('custody population' in error for error in check_learning(self.root)))

    def test_incoming_text_cannot_self_promote_authority(self):
        self.change('design/INBOX_RECONCILIATION.json', lambda record: record['rows'][0].update(source_authority='APPROVED'))
        self.assertIn('Imported source authority was promoted', check_learning(self.root))

    def test_engineering_action_is_not_a_parallel_disposition_taxonomy(self):
        self.change('design/INBOX_RECONCILIATION.json', lambda record: record['rows'][0].update(disposition='IMPLEMENT_CONTROL'))
        self.assertIn('Learning disposition/action taxonomy conflict', check_learning(self.root))

    def test_disposition_requires_an_actual_owner_target(self):
        self.change('design/INBOX_RECONCILIATION.json', lambda record: record['rows'][0].update(targets=['missing-owner.md']))
        self.assertTrue(any('Missing/outside learning target' in error for error in check_learning(self.root)))
