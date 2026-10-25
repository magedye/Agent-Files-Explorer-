import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fork} from 'node:child_process';
const out=path.resolve('docs/evidence/studio-t36-completion-2026-10-25/browser-'+Date.now()),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const screenIds=['dashboard','registry','instruction','capabilities','skill','profiles','generation','verification','runtime','packages','package','meta','intake','audit','metrics','settings'];
let child,ready,origin,baseline,completed=false,watchers=[],events=[],responses=[],errors=[],checks=[];
const protectedNames=Object.keys(JSON.parse(fs.readFileSync('docs/evidence/studio-t36-2026-10-25/browser-1792930535064/ACCEPTANCE.json')).before);
const snapshot=()=>Object.fromEntries(protectedNames.map(p=>[p,sha(fs.readFileSync(p))]));
function control(command,id){const request_id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.off('message',listener);reject(Error('OPERATOR_CHANNEL_TIMEOUT'));},45000);function listener(m){if(m.event==='control'&&m.request_id===request_id){clearTimeout(timer);child.off('message',listener);if(m.error)reject(Error(m.error));else resolve(m.data);}}child.on('message',listener);child.send({command,id,request_id});});}
test.beforeAll(async()=>{
 fs.mkdirSync(out,{recursive:true});baseline=snapshot();
 for(const dir of new Set(protectedNames.map(p=>path.dirname(p))))watchers.push(fs.watch(dir,(event,file)=>{const p=path.posix.join(dir.replaceAll('\\','/'),String(file));if(protectedNames.includes(p))events.push({event,path:p,at:new Date().toISOString()});}));
 const storage=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-t36-browser-'));child=fork(path.resolve('server/studio/serve-studio.mjs'),['--port=0','--python='+path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe'),'--storage-root='+storage],{silent:true});
 ready=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('STARTUP_TIMEOUT')),90000);child.on('message',m=>{if(m.event==='ready'){clearTimeout(timer);resolve(m);}});child.on('error',reject);child.on('exit',code=>{if(!ready)reject(Error('STARTUP_EXIT_'+code));});});origin='http://127.0.0.1:'+ready.port;
});
test.afterAll(async()=>{
 for(const w of watchers)w.close();const after=snapshot(),differences=protectedNames.filter(p=>baseline[p]!==after[p]);
 fs.writeFileSync(path.join(out,'ACCEPTANCE.json'),JSON.stringify({status:completed&&checks.length&&checks.every(c=>c.status==='PASS')&&!differences.length&&!events.length&&!errors.length?'PASS':'FAIL',completed,checks,responses,console_errors:errors,sentinel:{protected_files:protectedNames.length,before:baseline,after,differences,events},credentials:'EXCLUDED; no traces, HAR, video or token persistence',browser:'Playwright channel msedge; isolated context; no owner browser profile'},null,2)+'\n');
 if(child?.connected){child.send('stop');await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},10000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}
 expect(differences).toEqual([]);expect(events).toEqual([]);expect(errors).toEqual([]);
});
test('16 working screens, actual pilot state, AR/EN/RTL, mobile and scoped Draft lifecycle',async({page,browser})=>{
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin+'/api/'))responses.push({path:new URL(r.url()).pathname,status:r.status()});});
 await page.goto(origin);expect(await page.evaluate(()=>navigator.userAgent)).toContain('Edg/');
 await page.locator('#studio-token').fill(ready.token);await page.locator('.p0-login button').click();await expect(page.getByTestId('studio-project')).toBeVisible();await page.getByTestId('studio-locale').selectOption('en');
 for(const screen of screenIds){await page.getByTestId('screen-'+screen).click();await expect(page.getByTestId('view-'+screen)).toBeVisible();await expect(page.locator('#studio-content h2').first()).not.toBeEmpty();await page.waitForTimeout(350);checks.push({id:'EN-'+screen,status:'PASS'});}
 for(const project of ['pilot-app-l2','pilot-app-l3']){
  await page.getByTestId('studio-project').selectOption(project);await page.getByTestId('screen-dashboard').click();await expect(page.getByTestId('published-proof')).toContainText(project);await expect(page.getByTestId('published-proof')).toContainText('NOT_RUN');await expect(page.getByTestId('pilot-dashboard')).toBeVisible();
  await page.getByTestId('screen-registry').click();await expect(page.locator('tr[data-row-id]').first()).toBeVisible();
  checks.push({id:project+'-public-UI',status:'PASS',historical_level:project.endsWith('l2')?'L2':'L3',fresh_qualification:'NOT_RUN'});
 }
 await page.getByTestId('studio-project').selectOption('rc3-local');await page.getByTestId('screen-packages').click();
 const item=JSON.parse(fs.readFileSync('governance_packages/candidates/AGHR_rc3_Core_Candidate/policies/observations/reference-state.json'));item.id='OBS-T36-BROWSER';
 await page.locator('#cp-title').fill('T36 actual browser draft');await page.locator('#cp-yaml').fill(JSON.stringify(item));await page.getByTestId('prepare-draft').click();
 const approve=async()=>{const box=page.locator('.studio-embedded .draft-intent');await expect(box).toBeVisible({timeout:45000});const command=await box.locator('pre').innerText(),id=command.match(/approve ([a-f0-9-]+)/)[1];await control('approve',id);await box.getByRole('button',{name:'Check authorization',exact:true}).click();await box.getByTestId('save-draft').click();await expect(box).toBeHidden({timeout:60000});};
 await approve();await expect(page.getByTestId('draft-detail')).toContainText('T36 actual browser draft');
 await page.getByTestId('validate-draft').click();await approve();await expect(page.getByTestId('draft-detail')).toContainText('validated');
 await page.getByTestId('generate-preview').click();await approve();await expect(page.getByTestId('generation-result')).toContainText('full');await expect(page.getByTestId('generation-result')).toContainText('PRIN-007');
 await page.getByTestId('screen-generation').click();await expect(page.getByTestId('generation-result')).toContainText('full');
 await page.getByTestId('screen-package').click();await expect(page.getByTestId('draft-detail')).toContainText('T36 actual browser draft');checks.push({id:'actual-Draft-create-strict-generate-persisted-detail',status:'PASS'});
 await page.getByTestId('screen-verification').click();await page.getByTestId('verify-prepare').click();const intent=page.locator('#studio-content .draft-intent');await expect(intent).toBeVisible({timeout:45000});await control('approve',(await intent.locator('pre').innerText()).match(/approve ([a-f0-9-]+)/)[1]);await page.getByTestId('verify-authorization').click();await page.getByTestId('verify-execute').click();await expect(page.getByTestId('verification-stream')).toBeVisible({timeout:45000});await expect(page.getByTestId('verification-result')).toContainText('passed',{timeout:60000});await expect(page.getByTestId('verification-stream')).toContainText('passed');checks.push({id:'actual-strict-CLI-WebSocket-browser',status:'PASS'});
 for(const screen of screenIds){await page.getByTestId('studio-locale').selectOption('ar');await page.getByTestId('screen-'+screen).click();await expect(page.locator('html')).toHaveAttribute('dir','rtl');await expect(page.getByTestId('view-'+screen)).toBeVisible();checks.push({id:'AR-'+screen,status:'PASS'});}
 await page.setViewportSize({width:390,height:844});await page.getByTestId('screen-dashboard').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();await page.screenshot({path:path.join(out,'arabic-mobile.png'),fullPage:true});checks.push({id:'mobile-RTL-no-horizontal-overflow',status:'PASS'});
 await page.setViewportSize({width:1440,height:1000});await page.getByTestId('studio-project').selectOption('pilot-app-l3');await expect(page.getByTestId('published-proof')).toContainText('pilot-app-l3');await page.screenshot({path:path.join(out,'pilot-l3-ar.png'),fullPage:true});completed=true;
});
