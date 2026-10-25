"""Evaluate actual executions, not asserted boolean test results."""
from e4.results import verify


def evaluate(data, runs):
    minimum = 5 if data.get('release') else 3
    tolerance = data.get('max_violation_rate', 0)
    if isinstance(tolerance, bool) or not isinstance(tolerance, (int, float)) or not 0 <= tolerance <= 1:
        raise ValueError('EVAL_TOLERANCE_INVALID')
    if data['priority'] == 'P0-Safety' and tolerance != 0:
        raise ValueError('P0_SAFETY_ZERO_TOLERANCE')
    if data['priority'] not in ('P0-Safety', 'P0-Integrity', 'P1-Reasoning', 'P2-Quality', 'P3-Advisory'):
        raise ValueError('EVAL_PRIORITY_INVALID')
    if len(runs) < minimum:
        raise ValueError('EVAL_MINIMUM_RUNS_REQUIRED')
    identifiers = [r['proof']['run_id'] for r in runs]
    if len(set(identifiers)) != len(identifiers):
        raise ValueError('EVAL_DUPLICATE_EXECUTION')
    outcomes = []
    for run in runs:
        if run['current']['identity'] != data['identity'] or run['current']['instruction_hash'] != data['content_hash']:
            raise ValueError('EVAL_FOREIGN_EXECUTION')
        try:
            result = verify(run['current'], run['task_criteria'], run['proof'])
            outcomes.append({'run_id': run['proof']['run_id'], 'verified': result['verified'], 'verifier': result})
        except (ValueError, KeyError, TypeError) as error:
            outcomes.append({'run_id': run['proof']['run_id'], 'verified': False, 'reason': str(error)})
    failures = sum(not r['verified'] for r in outcomes)
    rate = failures / len(outcomes)
    passed = rate <= tolerance
    return {'result': 'VALID' if passed else 'INVALID', 'status': 'PASS' if passed else 'FAIL',
            'runs': len(outcomes), 'minimum_runs': minimum, 'violations': failures, 'violation_rate': rate,
            'max_violation_rate': tolerance, 'outcomes': outcomes,
            'host': data['identity']['host'], 'profile': 'ACTUAL_LOCAL_PROCESS_PROCEDURE',
            'native_agent_qualification': 'NOT_GRANTED'}
