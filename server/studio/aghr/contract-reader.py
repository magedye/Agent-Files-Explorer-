"""Read-only schema evaluation using the unchanged E2 validators."""
import json
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools'))
from validate import SchemaChecks
checks = SchemaChecks()
request = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
validator = checks.validators[request['schema']]
if request.get('definition'):
    validator = validator.evolve(schema={'$ref': validator.schema['$id'] + '#/$defs/' + request['definition']})
issues = []
for index, value in enumerate(request['values']):
    for error in validator.iter_errors(value):
        issues.append({'index': index, 'code': 'SCHEMA_INVALID', 'pointer': '/' + '/'.join(map(str, error.absolute_path)), 'message': error.message[:300]})
        if len(issues) >= 50:
            break
    if len(issues) >= 50:
        break
print(json.dumps({'valid': not issues, 'issues': issues}, ensure_ascii=False))
sys.exit(1 if issues else 0)
