import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useI18n} from '../../i18n/I18nProvider.jsx';
import {Badge,Empty,useText} from './common.jsx';
import {instructionRows} from './read-view.js';
import InstructionsRegistry from '../instructions/InstructionsRegistry.jsx';
import InstructionDetail from '../instructions/InstructionDetail.jsx';
import Capabilities from '../capabilities/Capabilities.jsx';
import ProfilesScope from '../profiles/ProfilesScope.jsx';
import {PlannedScreen,StudioNavigation} from './StudioNavigation.jsx';

export default function PhaseZero(){
 const {locale,setLocale}=useI18n(),t=useText(),token=useRef('');
 const [credential,setCredential]=useState(''),[status,setStatus]=useState('idle'),[error,setError]=useState('');
 const [workspace,setWorkspace]=useState(null),[core,setCore]=useState([]),[review,setReview]=useState([]),[summary,setSummary]=useState(null);
 const [source,setSource]=useState('core'),[route,setRoute]=useState(location.hash||'#/registry');
 const api=useCallback(async route=>{const response=await fetch('/api/v1'+route,{headers:{'X-Studio-Token':token.current},cache:'no-store'});const body=await response.json();if(!response.ok)throw Error(body.meta?.error?.code||String(response.status));return body;},[]);
 const navigate=next=>{location.hash=next;setRoute(next);};
 useEffect(()=>{const update=()=>setRoute(location.hash||'#/registry');window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 useEffect(()=>{Array.from(document.querySelectorAll('main h2')).find(el=>el.getClientRects().length)?.focus();},[route]);
 const connect=async event=>{event.preventDefault();setStatus('loading');setError('');token.current=credential;setCredential('');try{
  await api('/session');const ws=(await api('/workspaces')).data[0];setWorkspace(ws);
  const all=[];let cursor;do{const r=await api('/workspaces/'+ws.id+'/instructions?limit=500'+(cursor?'&cursor='+cursor:''));all.push(...r.data);cursor=r.meta.next_cursor;}while(cursor);
  setCore(all);
  const [items,sample]=await Promise.all([api('/review-sample/items'),api('/review-sample')]);setReview(items.data);setSummary(sample.data);setStatus('connected');
 }catch(e){token.current='';setStatus('error');setError(e.message);}};
 const rows=useMemo(()=>instructionRows(core,review,source),[core,review,source]);
 const parts=route.slice(2).split('/'),screen=parts[0];let selected;try{selected=parts[1]?rows.find(r=>r.id===decodeURIComponent(parts[1])):null;}catch{selected=null;}
 const base=workspace?'/workspaces/'+workspace.id:'';
 return <div className="p0-shell"><a className="p0-skip" href="#studio-main" onClick={e=>{e.preventDefault();document.getElementById('studio-main')?.focus();}}>{t('انتقل إلى المحتوى','Skip to content')}</a>
 <header className="p0-header"><div><span className="p0-kicker">AGHR · GOVERNANCE STUDIO</span><h1>{t('مساحة الحوكمة','Governance workspace')}</h1><p>{t('القراءة أولاً. مصدر كل قرار ظاهر.','Read first. Every decision keeps its source.')}</p></div><label>{t('لغة الواجهة','Interface language')} <select aria-label={t('لغة الواجهة','Interface language')} data-testid="locale" value={locale} onChange={e=>setLocale(e.target.value)}><option value="ar">العربية</option><option value="en">English</option></select></label></header>
 <div className="p0-banner"><Badge code="READ_ONLY">{t('قراءة فقط','Read only')}</Badge> {t('المصادر ثابتة؛ الجلسة والفهرس في الذاكرة. لا حفظ أو توليد أو تصدير.','Sources stay unchanged; session and index are in memory. No save, generation or export.')}</div>
 {status!=='connected'?<main id="studio-main" className="p0-login"><h2>{t('جلسة محلية مؤقتة','Temporary local session')}</h2><p>{t('أدخل رمز الخادم المحلي. يبقى الرمز في ذاكرة الصفحة فقط.','Enter the local server credential. It stays in page memory only.')}</p><form onSubmit={connect}><label htmlFor="p0-token">{t('رمز الجلسة','Session credential')}</label><input id="p0-token" type="password" autoComplete="off" value={credential} onChange={e=>setCredential(e.target.value)} required/><button disabled={status==='loading'}>{status==='loading'?t('جارٍ الاتصال…','Connecting…'):t('فتح مساحة القراءة','Open read workspace')}</button></form>{error&&<p role="alert">{t('تعذر فتح الجلسة','Could not open session')} · <bdi>{error}</bdi></p>}</main>:<>
 <section className="p0-summary" aria-label={t('ملخص المصادر','Source summary')}><div><span>{t('مصدر المحرك','Engine source')}</span><strong>{workspace.name}</strong><code>{workspace.package_version}</code></div><div><span>{t('البنود / عينة العرض','Items / display sample')}</span><strong dir="ltr">{core.length} / {summary.units}</strong></div><div><span>{t('ثقة الناشر','Publisher trust')}</span><strong>UNKNOWN</strong><small>{t('البصمة ليست توقيعًا','A digest is not a signature')}</small></div><div><span>{t('تأهيل المضيف','Host qualification')}</span><strong>NOT_RUN</strong></div></section>
 <div className="p0-layout"><StudioNavigation screen={screen} navigate={navigate}/>
 <main id="studio-main" tabIndex="-1" className="p0-content"><div className="p0-source-picker"><label>{t('مجموعة المصدر','Source collection')} <select data-testid="source" value={source} onChange={e=>{setSource(e.target.value);navigate('#/'+(['capabilities','skills'].includes(screen)?'capabilities':'registry'));}}><option value="core">{t('مصدر rc.3 المتحقق منه','Validated rc.3 source')}</option><option value="sample">{t('عينة T11a: خمسون وحدة بانتظار المراجعة','T11a sample: 50 units pending review')}</option></select></label>{source==='sample'&&<p className="p0-hint">{t('هذه نتيجة اختيار العينة وعرضها. المراجعة ومقاييسها لم تُنفّذ؛ لا اعتماد أو استيراد.','These are sample selection and presentation results. Review and its metrics have not run; no adoption or import.')}</p>}</div>
 <div hidden={screen!=='registry'}><InstructionsRegistry key={source} rows={rows} source={source} api={api} base={base} onOpen={r=>navigate('#/instructions/'+encodeURIComponent(r.id))}/></div>{screen==='instructions'&&(selected?<InstructionDetail row={selected} source={source} api={api} base={base} onBack={()=>navigate('#/registry')}/>:<Empty>{parts[1]?<Badge code="UNKNOWN_ID"/>:null}{t('اختر بندًا من مجموعة المصدر لعرض تفاصيله.','Choose an item from the source collection to inspect its details.')}<button onClick={()=>navigate('#/registry')}>{t('فتح السجل','Open registry')}</button></Empty>)}
 {(screen==='capabilities'||screen==='skills')&&<Capabilities key={source} api={api} base={base} source={source} skillId={screen==='skills'?parts[1]:null} onOpen={id=>navigate('#/skills/'+encodeURIComponent(id))} onBack={()=>navigate('#/capabilities')}/>}
 {screen==='profiles'&&<ProfilesScope api={api}/>}
 {screen==='meta'&&<section><h2>{t('حوكمة الحوكمة','Meta-Governance')}</h2><Empty>{t('مسار عرض فقط: السياسات / المخططات / الأدوات ← حزمة تغيير ← مراجعة ← موافقة. التنفيذ مؤجل.','Routing stub only: policies / schemas / tools → change package → review → approval. Implementation deferred.')}</Empty></section>}
 {!['registry','instructions','capabilities','skills','profiles','meta'].includes(screen)&&<PlannedScreen screen={screen}/>}
 </main></div><footer className="p0-footer">{t('بروتوكول CLI 3 · جداول SQLite الاثنا عشر في الذاكرة · فحوص E4 مؤجلة','CLI protocol 3 · 12 SQLite tables in memory · E4 checks deferred')} · REQUIRED / NOT_RUN / NOT_WAIVED</footer></>}
 </div>;
}
