"""Operator-only draft authoring. Writes new evidence/new candidate; no app APIs."""
from pathlib import Path
from datetime import date,timedelta
import copy,hashlib,json,sys
from draft_decisions import DECISIONS,STATUS
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[2]
ENGINE=ROOT/'governance_packages/candidates/AGHR_rc3_Core_Candidate'
REGISTER=ROOT/'docs/reviews/aghr-items-2026-10-22/REVIEW_REGISTER.json'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
source=[r for r in load(REGISTER)['items'] if r['record_type']=='CORE_RULE']
basepath=ROOT/'governance_packages/references/Agent_Governance_Harness_Reference_1.2.0/registry/RULES.json'
baseline={r['id']:r for r in load(basepath)['rules']}
decisions={f'AGHR-{n:03}':(severity,risk,criterion) for n,severity,risk,criterion in DECISIONS}
mode=sys.argv[1] if len(sys.argv)>1 else '--pilot';assert mode in ('--pilot','--full')
target=OUT/'pilot' if mode=='--pilot' else ROOT/'governance_packages/candidates/AGHR_T12_Candidate'
assert not target.exists(),'Never overwrite a candidate or an earlier pilot'
target.mkdir(parents=True)
manifest=copy.deepcopy(load(ENGINE/'aghr.json'))
manifest.update(id='aghr-t12-candidate',name='AGHR T12 — 47 provisional project rule drafts',version='1.0.0-rc.3-t12.draft.1')
write(target/'aghr.json',manifest)
(target/'LICENSE').write_bytes((ENGINE/'LICENSE').read_bytes())
directive={'status':STATUS,'authorization':'Owner accepted T11b and delegated drafting of the 47 missing-field records; owner did not accept the newly drafted values or activate them.',
 'scope':'Drafting and local strict/lint runs only; no application writes, Active import, reference changes or E3/E4 execution.',
 'authority':'No host SourceGrant or enterprise authority is conferred by this data file. Provisional owner/license remain as accepted during E1.',
 'source':'Current explicit owner message, 2026-10-23','candidate_state':'DRAFT_ONLY_NOT_ADMITTED'}
write(target/'drafting/OWNER_DIRECTIVE.json',directive)
selected=source[:1] if mode=='--pilot' else source
provenance={};fixtures={};comparison=[]
def leaves(v,p=''):
 if isinstance(v,dict):
  for k,w in v.items():yield from leaves(w,p+'/'+k)
 else:yield p,v
