"""Read-only project CP composition of unchanged E2/E3/E5 implementations."""
import json, sys, difflib
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
ENGINE = ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate'
sys.path[:0] = [str(ENGINE/'tools'), str(ROOT/'server/studio/aghr/e5'), str(ROOT/'server/studio/aghr/e3')]
from core import prepare, parse_proposal, digest, canonical, schema
from loader import read_package
from lint import lint_package
from scope import ScopeContext
from authority import SourceGrant
from doctor import doctor, inspect_patch
from render import render
from policy import eligibility as approval
from workflow import export_guard

request = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
try:
    payload, base, root = request['payload'], request['base'], Path(request['package_root'])
    prepared = prepare(payload, base)
    _, member = parse_proposal(payload)
    value = member.value
    if value['kind'] != 'GENERATED_FILE' or not value.get('adoption'):
        raise ValueError('PROJECT_ADOPTION_REQUIRED')
    project = request['project']
    if project not in ('pilot-app-l2', 'pilot-app-l3') or value['target_project_id'] != project:
        raise ValueError('REGISTERED_SANDBOX_REQUIRED')
    operation = request['operation']
    if operation == 'preview':
        files, parts = [], []
        original = request['original']
        for f in value['files']:
            if not inspect_patch(f['content']):
                raise ValueError('SECRET_DETECTED_REDACTED')
            before = original.get(f['path'])
            if before == f['content']:
                continue
            action = 'add' if before is None else 'modify'
            lines = ''.join(difflib.unified_diff((before or '').splitlines(True), f['content'].splitlines(True), fromfile='/dev/null' if before is None else 'a/'+f['path'], tofile='b/'+f['path']))
            if f['content'] and not f['content'].endswith('\n'):
                lines += '\n\\ No newline at end of file\n'
            parts.append('diff --git a/'+f['path']+' b/'+f['path']+'\n'+('new file mode 100644\n' if before is None else '')+lines)
            files.append({'path': f['path'], 'action': action, 'size': len(f['content'].encode('utf-8'))})
        data = {'proposal_version_hash': prepared['proposal_version_hash'], 'diff': ''.join(parts), 'files': files, 'source_written': False, 'state_written': False}
    elif operation in ('validate', 'generate'):
        package = read_package(root)
        grants = tuple(SourceGrant(**{**g, 'item_ids': tuple(g['item_ids']), 'advanced_kinds': tuple(g.get('advanced_kinds', []))}) for g in request['grants'])
        context = ScopeContext(path=project+('/app.mjs' if project.endswith('l2') else '/app/security.py'), agent='aghr-local-process', host_version=request['host_version'])
        report, _ = lint_package(package, root, context, grants=grants)
        items = [m.value for m in package.items]
        generated = render(items, {'engine_root': ENGINE, 'level': value['adoption']['level'], 'budget_bytes': 32768, 'proposal_version_hash': prepared['proposal_version_hash']})
        proposed_agents = next(f['content'] for f in value['files'] if f['path'] == 'AGENTS.md')
        if (operation == 'generate' or report['result'] == 'VALID') and (generated['stage'] == 'fail' or not generated['prin_007_present'] or not generated['p0_preserved'] or generated['content'] != proposed_agents):
            raise ValueError('PROPOSED_AGENTS_DOES_NOT_MATCH_ACTUAL_RENDER')
        if operation == 'validate':
            observed = doctor(items, prepared['proposal_version_hash'])
            p0 = any(i.get('defaultTier', '').startswith('P0') or i.get('force') == 'MUST_NOT' and i.get('severity') in ('high','critical') for i in items)
            data = {**report, 'proposal_version_hash': prepared['proposal_version_hash'], 'lint': report, 'doctor': observed, 'required_approvals': ['governance-owner'], 'eval_required': p0, 'skill_required': p0}
        else:
            data = generated
            schema('api.execution.schema.json', 'Generation', data)
    elif operation == 'approval':
        data = approval(request['cp'], request['decision'], request['actor'], request['requirements'])
    elif operation == 'export':
        export_guard(request['cp'], request['actor'], request['requirements'])
        data = request['cp']['preview']
        if not data or data['proposal_version_hash'] != prepared['proposal_version_hash']:
            raise ValueError('EXACT_PREVIEW_REQUIRED')
    else:
        raise ValueError('UNKNOWN_OPERATION')
    print(json.dumps({'protocol_version': '3', 'exit_code': 0, 'data': data}, ensure_ascii=False))
except Exception as error:
    print(json.dumps({'protocol_version': '3', 'exit_code': 1, 'reason': str(error)[:1000]}, ensure_ascii=False))
    sys.exit(1)
