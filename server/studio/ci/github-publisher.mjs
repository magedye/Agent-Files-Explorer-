import fs from 'node:fs';
import crypto from 'node:crypto';
import {authenticateGithub,boundedJson,ciDetails,consumeCi} from './identity.mjs';
import {assessSubmission,makeState,mergeBinding} from './assessment.mjs';
const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
const artifactPattern=/^\.aghr\/(?:runtime_evidence\/[A-Za-z0-9][\w.-]{0,127}\.jsonl|ci-submissions\/[A-Za-z0-9][\w.-]{0,127}\.json)$/;
export async function githubApi(repository,token,endpoint,method='GET',body){
 if(!/^[\w.-]+\/[\w.-]+$/.test(repository)||endpoint!==''&&!endpoint.startsWith('/')||endpoint.includes('..')||endpoint.includes('://'))throw Error('CI_API_PATH_REJECTED');
 return boundedJson('https://api.github.com/repos/'+repository+endpoint,{method,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'aghr-ci-publisher',...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})},24*1024**2);
}
export async function readGithubFile(api,name,sha,maxBytes=16*1024**2){
 if(!artifactPattern.test(name)&&name!=='.aghr/state.json')throw Error('CI_SOURCE_PATH_REJECTED');
 const data=await api('/contents/'+name.split('/').map(encodeURIComponent).join('/')+'?ref='+sha);
 if(data.type!=='file'||data.encoding!=='base64'||!Number.isInteger(data.size)||data.size>maxBytes||typeof data.content!=='string'||!/^[a-f0-9]{40}$/.test(data.sha))throw Error('CI_BLOB_ENCODING_OR_SIZE_REJECTED');
 const bytes=Buffer.from(data.content,'base64');if(bytes.length!==data.size||crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex')!==data.sha)throw Error('CI_GIT_BLOB_MISMATCH');return bytes;
}
export async function collectPrEvidence({api,prNumber,commitSha}){
 const files=[];for(let page=1;page<=10;page++){
  const part=await api('/pulls/'+prNumber+'/files?per_page=100&page='+page);if(!Array.isArray(part))throw Error('CI_PR_FILE_LIST_INVALID');files.push(...part);if(part.length<100)break;if(page===10)throw Error('CI_PR_FILE_LIMIT');
 }
 const admitted=new Set(files.filter(x=>['added','modified'].includes(x.status)&&artifactPattern.test(x.filename)).map(x=>x.filename));
 const submissions=[...admitted].filter(x=>x.startsWith('.aghr/ci-submissions/')).sort();if(submissions.length!==1)throw Error('ONE_PR_SUBMISSION_REQUIRED');
 const submissionBytes=await readGithubFile(api,submissions[0],commitSha,1024**2),cache=new Map();
 const readSource=async name=>{if(!admitted.has(name))throw Error('EVIDENCE_NOT_IN_PR');if(!cache.has(name))cache.set(name,await readGithubFile(api,name,commitSha));return cache.get(name);};
 return {submissionBytes,readSource,submissionPath:submissions[0]};
}
export async function checkPullRequest({python,policy,prNumber,env=process.env}){
 if(!Number.isInteger(prNumber)||prNumber<1)throw Error('PR_NUMBER_REQUIRED');
 const api=(endpoint,...args)=>githubApi(policy.repository,env.GITHUB_TOKEN,endpoint,...args),pr=await api('/pulls/'+prNumber);
 if(pr.base?.repo?.full_name!==policy.repository||pr.base?.ref!==policy.branch||!/^[a-f0-9]{40}$/.test(pr.head?.sha))throw Error('PR_TARGET_MISMATCH');
 const originals=await collectPrEvidence({api,prNumber,commitSha:pr.head.sha});
 const result=await assessSubmission({python,...originals});
 return {...result,mode:'PR_CHECK_ONLY',state_written:false,published:false};
}
export async function publishFromGithub({python,policy,env=process.env}){
 // Only this live path can obtain the process-owned permit. A JSON document,
 // env publisher label, test key, or Studio grant is never accepted instead.
 if(policy.state_path!=='.aghr/state.json')throw Error('CI_STATE_TARGET_REJECTED');
 const permit=await authenticateGithub(policy,env),{claims}=ciDetails(permit);
 const api=(endpoint,...args)=>githubApi(policy.repository,env.GITHUB_TOKEN,endpoint,...args);
 const repository=await api('');
 if(String(repository.id)!==String(policy.repository_id)||String(repository.owner?.id)!==String(policy.repository_owner_id)||repository.default_branch!==policy.branch)throw Error('CI_REPOSITORY_CHANGED');
 const branch=await api('/branches/'+encodeURIComponent(policy.branch));
 if(branch.commit?.sha!==claims.sha||policy.require_protected_ref&&branch.protected!==true)throw Error('CI_HEAD_OR_BRANCH_POLICY_CHANGED');
 const candidates=await api('/commits/'+claims.sha+'/pulls?per_page=100');
 const matched=[];for(const p of candidates){const pr=await api('/pulls/'+p.number);try{matched.push(mergeBinding({pr,repository:policy.repository,sha:claims.sha,branch:policy.branch}));}catch{/* Only exact merged PRs can authorize publication. */}}
 if(matched.length!==1)throw Error('MERGED_PR_REQUIRED');
 const merged=matched[0],originals=await collectPrEvidence({api,prNumber:merged.number,commitSha:claims.sha});
 const assessment=await assessSubmission({python,...originals});
 const state=await makeState({assessment,policy,python,publication:{ciRunRef:`https://github.com/${policy.repository}/actions/runs/${claims.run_id}/attempts/${claims.run_attempt}`,commitHash:claims.sha,publishedAt:new Date().toISOString()}});
 let previous=null;try{previous=await readGithubFile(api,'.aghr/state.json',claims.sha,1024**2);}catch(e){if(e.message!=='CI_PROVIDER_HTTP_404')throw e;}
 if(previous){const old=JSON.parse(previous);if(old.adoptionLevel!=='L0'||old.evalStatus==='PASS'||old.skillQualification?.length||old.exceptions?.length)throw Error('CI_EXISTING_STATE_REQUIRES_QUALIFIED_UPDATE_PROFILE');}
 const current=await api('/git/ref/heads/'+policy.branch);if(current.object?.sha!==claims.sha)throw Error('CI_HEAD_ADVANCED');
 const content=Buffer.from(JSON.stringify(state,null,2)+'\n');
 // No filesystem state write exists in Studio. Publication is a scoped Git
 // commit with a single permitted path and a non-force fast-forward update.
 consumeCi(permit);
 const base=await api('/git/commits/'+claims.sha),blob=await api('/git/blobs','POST',{content:content.toString('base64'),encoding:'base64'});
 const tree=await api('/git/trees','POST',{base_tree:base.tree.sha,tree:[{path:'.aghr/state.json',mode:'100644',type:'blob',sha:blob.sha}]});
 const commit=await api('/git/commits','POST',{message:'AGHR: publish checked L0 state after PR #'+merged.number,tree:tree.sha,parents:[claims.sha]});
 if(claims.exp<=Date.now()/1000)throw Error('CI_IDENTITY_EXPIRED_BEFORE_EFFECT');
 const updated=await api('/git/refs/heads/'+policy.branch,'PATCH',{sha:commit.sha,force:false});
 if(updated.object?.sha!==commit.sha)throw Error('CI_PUBLICATION_NOT_CONFIRMED');
 return {profile:'aghr-ci-publication.1',status:'PUBLISHED_L0_NOT_QUALIFIED',commit_sha:commit.sha,source_merge_sha:claims.sha,pr:merged.number,state_path:'.aghr/state.json',state_hash:hash(content),assessment,qualification:'NOT_RUN',native_waived:false};
}
// No public local-write or permit-issuing test hook is exported.
