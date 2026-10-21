#!/usr/bin/env python3
"""Validate this reference's actual files, relationships and frozen payload."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from runtime.common import ROOT, GovernanceError, KEYWORDS, load, sha, shape

REQUIRED=(
'README.md','START_HERE.md','CHARTER.md','ARCHITECTURE.md','AGENTS.md','VERSION','PACKAGE_STATUS.json',
'contracts/GOVERNANCE.md','contracts/RUNTIME.md','contracts/ENFORCEMENT.md','contracts/EVIDENCE.md',
'sources/REGISTER.json','sources/REFERENCE_POLICY.md','registry/RULES.json','registry/ENFORCEMENT_COVERAGE.json',
'profiles/PROFILES.json','profiles/LITE.md','profiles/STANDARD.md','profiles/CONTROLLED.md',
'adapters/REGISTER.json','adapters/README.md','procedures/ADOPTION.md','procedures/REQUEST_INTAKE.md',
'prompts/ADOPT.md','prompts/PROCESS_REQUEST.md','protocols/PLANNING.md','protocols/EXECUTION.md','protocols/SURGICAL_EDITING.md',
'runtime/README.md','runtime/common.py','runtime/policy.py','runtime/cli.py',
'evaluations/SCENARIOS.json','evaluations/README.md','guide/GUIDE_AR.md','guide/GUIDE_AR.html',
'compatibility/V4_INVENTORY.json','compatibility/V4_FILE_DISPOSITION.json','compatibility/V4_CONTROL_MAPPING.json',
'compatibility/V4_INHERITED_88.json','compatibility/V4_INHERITED_441.json','compatibility/V4_HISTORICAL_598.json',
'compatibility/V4_RECONCILIATION.md','design/BASELINE.json','verification/REPORT.md','verification/LIMITATIONS.md',
'tools/run_tests.py','tests/test_runtime.py','tests/test_records.py','tests/test_package.py')

def schema_audit(schema: dict, at='$') -> list[str]:
    if not isinstance(schema,dict):return [f'{at}: schema is not an object']
    errors=[]
    if set(schema)-KEYWORDS:errors.append(f'{at}: unsupported schema keywords {set(schema)-KEYWORDS}')
    for key,sub in schema.get('properties',{}).items():errors+=schema_audit(sub,at+'.'+key)
    if 'items' in schema:errors+=schema_audit(schema['items'],at+'[]')
    for n,sub in enumerate(schema.get('anyOf',[])):errors+=schema_audit(sub,f'{at}.anyOf[{n}]')
    return errors

def row_errors(rows: list[dict], key: str, count: int, label: str) -> list[str]:
    if not isinstance(rows,list) or len(rows)!=count:return [f'{label}: expected {count} records']
    ids=[r.get(key) for r in rows]
    return [] if None not in ids and len(ids)==len(set(ids)) else [f'{label}: missing/duplicate identity']

def archive_inventory(path: Path, prefix: str) -> dict:
    """Compare ZIP bytes under its declared top-level folder; never extract."""
    result={}
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            if info.is_dir():continue
            name=info.filename
            if not name.startswith(prefix):raise GovernanceError("Source ZIP member outside declared prefix")
            relative=name[len(prefix):]
            if not relative or relative.startswith('/') or any(x in ('','..','.') for x in relative.split('/')) or '\\' in relative:raise GovernanceError("Unsafe source ZIP path")
            if relative in result:raise GovernanceError("Duplicate source ZIP member")
            result[relative]={'bytes':info.file_size,'sha256':hashlib.sha256(z.read(info)).hexdigest()}
    return result

def check(root: Path, *, preflight: bool=False, source_v4: Path|None=None) -> dict:
    errors=[];checks=[]
    root=root.resolve()
    missing=[p for p in REQUIRED if not (root/p).is_file()]
    if missing:errors.append('Required files missing: '+', '.join(missing))
    paths=[]
    for p in root.rglob('*'):
        if p.is_symlink():errors.append(f'Symlink rejected: {p.relative_to(root)}')
        elif p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc':paths.append(p)
    checks.append({'id':'FILES','observed':len(paths),'required':len(REQUIRED)})
    try:
        sources=load(root/'sources/REGISTER.json')['sources'];errors+=row_errors(sources,'id',56,'Sources')
        source_ids={s['id'] for s in sources}
        for s in sources:
            if not s['url'].startswith('https://') or not s.get('supported_takeaway'):errors.append(f'Invalid source record {s["id"]}')
        rules=load(root/'registry/RULES.json')['rules'];errors+=row_errors(rules,'id',47,'Rules')
        rule_ids={r['id'] for r in rules}
        if rule_ids!={f'AGHR-{n:03d}' for n in range(1,48)}:errors.append('Rule identity set mismatch')
        for r in rules:
            if not r.get('text') or not r.get('applies_when'):errors.append(f'Empty rule {r["id"]}')
            if set(r.get('basis',[]))-source_ids-{'OWNER-FOUNDATION'}:errors.append(f'Unknown rule source {r["id"]}')
            if not (root/r['explanation_ref']).is_file():errors.append(f'Missing rule explanation {r["id"]}')
        cov=load(root/'registry/ENFORCEMENT_COVERAGE.json')['rules']
        if {r['rule_id'] for r in cov}!=rule_ids or len(cov)!=47:errors.append('Enforcement coverage is incomplete/duplicated')
        adapters=load(root/'adapters/REGISTER.json')['adapters'];errors+=row_errors(adapters,'id',12,'Adapters')
        for axis in ('PROVIDER','HOST'):
            if sum(a['axis']==axis for a in adapters)!=6:errors.append(f'Expected 6 {axis} adapters')
        for a in adapters:
            if not (root/a['path']).is_file() or set(a['source_ids'])-source_ids:errors.append(f'Invalid adapter {a["id"]}')
            if a['live_qualification']!='NOT_RUN':errors.append(f'Unexpected native qualification claim {a["id"]}')
        for name in ('PROJECT','STATE','REQUEST','EVIDENCE','RULE'):
            schema=load(root/'schemas'/f'{name}.schema.json');errors+=schema_audit(schema)
            # Use the inspected package's schema rather than relying on the running tool's root.
            from runtime.common import validate_schema
            errors+=validate_schema(load(root/'templates'/f'{name}.json'),schema,f'TEMPLATE:{name}')
        inv=load(root/'compatibility/V4_INVENTORY.json');files=inv['files'];errors+=row_errors(files,'path',73,'v4 file inventory')
        disp=load(root/'compatibility/V4_FILE_DISPOSITION.json')['rows'];errors+=row_errors(disp,'source_path',73,'v4 file dispositions')
        if {r['path']:r['sha256'] for r in files}!={r['source_path']:r['source_sha256'] for r in disp}:errors.append('Inventory and file dispositions differ')
        for r in disp:
            if not r.get('rationale') or not r.get('targets'):errors.append('Empty file disposition rationale/target')
            for t in r.get('targets',[]):
                if not (root/t).is_file():errors.append(f'Missing disposition target {t}')
        mapping=load(root/'compatibility/V4_CONTROL_MAPPING.json')['rows'];errors+=row_errors(mapping,'source_id',48,'v4 controls')
        if {r['source_id'] for r in mapping}!={f'GOV-{n:03d}' for n in range(1,49)}:errors.append('v4 control set mismatch')
        for row in mapping:
            if not row['target_ids'] or set(row['target_ids'])-rule_ids:errors.append(f'Invalid control target {row["source_id"]}')
            if hashlib.sha256(row['source_statement'].encode()).hexdigest()!=row['source_statement_sha256']:errors.append('Source statement digest mismatch')
        for name,count in [('V4_INHERITED_88',88),('V4_INHERITED_441',441),('V4_HISTORICAL_598',598)]:
            records=load(root/'compatibility'/f'{name}.json')['rows'];errors+=row_errors(records,'source_id',count,name)
            for row in records:
                if set(row.get('new_target_ids_via_v4',[]))-rule_ids:errors.append(f'Unknown inherited target {row["source_id"]}')
        baseline=load(root/'design/BASELINE.json')
        if baseline['supplementary_v4_content_read'] is not False:errors.append('Primary-design sequence record inconsistent')
        for path,expected in baseline['files'].items():
            frozen=root/'design/frozen'/path
            if not frozen.is_file() or sha(frozen)!=expected:errors.append(f'Frozen baseline changed: {path}')
        scenarios=load(root/'evaluations/SCENARIOS.json')['scenarios'];ids=[s['id'] for s in scenarios]
        if not scenarios or len(ids)!=len(set(ids)):errors.append('Empty/duplicate scenario set')
        if any(s['execution_status']!='NOT_RUN' for s in scenarios):errors.append('Native/model scenarios must not inherit local PASS')
        status=load(root/'PACKAGE_STATUS.json')
        if status.get('independent_review')!='NOT_PERFORMED' or status.get('release_acceptance')!='NOT_GRANTED':errors.append('Unsupported approval claim')
        checks.extend([{'id':'RULES','count':len(rules)},{'id':'SOURCES','count':len(sources)},{'id':'ADAPTERS','count':len(adapters)},{'id':'SUPPLEMENT','files':len(files),'controls':len(mapping)}])
    except (OSError,GovernanceError,KeyError,TypeError,ValueError) as exc:
        errors.append(f'Structural validation error: {exc}')
    try:
        from tools.check_integration import check_integration
        errors.extend(check_integration(root))
    except (OSError,GovernanceError,KeyError,TypeError,ValueError) as exc:
        errors.append(f'Integration validation error: {exc}')
    # JSON syntax across the actual delivered surface, not just selected registries.
    for path in paths:
        if path.suffix=='.json' and 'verification/results' not in str(path.relative_to(root)):
            try:load(path)
            except (OSError,GovernanceError) as exc:errors.append(f'{path.relative_to(root)}: {exc}')
    for path in paths:
        if path.suffix!='.md' or 'design/frozen' in str(path.relative_to(root)):continue
        text=path.read_text(encoding='utf-8')
        fences=sum(1 for line in text.splitlines() if line.strip().startswith('```'))
        if fences%2:errors.append(f'Unbalanced code fence: {path.relative_to(root)}')
        for target in re.findall(r'(?<!!)\[[^\]]*\]\(([^\s)]+)\)',text):
            target=target.split('#')[0]
            if not target or target.startswith(('https://','http://','mailto:')):continue
            if not (path.parent/target).resolve().exists():errors.append(f'Broken link: {path.relative_to(root)} -> {target}')
    if not preflight:
        try:
            manifest=load(root/'MANIFEST.json');expected=manifest['files']
            actual={str(p.relative_to(root)):sha(p) for p in paths if str(p.relative_to(root))!='MANIFEST.json' and not str(p.relative_to(root)).startswith('verification/results/')}
            if expected!=actual:
                changed=sorted(k for k in set(expected)|set(actual) if expected.get(k)!=actual.get(k))
                errors.append('Frozen payload mismatch: '+', '.join(changed[:30]))
            checks.append({'id':'PAYLOAD_DIGESTS','files':len(actual),'postfreeze_results_excluded':True})
        except (OSError,GovernanceError,KeyError) as exc:errors.append(f'Manifest required for final verification: {exc}')
    if source_v4 is not None:
        try:
            if sha(source_v4)!=inv['archive_sha256']:errors.append('Original v4 archive digest mismatch')
            actual=archive_inventory(source_v4,inv['archive_prefix'])
            expected={r['path']:{'bytes':r['bytes'],'sha256':r['sha256']} for r in files}
            if actual!=expected:errors.append('Actual source archive differs from recorded file inventory')
        except (OSError,GovernanceError,zipfile.BadZipFile,UnboundLocalError,KeyError) as exc:errors.append(str(exc))
    return {'status':('PREFLIGHT_PASS' if preflight else 'PASS') if not errors else 'FAIL','checks':checks,'errors':errors,'limits':['Structural/semantic/digest checks are not a live host security test.','Historical trace linkage is not independently verified semantic equivalence.','Post-freeze results are covered by the detached whole-ZIP digest, not this payload manifest.']}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--preflight',action='store_true');p.add_argument('--source-v4',type=Path)
    a=p.parse_args();result=check(a.root,preflight=a.preflight,source_v4=a.source_v4)
    print(json.dumps(result,indent=2));return 1 if result['status']=='FAIL' else 0
if __name__=='__main__':sys.exit(main())
