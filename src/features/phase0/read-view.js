// Presentation only: missing fields remain null; this is not an rc.3 validator.
export function instructionRows(core,review,source){
 if(source==='core')return core.map(v=>({id:v.item?.id||v.source_path,title:v.item?.title,value:v.item||{},source_path:v.source_path,source_hash:v.source_hash,raw:v.source_yaml,status:v.validation_status,translation_unavailable:v.translation_unavailable,due:v.is_review_due,priority:v.priority_tier,diagnostics:v.diagnostics,relations:null,record_type:null}));
 return review.map(r=>({id:r.id,title:r.title,value:r.migration.draft||{},source_path:r.source.path,source_hash:'sha256:'+r.source.sha256,raw:r.original_text,status:r.review.status,translation_unavailable:true,due:null,priority:null,diagnostics:r.migration.missing_details,relations:r.related_rule_ids,record_type:r.record_type,review:r}));
}
export const field=(row,key)=>key==='id'?row.id:key==='title'?row.title:key==='priority'?row.priority:key==='due'?row.due:key==='source_path'?row.source_path:key.split('.').reduce((v,k)=>v?.[k],row.value);
export const columns=['id','kind','force','severity','priority','authority.level','authority.owner','authority.status','impact.band','impact.evidence','nextReview','source_path'];
export function filterRows(rows,filters){return rows.filter(r=>Object.entries(filters).every(([key,v])=>!v||(key==='q'?(r.id+' '+r.title+' '+r.raw).toLocaleLowerCase().includes(v.toLocaleLowerCase()):v==='__missing'?field(r,key)==null:String(field(r,key))===v)));}
