#!/usr/bin/env python3
"""Deterministic source-span coverage and completion-gate METADATA validator.

This tool cannot determine semantic correctness, true independent reviewer
identity, genuine authorization, or enforce tools in an agent runtime.
--template reads source and prints a proposed blank trace to stdout.
--check compares original source units with trace and checks G1/G2/G5 rules.
No network, no file writes; Python 3.10+ stdlib.
Exit 0: all defined structural checks pass, 2: unmet conditions, 3: inconclusive.
"""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from pathlib import Path

MAX_REQUEST_BYTES=2_000_000
REQUIREMENTS={'MUST','MUST_NOT','SHOULD','MAY'}
RISK_LEVELS={'R0','R1','R2','R3'}
INDEPENDENCE={'L0':0,'L1':1,'L2':2,'L3':3}
MIN_INDEPENDENCE={'R0':0,'R1':1,'R2':2,'R3':3}
VERIFY={'PASSED','FAILED','NOT_RUN','INCONCLUSIVE'}
FINAL_STATES={'IMPLEMENTED','NOT_IMPLEMENTED','BLOCKED','CONFLICTED','UNKNOWN','NOT_APPLICABLE'}


def source_from_file(path):
    raw=Path(path).read_bytes()
    if len(raw)>MAX_REQUEST_BYTES:raise ValueError('request_too_large')
    text=raw.decode('utf-8-sig')
    return text,hashlib.sha256(raw).hexdigest()


def segment_source(text):
    """Partition nonempty lines on common terminal punctuation where safe.

    Every source character in a nonblank line belongs to one span except
    whitespace separators; semantics, clauses joined by commas/conjunctions,
    headings, code blocks and citations still need human review.  Offsets are
    Unicode codepoints; original byte SHA256 is always included.
    """
    units=[];offset=0
    separators=re.compile(r'(?<=[؟!؛。])\s+|(?<=\.)\s+(?=[^0-9])|(?<=;)\s+')
    for line_no,line in enumerate(text.splitlines(keepends=True),1):
        content=line.rstrip('\r\n')
        if content.strip():
            cut_positions=[0]+[m.end() for m in separators.finditer(content)]+[len(content)]
            # A punctuation+whitespace boundary belongs to neither unit; each
            # non-whitespace phrase still receives an exact source offset.
            for a,b in zip(cut_positions,cut_positions[1:]):
                fragment=content[a:b]
                if not fragment.strip():continue
                start=offset+a+len(fragment)-len(fragment.lstrip())
                end=offset+b-(len(fragment)-len(fragment.rstrip()))
                snippet=text[start:end]
                likely_compound=('؛' in snippet or ';' in snippet or '،' in snippet or
                                 len(re.findall(r'\b(?:and|or|but)\b',snippet,re.I))>0)
                units.append({'unit_id':f'SRC-{len(units)+1:04d}', 'line':line_no,
                              'start':start,'end':end,
                              'sha256':hashlib.sha256(snippet.encode('utf-8')).hexdigest(),
                              'compound_review_hint':bool(likely_compound)})
        offset+=len(line)
    return units

def blank_template(text, source_hash):
    units=segment_source(text)
    return {
        'schema_version':'rcca-1.2','source_sha256':source_hash,
        'method':'line_and_terminal_punctuation_spans_require_human_clause_review',
        'risk_tier':'UNKNOWN',
        'authorization':{'status':'UNKNOWN','source_ref':None},
        'conflicts':[],
        'source_units':[{**u,'disposition':'UNCLASSIFIED',
                         'requirement_ids':[],'non_binding_reason':None} for u in units],
        'requirements':[],
        'review':{'independence':'L0','review_evidence_ref':None,
                  'independent_approval_verified':False},
        'notes':['Fill every source unit with REQUIREMENTS or NON_BINDING plus reason.',
                 'Split compound lines into multiple atomic requirement IDs when necessary.',
                 'Any identity, approval or evidence reference is a claim until independently verified.']
    }


