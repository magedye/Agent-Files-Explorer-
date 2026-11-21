"""Arithmetic/comparability tests on authored synthetic measurements only."""
import copy
import unittest
from agdl.metrics import compare
from tests.quality_fixtures import measurement


class QualityMetricsTests(unittest.TestCase):
    def setUp(self):self.before=measurement();self.after=measurement('AFTER')
    def row(self,mid):return next(x for x in compare(self.before,self.after)['rows'] if x['metric']==mid)
    def test_delta_is_percentage_points(self):self.assertEqual(self.row('omission_rate')['delta'],-10)
    def test_lower_omissions_improved(self):self.assertEqual(self.row('omission_rate')['verdict'],'OBSERVED_IMPROVEMENT')
    def test_higher_omissions_regressed(self):
        self.after['measurements'][0]['numerator']=3;self.assertEqual(self.row('omission_rate')['verdict'],'OBSERVED_REGRESSION')
    def test_unchanged_counts(self):self.after['measurements'][0]['numerator']=2;self.assertEqual(self.row('omission_rate')['verdict'],'UNCHANGED')
    def test_missing_telemetry_not_zero(self):self.assertIsNone(self.row('token_count')['after'])
    def test_missing_evidence_not_measured(self):self.after['measurements'][0]['evidence_ref']='';self.assertEqual(self.row('omission_rate')['verdict'],'NOT_MEASURABLE')
    def test_zero_denominator_not_success(self):
        self.after['measurements'][0].update(numerator=0,denominator=0)
        self.assertIn('NOT_APPLICABLE_ZERO_DENOMINATOR',self.row('omission_rate')['limitations'])
    def test_numerator_exceeds_denominator(self):
        self.after['measurements'][0]['numerator']=11;self.assertIn('INVALID_COUNTS',self.row('omission_rate')['limitations'])
    def test_changed_model_no_delta(self):
        self.after['conditions']['model']='different';r=self.row('omission_rate');self.assertIsNone(r['delta']);self.assertEqual(r['verdict'],'NOT_COMPARABLE')
    def test_changed_oracle_no_delta(self):
        self.after['conditions']['oracle_sha256']='c'*64;self.assertIsNone(self.row('omission_rate')['delta'])
    def test_governance_is_intended_variable(self):self.assertEqual(compare(self.before,self.after)['exit_code'],0)
    def test_unknown_model_not_comparable(self):
        self.before['conditions']['model']=self.after['conditions']['model']='UNKNOWN';self.assertEqual(compare(self.before,self.after)['verdict'],'NOT_COMPARABLE')
    def test_different_sample_size_not_comparable(self):self.after['sample_size']=8;self.assertEqual(compare(self.before,self.after)['verdict'],'NOT_COMPARABLE')
    def test_synthetic_not_real_behavior(self):
        r=compare(self.before,self.after);self.assertFalse(r['causal_effect_established']);self.assertIn('SYNTHETIC_EXAMPLE_NOT_AGENT_EFFECTIVENESS',r['warnings'])
    def test_evidence_classes_must_match(self):self.after['evidence_class']='OBSERVED';self.assertEqual(compare(self.before,self.after)['verdict'],'NOT_COMPARABLE')
    def test_duplicate_metric_rejected(self):
        self.after['measurements'].append(copy.deepcopy(self.after['measurements'][0]));self.assertEqual(compare(self.before,self.after)['exit_code'],3)
    def test_unknown_metric_rejected(self):self.after['measurements'][0]['id']='quality_percentage';self.assertEqual(compare(self.before,self.after)['exit_code'],3)
    def test_wrong_arms_rejected(self):self.after['arm']='BEFORE';self.assertEqual(compare(self.before,self.after)['exit_code'],3)
    def test_wrong_definition_rejected(self):
        self.before['definition_id']=self.after['definition_id']='invented';self.assertEqual(compare(self.before,self.after)['verdict'],'NOT_COMPARABLE')
    def test_empty_sample_not_success(self):self.before['sample_size']=self.after['sample_size']=0;self.assertEqual(compare(self.before,self.after)['verdict'],'NOT_COMPARABLE')
    def test_critical_violation_not_averaged_away(self):
        self.after['measurements'][1]['value']=1;r=compare(self.before,self.after)
        self.assertTrue(r['critical_violation_observed']);self.assertEqual(r['exit_code'],2)
    def test_no_measurements_is_no_telemetry(self):
        self.before['measurements']=[];self.after['measurements']=[];self.assertEqual(compare(self.before,self.after)['verdict'],'NO_COMPARABLE_TELEMETRY')
    def test_unknown_field_schema_rejected(self):self.after['magic']=True;self.assertEqual(compare(self.before,self.after)['exit_code'],3)
    def test_negative_counts_schema_rejected(self):self.after['measurements'][0]['numerator']=-1;self.assertEqual(compare(self.before,self.after)['exit_code'],3)
    def test_does_not_mutate_runs(self):
        b=copy.deepcopy(self.before);a=copy.deepcopy(self.after);compare(self.before,self.after)
        self.assertEqual(b,self.before);self.assertEqual(a,self.after)
    def test_higher_coverage_improved(self):
        self.before['measurements'][0].update(id='requirements_coverage',numerator=5)
        self.after['measurements'][0].update(id='requirements_coverage',numerator=8)
        self.assertEqual(self.row('requirements_coverage')['verdict'],'OBSERVED_IMPROVEMENT')

    def test_invalid_counts_prevent_overall_success(self):
        self.after['measurements'][0]['numerator']=11
        self.assertEqual(compare(self.before,self.after)['exit_code'],3)
    def test_nonfinite_value_not_measured(self):
        self.after['measurements'][1]['value']=float('inf')
        self.assertEqual(compare(self.before,self.after)['exit_code'],3)
