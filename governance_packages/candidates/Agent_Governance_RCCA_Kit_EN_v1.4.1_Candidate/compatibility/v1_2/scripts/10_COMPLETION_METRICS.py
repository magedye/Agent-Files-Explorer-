#!/usr/bin/env python3
"""Compute completion-claim agreement on externally labeled CSV, no writes.

Fields: task_id,claim,review_verdict,review_evidence_ref,reviewer_independence.
Claims/verdicts: COMPLETE, COMPLETE_WITH_DEVIATIONS, PARTIAL, BLOCKED.
This is agreement with supplied labels, not ground-truth verification.
"""
import argparse,csv,json,sys
from pathlib import Path

STATES={'COMPLETE','COMPLETE_WITH_DEVIATIONS','PARTIAL','BLOCKED'}
REQUIRED={'task_id','claim','review_verdict','review_evidence_ref','reviewer_independence'}

def calculate(path):
    with Path(path).open(encoding='utf-8-sig',newline='') as f:
        r=csv.DictReader(f)
        if not r.fieldnames or not REQUIRED.issubset(r.fieldnames):raise ValueError('missing_required_csv_fields')
        rows=list(r)
    if not rows:raise ValueError('empty_labeled_dataset')
    if len({x['task_id'] for x in rows})!=len(rows):raise ValueError('duplicate_task_id')
    for x in rows:
        if x['claim'] not in STATES or x['review_verdict'] not in STATES:
            raise ValueError('invalid_claim_or_verdict')
        if not x['review_evidence_ref'] or x['reviewer_independence'] not in ('L1','L2','L3'):
            raise ValueError('missing_external_review_label')
    matches=sum(x['claim']==x['review_verdict'] for x in rows)
    false_complete=sum(x['claim'] in ('COMPLETE','COMPLETE_WITH_DEVIATIONS') and
                       x['review_verdict'] in ('PARTIAL','BLOCKED') for x in rows)
    return {'status':'METRICS_ON_SUPPLIED_LABELS_ONLY','sample_size':len(rows),
            'agreement_count':matches,'completion_claim_accuracy':matches/len(rows),
            'unsupported_completion_claims':false_complete,
            'label_authenticity_verified':False,
            'note':'Accuracy is agreement with submitted external verdicts, not proof of objective quality.'}

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--dataset',required=True);args=ap.parse_args()
    try:out=calculate(args.dataset);code=0
    except (ValueError,OSError,UnicodeError) as e:
        out={'status':'INCONCLUSIVE','reason':str(e)[:120] if isinstance(e,ValueError) else type(e).__name__};code=3
    print(json.dumps(out,ensure_ascii=False,indent=2));return code
if __name__=='__main__':sys.exit(main())
