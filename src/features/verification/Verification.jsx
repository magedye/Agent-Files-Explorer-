import {useEffect,useState} from 'react';
import {Badge,Empty,useText} from '../phase0/common.jsx';
export default function Verification({api,workspace,streaming=false}){
 const t=useText(),base='/workspaces/'+workspace+'/verify';
 const [command,setCommand]=useState('validate'),[args,setArgs]=useState('--strict'),[runs,setRuns]=useState([]),[selected,setSelected]=useState(null),[intent,setIntent]=useState(null),[grant,setGrant]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [stream,setStream]=useState({status:'NOT_RUN',frames:[]});
 useEffect(()=>{
  if(!streaming||!selected)return;let disposed=false,socket;
  setStream({status:'CONNECTING',frames:[]});
  api(base+'/runs/'+selected.id+'/stream-ticket').then(ticket=>{if(disposed)return;socket=new WebSocket(`ws://${location.host}/api/v1${base}/runs/${selected.id}/stream`,['aghr.stream.v1','ticket.'+ticket.ticket]);socket.onopen=()=>setStream(s=>({...s,status:'CONNECTED'}));socket.onmessage=e=>{try{const frame=JSON.parse(e.data);setStream(s=>({...s,frames:[...s.frames,frame]}));}catch{socket.close();}};socket.onclose=()=>{if(!disposed)setStream(s=>({...s,status:'CLOSED'}));};socket.onerror=()=>{if(!disposed)setStream(s=>({...s,status:'FAILED'}));};}).catch(e=>{if(!disposed)setStream({status:'FAILED',frames:[],reason:e.message});});
  return()=>{disposed=true;socket?.close();};
 },[streaming,selected?.id,api,base]);
 const work=async action=>{setBusy(true);setError('');try{await action();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const refresh=async()=>setRuns(await api(base+'/runs?limit=100'));
 useEffect(()=>{let active=true;api(base+'/runs?limit=100').then(r=>{if(active)setRuns(r);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[api,base]);
 useEffect(()=>{
  if(!selected||selected.status!=='running')return;
  let active=true;const timer=setInterval(()=>api(base+'/runs/'+selected.id).then(r=>{if(active){setSelected(r);if(r.status!=='running')refresh().catch(e=>setError(e.message));}}).catch(e=>{if(active)setError(e.message);}),750);
  return()=>{active=false;clearInterval(timer);};
 },[selected?.id,selected?.status,api,base]);
 const reset=()=>{setIntent(null);setGrant(null);};
 const prepare=cancel=>work(async()=>{reset();const request={command,args:args.split('\n').map(x=>x.trim()).filter(Boolean)};const body=cancel?{cancel:selected.id}:{request};setIntent({...await api('/verification-intents','POST',body),request:cancel?null:request,cancel:!!cancel});});
 const authorize=()=>work(async()=>{const r=await api('/draft-intents/'+intent.id);setGrant(r.status==='GRANTED'?r.grant:null);setIntent({...intent,status:r.status});});
 const execute=()=>work(async()=>{
  const result=await api(intent.cancel?base+'/runs/'+selected.id+'/cancel':base+'/run','POST',intent.request??undefined,{'X-Write-Grant':grant,'If-Match':JSON.stringify(intent.scope.proposal_version_hash)});
  setSelected(intent.cancel?result:await api(base+'/runs/'+result.run_id));reset();await refresh();
 });
 return <section data-testid="verification-screen"><h2>{t('تشغيل التحقق','Verification runs')}</h2><p>{t('مخرجات المحرك الفعلية، مع تحديث مباشر عبر الاستطلاع الموثق. كل تشغيل وإلغاء يحتاج تفويضًا محددًا.','Actual engine output, updated through authenticated polling. Each run and cancellation needs scoped authorization.')}</p>
 <div className="draft-grid"><section><h3>{t('تشغيل جديد','New run')}</h3><form className="draft-form" onSubmit={e=>{e.preventDefault();prepare(false);}}>
 <label htmlFor="verify-command">{t('الأمر','Command')}</label><select id="verify-command" value={command} onChange={e=>{setCommand(e.target.value);setArgs(e.target.value==='validate'?'--strict':'');reset();}}>{['validate','lint','generate','check','eval','qualify','doctor'].map(x=><option key={x}>{x}</option>)}</select>
 <label htmlFor="verify-args">{t('الوسائط: وسيط واحد في كل سطر','Arguments: one per line')}</label><textarea id="verify-args" rows={5} dir="ltr" value={args} onChange={e=>{setArgs(e.target.value);reset();}}/>
 <small>{t('generate/check/doctor: استخدم --cp=معرف. eval/qualify: --skill و--task و--criteria؛ المهارات تسجل من المشغل، ولا يختار المتصفح ملفات تنفيذ.','generate/check/doctor: use --cp=ID. eval/qualify: --skill, --task, --criteria; the operator registers skills. The browser cannot choose executable files.')}</small>
 <p>{t('حدود التشغيل: eval ‏600 ثانية، qualify ‏3600 ثانية، وبقية الأوامر 30 ثانية؛ الذاكرة 2 GiB.','Limits: eval 600 s, qualify 3600 s, other commands 30 s; memory 2 GiB.')}</p><button disabled={busy} data-testid="verify-prepare">{t('إعداد التشغيل للتفويض','Prepare run authorization')}</button></form>
 {intent&&<div className="draft-intent" role="status"><Badge code={intent.status}/><p>{t('فوّض العملية من طرفية الخادم ثم تحقق من التفويض.','Authorize the action in the server terminal, then check authorization.')}</p><pre dir="ltr">approve {intent.id}</pre><code className="draft-hash">{intent.scope.proposal_version_hash}</code><div className="draft-actions"><button onClick={authorize} disabled={busy} data-testid="verify-authorization">{t('التحقق من التفويض','Check authorization')}</button><button onClick={execute} disabled={busy||!grant} data-testid="verify-execute">{intent.cancel?t('إلغاء التشغيل المفوض','Cancel authorized run'):t('تشغيل مفوض','Run authorized command')}</button></div></div>}
 <h3>{t('سجل التشغيل','Run history')}</h3><button onClick={()=>work(refresh)} disabled={busy}>{t('تحديث','Refresh')}</button>{!runs.length?<Empty>{t('لا توجد عمليات تشغيل بعد.','No verification runs yet.')}</Empty>:<ul className="draft-list">{runs.map(r=><li key={r.id}><button onClick={()=>{reset();work(async()=>setSelected(await api(base+'/runs/'+r.id)));}}><strong><bdi>{r.command}</bdi></strong> <Badge code={r.status}/><code>{r.id}</code></button></li>)}</ul>}
 </section><section aria-live="polite" aria-atomic="false">{!selected?<Empty>{t('اختر تشغيلًا لعرض المخرجات.','Choose a run to inspect output.')}</Empty>:<article data-testid="verification-result"><h3><bdi>{selected.command}</bdi> · <Badge code={selected.status}/></h3><p>{t('رمز الخروج','Exit code')}: <bdi>{selected.exit_code??'—'}</bdi> · {t('سبب التوقف','Termination')}: <bdi>{selected.termination_reason??'—'}</bdi></p><p>{t('المدة بالمللي ثانية','Duration (ms)')}: {selected.duration_ms??'—'} · {t('ذروة الذاكرة MiB','Peak memory MiB')}: {selected.resource_peak_mib??'—'}</p>
 {selected.status==='running'&&<button data-testid="verify-cancel" disabled={busy} onClick={()=>prepare(true)}>{t('إعداد الإلغاء للتفويض','Prepare cancellation authorization')}</button>}
 <p className="p0-hint">{t('نجاح المحرك المحلي لا يؤهل Codex أو Antigravity، ولا يعتمد المقترح أو ينشره.','A local engine pass does not qualify Codex or Antigravity, approve a proposal, or publish it.')}</p>
 {selected.summary.errors.map((e,i)=><p className="p0-notice" key={i}><bdi>{e.code}: {e.message}</bdi></p>)}
 {streaming&&<section data-testid="verification-stream"><h4>{t('البث المباشر عبر WebSocket','Live WebSocket stream')}</h4><Badge code={stream.status}/><pre dir="ltr">{stream.frames.map(f=>f.text||f.status||f.type).join('\n')}</pre>{stream.reason&&<p role="alert">{stream.reason}</p>}</section>}
 <h4>stdout</h4><pre dir="ltr" data-testid="verify-stdout">{selected.raw_stdout||t('لم تصل مخرجات بعد.','No output received yet.')}</pre><h4>stderr</h4><pre dir="ltr">{selected.raw_stderr||t('لا توجد مخرجات خطأ.','No stderr output.')}</pre><details><summary>{t('البصمات والأدلة','Hashes and evidence')}</summary><pre dir="ltr">{JSON.stringify({inputs_hash:selected.inputs_hash,candidate_hash:selected.candidate_hash,config_hash:selected.config_hash,evidence:selected.evidence},null,2)}</pre></details>
 </article>}</section></div>{busy&&<p role="status">{t('جارٍ تنفيذ الطلب…','Processing…')}</p>}{error&&<p role="alert" className="p0-notice">{error}</p>}
 </section>;
}
