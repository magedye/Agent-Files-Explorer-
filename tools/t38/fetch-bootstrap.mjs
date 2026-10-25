import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
const out='docs/evidence/studio-t38-2026-10-25',expected=JSON.parse(fs.readFileSync(out+'/BOOTSTRAP_EXPECTED.json')),destination=path.resolve('temp/t38-wheelhouse'),scratch=path.join(destination,'.bootstrap-'+Date.now()+'.download');
if(!/^https:\/\/files\.pythonhosted\.org\/packages\/[a-zA-Z0-9/._-]+$/.test(expected.url))throw Error('UNTRUSTED_BOOTSTRAP_URL');
// Respect the configured transport proxy without printing its value. Direct
// binary transport and configured pip transport timed out; one bounded attempt.
const child=spawn('curl.exe',['--fail','--location','--max-time','45','--noproxy','','--silent','--output',scratch,expected.url],{windowsHide:true,stdio:'ignore'});
const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});if(code!==0)throw Error('BOOTSTRAP_PROXY_TRANSPORT_EXIT_'+code);
const bytes=fs.readFileSync(scratch),hash=crypto.createHash('sha256').update(bytes).digest('hex');if(hash!==expected.sha256)throw Error('BOOTSTRAP_DIGEST_MISMATCH');const file=path.join(destination,'pip-'+expected.version+'-py3-none-any.whl');if(!file.startsWith(destination+path.sep))throw Error('PATH_OUTSIDE_WHEELHOUSE');fs.writeFileSync(file,bytes,{flag:'wx'});
fs.writeFileSync(out+'/BOOTSTRAP_WHEEL.lock.json',JSON.stringify({...expected,bytes:bytes.length,transport:'configured proxy; official PyPI SHA256 verified; not an engine dependency'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS_DIGEST',version:expected.version,sha256:hash,bytes:bytes.length}));
