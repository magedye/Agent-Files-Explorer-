// Operator-owned isolated Edge/SQLite harness. Credentials stay in memory.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const root=process.cwd(),out=path.resolve('docs/evidence/studio-e3-t19-2026-10-24');
const temp=fs.mkdtempSync(path.join(root,'temp/draft-browser-')),storageRoot=path.join(temp,'db'),profile=path.join(temp,'edge-profile');
fs.mkdirSync(storageRoot);fs.mkdirSync(profile);
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const parent=JSON.parse(fs.readFileSync('docs/evidence/studio-e5-t16-preview-2026-10-23/CUSTODY.lock.json','utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const snapshots=()=>Object.fromEntries(Object.keys(parent.files).map(p=>[p,sha(fs.readFileSync(p))]));
const before=snapshots(),events=[],consoleErrors=[],network=[],artifacts={},checks=[];
const directoryState=p=>{const s=fs.statSync(p);return {mtimeMs:s.mtimeMs,birthtimeMs:s.birthtimeMs,entries:fs.readdirSync(p).sort()};};
const evidenceRelative=path.relative(root,out).replaceAll('\\','/');
const directoryBefore=Object.fromEntries(['dist','dist/assets','temp',evidenceRelative,evidenceRelative+'/before',evidenceRelative+'/before/server'].map(p=>[p,directoryState(p)]));
const assetHashes=()=>Object.fromEntries(['dist/draft.html',...fs.readdirSync('dist/assets').map(n=>'dist/assets/'+n)].map(p=>[p,sha(fs.readFileSync(p))]));
const assetsBefore=assetHashes();
const programNames=['server/studio/draft-runtime.js','server/studio/draft-routes.js','server/studio/serve-draft.mjs','server/studio/write-authorization.js','server/studio/db/persistent.js','server/studio/aghr/draft-validator.js','server/studio/aghr/draft-adapter.py','server/studio/aghr/job-runner.js','server/studio/aghr/windows-job.py','src/features/changes/DraftStudio.jsx','src/features/changes/main.jsx','src/features/changes/draft.css','draft.html','vite.config.mjs'];
const programHashes=()=>Object.fromEntries(programNames.map(p=>[p,sha(fs.readFileSync(p))]));
for(const p of Object.keys(JSON.parse(fs.readFileSync('server/studio/aghr/e5/EXTENSION.lock.json','utf8')).files))if(!programNames.includes(p))programNames.push(p);
programNames.push('server/studio/aghr/e5/EXTENSION.lock.json');
for(const p of Object.keys(JSON.parse(fs.readFileSync('server/studio/aghr/e3/SOURCE.lock.json','utf8')).files))if(!programNames.includes(p))programNames.push(p);
programNames.push('server/studio/aghr/bounded-validator.js','server/studio/artifact-store.js','src/features/changes/ReviewPanel.jsx','tools/aghr_get_rule.mjs','server/studio/aghr/e3/SOURCE.lock.json');
const programBefore=programHashes();
let studio,edge,cdp,watcher,ready,port,token,failure,debugPort;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const deadline=async(fn,label,ms=90000)=>{const end=Date.now()+ms;while(Date.now()<end){const v=await fn();if(v)return v;await wait(100);}throw Error('Timeout: '+label);};
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
const screenshot=async(name,focus)=>{await cdp.evaluate(focus?'document.querySelector('+JSON.stringify(focus)+').scrollIntoView({block:"center"})':'window.scrollTo(0,0)');const {data}=await cdp.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});artifacts[name]=Buffer.from(data,'base64');};
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
 const body=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json','utf8'));body.id='OBS-EDGE-T18';
 const get=async()=>{const r=await fetch(`http://127.0.0.1:${port}/api/v1/workspaces/rc3-local/change-packages`,{headers:{'x-studio-token':token}});return (await r.json()).data;};
 async function authorizeAction(){
  await deadline(()=>cdp.evaluate('Boolean(document.querySelector(".draft-intent pre"))'),'intent');
  const id=(await cdp.evaluate('document.querySelector(".draft-intent pre").textContent')).split(' ')[1];await control('approve',id);await click('.draft-actions button:first-child');await deadline(()=>cdp.evaluate('!document.querySelector("[data-testid=save-draft]").disabled'),'grant');await click('[data-testid=save-draft]');
  await deadline(()=>cdp.evaluate('!document.querySelector(".draft-intent")&&!document.querySelector("[aria-busy=true]")'),'action complete');
 }
 await fill('#cp-title','دورة الموافقات الفعلية · Actual approvals');await select('#cp-kind',body.kind);await fill('#cp-yaml',JSON.stringify(body,null,2));await click('[data-testid=prepare-draft]');await authorizeAction();
 let cp=(await get())[0];assert.equal(cp.status,'draft');checks.push('Real UI creates authorized persistent Draft');
 await click('[data-testid=validate-draft]');await authorizeAction();await click('[data-testid=generate-preview]');await authorizeAction();
 cp=(await get())[0];assert.equal(cp.generation.stage,'full');assert.equal(cp.generation.prin_007_present,true);assert.equal(cp.checks.eval.status,'NOT_RUN');
 await click('[data-testid=preview-patch]');await authorizeAction();assert(await cdp.evaluate('document.querySelector("[data-testid=patch-diff]").textContent.includes("diff --git")'));
 await click('[data-testid=submit-draft]');await authorizeAction();await fill('#approval-reason','موافقة اختبار محلية ضمن تفويض التنفيذ؛ لا اعتماد إصدار');await click('[data-testid=approve-package]');await authorizeAction();
 cp=(await get())[0];assert.equal(cp.approvals.length,1);assert.equal(cp.status,'in_review');artifacts['HTTP_REAL_APPROVAL.json']=Buffer.from(JSON.stringify(cp,null,2));await screenshot('T18_APPROVAL_AR.png','[data-testid=review-panel]');
 const oldHash=cp.proposal_version_hash;body.rule+=' Updated proposal invalidates approval.';await fill('#edit-yaml',JSON.stringify(body,null,2));await click('[data-testid=prepare-edit]');await authorizeAction();
 cp=(await get())[0];assert.notEqual(cp.proposal_version_hash,oldHash);assert.equal(cp.approvals.length,0);assert.equal(cp.approval_history.length,1);assert.equal(cp.approval_history[0].decision.approved_version_hash,oldHash);artifacts['HTTP_REAL_INVALIDATION.json']=Buffer.from(JSON.stringify(cp,null,2));checks.push('Actual backend-issued approval persisted; editing invalidates it and retains original decision/hash/history');
 const sec=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_T06_SEC001_Candidate/complete/policies/security/secrets.json','utf8'));
 await fill('#cp-title','SEC-001 · موافقة المصدر والبوابة وE4 مطلوبة');await select('#cp-kind',sec.kind);await fill('#cp-yaml',JSON.stringify(sec,null,2));await click('[data-testid=prepare-draft]');await authorizeAction();
 await click('[data-testid=validate-draft]');await authorizeAction();cp=(await get()).find(p=>p.kind==='CONSTRAINT');assert.equal(cp.status,'draft');assert.match(cp.checks.validate.reason,/P0_EVAL_QUALIFICATION_UNAVAILABLE/);
 await click('[data-testid=doctor-draft]');await authorizeAction();await click('[data-testid=generate-preview]');await authorizeAction();await click('[data-testid=preview-patch]');await authorizeAction();
 assert.equal(await cdp.evaluate('document.querySelector("[data-testid=export-patch]").disabled'),true);assert.equal(await cdp.evaluate('document.querySelector("[data-testid=approve-package]").disabled'),true);
 await click('[data-testid=draft-patch]');await authorizeAction();cp=(await get()).find(p=>p.kind==='CONSTRAINT');assert.equal(cp.status,'draft');assert.equal(cp.checks.eval.status,'NOT_RUN');assert(await cdp.evaluate('document.querySelector("[data-testid=patch-artifact]").textContent.includes("NOT_APPROVED")'));
 artifacts['HTTP_SEC001_BLOCKED.json']=Buffer.from(JSON.stringify(cp,null,2));await screenshot('T19_REVIEW_ONLY_AR.png','[data-testid=patch-artifact]');checks.push('SEC-001 native source/GitHub/P0 blockers remain; approved export disabled; explicit review-only patch exists without state/source application');
 await select('[data-testid=draft-locale]','en');await deadline(()=>cdp.evaluate('document.documentElement.dir==="ltr"'),'English');await screenshot('T18_EN.png','[data-testid=review-panel]');
 await cdp.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await cdp.evaluate('document.documentElement.scrollWidth<=innerWidth'),true);await screenshot('T18_MOBILE.png','[data-testid=review-panel]');checks.push('Arabic/English RTL/LTR and responsive390px; review/export labels explicit');
 assert.deepEqual(await cdp.evaluate('window.__draftStorageWrites'),[]);assert.deepEqual(consoleErrors,[]);
 artifacts['BROWSER.json']=Buffer.from(JSON.stringify({status:'PASS',browser:version.Browser,transport:'direct CDP; DevTools MCP unavailable',cdp:`127.0.0.1:${debugPort}`,profile:'isolated Edge',ready,checks,network,console_errors:consoleErrors,browser_storage_writes:[]},null,2));
 const audit=await(await fetch(`http://127.0.0.1:${port}/api/v1/audit-events`,{headers:{'x-studio-token':token}})).json();artifacts['HTTP_AUDIT.json']=Buffer.from(JSON.stringify(audit,null,2));
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
 fs.writeFileSync(path.join(out,'BROWSER_SENTINEL.json'),JSON.stringify({status:failure?'FAIL':'PASS',failure,protected_files:Object.keys(before).length,unchanged:JSON.stringify(before)===JSON.stringify(after),asset_hashes_unchanged:assetsUnchanged,watcher_events:events,unexpected_repository_events:mutations,directory_before:directoryBefore,directory_after:directoryAfter,notification_classification:'Directory-only notifications are excluded only when birthtime, last-write-time and exact entries are unchanged; asset digests also checked. File or unknown events fail.',allowed_writes:['isolated test SQLite, journal and explicitly authorized patch artifact','isolated Edge profile','OS temporary bounded input files outside repository, removed after invocation'],source_writes:JSON.stringify(before)===JSON.stringify(after)?0:null,browser_tool:'Microsoft Edge direct CDP',checks,db_snapshot:'ISOLATED_DRAFT_DB.sqlite'},null,2)+'\n');
 console.log(JSON.stringify({status:failure?'FAIL':'PASS',failure,checks:checks.length,protected_files:Object.keys(before).length}));
 if(failure)process.exitCode=1;
}
