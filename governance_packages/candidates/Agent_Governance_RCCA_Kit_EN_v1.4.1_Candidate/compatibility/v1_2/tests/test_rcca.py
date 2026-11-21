"""Synthetic RCCA tests, all mutating fixtures stay in TemporaryDirectory."""
import csv,json,subprocess,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SCRIPTS=ROOT/'scripts'

def run_tool(script,*args):
    return subprocess.run([sys.executable,str(SCRIPTS/script),*map(str,args)],
                          capture_output=True,text=True,timeout=15)

class RCCATests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='rcca_fixture_');self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        (self.root/'src'/'feature').mkdir(parents=True)
        self.request=self.root/'request.txt'
        self.request.write_text('Create login.\nDo not publish.\nOptional: add animation.\n',encoding='utf-8')
        self.template=json.loads(run_tool('08_RCCA_TRACE.py','--request',self.request,'--template').stdout)
        self.trace=self.root/'trace.json'
        self.complete()

    def complete(self):
        t=self.template
        t['risk_tier']='R1';t['authorization']={'status':'VERIFIED','source_ref':'fixture-owner-001'}
        t['review']={'independence':'L1','review_evidence_ref':'fixture-review-001',
                     'independent_approval_verified':False}
        t['source_units'][0]['disposition']='REQUIREMENTS';t['source_units'][0]['requirement_ids']=['REQ-001']
        t['source_units'][1]['disposition']='REQUIREMENTS';t['source_units'][1]['requirement_ids']=['REQ-002']
        t['source_units'][2]['disposition']='NON_BINDING';t['source_units'][2]['non_binding_reason']='Optional suggestion for later, owner has not selected it.'
        t['requirements']=[{
            'id':f'REQ-00{i}', 'normative':'MUST' if i==1 else 'MUST_NOT',
            'source_unit_ids':[f'SRC-000{i}'],'applicability':'APPLICABLE',
            'acceptance':{'test_id':f'TEST-00{i}','oracle':'Observed PASS from deterministic local test'},
            'implementation_state':'IMPLEMENTED',
            'verification':{'status':'PASSED','evidence_ref':f'fixture-evidence-{i}'},
        } for i in (1,2)]
        self.save()

    def save(self):self.trace.write_text(json.dumps(self.template,ensure_ascii=False),encoding='utf-8')
    def check(self,stage='G1'):
        r=run_tool('08_RCCA_TRACE.py','--request',self.request,'--check',self.trace,'--stage',stage)
        return r,json.loads(r.stdout)

    def test_sentence_split_in_one_line(self):
        self.request.write_text('Build screen. Save draft.\n',encoding='utf-8')
        out=json.loads(run_tool('08_RCCA_TRACE.py','--request',self.request,'--template').stdout)
        self.assertEqual(len(out['source_units']),2)
        self.assertLess(out['source_units'][0]['end'],out['source_units'][1]['start'])

    def test_template_source_units_complete(self):
        self.assertEqual(len(self.template['source_units']),3)
        self.assertTrue(all('sha256' in x for x in self.template['source_units']))

    def test_g1_pass_structural(self):
        r,o=self.check('G1');self.assertEqual(r.returncode,0,o)
        self.assertEqual(o['status'],'SCHEMA_CHECK_PASSED')

    def test_g5_pass_is_not_owner_approval(self):
        r,o=self.check('G5');self.assertEqual(r.returncode,0,o)
        self.assertFalse(o['independent_approval_verified'])
        self.assertFalse(o['actual_enforcement_verified'])

    def test_missing_source_unit_refused(self):
        self.template['source_units'].pop();self.save()
        r,o=self.check();self.assertEqual(r.returncode,2)
        self.assertTrue(any('missing_source_unit' in x for x in o['issues']))

    def test_short_nonbinding_reason_fails(self):
        self.template['source_units'][2]['non_binding_reason']='no';self.save()
        r,o=self.check();self.assertEqual(r.returncode,2)
        self.assertTrue(any('non_binding_without_reason' in x for x in o['issues']))

    def test_original_changed_detected(self):
        self.request.write_text('Changed request.\n',encoding='utf-8')
        r,o=self.check();self.assertEqual(r.returncode,2)
        self.assertIn('original_source_hash_mismatch',o['issues'])

    def test_must_without_oracle_rejected_g1(self):
        self.template['requirements'][0]['acceptance']={'test_id':'TEST-001'};self.save()
        r,o=self.check();self.assertEqual(r.returncode,2)
        self.assertTrue(any('REQUIREMENT_DEFECT' in x for x in o['issues']))

    def test_g2_requires_authorization(self):
        self.template['authorization']['status']='UNKNOWN';self.save()
        r,o=self.check('G2');self.assertEqual(r.returncode,2)
        self.assertIn('authorization_not_verified_by_project_source',o['issues'])

    def test_g2_unresolved_conflict_blocks(self):
        self.template['conflicts']=[{'id':'C1','status':'UNRESOLVED'}];self.save()
        r,o=self.check('G2');self.assertEqual(r.returncode,2)
        self.assertIn('unresolved_authority_conflict',o['issues'])

    def test_unknown_must_blocks_g5(self):
        self.template['requirements'][0]['verification']['status']='INCONCLUSIVE';self.save()
        r,o=self.check('G5');self.assertEqual(r.returncode,2)
        self.assertTrue(any('mandatory_verification_missing' in x for x in o['issues']))

    def test_risk_r3_needs_l3(self):
        self.template['risk_tier']='R3';self.save()
        r,o=self.check('G5');self.assertEqual(r.returncode,2)
        self.assertIn('review_independence_below_risk_floor',o['issues'])

    def test_should_with_documented_deviation_passes(self):
        self.template['source_units'][2]['disposition']='REQUIREMENTS'
        self.template['source_units'][2]['requirement_ids']=['REQ-003']
        self.template['source_units'][2]['non_binding_reason']=None
        self.template['requirements'].append({'id':'REQ-003','normative':'SHOULD',
            'source_unit_ids':['SRC-0003'],'applicability':'APPLICABLE',
            'implementation_state':'NOT_IMPLEMENTED','verification':{'status':'NOT_RUN'},
            'deviation_reason':'Time constraint and this is optional enhancement.'})
        self.save();r,o=self.check('G5');self.assertEqual(r.returncode,0,o)
        self.assertTrue(any('SHOULD_DEVIATION' in x for x in o['warnings']))

    def test_should_without_reason_fails(self):
        self.test_should_with_documented_deviation_passes.__doc__
        self.template['source_units'][2]['disposition']='REQUIREMENTS'
        self.template['source_units'][2]['requirement_ids']=['REQ-003']
        self.template['requirements'].append({'id':'REQ-003','normative':'SHOULD',
            'source_unit_ids':['SRC-0003'],'applicability':'APPLICABLE',
            'implementation_state':'NOT_IMPLEMENTED','verification':{'status':'NOT_RUN'}})
        self.save();r,o=self.check('G5');self.assertEqual(r.returncode,2)
        self.assertTrue(any('should_deviation_unrecorded' in x for x in o['issues']))

    def test_no_must_exception_unapproved(self):
        self.template['requirements'][0]['applicability']='NOT_APPLICABLE';self.save()
        r,o=self.check('G5');self.assertEqual(r.returncode,2)
        self.assertTrue(any('not_applicable_without_authority' in x for x in o['issues']))

    def test_event_append_requires_explicit(self):
        event=self.root/'event.json';event.write_text('{"type":"GATE_SNAPSHOT","gate":"G1"}')
        r=run_tool('09_RCC_EVENT_LEDGER.py','--ledger',self.root/'events.jsonl','--event',event)
        self.assertEqual(r.returncode,2)

    def test_event_chain_and_mutation_detection(self):
        event=self.root/'event.json';event.write_text('{"type":"GATE_SNAPSHOT","gate":"G1"}')
        ledger=self.root/'events.jsonl'
        r=run_tool('09_RCC_EVENT_LEDGER.py','--ledger',ledger,'--event',event,'--allow-write')
        self.assertEqual(r.returncode,0,r.stdout)
        self.assertEqual(json.loads(r.stdout)['count'],1)
        r2=run_tool('09_RCC_EVENT_LEDGER.py','--ledger',ledger,'--verify')
        self.assertEqual(r2.returncode,0)
        raw=ledger.read_text();ledger.write_text(raw.replace('G1','G2'))
        r3=run_tool('09_RCC_EVENT_LEDGER.py','--ledger',ledger,'--verify')
        self.assertEqual(r3.returncode,3)

    def test_event_rejects_secret_field(self):
        event=self.root/'event.json';event.write_text('{"type":"NOTE","password":"abc"}')
        r=run_tool('09_RCC_EVENT_LEDGER.py','--ledger',self.root/'events.jsonl',
                   '--event',event,'--allow-write')
        self.assertEqual(r.returncode,3)

    def test_metrics_on_labeled_csv(self):
        f=self.root/'labels.csv'
        with f.open('w',newline='') as h:
            w=csv.writer(h);w.writerow(['task_id','claim','review_verdict','review_evidence_ref','reviewer_independence'])
            w.writerow(['T1','COMPLETE','COMPLETE','r1','L2'])
            w.writerow(['T2','COMPLETE','PARTIAL','r2','L2'])
        r=run_tool('10_COMPLETION_METRICS.py','--dataset',f)
        self.assertEqual(r.returncode,0)
        o=json.loads(r.stdout);self.assertEqual(o['completion_claim_accuracy'],.5)
        self.assertEqual(o['unsupported_completion_claims'],1)


    def demo(self,target='src/feature/example-demo.txt',apply=False):
        (self.root/'RCCA_TEST_ONLY.marker').write_text('SYNTHETIC_FIXTURE_ONLY_V1_2',encoding='utf-8')
        args=['--root',self.root,'--policy',self.root/'write-set.json',
              '--request',self.request,'--trace',self.trace,'--target',target]
        if apply:args.append('--apply')
        return run_tool('11_GATED_WRITE_DEMO.py',*args)

    def test_demo_runner_dry_run_no_write(self):
        (self.root/'write-set.json').write_text(json.dumps({
            'task_id':'TEST-001','allowed_prefixes':['src/feature/']}),encoding='utf-8')
        r=self.demo();self.assertEqual(r.returncode,0,r.stdout)
        self.assertEqual(json.loads(r.stdout)['status'],'DEMO_WRITE_ELIGIBLE_DRY_RUN')
        self.assertFalse((self.root/'src/feature/example-demo.txt').exists())

    def test_demo_runner_allowed_fixture_write(self):
        (self.root/'write-set.json').write_text(json.dumps({
            'task_id':'TEST-001','allowed_prefixes':['src/feature/']}),encoding='utf-8')
        r=self.demo(apply=True);self.assertEqual(r.returncode,0,r.stdout)
        self.assertTrue((self.root/'src/feature/example-demo.txt').exists())
        r2=self.demo(apply=True);self.assertEqual(r2.returncode,3)

    def test_demo_runner_denies_unknown_authorization(self):
        (self.root/'write-set.json').write_text(json.dumps({
            'task_id':'TEST-001','allowed_prefixes':['src/feature/']}),encoding='utf-8')
        self.template['authorization']['status']='UNKNOWN';self.save()
        r=self.demo(apply=True);self.assertEqual(r.returncode,2)
        self.assertEqual(json.loads(r.stdout)['status'],'DENIED_REQUIREMENTS_GATE')
        self.assertFalse((self.root/'src/feature/example-demo.txt').exists())

    def test_demo_runner_denies_outside_write_set(self):
        (self.root/'write-set.json').write_text(json.dumps({
            'task_id':'TEST-001','allowed_prefixes':['src/feature/']}),encoding='utf-8')
        r=self.demo(target='outside.txt',apply=True);self.assertEqual(r.returncode,2)
        self.assertEqual(json.loads(r.stdout)['status'],'DENIED_WRITESET')

    def test_demo_runner_requires_marker(self):
        (self.root/'write-set.json').write_text(json.dumps({
            'task_id':'TEST-001','allowed_prefixes':['src/feature/']}),encoding='utf-8')
        p=self.root/'RCCA_TEST_ONLY.marker';p.write_text('wrong marker')
        r=run_tool('11_GATED_WRITE_DEMO.py','--root',self.root,'--policy',self.root/'write-set.json',
            '--request',self.request,'--trace',self.trace,'--target','src/feature/example-demo.txt', '--apply')
        self.assertEqual(r.returncode,3)
        self.assertFalse((self.root/'src/feature/example-demo.txt').exists())


if __name__=='__main__':unittest.main(verbosity=2)
