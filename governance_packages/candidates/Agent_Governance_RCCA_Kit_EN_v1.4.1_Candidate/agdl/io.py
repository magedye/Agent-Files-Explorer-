"""Bounded local reads. This module is a diagnostic guard, not a sandbox or PEP."""
from __future__ import annotations
import hashlib
import json
import re
import stat
import unicodedata
from pathlib import Path
from typing import Any

MAX_BYTES = 4_000_000
SENSITIVE_NAMES = {'.env', 'credentials.json', 'id_rsa', 'id_ed25519', 'id_dsa'}
SENSITIVE_DIRS = {'.git', '.ssh', '.aws', '.azure', '.gnupg'}
SENSITIVE_SUFFIXES = {'.pem', '.key', '.p12', '.pfx'}
RESERVED = re.compile(r'^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)', re.I)

class InputError(ValueError):
    """An invalid, inaccessible, or unsafe diagnostic input."""

def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, ensure_ascii=True, separators=(',', ':'), allow_nan=False).encode('utf-8')

def _pairs(pairs):
    obj = {}
    for key, value in pairs:
        if key in obj:
            raise InputError('duplicate_json_key:' + key)
        obj[key] = value
    return obj

def loads(raw: bytes):
    if len(raw) > MAX_BYTES:
        raise InputError('input_too_large')
    try:
        return json.loads(raw.decode('utf-8-sig'), object_pairs_hook=_pairs,
                          parse_constant=lambda value: (_ for _ in ()).throw(InputError('non_finite_number')))
    except (UnicodeError, json.JSONDecodeError, RecursionError) as exc:
        raise InputError('invalid_json_or_encoding') from exc

def read_explicit(path: Path, limit: int = MAX_BYTES) -> bytes:
    """Read a caller-selected file; no directory discovery and no content execution."""
    if path.is_symlink() or (hasattr(path, 'is_junction') and path.is_junction()):
        raise InputError('linked_input_rejected')
    try:
        before = path.stat()
        if not stat.S_ISREG(before.st_mode):
            raise InputError('not_regular_file')
        if before.st_size > limit:
            raise InputError('input_too_large')
        with path.open('rb') as stream:
            raw = stream.read(limit + 1)
        after = path.stat()
    except OSError as exc:
        raise InputError('input_inaccessible:' + type(exc).__name__) from exc
    if len(raw) > limit:
        raise InputError('input_too_large')
    if (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns) != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns):
        raise InputError('input_changed_during_read')
    return raw

def relative_name(value: str) -> str:
    if not isinstance(value, str) or not value:
        raise InputError('path_must_be_nonempty_string')
    if unicodedata.normalize('NFKC', value) != value:
        raise InputError('noncanonical_unicode_path')
    if '\\' in value or ':' in value or value.startswith('/') or any(ord(c) < 32 for c in value):
        raise InputError('nonportable_or_absolute_path')
    parts = value.split('/')
    if any(p in ('', '.', '..') or p.endswith((' ', '.')) or RESERVED.match(p) for p in parts):
        raise InputError('invalid_path_component')
    low = [p.casefold() for p in parts]
    if any(p in SENSITIVE_DIRS for p in low) or low[-1] in SENSITIVE_NAMES or low[-1].startswith('.env.') or Path(low[-1]).suffix in SENSITIVE_SUFFIXES:
        raise InputError('sensitive_path_not_read')
    return value

def safe_path(root: Path, value: str) -> Path:
    relative_name(value)
    base = root.resolve(strict=True)
    if not base.is_dir():
        raise InputError('root_not_directory')
    target = base
    for part in value.split('/'):
        target = target / part
        if target.is_symlink() or (hasattr(target, 'is_junction') and target.is_junction()):
            raise InputError('linked_path_rejected')
    try:
        target.resolve(strict=False).relative_to(base)
    except ValueError as exc:
        raise InputError('path_outside_root') from exc
    return target

def read_under(root: Path, value: str) -> bytes:
    return read_explicit(safe_path(root, value))
