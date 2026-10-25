import {useState} from 'react';
import {Badge,useText} from '../phase0/common.jsx';
export default function CiBundle({api,base}){
 const t=useText(),[id,setId]=useState(''),[intent,setIntent]=useState(null),[grant,setGrant]=useState(null),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const work=async fn=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const prepare=e=>{e.preventDefault();work(async()=>{setGrant(null);setResult(null);setIntent(await api(base+'/ci-intents','POST',{task_id:id}));});};
 const check=()=>work(async()=>{const r=await api('/draft-intents/'+intent.id);setGrant(r.status==='GRANTED'?r.grant:null);});
 const run=()=>work(async()=>{setResult(await api(base+'/ci-bundle','POST',{task_id:id},{'X-Write-Grant':grant,'If-Match':JSON.stringify(intent.scope.proposal_version_hash)}));setIntent(null);setGrant(null);});
 const download=f=>{const bytes=Uint8Array.from(atob(f.base64),x=>x.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download=f.path.split('/').at(-1);a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <section data-testid="ci-bundle"><h3>{t('تجهيز الأدلة للمراجعة وCI','Prepare evidence for PR and CI')}</h3><p>{t('يحفظ الأصل والبصمة ونتيجة المحرك. تنزيل محلي فقط؛ لا ينشئ PR ولا ينشر الحالة. CI الموثوق وحده ينشر بعد الدمج.','Retains original bytes, hash and engine report. Local download only; creates no PR and publishes no state. Only authenticated CI publishes after merge.')}</p>
 <form className="draft-form" onSubmit={prepare}><label htmlFor="ci-task">{t('معرف دليل المهمة المسجل','Registered evidence task ID')}</label><input id="ci-task" required value={id} onChange={e=>{setId(e.target.value);setIntent(null);setGrant(null);setResult(null);}}/><button data-testid="ci-prepare" disabled={busy}>{t('إعداد التفويض','Prepare authorization')}</button></form>
 {intent&&<div className="draft-intent"><pre dir="ltr">approve {intent.id}</pre><button data-testid="ci-auth" disabled={busy} onClick={check}>{t('التحقق من التفويض','Check authorization')}</button><button data-testid="ci-run" disabled={busy||!grant} onClick={run}>{t('تجهيز المرفقات','Prepare attachments')}</button></div>}
 {result&&<div data-testid="ci-bundle-result"><Badge code={result.status}/><ul>{result.files.map(f=><li key={f.path}><code className="draft-hash">{f.path} · {f.content_hash}</code><button onClick={()=>download(f)}>{t('تنزيل الأصل','Download bytes')}</button></li>)}</ul><p>{t('أرفق الملفين في PR بنفس المسارين أعلاه. التأهيل الأصلي لم يُنفذ.','Attach both files in the PR at the paths above. Native qualification remains NOT_RUN.')}</p></div>}
 {busy&&<p role="status">{t('جارٍ التجهيز…','Preparing…')}</p>}{error&&<p role="alert">{error}</p>}</section>;
}
