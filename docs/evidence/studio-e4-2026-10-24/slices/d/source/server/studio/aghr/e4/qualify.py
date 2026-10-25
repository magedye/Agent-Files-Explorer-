"""Qualification binds all four keys and actual current-process evidence."""
from datetime import datetime, timezone
from e4.eval import evaluate

KEYS = ('skillId', 'host', 'hostVersion', 'scope', 'contentHash', 'driverHash', 'engineHash')


def qualify(data, runs):
    result = evaluate(data, runs)
    if result['status'] != 'PASS':
        return {**result, 'status': 'FAILED', 'qualification': None}
    record = {**data['key'], 'status': 'QUALIFIED', 'qualifiedAt': datetime.now(timezone.utc).isoformat(),
              'evidence': [{'run_id': r['proof']['run_id'], 'content_hash': r['proof']['stdout_hash']} for r in runs],
              'profile': 'ACTUAL_LOCAL_PROCESS_PROCEDURE', 'native_agent_qualification': 'NOT_GRANTED'}
    return {**result, 'status': 'QUALIFIED', 'qualification': record}


def check(data, known):
    record, key = data['record'], data['key']
    if not known or record != known:
        return {'result': 'BLOCKED', 'status': 'NOT_RUN', 'reason': 'Qualification is not backed by this live host evidence store.'}
    if any(record.get(k) != key.get(k) for k in KEYS):
        return {'result': 'BLOCKED', 'status': 'NOT_RUN', 'reason': 'Host/version/scope/content/driver/engine changed; requalification required.'}
    return {'result': 'VALID', 'status': 'QUALIFIED', 'qualification': record}
