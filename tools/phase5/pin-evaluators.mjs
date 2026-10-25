import fs from 'node:fs';
import crypto from 'node:crypto';
const root='server/studio/phase5/evaluators/';
const files=Object.fromEntries(['SKILL.md','worker.py'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(root+p)).digest('hex')]));
fs.writeFileSync(root+'SOURCE.lock.json',JSON.stringify({revision:'project-evaluators.1',scope:'Agent-Files-Explorer actual local-process only',files},null,2),{flag:'wx'});
