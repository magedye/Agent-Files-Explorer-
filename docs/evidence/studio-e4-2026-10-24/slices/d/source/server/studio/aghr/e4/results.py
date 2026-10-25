"""Real criteria evaluation; caller-reported PASS/VERIFIED is never consumed."""
from e4.evidence import bind_execution, strict_json, digest


def pointer(value, path):
    if not isinstance(path, str) or (path and not path.startswith('/')):
        raise ValueError('CRITERIA_POINTER_INVALID')
    for part in path.split('/')[1:] if path else []:
        part = part.replace('~1', '/').replace('~0', '~')
        value = value[int(part)] if isinstance(value, list) and part.isdecimal() else value[part]
    return value


def verify(current, criteria, proof):
    bound = bind_execution(proof, current['identity'], current['instruction_hash'])
    if bound['state'] != 'EXECUTED':
        return {**current, 'result': 'INVALID', 'state': 'EXECUTED_FAILED', 'verified': False, 'reason': 'Execution did not succeed.'}
    if not isinstance(criteria, str) or not criteria.strip() or len(criteria.encode('utf-8')) > 65536:
        raise ValueError('TASK_CRITERIA_REQUIRED')
    spec = strict_json(criteria.encode('utf-8'))
    if set(spec) - {'format', 'all'} or spec.get('format', 'json') not in ('json', 'text') or not isinstance(spec.get('all'), list) or not 1 <= len(spec['all']) <= 100:
        raise ValueError('TASK_CRITERIA_UNSUPPORTED')
    output = proof['stdout'] if spec.get('format') == 'text' else strict_json(proof['stdout'].encode('utf-8'))
    results = []
    for rule in spec['all']:
        if not isinstance(rule, dict) or set(rule) - {'pointer', 'op', 'value'} or 'pointer' not in rule or rule.get('op') not in ('equals', 'contains', 'nonempty'):
            raise ValueError('TASK_CRITERIA_UNSUPPORTED')
        if rule['op'] != 'nonempty' and 'value' not in rule:
            raise ValueError('TASK_CRITERIA_VALUE_REQUIRED')
        try:
            actual = pointer(output, rule['pointer'])
            if rule['op'] == 'equals':
                matched = type(actual) is type(rule['value']) and actual == rule['value']
            elif rule['op'] == 'contains':
                matched = isinstance(actual, (str, list, dict)) and rule['value'] in actual
            else:
                matched = isinstance(actual, (str, list, dict)) and bool(actual)
            actual_hash = digest(__import__('json').dumps(actual, ensure_ascii=False, sort_keys=True).encode('utf-8'))
        except (KeyError, IndexError, TypeError, ValueError):
            matched, actual_hash = False, None
        results.append({'pointer': rule['pointer'], 'op': rule['op'], 'passed': bool(matched), 'actual_hash': actual_hash})
    passed = all(r['passed'] for r in results)
    return {**current, 'result': 'VALID' if passed else 'INVALID', 'state': 'VERIFIED' if passed else 'EXECUTED',
            'verified': passed, 'criteria_hash': digest(criteria.encode('utf-8')), 'criteria_results': results,
            'execution': 'EXECUTED', 'execution_run_id': proof['run_id'], 'output_hash': proof['stdout_hash']}
