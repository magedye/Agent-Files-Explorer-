"""Use the unchanged E2 schema validators for actual HTTP response bytes."""
import json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate/tools'))
from validate import SchemaChecks
checks=SchemaChecks()
request=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
issues=[]
for i,record in enumerate(request):
    schema,_,definition=record['schema'].partition('#/$defs/')
    validator=checks.validators[schema]
    if definition:
        validator=validator.evolve(schema={'$ref':validator.schema['$id']+'#/$defs/'+definition})
    errors=list(validator.iter_errors(record['value']))
    if errors:
        issues.append({'index':i,'operation':record['operation'],'case':record['case'],'issues':[{'pointer':'/'+ '/'.join(map(str,e.absolute_path)),'message':e.message[:400]} for e in errors[:10]]})
print(json.dumps({'valid':not issues,'checked':len(request),'issues':issues},ensure_ascii=False))
sys.exit(1 if issues else 0)
