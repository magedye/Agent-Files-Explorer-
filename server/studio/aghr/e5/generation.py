"""E3 preview subset. Pure rendering only; no exports, doctor or qualification."""
import json
import uuid
from pathlib import Path
from core import digest, overlay
from loader import parse_source

def required_principle(root):
    reference = Path(__file__).resolve().parents[4] / 'docs/specs/aghr-rc3/AGHR_REFERENCE.md'
    section = reference.read_text(encoding='utf-8').split('### 9.2 ',1)[1].split('### 9.3 ',1)[0]
    raw = section.split('```yaml\n',1)[1].split('```',1)[0]
    return parse_source('principle.yaml',raw.encode('utf-8')).documents[0].value


def generate(payload, config):
    # Config is operator-owned. No HTTP caller can supply budgets/lookup claims.
    root = config['engine_root']
    budget = config['budget_bytes']
    level = config['level']
    if type(budget) is not int or budget < 1 or level not in ('L0','L1','L2','L3','L4'):
        raise ValueError('INVALID_GENERATION_CONFIG')
    items = [m.value for m in overlay(payload, root).items]
    if len({i['id'] for i in items}) != len(items):
        raise ValueError('DUPLICATE_GENERATION_ID')
    # Unknown priority is conservatively retained verbatim; it is never
    # guessed into a lower tier to make the budget pass.
    low = lambda i: i.get('defaultTier') in ('P2-Quality','P3-Presentation') and i['id'] != 'PRIN-007'
    hard = [i for i in items if not low(i)]
    p0 = [i for i in hard if i.get('defaultTier','P0-Integrity').startswith('P0')]
    required = required_principle(root)
    principle = next((i for i in items if i['id']=='PRIN-007' and i['kind']=='PRINCIPLE' and i['force']=='MUST' and i.get('rule','').rstrip()==required['rule'].rstrip()), None)
    header = '# AGENTS.md\n\n<!-- DRAFT PREVIEW ONLY; NOT APPROVED; NO EXPORT -->\n\n'
    def block(i):
        return '## '+i['id']+'\n'+i['force']+'\n'+i['rule']+'\n\n'
    full = header + ''.join(block(i) for i in items)
    compressed = header + ''.join(block(i) for i in hard)
    if any(low(i) for i in items):
        compressed += '## P2/P3 summaries (acknowledgement required before export)\n'
        compressed += ''.join('- '+i['id']+': '+json.dumps(i.get('title', i['kind']), ensure_ascii=False)+'\n' for i in items if low(i))
    compact = header + (block(principle) if principle else '') + '## On-demand constraints\nDo not proceed if lookup fails.\n'
    compact += ''.join('- '+i['id']+': invoke aghr_get_rule('+json.dumps(i['id'])+') before acting.\n' for i in hard if i is not principle)
    compact += ''.join('- '+i['id']+': '+json.dumps(i.get('title',i['kind']),ensure_ascii=False)+'\n' for i in items if low(i))
    size=lambda s:len(s.encode('utf-8'))
    stage, content = ('full', full) if size(full)<=budget else ('compress',compressed) if size(compressed)<=budget else ('compact',compact) if size(compact)<=budget else ('fail',compact)
    lookup = config.get('lookup')
    verified_lookup = bool(lookup and lookup.get('check',{}).get('status')=='PASS' and lookup['check'].get('evidence') and
                           all(lookup.get('rules',{}).get(i['id'])==digest(i['rule'].encode('utf-8')) for i in hard))
    missing_principle = level!='L0' and principle is None
    overflow = [i['id'] for i in p0] if size(content)>budget else []
    if missing_principle:overflow.append('PRIN-007')
    p0_preserved = stage in ('full','compress') or (stage=='compact' and verified_lookup)
    if missing_principle or (stage=='compact' and not verified_lookup):
        stage='fail'
    if stage=='fail':p0_preserved=False
    evidence=[{'path':'preview-item:'+i['id'], 'content_hash':digest(i['rule'].encode('utf-8')), 'bytes':size(i['rule'])} for i in p0] if p0_preserved else []
    return {'content':content,'content_hash':digest(content.encode('utf-8')),'stage':stage,'byte_size':size(content),
            'byte_delta':size(content)-budget,'budget_bytes':budget,'p0_preserved':p0_preserved,
            'prin_007_present':principle is not None,'adoption_level':level,'p0_evidence':evidence,
            'overflow_items':list(dict.fromkeys(overflow)),'acknowledgements':[],
            'lookup':lookup['check'] if verified_lookup else {'status':'NOT_RUN','evidence':[], 'reason':'On-demand lookup has no qualified host evidence. Compact/export blocked.'},
            'run_id':'GEN-'+str(uuid.uuid4())}
