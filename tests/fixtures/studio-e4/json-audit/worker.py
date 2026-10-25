"""Actual deterministic JSON inspection procedure, not a mocked engine."""
import json
from pathlib import Path
import sys
request = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
document = request['document']
required = request['required']
missing = [key for key in required if key not in document]
print(json.dumps({'valid': not missing, 'keys': sorted(document), 'missing': missing, 'document': document}, ensure_ascii=False))
raise SystemExit(1 if missing else 0)
