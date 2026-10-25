"""Derive review metrics. No source or application mutations; no migration."""
from collections import Counter
from itertools import combinations
import hashlib
import json
from pathlib import Path
import statistics
import time

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
if (OUT / 'METRICS.json').exists():
    raise FileExistsError('Measured metrics already exist. Preserve them; use a separately versioned review for any repeat.')

def load(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def save(name, value): (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def stats(v):
    return {'n': len(v), 'min_seconds': min(v) if v else None, 'median_seconds': statistics.median(v) if v else None, 'max_seconds': max(v) if v else None, 'sum_seconds': sum(v)}

s = load(OUT / 'SESSION.json')
manifest = load(ROOT / 'docs/evidence/studio-phase1-2026-10-23/SAMPLE_MANIFEST.json')
register = load(ROOT / manifest['register']['path'])
by_id = {r['id']: r for r in register['items']}
assert len(s['decisions']) == 50 and [d['id'] for d in s['decisions']] == manifest['ids']
transport = {t['committed_id']: t for t in load(OUT / 'COORDINATOR_TRANSPORT.json')}
item_schema = load(ROOT / 'docs/contracts/aghr-rc3/item.schema.json')
cap_schema = load(ROOT / 'docs/contracts/aghr-rc3/capability.schema.json')
evidence_schema = load(ROOT / 'docs/contracts/aghr-rc3/evidence.schema.json')

review=[]
for n, original in enumerate(s['decisions']):
    started=time.perf_counter()
    d=dict(original)
    r=by_id[d['id']]
    sha=hashlib.sha256((ROOT / r['source']['path']).read_bytes()).hexdigest()
    assert sha==r['source']['sha256']
    gaps=[]
    if d['source_record_type'] in ('CORE_RULE','SKILL','STANDARD_RECOMMENDATION'):
        gaps=['severity','scope','impact.evidence']
        force=r.get('declared_force')
        if force in ('SHOULD','SHOULD_NOT','MUST','MUST_NOT'):gaps+=['authority.owner','rationale']
        if force in ('MUST','MUST_NOT'):gaps+=['authority.level']
        if force=='MUST':
            gaps += ['authority.'+key for key in item_schema['$defs']['mandatoryAuthority']['properties']['authority']['required']]
            gaps += ['verification']
        if not force:gaps+=['force']
        if d['source_record_type']=='SKILL':
            gaps+=cap_schema['$defs']['Fields']['required']+['skillQualification']
        d['canonical_gap_notes']='Target rc.3 completeness only. Known identity/text can be mapped mechanically; no unknown authority, force, impact evidence or host qualification filled. All target CAPABILITY kinds require a qualification record structurally; NOT_RUN is not qualification success.'
        d['conditional_gaps']='MUST_NOT high/critical additionally requires full authority/verification/evalFixtures/enforcement mergeEffect+gate+technical or required human approval; severity is unknown, so branch remains unresolved.' if force=='MUST_NOT' else None
    elif d['source_record_type']=='PROFILE':
        d['canonical_gap_notes']='Profile crosswalk is an owner/configuration decision, not missing MUST authority.level.'
    d['confirmed_target_gaps']=sorted(set(gaps))
    d['target_kind_status']='PROPOSED_NOT_ADOPTED' if d['proposed_kind'] else 'NOT_A_NEW_STANDALONE_GOVERNANCE_ITEM'
    # Per-unit measured automated verification, not reconstructed agent/human effort.
    d['supplementary_verification_seconds']=time.perf_counter()-started
    d['review_seconds']=d['read_seconds']+d['classify_seconds']+d['verification_seconds']+d['rework_seconds']+d['supplementary_verification_seconds']
    next_read=s['decisions'][n+1]['read_seconds'] if n+1<50 else 0
    d['tool_wait_seconds']=max(0,transport[d['id']]['elapsed_seconds']-d['verification_seconds']-next_read)
    d['cycle_seconds']=d['review_seconds']+d['tool_wait_seconds']
    review.append(d)

# Pair verdicts below are authored semantic judgments after reviewing all 50.
# Screening is not a duplicate oracle; shared JSON keys/copy do not prove equivalence.
lexical=load(OUT/'LEXICAL_CANDIDATES.json')['pairs']
skills={d['id']:d for d in review if d['source_record_type']=='SKILL'}
roles={
 'SKILL-agent-tool-security':'فحص ثقة وصلاحيات الأدوات',
 'SKILL-architecture-options':'مفاضلة البدائل المعمارية',
 'SKILL-governed-learning':'استخراج الدروس وتصنيف التحسين',
 'SKILL-incremental-change':'تنفيذ تغيير وكتابة مفوضة',
 'SKILL-plan-drift-review':'قياس الانحراف والتقدم مقابل الخط الأساس',
}
pairs={}
def pair(a,b,reason,kind='NOT_EQUIVALENT_AS_WHOLE_UNITS',screen='AUTHOR_THEMATIC_REVIEW'):
    key=tuple(sorted((a,b)))
    assert a in manifest['ids'] and b in manifest['ids'] and a!=b
    pairs[key]={'a':key[0],'b':key[1],'screen':screen,'verdict':kind,'reason_ar':reason,'evidence_a':by_id[a]['source'],'evidence_b':by_id[b]['source']}
for p in lexical:
    a,b=p['a'],p['b']
    if a in skills and b in skills:
        reason='اشتراك قالب السجل/مقدمة المهارة لا يلغي اختلاف الوظيفة: '+roles[a]+' مقابل '+roles[b]+'. قرئت ملفات SKILL.md المثبتة؛ لا تطابق وظيفي كامل.'
    elif a.startswith('ADAPTER'):
        reason='موائم PROVIDER مقابل HOST، مع مصادر ومسؤوليات مختلفة. نفس المورد لا يجعل المحورين قدرة واحدة.'
    elif a=='SCHEMA-EVIDENCE':
        reason='مخطط يعرّف نوع البيانات مقابل قالب مثيل NOT_RUN يطبّق الشكل؛ علاقة contract/template وليست وحدتين متطابقتين.'
    else:
        reason='قاعدة/هوية تغطية مختلفة ومجموعة سيناريوهات مختلفة. درجة lexical=1 أسقطت الأرقام؛ لا تثبت تطابق AGHR-001 وAGHR-002.'
    pair(a,b,reason,screen='LEXICAL_JACCARD_AT_LEAST_0_28')
    pairs[tuple(sorted((a,b)))]['lexical_jaccard']=p['lexical_jaccard']
thematic=[
 ('AGHR-001','AGHR-047','أولوية مصدر تقني مقابل صلاحية انطباق معايير وحدود ادعاء الامتثال.'),
 ('AGHR-005','AGHR-041','تعارض مراجع منطبقة مقابل غموض قصد/متطلبات/تفويض؛ اشتراك الاستمرار المستقل تداخل جزئي.'),
 ('AGHR-005','AGHR-010','فحص مصدر/نسخة/إحلال عند تعارض مقابل حدود الاستمرار والتوقف العامة.'),
 ('AGHR-010','AGHR-041','حدود التنفيذ المستمر مقابل إجراء إيضاح قرار مؤثر؛ لا تتطابق شروط التشغيل.'),
 ('AGHR-011','AGHR-041','تخطيط متناسب يحيل إلى إجراء الإيضاح، ولا يعيد تعريفه بكامل شروطه.'),
 ('AGHR-006','AGHR-007','اقتصاد حجم السياق مقابل حفظ الثقة والتفويض والأسرار أثناء تحويله.'),
 ('AGHR-008','REC-01-03','تغيير النموذج يتداخل جزئيًا، لكن أحدهما يضيف هوية المضيف والرجوع والآخر فهرس المعرفة؛ القوة والنطاق غير محسومين.'),
 ('AGHR-010','DOC-00d5abd26dfa9dfa','فقرة حلقة تشغيل مركبة تحتوي استقصاءً وتحققًا وإعادة محاولة إضافة إلى الاستمرار؛ لا تطابق كامل للوحدة.'),
 ('AGHR-011','DOC-00d5abd26dfa9dfa','التخطيط جزء من فقرة متعددة المراحل؛ لا يصح حذف الفقرة كلها كتكرار قاعدة التخطيط.'),
 ('SKILL-incremental-change','DOC-00d5abd26dfa9dfa','المهارة تضيف مدخلات ومخرجات وصلاحيات واختبار قبول؛ الفقرة تلخص حلقة تشغيل عامة.'),
 ('SKILL-governed-learning','SKILL-plan-drift-review','التعلم القابل لإعادة الاستخدام والتغيير الحاكم مقابل قياس الانحراف الحالي؛ القالب المشترك لا يلغي الاختلاف.'),
 ('AGHR-041','DOC-009861be9c35d311','شرط تفعيل مهارة جزء تابع، لا القاعدة الكاملة للتحري والإيضاح والافتراضات واستمرار العمل.'),
 ('AGHR-001','ENF-AGHR-001','التزام تقني مقابل بيان حدود التغطية وعدم التأهيل؛ علاقة rule/coverage.'),
 ('AGHR-002','ENF-AGHR-002','مبدأ سلطة مقابل خريطة تغطية وسيناريوهات غير منفذة؛ لا تكرار سياسة.'),
 ('HOST-Antigravity','META-067600fc4a27','حالة مضيف مفرد مقابل رأس حالة إصدار بعد استبعاد hosts صراحة؛ إسقاطان مختلفان من نفس الملف.'),
 ('AGHR-006','SOURCE-AN-01','قاعدة مشروع ذات SHOULD مقابل مرجع ببليوغرافي وملخص هندسي؛ المصدر ليس بندًا حاكمًا بديلًا.'),
 ('DELIVERY-BE-01','DELIVERY-BE-02','غموض لا يحسمه المصدر مقابل حقيقة متاحة في مصدر مصرح؛ شروط وسلوك متوقع مختلفان.'),
]
for a,b,reason in thematic:pair(a,b,reason,kind='PARTIAL_OVERLAP_NOT_FULL_DUPLICATE' if a.startswith('AGHR') and b.startswith(('AGHR','REC','DOC')) else 'NOT_EQUIVALENT_AS_WHOLE_UNITS')
focus=['حدود النظام والأطراف','أدلة انتقال المراحل','تغيير المزود/النموذج/فهرس المعرفة','المراقبة والتدخل حسب الضرر','تقاعد المكون والاحتفاظ وإلغاء الوصول']
for (i,a),(j,b) in combinations(list(enumerate(['REC-01-01','REC-01-02','REC-01-03','REC-01-04','REC-01-05'])),2):
    pair(a,b,'نفس بطاقة المعيار، لكن '+focus[i]+' تختلف عن '+focus[j]+'. لا تساوي وحدة الموضوع تطابق الالتزام.')
assert all(p['verdict']!='CONFIRMED_DUPLICATE' for p in pairs.values())
semantic={'population':50,'screened_unordered_pairs':1225,'lexical_candidates':len(lexical),'reviewed_candidate_pairs':len(pairs),'pairs':list(pairs.values()),'confirmed_groups':[],'confirmed_duplicate_units':0,'redundant_units':0,'confirmed_unit_rate':0.0,'confirmed_redundancy_rate':0.0,'limits':'Full-unit confirmed equivalence only, observed in this sample. Partial overlap/structural Merge is separate. No semantic recall proof; not proof of zero duplication in all 1608. No automatic deletion.'}
save('SEMANTIC_REVIEW.json',semantic)
save('REVIEW_DECISIONS.json',{'status':'REVIEW_COMPLETE_PENDING_OWNER_ACCEPTANCE','governing_effect':'NONE','items':review})

by_type={}
total=Counter(r['record_type'] for r in register['items'])
for category,n in manifest['counts'].items():
    selected=[d for d in review if d['source_record_type']==category]
    st=stats([d['review_seconds'] for d in selected])
    remaining=total[category]-n
    by_type[category]={'sample_count':n,'population_count':total[category],'remaining_count':remaining,'timing':st,'difficulty':dict(Counter(d['difficulty'] for d in selected)), 'resolved':sum(d['review_status']=='RESOLVED' for d in selected),'unresolved':sum(d['review_status']=='UNRESOLVED' for d in selected),'forecast_agent_seconds':{'low':remaining*st['min_seconds'],'median_scenario':remaining*st['median_seconds'],'high':remaining*st['max_seconds']}}
forecast={k:sum(t['forecast_agent_seconds'][k] for t in by_type.values()) for k in ('low','median_scenario','high')}
metrics={
 'sample':{'units':50,'categories':15,'selection':'FROZEN_PURPOSIVE_STRATIFIED, not random','population':1608,'remaining':1558},
 'dispositions':dict(Counter(d['disposition'] or 'UNRESOLVED' for d in review)),
 'types':{'governing_complete_for_rc3':0,'non_governing_or_dependent_support':24,'unresolved_target_items_or_config':26,'explicit_normative_legacy_rules':15,'normative_force_distribution':dict(Counter(by_id[d['id']]['declared_force'] for d in review if d['source_record_type']=='CORE_RULE')),'note':'Unresolved is not counted as metadata. Of 26: 15 legacy normative rules, 5 capabilities, 5 proposed standards guidelines, 1 profile crosswalk. Source intent is distinct from rc.3 import readiness.'},
 'ambiguity':{'owner_required_units':26,'denominator':50,'rate':26/50,'groups':{'A_rule_authority':15,'B_capabilities':5,'C_standards_applicability':5,'D_profile_crosswalk':1},'human_decisions_received_in_this_pass':0},
 'semantic_duplicates':{k:v for k,v in semantic.items() if k!='pairs'},
 'time':{'review':stats([d['review_seconds'] for d in review]),'tool_wait':stats([d['tool_wait_seconds'] for d in review]),'cycle':stats([d['cycle_seconds'] for d in review]),'components':{key:stats([d[key] for d in review]) for key in ['read_seconds','classify_seconds','verification_seconds','rework_seconds','supplementary_verification_seconds']},'by_source_category':by_type,'clock_method':s['clock_method'],'limitations':['Observed agent decision-turn wall time, not model CPU or human work hours. Reading/analysis/turn scheduling and related progress communication within the decision turn cannot be separated further.','Tool wait is measured separately; initial orientation, pair-comparison/report work and unmeasured setup are not distributed over units. No reconstructed or evenly allocated durations.','Rework=0 in the original single-pass unit journal; subsequent shared contract audit is disclosed separately, with per-unit mechanical verification measured.','No timer values exist for earlier extraction or future owner decisions; these remain null.']},
 'extraction':{'principal_routes':dict(Counter(d['route'] for d in review)),'structured_source_records':sum(d['structured_extraction'] for d in review),'contextual_text_units':sum(not d['structured_extraction'] for d in review),'agent_reviewed_units':50,'human_review_performed_units':0,'owner_decision_required_units':26,'actual_automated_migrations':0,'actual_manual_migrations':0,'source_writes':0,'difficulty':dict(Counter(d['difficulty'] for d in review))},
 'reestimate':{'remaining_units':1558,'observed_agent_review_scenarios_seconds':forecast,'owner_resolution_seconds':None,'real_migration_seconds':None,'minimum_batches_at_50':32,'category_separated_batches_at_50':sum((v['remaining_count']+49)//50 for v in by_type.values()),'batch_constraint':'At most 50 units/about 5 source files/focused session; smaller for high ambiguity. No T11b IDs/manifests/decisions created.','assumptions':['Same agent, same evidence/source access and review method; apply per-category sample timings, never mean(50)*1558.','Sample is purposive and tiny in some strata; no statistical confidence interval. Scenario bounds are observed min/max scaling, not guaranteed completion bounds.','Owner-required decisions and host qualification have unknown waits/cost; total completion duration remains unbounded/unestimated.']},
 'acceptance':'PENDING_OWNER_ACCEPTANCE; T11b NOT_STARTED_BLOCKED_BY_OWNER_GATE; reference 1.2.0 untouched; E4 seven checks REQUIRED/NOT_RUN/NOT_WAIVED',
}
save('METRICS.json',metrics)
print(json.dumps({'dispositions':metrics['dispositions'],'routes':metrics['extraction']['principal_routes'],'review_time':metrics['time']['review'],'semantic_candidate_pairs':len(pairs),'forecast_hours':{k:v/3600 for k,v in forecast.items()}},ensure_ascii=False))
