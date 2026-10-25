import crypto from 'node:crypto';
const issuer='https://token.actions.githubusercontent.com';
const permits=new WeakMap();
export function verifyGithubJwt(token,jwks,policy,now=Math.floor(Date.now()/1000)){
 if(typeof token!=='string'||token.length>32768)throw Error('CI_IDENTITY_REQUIRED');
 const parts=token.split('.');if(parts.length!==3||parts.some(x=>!/^[A-Za-z0-9_-]+$/.test(x)))throw Error('CI_TOKEN_INVALID');
 const header=JSON.parse(Buffer.from(parts[0],'base64url')),claims=JSON.parse(Buffer.from(parts[1],'base64url'));
 if(header.alg!=='RS256'||header.typ!=='JWT'||typeof header.kid!=='string'||header.jku||header.jwk||header.x5u||header.crit)throw Error('CI_TOKEN_ALGORITHM');
 const keys=jwks.keys?.filter(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256')&&(!k.use||k.use==='sig'));
 if(keys?.length!==1)throw Error('CI_SIGNING_KEY_UNKNOWN');
 const key=crypto.createPublicKey({key:keys[0],format:'jwk'});if(key.asymmetricKeyDetails.modulusLength<2048||!crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),key,Buffer.from(parts[2],'base64url')))throw Error('CI_SIGNATURE_INVALID');
 const [owner,name]=policy.repository.split('/'),context=policy.environment?'environment:'+policy.environment:'ref:refs/heads/'+policy.branch,subjects=[`repo:${policy.repository}:${context}`,`repo:${owner}@${policy.repository_owner_id}/${name}@${policy.repository_id}:${context}`];
 if(claims.iss!==issuer||claims.aud!==policy.audience||claims.repository!==policy.repository||String(claims.repository_id)!==String(policy.repository_id)||String(claims.repository_owner_id)!==String(policy.repository_owner_id)||claims.ref!=='refs/heads/'+policy.branch||claims.event_name!=='push'||claims.environment!==undefined&&claims.environment!==policy.environment||!subjects.includes(claims.sub)||claims.workflow_ref!==`${policy.repository}/${policy.workflow}@refs/heads/${policy.branch}`||claims.workflow_sha!==claims.sha||claims.runner_environment!=='github-hosted')throw Error('CI_IDENTITY_SCOPE_MISMATCH');
 if(!/^[a-f0-9]{40}$/.test(claims.sha)||!/^\d+$/.test(String(claims.run_id))||!/^\d+$/.test(String(claims.run_attempt))||!Number.isSafeInteger(claims.exp)||!Number.isSafeInteger(claims.iat)||!Number.isSafeInteger(claims.nbf)||claims.exp<=now||claims.nbf>now+30||claims.iat>now+30||now-claims.iat>600||claims.exp-claims.iat>3600)throw Error('CI_TOKEN_EXPIRED_OR_INVALID');
 return structuredClone(claims); // Cryptographic primitive only; this JSON is NOT a publication capability.
}
export async function boundedJson(url,options={},maxBytes=2*1024**2){
 const response=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('CI_PROVIDER_HTTP_'+response.status);
 const reader=response.body.getReader(),parts=[];let n=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>maxBytes)throw Error('CI_PROVIDER_BODY_LIMIT');parts.push(value);}}finally{await reader.cancel();}
 return JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(Buffer.concat(parts)));
}
export async function authenticateGithub(policy,env=process.env){
 if(env.GITHUB_ACTIONS!=='true'||!env.ACTIONS_ID_TOKEN_REQUEST_URL||!env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)throw Error('CI_OIDC_UNAVAILABLE');
 const request=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);
 if(request.protocol!=='https:'||request.port&&request.port!=='443'||request.username||request.password||!/(^|\.)actions\.githubusercontent\.com$/.test(request.hostname))throw Error('CI_OIDC_ORIGIN_REJECTED');
 request.searchParams.set('audience',policy.audience);
 const {value:token}=await boundedJson(request,{headers:{Authorization:'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}},65536);
 const discovery=await boundedJson(issuer+'/.well-known/openid-configuration',{},65536);
 if(discovery.issuer!==issuer||discovery.jwks_uri!==issuer+'/.well-known/jwks')throw Error('CI_JWKS_ORIGIN_REJECTED');
 const keys=await boundedJson(discovery.jwks_uri,{},262144),claims=verifyGithubJwt(token,keys,policy);
 if(env.GITHUB_REPOSITORY!==claims.repository||env.GITHUB_SHA!==claims.sha||env.GITHUB_RUN_ID!==String(claims.run_id)||env.GITHUB_RUN_ATTEMPT!==String(claims.run_attempt)||env.GITHUB_EVENT_NAME!=='push'||env.GITHUB_REF!==claims.ref)throw Error('CI_RUN_CONTEXT_MISMATCH');
 const permit=Object.freeze({});permits.set(permit,{claims,policy:structuredClone(policy),used:false});return permit;
}
export function ciDetails(permit){const value=permits.get(permit);if(!value||value.used||value.claims.exp<=Date.now()/1000)throw Error('UNTRUSTED_CI_PUBLISHER');return structuredClone(value);}
export function consumeCi(permit){const details=ciDetails(permit);permits.get(permit).used=true;return details;}
