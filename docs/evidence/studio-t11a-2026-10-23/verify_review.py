"""Independent recomputation of artifact counts/times and original-source custody."""
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import re
import statistics
import subprocess
from collections import Counter
from jsonschema import Draft202012Validator

OUT=Path(__file__).resolve().parent; ROOT=OUT.parents[2]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
checks=[]
def check(name,condition):
    if not condition:raise AssertionError(name)
    checks.append({'check':name,'status':'PASS'})

pre=read(OUT/'PREFLIGHT.json'); manifest_path=ROOT/'docs/evidence/studio-phase1-2026-10-23/SAMPLE_MANIFEST.json'
manifest=read(manifest_path);reg_path=ROOT/manifest['register']['path'];register=read(reg_path);byid={r['id']:r for r in register['items']}
d=read(OUT/'REVIEW_DECISIONS.json')['items'];m=read(OUT/'METRICS.json');session=read(OUT/'SESSION.json')
check('Exact frozen sample identities and order, 50 unique, 15 categories',len(d)==50 and len({r['id'] for r in d})==50 and [r['id'] for r in d]==manifest['ids'] and len(Counter(r['source_record_type'] for r in d))==15)
check('Original 1608 register and frozen manifest hashes unchanged',sha(reg_path)==manifest['register']['sha256']==pre['sources'][str(reg_path.relative_to(ROOT)).replace('\\','/')]['sha256'] and sha(manifest_path)==pre['sources'][str(manifest_path.relative_to(ROOT)).replace('\\','/')]['sha256'])
check('Source register has no accepted/imported decisions',len(register['items'])==1608 and all(r['review']['status']=='PENDING_REVIEW' for r in register['items']))
check('Exactly 24 dispositions and 26 unresolved; source effect NONE',Counter(r['disposition'] or 'UNRESOLVED' for r in d)==Counter({'Adopt':14,'Merge':4,'Defer':5,'Reject':1,'UNRESOLVED':26}) and all(r['governing_effect']=='NONE' for r in d))
check('Each unresolved unit has owner question and gaps, no invented adoption',all((r['disposition'] is None and r['owner_question'] and r['missing_fields']) if r['review_status']=='UNRESOLVED' else (r['disposition'] in ('Adopt','Merge','Defer','Reject') and r['owner_question'] is None) for r in d))
check('13 binding legacy rules missing authority.level explicitly blocked; SHOULD not forced level',sum(r['source_record_type']=='CORE_RULE' and 'authority.level' in r['confirmed_target_gaps'] for r in d)==13 and all('authority.level' not in r['confirmed_target_gaps'] for r in d if r['source_record_type']=='CORE_RULE' and byid[r['id']]['declared_force']=='SHOULD'))
check('impact.evidence and CAPABILITY qualification contract gaps not filled',all('impact.evidence' in r['confirmed_target_gaps'] for r in d if r['source_record_type'] in ('CORE_RULE','SKILL','STANDARD_RECOMMENDATION')) and all('skillQualification' in r['confirmed_target_gaps'] for r in d if r['source_record_type']=='SKILL'))

pin=read(OUT/'SOURCE_PIN.json')
for p,v in pin.items():check('Read source bytes unchanged: '+p,sha(ROOT/p)==v['sha256'])
for r in d:
    s=r['source'];text=(ROOT/s['path']).read_text(encoding='utf-8')
    check('Unit original text retained: '+r['id'],r['original_text']==byid[r['id']]['original_text'])
    if s.get('json_pointer'):
        value=json.loads(text)
        for bit in s['json_pointer'].strip('/').split('/'):
            key=bit.replace('~1','/').replace('~0','~');value=value[int(key)] if isinstance(value,list) else value[key]
        check('JSON pointer value: '+r['id'],value==byid[r['id']]['original_payload'])
    elif s.get('line_start'):
        lines=text.splitlines();selected='\n'.join(lines[s['line_start']-1:s['line_end']])
        check('Original line location: '+r['id'],selected.replace('\r','').strip()==r['original_text'].replace('\r','').strip())
    elif s.get('selection'):
        value=json.loads(text)
        value={k:v for k,v in value.items() if k not in s['selection']['excluded_top_level_keys']}
        check('Explicit JSON projection, not whole-file duplicate: '+r['id'],value==byid[r['id']]['original_payload'])
    else:check('Whole JSON source: '+r['id'],json.loads(text)==byid[r['id']]['original_payload'])

events=[json.loads(line) for line in (OUT/'REVIEW_EVENTS.jsonl').read_text(encoding='utf-8').splitlines()]
check('50 append-only measured decision events',len(events)==50 and [e['id'] for e in events]==manifest['ids'])
check('Per-unit decision clocks are real intervals',all(r['classify_seconds']==(r['review_clock_end_ms']-r['review_clock_start_ms'])/1000 and r['classify_seconds']>0 for r in d))
check('Every measured component finite and nonnegative',all(math.isfinite(r[k]) and r[k]>=0 for r in d for k in ('read_seconds','classify_seconds','verification_seconds','rework_seconds','supplementary_verification_seconds','tool_wait_seconds')))
check('No artificial rework or migration/human activity inferred',all(r['rework_seconds']==0 and r['migration_performed'] is False and r['human_review_performed'] is False for r in d))
for k,field in [('review','review_seconds'),('tool_wait','tool_wait_seconds'),('cycle','cycle_seconds')]:
    v=[r[field] for r in d];s=m['time'][k]
    check('Recomputed '+k+' min/median/max/sum',s['n']==50 and abs(s['min_seconds']-min(v))<1e-9 and abs(s['median_seconds']-statistics.median(v))<1e-9 and abs(s['max_seconds']-max(v))<1e-9 and abs(s['sum_seconds']-sum(v))<1e-8)
