import unittest
from tools.metrics import fraction, summarize_controls


def row(rid='C1', status='PASS', severity='low'):
    return dict(id=rid, status=status, severity=severity,
                evidence_refs=['synthetic-evidence-only'] if status in {'PASS', 'FAIL'} else [],
                decision_ref='synthetic-decision-only' if status in {'WAIVED', 'NOT_APPLICABLE'} else None,
                rationale='Synthetic test rationale' if status in {'WAIVED', 'NOT_APPLICABLE'} else None)


class MetricTests(unittest.TestCase):
    def test_fraction(self): self.assertEqual(fraction(1, 4), .25)
    def test_zero_denominator(self): self.assertIsNone(fraction(0, 0))
    def test_unknown_denominator(self): self.assertIsNone(fraction(2, None))
    def test_invalid_counts(self):
        for pair in ((-1, 1), (2, 1), (1, -2), (1, 0), (True, 1), (1, True), (1., 2)):
            with self.subTest(pair=pair):
                with self.assertRaises(ValueError): fraction(*pair)
    def test_partial_evidence_visible(self):
        r = summarize_controls([row(), row('C2','NOT_RUN')], measurement_scope_complete=True)
        self.assertEqual(r['check_completion_fraction'], .5)
        self.assertEqual(r['observed_pass_fraction_among_examined'], 1.)
        self.assertEqual(r['overall_compliance_verdict'], 'NOT_ASSESSED')
    def test_unknown_not_pass(self):
        r = summarize_controls([row('C1','UNKNOWN')], measurement_scope_complete=False)
        self.assertEqual(r['counts']['PASS'], 0)
        self.assertEqual(r['check_completion_fraction'], 0.)
        self.assertIsNone(r['observed_pass_fraction_among_examined'])
    def test_critical_not_averaged_away(self):
        r = summarize_controls([row(), row('C2','FAIL','critical')], measurement_scope_complete=True)
        self.assertEqual(r['critical_failures'], ['C2'])
        self.assertEqual(r['overall_compliance_verdict'], 'NOT_ASSESSED')
    def test_waiver_not_pass(self):
        r = summarize_controls([row('C1','WAIVED')], measurement_scope_complete=True)
        self.assertEqual(r['counts']['PASS'], 0)
        self.assertEqual(r['applicable_including_waived'], 1)
        self.assertIsNone(r['check_completion_fraction'])
    def test_na_not_pass(self):
        r = summarize_controls([row('C1','NOT_APPLICABLE')], measurement_scope_complete=True)
        self.assertEqual(r['required_nonwaived'], 0)
        self.assertIsNone(r['check_completion_fraction'])
    def test_empty_not_full_compliance(self):
        r = summarize_controls([], measurement_scope_complete=False)
        self.assertIsNone(r['check_completion_fraction'])
        self.assertFalse(r['scope_complete_as_declared'])
    def test_duplicate_ids_rejected(self):
        with self.assertRaises(ValueError): summarize_controls([row(),row()],measurement_scope_complete=True)
    def test_pass_without_reference_rejected(self):
        r=row();r['evidence_refs']=[]
        with self.assertRaises(ValueError): summarize_controls([r],measurement_scope_complete=True)
    def test_fail_without_reference_rejected(self):
        r=row(status='FAIL');r['evidence_refs']=[]
        with self.assertRaises(ValueError): summarize_controls([r],measurement_scope_complete=True)
    def test_waiver_without_decision_rejected(self):
        r=row(status='WAIVED');r['decision_ref']=None
        with self.assertRaises(ValueError): summarize_controls([r],measurement_scope_complete=True)
    def test_na_without_rationale_rejected(self):
        r=row(status='NOT_APPLICABLE');r['rationale']=''
        with self.assertRaises(ValueError): summarize_controls([r],measurement_scope_complete=True)
    def test_unknown_status_rejected(self):
        r=row();r['status']='ACCEPTED'
        with self.assertRaises(ValueError): summarize_controls([r],measurement_scope_complete=True)
    def test_missing_scope_declaration(self):
        with self.assertRaises(ValueError): summarize_controls([row()],measurement_scope_complete=None)
    def test_reference_presence_not_authentication(self):
        r=summarize_controls([row()],measurement_scope_complete=True)
        self.assertFalse(r['evidence_authenticated'])
    def test_unexpected_field_rejected(self):
        r=row();r['release_approved']=True
        with self.assertRaises(ValueError): summarize_controls([r],measurement_scope_complete=True)
    def test_blocked_is_counted_as_unexamined(self):
        r=summarize_controls([row('C1','BLOCKED')],measurement_scope_complete=True)
        self.assertEqual(r['examined'],0)
        self.assertEqual(r['counts']['BLOCKED'],1)
