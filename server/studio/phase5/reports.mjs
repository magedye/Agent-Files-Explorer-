import crypto from 'node:crypto';
const hash=s=>'sha256:'+crypto.createHash('sha256').update(s).digest('hex');
const cell=s=>String(s??'NOT_RUN').replaceAll('|','\\|').replaceAll('\r',' ').replaceAll('\n',' ');
export function exportReport(type,format,source){
 if(!['compliance','changes','skills','metrics','audit'].includes(type)||!['json','md','sarif','csv'].includes(format)||(format==='sarif'&&type!=='compliance')||(format==='csv'&&type!=='metrics'))throw Error('REPORT_FORMAT_UNSUPPORTED');
 const entries=type==='compliance'?source.items:type==='changes'?source.changes:type==='skills'?source.capabilities:type==='audit'?source.audit:source.metrics;
 const payload={profile:'phase5-local.1',type,project:source.project,candidate_hash:source.candidate_hash,generated_at:new Date().toISOString(),status:'DRAFT_REPORT_ONLY',entries,evidence:source.evidence,limitations:source.limitations};
 let content,mime;
 if(format==='json'){content=JSON.stringify(payload,null,2);mime='application/json';}
 if(format==='md'){content='# AGHR '+type+'\n\nDRAFT_REPORT_ONLY\n\nProject: '+cell(source.project)+'\n\nCandidate: '+cell(source.candidate_hash)+'\n\n'+(Array.isArray(entries)?'| ID | Status | Source |\n| --- | --- | --- |\n'+entries.map(e=>'| '+cell(e.id??e.skill_id)+' | '+cell(e.status??e.authority?.status)+' | '+cell(e.source_path??e.source_hash??e.event_type)+' |').join('\n'):'```json\n'+JSON.stringify(entries,null,2)+'\n```')+'\n\n## Full records\n\n~~~json\n'+JSON.stringify(entries,null,2)+'\n~~~\n\n## Evidence and limits\n\n```json\n'+JSON.stringify({evidence:source.evidence,limitations:source.limitations},null,2)+'\n```\n';mime='text/markdown';}
 if(format==='csv'){content='metric,value,status,numerator,denominator,project,candidate\r\n'+Object.entries(entries.metrics).map(([k,v])=>[k,v.value,v.status,v.numerator,v.denominator,source.project,source.candidate_hash].map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n');mime='text/csv';}
 if(format==='sarif'){
  const results=entries.filter(e=>e.status!=='PASS').map(e=>({ruleId:e.id,level:e.status==='FAIL'?'error':'warning',message:{text:e.status+': '+(e.reason||'Required verification is unavailable.')},...(e.source_path?{locations:[{physicalLocation:{artifactLocation:{uri:e.source_path.replaceAll('\\','/'),uriBaseId:'%SRCROOT%'}}}]}:{}),properties:{source_hash:e.source_hash,status:e.status,evidence:e.evidence}}));
  content=JSON.stringify({version:'2.1.0',$schema:'https://json.schemastore.org/sarif-2.1.0.json',runs:[{tool:{driver:{name:'AGHR Governance Studio',version:'phase5-local.1',informationUri:'https://github.com/magedye/Agent-Files-Explorer-'}},results,properties:payload}]},null,2);mime='application/sarif+json';
 }
 return {name:'aghr-'+type+'.'+format,format,mime,content,sha256:hash(content),source_written:false,state_written:false};
}
