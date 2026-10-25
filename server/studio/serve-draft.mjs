import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import readline from 'node:readline';
import {createDraftStudio} from './draft-runtime.js';
import {repository} from './aghr/cli-bridge.js';
import {createJobRunner,resourceProfiles} from './aghr/job-runner.js';
import {registeredProject} from './phase5/project.mjs';

const args=new Map(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');if(i<0)throw Error('Use --name=value');return [arg.slice(0,i),arg.slice(i+1)];}));
if([...args.keys()].some(k=>!['--python','--port','--storage-root','--evidence-project','--skill-config','--phase4-config','--registered-project'].includes(k)))throw Error('Unknown Draft startup option');
const python=args.get('--python')||process.env.AGHR_STUDIO_PYTHON;
const port=Number(args.get('--port')||5182);if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid port');
// Bootstrap is an explicit local operator action. No HTTP identity/role/grant
// minting or startup flag can impersonate another actor.
const actor=os.userInfo().username;
const storageRoot=args.get('--storage-root')||path.join(repository,'.governance/studio-drafts');
if(!args.has('--storage-root')){
 const parent=path.dirname(storageRoot);if(fs.lstatSync(parent,{throwIfNoEntry:false})?.isSymbolicLink())throw Error('STORAGE_REPARSE_POINT');
 fs.mkdirSync(storageRoot,{recursive:true});
}
// Construction blocks missing resource adapters; real eval/qualify commands
// remain unavailable in E2 and cannot be requested from this Draft API.
createJobRunner({python});
const assets=new Map(),dist=path.join(repository,'dist');
function preload(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Static reparse point');if(e.isDirectory())preload(p);else assets.set('/'+path.relative(dist,p).split(path.sep).join('/'),fs.readFileSync(p));}}
preload(dist);if(!assets.has('/draft.html'))throw Error('Build Draft Studio before startup');
let e4Config;
if(args.has('--skill-config')){
 const selected=args.get('--skill-config');if(!path.isAbsolute(selected)||fs.lstatSync(selected).isSymbolicLink()||fs.statSync(selected).size>65536)throw Error('SKILL_CONFIG_UNSAFE');
 e4Config=JSON.parse(fs.readFileSync(selected,'utf8'));
 if(!e4Config||!Array.isArray(e4Config.skills)||!Array.isArray(e4Config.permissions)||Object.keys(e4Config).some(k=>!['skills','permissions','scope','hostSignals'].includes(k)))throw Error('SKILL_CONFIG_INVALID');
}
let phase4Options={};if(args.has('--phase4-config')){const p=args.get('--phase4-config');if(!path.isAbsolute(p)||fs.lstatSync(p).isSymbolicLink()||fs.statSync(p).size>65536)throw Error('PHASE4_CONFIG_UNSAFE');phase4Options=JSON.parse(fs.readFileSync(p,'utf8'));if(Object.keys(phase4Options).some(k=>!['intakeRoot','measurementSkillId','metaSkillId','requiredBehavioralEvals'].includes(k)))throw Error('PHASE4_CONFIG_INVALID');}
let project=null;if(args.has('--registered-project')){if(args.get('--registered-project')!=='agent-files-explorer'||e4Config||Object.keys(phase4Options).length||args.has('--evidence-project'))throw Error('REGISTERED_PROJECT_CONFIGURATION_CONFLICT');const registered=registeredProject();project=registered.project;e4Config=registered.e4Config;phase4Options=registered.phase4Options;}
const studio=await createDraftStudio({python,storageRoot,actor,evidenceProjectRoot:project?.root||args.get('--evidence-project')||null,e4Config,phase4Options,project});
const server=http.createServer((req,res)=>{
 if(req.url?.startsWith('/api/'))return studio.handle(req,res);
 if(req.method!=='GET'||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!/^127\.0\.0\.1:\d+$/.test(req.headers.host||'')){res.writeHead(403);return res.end();}
 let route;try{route=new URL(req.url,'http://127.0.0.1').pathname;}catch{res.writeHead(400);return res.end();}
 if(route==='/')route='/draft.html';if(route!=='/draft.html'&&!route.startsWith('/assets/')){res.writeHead(404);return res.end();}
 const bytes=assets.get(route);if(!bytes){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':route.endsWith('.html')?'text/html; charset=utf-8':route.endsWith('.js')?'text/javascript; charset=utf-8':route.endsWith('.css')?'text/css; charset=utf-8':'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'"});res.end(bytes);
});
let closing=false;
function stop(){if(closing)return;closing=true;server.close(async()=>{await studio.close();process.exit(0);});}
server.on('error',error=>{studio.close();console.error(error.code);process.exit(1);});
server.listen(port,'127.0.0.1',()=>{
 const ready={event:'ready',port:server.address().port,token:studio.session.token,storage:studio.store.file,tables:studio.store.tables.length,actor,mode:'DRAFT',resourceProfiles};
 if(process.send)process.send(ready);else{console.log(`Draft Studio: http://127.0.0.1:${ready.port}`);console.log('X-Studio-Token (ephemeral; do not save): '+ready.token);console.log('Operator commands: list | attest <validate-intent-id> | approve <intent-id> | revoke <intent-id> | quit');}
});
const control=async(command,id)=>{
 if(command==='attest')return studio.attestSource(id);
 if(command==='approve')return studio.approveIntent(id);
 if(command==='revoke'){studio.revokeIntent(id);return {revoked:id};}
 if(command==='list')return [...studio.intents].map(([id,i])=>({id,title:i.prepared.title,scope:i.scope,expires_at:new Date(i.expires).toISOString()}));
 if(command==='quit'){stop();return {stopping:true};}
 throw Error('Unknown operator command');
};
readline.createInterface({input:process.stdin,terminal:false}).on('line',async line=>{try{const [command,id]=line.trim().split(/\s+/);console.log(JSON.stringify(await control(command,id)));}catch(error){console.error(error.message);}});
// IPC belongs to the parent operator/test harness, never the HTTP client.
process.on('message',async message=>{try{if(message==='stop')return stop();if(message?.command){const data=await control(message.command,message.id);process.send?.({event:'control',request_id:message.request_id,data});}}catch(error){process.send?.({event:'control',request_id:message.request_id,error:error.message});}});
process.on('SIGINT',stop);process.on('SIGTERM',stop);