for r in selected:
 rid=r['id'];old=r['original_payload'];severity,risk,criterion=decisions[rid]
 kind=r['migration']['proposed_kind']
 # Assurance selection describes an action sequence; no advanced POLICY-kind grant claimed.
 if rid=='AGHR-033':kind='PROCEDURE'
 item={'id':rid,'title':r['title'],'kind':kind,'force':old['force'],'severity':severity,
  'scope':{'paths':['**']},'rule':f"Applies when: {old['applies_when']}.\n{old['text']}",
  'authority':{'source':'drafting/OWNER_DIRECTIVE.json','level':'project','owner':manifest['owner'],'approvedBy':STATUS,'status':'draft','effectiveFrom':'2026-10-23'},
  'rationale':risk+' '+STATUS,
  'enforcement':{'textual':True,'failureAction':'review','mergeEffect':'advisory'},
  'verification':{'evalFixtures':[f'drafting/eval-fixtures.json#/{rid}']},
  'impact':{'band':severity,'evidence':'assumed'},
  'reviewCadence':'Owner review before activation and after material changes',
  'nextReview':str(date(2026,10,23)+timedelta(days=30 if severity=='critical' else 90)),
  'exceptions':{'allowed':old['waivable']},'references':['drafting/OWNER_DIRECTIVE.json']}
 if old['force']=='MUST_NOT':
  item['enforcement']={'textual':True,'failureAction':'block','mergeEffect':'blocking','gate':{'type':'human-approval','required':True}}
 filename=f'policies/drafts/{rid}.json';write(target/filename,item)
 fields={}
 for pointer,value in leaves(item):
  inherited=pointer in ('/id','/force')
  fields[pointer]={'value':value,'status':'SOURCE_VALUE_UNCHANGED' if inherited else STATUS,
   'basis':('Exact source value' if inherited else risk if pointer.startswith(('/severity','/impact/band','/rationale')) else 'User authorized provisional drafting; project-wide scope with the original trigger preserved in rule text; no assertion of runtime approval or measured effect.')}
 fixtures[rid]={'status':'NOT_RUN','qualification':'NOT_RUN','criterion_ar':criterion,
  'positive_case':{'input':'Observable project record satisfying the stated criterion','expected':'Criterion observed within the exact authorized scope'},
  'negative_case':{'input':'Missing or contradictory record for the criterion','expected':'Refuse success/promotion and preserve the unmet criterion'},
  'scope':'Prospective verification data, never a claimed execution or an E4 honesty run'}
 if rid=='AGHR-004':fixtures[rid]['negative_case']['input']='Imported instruction declares enterprise authority without an authorized adoption decision.'
 if rid=='AGHR-014':fixtures[rid]['negative_case']['input']='A failing assertion is removed merely to obtain a green run.'
 if rid=='AGHR-016':fixtures[rid]['negative_case']['input']='NOT_RUN or missing evidence is reported as PASS.'
 provenance[rid]={'status':STATUS,'item_path':filename,'item_sha256':digest(target/filename),'fields':fields,
  'source':r['source'],'baseline_1_2_0':{'path':basepath.relative_to(ROOT).as_posix(),'sha256':digest(basepath),'json_pointer':f"/rules/{int(rid[-3:])-1}"},
  'source_text_preserved':True,'original_condition':old['applies_when'],'proposed_scope_note':'Project-root scope; original applicability condition is retained in rule text, not claimed to be a machine-understood task classifier.',
  'authority_note':'project proposed under owner instruction; no text establishes an enterprise issuer. draft/PROVISIONAL_OWNER_REVIEW is not final approval.',
  'kind_note':'POLICY suggestion changed to PROCEDURE for the profile-selection procedure; still provisional.' if rid=='AGHR-033' else 'Existing review-register kind suggestion remains provisional.'}
 comparison.append({'id':rid,'before_1_2_0':baseline[rid],'after_rc3':item,'field_provenance':fields,'source_package_1_2_and_1_3_equal':baseline[rid]==old,'semantic_delta':'Original trigger prepended explicitly; original rule body and force retained. Classification, severity, scope and review/authority fields are proposed only.'})
write(target/'drafting/FIELD_PROVENANCE.json',{'status':STATUS,'note':'Typed schema fields retain legal enum values. Every authored leaf/array is tagged here by JSON Pointer; inherited id/force remain source values. This is not another policy registry.','items':provenance})
write(target/'drafting/eval-fixtures.json',fixtures)
write(target/'PACKAGE_STATUS.json',{'status':'DRAFT_ONLY_NOT_ADMITTED','draft_status':STATUS,'governing_items':len(selected),'admitted_ids':[],'strict_status':'NOT_RUN','promotion':'NOT_AUTHORIZED','qualification':'NOT_RUN'})
write(target/'PROVENANCE.json',{'status':STATUS,'engine_source_hash':load(ROOT/'docs/evidence/studio-e2-2026-10-22/SOURCE_PIN.json')['source_hash'],
 'schema_closure':'Existing immutable contract.1; no schema modifications','baseline_path':basepath.relative_to(ROOT).as_posix(),'baseline_sha256':digest(basepath),
 'license_status':'PROVISIONAL_OWNER_LICENSE as accepted by owner in E1; no final signature fabricated','draft_author':'Codex drafting assistant, not independent reviewer'})
write(OUT/('PILOT_BEFORE_AFTER.json' if mode=='--pilot' else 'BEFORE_AFTER.json'),{'status':STATUS,'items':comparison})
print(json.dumps({'status':'DRAFTED','mode':mode,'items':len(selected),'target':target.relative_to(ROOT).as_posix(),'authority':'project / draft; not host-attested'},ensure_ascii=False))
