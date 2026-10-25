import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fork} from 'node:child_process';
const root=path.resolve('packaging/aghr-studio/aghr_studio/payload'),out=path.resolve('docs/evidence/studio-t38-2026-10-25'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync(root+'/DISTRIBUTION.lock.json')),record={profile:'COPIED_PAYLOAD_PRE_INSTALL_WITH_PINNED_PYTHON',status:'IN_PROGRESS',credentials:'NOT_RECORDED'};
const snapshot=()=>Object.fromEntries(Object.keys(manifest.files).map(p=>[p,sha(fs.readFileSync(path.join(root,p)))])),before=snapshot(),errors=[];
const child=fork(root+'/server/studio/serve-studio.mjs',['--port=0','--python='+path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),'--storage-root='+fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t38-preflight-'))],{cwd:root,silent:true});
child.stderr.on('data',b=>{const text=b.toString('utf8');if(errors.join('').length<65536)errors.push(text.toLowerCase().includes('token')?'[TOKEN DIAGNOSTIC EXCLUDED]':text);});
let ready;
try{ready=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('STARTUP_TIMEOUT')),90000);child.on('message',m=>{if(m.event==='ready'){clearTimeout(timer);resolve(m);}});child.once('error',reject);child.once('exit',code=>{clearTimeout(timer);if(!ready)reject(Error('STARTUP_EXIT_'+code));});});const origin='http://127.0.0.1:'+ready.port;const r=await fetch(origin+'/api/v1/workspaces',{headers:{'x-studio-token':ready.token}});if(r.status!==200||(await r.json()).data.length!==3)throw Error('READ_PROFILE_FAILED');record.status='PASS';record.http_status=r.status;record.tables=ready.tables;
}catch(error){record.status='FAIL';record.error=error.message;process.exitCode=1;}finally{
 if(child.connected){child.send('stop');await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},15000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}
 const after=snapshot();record.differences=Object.keys(before).filter(p=>before[p]!==after[p]);if(record.differences.length){record.status='FAIL';process.exitCode=1;}record.manifest_sha256=sha(fs.readFileSync(root+'/DISTRIBUTION.lock.json'));fs.writeFileSync(out+'/PAYLOAD_PREFLIGHT.json',JSON.stringify(record,null,2)+'\n');fs.writeFileSync(out+'/PAYLOAD_PREFLIGHT.stderr.txt',errors.join(''));console.log(JSON.stringify(record));
}
