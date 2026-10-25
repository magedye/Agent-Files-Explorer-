import crypto from 'node:crypto';
import {createBridge} from '../aghr/cli-bridge.js';
import {createJobRunner} from '../aghr/job-runner.js';
import {StudioError} from '../auth.js';
const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
// Preparation is a Draft operation. It never creates a PR, rewrites evidence,
// grants a CI identity, or publishes state.
export function createSubmissionService({python,evidence,store}){
 let active=false,closing=false;
 const prepare=async task_id=>{
  const source=await evidence.detail(task_id);
  if(source.task.parse_status!=='VALID')throw new StudioError(422,'VALIDATION_FAILED','Valid original JSONL required.');
  return {task_id,source_hash:source.source_hash,bytes:source.source_bytes,path:source.source_file};
 };
 return {prepare,async run(receipt,expected,scope){
  if(active||closing)throw new StudioError(409,'CONFLICT','CI bundle preparation is unavailable.');
  const current=await prepare(expected.task_id);
  if(JSON.stringify(current)!==JSON.stringify(expected))throw new StudioError(412,'STALE_PROPOSAL','Original evidence changed after authorization.');
  const run_id='VR-'+crypto.randomUUID(),started=Date.now();
  const finish=store.beginSkillRun(receipt,{id:run_id,task_id:expected.task_id,inputs_hash:scope.proposal_version_hash,command:'validate',request:{operation:'ci_bundle'},at:new Date().toISOString()},scope);
  active=true;let result,error;
  try{
   const run=await createBridge({python,jobRunner:createJobRunner({python})}).run('validate');
   if(run.exitCode!==0)throw Error('LOCAL_STRICT_VALIDATION_REJECTED');
   const source=await evidence.detail(expected.task_id);
   if(source.source_hash!==expected.source_hash||source.task.parse_status!=='VALID')throw new StudioError(412,'STALE_PROPOSAL','Original evidence changed during validation.');
   const submission={profile:'aghr-ci-submission.1',evidence:[{path:source.source_file,content_hash:source.source_hash,bytes:source.source_bytes}],local_report:run.report};
   const manifest=Buffer.from(JSON.stringify(submission,null,2)+'\n');
   result={profile:'studio-ci-bundle.1',status:'PREPARED_NOT_SUBMITTED',run_id,files:[{path:source.source_file,content_hash:source.source_hash,bytes:source.source_bytes,base64:source.raw_source_base64},{path:'.aghr/ci-submissions/'+expected.task_id+'.json',content_hash:hash(manifest),bytes:manifest.length,base64:manifest.toString('base64')}],resource_receipt:run.resourceReceipt,submitted:false,published:false,source_written:false,state_written:false,qualification:'NOT_RUN'};
  }catch(e){error=e;}finally{active=false;}
  const raw=JSON.stringify({result,error:error?.message||null});
  finish({status:error?'failed':'passed',exit_code:error?3:0,finished_at:new Date().toISOString(),duration_ms:Date.now()-started,raw,view:{profile:'CI_BUNDLE_PREPARATION_ONLY',submitted:false,published:false,state_written:false}});
  if(error)throw error;return result;
 },close(){closing=true;if(active)return (async()=>{while(active)await new Promise(r=>setTimeout(r,50));})();}};
}
