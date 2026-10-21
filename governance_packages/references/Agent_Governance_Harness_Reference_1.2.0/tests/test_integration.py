"""Mutation checks for the integrated distribution; no external host qualification."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from runtime.common import ROOT, load
from tools.check_integration import check_integration

class IntegrationTests(unittest.TestCase):
    def setUp(self):
        t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup);self.r=Path(t.name)/'package'
        shutil.copytree(ROOT,self.r,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
    def change(self,path,fn):
        p=self.r/path;x=load(p);fn(x);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    def assert_rejected(self,fragment):
        errors=check_integration(self.r);self.assertTrue(any(fragment in e for e in errors),errors)
    def test_integrated_package(self):self.assertEqual(check_integration(self.r),[])
    def test_original_rule_preserved(self):
        self.change('registry/RULES.json',lambda x:x['rules'].pop(0));self.assert_rejected('Original rule ID lost')
    def test_material_clarification_cannot_be_weakened(self):
        self.change('registry/RULES.json',lambda x:next(r for r in x['rules'] if r['id']=='AGHR-041').update(force='SHOULD'));self.assert_rejected('MUST weakened')
    def test_standards_not_licensed_extraction(self):
        self.change('standards/CONTROL_CATALOG.json',lambda x:x.update(not_standard_clause_extraction=False));self.assert_rejected('extraction claim')
    def test_standards_not_silently_adopted(self):
        self.change('standards/CONTROL_CATALOG.json',lambda x:x['controls'][0].update(adoption='APPROVED'));self.assert_rejected('silently adopted')
    def test_missing_standard_card(self):
        (self.r/'standards/01_ISO_5338.md').unlink();self.assert_rejected('Missing standards card')
    def test_skill_not_activated(self):
        self.change('optional_skills/REGISTER.json',lambda x:x['skills'][0].update(auto_installed=True));self.assert_rejected('activation/qualification claimed')
    def test_skill_payload_integrity(self):
        p=self.r/load(self.r/'optional_skills/REGISTER.json')['skills'][0]['path'];p.write_text(p.read_text(encoding='utf-8')+'\nAltered\n',encoding='utf-8');self.assert_rejected('Skill payload')
    def test_no_auto_discovery_directory(self):
        (self.r/'.agents').mkdir();self.assert_rejected('auto-discovery')
    def test_missing_ext_mapping(self):
        self.change('compatibility/ADDITIONS_CONTROL_MAPPING.json',lambda x:x['rows'].pop());self.assert_rejected('Missing EXT mapping')
    def test_additions_accounting_complete(self):
        self.change('compatibility/ADDITIONS_FILE_DISPOSITION.json',lambda x:x['rows'].pop());self.assert_rejected('accounting incomplete')
    def test_frozen_original_is_not_rewritten(self):
        p=next((self.r/'design/frozen').rglob('*.md'));p.write_text(p.read_text(encoding='utf-8')+'\nchanged',encoding='utf-8');self.assert_rejected('historical payload changed')
    def test_unrun_scenario_not_pass(self):
        self.change('evaluations/DELIVERY_SCENARIOS.json',lambda x:x['cases'][0].update(verdict='PASS'));self.assert_rejected('Unrun behavior promoted')
    def test_unknown_scenario_rule(self):
        self.change('evaluations/DELIVERY_SCENARIOS.json',lambda x:x['cases'][0].update(rule_ids=['AGHR-999']));self.assert_rejected('Scenario rule mapping')
    def test_duplicate_source_url(self):
        self.change('sources/REGISTER.json',lambda x:x['sources'][1].update(url=x['sources'][0]['url']));self.assert_rejected('Duplicate canonical source')
    def test_link_must_stay_in_distribution(self):
        (self.r/'README.md').write_text((self.r/'README.md').read_text(encoding='utf-8')+'\n[bad](../outside.md)\n',encoding='utf-8');self.assert_rejected('Missing/outside local link')
    def test_academic_target_is_real_chapter(self):
        self.change('compatibility/ACADEMIC_INTEGRATION_MAP.json',lambda x:x['rows'][0].update(target_chapter=99));self.assert_rejected('Academic target chapter missing')
    def test_new_source_ids_resolve(self):
        self.change('standards/CONTROL_CATALOG.json',lambda x:x['controls'][0].update(source_ids=['invented']));self.assert_rejected('Unknown standards source')
