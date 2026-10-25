"""Draft-only Phase4 extension. Python owns proposal parsing/hash and policy decisions.
Existing E1–E5 sources are imported unchanged. No input is executed or written.
"""
import ast
import base64
import copy
import difflib
from dataclasses import replace
import hashlib
import json
from pathlib import Path, PurePosixPath
import sys
from jsonschema import Draft202012Validator

REPO = Path(__file__).resolve().parents[3]
sys.path[:0] = [str(REPO/'server/studio/aghr/e5'), str(REPO/'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools')]
from core import schema, canonical, digest, parse_proposal
from loader import parse_source

KINDS = ['OBSERVATION','PRINCIPLE','CONSTRAINT','REQUIREMENT','PROCEDURE','GUIDELINE','POLICY','RULE','STANDARD','CONTROL','DECISION','EXCEPTION','CAPABILITY']
SCENARIOS = ['S'+str(i) for i in range(1,9)]
def need(test, message):
    if not test:
        raise ValueError(message)
def text(value):
    return isinstance(value,str) and bool(value.strip()) and len(value)<=65536
def fields(value, allowed, required=()):
    need(isinstance(value,dict) and not set(value)-set(allowed) and set(required)<=set(value),'INVALID_FIELDS')
def path(value):
    need(isinstance(value,str) and len(value)<512 and '\\' not in value and ':' not in value and all(x not in ('','.','..') for x in value.split('/')) and not PurePosixPath(value).is_absolute(),'UNSAFE_PATH')
    return value
def parsed(content):
    value=parse_source('policies/proposed.yaml',content.encode('utf-8'))
    need(len(value.documents)==1 and len(value.documents[0].members)==1,'ONE_DOCUMENT_REQUIRED')
    return value.documents[0].members[0].value
def generated(files):
    return {'kind':'GENERATED_FILE','target_project_id':'studio-drafts','files':[{'path':path(f['path']),'content':f['content'],'content_hash':digest(f['content'].encode('utf-8'))} for f in files]}
def meta(body):
    fields(body,['title','files'],['title','files']);need(text(body['title']) and isinstance(body['files'],list) and 1<=len(body['files'])<=20,'META_FILES_REQUIRED')
    seen=set()
    for f in body['files']:
        fields(f,['path','content'],['path','content']);p=path(f['path']);need(p not in seen,'DUPLICATE_PATH');seen.add(p)
        need(p.split('/')[0] in ['policies','schemas','tools'] and text(f['content']),'META_PATH_REQUIRED')
        if p.startswith('policies/'):
            schema('item.schema.json',None,parsed(f['content']))
        elif p.startswith('schemas/'):
            document=json.loads(f['content']);Draft202012Validator.check_schema(document)
        elif p.endswith('.py'):
            ast.parse(f['content'])  # Syntax only; NEVER import/execute proposed tools.
    return generated(body['files'])
def pack(payload, metadata, base):
    schema('api.change.schema.json','Create',payload)
    schema('proposal.schema.json',None,parsed(payload['proposed_yaml']))
    bound={**base,**payload,'phase4':metadata};raw=canonical(bound)
    return {'payload':payload,'phase4':metadata,**base,'proposal_version_hash':digest(raw),'canonical_base64':base64.b64encode(raw).decode('ascii')}
def payload(title,item,source):
    return {'title':title,'kind':item['kind'],'proposed_yaml':json.dumps(item,ensure_ascii=False,sort_keys=True),'source':source}
