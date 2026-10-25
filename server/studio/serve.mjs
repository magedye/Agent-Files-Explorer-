import './zero-write.js';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createStudio} from './runtime.js';
import {repository} from './aghr/cli-bridge.js';
import {writeAttempts} from './zero-write.js';

const args=new Map(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');if(i<0)throw Error('Use --name=value');return [arg.slice(0,i),arg.slice(i+1)];}));
if([...args.keys()].some(k=>!['--python','--port','--self-test'].includes(k)))throw Error('Unknown startup option');
const python=args.get('--python')||process.env.AGHR_STUDIO_PYTHON;
const port=Number(args.get('--port')||5181);
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
const assets=new Map(),dist=path.join(repository,'dist');
function preload(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isSymbolicLink())throw Error('Static reparse point');if(ent.isDirectory())preload(full);else assets.set('/'+path.relative(dist,full).split(path.sep).join('/'),fs.readFileSync(full));}}
preload(dist);
if(!assets.has('/phase0.html'))throw Error('Build Phase 0 before startup');
const studio=await createStudio({python});
const selfTest={};
if(args.get('--self-test')==='1') {
  for(const [name,run] of Object.entries({nodeWrite:()=>fs.writeFileSync(path.join(repository,'temp/phase0-MUST-NOT-EXIST'),'blocked'),sqliteAttach:()=>studio.catalog.db.exec("ATTACH DATABASE 'temp/phase0-MUST-NOT-EXIST.sqlite' AS forbidden"),sqlitePragma:()=>studio.catalog.db.exec('PRAGMA temp_store=FILE')})) {
    try{run();throw Error('GUARD_BYPASS');}catch(error){if(error.message==='GUARD_BYPASS')throw error;selfTest[name]={blocked:true,code:error.code||null};}
  }
}
const baselineAttempts=writeAttempts.length;
const server=http.createServer((req,res)=>{
  if(req.url?.startsWith('/api/'))return studio.handle(req,res);
  if(req.method!=='GET'||!/^127\.0\.0\.1:\d+$/.test(req.headers.host||'')){res.writeHead(403);return res.end();}
  let route;try{route=new URL(req.url,'http://127.0.0.1').pathname;}catch{res.writeHead(400);return res.end();}
  if(route==='/')route='/phase0.html';
  if(route!=='/phase0.html'&&!route.startsWith('/assets/')){res.writeHead(404);return res.end();}
  const bytes=assets.get(route);if(!bytes){res.writeHead(404);return res.end();}
  const type=route.endsWith('.html')?'text/html; charset=utf-8':route.endsWith('.js')?'text/javascript; charset=utf-8':route.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'"});res.end(bytes);
});
server.listen(port,'127.0.0.1',()=>{
 const ready={event:'ready',port:server.address().port,token:studio.session.token,tables:studio.catalog.tables,scan:studio.scan.report.result,binding:studio.bridge.binding,selfTest,baselineAttempts};
 if(process.send)process.send(ready);else {console.log(`Read-only Studio: http://127.0.0.1:${ready.port}`);console.log('X-Studio-Token (ephemeral; do not save): '+ready.token);}
});
process.on('message',message=>{
 if(message==='report')process.send?.({event:'report',writeAttempts:writeAttempts.slice(baselineAttempts),selfTest,tables:studio.catalog.tables,scan:studio.scan.report.result});
 if(message==='stop')server.close(()=>{studio.close();process.exit(0);});
});
