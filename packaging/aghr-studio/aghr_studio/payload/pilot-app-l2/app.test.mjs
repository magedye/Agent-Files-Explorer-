import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './app.mjs';
test('actual L2 service supplies project identity and refuses mutations',async()=>{
 const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const origin='http://127.0.0.1:'+server.address().port;
  assert.equal((await (await fetch(origin+'/health')).json()).project,'pilot-app-l2');
  assert.equal((await (await fetch(origin+'/tasks')).json()).tasks.length,2);
  assert.equal((await fetch(origin+'/tasks',{method:'POST'})).status,405);
 }finally{await new Promise(r=>server.close(r));}
});
