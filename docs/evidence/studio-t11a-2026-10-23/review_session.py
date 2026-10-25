"""Evidence-only reviewer journal. Reads frozen sources; writes only this folder."""
import hashlib
import json
from pathlib import Path
import sys
import time
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
MANIFEST = ROOT / 'docs/evidence/studio-phase1-2026-10-23/SAMPLE_MANIFEST.json'
REGISTER = ROOT / 'docs/reviews/aghr-items-2026-10-22/REVIEW_REGISTER.json'

def now():
    return datetime.now(timezone.utc).isoformat()

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def load(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))

def save(p, v):
    p.write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def source(name, expected=None):
    parts = name.split('/')
    if any(p in ('', '.', '..', 'compatibility', 'verification') or '\\' in p or ':' in p for p in parts):
        raise ValueError('Forbidden source path')
    p = ROOT
    for part in parts:
        p = p / part
        if p.is_symlink():
            raise ValueError('Source link')
    raw = p.read_bytes()
    if expected and sha(raw) != expected:
        raise ValueError('Source hash drift: ' + name)
    pins = load(OUT / 'SOURCE_PIN.json') if (OUT / 'SOURCE_PIN.json').exists() else {}
    pins[name] = {'sha256': sha(raw), 'bytes': len(raw)}
    save(OUT / 'SOURCE_PIN.json', pins)
    return raw.decode('utf-8', errors='replace')

manifest = load(MANIFEST)
raw_register = REGISTER.read_bytes()
assert sha(raw_register) == manifest['register']['sha256']
register = json.loads(raw_register)
rows = {r['id']: r for r in register['items']}
state_path = OUT / 'SESSION.json'
state = load(state_path) if state_path.exists() else {'started_at': now(), 'next': 0, 'active': None, 'decisions': [], 'clock_method': 'Measured agent review turn wall seconds from coordinator Date.now; source I/O and commit verification measured with perf_counter. Not human labor or model CPU. Tool wait is timed separately by coordinator; unobservable queue within a review turn cannot be isolated.'}
payload = json.load(sys.stdin) if len(sys.argv) > 1 and sys.argv[1] == 'advance' else {}

if payload.get('decision'):
    start = time.perf_counter()
    d = payload['decision']
    assert state['active'] == d['id']
    r = rows[d['id']]
    source(r['source']['path'], r['source']['sha256'])
    assert d['review_status'] in ('RESOLVED', 'UNRESOLVED')
    assert d['classification'] in ('governing', 'non-governing', 'unresolved')
    assert d['route'] in ('structured-direct', 'source-reread', 'owner-clarification', 'non-instruction')
    if d['review_status'] == 'UNRESOLVED':
        assert d.get('owner_question') and d.get('missing_fields') and d.get('disposition') is None
    else:
        assert d['disposition'] in ('Adopt', 'Merge', 'Defer', 'Reject')
        assert not d.get('owner_question')
    if d['disposition'] == 'Merge':
        assert d.get('merge_targets') and d.get('semantic_basis')
    d.update({'source': r['source'], 'source_record_type': r['record_type'], 'title': r['title'], 'original_text': r['original_text'], 'governing_effect': 'NONE', 'human_review_performed': False, 'migration_performed': False, 'reviewer': 'Codex agent; not independent review', 'recorded_at': now(), 'read_seconds': state['read_seconds'], 'classify_seconds': payload['classify_seconds'], 'verification_seconds': time.perf_counter() - start, 'rework_seconds': 0.0, 'review_clock_start_ms': payload['review_clock_start_ms'], 'review_clock_end_ms': payload['review_clock_end_ms']})
    state['decisions'].append(d)
    with (OUT / 'REVIEW_EVENTS.jsonl').open('a', encoding='utf-8') as f:
        f.write(json.dumps({'event': 'decision', 'id': d['id'], 'at': now(), 'review_clock_start_ms': d['review_clock_start_ms'], 'review_clock_end_ms': d['review_clock_end_ms'], 'classify_seconds': d['classify_seconds'], 'read_seconds': d['read_seconds'], 'verification_seconds': d['verification_seconds']}, ensure_ascii=False) + '\n')
    state['active'] = None
    state['next'] += 1

if state['next'] < len(manifest['ids']):
    start = time.perf_counter()
    rid = manifest['ids'][state['next']]
    r = rows[rid]
    text = source(r['source']['path'], r['source']['sha256'])
    loc = r['source']
    packet = {'position': state['next'] + 1, 'id': rid, 'record_type': r['record_type'], 'source': loc, 'original_text': r['original_text'], 'payload': r['original_payload'], 'proposed_kind_not_accepted': r['migration'].get('proposed_kind'), 'migration_missing_not_automatically_mandatory': r['migration'].get('missing_details'), 'context_metadata': r.get('context'), 'related_rule_ids': r.get('related_rule_ids')}
    pointer = loc.get('json_pointer')
    if pointer and r.get('original_payload') is not None:
        value = json.loads(text)
        for bit in pointer.strip('/').split('/'):
            key = bit.replace('~1', '/').replace('~0', '~')
            value = value[int(key)] if isinstance(value, list) else value[key]
        assert value == r['original_payload']
        packet['pointer_verified'] = True
    if loc.get('line_start'):
        lines = text.splitlines()
        first = max(1, loc['line_start'] - 5)
        last = min(len(lines), loc['line_end'] + 5)
        packet['source_context'] = '\n'.join(f'{n}: {lines[n-1]}' for n in range(first, last + 1))
    if r['record_type'] == 'SKILL':
        skill = r['original_payload']
        skill_path = str(Path(r['source']['path']).parent.parent / skill['path']).replace('\\', '/')
        packet['skill_instructions'] = source(skill_path, skill['sha256'])
    packet['read_seconds'] = time.perf_counter() - start
    state.update(active=rid, read_seconds=packet['read_seconds'], opened_at=now())
    save(state_path, state)
    print(json.dumps(packet, ensure_ascii=False))
else:
    state['finished_at'] = now()
    save(state_path, state)
    print(json.dumps({'reviewed': len(state['decisions']), 'state': 'READY_FOR_METRICS_NOT_OWNER_ACCEPTED'}))
