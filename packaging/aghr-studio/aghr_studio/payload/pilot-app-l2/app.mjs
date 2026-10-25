// A running, dependency-free sandbox service. No disk writes from requests.
import http from 'node:http';
export function createApp(){
 const tasks=[{id:1,title:'Review scoped instructions',done:false},{id:2,title:'Verify CI custody',done:true}];
 return http.createServer((req,res)=>{res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET'){res.writeHead(405);res.end(JSON.stringify({error:'read-only'}));return;}
  if(req.url==='/health')res.end(JSON.stringify({project:'pilot-app-l2',status:'ok'}));
  else if(req.url==='/tasks')res.end(JSON.stringify({project:'pilot-app-l2',tasks}));
  else{res.writeHead(404);res.end(JSON.stringify({project:'pilot-app-l2',error:'not found'}));}
 });
}
