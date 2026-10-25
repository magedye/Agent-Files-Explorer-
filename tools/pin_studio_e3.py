"""Explicit deterministic development pinning. Never called by runtime."""
from pathlib import Path
import hashlib
import json
import re
root=Path(__file__).resolve().parent.parent
e3=root/'server/studio/aghr/e3'
old=json.loads((root/'server/studio/aghr/e5/EXTENSION.lock.json').read_bytes())['files']
names=set(old)|{p.relative_to(root).as_posix() for p in e3.iterdir() if p.is_file() and p.name!='SOURCE.lock.json'}|{'server/studio/aghr/e5/EXTENSION.lock.json','server/studio/aghr/job-runner.js','server/studio/aghr/windows-job.py','server/studio/aghr/read-only-launcher.py','tools/aghr_get_rule.mjs'}
lock={'revision':'e3.1','e2_parent':'037fe1426f36765a8c237a04cc7fb62295b15f8e150561c2e7fd8372fde441a3','e5_parent':'7199b1d5d06f51e08de3d4dda89a193aef17d3fe48089b3406ad6b3ef6756a83','files':{n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in sorted(names)}}
raw=(json.dumps(lock,indent=2)+'\n').encode('utf-8');p=e3/'SOURCE.lock.json';p.write_bytes(raw)
h=hashlib.sha256(raw).hexdigest();p=root/'server/studio/aghr/bounded-validator.js';s=p.read_text(encoding='utf-8');s=re.sub("export const sourceHash='[^']+'","export const sourceHash='"+h+"'",s);p.write_bytes(s.encode('utf-8'));print(h)
