import crypto from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {StudioError} from './auth.js';

export function createVerificationStream({authority,verification,workspaceId,clock=Date.now}){
 const tickets=new Map(),connections=new Set();
 const server=new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:false,handleProtocols:protocols=>protocols.has('aghr.stream.v1')?'aghr.stream.v1':false});
 const prefix=`/api/v1/workspaces/${workspaceId}/verify/runs/`;
 function ticket(req,runId){
  const principal=authority.authenticate(req);verification.get(runId);
  for(const [key,value]of tickets)if(clock()>=value.expires)tickets.delete(key);
  if(tickets.size>=128)throw new StudioError(429,'RATE_LIMITED','Too many stream tickets.');
  const value=crypto.randomBytes(32).toString('hex');tickets.set(value,{runId,principal,expires:clock()+30000,credential:req.headers['x-studio-token'],host:req.headers.host});
  return {ticket:value,expires_at:new Date(clock()+30000).toISOString(),protocol:'aghr.stream.v1'};
 }
 function attach(http){
  http.on('upgrade',(req,socket,head)=>{
   const deny=()=>{socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');};
   try{
    const url=new URL(req.url,'http://127.0.0.1'),match=url.pathname.startsWith(prefix)&&url.pathname.slice(prefix.length).match(/^(VR-[\w-]+)\/stream$/);
    if(!match||url.search||req.headers.origin!==`http://${req.headers.host}`||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return deny();
    const protocols=(req.headers['sec-websocket-protocol']||'').split(',').map(p=>p.trim());
    if(protocols.length!==2||protocols[0]!=='aghr.stream.v1'||!/^ticket\.[a-f0-9]{64}$/.test(protocols[1]))return deny();
    const key=protocols[1].slice(7),entry=tickets.get(key);tickets.delete(key);
    if(!entry||entry.runId!==match[1]||clock()>=entry.expires||req.headers.host!==entry.host)return deny();
    const authenticated={...req,headers:{...req.headers,'x-studio-token':entry.credential},socket:req.socket};
    if(authority.authenticate(authenticated)!==entry.principal)return deny();
    server.handleUpgrade(req,socket,head,ws=>{
     connections.add(ws);let offset=0,closed=false;
     const finish=()=>{if(closed)return;closed=true;clearInterval(timer);connections.delete(ws);};
     const send=()=>{
      try{authority.authenticate(authenticated);if(ws.bufferedAmount>1024*1024)return ws.close(1009,'Slow consumer');
       const frames=verification.frames(match[1]);for(const frame of frames.slice(offset)){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(frame));}offset=frames.length;
       if(verification.get(match[1]).status!=='running'){clearInterval(timer);ws.close(1000,'Complete');}
      }catch{ws.close(1008,'Session or run unavailable');}
     };
     const timer=setInterval(send,100);ws.on('error',finish);ws.on('close',finish);ws.on('message',()=>ws.close(1008,'Read-only stream'));send();
    });
   }catch{return deny();}
  });
 }
 return {ticket,attach,close(){tickets.clear();for(const ws of connections)ws.terminate();server.close();}};
}
