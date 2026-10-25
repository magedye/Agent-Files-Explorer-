// Explicit owner-authorized Draft storage activation. No CP/source publication.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const file=path.join(root,'.governance/studio-drafts/studio.sqlite'),python=path.join(root,'temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const digest=()=>{const b=fs.readFileSync(file);return {sha256:crypto.createHash('sha256').update(b).digest('hex'),bytes:b.length};};
const before=fs.existsSync(file)?digest():null,observations=[];let previousToken;
for(let i=0;i<2;i++){
 const child=spawn(process.execPath,['server/studio/serve-draft.mjs','--python='+python,'--port=0'],{cwd:root,windowsHide:true,stdio:['ignore','ignore','ignore','ipc']});
 try{
  const ready=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill();reject(Error('DRAFT_BOOT_TIMEOUT'));},75000);child.on('message',m=>{if(m.event==='ready'){clearTimeout(timer);resolve(m);}});child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);if(code)reject(Error('DRAFT_BOOT_FAILED'));});});
  assert.equal(ready.tables,12);assert.equal(ready.storage,file);if(previousToken)assert.notEqual(ready.token,previousToken);previousToken=ready.token;
  const get=async route=>{const r=await fetch(`http://127.0.0.1:${ready.port}/api/v1`+route,{headers:{'x-studio-token':ready.token}});assert.equal(r.status,200);return(await r.json()).data;};
  const profile=await get('/draft-status'),drafts=await get('/workspaces/rc3-local/change-packages'),audit=await get('/audit-events');assert.equal(profile.storage,'persistent');assert.equal(profile.tables,12);
  observations.push({boot:i+1,mode:profile.mode,tables:profile.tables,actor:ready.actor,drafts:drafts.length,audit_events_observed:audit.length,persistent_file:ready.storage,source_written:profile.source_written});
 }finally{
  const done=new Promise(resolve=>child.once('exit',resolve));if(child.connected)child.send('stop');await Promise.race([done,new Promise((_,reject)=>setTimeout(()=>{child.kill();reject(Error('DRAFT_STOP_TIMEOUT'));},10000).unref())]);
 }
}
assert.equal(observations[0].drafts,observations[1].drafts);
assert(observations[1].audit_events_observed>observations[0].audit_events_observed);
const receipt={status:'PASS',at:new Date().toISOString(),scope:'Owner-authorized default Draft SQLite initialization and reopen; no business CP/source writes',path:path.relative(root,file).split(path.sep).join('/'),before,after_observed:digest(),observations,secrets_persisted:false,services_left_running:false};
fs.writeFileSync(path.join(out,'APP_STORAGE_ACTIVATION.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,path:receipt.path,tables:12,reopened:true,drafts:observations[1].drafts}));
