import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {decodeJsonl} from '../../../tools/contracts/evidence_jsonl.mjs';
import {createSchemaReader} from '../schema-reader.js';
import {createBridge,sourceHash} from '../aghr/cli-bridge.js';
import {createJobRunner} from '../aghr/job-runner.js';
import {createE4Engine} from '../aghr/e4-bridge.js';
const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
export function compareReports(local,ci){
 const key=r=>JSON.stringify({protocol:r.protocol_version,command:r.command,engine:r.source?.content_hash,inputs:r.inputs,result:r.result,exit_code:r.exit_code,checks:r.checks,data:r.data,diagnostics:r.diagnostics});
 if(key(local)!==key(ci))throw Error('STUDIO_CI_DIVERGENCE');return {status:'MATCH',candidate_hash:'sha256:'+ci.inputs.candidate_hash,engine_hash:'sha256:'+sourceHash,inputs_hash:'sha256:'+ci.inputs.inputs_hash,config_hash:'sha256:'+ci.inputs.config_hash,meaning:'Exact report match; PR producer identity/skill execution not authenticated by matching JSON.'};
}
export function readSubmission(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length>1024**2)throw Error('SUBMISSION_SIZE_LIMIT');
 const r=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));
 if(!r||Object.keys(r).some(k=>!['profile','evidence','local_report'].includes(k))||r.profile!=='aghr-ci-submission.1'||!Array.isArray(r.evidence)||r.evidence.length<1||r.evidence.length>100||r.local_report?.command!=='validate'||r.local_report?.protocol_version!=='3'||r.local_report?.source?.content_hash!==sourceHash)throw Error('SUBMISSION_INVALID');
 const seen=new Set();for(const e of r.evidence){if(!e||Object.keys(e).sort().join(',')!=='bytes,content_hash,path'||!/^\.aghr\/runtime_evidence\/[A-Za-z0-9][\w.-]{0,127}\.jsonl$/.test(e.path)||!/^sha256:[a-f0-9]{64}$/.test(e.content_hash)||!Number.isInteger(e.bytes)||e.bytes<1||e.bytes>16*1024**2||seen.has(e.path))throw Error('EVIDENCE_MANIFEST_INVALID');seen.add(e.path);}
 return r;
}
export async function assessSubmission({python,submissionBytes,readSource}){
 const submission=readSubmission(submissionBytes),schema=createSchemaReader({python}),sources=[],claims=[],inspections=[];let total=0;
 for(const e of submission.evidence){
  const b=await readSource(e.path);total+=b.length;if(total>16*1024**2||b.length!==e.bytes||hash(b)!==e.content_hash)throw Error('EVIDENCE_HASH_OR_SIZE_MISMATCH');
  const task=e.path.split('/').at(-1).slice(0,-6),decoded=decodeJsonl(b,{expectedTaskId:task});
  if(decoded.syntax_status!=='PASS')throw Error('EVIDENCE_SERIALIZATION_REJECTED');
  const valid=await schema('evidence.schema.json',null,decoded.records.map(x=>x.record));if(!valid.valid)throw Error('EVIDENCE_SCHEMA_REJECTED');
  // CI inspects an exact-byte scratch copy through immutable E4. Neither the
  // PR's claims nor the Node publisher can manufacture execution trust.
  const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'aghr-ci-evidence-')),engine=createE4Engine({python});
  try{
   fs.writeFileSync(path.join(scratch,'original.jsonl'),b,{flag:'wx'});
   const result=await engine.inspectEvidence({root:scratch,path:'original.jsonl',task_id:task,session:decoded.records[0].record.session});
   if(result.data.artifact.content_hash!==e.content_hash||result.data.execution_status!=='NOT_OBSERVABLE'||result.data.producer_authentication!=='NOT_ESTABLISHED')throw Error('CI_EVIDENCE_TRUST_MISMATCH');
   inspections.push({path:e.path,data:result.data,resource_receipt:result.receipt});
  }finally{engine.close();}
  for(const {record}of decoded.records)claims.push(...record.events);
  sources.push({...e});
 }
 const bridge=createBridge({python,jobRunner:createJobRunner({python})}),run=await bridge.run('validate');
 const comparison=compareReports(submission.local_report,run.report);
 if(run.exitCode!==0)throw Error('CI_STRICT_VALIDATION_REJECTED');
 // Imported PASS/VERIFIED/source:host cannot create a live E4 proof. CI records
 // only L0/NOT_RUN until a separately qualified native execution profile exists.
 return {profile:'aghr-ci-assessment.1',comparison,sources,inspections,report:run.report,resource_receipt:run.resourceReceipt,claim_count:claims.length,source_trust:'UNAUTHENTICATED_RUNTIME_CLAIMS',eval_status:'NOT_RUN',skill_qualification:[],native_required:true,native_waived:false};
}
export async function makeState({assessment,publication,policy,python}){
 if(assessment?.profile!=='aghr-ci-assessment.1'||assessment.comparison?.status!=='MATCH'||assessment.report?.exit_code!==0||assessment.eval_status!=='NOT_RUN'||assessment.skill_qualification.length!==0||policy.adoption_level!=='L0')throw Error('CI_ASSESSMENT_PROFILE_REJECTED');
 const state={schemaVersion:'1.2',aghrVersion:assessment.report.source.target_spec_version,adoptionLevel:'L0',domainLevels:{instructions:'L0',skills:'L0'},evalStatus:'NOT_RUN',skillQualification:[],exceptions:[],publication:{publisher:'ci',ciRunRef:publication.ciRunRef,commitHash:publication.commitHash,publishedAt:publication.publishedAt,sourceEvidence:assessment.sources}};
 const report=await createSchemaReader({python})('state.schema.json',null,[state]);if(!report.valid)throw Error('CI_STATE_SCHEMA_REJECTED');return state;
}
export function mergeBinding({pr,repository,sha,branch}){
 if(!pr||pr.merged!==true||pr.state!=='closed'||!Number.isInteger(pr.number)||pr.number<1||pr.merge_commit_sha!==sha||pr.base?.ref!==branch||pr.base?.repo?.full_name!==repository||!pr.merged_at||!Number.isFinite(Date.parse(pr.merged_at))||Date.parse(pr.merged_at)>Date.now())throw Error('MERGED_PR_REQUIRED');
 return {number:pr.number,merge_commit_sha:sha,merged_at:pr.merged_at};
}
