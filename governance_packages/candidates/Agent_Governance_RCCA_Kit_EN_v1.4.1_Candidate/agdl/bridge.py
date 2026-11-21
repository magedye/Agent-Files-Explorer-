"""Explicit-file Markdown import. Never interprets document text as commands."""
from __future__ import annotations
import base64
import binascii
import re
import json
from pathlib import Path
from .io import InputError, digest, read_under

FORMATS = {'generic', 'speckit', 'openspec'}

def import_document(root: Path, path: str, flavor: str) -> dict:
    if flavor not in FORMATS:
        raise InputError('unsupported_bridge_format')
    raw = read_under(root, path)
    if len(raw) > 1_000_000:
        raise InputError('bridge_document_exceeds_1000000_bytes')
    try:
        text = raw.decode('utf-8-sig')
    except UnicodeError as exc:
        raise InputError('document_must_be_utf8') from exc
    records, losses, seen = [], [], set()
    section = None
    fence = None
    for number, line in enumerate(text.splitlines(), 1):
        marker = re.match(r'^\s*(`{3,}|~{3,})', line)
        if marker:
            char = marker[1][0]
            if fence is None:
                fence = char
            elif fence == char:
                fence = None
            losses.append({'line': number, 'reason': 'CODE_FENCE_RAW_ONLY'})
            continue
        if fence is not None:
            losses.append({'line': number, 'reason': 'CODE_CONTENT_RAW_ONLY'})
            continue
        h = re.match(r'^(#{1,6})\s+(.+)$', line)
        if h:
            heading = h[2].strip()
            if flavor == 'openspec' and heading.upper() in ('ADDED REQUIREMENTS', 'MODIFIED REQUIREMENTS', 'REMOVED REQUIREMENTS', 'RENAMED REQUIREMENTS'):
                section = heading.split()[0]
            elif flavor == 'openspec' and heading.startswith(('Requirement:', 'Scenario:')):
                records.append({'derived_id': f'LINE-{number}', 'kind': heading.split(':')[0].upper(),
                    'label': heading.split(':', 1)[1].strip(), 'delta_section': section,
                    'line': number, 'source_authority': 'UNTRUSTED_DATA'})
            else:
                records.append({'derived_id': f'LINE-{number}', 'kind': 'HEADING', 'label': heading,
                    'line': number, 'source_authority': 'UNTRUSTED_DATA'})
            continue
        m = re.match(r'^\s*[-*]\s+\[([ xX])\]\s+(.*)$', line)
        if m:
            body = m[2]
            found = re.match(r'(T\d+)\b', body) if flavor == 'speckit' else None
            external_id = found[1] if found else None
            if external_id:
                if external_id in seen:
                    losses.append({'line': number, 'reason': 'DUPLICATE_EXTERNAL_ID', 'id': external_id})
                seen.add(external_id)
            elif flavor == 'speckit':
                losses.append({'line': number, 'reason': 'TASK_ID_NOT_RECOGNIZED'})
            records.append({'derived_id': f'LINE-{number}', 'external_id': external_id,
                'kind': 'TASK_CANDIDATE', 'line': number, 'label': body,
                'reported_checkbox': 'CHECKED' if m[1].lower() == 'x' else 'UNCHECKED',
                'source_authority': 'UNTRUSTED_DATA'})
        elif line.strip():
            losses.append({'line': number, 'reason': 'RAW_ONLY_SEMANTICS_NOT_IMPORTED'})
    envelope = {'schema_version': 'agdl-envelope-1.3', 'record_kind': 'DERIVED_NON_AUTHORITATIVE',
            'format': flavor, 'path': path, 'source_sha256': digest(raw),
            'raw_base64': base64.b64encode(raw).decode('ascii'), 'records': records,
            'semantic_mapping': 'PARTIAL_NOT_LOSSLESS', 'loss_report': losses,
            'raw_round_trip': 'BYTE_PRESERVING_BY_DESIGN_VERIFY_ON_EXPORT',
            'authorization_granted': False, 'original_source_modified': False}
    if len(json.dumps(envelope, indent=2, ensure_ascii=True).encode('utf-8')) > 3_900_000:
        raise InputError('bridge_envelope_exceeds_safe_size')
    return envelope

def export_raw(envelope: dict) -> bytes:
    if not isinstance(envelope, dict) or envelope.get('schema_version') != 'agdl-envelope-1.3':
        raise InputError('invalid_envelope')
    if envelope.get('record_kind') != 'DERIVED_NON_AUTHORITATIVE':
        raise InputError('invalid_envelope_authority')
    try:
        raw = base64.b64decode(envelope['raw_base64'], validate=True)
    except (KeyError, TypeError, ValueError, binascii.Error) as exc:
        raise InputError('invalid_base64') from exc
    if len(raw) > 4_000_000 or digest(raw) != envelope.get('source_sha256'):
        raise InputError('raw_round_trip_hash_mismatch')
    return raw
