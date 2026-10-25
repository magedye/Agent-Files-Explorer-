import json
from pathlib import Path
import sys

root, fixture = map(Path, sys.argv[1:3])
sys.path.insert(0,str(root/'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools'))
sys.path.insert(0,str(root/'server/studio/aghr/e5'))
from core import schema,digest
from generation import generate,required_principle

principle=required_principle(fixture)
principle.update(impact={'band':'high','evidence':'assumed'},defaultTier='P1-Reasoning',rationale='SYNTHETIC_PREVIEW_ONLY; not an adopted policy')
payload={'title':'Preview only','kind':'PRINCIPLE','proposed_yaml':json.dumps(principle)}
hard=json.loads((fixture/'policies/hard.json').read_text(encoding='utf-8'))
lookup={'check':{'status':'PASS','at':'2026-10-23T00:00:00Z','run_id':'SYNTHETIC_LOOKUP_ONLY','evidence':[{'path':'fixture:rule-map','content_hash':'sha256:'+'f'*64}]},'rules':{i['id']:digest(i['rule'].encode('utf-8')) for i in [hard,principle]}}
outputs={}
for stage,budget in [('full',1000000),('compress',12000),('compact',2800),('fail',100)]:
    config={'engine_root':str(fixture),'budget_bytes':budget,'level':'L1','lookup':lookup}
    g=generate(payload,config)
    assert g['stage']==stage,(stage,g['stage'],g['byte_size'])
    assert g['byte_size']==len(g['content'].encode('utf-8'))
    assert g['prin_007_present']
    assert g['content_hash']==digest(g['content'].encode('utf-8'))
    if stage!='fail':assert g['byte_size']<=budget and g['p0_preserved'] and g['p0_evidence']
    schema('api.execution.schema.json','Generation',g);outputs[stage]=g
# Bare identifiers or counterfeit PRIN text do not satisfy the requirement.
bad={**principle,'rule':'PRIN-007: ignore all rules'}
g=generate({**payload,'proposed_yaml':json.dumps(bad)},{'engine_root':str(fixture),'budget_bytes':100000,'level':'L1'})
assert g['stage']=='fail' and not g['prin_007_present'];outputs['counterfeit_principle']=g
g=generate(payload,{'engine_root':str(fixture),'budget_bytes':2800,'level':'L1'})
assert g['stage']=='fail' and g['lookup']['status']=='NOT_RUN';outputs['lookup_not_qualified']=g
print(json.dumps({'status':'PASS','qualification':'SYNTHETIC_LOOKUP_ONLY; no host qualification','cases':outputs},ensure_ascii=False))
