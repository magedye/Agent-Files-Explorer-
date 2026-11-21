#!/usr/bin/env python3
"""Read-only path-scope diagnostic, NOT a runtime security gate or authorization proof.

Compares declared allowed/blocked paths with an explicit path list, or paths
changed relative to HEAD in a local Git worktree. Never writes or networks.
Exit 0: declared paths match; 2: path violation; 3: inconclusive/invalid input.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import unicodedata

MAX_POLICY_BYTES = 1024 * 1024
BLOCKED_SYSTEM_PREFIXES = ('.git/',)


def normalize(value: str, *, prefix: bool = False, windows_compatible: bool = True) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError('path_must_be_nonempty_string')
    raw = value.replace('\\', '/')
    if raw.startswith('/') or raw.startswith('~') or re.match(r'^[a-zA-Z]:', raw) or '://' in raw:
        raise ValueError('absolute_or_external_path')
    raw = unicodedata.normalize('NFC', raw)
    segs = raw.split('/')
    if prefix and segs[-1] == '':
        segs = segs[:-1]
    if not segs or any(x in ('', '.', '..') for x in segs):
        raise ValueError('ambiguous_or_parent_path')
    if any('\x00' in x or '\n' in x or '\r' in x or ':' in x for x in segs):
        raise ValueError('invalid_path_character')
    if any(x.casefold() == '.git' for x in segs):
        raise ValueError('git_internal_path_not_authorizable')
    for x in segs:
        if any(ord(c) < 32 for c in x) or any(c in '<>:\"|?*' for c in x):
            raise ValueError('invalid_windows_path_character')
        if x.endswith(('.', ' ')):
            raise ValueError('windows_aliasing_trailing_space_or_dot')
        base_name = x.split('.')[0].casefold()
        if base_name in ('con', 'prn', 'aux', 'nul') or re.fullmatch(r'(com|lpt)[1-9]', base_name):
            raise ValueError('reserved_windows_device_name')
    # Conservative portable comparison: casefold both policy and path.  This is
    # intentionally NOT a filesystem canonicalization or security guarantee.
    result = '/'.join(segs)
    if windows_compatible:
        result = result.casefold()
    return result + ('/' if prefix else '')


def normalize_policy_array(cfg: dict, primary: str, alias: str, *, prefix: bool = False) -> list[str]:
    v1, v2 = cfg.get(primary), cfg.get(alias)
    if v1 is not None and v2 is not None and v1 != v2:
        raise ValueError(f'conflicting_aliases:{primary}:{alias}')
    value = v1 if v1 is not None else (v2 if v2 is not None else [])
    if not isinstance(value, list) or not all(isinstance(x, str) for x in value):
        raise ValueError(f'invalid_array:{primary}')
    result = [normalize(x, prefix=prefix) for x in value]
    if len(set(result)) != len(result):
        raise ValueError(f'duplicate_policy_paths:{primary}')
    return result


def load_policy(path: Path):
    if path.is_symlink() or not path.is_file():
        raise ValueError('policy_missing_or_symlink')
    if path.stat().st_size > MAX_POLICY_BYTES:
        raise ValueError('policy_too_large')
    cfg = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(cfg, dict):
        raise ValueError('policy_must_be_json_object')
    allow_files = normalize_policy_array(cfg, 'allowed_files', 'allow_files')
    allow_prefixes = normalize_policy_array(cfg, 'allowed_prefixes', 'allow_prefixes', prefix=True)
    deny_files = normalize_policy_array(cfg, 'blocked_files', 'deny_files')
    deny_prefixes = normalize_policy_array(cfg, 'blocked_prefixes', 'deny_prefixes', prefix=True)
    if not allow_files and not allow_prefixes:
        raise ValueError('no_explicit_allowlist_fail_closed')
    return {
        'task_id': cfg.get('task_id') if isinstance(cfg.get('task_id'), str) else 'UNKNOWN',
        'declared_status': cfg.get('status') if isinstance(cfg.get('status'), str) else 'UNKNOWN',
        'allow_files': set(allow_files), 'allow_prefixes': allow_prefixes,
        'deny_files': set(deny_files), 'deny_prefixes': deny_prefixes,
    }


def is_symlink_escape(root: Path, relative: str) -> bool:
    base = root.resolve(strict=True)
    point = base
    for segment in relative.split('/'):
        point = point / segment
        if point.is_symlink():
            return True
    try:
        target = (base / relative).resolve(strict=False)
        target.relative_to(base)
    except (ValueError, OSError):
        return True
    return False


def inspect_path(root: Path, cfg: dict, path: str):
    try:
        rel = normalize(path)
    except ValueError as e:
        return {'path': str(path), 'decision': 'INVALID_PATH', 'reason': str(e)}
    if is_symlink_escape(root, rel):
        return {'path': rel, 'decision': 'INVALID_PATH', 'reason': 'symlink_or_path_escape'}
    if rel in cfg['deny_files'] or any(rel.startswith(x) for x in cfg['deny_prefixes']):
        return {'path': rel, 'decision': 'FAIL_PROTECTED_PATH'}
    if rel in cfg['allow_files'] or any(rel.startswith(x) for x in cfg['allow_prefixes']):
        return {'path': rel, 'decision': 'PASS_PATH_MATCH'}
    return {'path': rel, 'decision': 'FAIL_PATH_SCOPE'}


def git_exec(root: Path, args: list[str]) -> bytes:
    if not shutil.which('git'):
        raise RuntimeError('git_not_found')
    env = os.environ.copy()
    env['GIT_OPTIONAL_LOCKS'] = '0'
    env['GIT_TERMINAL_PROMPT'] = '0'
    cp = subprocess.run(['git', '-C', str(root), *args], stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE, timeout=15, env=env,
                        stdin=subprocess.DEVNULL)
    if cp.returncode:
        raise RuntimeError('git_command_failed')
    return cp.stdout


def paths_from_git(root: Path, mode: str, base: str) -> list[str]:
    # Explicit HEAD/object proof required; avoid silently treating a worktree without HEAD as PASS.
    git_exec(root, ['rev-parse', '--verify', f'{base}^{{commit}}'])
    args = ['diff', '--no-renames', '--name-only', '-z']
    if mode == 'staged':
        args += ['--cached', base]
    else:
        args += [base]
    paths = [p.decode('utf-8', errors='replace') for p in git_exec(root, args).split(b'\x00') if p]
    if mode == 'workspace':
        extra = git_exec(root, ['ls-files', '--others', '--exclude-standard', '-z'])
        paths += [p.decode('utf-8', errors='replace') for p in extra.split(b'\x00') if p]
    return sorted(set(paths))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root', default='.')
    ap.add_argument('--policy', required=True, help='readable JSON write-set (declaration only)')
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument('--git', action='store_true', help='read changed local Git paths')
    src.add_argument('--paths', nargs='+', help='evaluate explicit paths without reading Git')
    ap.add_argument('--mode', choices=('staged','workspace'), default='workspace')
    ap.add_argument('--base', default='HEAD', help='commit/ref to diff against; defaults to HEAD')
    ns=ap.parse_args(argv)
    report = {'tool':'WRITESET_CHECK', 'status':'INCONCLUSIVE', 'root':str(Path(ns.root).absolute()),
              'policy':str(Path(ns.policy).absolute()),'authorization_verified':False,
              'enforcement_verified':False, 'scope':'conservative_casefolded_portable_path_comparison_only',
              'paths':[], 'notes':['Casefolded portable matching; does not prove Windows filesystem path identity.',
                       'PASS_PATH_MATCH is not approval or enforced runtime permission.']}
    try:
        root=Path(ns.root).resolve(strict=True)
        if not root.is_dir(): raise ValueError('root_not_directory')
        cfg=load_policy(Path(ns.policy))
        items=paths_from_git(root,ns.mode,ns.base) if ns.git else ns.paths
        report['root']=str(root)
        report['task_id']=cfg['task_id']
        report['declared_policy_status']=cfg['declared_status']
        report['mode']=ns.mode if ns.git else 'explicit_paths'
        report['paths']=[inspect_path(root,cfg,x) for x in items]
        violations=[x for x in report['paths'] if x['decision']!='PASS_PATH_MATCH']
        report['status']='FAIL' if violations else 'PASS_WITHIN_DECLARED_PATHS'
        report['paths_checked']=len(items)
        code=2 if violations else 0
    except (ValueError, RuntimeError, OSError, subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
        report['reason']=(str(exc)[:120] if isinstance(exc, ValueError) else type(exc).__name__)
        code=3
    print(json.dumps(report,ensure_ascii=False,indent=2))
    return code


if __name__=='__main__':
    sys.exit(main())
