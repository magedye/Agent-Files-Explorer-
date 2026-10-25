// Cryptographic test vectors below are not GitHub-issued workload identities.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {verifyGithubJwt,authenticateGithub,ciDetails,consumeCi} from '../server/studio/ci/identity.mjs';
import {compareReports,readSubmission,mergeBinding,assessSubmission,makeState} from '../server/studio/ci/assessment.mjs';
import {createBridge} from '../server/studio/aghr/cli-bridge.js';
import {createJobRunner} from '../server/studio/aghr/job-runner.js';
import {encodeJsonl} from '../tools/contracts/evidence_jsonl.mjs';
import {publishFromGithub} from '../server/studio/ci/github-publisher.mjs';
const policy=JSON.parse(fs.readFileSync('.github/aghr-publisher-policy.json')),python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const hash=b=>'sha256:'+crypto.createHash('sha256').update(b).digest('hex');
test('T24 RSA test vectors verify signatures/scope and never create production CI permits',async()=>{
 const now=Math.floor(Date.now()/1000),pair=crypto.generateKeyPairSync('rsa',{modulusLength:2048}),jwk={...pair.publicKey.export({format:'jwk'}),kid:'TEST_VECTOR_NOT_GITHUB',use:'sig',alg:'RS256'};
 const claims={iss:'https://token.actions.githubusercontent.com',aud:policy.audience,sub:`repo:${policy.repository}:ref:refs/heads/main`,repository:policy.repository,repository_id:String(policy.repository_id),repository_owner_id:String(policy.repository_owner_id),ref:'refs/heads/main',event_name:'push',workflow_ref:policy.repository+'/'+policy.workflow+'@refs/heads/main',workflow_sha:'a'.repeat(40),sha:'a'.repeat(40),runner_environment:'github-hosted',run_id:'123',run_attempt:'1',iat:now,nbf:now-1,exp:now+300};
 const sign=(payload,header={alg:'RS256',typ:'JWT',kid:jwk.kid})=>{const h=Buffer.from(JSON.stringify(header)).toString('base64url'),p=Buffer.from(JSON.stringify(payload)).toString('base64url'),data=h+'.'+p;return data+'.'+crypto.sign('RSA-SHA256',Buffer.from(data),pair.privateKey).toString('base64url');};
 const value=verifyGithubJwt(sign(claims),{keys:[jwk]},policy,now);assert.equal(value.repository_id,String(policy.repository_id));assert.throws(()=>ciDetails(value),/UNTRUSTED_CI_PUBLISHER/);assert.throws(()=>consumeCi({publisher:'ci',...value}),/UNTRUSTED_CI_PUBLISHER/);
 const mutations=[{iss:'https://attacker.invalid'},{aud:'other'},{repository_id:'1'},{repository_owner_id:'2'},{event_name:'pull_request'},{ref:'refs/pull/1/merge'},{workflow_ref:'other/workflow'},{sha:'b'.repeat(40)},{exp:now-1},{nbf:now+60},{runner_environment:'self-hosted'}];
 for(const m of mutations)assert.throws(()=>verifyGithubJwt(sign({...claims,...m}),{keys:[jwk]},policy,now));
 assert.throws(()=>verifyGithubJwt(sign(claims,{alg:'none',typ:'JWT',kid:jwk.kid}),{keys:[jwk]},policy,now),/ALGORITHM/);
 const token=sign(claims),parts=token.split('.');parts[2]=Buffer.alloc(256,1).toString('base64url');assert.throws(()=>verifyGithubJwt(parts.join('.'),{keys:[jwk]},policy,now),/SIGNATURE/);
 const [owner,name]=policy.repository.split('/');assert.equal(verifyGithubJwt(sign({...claims,sub:`repo:${owner}@${policy.repository_owner_id}/${name}@${policy.repository_id}:ref:refs/heads/main`}),{keys:[jwk]},policy,now).sha,claims.sha);
 await assert.rejects(authenticateGithub(policy,{}),/CI_OIDC_UNAVAILABLE/);
 await assert.rejects(authenticateGithub(policy,{GITHUB_ACTIONS:'true',ACTIONS_ID_TOKEN_REQUEST_URL:'https://attacker.invalid/',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'TEST_ONLY'}),/CI_OIDC_ORIGIN_REJECTED/);
});
test('T24 requires exact merged PR, rejects env labels and local publisher without writing state',async()=>{
 const sha='a'.repeat(40),pr={number:1,merged:true,state:'closed',merge_commit_sha:sha,merged_at:'2026-10-01T00:00:00Z',base:{ref:'main',repo:{full_name:policy.repository}}};
 assert.equal(mergeBinding({pr,repository:policy.repository,sha,branch:'main'}).number,1);
 for(const p of [{...pr,merged:false},{...pr,state:'open'},{...pr,merge_commit_sha:'b'.repeat(40)},{...pr,base:{ref:'other'}}])assert.throws(()=>mergeBinding({pr:p,repository:policy.repository,sha,branch:'main'}),/MERGED_PR_REQUIRED/);
 await assert.rejects(publishFromGithub({python,policy,env:{publisher:'ci',GITHUB_SHA:sha}}),/CI_OIDC_UNAVAILABLE/);
 assert.equal(fs.existsSync('.aghr/state.json'),false);
});
test('T24 actual pinned strict CLI + original PR bytes compare, reject divergence/forged qualification and build truthful L0 state',async()=>{
 const bridge=createBridge({python,jobRunner:createJobRunner({python})}),local=await bridge.run('validate'),at=new Date().toISOString();
 const bytes=encodeJsonl([{task_id:'ci-source',session:{agent:'DECLARED_SOURCE_NOT_AUTHENTICATED',agent_version:'1',host_os:'windows',started_at:at},events:[{at,type:'skill.verified',source:'ci',skill_id:'fake-native',task_criteria:'producer claim only',verifier_output:{claimed:true},result:'PASS'}],submit_to_ci:true}]);
 const submission={profile:'aghr-ci-submission.1',evidence:[{path:'.aghr/runtime_evidence/ci-source.jsonl',content_hash:hash(bytes),bytes:bytes.length}],local_report:local.report},raw=Buffer.from(JSON.stringify(submission));
 const result=await assessSubmission({python,submissionBytes:raw,readSource:async()=>bytes});assert.equal(result.comparison.status,'MATCH');assert.equal(result.eval_status,'NOT_RUN');assert.deepEqual(result.skill_qualification,[]);assert.equal(result.source_trust,'UNAUTHENTICATED_RUNTIME_CLAIMS');
 assert.equal(result.inspections[0].data.producer_authentication,'NOT_ESTABLISHED');assert.equal(result.inspections[0].data.execution_status,'NOT_OBSERVABLE');assert.equal(result.inspections[0].resource_receipt.active_processes_after,0);
 const simulated=Buffer.from(bytes.toString('utf8').replace('producer claim only','T19_MOCK_EVAL_EVIDENCE'));
 await assert.rejects(assessSubmission({python,submissionBytes:Buffer.from(JSON.stringify({...submission,evidence:[{...submission.evidence[0],content_hash:hash(simulated),bytes:simulated.length}]})),readSource:async()=>simulated}),/SIMULATED_EVIDENCE_REJECTED/);
 assert.throws(()=>compareReports(local.report,{...local.report,result:'INVALID',exit_code:1}),/DIVERGENCE/);
 for(const key of ['candidate_hash','inputs_hash','config_hash'])assert.throws(()=>compareReports(local.report,{...local.report,inputs:{...local.report.inputs,[key]:'f'.repeat(64)}}),/DIVERGENCE/);
 await assert.rejects(assessSubmission({python,submissionBytes:raw,readSource:async()=>Buffer.from('tampered')}),/HASH_OR_SIZE/);
 for(const path of ['../outside','.aghr/runtime_evidence/../../state.json','C:/Windows/test.jsonl'])assert.throws(()=>readSubmission(Buffer.from(JSON.stringify({...submission,evidence:[{...submission.evidence[0],path}]}))),/MANIFEST/);
 const state=await makeState({assessment:result,policy,python,publication:{ciRunRef:'TEST_VECTOR_ONLY_NOT_PUBLISHED',commitHash:'a'.repeat(40),publishedAt:at}});assert.equal(state.evalStatus,'NOT_RUN');assert.deepEqual(state.skillQualification,[]);assert.equal(state.adoptionLevel,'L0');assert.equal(fs.existsSync('.aghr/state.json'),false);
 if(process.env.AGHR_PHASE3_OUT)fs.writeFileSync(path.join(process.env.AGHR_PHASE3_OUT,'CI_ASSESSMENT_ACCEPTANCE.json'),JSON.stringify({status:'PASS_FOR_LOCAL_ENGINE_AND_GUARDS',result,state_preview_only:state,publication:'NOT_RUN',signature_test_vectors:'NOT_GITHUB_IDENTITIES',state_written:false},null,2),{flag:'wx'});
});
