"""Host-neutral decisions over actual, trusted-adapter discovery observations."""
import unicodedata
from e4.evidence import reject_simulated


def normalize(text):
    value = unicodedata.normalize('NFKC', text).casefold()
    return ''.join(c for c in value if unicodedata.category(c) != 'Mn').translate(str.maketrans('أإآى', 'اااي'))


def discover(data, capture, permissions):
    reject_simulated(capture)
    if capture.get('registry_status') != 'available':
        return {'result': 'BLOCKED', 'status': 'DISCOVERY_UNAVAILABLE', 'selected': [], 'halt': True}
    entries = capture['skills']
    ids = [s['id'] for s in entries]
    if len(ids) != len(set(ids)):
        raise ValueError('DUPLICATE_SKILL_ID')
    requested = data.get('requested_id')
    if requested is not None and requested not in ids:
        return {'result': 'INVALID', 'status': 'UNKNOWN_ID', 'selected': [], 'halt': True}
    query = normalize(data.get('query', ''))
    candidates = [s for s in entries if s['id'] == requested] if requested else [s for s in entries if any(normalize(t) in query for t in s['triggers'])]
    if not candidates:
        return {'result': 'VALID', 'status': 'NO_SKILL_MATCH', 'selected': [], 'halt': False}
    required = data.get('capabilities', [])
    if required:
        candidates = [s for s in candidates if set(required).intersection(s['capabilities'])]
    if not candidates:
        return {'result': 'VALID', 'status': 'NO_SKILL_MATCH', 'selected': [], 'halt': False}
    selected, alternatives, remaining = [], [], set(required)
    for skill in sorted(candidates, key=lambda s: (s.get('preference', 100), s['id'])):
        if selected and (not required or not remaining.intersection(skill['capabilities'])):
            alternatives.append(skill['id'])
            continue
        if not skill['available']:
            return {'result': 'BLOCKED', 'status': 'NOT_OBSERVABLE', 'selected': [], 'halt': True, 'skill_id': skill['id'], 'reason': 'Installed content is not executable in this host session.'}
        if not set(skill['requires']).issubset(permissions):
            return {'result': 'BLOCKED', 'status': 'BLOCKED', 'selected': [], 'halt': True, 'skill_id': skill['id'], 'reason': 'Required permissions not granted; no direct-execution fallback.'}
        selected.append(skill['id'])
        remaining.difference_update(skill['capabilities'])
    if remaining:
        return {'result': 'BLOCKED', 'status': 'BLOCKED', 'selected': [], 'halt': True, 'reason': 'Requested capability set is only partially covered; no silent fallback.'}
    return {'result': 'VALID', 'status': 'SELECTED' if selected else 'NO_SKILL_MATCH', 'selected': selected,
            'alternatives_not_loaded': alternatives, 'halt': False, 'host': capture['host_id'], 'host_version': capture['host_version'], 'phase': data['phase']}
