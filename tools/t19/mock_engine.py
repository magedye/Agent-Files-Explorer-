"""Owner-authorized T19 simulator. Never imported by the application.

The JS host authenticates the three signed MOCK receipts before invocation.
Only SEC-001's source/gate/eval are simulated; all other native guards remain.
"""
import hashlib
import json
import sys
from copy import deepcopy
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
ENGINE = ROOT / 'governance_packages/candidates/AGHR_rc3_Core_Candidate'
sys.path[:0] = [str(ROOT / 'server/studio/aghr/e3'), str(ROOT / 'server/studio/aghr/e5'), str(ENGINE / 'tools')]
PROFILE = 'T19_OWNER_APPROVED_MOCK'


def run(r):
    import core
    import policy
    from authority import SourceGrant
    from doctor import doctor
    from workflow import preview, export_guard
    h = r['host']
    payload, base, op = r['payload'], r['base'], r['operation']
    prepared = core.prepare(payload, base)
    binding = h['binding']
    if (h['profile'] != PROFILE or binding['proposal_version_hash'] != prepared['proposal_version_hash']
            or binding['base'] != base or h['production_permission'] != 'NOT_GRANTED'):
        raise ValueError('MOCK_PROPOSAL_BINDING')
    parsed, member = core.parse_proposal(payload)
    item = member.value
    if item['id'] != 'SEC-001' or h['source']['source_sha256'] != parsed.source.sha256:
        raise ValueError('MOCK_ITEM_BINDING')
    if h['gate']['gate'] != item['enforcement']['gate'] or h['gate']['profile'] != PROFILE:
        raise ValueError('MOCK_GATE_BINDING')
    if h['eval']['profile'] != 'T19_MOCK_EVAL_EVIDENCE' or h['eval']['executed'] is not False:
        raise ValueError('MOCK_EVAL_LABEL_REQUIRED')
    grants = (SourceGrant(**{**h['source'], 'item_ids': tuple(h['source']['item_ids'])}),)

    def simulated_doctor(items, version):
        observed = doctor(items, version)
        for o in observed['observations']:
            if o['item_id'] == 'SEC-001':
                o.update(status='PASS', profile=PROFILE, simulated=True,
                         evidence=h['receipt_hashes']['GitHubGate.json'],
                         reason='MOCK GitHub gate; no remote observation')
        observed.update(status='PASS' if all(o['status'] == 'PASS' for o in observed['observations']) else 'BLOCKED',
                        profile=PROFILE, simulated=True, production_permission='NOT_GRANTED')
        return observed

    if op == 'validate':
        original_lint = policy.lint_package
        def with_signed_mock_grant(package, root, context, **kwargs):
            return original_lint(package, root, context, grants=grants)
        with patch.object(policy, 'lint_package', with_signed_mock_grant), patch.object(policy, 'doctor', simulated_doctor):
            data = policy.verify(payload, base, ENGINE)
        removed = [f for f in data['findings'] if f['code'] == 'P0_EVAL_QUALIFICATION_UNAVAILABLE'
                   and f.get('item_id') == 'SEC-001' and f['disposition'] == 'BLOCKED']
        findings = [f for f in data['findings'] if f not in removed]
        result = 'INVALID' if any(f['disposition'] == 'INVALID' for f in findings) else 'BLOCKED' if any(f['disposition'] == 'BLOCKED' for f in findings) else 'VALID'
        code = {'VALID': 0, 'INVALID': 1, 'BLOCKED': 3}[result]
        for k in ('validation', 'lint'):
            data[k] = {**data[k], 'profile': PROFILE, 'result': result, 'exit_code': code,
                       'findings': [f for f in data[k]['findings'] if f not in removed]}
            data[k]['stages']['evidence'] = {'status': 'PASS' if result == 'VALID' else result, 'profile': PROFILE}
        data.update(result=result, exit_code=code, findings=findings, eval_required=True,
                    mock_resolutions=removed, real_e4_status='NOT_RUN')
    elif op == 'doctor':
        data = simulated_doctor([m.value for m in core.overlay(payload, ENGINE).items], prepared['proposal_version_hash'])
    elif op in ('approval', 'export'):
        cp = deepcopy(r['cp'])
        if cp['proposal_version_hash'] != prepared['proposal_version_hash']:
            raise ValueError('MOCK_STALE_CP')
        if cp['source']['ref'] != PROFILE or not r['actor']['authenticated_actor'].startswith('T19_MOCK_'):
            raise ValueError('MOCK_CONTEXT_REQUIRED')
        # Only this ephemeral copy consumes the mock eval. The stored E4 check
        # remains NOT_RUN, so native approval/export still refuse this database.
        cp['checks']['eval'] = {'status': 'PASS', 'profile': 'T19_MOCK_EVAL_EVIDENCE',
                                'executed': False, 'evidence': [h['eval']]}
        if op == 'approval':
            if PROFILE not in r['decision'].get('reason', ''):
                raise ValueError('MOCK_APPROVAL_LABEL_REQUIRED')
            data = policy.eligibility(cp, r['decision'], r['actor'], r['requirements'])
        else:
            export_guard(cp, r['actor'], r['requirements'])
            data = preview(payload, base, ENGINE)
            data['diff'] = '# ' + PROFILE + '; MOCK ONLY; NOT FOR MERGE OR RELEASE\n# T19_MOCK_EVAL_EVIDENCE; REAL E4 NOT_RUN\n' + data['diff']
    else:
        raise ValueError('MOCK_OPERATION_UNSUPPORTED')
    return {**data, 'profile': PROFILE, 'simulated': True, 'production_permission': 'NOT_GRANTED',
            'mock_receipts': h, 'real_e4_status': 'NOT_RUN'}


def main():
    report = {'protocol_version': '3', 'command': None, 'result': 'ERROR', 'exit_code': 2,
              'source': None, 'checks': {'status': 'NOT_RUN'}, 'diagnostics': [], 'data': None}
    try:
        raw = Path(sys.argv[1]).read_bytes()
        if len(raw) > 262144:
            raise ValueError('MOCK_INPUT_LIMIT')
        request = json.loads(raw.decode('utf-8'))
        report['command'] = request['operation']
        report['source'] = {'implementation_id': 't19-owner-approved-mock', 'revision': 't19.mock.1',
                            'content_hash': request['mock_source_hash'], 'publisher_authentication': 'MOCK'}
        data = run(request)
        result = data.get('result', 'READ')
        if request['operation'] == 'doctor':
            result = 'VALID' if data['status'] == 'PASS' else 'BLOCKED'
        code = {'VALID': 0, 'READ': 0, 'INVALID': 1, 'BLOCKED': 3}[result]
        report.update(data=data, result=result, exit_code=code, checks={'status': 'COMPLETE', 'profile': PROFILE})
    except Exception as error:
        report.update(result='INVALID', exit_code=1, diagnostics=[{'code': 'MOCK_REJECTED', 'message': str(error)}])
    print(json.dumps(report, ensure_ascii=False, allow_nan=False, separators=(',', ':')))
    print(PROFILE + ': simulated source/gate/eval; real E4 NOT_RUN; no production permission.', file=sys.stderr)
    return report['exit_code']


if __name__ == '__main__':
    raise SystemExit(main())
