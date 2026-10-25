// Read-only integration harness: canonical schema validation uses Python's
// generic JSON Schema library. It is not a second governing policy engine.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {spawnSync} from 'node:child_process';
import {createStudio} from '../server/studio/runtime.js';
import {loadDocuments,bundleSchema} from './contracts/schema_documents.mjs';
const python=path.resolve('temp/aghr-e1a-20261022-01/venv/Scripts/python.exe');
const docs=loadDocuments('docs/contracts/aghr-rc3'),api=docs.get('openapi.json');
const studio=await createStudio({python}),server=http.createServer(studio.handle);
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/api/v1`,samples=[];
try{
 for(const [route,canonical] of [['/workspaces','/workspaces'],['/workspaces/rc3-local/instructions','/workspaces/{id}/instructions'],['/workspaces/rc3-local/instructions/OBS-REFERENCE-STATE-001','/workspaces/{id}/instructions/{item_id}'],['/workspaces/rc3-local/capabilities','/workspaces/{id}/capabilities'],['/workspaces/rc3-local/capabilities/matrix','/workspaces/{id}/capabilities/matrix']]){
  const response=await fetch(base+route,{headers:{'X-Studio-Token':studio.session.token}});
  if(response.status!==200)throw Error('Unexpected HTTP '+response.status);
  let schema=api.paths[canonical].get.responses['200'].content['application/json'].schema.$ref;
  if(schema.startsWith('#/'))schema=schema.slice(2).split('/').reduce((v,k)=>v[k],api).$ref;
  samples.push({route,status:response.status,schema,value:await response.json()});
 }
 for(const [route,headers] of [['/workspaces/rc3-local/instructions?language=ar',{'X-Studio-Token':studio.session.token}],['/workspaces',{}]]){
  const response=await fetch(base+route,{headers});samples.push({route,status:response.status,schema:'transport.schema.json#/$defs/ErrorEnvelope',value:await response.json()});
 }
 const definitions={};for(const [name]of docs)if(name.endsWith('.schema.json'))Object.assign(definitions,bundleSchema(docs,name).$defs);
 const script=`import sys,json\nsys.path.insert(0,sys.argv[1])\nfrom jsonschema import Draft202012Validator\np=json.load(sys.stdin)\nresults=[]\nfor sample in p['samples']:\n name,_,frag=sample['schema'].partition('#')\n schema={'$defs':p['definitions'],'$ref':'#/$defs/'+name+frag}\n errors=[{'path':list(e.absolute_path),'message':e.message} for e in Draft202012Validator(schema).iter_errors(sample['value'])]\n results.append({'route':sample['route'],'status':sample['status'],'schema':sample['schema'],'errors':errors})\nprint(json.dumps({'results':results,'passed':all(not r['errors'] for r in results)}))\n`;
 const r=spawnSync(python,['-I','-B','-S','-X','utf8','-c',script,path.resolve(path.dirname(python),'../Lib/site-packages')],{input:JSON.stringify({definitions,samples}),encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true});
 if(r.status!==0)throw Error(r.stderr);
 const result=JSON.parse(r.stdout);console.log(JSON.stringify({result,samples},null,2));if(!result.passed)process.exitCode=1;
}finally{await new Promise(r=>server.close(r));studio.close();}
