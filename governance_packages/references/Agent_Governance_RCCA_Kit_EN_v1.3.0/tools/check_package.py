"""Read-only integrity and internal-contract checks; hashes are not signatures."""
from __future__ import annotations
import ast
import hashlib
import json
from pathlib import Path
import re
import sys
sys.dont_write_bytecode = True
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from agdl.io import loads
from agdl.rules import lint

def verify(require_manifest=True):
    issues=[]; checks={}
    files=[p for p in ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts]
    if any(p.is_symlink() for p in ROOT.rglob('*')): issues.append('package_symlink_present')
    for p in files:
        if p.suffix=='.py':
            try: ast.parse(p.read_text(encoding='utf-8'),filename=str(p.relative_to(ROOT)))
            except (SyntaxError,UnicodeError) as e: issues.append('python_syntax:'+str(p.relative_to(ROOT))+':'+str(e))
        if p.suffix=='.json':
            try: loads(p.read_bytes())
            except ValueError as e: issues.append('json:'+str(p.relative_to(ROOT))+':'+str(e))
    checks['python_files']=sum(p.suffix=='.py' for p in files)
    checks['json_files']=sum(p.suffix=='.json' for p in files)
    register=loads((ROOT/'sources/SOURCE_REGISTER.json').read_bytes())
    known_sources={s['id'] for s in register['sources']+register['local_sources']}
    cases=loads((ROOT/'evaluations/BEHAVIORAL_CASES.json').read_bytes())
    known_cases={s['id'] for s in cases['cases']}
    catalog=loads((ROOT/'policies/RULES.json').read_bytes())
    issues.extend('rules:'+x for x in lint(catalog))
    for r in catalog['rules']:
        for source in r['source_ids']:
            if source not in known_sources: issues.append('unknown_rule_source:'+r['id']+':'+source)
        for ref in r['test_refs']:
            if ref.startswith('BEH-'):
                if ref not in known_cases: issues.append('missing_behavioral_case:'+ref)
            else:
                try:
                    filename,member=ref.split('::',1);cls,method=member.split('.',1)
                    tree=ast.parse((ROOT/filename).read_text())
                    exists=any(isinstance(n,ast.ClassDef) and n.name==cls and any(isinstance(f,ast.FunctionDef) and f.name==method for f in n.body) for n in tree.body)
                    if not exists: issues.append('test_reference_not_found:'+ref)
                except (ValueError,OSError,SyntaxError): issues.append('invalid_test_reference:'+ref)
    checks['rule_records']=len(catalog['rules']);checks['behavioral_cases_designed']=len(known_cases)
    legacy=loads((ROOT/'sources/LEGACY_MANIFEST.json').read_bytes())
    for row in legacy['files']:
        p=ROOT/row['path']
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=row['sha256']:issues.append('legacy_modified:'+row['path'])
    checks['unchanged_legacy_files']=len(legacy['files'])
    # Check explicit internal references, not illustrative host filenames or shell commands.
    dirs=('agdl/','policies/','prompts/','templates/','adapters/','sources/','schemas/','tests/','examples/','evaluations/','verification/','compatibility/','tools/','docs/','../')
    for p in files:
        if p.suffix!='.md':continue
        text=p.read_text(encoding='utf-8')
        for token in re.findall(r'`([^`\n]+)`',text):
            if not token.startswith(dirs) or not re.fullmatch(r'[A-Za-z0-9_./-]+\.(?:md|json|py|txt)',token): continue
            if not (p.parent/token).is_file() and not (ROOT/token).is_file():issues.append('broken_internal_reference:'+str(p.relative_to(ROOT))+':'+token)
    checks['explicit_document_references']='CHECKED'
    manifest=ROOT/'MANIFEST.json'
    if manifest.is_file():
        m=loads(manifest.read_bytes());listed=set()
        for row in m['files']:
            name=row['path'];parts=Path(name).parts
            if Path(name).is_absolute() or '..' in parts or '\\' in name:issues.append('invalid_manifest_path:'+name);continue
            if name in listed:issues.append('duplicate_manifest_path:'+name)
            listed.add(name);p=ROOT/name
            if not p.is_file():issues.append('manifest_missing_file:'+name);continue
            raw=p.read_bytes()
            if len(raw)!=row['size'] or hashlib.sha256(raw).hexdigest()!=row['sha256']:issues.append('manifest_mismatch:'+name)
        actual={str(p.relative_to(ROOT)) for p in files if p.name not in ('MANIFEST.json','SHA256SUMS.txt')}
        for name in sorted(actual-listed):issues.append('unlisted_payload:'+name)
        for name in sorted(listed-actual):issues.append('missing_payload:'+name)
        checks['manifest_payload_files']=len(listed)
        sums=ROOT/'SHA256SUMS.txt'
        if not sums.is_file():issues.append('checksums_missing')
        else:
            parsed={}
            for line in sums.read_text().splitlines():
                try:sha,name=line.split('  ',1)
                except ValueError:issues.append('invalid_checksum_line');continue
                if name in parsed:issues.append('duplicate_checksum:'+name)
                parsed[name]=sha
            for name in listed|{'MANIFEST.json'}:
                p=ROOT/name
                if not p.is_file() or parsed.get(name)!=hashlib.sha256(p.read_bytes()).hexdigest():issues.append('checksum_mismatch:'+name)
            if set(parsed)!=(listed|{'MANIFEST.json'}):issues.append('checksum_inventory_mismatch')
    elif require_manifest:issues.append('manifest_missing')
    return {'verdict':'PASSED' if not issues else 'FAILED','scope':'OFFLINE_PACKAGE_INTEGRITY_AND_INTERNAL_REFERENCES',
            'checks':checks,'issues':sorted(set(issues)),'signature_authenticated':False,'runtime_enforced':False,'owner_approval':'NOT_EVALUATED'}

if __name__=='__main__':
    report=verify();print(json.dumps(report,indent=2));raise SystemExit(0 if report['verdict']=='PASSED' else 2)
