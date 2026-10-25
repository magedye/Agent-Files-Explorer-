"""Local implementation of governed-learning's draft-only evidence workflow."""
import hashlib
import json
from pathlib import Path
import sys
r = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
raw = Path(r['procedure_path']).read_bytes()
if hashlib.sha256(raw).hexdigest() != r['procedure_sha256']:
    raise ValueError('LEARNING_PROCEDURE_DRIFT')
if r['failure']['exit_code'] == 0 or not r['failure']['run_id']:
    raise ValueError('ACTUAL_FAILURE_REQUIRED')
print(json.dumps({'lesson_review': {'id': 'E4-LESSON-001', 'problem': 'Required JSON field missing',
      'evidence_run_id': r['failure']['run_id'], 'evidence_hash': r['failure']['output_hash'],
      'root_cause': 'UNPROVEN', 'classification': {'kind': 'GUIDELINE', 'scope': 'project', 'force': 'SHOULD'},
      'coverage': 'REVIEW_REQUIRED', 'disposition': 'PROPOSE_TEST', 'owner_review': 'REQUIRED'},
      'classified_dispositions': ['PROPOSE_TEST'], 'promotion': 'NOT_PERFORMED', 'policy_written': False}))
