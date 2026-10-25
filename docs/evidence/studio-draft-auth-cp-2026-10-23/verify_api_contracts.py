from pathlib import Path
import json
import sys

out = Path(__file__).resolve().parent
root = out.parents[2]
sys.path.insert(0, str(root / 'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools'))
from validate import SchemaChecks

checks = SchemaChecks()
results = []
for name, schema, pointer, envelope in [
    ('HTTP_CREATE_REQUEST.json', 'api.change.schema.json', 'Create', False),
    ('HTTP_CREATED_LIST.json', 'api.change.schema.json', 'Packages', False),
    ('HTTP_DENIED.json', 'transport.schema.json', 'ErrorEnvelope', True),
]:
    data = json.loads((out / name).read_text(encoding='utf-8'))
    validator = checks.validators[schema].evolve(schema={'$ref': 'https://aghr.invalid/contracts/rc3/' + schema + '#/$defs/' + pointer})
    payload = data if name == 'HTTP_CREATE_REQUEST.json' else data['body'] if envelope else data['data']
    errors = [{'path': '/'.join(map(str, e.absolute_path)), 'message': e.message} for e in validator.iter_errors(payload)]
    results.append({'file': name, 'schema': schema + '#/$defs/' + pointer, 'errors': errors})
status = 'PASS' if all(not r['errors'] for r in results) else 'FAIL'
(out / 'API_CONTRACTS.json').write_text(json.dumps({'status': status, 'results': results}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': status, 'results': results}))
sys.exit(0 if status == 'PASS' else 1)
