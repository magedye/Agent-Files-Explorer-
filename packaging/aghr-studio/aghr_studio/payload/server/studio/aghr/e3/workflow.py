"""Pure Python workflow outputs. Missing E4/source/reviewer evidence blocks acceptance."""
import difflib
from pathlib import Path
import re
from core import prepare,overlay,digest,schema,canonical
from render import render,required_principle
from doctor import inspect_patch

def items_for(payload,root):
    items=[m.value for m in overlay(payload,root).items]
    if not any(i['id']=='PRIN-007' for i in items):
        # Required protocol text already adopted by the Studio contract; no
        # authority fields or qualification claims are synthesized into a CP.
        principle=required_principle(root)
        principle['defaultTier']='P1-Reasoning'
        items.append(principle)
    return items

def generation(payload,base,root,request,lookup_context=None):
    schema('api.execution.schema.json','GeneratePreviewRequest',request)
    if request['agent']!='codex' or request['profile']!='draft-l1':raise ValueError('PREVIEW_PROFILE_UNAVAILABLE')
    h=prepare(payload,base)['proposal_version_hash']
    context=lookup_context or {}
    command='node tools/aghr_get_rule.mjs --cp-id='+str(context.get('cp_id','CP_UNAVAILABLE'))+' --hash='+h
    if context.get('database'):command+=' --database='+json_quote(context['database'])
    result=render(items_for(payload,root),{'engine_root':str(root),'level':'L1','budget_bytes':32768,'proposal_version_hash':h,'lookup_command':command,'lookup_context':context,'lookup_available':bool(context.get('cp_id') and context.get('database'))})
    schema('api.execution.schema.json','Generation',result)
    return result

def json_quote(value):
    import json
    return json.dumps(str(value).replace('\\','/'))

def preview(payload,base,root):
    prepared=prepare(payload,base);item_id=prepared['item_id']
    if not item_id or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{0,99}',item_id):raise ValueError('PATCH_TARGET_ID_UNSUPPORTED')
    target='policies/drafts/'+item_id+'.yaml'
    # This slice adds an absent file. Modifications must bind the original
    # target bytes explicitly, never guess or overwrite an existing base item.
    existing=[m for m in __import__('loader').read_package(root).items if m.value['id']==item_id]
    if existing:raise ValueError('EXISTING_TARGET_REQUIRES_EXPLICIT_BASE_DIFF')
    text=payload['proposed_yaml']
    if not inspect_patch(text):raise ValueError('SECRET_DETECTED_REDACTED')
    diff=''.join(difflib.unified_diff([],text.splitlines(True),fromfile='/dev/null',tofile='b/'+target))
    if text and not text.endswith('\n'):diff+='\n\\ No newline at end of file\n'
    diff='diff --git a/'+target+' b/'+target+'\nnew file mode 100644\n'+diff
    return {'proposal_version_hash':prepared['proposal_version_hash'],'diff':diff,
            'files':[{'path':target,'action':'add','size':len(text.encode('utf-8'))}],
            'source_written':False,'state_written':False}

def export_guard(cp,actor,requirements):
    from core import approval_binding
    if cp['status']!='approved':raise ValueError('APPROVED_STATUS_REQUIRED')
    if any(cp['checks'][k]['status']!='PASS' for k in ('validate','lint','doctor','generate')):raise ValueError('REQUIRED_CHECKS_NOT_PASS')
    if requirements.get('eval_required',True) and cp['checks']['eval']['status']!='PASS':raise ValueError('E4_EVAL_REQUIRED')
    if requirements.get('skill_required',True) and cp['checks']['skill_states']['status'] not in ('PASS','NOT_APPLICABLE'):raise ValueError('SKILL_CHECK_REQUIRED')
    if cp.get('ci_comparison') and cp['ci_comparison'].get('status') in ('DIVERGED','FAIL'):raise ValueError('CI_DIVERGENCE')
    for a in cp['approvals']:approval_binding(cp['proposal_version_hash'],a)
    approved=[a for a in cp['approvals'] if a['decision']=='approve']
    if any(a['decision']=='reject' for a in cp['approvals']):raise ValueError('CURRENT_REJECTION')
    for role in cp['required_approvals']:
        if not any(a['role']==role for a in approved):raise ValueError('MISSING_APPROVAL_SLOT')
    if len(cp['required_approvals'])>1 and len({a['approver'] for a in approved})<2:raise ValueError('DISTINCT_REVIEWER_REQUIRED')
    g=cp['generation']
    if not g or g['stage']=='fail' or not g['p0_preserved'] or not g['prin_007_present'] or g['byte_size']>g['budget_bytes']:raise ValueError('GENERATION_BLOCKED')
    if g['stage'] in ('compress','compact') and not any(a['stage']==g['stage'] and a['content_hash']==g['content_hash'] for a in g['acknowledgements']):raise ValueError('ACKNOWLEDGEMENT_REQUIRED')
    if g['stage']=='compact' and (g['lookup']['status']!='PASS' or not any(a['stage']=='compact' and a['role']=='governance-owner' for a in g['acknowledgements'])):raise ValueError('COMPACT_LOOKUP_OR_OWNER_REQUIRED')
    return True
