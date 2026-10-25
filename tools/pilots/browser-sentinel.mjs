// Real isolated Microsoft Edge; no connection to the other project's9223.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {encodeJsonl} from '../contracts/evidence_jsonl.mjs';
const base=path.resolve('docs/evidence/studio-pilots-2026-10-25'),out=path.resolve('docs/evidence/studio-t36-2026-10-25/browser-'+Date.now());fs.mkdirSync(out,{recursive:true});
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),root=process.cwd(),port=9224,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const id of ['pilot-app-l2','pilot-app-l3'])if(!fs.existsSync(base+'/'+id+'.latest.txt'))throw Error('PILOTS_NOT_PASSED');
try{await fetch('http://127.0.0.1:'+port+'/json/version',{signal:AbortSignal.timeout(400)});throw Error('ISOLATED_EDGE_PORT_OCCUPIED');}catch(e){if(e.message==='ISOLATED_EDGE_PORT_OCCUPIED')throw e;}
const profile=path.resolve('pilot-app-l2/.aghr/ci-private/edge-'+crypto.randomUUID());fs.mkdirSync(profile);
const edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--remote-debugging-port='+port,'--remote-debugging-address=127.0.0.1','--user-data-dir='+profile,'--disk-cache-dir='+profile+'/cache','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--disable-sync','about:blank'],{windowsHide:true,stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let socket,sessionId,context,version,server,failure;const checks=[],errors=[],events=[];
const receive=(child,predicate)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('SERVER_TIMEOUT')),90000);child.on('message',m=>{if(predicate(m)){clearTimeout(timer);resolve(m);}});});
const hashes=files=>Object.fromEntries(files.map(p=>[p,fs.existsSync(p)?sha(fs.readFileSync(p)):null]));
const parent=JSON.parse(fs.readFileSync(base+'/PREFLIGHT.json')),prior=JSON.parse(fs.readFileSync(parent.parent.path));
const protectedFiles=Object.keys(prior.files).filter(p=>!Object.keys(parent.before).includes(p));
for(const id of ['pilot-app-l2','pilot-app-l3']){protectedFiles.push(id+'/.aghr/state.json',id+'/AGENTS.md',id+'/.aghr/package/aghr.json');for(const name of fs.readdirSync(id+'/.aghr/package/policies'))protectedFiles.push(id+'/.aghr/package/policies/'+name);for(const name of id==='pilot-app-l2'?['app.mjs','app.test.mjs']:['app/security.py','app/repository.py','app/service.py','app/server.py','checks.py','data/inventory.sqlite'])protectedFiles.push(id+'/'+name);}
// These JSONL bytes are written by the trial agent, before the UI starts.
for(const id of ['pilot-app-l2','pilot-app-l3']){const dir=fs.readFileSync(base+'/'+id+'.latest.txt','utf8').trim(),cp=JSON.parse(fs.readFileSync(base+'/'+dir+'/ADOPTION_CP.json')),at=new Date().toISOString(),evidence=id+'/.aghr/runtime_evidence/'+id+'-owner-trial.jsonl';fs.mkdirSync(path.dirname(evidence),{recursive:true});if(!fs.existsSync(evidence))fs.writeFileSync(evidence,encodeJsonl([{task_id:id+'-owner-trial',session:{agent:'owner-delegated-sandbox-operator',agent_version:'1',host_os:'windows',started_at:at},events:[{at,type:'authorization.denied',source:'agent',request_ref:cp.package.id,action:'cp.submit',target:id,reason:'Actual Draft store refused a write without a matching scoped receipt; raw decision is retained in the CP audit.'}],submit_to_ci:false}]),{flag:'wx'});protectedFiles.push(evidence);}
const directoryMetadata=[];
const before=hashes(protectedFiles),watchers=['pilot-app-l2','pilot-app-l3'].map(id=>fs.watch(id,{recursive:true},(type,name)=>{if(!name)return;const p=(id+'/'+name).replaceAll('\\','/');if(p===id+'/.aghr'||p===id+'/.aghr/ci-private'||p===id+'/.aghr/drafts'){directoryMetadata.push({type,path:p,classification:'Directory metadata associated with the explicitly authorized Draft/browser folders; exact source/state/runtime file events and byte hashes are checked separately.'});return;}if(!p.includes('/.aghr/ci-private/')&&!p.includes('/.aghr/drafts/'))events.push({type,path:p});}));
try{
 const end=Date.now()+30000;while(Date.now()<end){try{version=await(await fetch('http://127.0.0.1:'+port+'/json/version')).json();break;}catch{await wait(150);}}if(!version)throw Error('EDGE_ENVIRONMENT_BLOCKED');assert.match(version.Browser,/Edg\//);
 socket=new WebSocket(version.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});let next=0;const pending=new Map();
 socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}}else if(m.sessionId===sessionId&&m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 const cdp=(method,params={},sid=sessionId)=>new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP_TIMEOUT '+method));},30000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));});
 const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 const until=async expr=>{const end=Date.now()+60000;while(Date.now()<end){const v=await evaluate(expr);if(v)return v;await wait(120);}throw Error('UI_TIMEOUT '+expr);};
 const click=async selector=>{const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing control');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await cdp('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});};
 const fill=async(selector,value)=>{await click(selector);await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});await cdp('Input.insertText',{text:value});};
 for(const id of ['pilot-app-l2','pilot-app-l3']){
  const privateRoot=path.resolve(id+'/.aghr/ci-private'),db=path.resolve(id+'/.aghr/drafts/browser-'+crypto.randomUUID());fs.mkdirSync(db);
  const skills=id==='pilot-app-l3'?[{id:'pilot-sql-readonly',source:'project',skillPath:path.resolve(id+'/procedures/sql-readonly/SKILL.md'),entry:path.resolve(id+'/procedures/sql-readonly/worker.py'),triggers:['review','مراجعة'],requires:['sandbox.read']}]:[];
  const cfg=privateRoot+'/browser-config-'+crypto.randomUUID()+'.json';fs.writeFileSync(cfg,JSON.stringify({skills,permissions:['sandbox.read'],scope:id+'/**'}),{flag:'wx'});
  server=spawn(process.execPath,['server/studio/serve-draft.mjs','--python='+python,'--port=0','--storage-root='+db,'--evidence-project='+path.resolve(id),'--skill-config='+cfg],{windowsHide:true,stdio:['pipe','pipe','pipe','ipc']});server.stdout.resume();server.stderr.resume();
  const ready=await receive(server,m=>m.event==='ready'),origin='http://127.0.0.1:'+ready.port;assert.equal(ready.tables,12);
  context=(await cdp('Target.createBrowserContext',{},null)).browserContextId;const target=(await cdp('Target.createTarget',{url:'about:blank',browserContextId:context},null)).targetId;sessionId=(await cdp('Target.attachToTarget',{targetId:target,flatten:true},null)).sessionId;
  await cdp('Runtime.enable');await cdp('Page.enable');await cdp('Page.navigate',{url:origin});await until('!!document.querySelector("#draft-token")');await fill('#draft-token',ready.token);await click('form button');await until('!!document.querySelector("[data-testid=phase5-nav]")');
  const request=async(method,route,body)=>{const r=await fetch(origin+route,{method,headers:{'X-Studio-Token':ready.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};};
  const denied=await request('POST','/api/v1/workspaces/rc3-local/skills/run',{operation:'discover',task_id:'unauthorized',query:'review'});assert.equal(denied.status,403);
  const runtime=await request('GET','/api/v1/workspaces/rc3-local/evidence/tasks');assert.equal(runtime.status,200);checks.push({id,api_unauthorized_write:403,runtime_list:runtime.body});
  await click('[data-testid=phase5-nav]');await until('!!document.querySelector("[data-testid=p5-dashboard]")');await click('[data-testid=p5-settings]');await until('!!document.querySelector("[data-testid=p5-settings-value]")');
  const warning=await evaluate('document.body.innerText');assert.match(warning,/GPG|توقيع|sign/i);checks.push({id,unsigned_warning_visible:true});
  for(const locale of ['en','ar']){
   await click('[data-testid=draft-locale]');await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:locale==='en'?'End':'Home',code:locale==='en'?'End':'Home',windowsVirtualKeyCode:locale==='en'?35:36});await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await until(`document.documentElement.dir===${JSON.stringify(locale==='ar'?'rtl':'ltr')}`);
   for(const tab of ['dashboard','metrics','settings']){await click('[data-testid=p5-'+tab+']');await wait(200);if(tab==='metrics')await until('document.querySelectorAll("tr[data-metric]").length===10');const screenshot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(out+'/'+id+'-'+locale+'-'+tab+'.png',Buffer.from(screenshot.data,'base64'),{flag:'wx'});checks.push({id,locale,tab,direction:await evaluate('document.documentElement.dir')});}
  }
  await click('[data-testid=runtime-nav]');await until('document.body.innerText.includes("'+id+'-owner-trial")');
  await cdp('Target.disposeBrowserContext',{browserContextId:context},null);context=null;sessionId=null;
  const stopped=new Promise(r=>server.once('exit',r));server.send('stop');await stopped;server=null;
 }
 assert.deepEqual(errors,[]);assert.deepEqual(hashes(protectedFiles),before);assert.equal(events.length,0,'Sentinel observed a protected project event');
 await cdp('Browser.close',{},null).catch(()=>{});
}catch(e){failure=e.stack;console.error(e.stack);}
finally{
 for(const w of watchers)w.close();if(server?.connected){const stopped=new Promise(r=>server.once('exit',r));server.send('stop');await stopped;}socket?.close();if(edge.exitCode===null)edge.kill();
 const after=hashes(protectedFiles);if(JSON.stringify(before)!==JSON.stringify(after)||events.length)failure=(failure||'')+' SENTINEL_FAILED';
 fs.writeFileSync(out+'/ACCEPTANCE.json',JSON.stringify({status:failure?'FAIL':'PASS',failure,browser:version?.Browser,cdp_port:port,reason_for9224:'9223 belongs to another project and was not attached or changed; dedicated isolated Edge CDP instrumentation used.',checks,console_errors:errors,protected_files:protectedFiles.length,before,after,events,directory_metadata:directoryMetadata,source_written:false,state_written:false,runtime_evidence_written_by_studio:false,gap:'UI default catalog/Dashboard is still the reference Draft candidate/L0; this is not global pilot registration or canonical59-operation acceptance.'},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({out,status:failure?'FAIL':'PASS',protected_files:protectedFiles.length}));
}
if(failure)process.exitCode=1;
