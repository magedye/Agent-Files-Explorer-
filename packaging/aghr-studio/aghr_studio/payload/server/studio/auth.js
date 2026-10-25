import crypto from 'node:crypto';

export class StudioError extends Error {
  constructor(status, code, message) {super(message);this.status=status;this.code=code;}
}
export function createSession({actor='local-operator',ttlMs=12*60*60*1000}={}) {
  const token=crypto.randomBytes(32).toString('hex'), expires=Date.now()+ttlMs;
  return {
    token,
    authenticate(req) {
      const peer=req.socket.remoteAddress;
      if(!['127.0.0.1','::ffff:127.0.0.1'].includes(peer))throw new StudioError(403,'FORBIDDEN','Loopback only.');
      if(req.headers.origin && req.headers.origin!==`http://${req.headers.host}`)throw new StudioError(403,'FORBIDDEN','Foreign origin.');
      if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host||''))throw new StudioError(403,'FORBIDDEN','Invalid local host.');
      const presented=req.headers['x-studio-token'];
      if(Date.now()>=expires||typeof presented!=='string'||!/^\w{64}$/.test(presented)||!crypto.timingSafeEqual(Buffer.from(presented),Buffer.from(token)))throw new StudioError(401,'UNAUTHENTICATED','Session credential required or expired.');
      if(['x-studio-role','x-studio-actor','x-role','x-actor'].some(h=>req.headers[h]))throw new StudioError(400,'INVALID_REQUEST','Client identity claims are not accepted.');
      return {authenticated_actor:actor,server_resolved_role:'developer',action:'read',workspace_id:'rc3-local',target_project:null,resource_id:null,proposal_version_hash:null,installation_owner_verified:false};
    },
  };
}
