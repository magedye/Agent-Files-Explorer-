import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fork} from 'node:child_process';
const out=path.resolve('docs/evidence/studio-t36-completion-2026-10-25/v2/browser-live-'+Date.now());
const names=Object.keys(JSON.parse(fs.readFileSync('docs/evidence/studio-t36-2026-10-25/browser-1792930535064/ACCEPTANCE.json')).before),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const snapshot=()=>Object.fromEntries(names.map(p=>[p,hash(fs.readFileSync(p))]));
let before,watchers=[],events=[],cases=[],errors=[];
test.beforeAll(()=>{fs.mkdirSync(out,{recursive:true});before=snapshot();for(const dir of new Set(names.map(p=>path.dirname(p))))watchers.push(fs.watch(dir,(event,file)=>{const p=path.posix.join(dir.replaceAll('\\','/'),String(file));if(names.includes(p))events.push({event,path:p});}));});
test.afterAll(()=>{for(const w of watchers)w.close();const after=snapshot(),differences=names.filter(p=>before[p]!==after[p]);fs.writeFileSync(path.join(out,'ACCEPTANCE.json'),JSON.stringify({status:cases.length===2&&cases.every(c=>c.completed)&&!differences.length&&!events.length&&!errors.length?'PASS':'FAIL',cases,console_errors:errors,sentinel:{files:names.length,before,after,differences,events},browser:'Microsoft Edge, isolated Playwright context',credentials:'EXCLUDED; no traces/HAR/video'},null,2)+'\n');expect(differences).toEqual([]);expect(events).toEqual([]);expect(errors).toEqual([]);});
async function start(readOnly=false){
 const storageRoot=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-ui-v2-')),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
 const child=fork(path.resolve(readOnly?'server/studio/serve.mjs':'server/studio/serve-studio.mjs'),['--port=0','--python='+python,...(readOnly?[]:['--storage-root='+storageRoot])],{silent:true,...(readOnly?{execArgv:['--permission','--allow-fs-read=*','--allow-child-process']}:{})});
 let ready;const stderr=[];child.stderr.on('data',b=>{if(stderr.join('').length<16384)stderr.push(b.toString());});
 ready=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('STARTUP_TIMEOUT')),90000);child.on('message',m=>{if(m.event==='ready'){clearTimeout(timer);resolve(m);}});child.on('error',reject);child.on('exit',code=>{if(!ready){clearTimeout(timer);reject(Error('STARTUP_EXIT_'+code+' '+stderr.join('')));}});});
 const control=(command,id)=>new Promise((resolve,reject)=>{const request_id=crypto.randomUUID(),timer=setTimeout(()=>{child.off('message',listener);reject(Error('OPERATOR_TIMEOUT'));},45000);function listener(m){if(m.event==='control'&&m.request_id===request_id){clearTimeout(timer);child.off('message',listener);m.error?reject(Error(m.error)):resolve(m.data);}}child.on('message',listener);child.send({command,id,request_id});});
 const close=()=>new Promise(resolve=>{if(child.exitCode!==null)return resolve();const timer=setTimeout(()=>{child.kill();resolve();},15000);child.once('exit',()=>{clearTimeout(timer);resolve();});child.send('stop');});
 return {origin:'http://127.0.0.1:'+ready.port,ready,control,close};
}
test('actual local qualification and usage propagate to card/matrix without source writes',async({page})=>{
 const record={id:'current-local-card-and-matrix',completed:false};cases.push(record);const app=await start();page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(app.origin);expect(await page.evaluate(()=>navigator.userAgent)).toContain('Edg/');await page.locator('#studio-token').fill(app.ready.token);await page.locator('.p0-login button').click();await expect(page.getByTestId('studio-project')).toBeVisible();await page.getByTestId('studio-locale').selectOption('en');await page.getByTestId('studio-project').selectOption('pilot-app-l3');await expect(page.getByTestId('published-proof')).toContainText('pilot-app-l3');await page.getByTestId('screen-skill').click();
  const detail=page.getByTestId('skill-detail'),skills=page.getByTestId('skills-screen');await expect(detail).toBeVisible();await expect(detail).toContainText('DISCOVERED');await expect(detail).toContainText('NOT_RUN');await expect(skills.locator('#skill-id')).toContainText('pilot-sql-readonly');
  await skills.locator('#skill-task').fill('t36-ui-live');await skills.locator('#skill-id').selectOption('pilot-sql-readonly');await skills.locator('#skill-query').fill('مراجعة');
  const criteria=JSON.stringify({all:[{pointer:'/valid',op:'equals',value:true},{pointer:'/project',op:'equals',value:'pilot-app-l3'},{pointer:'/rows',op:'equals',value:3},{pointer:'/denied',op:'equals',value:5},{pointer:'/unchanged',op:'equals',value:true}]});
  const run=async op=>{await skills.locator('#skill-operation').selectOption(op);if(['execute','eval','qualify'].includes(op))await skills.locator('#skill-input').fill('{"expected_rows":3}');if(['verify','eval','qualify'].includes(op))await skills.locator('#skill-criteria').fill(criteria);await skills.getByTestId('skill-prepare').click();const intent=skills.locator('.draft-intent');await expect(intent).toBeVisible({timeout:45000});const id=(await intent.locator('pre').innerText()).match(/approve ([a-f0-9-]+)/)[1];await app.control('approve',id);await skills.getByTestId('skill-auth').click();await skills.getByTestId('skill-run').click();await expect(intent).toBeHidden({timeout:180000});};
  for(const op of ['select','load','execute','verify'])await run(op);await expect(skills.getByTestId('live-skill-card')).toContainText('VERIFIED');await detail.getByTestId('refresh-skill').click();await expect(page.getByTestId('skill-detail')).toContainText('VERIFIED',{timeout:15000});
  await run('eval');await run('qualify');await expect(skills.getByTestId('live-skill-card')).toContainText('QUALIFIED');await page.getByTestId('refresh-skill').click();await expect(page.getByTestId('skill-detail')).toContainText('QUALIFIED',{timeout:15000});
  await page.getByTestId('tuple-version').fill('FOREIGN_VERSION');await page.getByTestId('tuple-match').click();await expect(page.getByTestId('tuple-result')).toContainText('NOT_RUN');
  await page.getByTestId('screen-capabilities').click();await expect(page.locator('tr[data-skill-id="CAP-PILOT-SQL"]')).toContainText('QUALIFIED');await expect(page.getByTestId('capabilities')).toContainText('aghr-local-process');await page.screenshot({path:path.join(out,'current-matrix-en.png'),fullPage:true});
  await page.getByTestId('studio-locale').selectOption('ar');await page.setViewportSize({width:390,height:844});for(const screen of ['skill','runtime','settings']){await page.getByTestId('screen-'+screen).click();await expect(page.getByTestId('view-'+screen)).toBeVisible();await expect(page.locator('html')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();}
  record.completed=true;record.operations=['select','load','execute','verify','eval3','qualify3'];record.native_hosts='NOT_RUN';
 }finally{await app.close();}
});
test('legacy Phase1 sample and core matrix remain read-only in the original permission profile',async({page})=>{
 const record={id:'legacy-read-only-profile',completed:false};cases.push(record);const app=await start(true);page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(app.origin);await page.locator('#p0-token').fill(app.ready.token);await page.locator('.p0-login button').click();await expect(page.getByTestId('source')).toBeVisible();await page.getByTestId('locale').selectOption('en');await page.getByTestId('source').selectOption('sample');await page.goto(app.origin+'/#/capabilities');await expect(page.locator('tr[data-skill-id]').first()).toBeVisible();await page.locator('tr[data-skill-id] button').first().click();await expect(page.getByTestId('skill-detail')).toBeVisible();await expect(page.getByTestId('skill-detail')).toContainText('NOT_RUN');await page.getByTestId('back-capabilities').click();await page.getByTestId('source').selectOption('core');await expect(page.getByTestId('capabilities')).toBeVisible();record.completed=true;record.source_written=false;
 }finally{await app.close();}
});
