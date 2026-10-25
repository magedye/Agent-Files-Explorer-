import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawnSync} from 'node:child_process';
import {createWriteAuthority,consumeAuthorization} from '../server/studio/write-authorization.js';
const scope={workspace_id:'w1',target_project:'project-a',action:'adoption.apply',resource_id:'CP-1',proposal_version_hash:'sha256:'+'a'.repeat(64)};
function fixture(){let now=Date.now();const decisions=[],a=createWriteAuthority({clock:()=>now,onDecision:e=>decisions.push(e)}),owner=a.createPrincipal({actor:'local-owner',role:'governance-owner',installationOwnerVerified:true}),developer=a.createPrincipal({actor:'developer',role:'developer'});const grant=(s=scope,p=owner)=>a.issueGrant({issuer:owner.principal,principal:p.principal,scope:s,expiresAt:now+1000});return {a,owner,developer,grant,decisions,advance:()=>{now+=2000;}};}
test('T13 server capabilities bind actor/project/action/resource/hash; labels and clones grant nothing',()=>{
 const {a,owner,developer,grant}=fixture(),token=grant();
 for(const [key,value]of Object.entries({workspace_id:'w2',target_project:'project-b',action:'cp.create',resource_id:'CP-2',proposal_version_hash:'sha256:'+'b'.repeat(64)}))assert.throws(()=>a.authorize(owner.principal,{...scope,[key]:value},token),/grant/);
 for(const fake of ['AUTHORIZED_BY_PROJECT_OWNER','OWNER_T12_OVERRIDE',{profile:'T12_OWNER_APPROVED_MOCK'},{}])assert.throws(()=>consumeAuthorization(fake,scope));
 assert.throws(()=>a.authorize(developer.principal,scope,token));assert.throws(()=>a.authorize({},scope,token));
 const receipt=a.authorize(owner.principal,scope,token);assert.throws(()=>consumeAuthorization({...receipt},scope));
 const details=consumeAuthorization(receipt,scope);assert.equal(details.server_resolved_role,'governance-owner');assert.equal(details.authenticated_actor,'local-owner');assert.throws(()=>consumeAuthorization(receipt,scope));assert.throws(()=>a.authorize(owner.principal,scope,token));
});
test('T13 expiry and revocation are rechecked at the effect; developer cannot issue grants',()=>{
 for(const expire of [true,false]){const f=fixture(),token=f.grant(),receipt=f.a.authorize(f.owner.principal,scope,token);expire?f.advance():f.a.revoke({issuer:f.owner.principal,token});assert.throws(()=>consumeAuthorization(receipt,scope));assert.equal(f.decisions.at(-1).result,'DENY');}
 const f=fixture();assert.throws(()=>f.a.issueGrant({issuer:f.developer.principal,principal:f.developer.principal,scope,expiresAt:Date.now()+500}));
 assert.throws(()=>f.a.createPrincipal({actor:'OWNER_T12_OVERRIDE',role:'governance-owner',installationOwnerVerified:true}));
 assert.throws(()=>f.a.createPrincipal({actor:'owner',role:'governance-owner',profile:'T12_OWNER_APPROVED_MOCK'}));
});
test('T13 actual HTTP checks server identity, denies role headers and scope-mismatched tokens',async()=>{
 const f=fixture();const server=http.createServer((req,res)=>{try{const p=f.a.authenticate(req),r=f.a.authorize(p,scope,req.headers['x-write-grant']);const result=consumeAuthorization(r,scope);res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(result));}catch(e){res.writeHead(e.status||403);res.end('denied');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/mutation`;
 try{
  const request=(headers={})=>fetch(url,{method:'POST',headers,body:JSON.stringify({role:'governance-owner',approvedBy:'OWNER_T12_OVERRIDE'})});
  assert.equal((await request()).status,403);
  assert.equal((await request({'x-studio-token':f.developer.token,'x-write-grant':f.grant()})).status,403);
  assert.equal((await request({'x-studio-token':f.owner.token,'x-studio-role':'governance-owner','x-write-grant':f.grant()})).status,400);
  const result=await request({'x-studio-token':f.owner.token,'x-write-grant':f.grant()});assert.equal(result.status,200);assert.equal((await result.json()).authenticated_actor,'local-owner');
 }finally{await new Promise(r=>server.close(r));}
});

test('T13 importing backend and refusing legacy writes keeps the zero-write profile',()=>{
 const script=`await import('./server/studio/zero-write.js'); const {handleApiRequest}=await import('./server/api.js'); await import('./server/studio/db/persistent.js');let status;await handleApiRequest({url:'/api/governed-apply',method:'POST',headers:{},on(){throw Error('body read');}},{set statusCode(v){status=v;},setHeader(){},end(){}});const {writeAttempts}=await import('./server/studio/zero-write.js');if(status!==403||writeAttempts.length)throw Error('write boundary violated');console.log('ZERO_WRITE_API_IMPORT_PASS');`;
 const run=spawnSync(process.execPath,['--permission','--allow-fs-read=*','--input-type=module','-e',script],{cwd:process.cwd(),encoding:'utf8',windowsHide:true,timeout:15000});
 assert.equal(run.status,0,run.stderr);assert.match(run.stdout,/ZERO_WRITE_API_IMPORT_PASS/);
});
