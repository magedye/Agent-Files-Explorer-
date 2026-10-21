import unittest
from tools.decision_support import assess_intake, FIELDS


def ordinary():
    return dict(owner_paused=False, write_action=True, write_authorized=True,
                within_scope=True, required_source_available=True, material_ambiguity=False,
                unresolved_source_conflict=False, can_resolve_from_sources=False,
                high_impact_or_context_change=False, matching_confirmation_valid=False,
                new_material_effect=False, required_controls_ready=True,
                independent_work_authorized=False)


class IntakeTests(unittest.TestCase):
    def test_routine_does_not_add_approval(self):
        r = assess_intake(ordinary())
        self.assertEqual(r['blockers'], [])
        self.assertFalse(r['permission_granted'])

    def test_material_question(self):
        f = ordinary(); f['material_ambiguity'] = True
        self.assertIn('ASK_MATERIAL_QUESTION_WITH_OPTIONS', assess_intake(f)['blockers'])

    def test_sources_before_question(self):
        f = ordinary(); f.update(material_ambiguity=True, can_resolve_from_sources=True)
        r = assess_intake(f)
        self.assertIn('INSPECT_AUTHORIZED_SOURCES_FIRST', r['blockers'])
        self.assertNotIn('ASK_MATERIAL_QUESTION_WITH_OPTIONS', r['blockers'])

    def test_source_unavailable_blocks_affected_action(self):
        f = ordinary(); f.update(required_source_available=False, independent_work_authorized=True)
        r = assess_intake(f)
        self.assertIn('REQUIRED_SOURCE_UNAVAILABLE', r['blockers'])
        self.assertTrue(r['independent_work_candidate'])

    def test_pause_blocks_independent_work(self):
        f = ordinary(); f.update(owner_paused=True, independent_work_authorized=True)
        r = assess_intake(f)
        self.assertEqual(r['recommended_route'], 'STOP_AND_CHECKPOINT')
        self.assertFalse(r['independent_work_candidate'])

    def test_review_does_not_authorize_write(self):
        f = ordinary(); f['write_authorized'] = False
        self.assertIn('WRITE_AUTHORIZATION_NOT_REPORTED', assess_intake(f)['blockers'])

    def test_read_only_does_not_need_write_authorization(self):
        f = ordinary(); f.update(write_action=False, write_authorized=False)
        self.assertNotIn('WRITE_AUTHORIZATION_NOT_REPORTED', assess_intake(f)['blockers'])

    def test_scope_boundary(self):
        f = ordinary(); f['within_scope'] = False
        self.assertIn('OUTSIDE_DECLARED_SCOPE', assess_intake(f)['blockers'])

    def test_unresolved_conflict(self):
        f = ordinary(); f['unresolved_source_conflict'] = True
        self.assertIn('RESOLVE_AUTHORITY_CONFLICT', assess_intake(f)['blockers'])

    def test_high_impact_requires_matching_confirmation(self):
        f = ordinary(); f['high_impact_or_context_change'] = True
        self.assertIn('CONFIRM_CHANGED_OR_UNCOVERED_EFFECT', assess_intake(f)['blockers'])

    def test_matching_prior_confirmation_not_repeated(self):
        f = ordinary(); f.update(high_impact_or_context_change=True, matching_confirmation_valid=True)
        self.assertNotIn('CONFIRM_CHANGED_OR_UNCOVERED_EFFECT', assess_intake(f)['blockers'])

    def test_changed_effect_revalidates_old_confirmation(self):
        f = ordinary(); f.update(new_material_effect=True, matching_confirmation_valid=True)
        self.assertIn('CONFIRM_CHANGED_OR_UNCOVERED_EFFECT', assess_intake(f)['blockers'])

    def test_missing_control(self):
        f = ordinary(); f['required_controls_ready'] = False
        self.assertIn('REQUIRED_CONTROL_NOT_READY', assess_intake(f)['blockers'])

    def test_all_reasons_visible(self):
        f = ordinary(); f.update(write_authorized=False, material_ambiguity=True, required_controls_ready=False)
        self.assertEqual(len(assess_intake(f)['blockers']), 3)

    def test_missing_field_rejected(self):
        f = ordinary(); f.pop('within_scope')
        with self.assertRaises(ValueError): assess_intake(f)

    def test_unknown_field_rejected(self):
        f = ordinary(); f['force_allow'] = True
        with self.assertRaises(ValueError): assess_intake(f)

    def test_coercion_rejected(self):
        for value in (1, 0, 'true', None, []):
            with self.subTest(value=value):
                f = ordinary(); f['write_authorized'] = value
                with self.assertRaises(ValueError): assess_intake(f)

    def test_contradictory_source_flags_rejected(self):
        f = ordinary(); f.update(required_source_available=False, can_resolve_from_sources=True)
        with self.assertRaises(ValueError): assess_intake(f)

    def test_no_input_is_never_permission(self):
        self.assertFalse(assess_intake(ordinary())['facts_independently_verified'])
        with self.assertRaises(ValueError): assess_intake({})

    def test_documented_field_set(self):
        self.assertEqual(set(ordinary()), FIELDS)
