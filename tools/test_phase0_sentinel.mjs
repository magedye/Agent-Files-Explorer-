// Test harness owns fixtures, Edge profile and evidence writes. Studio never
// receives an evidence/output path. Build must finish before this window.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const root=process.cwd(), ev=path.join(root,'docs/evidence/studio-phase0-runtime-2026-10-23');
const temp=path.join(root,'temp/phase0-runtime-20261023');fs.mkdirSync(temp,{recursive:true});
const profile=path.join(temp,'edge-profile');
fs.mkdirSync(profile,{recursive:true});
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pin=JSON.parse(fs.readFileSync('docs/evidence/studio-e2-2026-10-22/SOURCE_PIN.json'));
const candidate='governance_packages/candidates/AGHR_rc3_Core_Candidate/';
const protectedNames=[...Object.keys(pin.files).map(p=>candidate+p),'docs/contracts/aghr-rc3/sqlite/001_initial.sql','docs/contracts/aghr-rc3/CONTRACTS.lock.json','server/studio/serve.mjs','server/studio/db/catalog.js','server/studio/aghr/cli-bridge.js','server/studio/aghr/read-only-launcher.py'];
protectedNames.push('server/studio/auth.js','server/studio/routes.js','server/studio/runtime.js','server/studio/zero-write.js','src/features/phase0/PhaseZero.jsx','src/features/phase0/main.jsx','src/features/phase0/phase0.css','src/i18n/I18nProvider.jsx','vite.config.mjs','phase0.html','package.json');
const markers=path.join(temp,'protected/.aghr');fs.mkdirSync(path.join(markers,'runtime_evidence'),{recursive:true});
for(const [name,value] of [['state.json','{"owner":"CI","sentinel":true}\n'],['runtime_evidence/task.jsonl','{"sentinel":true}\n']])fs.writeFileSync(path.join(markers,name),value);
protectedNames.push(path.relative(root,path.join(markers,'state.json')),path.relative(root,path.join(markers,'runtime_evidence/task.jsonl')));
const snapshots=()=>Object.fromEntries(protectedNames.map(p=>[p.split(path.sep).join('/'),sha(fs.readFileSync(p))]));
const before=snapshots(), events=[], artifacts={},errors=[],network=[];
const directoryBefore=Object.fromEntries(['tools','dist','dist/assets','temp','temp/phase0-runtime-20261023'].map(p=>[p,{mtimeMs:fs.statSync(p).mtimeMs,birthtimeMs:fs.statSync(p).birthtimeMs}]));
let studio,edge,watcher,cdp,token,port,ready,report;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const deadline=async (predicate, label, ms=30000)=>{const stop=Date.now()+ms;while(Date.now()<stop){const v=await predicate();if(v)return v;await wait(150);}throw Error('Timed out: '+label);};
const onceMessage=(child,event,ms=30000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.off('message',receive);reject(Error('Missing IPC: '+event));},ms);function receive(message){if(message.event===event){clearTimeout(timer);child.off('message',receive);resolve(message);}}child.on('message',receive);});
class CDP {
 constructor(socket){this.socket=socket;this.seq=0;this.pending=new Map();socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text);else if(m.method==='Network.requestWillBeSent'){const r=m.params.request;network.push({method:r.method,url:r.url.split('?')[0]});}});}
 call(method,params={}){return new Promise((resolve,reject)=>{const id=++this.seq;this.pending.set(id,{resolve,reject});this.socket.send(JSON.stringify({id,method,params}));});}
 async evaluate(expression){const r=await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
}
const stdout=[],stderr=[];
const started=new Date().toISOString();
let outcome='FAIL',failure;
try {
 watcher=fs.watch(root,{recursive:true},(type,name)=>{if(!name)return;const posix=name.replaceAll('\\','/');if(posix==='temp/phase0-runtime-20261023/edge-profile'||posix.startsWith('temp/phase0-runtime-20261023/edge-profile/'))return;events.push({type,path:posix,at:new Date().toISOString()});});
 studio=spawn(process.execPath,['--permission','--allow-fs-read=*','--allow-child-process','server/studio/serve.mjs','--python='+python,'--port=0','--self-test=1'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
 studio.stdout.on('data',b=>stdout.push(b));studio.stderr.on('data',b=>stderr.push(b));
 ready=await onceMessage(studio,'ready');token=ready.token;port=ready.port;delete ready.token;
 assert.equal(ready.scan,'VALID');assert.equal(ready.tables.length,12);
 assert.deepEqual(Object.keys(ready.selfTest).sort(),['nodeWrite','sqliteAttach','sqlitePragma']);
 for(const v of Object.values(ready.selfTest))assert.equal(v.blocked,true);
 // Require the isolated loopback Edge endpoint; never connect to normal profiles.
 let occupied=false;try{occupied=(await fetch('http://127.0.0.1:9223/json/version',{signal:AbortSignal.timeout(1000)})).ok;}catch{}
 const debugPort=occupied?9224:9223;
 if(occupied){let second=false;try{second=(await fetch('http://127.0.0.1:9224/json/version')).ok;}catch{}assert.equal(second,false,'Fallback CDP occupied');}
 edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--remote-debugging-port='+debugPort,'--remote-debugging-address=127.0.0.1','--user-data-dir='+profile,'--disk-cache-dir='+path.join(profile,'cache'),'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--disable-sync','about:blank'],{windowsHide:true,stdio:'ignore'});
 const version=await deadline(async()=>{try{return await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();}catch{return null;}},'isolated Edge');
 assert.match(version.Browser,/Edg/);
 const target=await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();
 const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});cdp=new CDP(socket);
 for(const method of ['Page.enable','Runtime.enable','Log.enable','Network.enable'])await cdp.call(method);
 await cdp.call('Page.addScriptToEvaluateOnNewDocument',{source:`window.__storageWrites=[];for(const k of ['setItem','removeItem','clear']){Storage.prototype[k]=function(){window.__storageWrites.push(k);throw Error('No storage writes in Phase 0')}}`});
 await cdp.call('Page.navigate',{url:`http://127.0.0.1:${port}/`});
 await deadline(()=>cdp.evaluate('Boolean(document.querySelector("#p0-token"))'),'login');
 await cdp.evaluate('document.querySelector("#p0-token").focus()');await cdp.call('Input.insertText',{text:token});
 await cdp.evaluate('document.querySelector(".p0-login button").click()');
 await deadline(()=>cdp.evaluate('document.body.textContent.includes("OBS-REFERENCE-STATE-001")'),'actual source');
 const arIDs=await cdp.evaluate('Array.from(document.querySelectorAll(".p0-source-link"),x=>x.textContent)');assert.deepEqual(arIDs,['OBS-REFERENCE-STATE-001']);
 assert.equal(await cdp.evaluate('document.documentElement.dir'),'rtl');
 await cdp.evaluate('document.querySelector(".p0-source-link").click()');
 assert.ok(await cdp.evaluate('document.querySelector(".p0-detail pre").textContent.includes("OBS-REFERENCE-STATE-001")'));
 artifacts['registry-ar.png']=Buffer.from((await cdp.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64');
 await cdp.evaluate('document.querySelector("select").value="en";document.querySelector("select").dispatchEvent(new Event("change",{bubbles:true}))');
 await deadline(()=>cdp.evaluate('document.documentElement.dir==="ltr"'),'English direction');
 assert.deepEqual(await cdp.evaluate('Array.from(document.querySelectorAll(".p0-source-link"),x=>x.textContent)'),arIDs);
 assert.ok(await cdp.evaluate('document.body.textContent.includes("translation_unavailable")'));
 artifacts['registry-en.png']=Buffer.from((await cdp.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64');
 await cdp.evaluate('document.querySelectorAll(".p0-tabs button")[1].click()');
 await deadline(()=>cdp.evaluate('document.body.textContent.includes("No CAPABILITY in this package")'),'empty Skill Card');
 artifacts['skill-card.png']=Buffer.from((await cdp.call('Page.captureScreenshot',{format:'png'})).data,'base64');
 await cdp.evaluate('document.querySelectorAll(".p0-tabs button")[2].click()');
 assert.ok(await cdp.evaluate('document.body.textContent.includes("Routing stub only")'));
 await cdp.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 artifacts['meta-mobile.png']=Buffer.from((await cdp.call('Page.captureScreenshot',{format:'png'})).data,'base64');
 const rejected=[];
 for(const [route,method,expected] of [['/api/v1/workspaces','POST',403],['/api/v1/workspaces/rc3-local/generate/export','POST',403],['/api/staging','POST',403],['/api/v1/workspaces/rc3-local/instructions?language=ar','GET',400]]) {
  const status=await cdp.evaluate(`fetch(${JSON.stringify(route)},{method:${JSON.stringify(method)},headers:{'X-Studio-Token':${JSON.stringify(token)}}}).then(r=>r.status)`);
  assert.equal(status,expected);rejected.push({route,method,status});
 }
 assert.deepEqual(await cdp.evaluate('window.__storageWrites'),[]);
 const reportPromise=onceMessage(studio,'report');studio.send('report');report=await reportPromise;assert.deepEqual(report.writeAttempts,[]);
 assert.deepEqual(snapshots(),before);
 // Chrome reports rejected HTTP requests to Log; they are expected test probes.
 const unexpectedErrors=errors.filter(e=>!e.includes('Failed to load resource'));
 assert.deepEqual(unexpectedErrors,[]);
 outcome='PASS';
 artifacts['BROWSER.json']=Buffer.from(JSON.stringify({browser:version.Browser,profile:'isolated harness profile',cdp:`127.0.0.1:${debugPort}`,cdp_fallback:occupied?'9223 occupied by another workspace; preserved; DevTools MCP unavailable, raw CDP to isolated Edge on 9224':null,url:`http://127.0.0.1:${port}`,observed_ids:arIDs,ar_en_ids_identical:true,source_detail:true,skill_card:'EMPTY_ACTUAL_PACKAGE_NO_FABRICATION',meta:'ROUTING_STUB',mobile:{width:390,height:844},storage_writes:[],rejected,network,console_errors:errors,unexpected_errors:unexpectedErrors},null,2)+'\n');
} catch(error){failure={name:error.name,message:error.message,stack:error.stack};}
finally {
 cdp?.socket.close();
 if(edge) {edge.kill();}
 if(studio?.connected){studio.send('stop');await Promise.race([new Promise(r=>studio.once('exit',r)),wait(10000)]);if(studio.exitCode===null)studio.kill();}
 await wait(500);watcher?.close();
 const after=snapshots();if(JSON.stringify(after)!==JSON.stringify(before)){outcome='FAIL';failure??={message:'Protected file drift'};}
 // Profile shutdown belongs to the harness; all other repository changes fail.
 const directoryAfter=Object.fromEntries(Object.keys(directoryBefore).map(p=>[p,{mtimeMs:fs.statSync(p).mtimeMs,birthtimeMs:fs.statSync(p).birthtimeMs}]));
 const mutationEvents=events.filter(e=>!(directoryBefore[e.path]&&JSON.stringify(directoryBefore[e.path])===JSON.stringify(directoryAfter[e.path])));
 if(mutationEvents.length){outcome='FAIL';failure??={message:'Observed mutation or unclassified filesystem events',events:mutationEvents};}
 const receipt={status:outcome,started_at:started,finished_at:new Date().toISOString(),scope:'Phase 0 standalone Studio startup, actual Edge UI, all API requests and pinned Python subprocesses; application/API audit boundary, not kernel-wide tracing',build_outside_window:true,ready,report,watcher_events:events,mutation_events:mutationEvents,directory_before:directoryBefore,directory_after:directoryAfter,notification_classification:'Windows directory notifications with identical birthtime and last-write-time are retained but not classified as a content mutation; file/unclassified events fail',protected_before:before,protected_after:after,source_hash:pin.source_hash,seven_runtime_honesty:'REQUIRED / NOT_RUN / NOT_WAIVED; E4',harness_exclusions:['isolated Edge profile/cache','parent evidence writes after observer closes'],failure};
 fs.mkdirSync(ev,{recursive:true});
 // A rerun keeps every failed/successful receipt instead of overwriting it.
 const runDir=path.join(ev,'sentinel-'+started.replaceAll(/[:.]/g,'-'));fs.mkdirSync(runDir,{recursive:true});
 for(const [name,bytes] of Object.entries(artifacts))fs.writeFileSync(path.join(runDir,name),bytes);
 fs.writeFileSync(path.join(runDir,'SENTINEL.json'),JSON.stringify(receipt,null,2)+'\n');fs.writeFileSync(path.join(runDir,'server.stdout.txt'),Buffer.concat(stdout));fs.writeFileSync(path.join(runDir,'server.stderr.txt'),Buffer.concat(stderr));
 console.log(JSON.stringify({status:outcome,evidence:path.relative(root,runDir),events:events.length,failure}));
 if(outcome!=='PASS')process.exitCode=1;
}