def validate(text, source_hash, trace, stage):
    issues=[];warnings=[]
    units=segment_source(text)
    if not isinstance(trace,dict) or trace.get('schema_version')!='rcca-1.2':
        return ['schema_version_invalid'],[]
    if trace.get('source_sha256')!=source_hash:issues.append('original_source_hash_mismatch')
    stated=trace.get('source_units',[])
    if not isinstance(stated,list):return issues+['source_units_invalid'],[]
    actual={u['unit_id']:u for u in units}
    seen=set();linked={u['unit_id']:set() for u in units}
    for u in stated:
        if not isinstance(u,dict):issues.append('source_unit_not_object');continue
        ident=u.get('unit_id')
        if ident in seen:issues.append(f'duplicate_source_unit:{ident}')
        seen.add(ident)
        reference=actual.get(ident)
        if reference is None:issues.append(f'unknown_source_unit:{ident}');continue
        if any(u.get(k)!=reference[k] for k in ('line','start','end','sha256')):
            issues.append(f'source_unit_span_changed:{ident}')
        disposition=u.get('disposition')
        if disposition=='NON_BINDING':
            if not isinstance(u.get('non_binding_reason'),str) or len(u['non_binding_reason'].strip())<10:
                issues.append(f'non_binding_without_reason:{ident}')
            if u.get('requirement_ids'):issues.append(f'non_binding_link_conflict:{ident}')
        elif disposition=='REQUIREMENTS':
            ids=u.get('requirement_ids')
            if not isinstance(ids,list) or not ids:issues.append(f'unmapped_source_unit:{ident}')
            else:linked[ident].update(ids)
        else:issues.append(f'unclassified_source_unit:{ident}')
        if reference['compound_review_hint']:
            warnings.append(f'compound_clause_manual_review:{ident}')
    for ident in sorted(set(actual)-seen):issues.append(f'missing_source_unit:{ident}')
    reqs=trace.get('requirements',[])
    if not isinstance(reqs,list) or not reqs:
        issues.append('no_atomic_requirements');reqs=[]
    by_id={}
    for r in reqs:
        if not isinstance(r,dict):issues.append('requirement_not_object');continue
        rid=r.get('id')
        if not isinstance(rid,str) or not re.fullmatch(r'REQ-[A-Za-z0-9_-]+',rid):
            issues.append('invalid_requirement_id');continue
        if rid in by_id:issues.append(f'duplicate_requirement_id:{rid}')
        by_id[rid]=r
        normative=r.get('normative')
        if normative not in REQUIREMENTS:issues.append(f'invalid_normative_level:{rid}')
        su=r.get('source_unit_ids')
        if not isinstance(su,list) or not su:
            issues.append(f'requirement_no_source_link:{rid}');su=[]
        for uid in su:
            if uid not in linked or rid not in linked.get(uid,set()):
                issues.append(f'requirement_source_not_reciprocal:{rid}:{uid}')
        for uid,ids in linked.items():
            if rid in ids and uid not in su:issues.append(f'source_requirement_not_reciprocal:{uid}:{rid}')
        if normative in ('MUST','MUST_NOT'):
            a=r.get('acceptance',{})
            if not isinstance(a,dict) or not all(isinstance(a.get(k),str) and len(a[k].strip())>=5
                                                  for k in ('test_id','oracle')):
                issues.append(f'REQUIREMENT_DEFECT_unverifiable:{rid}')
        if stage=='G5':
            if r.get('applicability') not in ('APPLICABLE','NOT_APPLICABLE'):
                issues.append(f'applicability_unknown:{rid}')
            if normative in ('MUST','MUST_NOT'):
                if r.get('applicability')=='NOT_APPLICABLE':
                    ex=r.get('exception',{})
                    if not isinstance(ex,dict) or not ex.get('approved') or not ex.get('authority_reference'):
                        issues.append(f'not_applicable_without_authority:{rid}')
                    continue
                if r.get('implementation_state')!='IMPLEMENTED':
                    issues.append(f'mandatory_implementation_not_verified:{rid}')
                v=r.get('verification',{})
                if not isinstance(v,dict) or v.get('status')!='PASSED' or not v.get('evidence_ref'):
                    issues.append(f'mandatory_verification_missing:{rid}')
            if normative=='SHOULD' and r.get('applicability')=='APPLICABLE':
                v=r.get('verification',{})
                if not isinstance(v,dict) or v.get('status')!='PASSED':
                    if not isinstance(r.get('deviation_reason'),str) or len(r['deviation_reason'].strip())<10:
                        issues.append(f'should_deviation_unrecorded:{rid}')
                    else:warnings.append(f'SHOULD_DEVIATION_DOCUMENTED:{rid}')
    for uid,ids in linked.items():
        for rid in ids:
            if rid not in by_id:issues.append(f'source_links_missing_requirement:{uid}:{rid}')
    if stage in ('G2','G5'):
        auth=trace.get('authorization') or {}
        if auth.get('status')!='VERIFIED' or not auth.get('source_ref'):
            issues.append('authorization_not_verified_by_project_source')
        conflicts=trace.get('conflicts',[])
        if not isinstance(conflicts,list):issues.append('conflicts_invalid')
        elif any(not isinstance(x,dict) or x.get('status')!='RESOLVED' for x in conflicts):
            issues.append('unresolved_authority_conflict')
    if stage=='G5':
        risk=trace.get('risk_tier','UNKNOWN')
        review=trace.get('review',{})
        if risk not in RISK_LEVELS:issues.append('risk_tier_unknown')
        elif not isinstance(review,dict) or INDEPENDENCE.get(review.get('independence'),-1)<MIN_INDEPENDENCE[risk]:
            issues.append('review_independence_below_risk_floor')
        if not isinstance(review,dict) or not review.get('review_evidence_ref'):
            issues.append('independent_review_evidence_reference_missing')
    return sorted(set(issues)),sorted(set(warnings))


def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--request',required=True)
    group=p.add_mutually_exclusive_group(required=True)
    group.add_argument('--template',action='store_true')
    group.add_argument('--check',help='existing trace JSON path')
    p.add_argument('--stage',choices=('G1','G2','G5'),default='G1')
    args=p.parse_args(argv)
    result={'tool':'RCCA_TRACE','status':'INCONCLUSIVE','actual_enforcement_verified':False,
            'independent_approval_verified':False,'schema_checks_are_not_semantic_proof':True}
    code=3
    try:
        text,sha=source_from_file(args.request)
        if args.template:
            result=blank_template(text,sha);code=0
        else:
            trace=json.loads(Path(args.check).read_text(encoding='utf-8'))
            issues,warnings=validate(text,sha,trace,args.stage)
            result.update({'gate':args.stage,'source_sha256':sha,'source_units':len(segment_source(text)),
                           'requirements':len(trace.get('requirements',[])),
                           'issues':issues,'warnings':warnings,
                           'status':'SCHEMA_CHECK_FAILED' if issues else 'SCHEMA_CHECK_PASSED',
                           'gate_caveat':'Tool output must be externally enforced by runner; evidence references and reviewer identity are not authenticated.'})
            code=2 if issues else 0
    except (OSError,UnicodeError,ValueError,TypeError,json.JSONDecodeError) as e:
        result['reason']=type(e).__name__ if not isinstance(e,ValueError) else str(e)[:140]
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return code

if __name__=='__main__':sys.exit(main())
