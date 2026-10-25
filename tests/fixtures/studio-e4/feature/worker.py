import ast
import json
from pathlib import Path
import re
import sys
r = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
if not re.fullmatch(r'[a-z][a-z0-9_]{0,40}', r['name']):
    raise ValueError('INVALID_FUNCTION_NAME')
source = 'def ' + r['name'] + '():\n    return ' + repr(r['value']) + '\n'
ast.parse(source)
print(json.dumps({'source': source, 'language': 'python', 'function_name': r['name'], 'syntax_valid': True}))
