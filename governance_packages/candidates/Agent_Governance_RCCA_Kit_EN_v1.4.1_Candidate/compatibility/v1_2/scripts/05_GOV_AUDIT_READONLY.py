#!/usr/bin/env python3
"""Read-only, metadata-only governance source discovery.

No file contents are opened, no secrets are printed, no network actions are made.
This is *inventory*, not effective-policy proof. Requires Python 3.10+ only.
"""
from __future__ import annotations
import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys
from datetime import datetime, timezone

SKIP_DIRS = {
    '.git', '.hg', '.svn', 'node_modules', '.venv', 'venv', '__pycache__',
    'dist', 'build', '.next', '.cache', 'coverage', '.pytest_cache',
    '.tox', '.mypy_cache', 'vendor', 'target', '.terraform',
}
TARGET_NAMES = {
    'AGENTS.md', 'AGENTS.override.md', 'GEMINI.md', 'CLAUDE.md',
    'GOVERNANCE.md', 'GOVERNANCE_CHARTER.md', 'AUTHORITY_MAP.md',
    'TASK_STATE.md', 'PROJECT_CONTEXT.md', 'REQUEST_REGISTER.json',
    'OWNER_AUTHORIZATION.md', 'write-set.json', 'SKILL.md',
    'copilot-instructions.md', 'opencode.json', 'opencode.jsonc',
    'hooks.json', 'mcp_config.json', 'config.toml',
    'RULE_REGISTER.yaml', 'PERMISSION_MATRIX.md',
    'CONFLICT_REGISTER.md',
}


def classify(relative: pathlib.Path) -> str | None:
    parts = relative.parts
    name = relative.name
    if name in {'AGENTS.md', 'AGENTS.override.md', 'GEMINI.md', 'CLAUDE.md'}:
        return 'instruction_candidate'
    if name == 'SKILL.md':
        return 'skill_definition_candidate'
    if name.endswith('.instructions.md') or name.endswith('.agent.md'):
        return 'platform_instruction_candidate'
    if '.agents' in parts and ('rules' in parts or 'agents' in parts):
        return 'antigravity_customization_candidate'
    if '.opencode' in parts and 'agents' in parts:
        return 'opencode_agent_candidate'
    if '.codex' in parts and name.endswith(('.toml', '.rules')):
        return 'codex_configuration_candidate'
    if name in {'hooks.json', 'mcp_config.json', 'opencode.json', 'opencode.jsonc', 'config.toml'}:
        return 'configuration_candidate'
    if '.github' in parts and name.endswith(('.yml', '.yaml')) and 'workflows' in parts:
        return 'ci_definition_candidate'
    if '.github' in parts and name == 'copilot-instructions.md':
        return 'copilot_instruction_candidate'
    if name in TARGET_NAMES:
        return 'governance_document_candidate'
    return None


def git_read(root: pathlib.Path, *args: str):
    if not shutil.which('git'):
        return {'state': 'UNKNOWN', 'reason': 'git_not_in_PATH'}
    env = os.environ.copy()
    env['GIT_OPTIONAL_LOCKS'] = '0'
    env['GIT_TERMINAL_PROMPT'] = '0'
    try:
        r = subprocess.run(
            ['git', '-C', str(root), *args],
            text=True, capture_output=True, timeout=7,
            env=env, stdin=subprocess.DEVNULL,
        )
        if r.returncode != 0:
            return {'state': 'UNKNOWN', 'reason': 'git_command_failed'}
        return {'state': 'VERIFIED_COMMAND_OUTPUT', 'value': r.stdout.strip()}
    except (OSError, subprocess.TimeoutExpired):
        return {'state': 'UNKNOWN', 'reason': 'git_command_unavailable'}


def inventory(root: pathlib.Path, max_files: int):
    records = []
    seen = 0
    truncated = False
    # No symlink traversal; no file content reads.
    for directory, subdirectories, filenames in os.walk(root, followlinks=False):
        subdirectories[:] = [d for d in subdirectories
                             if d not in SKIP_DIRS and not (pathlib.Path(directory) / d).is_symlink()]
        for filename in filenames:
            seen += 1
            if seen > max_files:
                truncated = True
                break
            item = pathlib.Path(directory) / filename
            if item.is_symlink():
                continue
            relative = item.relative_to(root)
            kind = classify(relative)
            if kind:
                records.append({'path': relative.as_posix(), 'kind': kind, 'status': 'DISCOVERED_ONLY'})
        if truncated:
            break
    return sorted(records, key=lambda x: x['path'].lower()), seen, truncated


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='.', help='Repository root to inspect; defaults to current directory')
    parser.add_argument('--max-files', type=int, default=100000, help='Inventory safety limit')
    args = parser.parse_args()
    if args.max_files < 1:
        parser.error('--max-files must be positive')
    root = pathlib.Path(args.root).resolve(strict=True)
    if not root.is_dir():
        parser.error('--root must be a directory')
    entries, seen, truncated = inventory(root, args.max_files)
    report = {
        'tool': 'GOV_AUDIT_READONLY',
        'scope': 'repo_tree_file_names_and_local_git_only',
        'created_utc': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'root': str(root),
        'does_not_prove': ['instruction_loaded', 'permission_effective', 'enforcement', 'approval'],
        'secret_file_contents_read': False,
        'file_contents_read': False,
        'write_performed': False,
        'network_used': False,
        'git': {
            'root': git_read(root, 'rev-parse', '--show-toplevel'),
            'branch': git_read(root, 'branch', '--show-current'),
            'head': git_read(root, 'rev-parse', 'HEAD'),
            'status': git_read(root, 'status', '--porcelain=v1', '--untracked-files=all'),
            'status_scope': 'tracked_and_untracked_nonignored_files; ignored files and nested untracked directories may need separate audit',
        },
        'file_count_scanned': seen,
        'custody_inventory_complete': False,
        'note': 'Governance candidate discovery and Git porcelain only; does not prove custody of ignored files, unlisted roots or platform runtime.',
        'truncated': truncated,
        'candidates': entries,
    }
    json.dump(report, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
