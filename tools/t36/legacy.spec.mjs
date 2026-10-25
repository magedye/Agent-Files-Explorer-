import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import {handleApiRequest} from '../../server/api.js';
import {registry} from '../../server/security.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),out=path.resolve('docs/evidence/studio-t36-completion-2026-10-25/v3/legacy-'+Date.now());
test('six legacy modes retain bilingual navigation, real read API and denied writes',async({page})=>{
 fs.mkdirSync(out,{recursive:true});const protectedNames=Object.keys(JSON.parse(fs.readFileSync('docs/evidence/studio-t36-2026-10-25/browser-1792930535064/ACCEPTANCE.json')).before),snapshot=()=>Object.fromEntries(protectedNames.map(p=>[p,sha(fs.readFileSync(p))])),before=snapshot(),errors=[],checks=[],events=[],watchers=[];
 for(const dir of new Set(protectedNames.map(p=>path.dirname(p))))watchers.push(fs.watch(dir,(event,file)=>{const p=path.posix.join(dir.replaceAll('\\','/'),String(file));if(protectedNames.includes(p))events.push({event,path:p});}));
 // A real, explicitly registered small root avoids recursively loading any
 // governance package. Legacy contract tests separately exercise its readers.
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-legacy-root-'));fs.writeFileSync(path.join(fixture,'README.md'),'# T36 legacy read fixture\nSandbox navigation only.\n');registry._roots.clear();registry.registerRoot({id:'t36-fixture',name:'T36 read fixture',path:fixture});
 const server=http.createServer((req,res)=>{if(req.url.startsWith('/api/'))return handleApiRequest(req,res);let p=new URL(req.url,'http://127.0.0.1').pathname;if(p==='/')p='/index.html';if(p!=='/index.html'&&!/^\/assets\/[\w.-]+$/.test(p)){res.writeHead(404);return res.end();}const f=path.join('dist',p);if(!fs.existsSync(f)){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':'text/javascript','Cache-Control':'no-store'});res.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let completed=false;
 try{page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);expect(await page.evaluate(()=>navigator.userAgent)).toContain('Edg/');await expect(page.locator('.root-item.active')).toContainText('T36 read fixture');await expect(page.locator('.progress')).toHaveCount(0);
 for(const locale of ['en','ar']){await page.locator('.language-select').selectOption(locale);for(let i=0;i<6;i++){await page.locator('.mode-btn').nth(i).click();await expect(page.locator('.mode-btn').nth(i)).toHaveClass(/active/);await expect(page.locator('.body')).not.toBeEmpty();await page.waitForTimeout(150);checks.push({locale,mode:['explorer','reference','intake','adoption','evaluation','staging'][i],status:'PASS'});}}
 const denial=await page.evaluate(async()=>{const r=await fetch('/api/intake/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rawText:'T36 must not persist'})});return {status:r.status,body:await r.json()};});expect(denial.status).toBe(403);completed=true;
 }finally{await new Promise(r=>server.close(r));watchers.forEach(w=>w.close());const after=snapshot(),differences=protectedNames.filter(p=>before[p]!==after[p]);fs.writeFileSync(path.join(out,'ACCEPTANCE.json'),JSON.stringify({status:completed&&!errors.length&&!differences.length&&!events.length?'PASS':'FAIL',completed,checks,errors,sentinel:{protected_files:protectedNames.length,before,after,differences,events},scope:'Six original modes navigation/read/error states only; real legacy API, explicit small fixture root, no write activation. Backend legacy semantics additionally covered by retained regression evidence.',browser:'isolated msedge'},null,2)+'\n');expect(errors).toEqual([]);expect(differences).toEqual([]);expect(events).toEqual([]);}
});
