"""E3 composition of accepted E2 with real E3 observations. E4 never waived."""
from copy import deepcopy
from authority import SourceGrant
from lint import lint_package
from scope import ScopeContext
from core import prepare,overlay,digest
from doctor import doctor

def verify(payload,base,root,attestations=()):
    prepared=prepare(payload,base);package=overlay(payload,root)
    grants=[]
    for data in attestations:
        # Host transport only; HTTP input never reaches this parameter.
        if data['level'] not in ('project','component'):
            raise ValueError('LOCAL_OPERATOR_CANNOT_ATTEST_ENTERPRISE_OR_ORGANIZATION')
        grants.append(SourceGrant(**{**data,'item_ids':tuple(data['item_ids']),'advanced_kinds':tuple(data.get('advanced_kinds',()))}))
    report,_=lint_package(package,root,ScopeContext(),grants=tuple(grants))
    before=deepcopy(report)
    observed=doctor([m.value for m in package.items],prepared['proposal_version_hash'])
    supported={o['item_id'] for o in observed['observations'] if o['status']=='PASS'}
    resolved=[f for f in report['findings'] if f['code']=='ENFORCEMENT_E3_EVIDENCE_UNAVAILABLE' and f['item_id'] in supported]
    findings=[f for f in report['findings'] if f not in resolved]
    # Appendix A makes critical/high prohibitions P0; omitting defaultTier
    # cannot be used to evade a deferred mandatory E4 behavioral gate.
    for member in package.items:
        item=member.value
        if item['force']=='MUST_NOT' and item['severity'] in ('critical','high') and 'defaultTier' not in item and not any(f['code']=='P0_EVAL_QUALIFICATION_UNAVAILABLE' and f.get('item_id')==item['id'] for f in findings):
            from validate import finding
            findings.append(finding(member,'P0_EVAL_QUALIFICATION_UNAVAILABLE','/defaultTier',disposition='BLOCKED',message='Canonical P0 prohibition requires E4; omission is not a waiver.'))
    result='INVALID' if any(f['disposition']=='INVALID' for f in findings) else 'BLOCKED' if any(f['disposition']=='BLOCKED' for f in findings) else 'VALID'
    report={**report,'profile':'E3_LOCAL_DRAFT_PIPELINE','result':result,'exit_code':{'VALID':0,'INVALID':1,'BLOCKED':3}[result],
            'findings':findings,'e3_resolved':[{'finding':f,'doctor_run':observed['run_id'],'control_hash':observed['control_hash']} for f in resolved]}
    # Stage projections must agree with remaining E4/source failures.
    for name in ('evidence',):
        codes=[f for f in findings if f['code'] not in ('AUTHORITY_SOURCE_UNVERIFIED','AUTHORITY_NOT_ACTIVE') and f['disposition']=='BLOCKED']
        report['stages'][name]={'status':'BLOCKED' if codes else 'PASS'}
    return {'result':result,'exit_code':report['exit_code'],'proposal_version_hash':prepared['proposal_version_hash'],
            'findings':[f for f in findings if f['disposition']!='WARNING'],'validation':report,'lint':report,
            'e2_before_e3':before,'doctor':observed,'required_approvals':required_roles(payload),
            'eval_required':any(f['code']=='P0_EVAL_QUALIFICATION_UNAVAILABLE' for f in findings),
            'skill_required':any(m.value['kind']=='CAPABILITY' or m.value['scope'].get('skillIds') for m in package.items)}

def required_roles(payload):
    # Current item mutations target policies/**, hence §16.1 meta governance.
    # Security changes require a distinct security reviewer as well as owner.
    return ['governance-owner','security-owner']

def eligibility(cp,request,actor,requirements):
    from core import schema,approval_binding
    schema('api.change.schema.json','ApprovalRequest',request)
    if request['role']!=actor['server_resolved_role']:raise ValueError('APPROVAL_ROLE_MISMATCH')
    if cp['status'] not in ('in_review','approved'):raise ValueError('REVIEW_STATUS_REQUIRED')
    if request['role'] not in cp['required_approvals']:raise ValueError('APPROVAL_SLOT_NOT_REQUIRED')
    for approval in cp['approvals']:approval_binding(cp['proposal_version_hash'],approval)
    if request['decision']=='reject':return {'ready':True,'acknowledgements':[],'next_status':'rejected'}
    blockers=[]
    for name in ('validate','lint','generate','doctor'):
        if cp['checks'][name]['status']!='PASS':blockers.append(name+':'+cp['checks'][name]['status'])
    if requirements.get('eval_required',True) and cp['checks']['eval']['status']!='PASS':blockers.append('E4_EVAL_'+cp['checks']['eval']['status'])
    if requirements.get('skill_required',True) and cp['checks']['skill_states']['status'] not in ('PASS','NOT_APPLICABLE'):blockers.append('SKILL_STATES_'+cp['checks']['skill_states']['status'])
    generation=cp['generation']
    if not generation or generation['stage']=='fail' or not generation['p0_preserved'] or not generation['prin_007_present'] or generation['byte_size']>generation['budget_bytes']:
        blockers.append('GENERATION_NOT_ACCEPTABLE')
    if any(a['decision']=='reject' for a in cp['approvals']):blockers.append('REJECTED_CURRENT_VERSION')
    acknowledgements=request.get('acknowledgements',[])
    if generation and generation['stage'] in ('compress','compact'):
        prior_acks=[a for a in generation['acknowledgements'] if a['stage']==generation['stage'] and a['content_hash']==generation['content_hash']]
        current_ack=any(a['stage']==generation['stage'] for a in acknowledgements)
        if not current_ack and not prior_acks:blockers.append('ACKNOWLEDGEMENT_REQUIRED')
        owner_ack=(current_ack and actor['server_resolved_role']=='governance-owner') or any(a['role']=='governance-owner' for a in prior_acks)
        if generation['stage']=='compact' and (not owner_ack or generation['lookup']['status']!='PASS'):
            blockers.append('COMPACT_OWNER_AND_LOOKUP_REQUIRED')
    if blockers:raise ValueError('APPROVAL_BLOCKED:'+','.join(blockers))
    decisions=[a for a in cp['approvals'] if a['decision']=='approve']+[{'role':request['role'],'approver':actor['authenticated_actor']}]
    complete=all(any(a['role']==r for a in decisions) for r in cp['required_approvals']) and (len(cp['required_approvals'])<2 or len({a['approver'] for a in decisions})>=2)
    return {'ready':True,'acknowledgements':acknowledgements,'next_status':'approved' if complete else 'in_review'}
