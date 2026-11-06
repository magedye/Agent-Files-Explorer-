"""Synthetic checker comparison, not a live agent/independent acceptance evaluation."""
from __future__ import annotations
import json
from pathlib import Path
import sys
import tempfile
sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from agdl import legacy
from agdl.assurance import validate_record
from agdl.io import digest, loads
from tests.fixtures import make_fixture

def run():
    contract = loads((ROOT/'evaluations/DIAGNOSTIC_ORACLES.json').read_bytes())
    rows=[]
    for case in contract['cases']:
        with tempfile.TemporaryDirectory(prefix='agdl_comparison_') as tmp:
            root=Path(tmp); record=make_fixture(root); revision='fixture-revision-1'
            key=case['id']
            if key=='LOG_MISSING': (root/'test.log').unlink()
            elif key=='IMPLEMENTATION_CHANGED': (root/'src/feature.py').write_text('pass\n',encoding='utf-8')
            elif key=='CURRENT_REVISION_CHANGED': revision='fixture-revision-2'
            elif key=='SOURCE_UNIT_OMITTED': record['rcca']['source_units'].pop()
            elif key=='AUTHORIZATION_DENIED': record['rcca']['authorization']['status']='DENIED'
            elif key=='TASK_INCOMPLETE': record['tasks'][0]['status']='DOING'
            elif key!='CONTROL': raise ValueError('Unknown case; expected labels must not be silently expanded.')
            raw=(root/'request.txt').read_bytes()
            old_issues, old_warnings=legacy.validate(raw.decode(),digest(raw),record['rcca'],'G5')
            new=validate_record(record,root,'request.txt','G5',revision)
            old='NOT_READY' if old_issues else 'READY'
            current='READY' if new['exit_code']==0 else 'NOT_READY'
            rows.append({'id':key,'expected':case['expected'],'legacy_diagnostic':old,
                'v13_diagnostic':current,'legacy_agrees':old==case['expected'],'v13_agrees':current==case['expected'],
                'legacy_issues':old_issues,'legacy_warnings':old_warnings,'v13_issues':new['issues'],'v13_unknowns':new['unknowns']})
    return {'scope':'AUTHOR_CREATED_SYNTHETIC_METADATA_CHECKS','case_count':len(rows),'independent':False,
        'holdout':False,'live_agent_run':False,'live_value_decision':'NOT_RUN',
        'metrics':{'legacy_oracle_agreement_count':sum(x['legacy_agrees'] for x in rows),
                   'v13_oracle_agreement_count':sum(x['v13_agrees'] for x in rows),
                   'legacy_ready_on_negative':sum(x['expected']=='NOT_READY' and x['legacy_diagnostic']=='READY' for x in rows),
                   'v13_ready_on_negative':sum(x['expected']=='NOT_READY' and x['v13_diagnostic']=='READY' for x in rows)},
        'cost_telemetry':'NO_TELEMETRY','rows':rows}

if __name__=='__main__':
    result=run(); print(json.dumps(result,indent=2,ensure_ascii=True))
    raise SystemExit(0 if all(x['v13_agrees'] for x in result['rows']) else 2)
