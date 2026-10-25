import {useState} from 'react';
import {Badge,useText} from '../phase0/common.jsx';

export default function ReviewPanel({cp,session,busy,prepare,artifact}){
 const t=useText(),[reason,setReason]=useState(''),[ack,setAck]=useState(false);
 const role=session.server_resolved_role,stage=cp.generation?.stage;
 const needsAck=['compress','compact'].includes(stage),hasSlot=cp.required_approvals.includes(role);
 const decision=type=>prepare('approve',{role,decision:type,reason,...(ack&&needsAck?{acknowledgements:[{stage,reason}]}:{})});
 return <section className="draft-review" data-testid="review-panel">
  <h3>{t('البوابات والفرق','Gates and diff')}</h3>
  <div className="draft-actions"><button disabled={busy} data-testid="doctor-draft" onClick={()=>prepare('doctor')}>{t('فحص البوابات الفعلي','Run gate doctor')}</button><button disabled={busy} data-testid="preview-patch" onClick={()=>prepare('preview')}>{t('عرض فرق Patch','Preview patch diff')}</button></div>
  {cp.preview&&<pre dir="ltr" data-testid="patch-diff">{cp.preview.diff}</pre>}
  <h3>{t('الموافقات المرتبطة بالبصمة','Version-bound approvals')}</h3>
  <p>{t('الفحص والتوليد لا يمنحان موافقة. كل خانة تحتاج هوية موثقة، وتغيير المقترح يبطل القرارات السابقة.','Checks and generation do not grant approval. Each slot needs an authenticated identity; proposal changes invalidate earlier decisions.')}</p>
  <ul>{cp.required_approvals.map(r=><li key={r}><bdi>{r}</bdi> · <Badge code={cp.approvals.some(a=>a.role===r&&a.decision==='approve')?'approved':'pending'}/></li>)}</ul>
  {cp.approvals.map(a=><p key={a.id}><bdi>{a.approver} · {a.role} · {a.decision}</bdi><code className="draft-hash">{a.approved_version_hash}</code></p>)}
  <label htmlFor="approval-reason">{t('سبب القرار','Decision reason')}</label><textarea id="approval-reason" data-testid="approval-reason" value={reason} disabled={busy} onChange={e=>setReason(e.target.value)} rows={3}/>
  {needsAck&&<label><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} disabled={busy}/>{t('راجعت الاختزال وبقاء التزامات P0؛ compact يتطلب استرجاعًا متاحًا وإقرار مالك الحوكمة.','I reviewed compression and P0 preservation; compact requires available lookup and governance-owner acknowledgement.')}</label>}
  <div className="draft-actions"><button data-testid="approve-package" disabled={busy||!hasSlot||!reason.trim()||cp.status!=='in_review'} onClick={()=>decision('approve')}>{t('إعداد موافقة فعلية','Prepare actual approval')}</button><button data-testid="reject-package" disabled={busy||!hasSlot||!reason.trim()||cp.status!=='in_review'} onClick={()=>decision('reject')}>{t('إعداد رفض','Prepare rejection')}</button></div>
  <h3>{t('تصدير Patch فقط','Patch-only export')}</h3>
  <p>{t('التصدير المعتمد يتطلب جميع الفحوص والمراجعين. ملف المراجعة غير المعتمد يظل موسومًا بذلك ولا يغلق T19. لا تطبيق على المصدر أو دمج.','Approved export requires all checks and reviewers. An unapproved review patch retains its label and does not close T19. No source apply or merge.')}</p>
  <div className="draft-actions"><button data-testid="export-patch" disabled={busy||cp.status!=='approved'} onClick={()=>prepare('export',{format:'patch'})}>{t('إعداد تصدير Patch معتمد','Prepare approved patch export')}</button><button data-testid="draft-patch" disabled={busy} onClick={()=>prepare('draft-patch',{format:'patch'})}>{t('إعداد ملف مراجعة غير معتمد','Prepare unapproved review patch')}</button></div>
  {artifact&&<div role="status" data-testid="patch-artifact"><Badge code={artifact.draft_only?'NOT_APPROVED':'exported'}/><p>{t('ملف Patch محفوظ في مساحة Draft:','Patch saved in Draft storage:')}</p><code className="draft-hash">{artifact.artifact.path}</code><code className="draft-hash">{artifact.artifact.content_hash}</code></div>}
 </section>;
}
