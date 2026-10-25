"""E4 evidence.1: immutable byte custody, structure != producer authenticity.

Only the trusted host bridge may supply live process receipts. Imported JSONL
retains its claims but cannot establish EXECUTED, VERIFIED or HOST_SIGNAL.
"""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath

MAX_BYTES = 1024 * 1024
MAX_EVENTS = 1000


def digest(raw):
    return 'sha256:' + hashlib.sha256(raw).hexdigest()


def strict_json(raw):
    def pairs(rows):
        result = {}
        for k, v in rows:
            if k in result:
                raise ValueError('DUPLICATE_JSON_KEY')
            result[k] = v
        return result
    return json.loads(raw.decode('utf-8'), object_pairs_hook=pairs,
                      parse_constant=lambda _: (_ for _ in ()).throw(ValueError('NONFINITE_JSON')))


def reject_simulated(value):
    """Labels inside claims do not become native evidence, even when signed."""
    if isinstance(value, dict):
        for key, child in value.items():
            if key in ('simulated', 'mock') and child is not False:
                raise ValueError('SIMULATED_EVIDENCE_REJECTED')
            reject_simulated(child)
    elif isinstance(value, list):
        for child in value:
            reject_simulated(child)
    elif isinstance(value, str) and any(marker in value.upper() for marker in (
            'T19_OWNER_APPROVED_MOCK', 'T19_MOCK_EVAL_EVIDENCE', 'T12_OWNER_APPROVED_MOCK',
            'T06_MOCK_ONLY', 'PROVISIONAL', 'MOCK_EVIDENCE')):
        raise ValueError('SIMULATED_EVIDENCE_REJECTED')


def read_artifact(root, relative, expected_hash=None, allow_empty=False):
    root = Path(root)
    p = PurePosixPath(relative)
    if (not root.is_absolute() or not isinstance(relative, str) or '\\' in relative
            or p.is_absolute() or ':' in relative or any(s in ('', '.', '..') for s in relative.split('/'))):
        raise ValueError('EVIDENCE_PATH_INVALID')
    if root.is_symlink() or root.resolve() != root:
        raise ValueError('EVIDENCE_ROOT_REPARSE')
    target = root
    for part in p.parts:
        target = target / part
        if target.is_symlink() or target.resolve() != target or not target.resolve().is_relative_to(root):
            raise ValueError('EVIDENCE_PATH_ESCAPE')
    with target.open('rb') as stream:
        before = os.fstat(stream.fileno())
        if before.st_size > MAX_BYTES:
            raise ValueError('EVIDENCE_SIZE_LIMIT')
        raw = stream.read(MAX_BYTES + 1)
        after = os.fstat(stream.fileno())
    if not target.is_file() or len(raw) > MAX_BYTES or (before.st_ino, before.st_size, before.st_mtime_ns) != (after.st_ino, after.st_size, after.st_mtime_ns):
        raise ValueError('EVIDENCE_CHANGED_OR_UNSAFE')
    if expected_hash is not None and digest(raw) != expected_hash:
        raise ValueError('EVIDENCE_HASH_MISMATCH')
    if not allow_empty and not raw.strip():
        raise ValueError('EMPTY_EVIDENCE')
    return raw, {'path': relative, 'content_hash': digest(raw), 'bytes': len(raw)}


def load_events(root, relative, task_id, session):
    from core import schema
    raw, artifact = read_artifact(root, relative)
    lines = raw.splitlines()
    if not lines or len(lines) > MAX_EVENTS:
        raise ValueError('EVENT_COUNT_LIMIT')
    records = []
    for number, line in enumerate(lines, 1):
        record = strict_json(line)
        reject_simulated(record)
        schema('evidence.schema.json', None, record)
        if record['task_id'] != task_id or record['session'] != session:
            raise ValueError('FOREIGN_TASK_OR_SESSION')
        records.append({'line': number, 'raw_hash': digest(line), 'record': record})
    return {'artifact': artifact, 'records': records, 'producer_authentication': 'NOT_ESTABLISHED',
            'execution_status': 'NOT_OBSERVABLE', 'reason': 'Imported assertions require independent live execution receipts.'}


def bind_execution(proof, identity, instruction_hash):
    """Proof is host-only transport; not an object accepted from public input."""
    if not proof:
        raise ValueError('EXECUTION_EVIDENCE_REQUIRED')
    reject_simulated(proof)
    if proof.get('identity') != identity or proof.get('instruction_hash') != instruction_hash:
        raise ValueError('EXECUTION_CONTEXT_MISMATCH')
    if proof.get('origin') != 'E4_LIVE_PROCESS_RECEIPT' or not proof.get('run_id'):
        raise ValueError('EXECUTION_PRODUCER_UNVERIFIED')
    process = proof.get('process', {})
    if process.get('active_processes_after') != 0 or not process.get('started'):
        raise ValueError('EXECUTION_PROCESS_UNVERIFIED')
    output = proof.get('stdout', '').encode('utf-8')
    if digest(output) != proof.get('stdout_hash') or digest(proof.get('stderr', '').encode('utf-8')) != proof.get('stderr_hash'):
        raise ValueError('EXECUTION_OUTPUT_HASH_MISMATCH')
    if process.get('status') != 'passed' or process.get('exit_code') != 0:
        return {'state': 'EXECUTED_FAILED', 'proof': proof}
    if not output.strip():
        raise ValueError('EMPTY_OUTPUT')
    return {'state': 'EXECUTED', 'proof': proof}
