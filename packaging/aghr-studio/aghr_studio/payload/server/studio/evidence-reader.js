import fs from 'node:fs';
import path from 'node:path';
import {decodeJsonl,EVIDENCE_LIMITS} from '../../tools/contracts/evidence_jsonl.mjs';
import {StudioError} from './auth.js';
const safeId=id=>typeof id==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id);
// Project root is registered by the trusted operator, never chosen in HTTP.
export function createEvidenceReader({projectRoot,schema}){
 if(projectRoot&&!path.isAbsolute(projectRoot))throw Error('EVIDENCE_ROOT_INVALID');
 const resolve=()=>{
  if(!projectRoot)return null;
  const root=path.resolve(projectRoot);let current=path.parse(root).root;
  for(const bit of path.relative(current,root).split(path.sep).concat(['.aghr','runtime_evidence'])){
   current=path.join(current,bit);const st=fs.lstatSync(current,{throwIfNoEntry:false});if(!st)return null;if(st.isSymbolicLink()||!st.isDirectory())throw new StudioError(422,'VALIDATION_FAILED','Evidence directory is unsafe.');
  }return current;
 };
 async function detail(id){
  if(!safeId(id))throw new StudioError(400,'INVALID_REQUEST','Invalid task identifier.');
  const root=resolve();if(!root)throw new StudioError(404,'NOT_FOUND','No runtime evidence source.');
  const name=id+'.jsonl',file=path.join(root,name),st=fs.lstatSync(file,{throwIfNoEntry:false});
  if(!st)throw new StudioError(404,'UNKNOWN_ID','Unknown task.');
  if(st.isSymbolicLink()||!st.isFile()||st.nlink!==1||st.size>EVIDENCE_LIMITS.maxBytes)throw new StudioError(422,'VALIDATION_FAILED','Evidence source exceeds limits or is unsafe.');
  const fd=fs.openSync(file,'r');let bytes;
  try{
   const opened=fs.fstatSync(fd);if(opened.ino!==st.ino||opened.dev!==st.dev)throw Error('EVIDENCE_CHANGED');
   // Bounded descriptor read, including a growing file. Never unbounded readFile.
   const buffer=Buffer.alloc(EVIDENCE_LIMITS.maxBytes+1),n=fs.readSync(fd,buffer,0,buffer.length,0);if(n>EVIDENCE_LIMITS.maxBytes)throw Error('EVIDENCE_SIZE_LIMIT');bytes=buffer.subarray(0,n);
   const after=fs.fstatSync(fd);if(after.size!==opened.size||after.mtimeMs!==opened.mtimeMs||n!==after.size)throw Error('EVIDENCE_CHANGED');
  }finally{fs.closeSync(fd);}
  const decoded=decodeJsonl(bytes,{expectedTaskId:id});
  const validation=decoded.syntax_status==='PASS'?await schema('evidence.schema.json',null,decoded.records.map(x=>x.record)):{valid:false,issues:[]};
  const valid=decoded.syntax_status==='PASS'&&validation.valid,records=valid?decoded.records:[];
  const events=records.map(({record,source_line})=>({task_id:id,source_file:'.aghr/runtime_evidence/'+name,source_line,source_hash:decoded.source_hash,event:record.events[0]}));
  const flags=new Set();if(!valid)flags.add('INVALID_EVIDENCE');
  for(const {event}of events){if(event.type==='skill.blocked'||event.type==='authorization.denied')flags.add('BLOCKED');if(event.outcome==='UNKNOWN_ID'||event.outcome==='DISCOVERY_UNAVAILABLE')flags.add(event.outcome);}
  const first=decoded.records[0]?.record;
  return {task:{task_id:id,agent:first?.session?.agent||'UNKNOWN',agent_version:first?.session?.agent_version||'UNKNOWN',event_count:events.length,attention_flags:[...flags],parse_status:valid?'VALID':decoded.syntax_status==='UNSUPPORTED_SERIALIZATION'?'UNSUPPORTED_SERIALIZATION':'INVALID'},source_file:'.aghr/runtime_evidence/'+name,source_hash:decoded.source_hash,raw_source_base64:bytes.toString('base64'),source_bytes:bytes.length,
   issues:[...decoded.issues,...validation.issues].map(x=>({code:x.code,message:x.message||x.code,severity:'error',...(x.line?{line:x.line}:{})})),events};
 }
 return {detail,async list(){const root=resolve();if(!root)return [];const names=fs.readdirSync(root).filter(n=>n.endsWith('.jsonl')&&safeId(n.slice(0,-6))).sort();if(names.length>500)throw new StudioError(413,'PAYLOAD_TOO_LARGE','At most 500 task sources per registered project.');const rows=[];for(const n of names)rows.push((await detail(n.slice(0,-6))).task);return rows;}};
}
