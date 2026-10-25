// Evidence selection for display only. This function never qualifies or executes a skill.
export function qualificationView(records,tuple){
 const keys=['skillId','host','hostVersion','scope','contentHash'];
 const exact=records.filter(r=>keys.every(k=>typeof tuple[k]==='string'&&tuple[k]!==''&&r[k]===tuple[k]));
 return {tuple,recorded_status:exact.length===1?exact[0].status:'NOT_RUN',matched:exact.length===1?exact[0]:null,historical:records.filter(r=>!exact.includes(r)),ambiguous:exact.length>1,selection_authorized:false,reason:exact.length===1?'MATCHED_RECORDED_TUPLE_ONLY':'NO_UNAMBIGUOUS_EXACT_TUPLE_EVIDENCE'};
}
