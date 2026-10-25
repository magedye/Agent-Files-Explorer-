// Isolated Draft DB and Edge browser context. No owner browser/profile changes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import readline from 'node:readline';
import {encodeJsonl} from '../contracts/evidence_jsonl.mjs';
import {out as evidenceRoot} from './prepare.mjs';
const out=evidenceRoot+'/'+(process.argv[2]||'browser-final');fs.mkdirSync(out);
const root=process.cwd(),temp=fs.mkdtempSync(path.resolve('temp/native-browser-')),db=path.join(temp,'db'),project=path.join(temp,'project'),evidence=path.join(project,'.aghr/runtime_evidence');fs.mkdirSync(db);fs.mkdirSync(evidence,{recursive:true});
const now=new Date().toISOString(),session={agent:'UI_SOURCE_CLAIM_ONLY',agent_version:'1',host_os:'windows',started_at:now};
const raw=encodeJsonl([{task_id:'ui-halt',session,events:[{at:now,type:'skill.loaded',skill_id:'example',instruction_hash:'sha256:'+'a'.repeat(64)}],submit_to_ci:false},{task_id:'ui-halt',session,events:[{at:now,type:'skill.blocked',skill_id:'example',status:'BLOCKED',reason:'UI fixture only; execution was not observed.'}],submit_to_ci:false}]);
fs.writeFileSync(path.join(evidence,'ui-halt.jsonl'),raw);fs.writeFileSync(path.join(evidence,'bad.jsonl'),'foreign input\n');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),before={raw:sha(raw),bad:sha(fs.readFileSync(path.join(evidence,'bad.jsonl')))};
const parent=JSON.parse(fs.readFileSync('docs/evidence/studio-e4-2026-10-24/CUSTODY.lock.json','utf8'));
const immutable=Object.fromEntries(Object.keys(parent.files).filter(p=>!p.startsWith('docs/status/')&&!p.startsWith('docs/plans/')&&p!=='docs/INDEX.md').map(p=>[p,sha(fs.readFileSync(p))]));
const server=spawn(process.execPath,['server/studio/serve-draft.mjs','--python='+path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),'--port=0','--storage-root='+db,'--evidence-project='+project],{cwd:root,windowsHide:true,stdio:['pipe','pipe','pipe','ipc']});server.stdout.resume();server.stderr.resume();
const receive=predicate=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{server.off('message',handler);reject(Error('Server timeout'));},90000);function handler(m){if(predicate(m)){clearTimeout(timer);server.off('message',handler);resolve(m);}}server.on('message',handler);});
const ready=await receive(m=>m.event==='ready'),token=ready.token,origin='http://127.0.0.1:'+ready.port;
const version=await (await fetch('http://127.0.0.1:9223/json/version')).json();
const socket=new WebSocket(version.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
const pending=new Map();let n=0,context,sessionId;const errors=[];
socket.onmessage=message=>{const value=JSON.parse(message.data);if(value.id){const p=pending.get(value.id);if(p){pending.delete(value.id);clearTimeout(p.timer);value.error?p.reject(Error(JSON.stringify(value.error))):p.resolve(value.result);}}else if(value.sessionId===sessionId&&value.method==='Runtime.exceptionThrown')errors.push(value.params.exceptionDetails.text);};
const cdp=(method,params={},sid)=>new Promise((resolve,reject)=>{const id=++n,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},30000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));});
const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(expression,timeout=90000)=>{const end=Date.now()+timeout;while(Date.now()<end){const value=await evaluate(expression);if(value)return value;await wait(150);}throw Error('UI timeout '+expression);};
const click=async selector=>{await until(`!!document.querySelector(${JSON.stringify(selector)})`);await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);};
const fill=async(selector,value)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const snapshot=async name=>{fs.writeFileSync(out+'/'+name+'.txt',await evaluate('document.body.innerText'),{flag:'wx'});const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);fs.writeFileSync(out+'/'+name+'.png',Buffer.from(image.data,'base64'),{flag:'wx'});};
const checks=[];let failure;
try{
 context=(await cdp('Target.createBrowserContext')).browserContextId;
 const target=(await cdp('Target.createTarget',{url:'about:blank',browserContextId:context})).targetId;sessionId=(await cdp('Target.attachToTarget',{targetId:target,flatten:true})).sessionId;
 await cdp('Runtime.enable',{},sessionId);await cdp('Page.enable',{},sessionId);await cdp('Page.navigate',{url:origin},sessionId);await until('!!document.querySelector("#draft-token")');
 assert.match(await evaluate('navigator.userAgent'),/Edg\//);checks.push('Actual isolated Microsoft Edge context');
 await fill('#draft-token',token);await click('form button');await until('!!document.querySelector("[data-testid=verification-nav]")');
 await click('[data-testid=verification-nav]');await until('!!document.querySelector("[data-testid=verification-screen]")');await snapshot('verification-ar-before');
 await click('[data-testid=verify-prepare]');const intent=await until('document.querySelector(".draft-intent pre")?.innerText.match(/approve ([a-f0-9-]+)/)?.[1]');
 const control=receive(m=>m.event==='control');server.send({command:'approve',id:intent,request_id:'browser-approve'});const granted=await control;assert(!granted.error,granted.error);
 await click('[data-testid=verify-authorization]');await until('document.querySelector("[data-testid=verify-execute]")?.disabled===false');await click('[data-testid=verify-execute]');
 await until('document.querySelector("[data-testid=verification-result]")?.innerText.includes("passed")');assert.match(await evaluate('document.querySelector("[data-testid=verify-stdout]").innerText'),/"protocol_version":"3"/);checks.push('Authorized real validate runs via UI, polls and renders CLI3 stdout/exit0');await snapshot('verification-ar-pass');
 await click('[data-testid=runtime-nav]');await until('document.querySelector("[data-testid=runtime-screen]")?.innerText.includes("ui-halt")');await click('.draft-list button:last-child');
 // Select by rendered task text rather than trusting source data as a selector.
 await evaluate('Array.from(document.querySelectorAll(".draft-list button")).find(e=>e.innerText.includes("ui-halt")).click()');await until('document.querySelector("[data-testid=runtime-detail]")?.innerText.startsWith("ui-halt")');assert.match(await evaluate('document.querySelector("[data-testid=runtime-detail]").innerText'),/BLOCKED/);assert.match(await evaluate('document.querySelector("[data-testid=runtime-detail]").innerText'),/NOT_OBSERVABLE/);await snapshot('runtime-ar-halt');checks.push('Rapid source switch keeps the latest task; loaded, halt and NOT_OBSERVABLE separate');
 await evaluate('(()=>{const e=document.querySelector("[data-testid=draft-locale]");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(e,"en");e.dispatchEvent(new Event("change",{bubbles:true}));})()');await until('document.documentElement.dir==="ltr"');await snapshot('runtime-en-halt');assert.match(await evaluate('document.body.innerText'),/Runtime evidence/);checks.push('Arabic RTL and English LTR');
 for(const width of [320,768,1024,1440]){await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},sessionId);await wait(100);assert.equal(await evaluate('document.documentElement.scrollWidth>window.innerWidth'),false,'Horizontal overflow '+width);checks.push('No page overflow '+width);}
 await snapshot('runtime-en-desktop');await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true},sessionId);await snapshot('runtime-en-mobile');
 assert.deepEqual(errors,[]);checks.push('No runtime JavaScript exceptions');
 console.log(JSON.stringify({event:'browser_ready_for_inspection',origin,context,checks}));
 // Let the tool inspect this exact page before disposing only our context.
 await new Promise(resolve=>{const input=readline.createInterface({input:process.stdin});const marker=path.join(out,'finish.marker');const timer=setInterval(()=>{if(fs.existsSync(marker)){clearInterval(timer);input.close();resolve();}},250);input.once('line',()=>{clearInterval(timer);input.close();resolve();});});
}catch(error){failure=error.stack;console.error(error.message);}
finally{
 const after={raw:sha(fs.readFileSync(path.join(evidence,'ui-halt.jsonl'))),bad:sha(fs.readFileSync(path.join(evidence,'bad.jsonl')))};
 for(const [file,h]of Object.entries(immutable))assert.equal(sha(fs.readFileSync(file)),h,'Protected source changed: '+file);assert.deepEqual(before,after);assert(!fs.existsSync(path.join(project,'.aghr/state.json')));
 fs.writeFileSync(out+'/BROWSER_ACCEPTANCE.json',JSON.stringify({status:failure?'FAIL':'PASS',failure,checks,browser:'Microsoft Edge isolated context via127.0.0.1:9223',source_before:before,source_after:after,protected_files:Object.keys(immutable).length,state_written:false,source_written:false,draft_storage:db,errors},null,2),{flag:'wx'});
 if(context)await cdp('Target.disposeBrowserContext',{browserContextId:context});socket.close();server.send('stop');
}
if(failure)process.exitCode=1;