for name,s in m['time']['by_source_category'].items():
    v=[r['review_seconds'] for r in d if r['source_record_type']==name]
    check('Recomputed category time '+name,s['timing']['n']==len(v) and s['timing']['min_seconds']==min(v) and s['timing']['median_seconds']==statistics.median(v) and s['timing']['max_seconds']==max(v))
check('Extraction routes and remaining population reconcile',sum(m['extraction']['principal_routes'].values())==50 and m['extraction']['structured_source_records']==37 and m['extraction']['contextual_text_units']==13 and sum(s['remaining_count'] for s in m['time']['by_source_category'].values())==1558)
check('Owner-needed rate is 26/50, not fields or only governing denominator',m['ambiguity']['owner_required_units']==26 and m['ambiguity']['denominator']==50 and m['ambiguity']['rate']==0.52)

csv_bytes=(OUT/'T11A_REVIEW.csv').read_bytes();rows=list(csv.reader(io.StringIO(csv_bytes.decode('utf-8-sig'),newline='')))
check('CSV Excel UTF-8 BOM, 50 records/24 fields',csv_bytes.startswith(b'\xef\xbb\xbf') and len(rows)==51 and all(len(r)==24 for r in rows))
for values,r in zip(rows[1:],d):
    check('CSV decision/source/time exact '+r['id'],values[1]==r['id'] and values[4]==r['review_status'] and values[5]==(r['disposition'] or 'UNRESOLVED') and values[6]==r['reason_ar'] and values[10]==(r['owner_question'] or '') and values[20]==r['source']['path'] and values[22]==r['source']['sha256'] and abs(float(values[14])-r['review_seconds'])<1e-8 and values[23]==r['original_text'])

sem=read(OUT/'SEMANTIC_REVIEW.json');lex=read(OUT/'LEXICAL_CANDIDATES.json');pairs={tuple(sorted((p['a'],p['b']))) for p in sem['pairs']}
check('All lexical candidates have explicit semantic verdict/reason',all(tuple(sorted((p['a'],p['b']))) in pairs for p in lex['pairs']) and all(p['reason_ar'] and p['evidence_a'] and p['evidence_b'] for p in sem['pairs']))
check('39 compared candidate pairs; no fabricated groups or whole-library uniqueness',len(pairs)==len(sem['pairs'])==sem['reviewed_candidate_pairs']==39 and sem['confirmed_groups']==[] and sem['confirmed_duplicate_units']==0 and sem['screened_unordered_pairs']==50*49//2)
check('Structural Merge has owner/container basis, not automatic dedup',sum(r['disposition']=='Merge' for r in d)==4 and all(r['merge_targets'] and r['semantic_basis'] for r in d if r['disposition']=='Merge'))
schema=byid['SCHEMA-EVIDENCE']['original_payload'];template=byid['TEMPLATE-EVIDENCE']['original_payload'];Draft202012Validator.check_schema(schema);Draft202012Validator(schema).validate(template)
check('Legacy schema/template structural relationship, NOT_RUN not execution',template['result']=='NOT_RUN' and template['candidate_sha256']=='0'*64 and template['tests_executed']==0)

legacy=read(ROOT/'docs/evidence/studio-phase1-2026-10-23/CUSTODY.lock.json');changed=[]
for name,value in legacy['files'].items():
    if sha(ROOT/name)!=value['sha256']:
        check('Only status/navigation/task docs changed with exact raw before: '+name,name in pre['before'] and sha(OUT/'before'/f'{name}.raw')==value['sha256']==pre['before'][name]['sha256'])
        changed.append(name)
check('No application/runtime/contract/governance source changed after accepted UI',set(changed)<={'docs/status/CURRENT.md','docs/status/HANDOFF.md','docs/plans/STUDIO_UPGRADE_TASKS_AR.md','docs/INDEX.md'})
check('Reference 1.2.0 working tree unchanged',subprocess.check_output(['git','status','--porcelain=v1','--','governance_packages/references/Agent_Governance_Harness_Reference_1.2.0'],cwd=ROOT).strip()==b'')
check('E4 and owner acceptance/T11b limits remain explicit',m['acceptance'].startswith('PENDING_OWNER_ACCEPTANCE; T11b NOT_STARTED') and m['reestimate']['owner_resolution_seconds'] is None and m['extraction']['actual_automated_migrations']==0)
result={'status':'PASS','checks_passed':len(checks),'checks':checks,'previous_custody':{'files':len(legacy['files']),'unchanged':len(legacy['files'])-len(changed),'changed_status_docs_with_exact_before':changed},'runtime':'UNCHANGED_ACCEPTED_PHASE1; no new browser Sentinel or native qualification claim','T11a':'REVIEW_COMPLETE_PENDING_OWNER_ACCEPTANCE','T11b':'NOT_STARTED / BLOCKED_PENDING_OWNER_ACCEPTANCE_OF_T11a','reference_1_2_0':'UNCHANGED'}
(OUT/'VERIFICATION.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PASS','checks':len(checks),'previous_unchanged':result['previous_custody']['unchanged'],'changed_docs':changed},ensure_ascii=False))
