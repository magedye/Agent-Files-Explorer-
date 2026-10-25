import {useEffect,useState} from 'react';
import {useI18n} from '../../i18n/I18nProvider.jsx';
export function useText(){const {locale}=useI18n();return (ar,en)=>locale==='ar'?ar:en;}
export function Empty({children}){return <div className="p0-empty" role="status">{children}</div>;}
export function Value({value}){const t=useText();return <span dir="auto">{value==null?t('غير مسجّل','Not recorded'):typeof value==='object'?JSON.stringify(value):String(value)}</span>;}
export function Badge({code,children,tone='neutral'}){return <span className={'p0-badge '+tone}><bdi>{code}</bdi>{children&&<span> · {children}</span>}</span>;}
export function useRead(api,route){
 const [state,set]=useState({data:null,loading:true,error:null});
 useEffect(()=>{let active=true;set({data:null,loading:true,error:null});api(route).then(r=>{if(active)set({data:r.data,loading:false,error:null});}).catch(error=>{if(active)set({data:null,loading:false,error:error.message});});return()=>{active=false;};},[api,route]);
 return state;
}
export function ReadState({state,children}){const t=useText();if(state.loading)return <p role="status" aria-busy="true">{t('جارٍ قراءة المصدر…','Reading source…')}</p>;if(state.error)return <p role="alert">{t('تعذرت القراءة','Read unavailable')} <bdi>{state.error}</bdi></p>;return children(state.data);}
