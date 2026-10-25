import fs from 'node:fs';
import path from 'node:path';
import {hash} from './bridge.mjs';
import {consumeAuthorization} from '../write-authorization.js';
import {StudioError} from '../auth.js';
export function createIntakeWatcher({root,service,authorize,store,audit}){
 let handle,closed=false,queue=Promise.resolve();const timers=new Map(),inflight=new Set(),errors=[],exclude=new Set(['node_modules','.git','__pycache__','.venv','.governance','backups','staging']);
 const safe=file=>{
  if(!root||!path.isAbsolute(root))throw Error('INBOX_ROOT_NOT_CONFIGURED');const absolute=path.resolve(root,file),relative=path.relative(root,absolute);
  if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(p=>exclude.has(p)||p.startsWith('.'))||!['.md','.yaml','.json'].includes(path.extname(relative).toLowerCase()))return null;
  let current=path.parse(absolute).root;for(const part of path.relative(current,absolute).split(path.sep)){current=path.join(current,part);const s=fs.lstatSync(current);if(s.isSymbolicLink())throw Error('INBOX_REPARSE_REJECTED');}
  return {absolute,relative:relative.split(path.sep).join('/')};
 };
 const receive=async file=>{
  const p=safe(file);if(!p)return;const st=fs.lstatSync(p.absolute);if(!st.isFile()||st.nlink!==1||st.size>131072||!st.size)throw Error('INBOX_SIZE_OR_TYPE_REJECTED');
  const fd=fs.openSync(p.absolute,'r');let raw;try{const start=fs.fstatSync(fd);if(start.ino!==st.ino||start.dev!==st.dev)throw Error('INBOX_CHANGED');const b=Buffer.alloc(131073),n=fs.readSync(fd,b,0,b.length,0),after=fs.fstatSync(fd);if(n>131072||n!==after.size||after.mtimeMs!==start.mtimeMs)throw Error('INBOX_CHANGED');raw=b.subarray(0,n);}finally{fs.closeSync(fd);}
  const source_hash=hash(raw);if(store.phase4Packages().some(c=>c.phase4.lane==='intake'&&c.phase4.body.source_hash===source_hash))return;
  const data={title:'INBOX '+p.relative,path:p.relative,content:raw.toString('utf8'),raw_base64:raw.toString('base64'),source_hash,bytes:raw.length};
  const {receipt,scope}=authorize(hash(JSON.stringify(data)));return service.ingest(receipt,scope,data);
 };
 const schedule=file=>{if(closed||typeof file!=='string'||timers.size>=128||inflight.size>=128)return;clearTimeout(timers.get(file));timers.set(file,setTimeout(()=>{timers.delete(file);const task=queue.then(()=>receive(file)).catch(e=>{errors.push({file,reason:e.message,at:new Date().toISOString()});if(errors.length>50)errors.shift();try{audit({file,reason:e.message});}catch{errors.push({reason:'AUDIT_UNAVAILABLE'});}}).finally(()=>inflight.delete(task));queue=task;inflight.add(task);},500));};
 return {binding:()=>hash(JSON.stringify({root:root??null,debounce_ms:500,extensions:['.md','.yaml','.json']})),status:()=>({configured:!!root,running:!!handle,debounce_ms:500,mode:'DRAFTS_ONLY',existing_files_scanned:false,errors:[...errors]}),
  start(receipt,scope){if(handle)throw new StudioError(409,'CONFLICT','Watcher already running.');if(!root||!path.isAbsolute(root)||!fs.statSync(root).isDirectory()||fs.lstatSync(root).isSymbolicLink())throw new StudioError(422,'VALIDATION_FAILED','Register a safe absolute INBOX root at startup.');consumeAuthorization(receipt,scope);store.appendAudit(receipt,{event_type:scope.action,resource_type:'watcher',payload:{result:'STARTED',root,debounce_ms:500,mode:'DRAFTS_ONLY'}});handle=fs.watch(root,{recursive:true},(_,file)=>schedule(file?.toString()));},
  close(){closed=true;handle?.close();handle=null;for(const t of timers.values())clearTimeout(t);timers.clear();if(inflight.size)return Promise.allSettled([...inflight]);},
 };
}
