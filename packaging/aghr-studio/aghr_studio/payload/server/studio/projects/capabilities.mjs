import crypto from 'node:crypto';
const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
const fields=['skillId','source','function','permissions','inputs','outputs','instructionsPath','defaultTier','requiredApprovals','conflictsWith','alternatives','minimumStatus','requiredOnHosts','maxAgeDays'];
const tuple=q=>JSON.stringify([q.skillId,q.host,q.hostVersion,q.scope,q.contentHash]);
function qualification(task,history,skill,project){
 const q=task.qualification?.record;
 if(task.qualification?.status!=='QUALIFIED'||!q||q.host!=='aghr-local-process'||q.hostVersion!==process.version||q.scope!==project+'/**'||q.contentHash!==skill.instruction_hash||q.driverHash!==skill.entry_hash)return null;
 if(!history.some(r=>r.task_id===task.task_id&&r.operation==='qualify'&&r.status==='passed'&&r.view?.qualification?.status==='QUALIFIED'&&tuple(r.view.qualification.record)===tuple(q)))return null;
 return Object.fromEntries(Object.entries({skillId:q.skillId,host:q.host,hostVersion:q.hostVersion,scope:q.scope,contentHash:q.contentHash,status:'QUALIFIED',qualifiedAt:q.qualifiedAt.slice(0,10),evidence:q.evidence.map(e=>typeof e==='string'?e:'e4:execution/'+e.run_id+'#'+e.content_hash)}));
}
// Read projection only. Current private host state is required alongside its
// durable receipt. Imported historical JSON never constructs a live task.
export function currentCapabilities(record,studio,verifyProject){
 if(typeof verifyProject!=='function')throw Error('PROJECT_SOURCE_VERIFIER_REQUIRED');
 verifyProject();
 const inventory=studio.skills.inventory(),history=studio.store.skillRuns(),usages=new Map();
 const views=record.views.filter(v=>v.item.kind==='CAPABILITY').map(v=>{
  const capability=Object.fromEntries(fields.filter(k=>v.item[k]!==undefined).map(k=>[k,v.item[k]])),source=v.item.instructionsPath,expected=record.payload.files[source],driver=record.payload.files['procedures/sql-readonly/worker.py'];
  const found=inventory.local.skills.find(s=>s.id===capability.skillId&&s.available&&s.instruction_hash==='sha256:'+expected&&s.entry_hash==='sha256:'+driver),tasks=found?inventory.tasks.filter(t=>t.skill_id===capability.skillId):[];
  const proof={path:record.receipt_path,content_hash:record.receipt_hash,bytes:record.receipt_bytes},current=new Map();
  for(const task of tasks){const q=qualification(task,history,found,record.project.id);if(q){const old=current.get(tuple(q));if(!old||q.qualifiedAt>=old.qualifiedAt)current.set(tuple(q),q);}}
  const rows=tasks.map(t=>{
   const r=history.find(r=>r.run_id===t.last_run_id&&r.task_id===t.task_id),raw=r?JSON.stringify({studio_skill:r}):null,evidence=raw?[{path:'sqlite:verification_runs/'+r.run_id+'#summary_json',content_hash:hash(raw),bytes:Buffer.byteLength(raw)}]:[];
   const observation=(state,key)=>{const positive=['SELECTED','LOADED','HOST_SIGNAL','EXECUTED','EXECUTED_FAILED','VERIFIED'].includes(state);return positive&&evidence.length?{state,evidence}: {state:key==='host_signal'?'NOT_OBSERVABLE':'NOT_RUN',evidence:[],reason:r?'No current positive '+key+' evidence.':'Durable receipt not available.'};};
   return {task_id:t.task_id,skill_id:capability.skillId,...Object.fromEntries(['selected','loaded','host_signal','executed','verified'].map(k=>[k,observation(t.usage[k],k)]))};
  });usages.set(v.item.id,rows);
  return {item_id:v.item.id,capability,qualifications:[...current.values()],availability:found?[{state:'DISCOVERED',evidence:[proof],reason:'Current registered instruction and driver bytes match the accepted sandbox. Discovery grants no execution permission.'}]:[{state:'UNKNOWN',evidence:[],reason:'No current registered local instruction/driver tuple matching the accepted sandbox.'}],source_path:found?record.project.id+'/'+source:v.source_path,content_hash:found?found.instruction_hash:v.source_hash,issuer_trust:v.issuer_trust};
 });
 return {views,usages,matrix:{skills:views.map(c=>c.capability.skillId),hosts:inventory.hosts.filter(h=>typeof h.host_version==='string').map(h=>({host:h.host,host_version:h.host_version})),cells:views.flatMap(c=>c.qualifications)}};
}
