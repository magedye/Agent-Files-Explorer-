import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { repository } from './aghr/cli-bridge.js';
import { StudioError } from './auth.js';
import {qualificationView} from './qualification-view.js';

const spec=JSON.parse(fs.readFileSync(path.join(repository,'docs/contracts/aghr-rc3/openapi.json'),'utf8'));
const schemas={};
for(const name of ['item','common','capability'])schemas[name+'.schema.json']=JSON.parse(fs.readFileSync(path.join(repository,`docs/contracts/aghr-rc3/${name}.schema.json`),'utf8'));
const resolve=s=>{if(!s.$ref)return s;const [file,pointer]=s.$ref.split('#/');return pointer.split('/').reduce((v,k)=>v[k],schemas[file]);};
const invalid=message=>new StudioError(400,'INVALID_REQUEST',message);
export function createReadRoutes({catalog,bridge,session,review}) {
  return async function handle(req,res) {
    const meta={request_id:crypto.randomUUID(),contract_revision:'contract.1',recorded_at:new Date().toISOString()};
    const send=(status,data,extra={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({data,meta:{...meta,...extra}}));};
    try {
      const auth=session.authenticate(req);
      if(req.method!=='GET')throw new StudioError(403,'FORBIDDEN','Studio is read-only.');
      if(Number(req.headers['content-length'])>0||req.headers['transfer-encoding'])throw invalid('Read endpoints do not accept request bodies.');
      if(req.url.length>8192)throw invalid('URL exceeds limit.');
      const url=new URL(req.url,'http://127.0.0.1');
      // Local read-profile extension; never represented as validated rc.3 ItemView.
      if(url.pathname.startsWith('/api/v1/review-sample')){
        if(!review)throw new StudioError(503,'SOURCE_UNAVAILABLE','Review projection unavailable.');
        const parts=url.pathname.slice('/api/v1/review-sample'.length).split('/').filter(Boolean);
        if(parts[0]==='skills'&&parts.length===3&&parts[2]==='qualification'){
          let key;try{key=decodeURIComponent(parts[1]);}catch{throw invalid('Malformed skill identifier.');}
          const skill=review.skills.find(s=>s.id===key);
          if(!skill)throw new StudioError(404,'UNKNOWN_ID','Unknown skill.');
          const tuple={skillId:skill.skill_id,contentHash:skill.instructions.hash};
          const allowed={host:'host',host_version:'hostVersion',scope:'scope',content_hash:'contentHash'};
          const seen=new Set();for(const [key,value]of url.searchParams){if(!allowed[key]||seen.has(key)||!value||value.length>1024||/[\x00-\x1f]/.test(value))throw invalid('Invalid tuple query.');seen.add(key);tuple[allowed[key]]=value;}
          return send(200,qualificationView(skill.qualification.records,tuple));
        }
        if(url.search)throw invalid('Review sample does not accept query parameters.');
        if(!parts.length)return send(200,review.summary);
        if(parts.length===1&&['items','skills','profiles','hosts'].includes(parts[0]))return send(200,review[parts[0]]);
        if(parts[0]==='items'&&parts.length===3&&parts[2]==='source'){
          let key;try{key=decodeURIComponent(parts[1]);}catch{throw invalid('Malformed item identifier.');}
          const source=review.source(key);if(!source)throw new StudioError(404,'UNKNOWN_ID','Unknown review unit.');
          return send(200,source);
        }
        throw new StudioError(404,'UNKNOWN_ID','Unknown review resource.');
      }
      if(url.pathname==='/api/v1/session') {
        if(url.search)throw invalid('Session query is not supported.');
        return send(200,auth);
      }
      if(url.pathname==='/api/v1/read-profile'){
        if(url.search)throw invalid('Profile query is not supported.');
        return send(200,{project:null,adopted_profile:null,state:null,selections:[],skill_decision:'NOT_ASSESSED',reason:'No target project registered. Missing selections do not imply NO_SKILL_NEEDED or permission to execute.'});
      }
      if(url.pathname==='/api/v1/read-scope'){
        const context={},seen=new Set(),allowed=['path','agent','host_version','environment','stage','task_type','language'];
        for(const [key,value]of url.searchParams){if(!allowed.includes(key)||seen.has(key)||!value||value.length>256||/[\x00-\x1f]/.test(value))throw invalid('Invalid scope context.');seen.add(key);context[key]=value;}
        const run=await bridge.run('validate',context);
        const result={engine_result:run.report.result,items:run.report.data?.validation?.items||[],findings:run.report.data?.validation?.findings||run.report.diagnostics,source_hash:run.report.source.content_hash,context,protocol_version:run.report.protocol_version,stdout:run.stdout,stderr:run.stderr,exit_code:run.exitCode,source_written:false};
        return send(run.exitCode===0?200:422,result,run.exitCode===0?{}:{error:{code:'SCOPE_ENGINE_REJECTED',message:'Scope context rejected by the governing engine.',halted:true,issues:[]}});
      }
      const snap=catalog.snapshot();
      if(url.pathname==='/api/v1/workspaces') {
        if(url.search)throw invalid('Unknown query.');
        return send(200,[snap.workspace]);
      }
      if(url.pathname===`/api/v1/workspaces/${snap.workspace.id}/projects`){if(url.search)throw invalid('Project query not supported in the local read profile.');return send(200,[],{total:0,limit:100,next_cursor:null});}
      const match=url.pathname.match(/^\/api\/v1\/workspaces\/([^/]+)\/(instructions|capabilities)(?:\/([^/]+))?(?:\/(relations|history))?$/);
      if(!match)throw new StudioError(404,'NOT_FOUND','Unknown read endpoint.');
      const [,id,type,itemId,section]=match;
      if(id!==snap.workspace.id)throw new StudioError(404,'UNKNOWN_ID','Unknown workspace.');
      if(section){
        if(url.search||type!=='instructions')throw invalid('Unsupported detail query.');
        let key;try{key=decodeURIComponent(itemId);}catch{throw invalid('Malformed item identifier.');}
        const item=snap.views.find(v=>v.item?.id===key)?.item;
        if(!item)throw new StudioError(404,'UNKNOWN_ID','Unknown item.');
        if(section==='history')return send(200,[]); // No recorded audit history; scan time is not a past verification run.
        const links=[];
        for(const [relation,targets] of [['supersedes',item.authority?.supersedes],['overrides',item.conflictPolicy?.overrides],['overridden_by',item.conflictPolicy?.overriddenBy],['references',item.references]]){
          for(const target of Array.isArray(targets)?targets:targets?[targets]:[]){if(typeof target==='string')links.push({source_id:key,target_id:target,relation,resolved:snap.views.some(v=>v.item?.id===target)});}
        }
        return send(200,links);
      }
      const known=spec.paths[`/workspaces/{id}/${type}`].get.parameters.filter(p=>p.in==='query');
      const query={};
      for(const [key,value] of url.searchParams) {
        const def=known.find(p=>p.name===key);
        if(!def||Object.hasOwn(query,key)||itemId)throw invalid('Unknown, duplicate or unsupported query.');
        const s=resolve(def.schema);
        if(value.length>4096||(s.enum&&!s.enum.includes(value))||(s.type==='boolean'&&!['true','false'].includes(value))||(s.type==='integer'&&(!/^\d+$/.test(value)||Number(value)<s.minimum||Number(value)>s.maximum))||(s.minLength&&value.length<s.minLength))throw invalid('Invalid filter value.');
        query[key]=value;
      }
      let items;
      if(type==='instructions') {
        items=catalog.list(query);
        if(query.host||query.path) {
          const context={...(query.host?{agent:query.host}:{}),...(query.path?{path:query.path}:{})};
          const run=await bridge.run('validate',context);
          if(run.report.result!=='VALID')throw new StudioError(422,'VALIDATION_FAILED','Target context could not be validated; no guessed applicability.');
          const allowed=new Set(run.report.data.validation.items.filter(i=>i.applicability.status==='APPLIES').map(i=>i.id));
          items=items.filter(v=>allowed.has(v.item?.id));
        }
      } else if(itemId==='matrix') {
        return send(200,{skills:snap.capabilities.map(v=>v.capability.skillId),hosts:[],cells:[]});
      } else {
        items=snap.capabilities.filter(v=>(!query.source||v.capability.source===query.source)&&(!query.function||v.capability.function===query.function));
        if(query.tier||query.host||query.qual_status)throw new StudioError(501,'NOT_SUPPORTED','Qualification filters await host evidence.');
      }
      if(itemId) {
        let decoded;try{decoded=decodeURIComponent(itemId);}catch{throw invalid('Malformed item identifier.');}
        const item=items.find(v=>(v.item?.id||v.item_id)===decoded);
        if(!item)throw new StudioError(404,'UNKNOWN_ID','Unknown item.');
        return send(200,item);
      }
      items.sort((a,b)=>(a.item?.id||a.item_id||a.source_path).localeCompare(b.item?.id||b.item_id||b.source_path));
      const fingerprint=crypto.createHash('sha256').update(JSON.stringify({snapshot:snap.readSetHash,type,filters:Object.entries(query).filter(([k])=>!['cursor','limit'].includes(k)).sort()})).digest('hex');
      let offset=0;
      if(query.cursor) {
        let cursor;try{cursor=JSON.parse(Buffer.from(query.cursor,'base64url').toString('utf8'));}catch{throw invalid('Invalid cursor.');}
        if(!Number.isSafeInteger(cursor.offset)||cursor.offset<0||cursor.hash!==fingerprint)throw new StudioError(409,'CONFLICT','Cursor belongs to another snapshot or filter.');
        offset=cursor.offset;
      }
      const limit=Number(query.limit||100), next=offset+limit;
      return send(200,items.slice(offset,next),{total:items.length,limit,next_cursor:next<items.length?Buffer.from(JSON.stringify({offset:next,hash:fingerprint})).toString('base64url'):null});
    } catch(error) {
      const known=error instanceof StudioError;
      return send(known?error.status:503,null,{error:{code:known?error.code:'ENGINE_UNAVAILABLE',message:known?error.message:'Pinned read engine unavailable.',halted:true,issues:[]}});
    }
  };
}