def main(r):
    op,data,context=r['operation'],r['data'],r.get('context',{});base=r['base']
    if op=='legacy.guard':
        _, member=parse_proposal(data);value=member.value
        need(value['kind']!='calibration' and value.get('impact',{}).get('evidence')!='repo-measured','USE_LIVE_CALIBRATION_WORKFLOW')
        return {'status':'ALLOWED', 'policy_promotion':False}
    if op=='meta.create':
        item=meta(data);before=context.get('before',[]);diff=''.join(''.join(difflib.unified_diff((next((v['content'] for v in before if v['path']==f['path']),None) or '').splitlines(True),f['content'].splitlines(True),fromfile='a/'+f['path'],tofile='b/'+f['path'])) for f in data['files'])
        return pack(payload(data['title'],item,{'type':'request','ref':'phase4-meta'}),{'lane':'meta','body':data,'before':before,'diff':diff,'required_approvals':['governance-owner','architecture-board'],'checks':{'structure':'PASS','behavioral_evals':'NOT_RUN','generation_check':'NOT_RUN'}},base)
    if op=='intake.create':
        fields(data,['title','path','content','raw_base64','source_hash','bytes'],['title','path','content','raw_base64','source_hash','bytes'])
        raw=base64.b64decode(data['raw_base64'],validate=True);need(digest(raw)==data['source_hash'] and len(raw)==data['bytes'],'SOURCE_HASH_MISMATCH')
        return pack(payload(data['title'],generated([{'path':'intake/'+path(data['path']),'content':data['content']}]),{'type':'document','ref':data['path'],'hash':data['source_hash']}),{'lane':'intake','body':data,'disposition':'new','trust':'UNTRUSTED_INPUT','automatic_execution':False,'required_approvals':['governance-owner']},base)
    if op=='lesson.create':
        fields(data,['title','task_id','source_hash','error','pattern','cause','cause_evidence','knowledge_type','instruction_kind','scope','authority_level','disposition','duplicates','conflicts'],['title','task_id','source_hash','error','pattern','cause','knowledge_type','instruction_kind','scope','authority_level','disposition','duplicates','conflicts'])
        need(all(text(data[k]) for k in ['title','task_id','error','pattern','knowledge_type','scope']),'LESSON_CONTEXT_REQUIRED')
        need(data['cause'] in ['UNPROVEN','SUPPORTED'] and (data['cause']=='UNPROVEN' or text(data.get('cause_evidence'))),'CAUSE_EVIDENCE_REQUIRED')
        need(data['cause']=='UNPROVEN' or context.get('cause_supported') is True,'CAUSE_EVIDENCE_UNVERIFIED')
        need(data['instruction_kind'] in KINDS+['UNRESOLVED'] and data['authority_level'] in ['enterprise','organization','project','component','UNRESOLVED'] and data['disposition'] in ['propose','fixture','dismiss'],'INVALID_CLASSIFICATION')
        need(isinstance(data['duplicates'],list) and isinstance(data['conflicts'],list),'REVIEW_LINKS_REQUIRED')
        body=copy.deepcopy(data)
        return pack(payload(data['title'],generated([{'path':'lessons/'+data['task_id']+'.json','content':json.dumps(body,ensure_ascii=False)}]),{'type':'lesson','ref':'runtime:'+data['task_id'],'task_id':data['task_id'],'hash':data['source_hash']}),{'lane':'lesson','body':body,'policy_promotion':False,'required_approvals':['governance-owner'],'review_required':True},base)
    if op=='adoption.create':
        fields(data,['title','skill_id','project_id','source','function'],['title','skill_id','project_id','source','function'])
        need(data['source'] in ['system','user','project','extension','catalog','aghr'] and data['function'] in ['routing','design','implementation','debugging','security','verification','learning'],'INVALID_CLASSIFICATION')
        need(all(text(data[k]) for k in ['title','skill_id','project_id']),'ADOPTION_CONTEXT_REQUIRED')
        return pack(payload(data['title'],generated([{'path':'capabilities/project-selections/'+data['project_id']+'.json','content':'{}'}]),{'type':'request','ref':'phase4-adoption'}),{'lane':'adoption','body':data,'step':1,'steps':[{'step':1,'output':data}],'required_approvals':['governance-owner'],'installed':False},base)
    if op=='adoption.step':
        cp=context['cp'];m=copy.deepcopy(cp['phase4']);fields(data,['step','output'],['step','output']);step=data['step'];need(m['lane']=='adoption' and step==m['step']+1 and step<=7,'STEP_ORDER_REQUIRED');v=data['output'];body=m['body']
        if step==2:
            fields(v,['preferred','alternatives','rationale'],['preferred','alternatives','rationale']);need(isinstance(v['preferred'],bool) and isinstance(v['alternatives'],list) and text(v['rationale']),'DUPLICATE_DECISION_REQUIRED')
            need(not context.get('duplicates') or (v['preferred'] or v['alternatives']) and set(context['duplicates'])<=set(v['alternatives'])|{body['skill_id']},'OVERLAP_RESOLUTION_REQUIRED')
        elif step==3:
            schema('proposal.schema.json','ProjectSelection',v);need(v['project_id']==body['project_id'] and any(s['skill_id']==body['skill_id'] for s in v['selections']),'SELECTION_MISMATCH')
        elif step==4:
            schema('item.schema.json',None,v);need(v['kind']=='CAPABILITY' and v['skillId']==body['skill_id'] and v['source']==body['source'] and v['function']==body['function'],'CAPABILITY_MISMATCH');m['capability']=v
        elif step==5:
            need(context.get('qualification_current') is True,'LIVE_QUALIFICATION_REQUIRED');v=context['qualification']
            q={k:v[k] for k in ['skillId','host','hostVersion','scope','contentHash','status']}
            q.update(qualifiedAt=v['qualifiedAt'][:10],evidence=['e4:execution/'+x['run_id']+'#'+x['content_hash'] for x in v['evidence']])
            m['capability']['skillQualification']=q
        elif step==6:
            need(isinstance(v,list),'FIXTURES_REQUIRED');p0=m['capability'].get('defaultTier','').startswith('P0')
            if p0: need(sorted(x.get('scenario') for x in v)==SCENARIOS,'EIGHT_SCENARIOS_REQUIRED')
            for f in v:fields(f,['scenario','input','task_criteria'],['scenario','input','task_criteria']);need(text(f['task_criteria']),'FIXTURE_CRITERIA_REQUIRED')
        else: need(context.get('qualification_current') is True,'STALE_QUALIFICATION')
        m['step']=step;m['steps'].append({'step':step,'output':v});item=m.get('capability')
        if item is None:item=generated([{'path':'capabilities/project-selections/'+body['project_id']+'.json','content':json.dumps(m['steps'],ensure_ascii=False)}])
        return pack(payload(cp['title'],item,cp['source']),m,base)
    if op=='calibration.create':
        need(context.get('live_eval') is True,'LIVE_PASSED_EVAL_REQUIRED');old=context['item'];run=context['eval'];need(old['impact']['evidence']=='assumed','ASSUMED_SOURCE_REQUIRED')
        fields(data,['item_id','eval_run_id','reason','measured_delta'],['item_id','eval_run_id','reason','measured_delta']);need(data['item_id']==old['id'] and text(data['reason']),'CALIBRATION_TARGET_REQUIRED')
        need(isinstance(data['measured_delta'],(float,int)) and not isinstance(data['measured_delta'],bool) and data['measured_delta']==run['measured_delta'],'MEASURED_DELTA_MISMATCH')
        item=copy.deepcopy(old);item['impact'].update(evidence='repo-measured',lastCalibrated=run['finished_at'][:10],measuredDelta=run['measured_delta'])
        schema('item.schema.json',None,item)
        wrapper={'kind':'calibration','target_item_id':old['id'],'eval_run_id':data['eval_run_id'],'measured_delta':data['measured_delta'],'reason':data['reason'],'proposed_item':item}
        return pack(payload('Calibration '+old['id'],wrapper,{'type':'calibration','ref':'phase4-measurement','eval_run_id':data['eval_run_id'],'measured_delta':data['measured_delta'],'reason':data['reason']}),{'lane':'calibration','body':data,'eval':run,'source_hash':context['source_hash'],'required_approvals':['governance-owner'],'source_written':False},base)
    if op=='edit':
        cp=context['cp'];m=copy.deepcopy(cp['phase4']);need(m['lane'] in ['meta','lesson'],'EDIT_REQUIRES_NEW_WORKFLOW')
        return main({**r,'operation':m['lane']+'.create'})
    if op=='review':
        fields(data,['decision','reason'],['decision','reason'])
        cp=context['cp'];need(context.get('actor',{}).get('server_resolved_role') in cp['phase4']['required_approvals'],'REVIEW_ROLE_REQUIRED');need(text(data.get('reason')),'REVIEW_REASON_REQUIRED')
        if data.get('decision')=='approve':
            need(cp['status']=='in_review','SUBMIT_BEFORE_APPROVAL')
            if cp['phase4']['lane']=='meta':
                # A registered evaluator cannot override E2 authority/source rules.
                from loader import read_package
                from validate import validate_package
                from scope import ScopeContext
                root=REPO/'governance_packages/candidates/AGHR_rc3_Core_Candidate'
                package=read_package(root);members=list(package.items)
                for f in cp['phase4']['body']['files']:
                    if f['path'].startswith('policies/'):
                        parsed_file=parse_source(f['path'],f['content'].encode('utf-8'))
                        members=[m for m in members if m.location.path!=f['path']]+list(parsed_file.documents[0].members)
                need(len({m.value['id'] for m in members})==len(members),'DUPLICATE_ITEM_ID')
                result,_=validate_package(replace(package,items=tuple(members)),root,ScopeContext())
                need(result['result']=='VALID','META_STRICT_POLICY_REJECTED')
                need(context.get('all_behavioral_evals') is True and context.get('generation_check') is True,'META_EVAL_AND_GENERATION_REQUIRED')
            if cp['phase4']['lane']=='calibration':need(context.get('live_eval') is True,'LIVE_PASSED_EVAL_REQUIRED')
            if cp['phase4']['lane']=='adoption':need(cp['phase4']['step']==7 and context.get('qualification_current') is True,'LIVE_QUALIFICATION_REQUIRED')
        else:need(data.get('decision')=='reject','INVALID_DECISION')
        return {'decision':data['decision'],'required_approvals':cp['phase4']['required_approvals']}
    raise ValueError('PHASE4_OPERATION_UNSUPPORTED')

if __name__=='__main__':
    try:
        raw=Path(sys.argv[1]).read_bytes();need(len(raw)<=1024**2,'INPUT_LIMIT');request=json.loads(raw)
        result=main(request);print(json.dumps({'protocol_version':'3','result':'VALID','exit_code':0,'data':result},ensure_ascii=False,allow_nan=False));sys.exit(0)
    except Exception as error:
        print(json.dumps({'protocol_version':'3','result':'INVALID','exit_code':1,'data':None,'reason':str(error)[:3000]},ensure_ascii=False));sys.exit(1)
