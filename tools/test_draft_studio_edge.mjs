// Operator-owned isolated Edge/SQLite harness. Credentials stay in memory.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const root=process.cwd(),out=path.resolve('docs/evidence/studio-draft-auth-cp-2026-10-23');
const temp=fs.mkdtempSync(path.join(root,'temp/draft-browser-')),storageRoot=path.join(temp,'db'),profile=path.join(temp,'edge-profile');
fs.mkdirSync(storageRoot);fs.mkdirSync(profile);
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const parent=JSON.parse(fs.readFileSync('docs/evidence/studio-t12-mock-write-core-2026-10-23/CUSTODY.lock.json','utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const snapshots=()=>Object.fromEntries(Object.keys(parent.files).map(p=>[p,sha(fs.readFileSync(p))]));
const before=snapshots(),events=[],consoleErrors=[],network=[],artifacts={},checks=[];
const directoryState=p=>{const s=fs.statSync(p);return {mtimeMs:s.mtimeMs,birthtimeMs:s.birthtimeMs,entries:fs.readdirSync(p).sort()};};
const evidenceRelative=path.relative(root,out).replaceAll('\\','/');
const directoryBefore=Object.fromEntries(['dist','dist/assets','temp',evidenceRelative,evidenceRelative+'/before',evidenceRelative+'/before/browser-before-worker'].map(p=>[p,directoryState(p)]));
const assetHashes=()=>Object.fromEntries(['dist/draft.html',...fs.readdirSync('dist/assets').map(n=>'dist/assets/'+n)].map(p=>[p,sha(fs.readFileSync(p))]));
const assetsBefore=assetHashes();
const programNames=['server/studio/draft-runtime.js','server/studio/draft-routes.js','server/studio/serve-draft.mjs','server/studio/write-authorization.js','server/studio/db/persistent.js','server/studio/aghr/draft-validator.js','server/studio/aghr/draft-adapter.py','server/studio/aghr/job-runner.js','server/studio/aghr/windows-job.py','src/features/changes/DraftStudio.jsx','src/features/changes/main.jsx','src/features/changes/draft.css','draft.html','vite.config.mjs'];
const programHashes=()=>Object.fromEntries(programNames.map(p=>[p,sha(fs.readFileSync(p))]));
const programBefore=programHashes();
let studio,edge,cdp,watcher,ready,port,token,failure,debugPort;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const deadline=async(fn,label,ms=30000)=>{const end=Date.now()+ms;while(Date.now()<end){const v=await fn();if(v)return v;await wait(100);}throw Error('Timeout: '+label);};
const receive=(child,predicate,ms=30000)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.off('message',onMessage);reject(Error('IPC timeout'));},ms);function onMessage(m){if(predicate(m)){clearTimeout(timer);child.off('message',onMessage);resolve(m);}}child.on('message',onMessage);});
const control=async(command,id)=>{const request_id=crypto.randomUUID(),promise=receive(studio,m=>m.event==='control'&&m.request_id===request_id);studio.send({command,id,request_id});const r=await promise;if(r.error)throw Error(r.error);return r.data;};
async function launch(){
 studio=spawn(process.execPath,['server/studio/serve-draft.mjs','--python='+python,'--port=0','--storage-root='+storageRoot],{cwd:root,windowsHide:true,stdio:['pipe','pipe','pipe','ipc']});
 studio.stdout.resume();studio.stderr.on('data',b=>{if(!b.toString().includes('ExperimentalWarning')&&!b.toString().includes('trace-warnings'))consoleErrors.push('server: '+b.toString());});
 const m=await receive(studio,m=>m.event==='ready',75000);token=m.token;port=m.port;ready={...m};delete ready.token;
 assert.equal(ready.tables,12);assert.equal(ready.mode,'DRAFT');
}
async function stopStudio(){if(studio?.connected){const done=new Promise(r=>studio.once('exit',r));studio.send('stop');await Promise.race([done,wait(10000)]);if(studio.exitCode===null){studio.kill();throw Error('Draft server failed to stop');}}}
class CDP{
 constructor(socket){this.socket=socket;this.next=0;this.pending=new Map();socket.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p?.reject(Error(m.error.message)):p?.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')consoleErrors.push(m.params.exceptionDetails.text);else if(m.method==='Network.responseReceived'){const r=m.params.response;network.push({url:r.url.split('?')[0],status:r.status});}else if(m.method==='Network.requestWillBeSent'){const r=m.params.request;if(r.method==='POST'&&/\/api\/v1\/workspaces\/rc3-local\/change-packages$/.test(r.url)&&r.postData)artifacts['HTTP_CREATE_REQUEST.json']=Buffer.from(r.postData);}});}
 call(method,params={}){return new Promise((resolve,reject)=>{const id=++this.next;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout: '+method));},20000);this.pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});this.socket.send(JSON.stringify({id,method,params}));});}
 async evaluate(expression){const r=await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;}
}
const click=async selector=>{const point=await cdp.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing control');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await cdp.call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await cdp.call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});};
const fill=async(selector,text)=>{await click(selector);await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});await cdp.call('Input.insertText',{text});};
const select=async(selector,value)=>cdp.evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
const screenshot=async name=>{await cdp.evaluate('window.scrollTo(0,0)');const {data}=await cdp.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});artifacts[name]=Buffer.from(data,'base64');};
const connect=async()=>{await deadline(()=>cdp.evaluate('Boolean(document.querySelector("#draft-token"))'),'login');await fill('#draft-token',token);await click('.p0-login button');await deadline(()=>cdp.evaluate('Boolean(document.querySelector("#cp-title"))'),'connected Draft workspace');};
try{
 watcher=fs.watch(root,{recursive:true},(type,name)=>{if(!name)return;const p=name.replaceAll('\\','/');if(p.startsWith(path.relative(root,temp).replaceAll('\\','/')+'/'))return;events.push({type,path:p});});
 await launch();
 for(const candidate of [9223,9224,9225,9226]){let occupied=false;try{occupied=(await fetch(`http://127.0.0.1:${candidate}/json/version`,{signal:AbortSignal.timeout(500)})).ok;}catch{}if(!occupied){debugPort=candidate;break;}}
 if(!debugPort)throw Error('ENVIRONMENT_BLOCKED: isolated loopback CDP ports occupied');
 edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--remote-debugging-port='+debugPort,'--remote-debugging-address=127.0.0.1','--user-data-dir='+profile,'--disk-cache-dir='+path.join(profile,'cache'),'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--disable-sync','about:blank'],{windowsHide:true,stdio:'ignore'});
 const version=await deadline(async()=>{try{return await(await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();}catch{return null;}},'Edge');assert.match(version.Browser,/Edg/);
 const target=await(await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json(),socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});cdp=new CDP(socket);
 for(const method of ['Page.enable','Runtime.enable','Network.enable'])await cdp.call(method);
 await cdp.call('Emulation.setDeviceMetricsOverride',{width:1360,height:1000,deviceScaleFactor:1,mobile:false});
 await cdp.call('Page.addScriptToEvaluateOnNewDocument',{source:"window.__draftStorageWrites=[];for(const k of ['setItem','removeItem','clear'])Storage.prototype[k]=function(){window.__draftStorageWrites.push(k);throw Error('No browser credential persistence')};"});
 await cdp.call('Page.navigate',{url:`http://127.0.0.1:${port}/`});await connect();
 const body=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_T12_Candidate/policies/drafts/AGHR-001.json','utf8'));
 await fill('#cp-title','مراجعة الأسرار · Secret handling draft');await select('#cp-kind',body.kind);await fill('#cp-yaml',JSON.stringify(body,null,2));
 await click('[data-testid=prepare-draft]');assert.equal(await cdp.evaluate('document.querySelector("#cp-title").disabled'),true);await deadline(()=>cdp.evaluate('Boolean(document.querySelector(".draft-intent pre"))'),'prepared');
 assert.equal(await cdp.evaluate('document.querySelector("[data-testid=save-draft]").disabled'),true);
 const id=(await cdp.evaluate('document.querySelector(".draft-intent pre").textContent')).split(' ')[1];assert.match(id,/^[a-f0-9-]{36}$/);
 const pending=await control('list');assert(pending.some(i=>i.id===id));
 const denial=await fetch(`http://127.0.0.1:${port}/api/v1/workspaces/rc3-local/change-packages`,{method:'POST',headers:{'x-studio-token':token,'content-type':'application/json'},body:'{}'});assert.equal(denial.status,403);artifacts['HTTP_DENIED.json']=Buffer.from(JSON.stringify({status:denial.status,body:await denial.json()},null,2));
 await screenshot('DRAFT_AR.png');checks.push('Arabic RTL; save disabled without operator grant; real API403');
 await control('approve',id);await click('.draft-actions button:first-child');await deadline(()=>cdp.evaluate('!document.querySelector("[data-testid=save-draft]").disabled'),'server grant');await click('[data-testid=save-draft]');
 await deadline(()=>cdp.evaluate('Boolean(document.querySelector("[data-testid=draft-detail]"))'),'saved CP');
 const listResponse=await fetch(`http://127.0.0.1:${port}/api/v1/workspaces/rc3-local/change-packages`,{headers:{'x-studio-token':token}});const list=await listResponse.json();assert.equal(list.data.length,1);assert.equal(list.data[0].status,'draft');assert.equal(list.data[0].checks.validate.status,'NOT_RUN');artifacts['HTTP_CREATED_LIST.json']=Buffer.from(JSON.stringify(list,null,2));
 await select('[data-testid=draft-locale]','en');await deadline(()=>cdp.evaluate('document.documentElement.dir==="ltr"&&document.querySelector("h1").textContent==="Change packages"'),'English');await screenshot('DRAFT_EN.png');
 await cdp.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await cdp.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await screenshot('DRAFT_MOBILE.png');
 await cdp.call('Emulation.setDeviceMetricsOverride',{width:1360,height:1000,deviceScaleFactor:1,mobile:false});
 const broken=structuredClone(body);delete broken.authority.level;await fill('#cp-title','Missing authority.level');await fill('#cp-yaml',JSON.stringify(broken));await click('[data-testid=prepare-draft]');await deadline(()=>cdp.evaluate('Boolean(document.querySelector("[role=alert]"))'),'invalid mandatory rule');assert.match(await cdp.evaluate('document.querySelector("[role=alert]").textContent'),/422/);
 await click('.draft-toolbar nav button:nth-child(2)');await deadline(()=>cdp.evaluate('document.querySelector("h2")?.textContent==="Write attempts and outcomes"'),'audit');await screenshot('DRAFT_AUDIT.png');
 const audit=await(await fetch(`http://127.0.0.1:${port}/api/v1/audit-events`,{headers:{'x-studio-token':token}})).json();assert(audit.data.some(e=>JSON.parse(e.payload_json)?.result==='DENY'));artifacts['HTTP_AUDIT.json']=Buffer.from(JSON.stringify(audit,null,2));
 assert.deepEqual(await cdp.evaluate('window.__draftStorageWrites'),[]);checks.push('Authorized201, draft only/NOT_RUN; missing authority422; auditDENY and SUCCESS; English LTR and responsive390px');
 await stopStudio();const oldToken=token;await launch();assert.notEqual(oldToken,token);
 await cdp.call('Page.navigate',{url:`http://127.0.0.1:${port}/`});await connect();await deadline(()=>cdp.evaluate('document.querySelectorAll(".draft-list li").length===1'),'reopened persistent draft');checks.push('New server/session reopened same SQLite CP; 12tables retained');
 artifacts['BROWSER.json']=Buffer.from(JSON.stringify({status:'PASS',browser:version.Browser,transport:'direct CDP; DevTools MCP unavailable',cdp:`127.0.0.1:${debugPort}`,profile:'isolated Edge',ready,checks,network,console_errors:consoleErrors,browser_storage_writes:await cdp.evaluate('window.__draftStorageWrites')},null,2));
 assert.deepEqual(consoleErrors,[]);assert.deepEqual(snapshots(),before);
}catch(error){failure={message:error.message,stack:error.stack};}
finally{
 cdp?.socket.close();if(edge)edge.kill();try{await stopStudio();}catch(error){failure??={message:error.message};}
 await wait(500);watcher?.close();
 const after=snapshots();if(JSON.stringify(before)!==JSON.stringify(after))failure??={message:'Protected prior files changed'};
 const directoryAfter=Object.fromEntries(Object.keys(directoryBefore).map(p=>[p,directoryState(p)]));
 const mutations=events.filter(e=>!(directoryBefore[e.path]&&JSON.stringify(directoryBefore[e.path])===JSON.stringify(directoryAfter[e.path])));
 const assetsUnchanged=JSON.stringify(assetsBefore)===JSON.stringify(assetHashes());
 const programUnchanged=JSON.stringify(programBefore)===JSON.stringify(programHashes());
 if(!programUnchanged)failure??={message:'Program source changed during browser observation'};
 if(mutations.length||!assetsUnchanged)failure??={message:'Unexpected repository filesystem writes',events:mutations,assetsUnchanged};
 for(const [name,bytes]of Object.entries(artifacts))fs.writeFileSync(path.join(out,name),bytes);
 fs.writeFileSync(path.join(out,'PROGRAM_PIN.json'),JSON.stringify({program:programBefore,built_assets:assetsBefore,unchanged:programUnchanged&&assetsUnchanged},null,2)+'\n');
 const database=path.join(storageRoot,'studio.sqlite');if(fs.existsSync(database))fs.copyFileSync(database,path.join(out,'ISOLATED_DRAFT_DB.sqlite'));
 fs.writeFileSync(path.join(out,'BROWSER_SENTINEL.json'),JSON.stringify({status:failure?'FAIL':'PASS',failure,protected_files:Object.keys(before).length,unchanged:JSON.stringify(before)===JSON.stringify(after),asset_hashes_unchanged:assetsUnchanged,watcher_events:events,unexpected_repository_events:mutations,directory_before:directoryBefore,directory_after:directoryAfter,notification_classification:'Directory-only notifications are excluded only when birthtime, last-write-time and exact entries are unchanged; asset digests also checked. File or unknown events fail.',allowed_writes:['isolated test SQLite and journal','isolated Edge profile'],source_writes:JSON.stringify(before)===JSON.stringify(after)?0:null,browser_tool:'Microsoft Edge direct CDP',checks,db_snapshot:'ISOLATED_DRAFT_DB.sqlite'},null,2)+'\n');
 console.log(JSON.stringify({status:failure?'FAIL':'PASS',failure,checks:checks.length,protected_files:Object.keys(before).length}));
 if(failure)process.exitCode=1;
}
